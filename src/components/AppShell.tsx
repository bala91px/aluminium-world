"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { t } from "@/lib/strings";
import { signOut } from "@/lib/demo-auth";
import type { Profile } from "@/lib/types";

type NavItem = { href: string; label: string };

const OWNER_NAV: NavItem[] = [
  { href: "/dashboard", label: t.nav.dashboard },
  { href: "/approvals", label: t.nav.approvals },
  { href: "/enquiries", label: t.nav.enquiries },
  { href: "/jobs", label: t.nav.jobs },
  { href: "/customers", label: t.nav.customers },
  { href: "/vendors", label: t.nav.vendors },
  { href: "/settings", label: t.nav.settings },
];

const SUPERVISOR_NAV: NavItem[] = [
  { href: "/enquiries", label: t.nav.enquiries },
  { href: "/quotes", label: t.nav.quotes },
  { href: "/jobs", label: t.nav.jobs },
  { href: "/vendors", label: t.nav.vendors },
];

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = profile.role === "owner" ? OWNER_NAV : SUPERVISOR_NAV;

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print border-b border-border bg-surface">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">
            {t.appName}
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="rounded-full bg-status-pending-bg px-2.5 py-1 text-status-pending">
              {profile.name} · {t.roles[profile.role as "owner" | "supervisor"] ?? profile.role}
            </span>
            <button onClick={handleLogout} className="hover:text-foreground">
              {t.common.logout}
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 text-sm">
          {nav.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-md px-3 py-1.5 ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted hover:bg-status-pending-bg"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 px-4 py-5">{children}</main>
    </div>
  );
}
