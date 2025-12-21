const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  adminOverview,
  adminExamAnalytics,
  adminPerformanceTrend,
  studentOverview
} = require("../controllers/analyticsController");

const analyticsRoutes = express.Router();

analyticsRoutes.get("/admin/overview", requireAuth, requireRole("admin"), adminOverview);
analyticsRoutes.get("/admin/exams/:examId", requireAuth, requireRole("admin"), adminExamAnalytics);
analyticsRoutes.get("/admin/trend", requireAuth, requireRole("admin"), adminPerformanceTrend);

analyticsRoutes.get("/student/overview", requireAuth, requireRole("student"), studentOverview);

module.exports = { analyticsRoutes };

