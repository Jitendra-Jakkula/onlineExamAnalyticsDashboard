const Exam = require("../models/Exam");
const Result = require("../models/Result");

function buildAnswerMap(answers) {
  const map = new Map();
  for (const a of answers || []) {
    if (!a?.questionId) continue;
    map.set(String(a.questionId), Number(a.selectedOption));
  }
  return map;
}

async function submitExam(req, res) {
  const { examId, answers, timeTakenSeconds } = req.body || {};
  if (!examId || !Array.isArray(answers)) return res.status(400).json({ error: "Missing fields" });

  const existing = await Result.findOne({ userId: req.user._id, examId }).select("_id");
  if (existing) return res.status(409).json({ error: "Exam already submitted" });

  const exam = await Exam.findOne({ _id: examId, isPublished: true });
  if (!exam) return res.status(404).json({ error: "Exam not found" });

  const answerMap = buildAnswerMap(answers);
  let score = 0;
  let correctCount = 0;

  for (const q of exam.questions) {
    const selected = answerMap.has(String(q._id)) ? answerMap.get(String(q._id)) : -1;
    if (selected === q.correctOption) {
      score += q.marks;
      correctCount += 1;
    }
  }

  const totalQuestions = exam.questions.length;
  const accuracy = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 10000) / 100;

  const normalizedAnswers = exam.questions.map((q) => ({
    questionId: q._id,
    selectedOption: answerMap.has(String(q._id)) ? answerMap.get(String(q._id)) : -1
  }));

  const result = await Result.create({
    userId: req.user._id,
    examId: exam._id,
    score,
    accuracy,
    correctCount,
    totalQuestions,
    answers: normalizedAnswers,
    timeTakenSeconds: Math.max(0, Number(timeTakenSeconds || 0))
  });

  res.status(201).json({
    result: {
      id: result._id,
      examId: exam._id,
      score: result.score,
      accuracy: result.accuracy,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      timeTakenSeconds: result.timeTakenSeconds,
      createdAt: result.createdAt
    }
  });
}

async function myResults(req, res) {
  const results = await Result.find({ userId: req.user._id })
    .populate("examId", "title subject totalMarks")
    .sort({ createdAt: -1 })
    .limit(200);

  res.json({
    results: results.map((r) => ({
      id: r._id,
      exam: {
        id: r.examId._id,
        title: r.examId.title,
        subject: r.examId.subject,
        totalMarks: r.examId.totalMarks
      },
      score: r.score,
      accuracy: r.accuracy,
      timeTakenSeconds: r.timeTakenSeconds,
      createdAt: r.createdAt
    }))
  });
}

module.exports = { submitExam, myResults };
