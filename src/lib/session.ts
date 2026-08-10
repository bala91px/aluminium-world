import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readDB } from "./db";
import type { User } from "./types";

const COOKIE = "aw_uid";

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const uid = store.get(COOKIE)?.value;
  if (!uid) return null;
  const db = readDB();
  return db.users.find((u) => u.id === uid) ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireOwner(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "owner") redirect("/quotes");
  return user;
}

export const SESSION_COOKIE = COOKIE;
