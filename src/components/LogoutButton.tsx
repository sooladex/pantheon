"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.replace("/");
          router.refresh();
        })
      }
      className="text-xs text-muted transition hover:text-text disabled:opacity-50"
    >
      Sortir
    </button>
  );
}
