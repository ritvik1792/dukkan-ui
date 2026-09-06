export function ProductArt({
  hue,
  label,
  imageUrl,
  className = "h-36",
}: {
  hue: number;
  label: string;
  imageUrl?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex items-end justify-center overflow-hidden rounded-2xl ${className}`}
      style={{
        background: imageUrl
          ? undefined
          : `linear-gradient(160deg, hsl(${hue} 70% 88%), hsl(${hue} 55% 72%))`,
      }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <div
            className="absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-40"
            style={{ background: `hsl(${hue} 80% 60%)` }}
          />
          <span className="relative z-10 mb-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-ink">
            {label}
          </span>
        </>
      )}
    </div>
  );
}
