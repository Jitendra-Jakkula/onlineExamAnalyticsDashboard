const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { submitExam, myResults } = require("../controllers/resultController");

const resultRoutes = express.Router();

resultRoutes.post("/submit", requireAuth, requireRole("student"), submitExam);
resultRoutes.get("/my", requireAuth, requireRole("student"), myResults);

module.exports = { resultRoutes };

