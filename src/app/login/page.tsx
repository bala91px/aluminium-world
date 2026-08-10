import { readDB } from "@/lib/db";
import { loginAs } from "./actions";

export default function LoginPage() {
  const db = readDB();
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-zinc-900">Aluminium World</h1>
          <p className="mt-1 text-sm text-zinc-500">Job flow — demo login</p>
        </div>
        <div className="flex flex-col gap-3">
          {db.users.map((u) => (
            <form action={loginAs.bind(null, u.id)} key={u.id}>
              <button
                type="submit"
                className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-zinc-300 hover:shadow"
              >
                <span>
                  <span className="block font-medium text-zinc-900">{u.name}</span>
                  <span className="block text-xs text-zinc-500">
                    {u.role === "owner" ? "Owner" : "Site supervisor"}
                  </span>
                </span>
                <span className="text-zinc-400">→</span>
              </button>
            </form>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-zinc-400">
          Prototype for demo purposes. Not for real customer data.
        </p>
      </div>
    </div>
  );
}
