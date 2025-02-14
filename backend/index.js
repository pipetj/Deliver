require('dotenv').config({ path: '../.env' }); // Assure que dotenv charge le fichier .env
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.listen(3000, () => console.log("Serveur lancé sur http://localhost:3000"));
