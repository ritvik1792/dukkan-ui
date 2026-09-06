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

export function paymentMethodLabel(method?: string) {
  switch (method) {
    case "upi":
      return "UPI";
    case "card":
      return "Card";
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
