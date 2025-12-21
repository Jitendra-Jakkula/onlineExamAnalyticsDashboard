import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import Spinner from "./Spinner";

export default function ProtectedRoute({ allowRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowRoles && !allowRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

