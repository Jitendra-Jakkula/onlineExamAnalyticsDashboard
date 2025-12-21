import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import Spinner from "../components/Spinner";

export default function HomeRedirect() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) nav("/login", { replace: true });
    else nav(user.role === "admin" ? "/admin/exams" : "/student/exams", { replace: true });
  }, [user, loading, nav]);

  return (
    <div className="p-6">
      <Spinner label="Preparing dashboard..." />
    </div>
  );
}

