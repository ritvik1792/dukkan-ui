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

export function formatRelativeAgo(iso?: string | null) {
  if (!iso) return "Not confirmed yet";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "Not confirmed yet";
  const diffMs = Date.now() - then;
  if (diffMs < 0) return "Just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Confirmed just now";
  if (minutes < 60) return `Confirmed ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `Confirmed ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Confirmed ${days}d ago`;
}

export function percentOff(base: number, price: number) {
  if (base <= 0 || price >= base) return 0;
  return Math.round(((base - price) / base) * 100);
}

export function titleCase(value: string) {
  return value.replaceAll("_", " ");
}

export function paymentMethodLabel(method?: string) {
  switch (method) {
    case "upi":
      return "UPI";
    case "card":
      return "Card";
    case "credit_card":
      return "Credit card";
    case "debit_card":
      return "Debit card";
    case "wallet":
      return "Wallet";
    case "net_banking":
      return "Net banking";
    case "cod":
      return "Cash on delivery";
    default:
      return "Payment";
  }
}

export function cardBrandLabel(brand?: string) {
  switch (brand) {
    case "visa":
      return "Visa";
    case "mastercard":
      return "Mastercard";
    case "rupay":
      return "RuPay";
    default:
      return "Card";
  }
}

export function paymentStatusLabel(status?: string) {
  if (status === "paid") return "Paid";
  if (status === "cod") return "Pay on delivery";
  return "Pending";
}

export function paymentRefPrefix(method?: string) {
  if (method === "upi") return "UPI";
  if (method === "card" || method === "credit_card" || method === "debit_card") return "CARD";
  if (method === "wallet") return "WALLET";
  if (method === "net_banking") return "NB";
  return "COD";
}

export function createPaymentRefId(method?: string) {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  return `${paymentRefPrefix(method)}-${suffix}`;
}

export function fallbackPaymentRefId(orderId: string, method?: string) {
  return `${paymentRefPrefix(method)}-${orderId.replace(/^ORD-/, "")}`;
}

export function itemWarranty(itemWarrantyValue?: string, listingWarranty?: string) {
  return itemWarrantyValue || listingWarranty || "No warranty";
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return phone;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export function shopLocality(address: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts.slice(-2).join(", ");
  return address;
}
