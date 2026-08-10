"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { AppShell } from "@/components/AppShell";
import { t } from "@/lib/strings";
import { createVendor, listVendorCategories, searchVendors } from "@/lib/data";
import { waLink } from "@/lib/whatsapp";
import type { Vendor } from "@/lib/types";

export default function VendorsPage() {
  const { profile } = useSession();
  const [query, setQuery] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    listVendorCategories().then(setCategories);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const handle = setTimeout(() => {
      searchVendors(query).then((rows) => {
        setVendors(rows);
        setLoading(false);
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [profile, query]);

  if (!profile) return null;

  async function handleAdd() {
    if (!profile || !newCompany || !newCategory || !newMobile) return;
    setSaving(true);
    const vendor = await createVendor({
      company: newCompany,
      categories: [newCategory],
      mobile: newMobile,
      created_by: profile.id,
    });
    setSaving(false);
    if (vendor) {
      setVendors([vendor, ...vendors]);
      setAdding(false);
      setNewCompany("");
      setNewCategory("");
      setNewMobile("");
    }
  }

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{t.vendors.title}</h1>
            <p className="text-sm text-muted">{t.vendors.subtitle}</p>
          </div>
          <button
            onClick={() => setAdding(!adding)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            {t.vendors.addVendor}
          </button>
        </div>

        {adding && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
            <input
              className="input"
              placeholder="Company name"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
            />
            <select className="input" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              <option value="">Category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              className="input"
              placeholder="Mobile"
              inputMode="numeric"
              maxLength={10}
              value={newMobile}
              onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, ""))}
            />
            <button
              onClick={handleAdd}
              disabled={saving}
              className="rounded-lg bg-status-done px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {t.common.save}
            </button>
          </div>
        )}

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.vendors.search}
          className="input mb-4"
        />

        {loading ? (
          <p className="text-sm text-muted">{t.common.loading}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {vendors.map((v) => (
              <li key={v.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{v.company}</p>
                    <p className="text-sm text-muted">
                      {v.categories.join(", ")}
                      {v.city ? ` · ${v.city}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${v.mobile}`} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium">
                      {t.vendors.call}
                    </a>
                    <a
                      href={waLink(v.mobile, `Hello ${v.contact_person ?? ""}, `)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
                    >
                      {t.vendors.whatsapp}
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
