const Exam = require("../models/Exam");
const Result = require("../models/Result");

function toStudentExam(exam) {
  return {
    id: exam._id,
    title: exam.title,
    subject: exam.subject,
    durationMinutes: exam.durationMinutes,
    totalMarks: exam.totalMarks,
    isPublished: exam.isPublished,
    questions: exam.questions.map((q) => ({
      id: q._id,
      text: q.text,
      topic: q.topic,
      options: q.options,
      marks: q.marks
    }))
  };
}

async function createExam(req, res) {
  const { title, subject, durationMinutes } = req.body || {};
  if (!title || !subject || !durationMinutes) return res.status(400).json({ error: "Missing fields" });

  const exam = await Exam.create({
    title: String(title).trim(),
    subject: String(subject).trim(),
    durationMinutes: Number(durationMinutes),
    totalMarks: 0,
    questions: []
  });

  res.status(201).json({ exam: { id: exam._id, ...exam.toObject() } });
}

async function listAllExams(req, res) {
  const exams = await Exam.find().sort({ createdAt: -1 });
  res.json({
    exams: exams.map((e) => ({
      id: e._id,
      title: e.title,
      subject: e.subject,
      durationMinutes: e.durationMinutes,
      totalMarks: e.totalMarks,
      isPublished: e.isPublished,
      questionCount: e.questions.length,
      createdAt: e.createdAt
    }))
  });
}

async function getExamAdmin(req, res) {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  res.json({ exam: { id: exam._id, ...exam.toObject() } });
}

async function updateExam(req, res) {
  const { title, subject, durationMinutes } = req.body || {};
  const exam = await Exam.findById(req.params.examId);
  if (!exam) return res.status(404).json({ error: "Exam not found" });

  if (title !== undefined) exam.title = String(title).trim();
  if (subject !== undefined) exam.subject = String(subject).trim();
  if (durationMinutes !== undefined) exam.durationMinutes = Number(durationMinutes);
  exam.recalculateTotalMarks();
  await exam.save();

  res.json({ exam: { id: exam._id, ...exam.toObject() } });
}

async function deleteExam(req, res) {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  await Exam.deleteOne({ _id: exam._id });
  await Result.deleteMany({ examId: exam._id });
  res.json({ ok: true });
}

async function addQuestion(req, res) {
  const { text, options, correctOption, marks, topic } = req.body || {};
  if (!text || !options || correctOption === undefined || !marks) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (!Array.isArray(options) || (options.length !== 2 && options.length !== 4)) {
    return res.status(400).json({ error: "Options must be an array of 2 or 4 strings" });
  }
  const co = Number(correctOption);
  if (!Number.isFinite(co) || co < 0 || co >= options.length) {
    return res.status(400).json({ error: "correctOption out of range" });
  }

  const exam = await Exam.findById(req.params.examId);
  if (!exam) return res.status(404).json({ error: "Exam not found" });

  exam.questions.push({
    text: String(text).trim(),
    topic: String(topic || "").trim(),
    options: options.map((o) => String(o)),
    correctOption: co,
    marks: Number(marks)
  });
  exam.recalculateTotalMarks();
  await exam.save();

  res.status(201).json({ exam: { id: exam._id, ...exam.toObject() } });
}

async function publishExam(req, res) {
  const { isPublished } = req.body || {};
  const exam = await Exam.findById(req.params.examId);
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  exam.isPublished = Boolean(isPublished);
  await exam.save();
  res.json({ exam: { id: exam._id, ...exam.toObject() } });
}

async function listPublishedExams(req, res) {
  const exams = await Exam.find({ isPublished: true }).sort({ createdAt: -1 });

  const attempted = await Result.find({ userId: req.user._id, examId: { $in: exams.map((e) => e._id) } }).select(
    "examId"
  );
  const attemptedSet = new Set(attempted.map((r) => String(r.examId)));

  res.json({
    exams: exams.map((e) => ({
      id: e._id,
      title: e.title,
      subject: e.subject,
      durationMinutes: e.durationMinutes,
      totalMarks: e.totalMarks,
      questionCount: e.questions.length,
      hasAttempted: attemptedSet.has(String(e._id))
    }))
  });
}

async function getExamForTaking(req, res) {
  const exam = await Exam.findOne({ _id: req.params.examId, isPublished: true });
  if (!exam) return res.status(404).json({ error: "Exam not found" });

  const existing = await Result.findOne({ userId: req.user._id, examId: exam._id }).select("_id");
  if (existing) return res.status(409).json({ error: "Exam already submitted" });

  res.json({ exam: toStudentExam(exam) });
}

async function listAttemptsForExam(req, res) {
  const exam = await Exam.findById(req.params.examId).select("title totalMarks");
  if (!exam) return res.status(404).json({ error: "Exam not found" });

  const results = await Result.find({ examId: exam._id })
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(200);

  res.json({
    exam: { id: exam._id, title: exam.title, totalMarks: exam.totalMarks },
    attempts: results.map((r) => ({
      id: r._id,
      student: { id: r.userId._id, name: r.userId.name, email: r.userId.email },
      score: r.score,
      accuracy: r.accuracy,
      timeTakenSeconds: r.timeTakenSeconds,
      createdAt: r.createdAt
    }))
  });
}

module.exports = {
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
};
