import type { Product } from "@/lib/types";

export function ProductArt({
  product,
  className = "h-36",
}: {
  product: Pick<Product, "imageHue" | "imageLabel">;
  className?: string;
}) {
  return (
    <div
      className={`relative flex items-end justify-center overflow-hidden rounded-2xl ${className}`}
      style={{
        background: `linear-gradient(160deg, hsl(${product.imageHue} 70% 88%), hsl(${product.imageHue} 55% 72%))`,
      }}
    >
      <div
        className="absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-40"
        style={{ background: `hsl(${product.imageHue} 80% 60%)` }}
      />
      <span className="relative mb-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-ink">
        {product.imageLabel}
      </span>
    </div>
  );
}
