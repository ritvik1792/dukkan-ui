import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export const fieldClass =
  "w-full rounded-xl border border-border px-3 py-2 transition duration-200 focus:border-ink focus:outline-none focus:ring-2 focus:ring-pink/40";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {hint && <span className="ml-2 font-normal text-stone-400">{hint}</span>}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function FileButton({
  buttonLabel = "Choose file",
  fileName,
  showFileName = true,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  buttonLabel?: string;
  fileName?: string;
  showFileName?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="relative inline-flex">
        <span className="inline-flex cursor-pointer items-center rounded-full bg-carrot px-4 py-2 text-sm font-semibold text-white shadow-sm">
          {buttonLabel}
        </span>
        <input
          {...props}
          type="file"
          aria-label={buttonLabel}
          className={`absolute inset-0 cursor-pointer opacity-0 ${className ?? ""}`}
        />
      </span>
      {showFileName && (
        <span className="text-sm text-stone-500">{fileName || "No file chosen"}</span>
      )}
    </div>
  );
}
