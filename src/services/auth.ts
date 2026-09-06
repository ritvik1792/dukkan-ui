import {
  DEFAULT_DELIVERY_RADIUS_KM,
  MAX_SHOP_RADIUS_KM,
  MIN_SHOP_RADIUS_KM,
} from "@/lib/constants";
import type { User } from "@/lib/types";

export type BuyerProfileInput = {
  name: string;
  dob: string;
  email: string;
  phone: string;
  pinCode: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;
const PIN_RE = /^\d{6}$/;

export function findUserByEmail(users: User[], email: string) {
  return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

export function findUserByPhone(users: User[], phone: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) return undefined;
  return users.find((u) => normalizePhone(u.phone ?? "") === normalized);
}

export function validateMobile(phone: string): string | null {
  if (!MOBILE_RE.test(normalizePhone(phone))) {
    return "Enter a 10-digit Indian mobile number.";
  }
  return null;
}

export function formatAddressLine(address: { line: string; pinCode: string }) {
  const pin = address.pinCode.trim();
  if (pin && !address.line.includes(pin)) return `${address.line.trim()}, ${pin}`;
  return address.line.trim();
}

export function authenticate(users: User[], email: string, password: string) {
  const user = findUserByEmail(users, email);
  if (!user || user.password !== password) return null;
  return user;
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function clampShopRadiusKm(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_DELIVERY_RADIUS_KM;
  return Math.min(MAX_SHOP_RADIUS_KM, Math.max(MIN_SHOP_RADIUS_KM, Math.round(value)));
}

export function validateBuyerProfile(input: BuyerProfileInput): string | null {
  if (input.name.trim().length < 2) return "Enter your full name.";
  if (input.dob) {
    const dob = new Date(`${input.dob}T00:00:00`);
    if (Number.isNaN(dob.getTime())) return "Enter a valid date of birth.";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dob > today) return "Date of birth cannot be in the future.";
    const thirteenYearsAgo = new Date(today);
    thirteenYearsAgo.setFullYear(today.getFullYear() - 13);
    if (dob > thirteenYearsAgo) return "You must be at least 13 years old.";
  }
  const email = input.email.trim();
  if (email && !email.endsWith("@phone.dukkan") && !EMAIL_RE.test(email)) {
    return "Enter a valid email address.";
  }
  if (!MOBILE_RE.test(normalizePhone(input.phone))) {
    return "Enter a 10-digit Indian mobile number.";
  }
  if (input.pinCode.trim() && !PIN_RE.test(input.pinCode.trim())) {
    return "Enter a 6-digit PIN code.";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
  return null;
}

export function needsProfileSetup(user: User) {
  const dummyEmail = !user.email || user.email.endsWith("@phone.dukkan");
  const placeholderName = !user.name.trim() || /^User \d{4}$/.test(user.name);
  return dummyEmail || placeholderName;
}

export function cardBrandFromNumber(number: string): "visa" | "mastercard" | "rupay" | "card" {
  const digits = number.replace(/\D/g, "");
  if (digits.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard";
  if (digits.startsWith("6")) return "rupay";
  return "card";
}

export function maskCardNumber(number: string) {
  const digits = number.replace(/\D/g, "");
  return digits.slice(-4);
}

export function validatePinCode(pin: string): string | null {
  if (!PIN_RE.test(pin.trim())) return "Enter a 6-digit PIN code.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.trim().length < 6) return "Password must be at least 6 characters.";
  return null;
}

export function createBuyerUser(
  input: BuyerProfileInput & { id: string; password: string; shopRadiusKm?: number },
): User {
  return {
    id: input.id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    role: "buyer",
    phone: normalizePhone(input.phone),
    dob: input.dob,
    pinCode: input.pinCode.trim(),
    shopRadiusKm: clampShopRadiusKm(input.shopRadiusKm ?? DEFAULT_DELIVERY_RADIUS_KM),
    addresses: [],
    cards: [],
  };
}

export function loginOrCreateByPhone(
  users: User[],
  phone: string,
  name?: string,
): { user: User; created: boolean } {
  const normalized = normalizePhone(phone);
  const existing = findUserByPhone(users, normalized);
  if (existing) return { user: existing, created: false };
  const display = name?.trim() || `User ${normalized.slice(-4)}`;
  return {
    created: true,
    user: createBuyerUser({
      id: `u-${normalized}`,
      name: display,
      dob: "",
      email: `${normalized}@phone.dukkan`,
      phone: normalized,
      pinCode: "",
      password: "phone",
    }),
  };
}
