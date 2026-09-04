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
  if (!input.dob) return "Enter your date of birth.";
  const dob = new Date(`${input.dob}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return "Enter a valid date of birth.";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dob > today) return "Date of birth cannot be in the future.";
  const thirteenYearsAgo = new Date(today);
  thirteenYearsAgo.setFullYear(today.getFullYear() - 13);
  if (dob > thirteenYearsAgo) return "You must be at least 13 years old.";
  if (!EMAIL_RE.test(input.email.trim())) return "Enter a valid email address.";
  if (!MOBILE_RE.test(normalizePhone(input.phone))) {
    return "Enter a 10-digit Indian mobile number.";
  }
  if (!PIN_RE.test(input.pinCode.trim())) return "Enter a 6-digit PIN code.";
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
  };
}
