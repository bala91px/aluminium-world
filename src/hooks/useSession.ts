"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/demo-auth";
import type { Profile } from "@/lib/types";

export function useSession(requireAuth = true) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    const session = getSession();
    setProfile(session);
    if (requireAuth && !session) {
      router.replace("/login");
    }
  }, [requireAuth, router]);

  return { profile, loading: profile === undefined };
}
