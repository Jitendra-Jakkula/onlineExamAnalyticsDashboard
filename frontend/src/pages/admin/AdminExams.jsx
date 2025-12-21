import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../../lib/api";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Spinner from "../../components/Spinner";

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/api/exams");
      setExams(data.exams);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load exams");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createExam() {
    setBusy(true);
    setError("");
    try {
      await apiPost("/api/exams", { title, subject, durationMinutes: Number(durationMinutes) });
      setTitle("");
      setSubject("");
      setDurationMinutes(30);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create exam");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-base font-semibold">Create exam</div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Input
            label="Duration (minutes)"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            type="number"
            min={1}
          />
        </div>
        {error ? (
          <div className="mt-3">
            <Alert>{error}</Alert>
          </div>
        ) : null}
        <div className="mt-4">
          <Button disabled={busy || !title || !subject} onClick={createExam}>
            {busy ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">All exams</div>
          <button onClick={load} className="text-sm text-slate-400 hover:text-slate-200">
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="mt-4">
            <Spinner />
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {exams.map((e) => (
              <Link
                key={e.id}
                to={`/admin/exams/${e.id}`}
                className="block rounded-lg border border-slate-900 bg-slate-950 p-3 hover:bg-slate-900/30"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-slate-400">{e.isPublished ? "Published" : "Draft"}</div>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {e.subject} • {e.questionCount} questions • {e.totalMarks} marks
                </div>
              </Link>
            ))}
            {exams.length === 0 ? <div className="text-sm text-slate-500">No exams yet</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}

