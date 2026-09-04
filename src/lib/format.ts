export function formatInr(amount: number) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function percentOff(base: number, price: number) {
  if (base <= 0 || price >= base) return 0;
  return Math.round(((base - price) / base) * 100);
}

export function titleCase(value: string) {
  return value.replaceAll("_", " ");
}

export function shopLocality(address: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts.slice(-2).join(", ");
  return address;
}
