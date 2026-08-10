import { readDB } from "@/lib/db";
import { requireUser } from "@/lib/session";
import QuoteWizard from "@/components/QuoteWizard";

export default async function NewQuotePage() {
  await requireUser();
  const db = readDB();
  return (
    <QuoteWizard
      defaultAdvancePct={db.settings.defaultAdvancePct}
      defaultGstPct={db.settings.defaultGstPct}
      minBillableSqft={db.settings.minBillableSqft}
    />
  );
}
