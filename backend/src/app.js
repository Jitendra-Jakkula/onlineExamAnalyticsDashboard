const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { authRoutes } = require("./routes/authRoutes");
const { examRoutes } = require("./routes/examRoutes");
const { resultRoutes } = require("./routes/resultRoutes");
const { analyticsRoutes } = require("./routes/analyticsRoutes");

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) || "*",
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.get("/api/health", (req, res) => {
    res.json({ ok: true, service: "online-exam-analytics-api" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/exams", examRoutes);
  app.use("/api/results", resultRoutes);
  app.use("/api/analytics", analyticsRoutes);

  app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.expose ? err.message : "Internal server error";
    res.status(status).json({ error: message });
  });

  return app;
}

module.exports = { createApp };
