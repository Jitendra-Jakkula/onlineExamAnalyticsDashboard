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

  const [qText, setQText] = useState("");
  const [topic, setTopic] = useState("");
  const [o0, setO0] = useState("");
  const [o1, setO1] = useState("");
  const [o2, setO2] = useState("");
  const [o3, setO3] = useState("");
  const [correctOption, setCorrectOption] = useState(0);
  const [marks, setMarks] = useState(1);

  const options = useMemo(() => [o0, o1, o2, o3], [o0, o1, o2, o3]);

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
      setQText("");
      setTopic("");
      setO0("");
      setO1("");
      setO2("");
      setO3("");
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
          <Input label="Question" value={qText} onChange={(e) => setQText(e.target.value)} />
          <Input label="Topic (optional)" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input label="Option A" value={o0} onChange={(e) => setO0(e.target.value)} />
            <Input label="Option B" value={o1} onChange={(e) => setO1(e.target.value)} />
            <Input label="Option C" value={o2} onChange={(e) => setO2(e.target.value)} />
            <Input label="Option D" value={o3} onChange={(e) => setO3(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-sm text-slate-300">Correct option</div>
              <select
                className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                value={correctOption}
                onChange={(e) => setCorrectOption(e.target.value)}
              >
                <option value={0}>A</option>
                <option value={1}>B</option>
                <option value={2}>C</option>
                <option value={3}>D</option>
              </select>
            </label>
            <Input label="Marks" value={marks} onChange={(e) => setMarks(e.target.value)} type="number" min={1} />
          </div>
        </div>
        <div className="mt-4">
          <Button disabled={busy || !qText || options.some((o) => !o)} onClick={addQuestion}>
            {busy ? "Saving..." : "Add question"}
          </Button>
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

