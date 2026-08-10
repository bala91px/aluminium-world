# ALUMINIUM WORLD — JOB FLOW MVP
### Build specification for Claude Code
**Client:** Aluminium World, Bypass Road, Kalpetta, Wayanad · Owner: Arif
**Prepared by:** 91Pixels · Doc ref: AW-MVP-001 · 10 Aug 2026
**Status:** Prototype / demo build. Not production. Not for real customer data.

---

## 0. Read this first (context for the agent)

Aluminium World is a **retail fabricator**, not a wholesaler. Earlier assumptions about
distribution, kg/length dual-unit stock and a fabricator credit ledger are **wrong and
must be ignored**. The business is:

> A supervisor visits a customer's house or site → measures glass doors, windows,
> partitions → produces a quotation → owner approves it → customer pays advance →
> the job runs through the workshop → it gets delivered and installed.

Everything in this spec serves that one chain.

**The core problem in Arif's words:** *"Everything is in my head."* He is the single
point of memory for every live job, every rate, every customer chasing a status update.
The MVP's job is to take that out of his head and put it on a screen.

**Terminology note:** the discovery notes were voice-transcribed and "quote" was
repeatedly transcribed as "code". Throughout this document, **quote = quotation**.

---

## 1. What the MVP must prove in a 10-minute demo

Five moments, in this order. If the build achieves nothing else, achieve these.

| # | Moment | Who sees it |
|---|---|---|
| 1 | Supervisor stands at a site, phone in hand, captures location + photos + measurements, hits submit, a quote number appears | Arif |
| 2 | Arif gets it in an approval inbox, sees the rates, taps Approve | Arif |
| 3 | Customer opens a plain link on their phone: sees the quote, accepts it, sees the advance amount | Arif (as customer) |
| 4 | Same link now shows a live job tracker — procurement → cutting → fitting → coating → delivery | Arif |
| 5 | Arif's dashboard: 14 jobs this month, 3 stuck, one stuck because the customer hasn't paid the balance. He taps it and calls them | Arif |

Everything else is decoration. Build in this order.

---

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15, App Router, TypeScript** | One codebase for supervisor mobile, owner desktop, and public customer pages |
| Styling | **Tailwind + shadcn/ui** | Fast, clean, no design debate during a prototype |
| DB / Auth / Storage | **Supabase** (Postgres, Auth, Storage, RLS) | Photo storage and row-level roles out of the box |
| Deploy | **Vercel** | Public demo URL Arif can open on his own phone |
| Messaging | **`wa.me` deep links only** | See §9 — do NOT integrate WhatsApp Business API in the MVP |
| PDF | `@react-pdf/renderer` or print-to-PDF via browser | Quote PDF, low priority |

**Constraints:**
- Mobile-first for supervisor screens. Assume a ₹12,000 Android phone and patchy
  Wayanad network. Large tap targets, minimal typing, numeric keypads on number fields.
- Currency `₹`, `en-IN` number formatting (`₹1,25,000`), dates `DD-MM-YYYY`, IST.
- All user-facing strings through a single `strings.ts` so Malayalam can be swapped
  in later. Do not hardcode English in JSX.
- No customer PII beyond name/phone/address. Seed data only for the demo.

---

## 3. Roles

| Role | Can do |
|---|---|
| `owner` (Arif) | Everything. Approvals, dashboard, rates, blockers, vendor book, settings |
| `supervisor` | Create quotes, update job stages, record payments received, trigger delivery |
| `workshop` | Update job stages only (Phase 2 — stub the role now) |
| `customer` | No login. Public tokenised link only |
| `driver` | No login. Public tokenised delivery link only |

Use Supabase Auth with a `profiles` table carrying `role`. For the demo, seed three
logins and put a **role-switcher in the dev header** so Bala can flip between Arif's
view and a supervisor's view live in front of the client. That switcher is a demo
feature — gate it behind `NEXT_PUBLIC_DEMO_MODE`.

---

## 4. The flow, stage by stage

```
[1] SITE VISIT          supervisor captures measurements + photos + GPS
        ↓
[2] QUOTE DRAFT         auto-priced from rate card, quote no. generated
        ↓
[3] OWNER CHECK         maker-checker — TOGGLEABLE (see §5.3)
        ↓
[4] SENT TO CUSTOMER    WhatsApp link → public quote page
        ↓
[5] CUSTOMER ACCEPTS    accept button on the link
        ↓
[6] SPEC SHEET          material/hardware confirmation — see §5.4
        ↓
[7] ADVANCE PAID        recorded by supervisor → job auto-created
        ↓
[8] BUILD               procurement → cutting → fitting → coating → QC
        ↓
[9] DELIVERY            driver dispatched via WhatsApp link
        ↓
[10] INSTALLED / CLOSED balance payment recorded
```

The customer sees stages 4, 5, 7, 8, 9, 10 on **one single link that never changes**.
This is the single most important product decision in the build. One URL per job.
Its content changes as the job moves. The customer bookmarks it once.

---

## 5. Modules

### 5.1 Quotation capture (supervisor, mobile)

A wizard, one decision per screen. Never a long form.

**Screen 1 — Where**
- Auto-fetch GPS on load (`navigator.geolocation`), reverse-geocode to a display
  address, store `lat`, `lng`, `captured_address`.
- Editable text field `site_label` — e.g. *"Meethal house, Meppadi"*. Supervisors will
  overwrite the GPS name constantly; make the manual field first-class, not a fallback.
- Store both. The label prints on the quote; the coordinates open in Google Maps for
  the delivery driver later.

**Screen 2 — Who**
- Search existing customers by name or phone. If no match, create inline:
  name, mobile (10-digit validated), optional address.

**Screen 3 — Items** (repeatable)
Each item captures:

| Field | Type | Notes |
|---|---|---|
| `item_type` | select | Window · Door · Partition · Glass railing · Shower cubicle · Mosquito mesh · Other |
| `opening_type` | select | Sliding (2/3 track) · Openable/casement · Fixed · Top hung · Sliding-folding |
| `location_in_house` | text | "Bedroom 1", "Kitchen" — matters at delivery |
| `width_mm`, `height_mm` | number | mm. Auto-derive sqft, show it live |
| `quantity` | number | |
| `system_series` | select | Domal · Jindal · Hindalco · Local — seed as editable master |
| `glass_spec` | select | 5mm clear · 5mm tinted · 6mm toughened · 8mm toughened · Frosted · DGU |
| `finish` | select | Powder coated (shade code text field) · Anodized · Wooden finish · Mill finish |
| `hardware` | select | Standard · Premium — brand text field |
| `mesh` | boolean | |
| `rate` | number | ₹/sqft, prefilled — see §5.2 |
| `photos[]` | file[] | Camera capture, 1–4 per item, compress client-side to ~800KB |
| `remarks` | text | |

**Area calculation:** `sqft = (width_mm × height_mm) / 92903` × quantity.
Apply a **minimum billable area per shutter** — this is standard trade practice and
Arif will have his own figure. Make it a setting, default 10 sqft, and show the user
when the minimum has been applied rather than silently inflating the number.
→ *Confirm the actual minimum with Arif.*

**Screen 4 — Review & submit**
- Line items, subtotal, optional discount (₹ or %), GST toggle (default 18%), grand total.
- Advance % field, default 50%.
- Terms & delivery lead-time in days.
- Submit → generates quote number, moves to `pending_approval` or `approved`
  depending on the maker-checker setting.

**Quote number format:** `AW/Q/26-27/0001` — financial-year sequential, zero-padded.

### 5.2 Rate memory (small feature, disproportionate impact)

When the supervisor picks `item_type + opening_type + system_series + glass_spec`,
prefill `rate` from, in order of priority:

1. The last rate quoted **to this same customer** for the same combination
2. The last rate quoted to anyone for that combination in the last 90 days
3. The rate card default

Show it as a hint under the field: *"Last quoted ₹640/sqft — Rasheed, 12-Jul"*.
This is the feature that most directly attacks *"everything is in my head."* Arif's
rate knowledge stops being his alone. Demo it explicitly.

Store every quoted rate in a `rate_history` table on quote approval.

### 5.3 Maker-checker (must be toggleable)

Arif wants oversight now and wants to be free of it later. Settings, owner-only:

```ts
type ApprovalSettings = {
  approval_mode: 'always' | 'threshold' | 'never'
  threshold_amount: number       // e.g. quotes above ₹1,00,000 need approval
  discount_threshold_pct: number // any discount above this always needs approval
  notify_owner_always: boolean   // notify even on auto-approved quotes
}
```

- `always` → every quote waits in Arif's inbox
- `threshold` → small quotes auto-approve and go straight out; big ones wait
- `never` → everything auto-approves; Arif is only **notified**, and every quote is
  still visible in a "Recently sent" feed he can review after the fact

Owner approval screen shows: line items, rates, margin flag if rate is below the rate
card floor, and three actions — **Approve** · **Approve with edit** · **Reject with reason**.
Rejection reason is mandatory and goes back to the supervisor.

### 5.4 Spec sheet / material confirmation — *the "catalog" step*

This was the piece flagged as unclear. Here is what it is in the trade, and what to build.

**What it is.** After the price is agreed but before metal is cut, the fabricator and
customer confirm the *physical specification* — not the price. Industry sources on
fenestration procurement are consistent that glass build-up, hardware grade, finish
colour code and gloss level, and the profile system are the four specs that must be
locked before production, and that leaving them open until after quotation is the
single most common cause of rework and cost disputes. In commercial projects this is
formalised as a submittal package or Good-For-Construction drawings, where the rule is
absolute: no approved submittal, no fabrication. At Arif's retail scale the same
function is served by a one-page selection sheet the customer signs off — and by Arif
reviewing what his team is about to buy.

**So it is doing two jobs at once, and both matter to Arif:**
1. *Customer-facing:* "this is exactly the glass, the shade, the handle you're getting" —
   kills the "this isn't what I chose" argument at installation.
2. *Owner-facing:* it is the **bill of materials**. When Arif "comments on the catalog
   before the build starts," he is checking what his team is about to spend money on —
   quantity of profile, glass sheets, hardware sets, whether it can come from existing
   stock, and whether the vendor is the right one.

**Build it as:** a `spec_sheet` generated from the accepted quote, one row per item,
carrying the spec fields already captured plus a `material_notes` field. Three states:
`draft` → `owner_reviewed` (Arif comments) → `customer_confirmed`. It appears on the
same customer link as a "Confirm your selections" step between acceptance and build
start. Owner comments are internal and never shown to the customer.

**Keep it lightweight in the MVP.** Build the data model and one screen. Do not build
a product catalogue with images. *This is the area to re-interview Arif on — see §12.*

### 5.5 Job tracking (the customer link)

On advance payment recorded → `job` auto-created from the quote with a stage checklist.

**Default stages** (make them a configurable template, not hardcoded):

| # | Stage | Customer sees | Internal only |
|---|---|---|---|
| 1 | Advance received | ✅ | |
| 2 | Material procurement | ✅ | vendor, PO amount |
| 3 | Cutting | ✅ | |
| 4 | Fitting / assembly | ✅ | |
| 5 | Powder coating | ✅ | outsourced? vendor, expected return |
| 6 | Glazing | ✅ | |
| 7 | Quality check | ❌ | |
| 8 | Ready for delivery | ✅ | |
| 9 | Out for delivery | ✅ | driver name + mobile |
| 10 | Delivered | ✅ | POD photo |
| 11 | Installed | ✅ | |
| 12 | Balance settled / closed | ✅ | |

Each stage: `status` (pending / in_progress / done / blocked), `started_at`,
`completed_at`, `updated_by`, `notes`, `photos[]`.

**Blocked** is a first-class state, not a note. `blocked_reason` is an enum:
`awaiting_payment` · `material_unavailable` · `vendor_delay` · `labour_shortage` ·
`customer_hold` · `site_not_ready` · `other`. This enum is what powers Arif's dashboard
drill-down. Get it right.

**Customer page** (`/track/[token]`): vertical timeline, current stage highlighted,
promised delivery date, amount paid vs balance, a "Call us" button. No login, no PII
beyond their own. Token is a random 32-char slug, not a sequential ID.

**Delivery handoff:** on "Ready for delivery", the supervisor taps *Dispatch*, enters
the driver's mobile, and the app opens WhatsApp with a prefilled message containing a
tokenised link to `/delivery/[token]` — job number, customer name and phone, site
address, a Google Maps link from the stored coordinates, and item list with counts.
The driver taps **Delivered**, optionally uploads a photo. No driver login, no app.

### 5.6 Owner dashboard

Above the fold, four tiles:

- **This week / This month** toggle
- `Jobs active` · `Completed` · `Pending` · `Blocked` (blocked in red, always)
- `₹ collected this month` · `₹ outstanding`
- `Quotes awaiting my approval` (badge)

Below: **"Needs your attention"** — a single ranked list, not five separate tables:

1. Blocked jobs, newest blocker first, with the reason in plain words
   → *"Meethal house — waiting for balance ₹42,000 since 6 days"* → tap → customer
   name, phone, one-tap call, one-tap WhatsApp reminder
2. Quotes pending approval, oldest first
3. Jobs past their promised delivery date
4. Quotes sent >7 days ago with no customer response

Then: **All jobs** table — filterable by status, supervisor, date range, blocked reason.

Design rule: Arif should be able to answer *"what is stuck and why"* in one screen and
one tap. If he needs a second tap to find the phone number of the person he must call,
the screen has failed.

### 5.7 Vendor / dealer book

Arif collects supplier contacts at trade exhibitions and keeps them in cards, his phone,
and his head. Give him a searchable directory he can add to *while standing at a stall*.

**Fields:** company, contact person, mobile (multi), WhatsApp, email, city/state,
`categories[]` (multi-select tag), products supplied (free text), price notes,
`met_at` (exhibition/event name), `met_on` (date), `card_photo`, `rating` (1–5), notes.

**Category seed list** — these are the actual purchase categories for this trade:

```
Aluminium profiles / sections · uPVC profiles · Glass — plain & tinted ·
Glass — toughened · Glass — DGU/insulated · Mirrors · Hardware — handles & locks ·
Hardware — hinges · Hardware — rollers & channels · Hardware — sliding systems ·
Screws & fasteners · Gaskets & weatherstrips · Sealants & silicone ·
Mosquito mesh · ACP sheets · Powder coating services · Anodizing services ·
Machinery & tools · Adhesives · Packing materials · Transport / logistics
```

**Search** must be one box that hits company, person, products and categories at once.
Arif types "hinge" and gets every hinge supplier. Postgres `tsvector` over the
concatenated fields, plus category chips as filters.

**Add-vendor screen must be 15 seconds:** photograph the visiting card → type company
name → pick one category → save. Everything else optional, fill in later. If adding a
vendor takes longer than pocketing the card, he'll pocket the card.

Result row: name, category chips, city, and a **call button + WhatsApp button** —
because the whole point is placing an order from the road.

---

## 6. Data model

```sql
profiles          id, name, phone, role, active
customers         id, name, mobile, alt_mobile, address, notes, created_at
sites             id, customer_id, label, lat, lng, captured_address

quotes            id, quote_no, customer_id, site_id, created_by, status,
                  subtotal, discount_type, discount_value, gst_pct, total,
                  advance_pct, advance_amount, lead_time_days, terms,
                  approved_by, approved_at, rejected_reason,
                  sent_at, accepted_at, public_token, created_at
quote_items       id, quote_id, item_type, opening_type, location_in_house,
                  width_mm, height_mm, quantity, sqft, system_series, glass_spec,
                  finish, finish_code, hardware, hardware_brand, mesh,
                  rate, amount, remarks, sort_order
quote_item_photos id, quote_item_id, storage_path, created_at
rate_history      id, customer_id, item_type, opening_type, system_series,
                  glass_spec, rate, quote_id, quoted_at

spec_sheets       id, quote_id, status, owner_comments, reviewed_at, confirmed_at
spec_sheet_items  id, spec_sheet_id, quote_item_id, material_notes,
                  estimated_qty, source (stock|purchase), vendor_id

jobs              id, job_no, quote_id, customer_id, site_id, status,
                  promised_date, actual_delivery_date, public_token,
                  assigned_supervisor, created_at
job_stages        id, job_id, stage_key, sequence, status, blocked_reason,
                  blocked_note, started_at, completed_at, updated_by, notes
job_stage_photos  id, job_stage_id, storage_path

payments          id, job_id, quote_id, type (advance|milestone|balance),
                  amount, mode (cash|upi|bank|cheque), reference,
                  received_on, recorded_by, notes

deliveries        id, job_id, driver_name, driver_mobile, public_token,
                  dispatched_at, delivered_at, pod_photo_path, notes

vendors           id, company, contact_person, mobile, alt_mobile, whatsapp,
                  email, city, state, categories[], products, price_notes,
                  met_at, met_on, card_photo_path, rating, notes, created_by
vendor_categories id, name, sort_order

settings          id (singleton), approval_mode, threshold_amount,
                  discount_threshold_pct, notify_owner_always,
                  min_billable_sqft, default_gst_pct, default_advance_pct,
                  business_name, gstin, address, phone, logo_path

activity_log      id, entity_type, entity_id, action, actor_id, meta jsonb, created_at
```

**RLS:** owner sees all. Supervisor sees own quotes + assigned jobs. Public token
routes bypass auth via server-side lookup only — never expose the tables to `anon`.

---

## 7. Routes

```
/login
/                              → role-based redirect

# Supervisor (mobile)
/quotes/new                    → wizard
/quotes                        → my quotes
/quotes/[id]
/jobs                          → assigned jobs
/jobs/[id]                     → stage updates, record payment, dispatch
/vendors                       → search + add

# Owner (desktop + mobile)
/dashboard
/approvals
/approvals/[quoteId]
/jobs                          → all jobs, filters
/jobs/[id]
/customers
/vendors
/rates                         → rate card master
/settings

# Public — no auth
/q/[token]                     → customer quote view + accept
/track/[token]                 → customer job tracker
/spec/[token]                  → customer spec confirmation
/delivery/[token]              → driver view + mark delivered
```

---

## 8. Build order

Ship each step working before starting the next. Do not build ahead.

1. **Scaffold** — Next.js + Tailwind + shadcn + Supabase client, auth, role redirect,
   dev role-switcher
2. **Schema + seed** — full migration, RLS, and realistic Kerala seed data
   (see §11)
3. **Quote wizard** — the four screens, photo upload, area maths, quote number
4. **Approval inbox + settings toggle** — §5.3 in full
5. **Public quote page + accept** — `/q/[token]`, WhatsApp send button
6. **Payment recording → job auto-creation → stage engine**
7. **Public tracker** — `/track/[token]`
8. **Owner dashboard** — tiles + "Needs your attention"
9. **Delivery handoff** — driver WhatsApp link + `/delivery/[token]`
10. **Vendor book** — search, add, call/WhatsApp buttons
11. **Spec sheet** — minimal version, §5.4
12. **Polish** — empty states, loading skeletons, error toasts, PDF export

Steps 1–8 are the demo. 9–12 are bonus if time allows.

---

## 9. WhatsApp — deliberate MVP decision

**Use `wa.me` deep links. Do not integrate the WhatsApp Business API.**

```ts
const url = `https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`
```

This opens WhatsApp on the sender's own phone with the message prefilled. Zero cost,
zero setup, works today. The user taps send. For a demo this is indistinguishable from
automation and it is honest — nothing is faked.

The API path requires a Meta Business account, a WABA, a dedicated number, a BSP, and
template approval — days of setup, and templates get rejected. Not a prototype activity.

**For the Phase 2 conversation with Arif, the economics:** Meta's India list rate for a
utility template — order confirmations, delivery updates, exactly this use case — sits
around ₹0.115 per delivered message, against roughly ₹0.86 for marketing messages.
Note one change worth flagging to him: from 1 October 2026 utility and service messages
sent inside the 24-hour customer service window stop being free and become chargeable
at that same utility rate. BSP platform fees sit on top, typically a flat monthly plan.

At Arif's volume — say 30 jobs a month × 6 notifications — that is under ₹25 a month in
Meta fees. The cost is the BSP subscription, not the messages. Say so plainly; it
removes his biggest objection to automated updates.

---

## 10. Explicitly out of scope

Do not build these. If they appear, cut them.

- Inventory / stock management (Arif is a retail fabricator — deferred to Phase 2)
- Accounting, Tally integration, GST filing
- Purchase orders to vendors (vendor book is a *directory*, not a procurement system)
- Payroll, attendance, labour costing
- Online payment gateway (payments are recorded, not collected)
- Native mobile apps
- Offline mode (flag as a real Phase 2 need — Wayanad network is unreliable)
- Multi-branch
- Malayalam translation (prepare the string layer, don't translate yet)

---

## 11. Seed data for the demo

Make it look like his business, not a template. Suggested:

- 3 users: Arif (owner), Shafeeq + Jaseem (supervisors)
- 12 customers with Malayali names and Wayanad locations — Kalpetta, Meppadi,
  Sultan Bathery, Mananthavady, Panamaram
- 8 quotes: 2 pending approval, 3 approved & sent, 2 accepted, 1 rejected
- 6 live jobs spread across different stages, of which **2 blocked** — one on
  `awaiting_payment`, one on `material_unavailable`
- 1 job past its promised delivery date
- 25 vendors across at least 10 categories, several tagged to Kerala trade fairs

**Rates: leave the rate card as clearly-marked placeholders.** Do not invent numbers
and present them to Arif as if they're real — he will spot it in three seconds and it
costs credibility. Better: an empty rate card that Bala fills in *with Arif during the
demo*. That turns the demo into a working session and gets him invested.

---

## 12. Open questions — resolve with Arif before or during the demo

Ordered by how much they change the build.

1. **The spec sheet / "catalog" step.** Who currently produces it, what does it
   physically look like today, and is Arif's comment aimed at the *customer's choices*
   or at *what his team is about to purchase*? The answer decides whether §5.4 becomes
   a light confirmation screen or the seed of a procurement module.
2. **Installation.** The notes stop at delivery. Who installs — his team or the
   customer's mason? If it's his team, installation is a stage with its own scheduling
   and it belongs on the tracker.
3. **Minimum billable area per shutter** — his actual figure.
4. **Payment structure** — is it always 50/50, or advance / on-delivery / on-installation?
   Does he take 100% before delivery?
5. **Supervisor count** and whether they work exclusively for him or on commission.
   Changes the role model.
6. **Powder coating** — in-house or outsourced? If outsourced, it's a stage with an
   external dependency and a vendor attached, which is a different tracking problem.
7. **Existing paperwork** — does he currently use Tally, a printed quotation book,
   Excel? Whatever it is, the quote PDF should resemble it.
8. **Does he want the customer to see rates on the tracker**, or only status?
9. **Who owns the phone number** the WhatsApp messages go from — his, or each
   supervisor's? Affects Phase 2 architecture materially.

---

## 13. Demo-day notes for Bala

- Open on **his** phone, not your laptop. The supervisor flow is a phone product.
- Run the full chain live: create a quote for a fictitious Kalpetta house, approve it
  as Arif, open the customer link on a second phone, accept, advance the stages.
- Land the dashboard last and let it sit on screen. The blocked-job drill-down is the
  moment the value becomes obvious.
- Fill the rate card in with him. Don't present rates *to* him.
- The delivery WhatsApp handoff is the "oh, that's clever" moment — save it.
- Don't demo the spec sheet. Ask about it instead. Turn the weakest part of the spec
  into the smartest question in the room.
