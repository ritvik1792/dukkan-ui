import type { ProductTag } from "@/lib/types";

const styles: Record<ProductTag["kind"], string> = {
  sale: "bg-amber-100 text-amber-900",
  coupon: "bg-violet-100 text-violet-900",
  offer: "bg-lime/60 text-ink",
  badge: "bg-sky-100 text-sky-900",
};

export function TagBadge({ tag }: { tag: ProductTag }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[tag.kind]}`}>
      {tag.label}
      {tag.code ? ` · ${tag.code}` : ""}
    </span>
  );
}
