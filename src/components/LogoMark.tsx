export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      role="img"
    >
      <title>pinkCarrot</title>
      {/* Soft pink tile */}
      <rect width="32" height="32" rx="9" fill="#F9D5E5" />
      {/* Leaf / greens */}
      <path
        d="M16.2 4.2c-.2 1.8.4 3.2 1.6 4.1-1.4-.1-2.6.5-3.4 1.6-.1-1.5.4-2.9 1.5-3.9-.9.2-1.8.8-2.4 1.7C14.2 6.2 15.2 4.8 16.2 4.2z"
        fill="#3D8B4F"
      />
      <path
        d="M18.4 5.1c.9 1.2 1.1 2.6.7 3.8 1-.7 1.5-1.9 1.4-3.1-.7.1-1.4.3-2.1.7z"
        fill="#2F6B3C"
      />
      {/* Cute rounded carrot body */}
      <path
        d="M17.8 9.2c2.4 1.1 4.4 4.8 3.2 10.2-.7 3.1-2.6 6.2-4.8 8.1-.4.3-.9.1-1.1-.3C12.8 23 11.4 19.2 11.6 15.6c.2-3.4 2.3-6.1 4.6-6.9.5-.2 1.1-.1 1.6.5z"
        fill="#E8722A"
      />
      {/* Soft highlight */}
      <path
        d="M16.8 11.1c1.3.5 2.5 2.4 2.4 5.1-.1 1.8-.8 3.5-1.7 4.8-.2.3-.6.2-.7-.1.7-1.4 1.1-3 1.2-4.5.1-2-.7-3.5-1.6-4.2-.2-.2-.1-.5.4-1.1z"
        fill="#F4A261"
        opacity="0.9"
      />
      {/* Friendly eyes */}
      <circle cx="15.2" cy="15.2" r="1.05" fill="#2A1810" />
      <circle cx="18.3" cy="14.6" r="1.05" fill="#2A1810" />
      <circle cx="15.45" cy="14.95" r="0.35" fill="#FFF8F2" />
      <circle cx="18.55" cy="14.35" r="0.35" fill="#FFF8F2" />
      {/* Smile */}
      <path
        d="M15.4 17.3c.7.7 1.9.8 2.7.2"
        fill="none"
        stroke="#2A1810"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
