"use client";

import { fieldClass } from "@/components/ui/Field";
import { useState, type InputHTMLAttributes } from "react";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-5 w-5">
      <path
        d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-5 w-5">
      <path d="M4 4.5 20 19.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M9.9 6.9A9.8 9.8 0 0 1 12 6.5c6 0 9.5 5.5 9.5 5.5a18 18 0 0 1-3.2 3.6M6.1 8.2C3.9 9.8 2.5 12 2.5 12S6 17.5 12 17.5c1.2 0 2.3-.3 3.3-.7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M10.1 10.2a2.75 2.75 0 0 0 3.7 3.7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PasswordInput({
  className,
  bare = false,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { bare?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={bare ? (className ?? "") : `${fieldClass} pr-10 ${className ?? ""}`}
      />
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-stone-400 hover:text-ink"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
