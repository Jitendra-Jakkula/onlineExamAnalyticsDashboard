const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOption: { type: Number, required: true, min: -1, max: 3 }
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User", index: true },
    examId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Exam", index: true },
    score: { type: Number, required: true, min: 0 },
    accuracy: { type: Number, required: true, min: 0, max: 100 },
    correctCount: { type: Number, required: true, min: 0 },
    totalQuestions: { type: Number, required: true, min: 0 },
    answers: { type: [answerSchema], default: [] },
    timeTakenSeconds: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Result", resultSchema);

