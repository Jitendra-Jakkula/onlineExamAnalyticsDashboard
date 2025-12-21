import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";
import Select from "../components/Select";
import { useAuth } from "../state/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await signup({ name, email, password, role });
      nav(u.role === "admin" ? "/admin/exams" : "/student/exams", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
        <div className="text-lg font-semibold">Create account</div>
        <div className="mt-1 text-sm text-slate-400">Choose Admin or Student</div>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error ? <Alert>{error}</Alert> : null}
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <Input
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            minLength={6}
            required
          />
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </Select>
          <Button disabled={busy} className="w-full" type="submit">
            {busy ? "Creating..." : "Create account"}
          </Button>
        </form>
        <div className="mt-4 text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

