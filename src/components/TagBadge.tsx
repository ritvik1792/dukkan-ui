import { getTagStyle } from "@/lib/theme";
import type { ProductTag } from "@/lib/types";

export function TagBadge({
  tag,
  className = "",
}: {
  tag: ProductTag;
  className?: string;
}) {
  const style = getTagStyle(tag.kind);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] tracking-tight ${style} ${className}`}
    >
      {tag.label}
      {tag.code ? ` · ${tag.code}` : ""}
    </span>
  );
}
