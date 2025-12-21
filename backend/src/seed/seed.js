const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const envPath = fs.existsSync(path.join(process.cwd(), ".env"))
  ? path.join(process.cwd(), ".env")
  : path.join(process.cwd(), ".env.example");
dotenv.config({ path: envPath });

const { connectDb } = require("../config/db");
const User = require("../models/User");
const Exam = require("../models/Exam");
const Result = require("../models/Result");

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildResult({ userId, exam, timeTakenSeconds }) {
  const answers = exam.questions.map((q) => {
    const selectedOption = Math.random() < 0.1 ? -1 : Math.floor(Math.random() * 4);
    return { questionId: q._id, selectedOption };
  });

  let score = 0;
  let correctCount = 0;
  for (const q of exam.questions) {
    const a = answers.find((x) => String(x.questionId) === String(q._id));
    if (a && a.selectedOption === q.correctOption) {
      score += q.marks;
      correctCount += 1;
    }
  }

  const totalQuestions = exam.questions.length;
  const accuracy = totalQuestions ? Math.round((correctCount / totalQuestions) * 10000) / 100 : 0;

  return {
    userId,
    examId: exam._id,
    score,
    accuracy,
    correctCount,
    totalQuestions,
    answers,
    timeTakenSeconds
  };
}

async function seed() {
  await connectDb(process.env.MONGODB_URI);

  await Promise.all([User.deleteMany({}), Exam.deleteMany({}), Result.deleteMany({})]);

  const admin = await User.create({
    name: "Admin",
    email: "admin@example.com",
    passwordHash: await User.hashPassword("admin123"),
    role: "admin"
  });

  const students = await User.insertMany([
    {
      name: "Aarav Student",
      email: "aarav@example.com",
      passwordHash: await User.hashPassword("student123"),
      role: "student"
    },
    {
      name: "Isha Student",
      email: "isha@example.com",
      passwordHash: await User.hashPassword("student123"),
      role: "student"
    },
    {
      name: "Noah Student",
      email: "noah@example.com",
      passwordHash: await User.hashPassword("student123"),
      role: "student"
    }
  ]);

  const exam1 = await Exam.create({
    title: "JavaScript Fundamentals",
    subject: "JavaScript",
    durationMinutes: 20,
    totalMarks: 0,
    isPublished: true,
    questions: [
      {
        text: "Which keyword declares a block-scoped variable?",
        topic: "Basics",
        options: ["var", "let", "function", "this"],
        correctOption: 1,
        marks: 2
      },
      {
        text: "What does Array.prototype.map return?",
        topic: "Arrays",
        options: ["A single value", "A new array", "The same array", "Nothing"],
        correctOption: 1,
        marks: 2
      },
      {
        text: "Which operator checks both value and type equality?",
        topic: "Operators",
        options: ["==", "=", "===", "!="],
        correctOption: 2,
        marks: 2
      },
      {
        text: "What is the output type of JSON.parse?",
        topic: "JSON",
        options: ["string", "number", "object", "boolean"],
        correctOption: 2,
        marks: 2
      },
      {
        text: "Which method adds an item to the end of an array?",
        topic: "Arrays",
        options: ["push", "pop", "shift", "unshift"],
        correctOption: 0,
        marks: 2
      }
    ]
  });
  exam1.recalculateTotalMarks();
  await exam1.save();

  const exam2 = await Exam.create({
    title: "DBMS Basics (Draft)",
    subject: "DBMS",
    durationMinutes: 15,
    totalMarks: 0,
    isPublished: false,
    questions: [
      {
        text: "Which normal form removes partial dependency?",
        topic: "Normalization",
        options: ["1NF", "2NF", "3NF", "BCNF"],
        correctOption: 1,
        marks: 2
      }
    ]
  });
  exam2.recalculateTotalMarks();
  await exam2.save();

  const allResults = [];
  for (const s of students) {
    const attempts = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < attempts; i += 1) {
      allResults.push(
        buildResult({
          userId: s._id,
          exam: exam1,
          timeTakenSeconds: pick([420, 510, 600, 780, 900, 1050])
        })
      );
    }
  }
  await Result.insertMany(allResults);

  console.log("Seeded:");
  console.log("- Admin: admin@example.com / admin123");
  console.log("- Students: aarav@example.com, isha@example.com, noah@example.com / student123");
  console.log(`- Published exam: ${exam1.title}`);

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    void 0;
  }
  process.exit(1);
});
