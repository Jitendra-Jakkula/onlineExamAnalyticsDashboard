import React from "react";

export default function Select({ label, className = "", children, ...props }) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm text-slate-300">{label}</div> : null}
      <select
        className={`w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

