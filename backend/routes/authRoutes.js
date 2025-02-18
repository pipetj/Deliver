const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || "secret"; // Utiliser une variable d'environnement pour plus de sécurité

// Vérification de la variable d'environnement DATABASE_URL
console.log("DATABASE_URL:", process.env.DATABASE_URL);  // Ajout d'un log pour vérifier la variable d'environnement

// Inscription
router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        console.log('Tentative d\'inscription:', { username, email });

        // Vérification si l'email ou le nom d'utilisateur existe déjà
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existingUser) {
            return res.status(400).json({ error: "Nom d'utilisateur ou email déjà pris" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Mot de passe hashé:', hashedPassword);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });

        console.log('Utilisateur créé:', user);
        res.status(201).json({ message: "Utilisateur créé", user });
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error); // Log de l'erreur
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

// Route protégée pour tester
router.get("/profile", verifyToken, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    res.json(user);
});

module.exports = router;
