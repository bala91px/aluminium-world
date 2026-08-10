"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readDB } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/session";

export async function loginAs(userId: string) {
  const db = readDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return;
  const store = await cookies();
  store.set(SESSION_COOKIE, userId, {
    path: "/",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(user.role === "owner" ? "/dashboard" : "/quotes");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
