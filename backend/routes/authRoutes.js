// authRoutes.js
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

  const actualToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
  jwt.verify(actualToken, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Token invalide" });
    req.userId = decoded.userId;
    next();
  });
};

// Inscription
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Nom d'utilisateur ou email déjà pris" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword },
    });

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

// Profil
router.get("/profile", verifyToken, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  res.json(user);
});

// Ajouter un favori
router.post("/favorites", verifyToken, async (req, res) => {
  const { championId } = req.body;
  try {
    const favorite = await prisma.favorite.create({
      data: {
        userId: req.userId,
        championId,
      },
    });
    res.status(201).json({ message: "Favori ajouté", favorite });
  } catch (error) {
    console.error("Erreur lors de l’ajout du favori :", error);
    res.status(400).json({ error: "Erreur lors de l’ajout du favori" });
  }
});

// Supprimer un favori
router.delete("/favorites/:championId", verifyToken, async (req, res) => {
  const { championId } = req.params;
  try {
    const favorite = await prisma.favorite.findFirst({
      where: { userId: req.userId, championId },
    });
    if (!favorite) return res.status(404).json({ error: "Favori non trouvé" });

    await prisma.favorite.delete({ where: { id: favorite.id } });
    res.json({ message: "Favori supprimé" });
  } catch (error) {
    console.error("Erreur lors de la suppression du favori :", error);
    res.status(400).json({ error: "Erreur lors de la suppression du favori" });
  }
});

// Récupérer les favoris
router.get("/favorites", verifyToken, async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.userId },
      select: { championId: true },
    });
    res.json(favorites.map(fav => fav.championId)); // Renvoie un tableau d’IDs
  } catch (error) {
    console.error("Erreur lors de la récupération des favoris :", error);
    res.status(400).json({ error: "Erreur lors de la récupération des favoris" });
  }
});

// Créer un build (inchangé)
router.post("/builds", verifyToken, async (req, res) => {
  const { champion, items, runes } = req.body;
  try {
    const build = await prisma.build.create({
      data: { userId: req.userId, champion, items, runes: runes || "" },
    });
    res.status(201).json({ message: "Build créé", build });
  } catch (error) {
    console.error("Erreur lors de la création du build :", error);
    res.status(400).json({ error: "Erreur lors de la création du build" });
  }
});

// Récupérer les builds d’un champion (inchangé)
router.get("/builds", verifyToken, async (req, res) => {
  const { champion } = req.query;
  try {
    const builds = await prisma.build.findMany({
      where: { userId: req.userId, champion },
    });
    res.json(builds);
  } catch (error) {
    console.error("Erreur lors de la récupération des builds :", error);
    res.status(400).json({ error: "Erreur lors de la récupération des builds" });
  }
});

// Mettre à jour un build (inchangé)
router.put("/builds/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { items, runes } = req.body;
  try {
    const existingBuild = await prisma.build.findUnique({ where: { id } });
    if (!existingBuild) return res.status(404).json({ error: "Build non trouvé" });
    if (existingBuild.userId !== req.userId) return res.status(403).json({ error: "Permission refusée" });

    const build = await prisma.build.update({
      where: { id },
      data: { items, runes: runes || "" },
    });
    res.json({ message: "Build mis à jour", build });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du build :", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du build" });
  }
});

// Supprimer un build (inchangé)
router.delete("/builds/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const existingBuild = await prisma.build.findUnique({ where: { id } });
    if (!existingBuild) return res.status(404).json({ error: "Build non trouvé" });
    if (existingBuild.userId !== req.userId) return res.status(403).json({ error: "Permission refusée" });

    await prisma.build.delete({ where: { id } });
    res.json({ message: "Build supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du build :", error);
    res.status(500).json({ error: "Erreur lors de la suppression du build" });
  }
});

module.exports = router;