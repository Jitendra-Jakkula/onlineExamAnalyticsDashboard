const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  createExam,
  listAllExams,
  getExamAdmin,
  updateExam,
  deleteExam,
  addQuestion,
  publishExam,
  listPublishedExams,
  getExamForTaking,
  listAttemptsForExam
} = require("../controllers/examController");

const examRoutes = express.Router();

examRoutes.get("/published", requireAuth, listPublishedExams);
examRoutes.get("/:examId/take", requireAuth, getExamForTaking);

examRoutes.post("/", requireAuth, requireRole("admin"), createExam);
examRoutes.get("/", requireAuth, requireRole("admin"), listAllExams);
examRoutes.get("/:examId", requireAuth, requireRole("admin"), getExamAdmin);
examRoutes.patch("/:examId", requireAuth, requireRole("admin"), updateExam);
examRoutes.delete("/:examId", requireAuth, requireRole("admin"), deleteExam);
examRoutes.post("/:examId/questions", requireAuth, requireRole("admin"), addQuestion);
examRoutes.patch("/:examId/publish", requireAuth, requireRole("admin"), publishExam);
examRoutes.get("/:examId/attempts", requireAuth, requireRole("admin"), listAttemptsForExam);

module.exports = { examRoutes };

