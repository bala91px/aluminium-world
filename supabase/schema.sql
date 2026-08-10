-- ALUMINIUM WORLD — MVP schema
-- Paste this whole file into Supabase SQL Editor and run once, top to bottom.
-- Prototype/demo build. Not production. Not for real customer data.
--
-- AUTH MODEL (demo-only, see README-DEMO.md):
-- This app uses Supabase Anonymous Sign-ins, not email/password. Each device
-- gets a stable anonymous auth.uid() the first time it opens the app; tapping
-- a name in the login screen upserts that device's OWN profiles row with the
-- chosen name/role. Anyone can self-select "owner" this way — that is fine for
-- a gated demo (NEXT_PUBLIC_DEMO_MODE) shown only to Bala and Arif, but this
-- is NOT real access control and must be replaced before any real rollout.
-- Enable it once in the dashboard: Authentication → Providers → Anonymous → On.

create extension if not exists pgcrypto;

-- ============================================================================
-- ENUMS
-- ============================================================================

create type role_t as enum ('owner', 'supervisor', 'workshop');
create type enquiry_source_t as enum ('phone_call', 'walk_in', 'referral', 'whatsapp', 'other');
create type enquiry_status_t as enum ('new', 'assigned', 'site_visit_scheduled', 'converted');
create type quote_status_t as enum ('draft', 'pending_approval', 'approved', 'rejected', 'sent', 'accepted');
create type item_type_t as enum ('window', 'door', 'partition', 'glass_railing', 'shower_cubicle', 'mosquito_mesh', 'other');
create type opening_type_t as enum ('sliding_2_track', 'sliding_3_track', 'openable', 'fixed', 'top_hung', 'sliding_folding');
create type glass_spec_t as enum ('5mm_clear', '5mm_tinted', '6mm_toughened', '8mm_toughened', 'frosted', 'dgu');
create type finish_t as enum ('powder_coated', 'anodized', 'wooden_finish', 'mill_finish');
create type hardware_t as enum ('standard', 'premium');
create type discount_type_t as enum ('amount', 'percent');
create type spec_sheet_status_t as enum ('draft', 'owner_reviewed', 'customer_confirmed');
create type material_source_t as enum ('stock', 'purchase');
create type job_status_t as enum ('active', 'completed', 'cancelled');
create type stage_key_t as enum ('advance_received', 'material_procurement', 'cutting', 'fitting', 'powder_coating', 'glazing', 'quality_check', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'installed', 'closed');
create type stage_status_t as enum ('pending', 'in_progress', 'done', 'blocked');
create type blocked_reason_t as enum ('awaiting_payment', 'material_unavailable', 'vendor_delay', 'labour_shortage', 'customer_hold', 'site_not_ready', 'other');
create type payment_type_t as enum ('advance', 'milestone', 'balance');
create type payment_mode_t as enum ('cash', 'upi', 'bank', 'cheque');
create type approval_mode_t as enum ('always', 'threshold', 'never');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Not FK'd to auth.users on purpose: seed rows for Arif/Shafeeq/Jaseem are
-- inserted directly with fixed UUIDs (no real auth user behind them yet).
-- Live sessions create their OWN profile row at id = auth.uid() on first
-- "tap your name" — see ensureAnonymousSession() in demo-auth.ts. Owner role
-- checks match on ANY row with that auth.uid() + role='owner', so it doesn't
-- matter that a live Arif session and the seeded Arif row are different rows.
create table profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  role role_t not null default 'supervisor',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table enquiries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_mobile text not null,
  source enquiry_source_t not null default 'phone_call',
  rough_need text,
  assigned_supervisor uuid references profiles(id),
  status enquiry_status_t not null default 'new',
  converted_quote_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text not null,
  alt_mobile text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

create table sites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  label text not null,
  lat double precision,
  lng double precision,
  captured_address text,
  created_at timestamptz not null default now()
);

create table quote_seq (
  financial_year text primary key,
  last_value integer not null default 0
);

create table job_seq (
  financial_year text primary key,
  last_value integer not null default 0
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  quote_no text unique not null,
  customer_id uuid not null references customers(id),
  site_id uuid not null references sites(id),
  created_by uuid references profiles(id),
  status quote_status_t not null default 'draft',
  subtotal numeric(12,2) not null default 0,
  discount_type discount_type_t,
  discount_value numeric(12,2) not null default 0,
  gst_pct numeric(5,2) not null default 18,
  total numeric(12,2) not null default 0,
  advance_pct numeric(5,2) not null default 50,
  advance_amount numeric(12,2) not null default 0,
  lead_time_days integer not null default 14,
  terms text,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  rejected_reason text,
  sent_at timestamptz,
  accepted_at timestamptz,
  public_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

alter table enquiries add constraint enquiries_converted_quote_fk
  foreign key (converted_quote_id) references quotes(id);

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  item_type item_type_t not null,
  opening_type opening_type_t not null,
  location_in_house text not null default '',
  width_mm integer not null,
  height_mm integer not null,
  quantity integer not null default 1,
  sqft numeric(10,2) not null,
  system_series text not null default '',
  glass_spec glass_spec_t not null,
  finish finish_t not null,
  finish_code text,
  hardware hardware_t not null default 'standard',
  hardware_brand text,
  mesh boolean not null default false,
  rate numeric(10,2) not null default 0,
  amount numeric(12,2) not null default 0,
  remarks text,
  sort_order integer not null default 0
);

create table quote_item_photos (
  id uuid primary key default gen_random_uuid(),
  quote_item_id uuid not null references quote_items(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table rate_history (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  item_type item_type_t not null,
  opening_type opening_type_t not null,
  system_series text not null default '',
  glass_spec glass_spec_t not null,
  rate numeric(10,2) not null,
  quote_id uuid references quotes(id),
  quoted_at timestamptz not null default now()
);

create table spec_sheets (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  status spec_sheet_status_t not null default 'draft',
  owner_comments text,
  reviewed_at timestamptz,
  confirmed_at timestamptz
);

create table spec_sheet_items (
  id uuid primary key default gen_random_uuid(),
  spec_sheet_id uuid not null references spec_sheets(id) on delete cascade,
  quote_item_id uuid not null references quote_items(id),
  material_notes text,
  estimated_qty text,
  source material_source_t not null default 'purchase',
  vendor_id uuid
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  job_no text unique not null,
  quote_id uuid not null references quotes(id),
  customer_id uuid not null references customers(id),
  site_id uuid not null references sites(id),
  status job_status_t not null default 'active',
  promised_date date,
  actual_delivery_date date,
  public_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  assigned_supervisor uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table job_stages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  stage_key stage_key_t not null,
  sequence integer not null,
  status stage_status_t not null default 'pending',
  customer_visible boolean not null default true,
  blocked_reason blocked_reason_t,
  blocked_note text,
  started_at timestamptz,
  completed_at timestamptz,
  updated_by uuid references profiles(id),
  notes text
);

create table job_stage_photos (
  id uuid primary key default gen_random_uuid(),
  job_stage_id uuid not null references job_stages(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id),
  quote_id uuid references quotes(id),
  type payment_type_t not null,
  amount numeric(12,2) not null,
  mode payment_mode_t not null default 'cash',
  reference text,
  received_on date not null default current_date,
  recorded_by uuid references profiles(id),
  notes text
);

create table deliveries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  driver_name text not null,
  driver_mobile text not null,
  public_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  dispatched_at timestamptz,
  delivered_at timestamptz,
  pod_photo_path text,
  notes text
);

create table vendor_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order integer not null default 0
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact_person text,
  mobile text not null,
  alt_mobile text,
  whatsapp text,
  email text,
  city text,
  state text default 'Kerala',
  categories text[] not null default '{}',
  products text,
  price_notes text,
  met_at text,
  met_on date,
  card_photo_path text,
  rating smallint check (rating between 1 and 5),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  search tsvector generated always as (
    to_tsvector('english',
      coalesce(company,'') || ' ' || coalesce(contact_person,'') || ' ' ||
      coalesce(products,'') || ' ' || array_to_string(categories, ' ')
    )
  ) stored
);
create index vendors_search_idx on vendors using gin(search);

create table settings (
  id integer primary key default 1,
  approval_mode approval_mode_t not null default 'always',
  threshold_amount numeric(12,2) not null default 100000,
  discount_threshold_pct numeric(5,2) not null default 10,
  notify_owner_always boolean not null default true,
  min_billable_sqft numeric(6,2) not null default 10,
  default_gst_pct numeric(5,2) not null default 18,
  default_advance_pct numeric(5,2) not null default 50,
  business_name text not null default 'Aluminium World',
  gstin text,
  address text default 'Bypass Road, Kalpetta, Wayanad',
  phone text,
  logo_path text,
  constraint settings_singleton check (id = 1)
);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_id uuid references profiles(id),
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- SEQUENCE GENERATORS
-- ============================================================================

create or replace function current_fy() returns text
language sql immutable as $$
  select case
    when extract(month from current_date) >= 4
      then extract(year from current_date)::text || '-' || lpad(((extract(year from current_date)::int + 1) % 100)::text, 2, '0')
    else (extract(year from current_date)::int - 1)::text || '-' || lpad((extract(year from current_date)::int % 100)::text, 2, '0')
  end;
$$;

create or replace function next_quote_no() returns text
language plpgsql as $$
declare
  fy text := current_fy();
  n integer;
begin
  insert into quote_seq (financial_year, last_value) values (fy, 1)
    on conflict (financial_year) do update set last_value = quote_seq.last_value + 1
    returning last_value into n;
  return 'AW/Q/' || fy || '/' || lpad(n::text, 4, '0');
end;
$$;

create or replace function next_job_no() returns text
language plpgsql as $$
declare
  fy text := current_fy();
  n integer;
begin
  insert into job_seq (financial_year, last_value) values (fy, 1)
    on conflict (financial_year) do update set last_value = job_seq.last_value + 1
    returning last_value into n;
  return 'AW/J/' || fy || '/' || lpad(n::text, 4, '0');
end;
$$;

-- Default stage template applied to every new job.
create or replace function create_default_job_stages(p_job_id uuid) returns void
language plpgsql as $$
begin
  insert into job_stages (job_id, stage_key, sequence, customer_visible) values
    (p_job_id, 'advance_received', 1, true),
    (p_job_id, 'material_procurement', 2, true),
    (p_job_id, 'cutting', 3, true),
    (p_job_id, 'fitting', 4, true),
    (p_job_id, 'powder_coating', 5, true),
    (p_job_id, 'glazing', 6, true),
    (p_job_id, 'quality_check', 7, false),
    (p_job_id, 'ready_for_delivery', 8, true),
    (p_job_id, 'out_for_delivery', 9, true),
    (p_job_id, 'delivered', 10, true),
    (p_job_id, 'installed', 11, true),
    (p_job_id, 'closed', 12, true);
end;
$$;

-- Column defaults so a plain client-side insert (no explicit RPC round-trip)
-- still gets a sequential quote/job number for free.
alter table quotes alter column quote_no set default next_quote_no();
alter table jobs alter column job_no set default next_job_no();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table profiles enable row level security;
alter table enquiries enable row level security;
alter table customers enable row level security;
alter table sites enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table quote_item_photos enable row level security;
alter table rate_history enable row level security;
alter table spec_sheets enable row level security;
alter table spec_sheet_items enable row level security;
alter table jobs enable row level security;
alter table job_stages enable row level security;
alter table job_stage_photos enable row level security;
alter table payments enable row level security;
alter table deliveries enable row level security;
alter table vendors enable row level security;
alter table vendor_categories enable row level security;
alter table settings enable row level security;
alter table activity_log enable row level security;

create or replace function current_role_is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'owner');
$$;

-- profiles: a signed-in device manages only its own row; owner reads everyone.
create policy profiles_self_upsert on profiles for insert to authenticated
  with check (id = auth.uid());
create policy profiles_self_update on profiles for update to authenticated
  using (id = auth.uid());
create policy profiles_read on profiles for select to authenticated
  using (id = auth.uid() or current_role_is_owner());

-- Everything below: owner reads/writes all; supervisor reads/writes what they touch.
-- This is a demo-scale policy set, not a full production authorization model.
create policy enquiries_all on enquiries for all to authenticated
  using (current_role_is_owner() or created_by = auth.uid() or assigned_supervisor = auth.uid())
  with check (current_role_is_owner() or created_by = auth.uid());

create policy customers_all on customers for all to authenticated using (true) with check (true);
create policy sites_all on sites for all to authenticated using (true) with check (true);

create policy quotes_select on quotes for select to authenticated
  using (current_role_is_owner() or created_by = auth.uid());
create policy quotes_insert on quotes for insert to authenticated
  with check (created_by = auth.uid());
create policy quotes_update on quotes for update to authenticated
  using (current_role_is_owner() or created_by = auth.uid());

create policy quote_items_all on quote_items for all to authenticated
  using (exists (select 1 from quotes q where q.id = quote_id and (current_role_is_owner() or q.created_by = auth.uid())))
  with check (exists (select 1 from quotes q where q.id = quote_id and (current_role_is_owner() or q.created_by = auth.uid())));

create policy quote_item_photos_all on quote_item_photos for all to authenticated
  using (exists (select 1 from quote_items qi join quotes q on q.id = qi.quote_id where qi.id = quote_item_id and (current_role_is_owner() or q.created_by = auth.uid())));

create policy rate_history_read on rate_history for select to authenticated using (true);
create policy rate_history_write on rate_history for insert to authenticated with check (true);

create policy spec_sheets_all on spec_sheets for all to authenticated using (true) with check (true);
create policy spec_sheet_items_all on spec_sheet_items for all to authenticated using (true) with check (true);

create policy jobs_select on jobs for select to authenticated
  using (current_role_is_owner() or assigned_supervisor = auth.uid());
create policy jobs_write on jobs for all to authenticated
  using (current_role_is_owner() or assigned_supervisor = auth.uid())
  with check (current_role_is_owner() or assigned_supervisor = auth.uid());

create policy job_stages_all on job_stages for all to authenticated
  using (exists (select 1 from jobs j where j.id = job_id and (current_role_is_owner() or j.assigned_supervisor = auth.uid())));

create policy job_stage_photos_all on job_stage_photos for all to authenticated
  using (exists (select 1 from job_stages js join jobs j on j.id = js.job_id where js.id = job_stage_id and (current_role_is_owner() or j.assigned_supervisor = auth.uid())));

create policy payments_all on payments for all to authenticated using (true) with check (true);
create policy deliveries_all on deliveries for all to authenticated using (true) with check (true);

create policy vendors_all on vendors for all to authenticated using (true) with check (true);
create policy vendor_categories_read on vendor_categories for select to authenticated using (true);

create policy settings_read on settings for select to authenticated using (true);
create policy settings_write on settings for update to authenticated using (current_role_is_owner());

create policy activity_log_all on activity_log for all to authenticated using (true) with check (true);

-- ============================================================================
-- PUBLIC ACCESS — token-gated RPCs only. No table is exposed to `anon`.
-- Each function is SECURITY DEFINER and returns only the fields a customer
-- or driver should see (no vendor names, PO amounts, owner comments, or the
-- internal-only quality_check stage).
-- ============================================================================

create or replace function get_public_quote(p_token text)
returns table (
  quote_no text, status quote_status_t, subtotal numeric, discount_type discount_type_t,
  discount_value numeric, gst_pct numeric, total numeric, advance_pct numeric,
  advance_amount numeric, lead_time_days integer, terms text, customer_name text,
  site_label text, business_name text, business_phone text, business_address text
)
language sql security definer set search_path = public as $$
  select q.quote_no, q.status, q.subtotal, q.discount_type, q.discount_value, q.gst_pct,
         q.total, q.advance_pct, q.advance_amount, q.lead_time_days, q.terms,
         c.name, s.label, st.business_name, st.phone, st.address
  from quotes q
  join customers c on c.id = q.customer_id
  join sites s on s.id = q.site_id
  cross join settings st
  where q.public_token = p_token;
$$;

create or replace function get_public_quote_items(p_token text)
returns table (
  item_type item_type_t, opening_type opening_type_t, location_in_house text,
  width_mm integer, height_mm integer, quantity integer, sqft numeric,
  glass_spec glass_spec_t, finish finish_t, hardware hardware_t, mesh boolean, amount numeric
)
language sql security definer set search_path = public as $$
  select qi.item_type, qi.opening_type, qi.location_in_house, qi.width_mm, qi.height_mm,
         qi.quantity, qi.sqft, qi.glass_spec, qi.finish, qi.hardware, qi.mesh, qi.amount
  from quote_items qi
  join quotes q on q.id = qi.quote_id
  where q.public_token = p_token
  order by qi.sort_order;
$$;

create or replace function accept_public_quote(p_token text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update quotes set status = 'accepted', accepted_at = now()
  where public_token = p_token and status in ('sent', 'approved');
  return found;
end;
$$;

create or replace function get_public_job(p_token text)
returns table (
  job_no text, promised_date date, customer_name text, site_label text,
  total numeric, paid numeric
)
language sql security definer set search_path = public as $$
  select j.job_no, j.promised_date, c.name, s.label, q.total,
         coalesce((select sum(p.amount) from payments p where p.job_id = j.id), 0)
  from jobs j
  join customers c on c.id = j.customer_id
  join sites s on s.id = j.site_id
  join quotes q on q.id = j.quote_id
  where j.public_token = p_token;
$$;

create or replace function get_public_job_stages(p_token text)
returns table (
  stage_key stage_key_t, sequence integer, status stage_status_t,
  blocked_reason blocked_reason_t, completed_at timestamptz
)
language sql security definer set search_path = public as $$
  select js.stage_key, js.sequence, js.status, js.blocked_reason, js.completed_at
  from job_stages js
  join jobs j on j.id = js.job_id
  where j.public_token = p_token and js.customer_visible = true
  order by js.sequence;
$$;

create or replace function get_public_delivery(p_token text)
returns table (
  job_no text, customer_name text, customer_mobile text, site_label text,
  lat double precision, lng double precision, driver_name text, delivered_at timestamptz
)
language sql security definer set search_path = public as $$
  select j.job_no, c.name, c.mobile, s.label, s.lat, s.lng, d.driver_name, d.delivered_at
  from deliveries d
  join jobs j on j.id = d.job_id
  join customers c on c.id = j.customer_id
  join sites s on s.id = j.site_id
  where d.public_token = p_token;
$$;

create or replace function mark_delivered(p_token text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update deliveries set delivered_at = now() where public_token = p_token;
  update job_stages set status = 'done', completed_at = now()
  where job_id = (select job_id from deliveries where public_token = p_token)
    and stage_key = 'delivered';
  return found;
end;
$$;

revoke all on all tables in schema public from anon;
grant execute on function
  get_public_quote, get_public_quote_items, accept_public_quote,
  get_public_job, get_public_job_stages, get_public_delivery, mark_delivered
  to anon;

-- ============================================================================
-- DEFAULT SETTINGS ROW
-- ============================================================================

insert into settings (id) values (1) on conflict (id) do nothing;
