"use client";

import { useRouter } from "next/navigation";
import { users } from "@/lib/mock-data";
import { useApp } from "@/context/AppContext";

export default function LoginPage() {
  const { dispatch, user } = useApp();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Enter Dukkan</h1>
      <p className="mt-2 text-sm text-stone-500">
        Frontend-only auth. Pick a demo identity — buyer, seller, or admin. Spring Boot
        security will replace this.
      </p>
      <p className="mt-2 text-sm">
        Signed in as <strong>{user.name}</strong> ({user.role})
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {users
          .filter((u, i, arr) => arr.findIndex((x) => x.role === u.role) === i)
          .map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                dispatch({ type: "setUser", userId: u.id });
                if (u.role === "seller") router.push("/seller");
                else if (u.role === "admin") router.push("/admin");
                else router.push("/");
              }}
              className="rounded-3xl bg-white p-6 text-left shadow-sm hover:shadow-md"
            >
              <p className="text-xs uppercase tracking-wider text-stone-400">{u.role}</p>
              <p className="mt-2 text-lg font-semibold">{u.name}</p>
              <p className="text-sm text-stone-500">{u.email}</p>
            </button>
          ))}
      </div>
    </div>
  );
}
