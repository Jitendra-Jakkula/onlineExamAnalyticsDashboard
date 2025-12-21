import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiPost } from "../../lib/api";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Spinner from "../../components/Spinner";

function formatTime(seconds) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function TakeExam() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  const totalSeconds = useMemo(() => (exam ? exam.durationMinutes * 60 : 0), [exam]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet(`/api/exams/${examId}/take`);
        setExam(data.exam);
        setSecondsLeft(data.exam.durationMinutes * 60);
        setAnswers({});
        setActiveIdx(0);
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load exam");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [examId]);

  useEffect(() => {
    if (!exam || result) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [exam, result]);

  useEffect(() => {
    if (!exam || result) return;
    if (secondsLeft <= 0) {
      clearInterval(timerRef.current);
      submit({ confirm: false });
    }
  }, [secondsLeft, exam, result]);

  function selectOption(qId, idx) {
    setAnswers((prev) => ({ ...prev, [qId]: idx }));
  }

  async function submit({ confirm = true } = {}) {
    if (!exam || submitting || result) return;
    if (confirm) {
      const ok = window.confirm("Submit the exam now? You can't edit after submission.");
      if (!ok) return;
    }
    setSubmitting(true);
    setError("");
    clearInterval(timerRef.current);
    try {
      const payload = {
        examId: exam.id,
        timeTakenSeconds: Math.max(0, totalSeconds - Math.max(0, secondsLeft)),
        answers: exam.questions.map((q) => ({
          questionId: q.id,
          selectedOption: answers[q.id] ?? -1
        }))
      };
      const data = await apiPost("/api/results/submit", payload);
      setResult(data.result);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return (
      <div className="p-4">
        <Spinner />
      </div>
    );

  if (!exam)
    return (
      <div className="p-4">
        <Alert>{error || "Exam not found"}</Alert>
      </div>
    );

  if (result) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="text-lg font-semibold">Submitted</div>
          <div className="mt-1 text-sm text-slate-400">{exam.title}</div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs text-slate-400">Score</div>
            <div className="mt-1 text-2xl font-semibold">{result.score}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs text-slate-400">Accuracy</div>
            <div className="mt-1 text-2xl font-semibold">{result.accuracy}%</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs text-slate-400">Time taken</div>
            <div className="mt-1 text-2xl font-semibold">{Math.round(result.timeTakenSeconds / 60)}m</div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="text-sm text-slate-300">
            Go to <span className="text-indigo-300">My Analytics</span> to see trends, topics, and rank.
          </div>
        </div>
      </div>
    );
  }

  const q = exam.questions[activeIdx];
  const answeredCount = exam.questions.reduce((count, qq) => count + (answers[qq.id] !== undefined ? 1 : 0), 0);
  const isLast = activeIdx === exam.questions.length - 1;

  function saveAndNext() {
    if (isLast) return;
    setActiveIdx((i) => Math.min(exam.questions.length - 1, i + 1));
  }

  return (
    <div className="space-y-4">
      {submitting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-base font-semibold">Submitting</div>
            <div className="mt-1 text-sm text-slate-400">Please wait. Don't close this tab.</div>
            <div className="mt-4">
              <Spinner label="Sending your answers..." />
            </div>
          </div>
        </div>
      ) : null}

      {error ? <Alert>{error}</Alert> : null}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold">{exam.title}</div>
            <div className="mt-1 text-xs text-slate-500">
              {exam.subject} • {exam.questions.length} questions • {exam.totalMarks} marks
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
              Answered: <span className="font-semibold">{answeredCount}</span>/{exam.questions.length}
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
              Time left: <span className="font-semibold">{formatTime(secondsLeft)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold">Question navigator</div>
          <div className="text-xs text-slate-500">Jump to any question</div>
        </div>
        <div className="mt-3 grid grid-cols-10 gap-2 sm:grid-cols-12">
          {exam.questions.map((qq, idx) => {
            const answered = answers[qq.id] !== undefined;
            const active = idx === activeIdx;
            const cls = active
              ? "border-indigo-500 bg-indigo-950/30 text-indigo-100"
              : answered
                ? "border-emerald-700 bg-emerald-950/20 text-emerald-100"
                : "border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900/30";
            return (
              <button
                key={qq.id}
                onClick={() => setActiveIdx(idx)}
                className={`h-9 rounded-md border text-xs font-medium ${cls}`}
                type="button"
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">
            Q{activeIdx + 1} of {exam.questions.length}
          </div>
          <div className="text-xs text-slate-500">Marks: {q.marks}</div>
        </div>
        <div className="mt-3 text-sm">{q.text}</div>
        <div className="mt-4 space-y-2">
          {q.options.map((opt, idx) => (
            <label
              key={idx}
              className={`flex cursor-pointer items-center gap-2 rounded-md border p-3 transition ${
                (answers[q.id] ?? -1) === idx
                  ? "border-indigo-600 bg-indigo-950/30"
                  : "border-slate-900 bg-slate-950 hover:bg-slate-900/30"
              }`}
            >
              <input
                type="radio"
                name={q.id}
                checked={(answers[q.id] ?? -1) === idx}
                onChange={() => selectOption(q.id, idx)}
              />
              <div className="text-sm">{opt}</div>
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="ghost" disabled={activeIdx === 0} onClick={() => setActiveIdx((i) => i - 1)}>
              Prev
            </Button>
            <Button variant="ghost" disabled={isLast} onClick={() => setActiveIdx((i) => i + 1)}>
              Next
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" disabled={isLast} onClick={saveAndNext}>
              Save & Next
            </Button>
            <Button disabled={submitting} onClick={() => submit({ confirm: true })}>
              Submit exam
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs text-slate-500">
          Tip: You can navigate questions freely. Your choices are saved locally until you submit.
        </div>
      </div>
    </div>
  );
}
