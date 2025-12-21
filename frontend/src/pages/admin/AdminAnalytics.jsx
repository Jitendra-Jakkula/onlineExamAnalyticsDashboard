import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { apiGet } from "../../lib/api";
import Alert from "../../components/Alert";
import Card from "../../components/Card";
import Spinner from "../../components/Spinner";

const pieColors = ["#22c55e", "#ef4444"];

export default function AdminAnalytics() {
  const [overview, setOverview] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [examAnalytics, setExamAnalytics] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const barData = useMemo(
    () =>
      overview.map((e) => ({
        id: e.id,
        name: e.title.length > 16 ? `${e.title.slice(0, 16)}…` : e.title,
        avgScore: e.avgScore,
        attempted: e.attempted
      })),
    [overview]
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet("/api/analytics/admin/overview");
        setOverview(data.exams);
        if (data.exams.length) setSelectedExamId((prev) => prev || data.exams[0].id);
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadExam() {
      if (!selectedExamId) return;
      setError("");
      try {
        const data = await apiGet(`/api/analytics/admin/exams/${selectedExamId}`);
        setExamAnalytics(data);
        const t = await apiGet(`/api/analytics/admin/trend?examId=${selectedExamId}`);
        setTrend(t.points || []);
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load exam analytics");
      }
    }
    loadExam();
  }, [selectedExamId]);

  if (loading)
    return (
      <div className="p-4">
        <Spinner />
      </div>
    );

  const pieData = examAnalytics
    ? [
        { name: "Pass", value: examAnalytics.metrics.passCount },
        { name: "Fail", value: examAnalytics.metrics.failCount }
      ]
    : [];

  const questionData = (examAnalytics?.questionWise || []).map((q, idx) => ({
    name: `Q${idx + 1}`,
    accuracy: q.accuracy
  }));

  return (
    <div className="space-y-4">
      {error ? <Alert>{error}</Alert> : null}

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold">Exam vs Avg Score</div>
            <div className="text-xs text-slate-500">Click a bar to drill into an exam</div>
          </div>
          <select
            className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
          >
            {overview.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937" }} />
              <Legend />
              <Bar
                dataKey="avgScore"
                name="Avg Score"
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
                onClick={(d) => setSelectedExamId(d.id)}
              />
              <Bar dataKey="attempted" name="Attempts" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {examAnalytics ? (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Card title="Attempts" value={examAnalytics.metrics.attempted} />
            <Card title="Avg Score" value={examAnalytics.metrics.avgScore} subtitle={`Pass score: ${examAnalytics.exam.passScore}`} />
            <Card title="Pass Rate" value={`${examAnalytics.metrics.passRate}%`} subtitle={`${examAnalytics.metrics.passCount} pass / ${examAnalytics.metrics.failCount} fail`} />
            <Card title="Weakest Questions" value={examAnalytics.weakestQuestions.length} subtitle="Lowest accuracies" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="text-base font-semibold">Pass / Fail</div>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937" }} />
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="text-base font-semibold">Performance Trend (Avg Score)</div>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937" }} />
                    <Line type="monotone" dataKey="avgScore" stroke="#a78bfa" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-base font-semibold">Question-wise Accuracy</div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={questionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937" }} />
                  <Bar dataKey="accuracy" fill="#34d399" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="text-base font-semibold">Top 5 performers</div>
              <div className="mt-4 space-y-2">
                {examAnalytics.topPerformers.map((p, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-900 bg-slate-950 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{p.student.name}</div>
                      <div className="text-xs text-slate-500">{p.score} pts</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {p.accuracy}% • {Math.round(p.timeTakenSeconds / 60)}m
                    </div>
                  </div>
                ))}
                {examAnalytics.topPerformers.length === 0 ? <div className="text-sm text-slate-500">No attempts yet</div> : null}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="text-base font-semibold">Weakest questions</div>
              <div className="mt-4 space-y-2">
                {examAnalytics.weakestQuestions.map((q) => (
                  <div key={q.questionId} className="rounded-lg border border-slate-900 bg-slate-950 p-3">
                    <div className="text-sm">{q.text}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Accuracy: {q.accuracy}% • Attempts: {q.attempts}
                    </div>
                  </div>
                ))}
                {examAnalytics.weakestQuestions.length === 0 ? <div className="text-sm text-slate-500">Not enough data</div> : null}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="text-sm text-slate-500">Select an exam to view detailed analytics.</div>
        </div>
      )}
    </div>
  );
}

