import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiPatch, apiPost } from "../../lib/api";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Spinner from "../../components/Spinner";

export default function AdminExamDetail() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [questionType, setQuestionType] = useState("mcq4");
  const [qText, setQText] = useState("");
  const [topic, setTopic] = useState("");
  const [correctOption, setCorrectOption] = useState(0);
  const [marks, setMarks] = useState(1);

  const [options, setOptions] = useState(["", "", "", ""]);

  useEffect(() => {
    if (questionType === "tf") setOptions(["True", "False"]);
    else setOptions(["", "", "", ""]);
    setCorrectOption(0);
  }, [questionType]);

  const optionLabels = useMemo(() => {
    if (questionType === "tf") return ["True", "False"];
    return ["A", "B", "C", "D"];
  }, [questionType]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const ex = await apiGet(`/api/exams/${examId}`);
      const at = await apiGet(`/api/exams/${examId}/attempts`);
      setExam(ex.exam);
      setAttempts(at.attempts || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load exam");
      setExam(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [examId]);

  async function togglePublish() {
    if (!exam) return;
    setBusy(true);
    setError("");
    try {
      const data = await apiPatch(`/api/exams/${examId}/publish`, { isPublished: !exam.isPublished });
      setExam(data.exam);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update publish status");
    } finally {
      setBusy(false);
    }
  }

  async function addQuestion() {
    setBusy(true);
    setError("");
    try {
      const data = await apiPost(`/api/exams/${examId}/questions`, {
        text: qText,
        topic,
        options,
        correctOption: Number(correctOption),
        marks: Number(marks)
      });
      setExam(data.exam);
      setQuestionType("mcq4");
      setQText("");
      setTopic("");
      setOptions(["", "", "", ""]);
      setCorrectOption(0);
      setMarks(1);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to add question");
    } finally {
      setBusy(false);
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

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{exam.title}</div>
            <div className="text-sm text-slate-400">
              {exam.subject} • {exam.durationMinutes} mins • {exam.questions.length} questions • {exam.totalMarks} marks
            </div>
          </div>
          <Button disabled={busy} onClick={togglePublish} variant={exam.isPublished ? "ghost" : "primary"}>
            {exam.isPublished ? "Unpublish" : "Publish"}
          </Button>
        </div>
        {error ? (
          <div className="mt-3">
            <Alert>{error}</Alert>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-base font-semibold">Add question</div>
        <div className="mt-4 grid grid-cols-1 gap-3">
          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Question type</div>
            <select
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
            >
              <option value="mcq4">MCQ (4 options)</option>
              <option value="tf">True / False</option>
            </select>
          </label>
          <Input label="Question" value={qText} onChange={(e) => setQText(e.target.value)} />
          <Input label="Topic (optional)" value={topic} onChange={(e) => setTopic(e.target.value)} />
          {questionType === "tf" ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input label="Option 1" value={options[0]} disabled />
              <Input label="Option 2" value={options[1]} disabled />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label="Option A"
                value={options[0]}
                onChange={(e) => setOptions((p) => [e.target.value, p[1], p[2], p[3]])}
              />
              <Input
                label="Option B"
                value={options[1]}
                onChange={(e) => setOptions((p) => [p[0], e.target.value, p[2], p[3]])}
              />
              <Input
                label="Option C"
                value={options[2]}
                onChange={(e) => setOptions((p) => [p[0], p[1], e.target.value, p[3]])}
              />
              <Input
                label="Option D"
                value={options[3]}
                onChange={(e) => setOptions((p) => [p[0], p[1], p[2], e.target.value])}
              />
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-sm text-slate-300">Correct option</div>
              <select
                className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                value={correctOption}
                onChange={(e) => setCorrectOption(e.target.value)}
              >
                {options.map((_, idx) => (
                  <option key={idx} value={idx}>
                    {optionLabels[idx] ?? `Option ${idx + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Marks" value={marks} onChange={(e) => setMarks(e.target.value)} type="number" min={1} />
          </div>
        </div>
        <div className="mt-4">
          <Button
            disabled={busy || !qText || (questionType === "mcq4" && options.some((o) => !o))}
            onClick={addQuestion}
          >
            {busy ? "Saving..." : "Add question"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-base font-semibold">Questions</div>
        <div className="mt-4 space-y-2">
          {exam.questions.map((q, idx) => (
            <div key={q._id} className="rounded-lg border border-slate-900 bg-slate-950 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium">
                  {idx + 1}. {q.text}
                </div>
                <div className="text-xs text-slate-500">
                  {q.options.length === 2 ? "True/False" : "MCQ"} • {q.marks} marks
                </div>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Topic: {(q.topic || exam.subject || "General").trim() || "General"}
              </div>
            </div>
          ))}
          {exam.questions.length === 0 ? <div className="text-sm text-slate-500">No questions yet</div> : null}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-base font-semibold">Recent attempts</div>
        <div className="mt-4 space-y-2">
          {attempts.map((a) => (
            <div key={a.id} className="rounded-lg border border-slate-900 bg-slate-950 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{a.student.name}</div>
                <div className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</div>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Score: {a.score} • Accuracy: {a.accuracy}% • Time: {Math.round(a.timeTakenSeconds / 60)}m
              </div>
            </div>
          ))}
          {attempts.length === 0 ? <div className="text-sm text-slate-500">No attempts yet</div> : null}
        </div>
      </div>
    </div>
  );
}
