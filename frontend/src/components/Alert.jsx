import React from "react";

export default function Alert({ type = "error", children }) {
  const styles =
    type === "error"
      ? "border-rose-900 bg-rose-950/30 text-rose-200"
      : "border-emerald-900 bg-emerald-950/30 text-emerald-200";
  return <div className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>{children}</div>;
}

