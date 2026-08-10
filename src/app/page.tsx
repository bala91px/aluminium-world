"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/demo-auth";
import { t } from "@/lib/strings";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    router.replace(session.role === "owner" ? "/dashboard" : "/jobs");
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-muted">{t.common.loading}</p>
    </div>
  );
}
