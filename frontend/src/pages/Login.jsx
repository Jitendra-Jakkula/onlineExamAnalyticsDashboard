import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";
import { useAuth } from "../state/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login({ email, password });
      nav(u.role === "admin" ? "/admin/exams" : "/student/exams", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
        <div className="text-lg font-semibold">Login</div>
        <div className="mt-1 text-sm text-slate-400">Admin or Student</div>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error ? <Alert>{error}</Alert> : null}
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <Input
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
          <Button disabled={busy} className="w-full" type="submit">
            {busy ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="mt-4 text-sm text-slate-400">
          New here?{" "}
          <Link to="/signup" className="text-indigo-400 hover:text-indigo-300">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

