import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { apiGet } from "../../lib/api";
import Alert from "../../components/Alert";
import Card from "../../components/Card";
import Spinner from "../../components/Spinner";

export default function StudentAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const d = await apiGet("/api/analytics/student/overview");
        setData(d);
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const historySeries = useMemo(() => {
    if (!data) return [];
    return data.history.map((h) => ({
      date: new Date(h.submittedAt).toLocaleDateString(),
      score: h.score,
      accuracy: h.accuracy,
      exam: h.examTitle
    }));
  }, [data]);

  const topicSeries = useMemo(() => {
    if (!data) return [];
    return (data.topics || []).map((t) => ({ topic: t.topic, accuracy: t.accuracy, attempts: t.attempts }));
  }, [data]);

  const totals = useMemo(() => {
    if (!data) return { attempts: 0, avgAcc: 0, best: null };
    const attempts = data.history.length;
    const avgAcc = attempts ? data.history.reduce((s, h) => s + h.accuracy, 0) / attempts : 0;
    const best = data.strengths?.[0] || null;
    return { attempts, avgAcc: Math.round(avgAcc * 100) / 100, best };
  }, [data]);

  if (loading)
    return (
      <div className="p-4">
        <Spinner />
      </div>
    );

  if (!data)
    return (
      <div className="p-4">
        <Alert>{error || "No analytics"}</Alert>
      </div>
    );

  return (
    <div className="space-y-4">
      {error ? <Alert>{error}</Alert> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card title="Total attempts" value={totals.attempts} />
        <Card title="Avg accuracy" value={`${totals.avgAcc}%`} />
        <Card title="Best topic" value={totals.best ? totals.best.topic : "—"} subtitle={totals.best ? `${totals.best.accuracy}%` : ""} />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-base font-semibold">Score history</div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937" }} />
              <Line type="monotone" dataKey="score" stroke="#60a5fa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-base font-semibold">Strengths & weaknesses by topic</div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topicSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="topic" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937" }} />
              <Bar dataKey="accuracy" fill="#34d399" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-base font-semibold">Ranks & comparisons</div>
        <div className="mt-4 space-y-2">
          {Object.entries(data.ranks || {}).map(([examId, r]) => {
            const cmp = data.comparisons?.[examId];
            const last = [...data.history].reverse().find((h) => String(h.examId) === String(examId));
            return (
              <div key={examId} className="rounded-lg border border-slate-900 bg-slate-950 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{last?.examTitle || "Exam"}</div>
                  <div className="text-xs text-slate-500">
                    Rank: {r.rank ?? "—"} / {r.total}
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Your score: {last?.score ?? "—"} • Exam avg: {cmp?.avgScore ?? "—"}
                </div>
              </div>
            );
          })}
          {Object.keys(data.ranks || {}).length === 0 ? <div className="text-sm text-slate-500">No attempts yet</div> : null}
        </div>
      </div>
    </div>
  );
}

