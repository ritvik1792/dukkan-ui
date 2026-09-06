export function Spinner({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-10 text-sm text-stone-500">
      <Spinner className="h-5 w-5 text-ink" />
      {label}
    </div>
  );
}

export function BlockingLoader({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm shadow-xl">
        <Spinner className="h-5 w-5 text-ink" />
        <span>{label}</span>
      </div>
    </div>
  );
}
