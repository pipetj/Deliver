const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || "secret";

// Middleware pour vérifier le token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ error: "Accès refusé" });

  jwt.verify(token.split(" ")[1], SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Token invalide" });
    req.userId = decoded.userId;
    next();
  });
};

// Inscription
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    console.log('Tentative d\'inscription:', { username, email });

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Nom d'utilisateur ou email déjà pris" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Mot de passe hashé:', hashedPassword);

    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword },
    });

    console.log('Utilisateur créé:', user);
    res.status(201).json({ message: "Utilisateur créé", user });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(400).json({ error: "Erreur lors de l'inscription" });
  }
});

// Connexion
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Utilisateur non trouvé" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "7d" });
    res.json({ message: "Connexion réussie", token, user });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route protégée : Profil
router.get("/profile", verifyToken, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  res.json(user);
});

// Nouvelle route : Créer un build
router.post("/builds", verifyToken, async (req, res) => {
  const { champion, items, runes } = req.body;
  try {
    const build = await prisma.build.create({
      data: {
        userId: req.userId,
        champion,
        items,
        runes: runes || "", // Par défaut vide si non fourni
      },
    });
    res.status(201).json({ message: "Build créé", build });
  } catch (error) {
    console.error("Erreur lors de la création du build :", error);
    res.status(400).json({ error: "Erreur lors de la création du build" });
  }
});

// Nouvelle route : Récupérer les builds d’un champion pour l’utilisateur
router.get("/builds", verifyToken, async (req, res) => {
  const { champion } = req.query;
  try {
    const builds = await prisma.build.findMany({
      where: {
        userId: req.userId,
        champion,
      },
    });
    res.json(builds);
  } catch (error) {
    console.error("Erreur lors de la récupération des builds :", error);
    res.status(400).json({ error: "Erreur lors de la récupération des builds" });
  }
});

// Nouvelle route : Mettre à jour un build
router.put("/builds/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { items, runes } = req.body;
  try {
    const build = await prisma.build.update({
      where: { id },
      data: {
        items,
        runes: runes || "",
      },
    });
    res.json({ message: "Build mis à jour", build });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du build :", error);
    res.status(400).json({ error: "Erreur lors de la mise à jour du build" });
  }
});

module.exports = router;