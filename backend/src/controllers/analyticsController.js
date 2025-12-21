const mongoose = require("mongoose");
const Exam = require("../models/Exam");
const Result = require("../models/Result");

function passThreshold(totalMarks) {
  return Math.ceil((Number(totalMarks || 0) * 40) / 100);
}

async function adminOverview(req, res) {
  const exams = await Exam.find().select("title subject totalMarks isPublished createdAt").sort({ createdAt: -1 });

  const statsByExam = await Result.aggregate([
    {
      $group: {
        _id: "$examId",
        attempted: { $sum: 1 },
        avgScore: { $avg: "$score" }
      }
    }
  ]);

  const statsMap = new Map(statsByExam.map((s) => [String(s._id), s]));

  res.json({
    exams: exams.map((e) => {
      const s = statsMap.get(String(e._id));
      return {
        id: e._id,
        title: e.title,
        subject: e.subject,
        totalMarks: e.totalMarks,
        isPublished: e.isPublished,
        attempted: s?.attempted || 0,
        avgScore: s?.avgScore ? Math.round(s.avgScore * 100) / 100 : 0
      };
    })
  });
}

async function adminExamAnalytics(req, res) {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) return res.status(404).json({ error: "Exam not found" });

  const results = await Result.find({ examId: exam._id }).populate("userId", "name email").sort({ createdAt: -1 });

  const attempted = results.length;
  const avgScore = attempted ? results.reduce((s, r) => s + r.score, 0) / attempted : 0;
  const threshold = passThreshold(exam.totalMarks);
  const passCount = results.filter((r) => r.score >= threshold).length;
  const failCount = attempted - passCount;

  const topPerformers = [...results]
    .sort((a, b) => b.score - a.score || a.timeTakenSeconds - b.timeTakenSeconds)
    .slice(0, 5)
    .map((r) => ({
      student: { id: r.userId._id, name: r.userId.name, email: r.userId.email },
      score: r.score,
      accuracy: r.accuracy,
      timeTakenSeconds: r.timeTakenSeconds,
      submittedAt: r.createdAt
    }));

  const questionStats = new Map(
    exam.questions.map((q) => [
      String(q._id),
      {
        questionId: q._id,
        text: q.text,
        topic: q.topic || exam.subject,
        correctOption: q.correctOption,
        attempts: 0,
        correct: 0,
        accuracy: 0
      }
    ])
  );

  for (const r of results) {
    for (const a of r.answers) {
      const key = String(a.questionId);
      if (!questionStats.has(key)) continue;
      const qs = questionStats.get(key);
      qs.attempts += 1;
      const q = exam.questions.id(a.questionId);
      if (q && a.selectedOption === q.correctOption) qs.correct += 1;
    }
  }

  const questionWise = [...questionStats.values()].map((q) => ({
    ...q,
    accuracy: q.attempts ? Math.round((q.correct / q.attempts) * 10000) / 100 : 0
  }));

  const weakestQuestions = [...questionWise]
    .filter((q) => q.attempts > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  res.json({
    exam: {
      id: exam._id,
      title: exam.title,
      subject: exam.subject,
      totalMarks: exam.totalMarks,
      passScore: threshold
    },
    metrics: {
      attempted,
      avgScore: Math.round(avgScore * 100) / 100,
      passCount,
      failCount,
      passRate: attempted ? Math.round((passCount / attempted) * 10000) / 100 : 0
    },
    topPerformers,
    questionWise,
    weakestQuestions
  });
}

async function adminPerformanceTrend(req, res) {
  const examId = req.query.examId;
  if (!examId) return res.status(400).json({ error: "Missing examId" });

  const trend = await Result.aggregate([
    { $match: { examId: new mongoose.Types.ObjectId(examId) } },
    {
      $group: {
        _id: {
          y: { $year: "$createdAt" },
          m: { $month: "$createdAt" },
          d: { $dayOfMonth: "$createdAt" }
        },
        avgScore: { $avg: "$score" },
        attempted: { $sum: 1 }
      }
    },
    { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
    { $limit: 60 }
  ]);

  res.json({
    points: trend.map((p) => ({
      date: `${p._id.y}-${String(p._id.m).padStart(2, "0")}-${String(p._id.d).padStart(2, "0")}`,
      avgScore: Math.round(p.avgScore * 100) / 100,
      attempted: p.attempted
    }))
  });
}

async function studentOverview(req, res) {
  const results = await Result.find({ userId: req.user._id })
    .populate("examId", "title subject totalMarks")
    .sort({ createdAt: 1 });

  const history = results.map((r) => ({
    resultId: r._id,
    examId: r.examId._id,
    examTitle: r.examId.title,
    subject: r.examId.subject,
    score: r.score,
    accuracy: r.accuracy,
    timeTakenSeconds: r.timeTakenSeconds,
    submittedAt: r.createdAt
  }));

  const byExamIds = [...new Set(results.map((r) => String(r.examId._id)))];
  const ranks = new Map();
  const comparisons = new Map();

  for (const id of byExamIds) {
    const all = await Result.find({ examId: id }).sort({ score: -1, timeTakenSeconds: 1 });
    const userBestIdx = all.findIndex((r) => String(r.userId) === String(req.user._id));
    const rank = userBestIdx === -1 ? null : userBestIdx + 1;
    ranks.set(id, { rank, total: all.length });
    const avg = all.length ? all.reduce((s, r) => s + r.score, 0) / all.length : 0;
    comparisons.set(id, { avgScore: Math.round(avg * 100) / 100 });
  }

  const topicMap = new Map();
  const examDocs = await Exam.find({ _id: { $in: byExamIds } }).select("subject questions");
  const examMap = new Map(examDocs.map((e) => [String(e._id), e]));

  for (const r of results) {
    const exam = examMap.get(String(r.examId._id));
    if (!exam) continue;

    const questionById = new Map(exam.questions.map((q) => [String(q._id), q]));
    for (const a of r.answers) {
      const q = questionById.get(String(a.questionId));
      if (!q) continue;
      const topic = (q.topic || exam.subject || "General").trim() || "General";
      if (!topicMap.has(topic)) topicMap.set(topic, { topic, attempts: 0, correct: 0, accuracy: 0 });
      const t = topicMap.get(topic);
      t.attempts += 1;
      if (a.selectedOption === q.correctOption) t.correct += 1;
    }
  }

  const topics = [...topicMap.values()]
    .map((t) => ({
      ...t,
      accuracy: t.attempts ? Math.round((t.correct / t.attempts) * 10000) / 100 : 0
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  const strengths = topics.slice(0, 3);
  const weaknesses = [...topics].reverse().slice(0, 3);

  res.json({
    history,
    topics,
    strengths,
    weaknesses,
    ranks: Object.fromEntries(ranks),
    comparisons: Object.fromEntries(comparisons)
  });
}

module.exports = { adminOverview, adminExamAnalytics, adminPerformanceTrend, studentOverview };

