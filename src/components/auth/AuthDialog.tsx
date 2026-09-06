"use client";

import { LogoMark } from "@/components/LogoMark";
import { useApp } from "@/context/AppContext";
import { afterPaint } from "@/lib/drawer";
import { DEMO_OTP } from "@/lib/constants";
import { formatPhone } from "@/lib/format";
import { findUserByPhone, needsProfileSetup, validateEmail, validateMobile } from "@/services/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type AuthStep = "phone" | "otp" | "profile";

type AuthDialogContextValue = {
  openAuth: (onSignedIn?: () => void) => void;
  closeAuth: () => void;
};

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

export function useAuthDialog() {
  const ctx = useContext(AuthDialogContext);
  if (!ctx) throw new Error("useAuthDialog must be used within AuthDialogProvider");
  return ctx;
}

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [onSignedIn, setOnSignedIn] = useState<(() => void) | undefined>();

  const closeAuth = useCallback(() => {
    setOpen(false);
    setOnSignedIn(undefined);
  }, []);

  const openAuth = useCallback((next?: () => void) => {
    setOnSignedIn(() => next);
    setOpen(true);
  }, []);

  return (
    <AuthDialogContext.Provider value={{ openAuth, closeAuth }}>
      {children}
      {open && (
        <PhoneAuthDialog
          onClose={closeAuth}
          onSignedIn={() => {
            onSignedIn?.();
            closeAuth();
          }}
        />
      )}
    </AuthDialogContext.Provider>
  );
}

const STEP_COPY: Record<AuthStep, { title: string; subtitle: string }> = {
  phone: {
    title: "Sign in with your phone",
    subtitle: "We'll send a one-time password to verify this number.",
  },
  otp: {
    title: "Verify your phone number",
    subtitle: "Enter the 4-digit OTP sent to your mobile.",
  },
  profile: {
    title: "Link your profile to Dukkan",
    subtitle: "We'll use this to save your orders and updates.",
  },
};

function PhoneAuthDialog({
  onClose,
  onSignedIn,
}: {
  onClose: () => void;
  onSignedIn: () => void;
}) {
  const { state, user, dispatch, loginWithPhone } = useApp();
  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const cancel = afterPaint(() => setShown(true));
    return cancel;
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const existing = findUserByPhone(state.users, phone);
  const copy = STEP_COPY[step];

  function sendCode() {
    const invalid = validateMobile(phone);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError("");
    setOtp("");
    setStep("otp");
  }

  function verifyPhone() {
    if (otp.trim() !== DEMO_OTP) {
      setError("Enter the 4-digit OTP sent to your phone.");
      return;
    }
    const signedIn = loginWithPhone(phone);
    setError("");
    if (needsProfileSetup(signedIn)) {
      setName(/^User \d{4}$/.test(signedIn.name) ? "" : signedIn.name);
      setEmail(signedIn.email.endsWith("@phone.dukkan") ? "" : signedIn.email);
      setStep("profile");
      return;
    }
    onSignedIn();
  }

  function saveProfile() {
    if (name.trim().length < 2) {
      setError("Enter your name.");
      return;
    }
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    if (!user) return;
    dispatch({
      type: "upsertUser",
      user: {
        ...user,
        name: name.trim(),
        email: email.trim().toLowerCase(),
      },
    });
    onSignedIn();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-10 sm:items-center sm:pt-0">
      <button
        type="button"
        aria-label="Close sign in"
        onClick={onClose}
        className={`drawer-scrim absolute inset-0 bg-black/45 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <div className="relative w-full max-w-[22rem]">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute -top-12 left-1/2 z-10 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-white text-lg text-ink shadow-md"
        >
          ×
        </button>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
          className={`overflow-hidden rounded-[1.75rem] bg-[#f6f1e8] shadow-2xl transition duration-300 ${
            shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <p className="bg-[#c8a24d] px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-white">
            Nearby shops. Fast delivery.
          </p>
          <div className="px-6 pt-5 pb-6">
            <div className="flex justify-center">
              <LogoMark className="h-14 w-14 rounded-full" />
            </div>
            <StepDots step={step} />
            <div key={step} className="animate-fade-up">
              <h2 id="auth-title" className="mt-3 text-center text-[1.35rem] font-bold leading-tight text-ink">
                {copy.title}
              </h2>
              <p className="mt-1 text-center text-sm text-stone-500">{copy.subtitle}</p>

              {step === "phone" && (
                <form
                  className="mt-5 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendCode();
                  }}
                >
                  <IconField icon="phone">
                    <span className="pr-1 text-sm text-stone-500">+91</span>
                    <input
                      autoFocus
                      required
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit number"
                      className="w-full bg-transparent py-3 outline-none"
                    />
                  </IconField>
                  {error && <p className="text-center text-sm text-red-700">{error}</p>}
                  <ContinueButton>Send OTP</ContinueButton>
                </form>
              )}

              {step === "otp" && (
                <form
                  className="mt-5 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    verifyPhone();
                  }}
                >
                  <p className="text-center text-sm text-stone-500">
                    Sent to {formatPhone(phone)}
                    {existing ? ` · ${existing.name}` : ""}
                  </p>
                  <OtpBoxes value={otp} onChange={setOtp} />
                  {error && <p className="text-center text-sm text-red-700">{error}</p>}
                  <ContinueButton>Verify OTP</ContinueButton>
                  <button
                    type="button"
                    className="w-full text-sm text-stone-500 underline"
                    onClick={() => {
                      setStep("phone");
                      setOtp("");
                      setError("");
                    }}
                  >
                    Use a different number
                  </button>
                  <p className="text-center text-[11px] text-stone-400">Demo OTP is {DEMO_OTP}</p>
                </form>
              )}

              {step === "profile" && (
                <form
                  className="mt-5 space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveProfile();
                  }}
                >
                  <IconField icon="user">
                    <input
                      autoFocus
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      className="w-full bg-transparent py-3 outline-none"
                    />
                  </IconField>
                  <IconField icon="email">
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      autoComplete="email"
                      className="w-full bg-transparent py-3 outline-none"
                    />
                  </IconField>
                  {error && <p className="text-center text-sm text-red-700">{error}</p>}
                  <ContinueButton>Continue</ContinueButton>
                  <p className="text-center text-[11px] text-stone-400">
                    Addresses and cards can be added later in Profile.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContinueButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="w-full rounded-xl bg-teal-700 py-3 text-sm font-bold text-white hover:bg-teal-800"
    >
      {children}
    </button>
  );
}

function StepDots({ step }: { step: AuthStep }) {
  const order: AuthStep[] = ["phone", "otp", "profile"];
  const index = order.indexOf(step);
  return (
    <div className="mt-4 flex justify-center gap-1.5">
      {order.map((item, i) => (
        <span
          key={item}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === index ? "w-5 bg-ink" : i < index ? "w-1.5 bg-teal-700" : "w-1.5 bg-stone-300"
          }`}
        />
      ))}
    </div>
  );
}

function IconField({ icon, children }: { icon: "phone" | "user" | "email"; children: ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-3">
      <span className="text-stone-400" aria-hidden>
        {icon === "phone" && (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M7 3h4l1 4-2 1a12 12 0 0 0 6 6l1-2 4 1v4c0 1-1 2-2 2C9 19 5 10 5 5c0-1 1-2 2-2z" />
          </svg>
        )}
        {icon === "user" && (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5.5 19c.9-3.2 3.4-5 6.5-5s5.6 1.8 6.5 5" />
          </svg>
        )}
        {icon === "email" && <span className="text-base font-semibold">@</span>}
      </span>
      {children}
    </label>
  );
}

function OtpBoxes({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(4, " ").slice(0, 4).split("");

  function setDigit(index: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    const next = value.padEnd(4, " ").split("");
    next[index] = char || " ";
    const joined = next.join("").replace(/ /g, "").slice(0, 4);
    onChange(joined);
    if (char && index < 3) refs.current[index + 1]?.focus();
  }

  return (
    <div className="flex justify-center gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${index + 1}`}
          value={digit.trim()}
          autoFocus={index === 0}
          onChange={(e) => setDigit(index, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[index] && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            onChange(e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4));
          }}
          className="h-12 w-12 rounded-xl border border-stone-200 bg-white text-center text-lg font-semibold outline-none focus:border-ink focus:ring-2 focus:ring-lime/40"
        />
      ))}
    </div>
  );
}
