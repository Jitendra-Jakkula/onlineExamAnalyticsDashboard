import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

function SidebarLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 text-sm ${
          isActive ? "bg-slate-900 text-white" : "text-slate-300 hover:bg-slate-900/60"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();

  const links =
    user?.role === "admin"
      ? [
          { to: "/admin/exams", label: "Exams" },
          { to: "/admin/analytics", label: "Analytics" }
        ]
      : [
          { to: "/student/exams", label: "Available Exams" },
          { to: "/student/analytics", label: "My Analytics" }
        ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-4 px-4 py-6">
        <aside className="col-span-12 rounded-xl border border-slate-800 bg-slate-950 p-4 md:col-span-3">
          <Link to="/" className="text-sm font-semibold text-white">
            Online Exam Analytics
          </Link>
          <div className="mt-1 text-xs text-slate-500">{user?.role?.toUpperCase()}</div>
          <div className="mt-4 space-y-1">
            {links.map((l) => (
              <SidebarLink key={l.to} to={l.to} label={l.label} />
            ))}
          </div>
          <div className="mt-6 border-t border-slate-800 pt-4">
            <div className="text-xs text-slate-500">{user?.name}</div>
            <div className="text-xs text-slate-600">{user?.email}</div>
            <button
              onClick={logout}
              className="mt-3 w-full rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
            >
              Logout
            </button>
          </div>
        </aside>
        <main className="col-span-12 md:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

