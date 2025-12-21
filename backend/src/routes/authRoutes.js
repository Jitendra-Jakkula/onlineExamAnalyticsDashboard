const express = require("express");
const { register, login, me } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const authRoutes = express.Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/me", requireAuth, me);

module.exports = { authRoutes };

