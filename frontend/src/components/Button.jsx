import React from "react";

export default function Button({ children, className = "", variant = "primary", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500",
    ghost: "border border-slate-800 bg-transparent text-slate-100 hover:bg-slate-900",
    danger: "bg-rose-600 text-white hover:bg-rose-500"
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

