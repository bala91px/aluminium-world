import Link from "next/link";
import { readDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { loginAs, logout } from "@/app/login/actions";

export default async function Header() {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = readDB();
  const others = db.users.filter((u) => u.id !== user.id);
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href={user.role === "owner" ? "/dashboard" : "/quotes"}
          className="font-semibold text-zinc-900"
        >
          Aluminium World
        </Link>

        <nav className="flex items-center gap-4 text-sm text-zinc-600">
          {user.role === "owner" ? (
            <>
              <Link href="/dashboard" className="hover:text-zinc-900">Dashboard</Link>
              <Link href="/approvals" className="hover:text-zinc-900">Approvals</Link>
              <Link href="/jobs" className="hover:text-zinc-900">Jobs</Link>
            </>
          ) : (
            <>
              <Link href="/quotes/new" className="hover:text-zinc-900">New quote</Link>
              <Link href="/quotes" className="hover:text-zinc-900">My quotes</Link>
              <Link href="/jobs" className="hover:text-zinc-900">My jobs</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
            {user.name} · {user.role}
          </span>
          {demoMode && (
            <div className="flex items-center gap-1">
              {others.map((o) => (
                <form action={loginAs.bind(null, o.id)} key={o.id}>
                  <button
                    type="submit"
                    title={`Switch to ${o.name}`}
                    className="rounded border border-dashed border-amber-400 bg-amber-50 px-2 py-1 text-xs text-amber-800 hover:bg-amber-100"
                  >
                    view as {o.name}
                  </button>
                </form>
              ))}
            </div>
          )}
          <form action={logout}>
            <button type="submit" className="text-xs text-zinc-400 hover:text-zinc-700">
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
