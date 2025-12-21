const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    topic: { type: String, trim: true, default: "" },
    options: {
      type: [String],
      required: true,
      validate: (v) => Array.isArray(v) && (v.length === 2 || v.length === 4)
    },
    correctOption: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
      validate: {
        validator: function validator(v) {
          return Array.isArray(this.options) && v >= 0 && v < this.options.length;
        },
        message: "correctOption out of range"
      }
    },
    marks: { type: Number, required: true, min: 1, max: 100 }
  },
  { _id: true }
);

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    subject: { type: String, required: true, trim: true, maxlength: 80 },
    durationMinutes: { type: Number, required: true, min: 1, max: 240 },
    totalMarks: { type: Number, required: true, min: 0, max: 10000 },
    isPublished: { type: Boolean, default: false, index: true },
    questions: { type: [questionSchema], default: [] }
  },
  { timestamps: true }
);

examSchema.methods.recalculateTotalMarks = function recalculateTotalMarks() {
  this.totalMarks = (this.questions || []).reduce((sum, q) => sum + (q.marks || 0), 0);
};

module.exports = mongoose.model("Exam", examSchema);
