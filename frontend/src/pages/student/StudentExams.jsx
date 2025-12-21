import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../lib/api";
import Alert from "../../components/Alert";
import Spinner from "../../components/Spinner";

export default function StudentExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet("/api/exams/published");
        setExams(data.exams);
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load exams");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading)
    return (
      <div className="p-4">
        <Spinner />
      </div>
    );

  return (
    <div className="space-y-4">
      {error ? <Alert>{error}</Alert> : null}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-base font-semibold">Available exams</div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {exams.map((e) => (
            <div key={e.id} className="rounded-xl border border-slate-900 bg-slate-950 p-4">
              <div className="text-sm font-semibold">{e.title}</div>
              <div className="mt-1 text-xs text-slate-500">
                {e.subject} • {e.questionCount} questions • {e.durationMinutes} mins • {e.totalMarks} marks
              </div>
              {e.hasAttempted ? (
                <div className="mt-4 inline-flex rounded-md border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300">
                  Attempted
                </div>
              ) : (
                <Link
                  className="mt-4 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                  to={`/student/exams/${e.id}/take`}
                >
                  Start exam
                </Link>
              )}
            </div>
          ))}
          {exams.length === 0 ? <div className="text-sm text-slate-500">No published exams yet</div> : null}
        </div>
      </div>
    </div>
  );
}
