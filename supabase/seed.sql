-- ALUMINIUM WORLD — demo seed data
-- Run AFTER schema.sql. Fictional data only — do not present these rates to
-- Arif as real numbers. The rate card is intentionally empty; fill it in
-- with him live. This seed exists so the dashboard, approvals inbox and
-- rate-memory hint have something to show before the first live quote.
-- Safe to re-run: every insert is keyed on a fixed UUID with ON CONFLICT DO NOTHING.

-- ============================================================================
-- PROFILES
-- ============================================================================

insert into profiles (id, name, phone, role) values
  ('a1000000-0000-4000-8000-000000000001', 'Arif',    '9744100001', 'owner'),
  ('a1000000-0000-4000-8000-000000000002', 'Shafeeq', '9744100002', 'supervisor'),
  ('a1000000-0000-4000-8000-000000000003', 'Jaseem',  '9744100003', 'supervisor')
on conflict (id) do nothing;

-- ============================================================================
-- CUSTOMERS + SITES
-- ============================================================================

insert into customers (id, name, mobile, address) values
  ('c0000000-0000-4000-8000-000000000001', 'Rasheed',        '9846000001', 'Near Bus Stand, Kalpetta'),
  ('c0000000-0000-4000-8000-000000000002', 'Sabitha',        '9846000002', 'Meppadi Town'),
  ('c0000000-0000-4000-8000-000000000003', 'Noufal',         '9846000003', 'Sultan Bathery'),
  ('c0000000-0000-4000-8000-000000000004', 'Rincy Thomas',   '9846000004', 'Mananthavady'),
  ('c0000000-0000-4000-8000-000000000005', 'Aboobacker',     '9846000005', 'Panamaram'),
  ('c0000000-0000-4000-8000-000000000006', 'Sherin K',       '9846000006', 'Kalpetta'),
  ('c0000000-0000-4000-8000-000000000007', 'Vinod Menon',    '9846000007', 'Meppadi'),
  ('c0000000-0000-4000-8000-000000000008', 'Fathima Beevi',  '9846000008', 'Sultan Bathery'),
  ('c0000000-0000-4000-8000-000000000009', 'Anoop Varghese', '9846000009', 'Mananthavady'),
  ('c0000000-0000-4000-8000-000000000010', 'Salini P',       '9846000010', 'Panamaram'),
  ('c0000000-0000-4000-8000-000000000011', 'Musthafa',       '9846000011', 'Kalpetta'),
  ('c0000000-0000-4000-8000-000000000012', 'Deepa Raj',      '9846000012', 'Meppadi')
on conflict (id) do nothing;

insert into sites (id, customer_id, label, lat, lng, captured_address) values
  ('51000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Rasheed house, Kalpetta',        11.6084, 76.0833, 'Kalpetta, Wayanad'),
  ('51000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 'Sabitha house, Meppadi',         11.5833, 76.0333, 'Meppadi, Wayanad'),
  ('51000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003', 'Noufal house, Sultan Bathery',   11.6500, 76.2667, 'Sultan Bathery, Wayanad'),
  ('51000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004', 'Rincy house, Mananthavady',      11.7833, 76.0000, 'Mananthavady, Wayanad'),
  ('51000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000005', 'Aboobacker house, Panamaram',    11.7167, 76.0500, 'Panamaram, Wayanad'),
  ('51000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000006', 'Sherin house, Kalpetta',         11.6100, 76.0800, 'Kalpetta, Wayanad'),
  ('51000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000007', 'Vinod house, Meppadi',           11.5820, 76.0350, 'Meppadi, Wayanad'),
  ('51000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000008', 'Fathima house, Sultan Bathery',  11.6480, 76.2650, 'Sultan Bathery, Wayanad'),
  ('51000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000009', 'Anoop house, Mananthavady',      11.7800, 76.0020, 'Mananthavady, Wayanad'),
  ('51000000-0000-4000-8000-000000000010', 'c0000000-0000-4000-8000-000000000010', 'Salini house, Panamaram',        11.7150, 76.0480, 'Panamaram, Wayanad'),
  ('51000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000011', 'Musthafa house, Kalpetta',       11.6070, 76.0810, 'Kalpetta, Wayanad'),
  ('51000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000012', 'Deepa house, Meppadi',           11.5810, 76.0340, 'Meppadi, Wayanad')
on conflict (id) do nothing;

-- ============================================================================
-- QUOTES + ITEMS
-- (8 featured: 2 pending_approval, 3 approved/sent, 2 accepted, 1 rejected —
--  plus 4 more already-accepted quotes purely to seed the 6 live jobs below)
-- ============================================================================

insert into quotes (id, quote_no, customer_id, site_id, created_by, status, subtotal, gst_pct, total, advance_pct, advance_amount, lead_time_days, terms, sent_at)
values
  ('q1000000-0000-4000-8000-000000000001', next_quote_no(), 'c0000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002', 'pending_approval', 38700, 18, 45666, 50, 22833, 14, 'Advance non-refundable. Delivery from advance receipt.', null),
  ('q1000000-0000-4000-8000-000000000002', next_quote_no(), 'c0000000-0000-4000-8000-000000000002', '51000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003', 'pending_approval', 52000, 18, 61360, 50, 30680, 18, 'Advance non-refundable. Delivery from advance receipt.', null)
on conflict (id) do nothing;

insert into quotes (id, quote_no, customer_id, site_id, created_by, status, subtotal, gst_pct, total, advance_pct, advance_amount, lead_time_days, terms, approved_by, approved_at, sent_at)
values
  ('q1000000-0000-4000-8000-000000000003', next_quote_no(), 'c0000000-0000-4000-8000-000000000003', '51000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002', 'sent', 29500, 18, 34810, 50, 17405, 12, 'Advance non-refundable.', 'a1000000-0000-4000-8000-000000000001', now() - interval '5 days', now() - interval '5 days'),
  ('q1000000-0000-4000-8000-000000000004', next_quote_no(), 'c0000000-0000-4000-8000-000000000004', '51000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000003', 'sent', 64000, 18, 75520, 50, 37760, 20, 'Advance non-refundable.', 'a1000000-0000-4000-8000-000000000001', now() - interval '9 days', now() - interval '9 days'),
  ('q1000000-0000-4000-8000-000000000005', next_quote_no(), 'c0000000-0000-4000-8000-000000000005', '51000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000002', 'sent', 41000, 18, 48380, 50, 24190, 15, 'Advance non-refundable.', 'a1000000-0000-4000-8000-000000000001', now() - interval '8 days', now() - interval '8 days'),
  ('q1000000-0000-4000-8000-000000000006', next_quote_no(), 'c0000000-0000-4000-8000-000000000006', '51000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000003', 'accepted', 47000, 18, 55460, 50, 27730, 14, 'Advance non-refundable.', 'a1000000-0000-4000-8000-000000000001', now() - interval '20 days', now() - interval '20 days'),
  ('q1000000-0000-4000-8000-000000000007', next_quote_no(), 'c0000000-0000-4000-8000-000000000007', '51000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000002', 'accepted', 58000, 18, 68440, 50, 34220, 16, 'Advance non-refundable.', 'a1000000-0000-4000-8000-000000000001', now() - interval '25 days', now() - interval '25 days'),
  ('q1000000-0000-4000-8000-000000000008', next_quote_no(), 'c0000000-0000-4000-8000-000000000008', '51000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000003', 'rejected', 36000, 18, 42480, 50, 21240, 14, 'Advance non-refundable.', null),
  ('q1000000-0000-4000-8000-000000000009', next_quote_no(), 'c0000000-0000-4000-8000-000000000009', '51000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000002', 'accepted', 33000, 18, 38940, 50, 19470, 12, 'Advance non-refundable.', 'a1000000-0000-4000-8000-000000000001', now() - interval '30 days', now() - interval '30 days'),
  ('q1000000-0000-4000-8000-000000000010', next_quote_no(), 'c0000000-0000-4000-8000-000000000010', '51000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000003', 'accepted', 27000, 18, 31860, 50, 15930, 12, 'Advance non-refundable.', 'a1000000-0000-4000-8000-000000000001', now() - interval '28 days', now() - interval '28 days'),
  ('q1000000-0000-4000-8000-000000000011', next_quote_no(), 'c0000000-0000-4000-8000-000000000011', '51000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000002', 'accepted', 49000, 18, 57820, 50, 28910, 18, 'Advance non-refundable.', 'a1000000-0000-4000-8000-000000000001', now() - interval '35 days', now() - interval '35 days'),
  ('q1000000-0000-4000-8000-000000000012', next_quote_no(), 'c0000000-0000-4000-8000-000000000012', '51000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000003', 'accepted', 61000, 18, 71980, 50, 35990, 20, 'Advance non-refundable.', 'a1000000-0000-4000-8000-000000000001', now() - interval '40 days', now() - interval '40 days')
on conflict (id) do nothing;

update quotes set status = 'rejected', rejected_reason = 'Customer wants tinted glass for full budget quoted — needs revised measurement.'
where id = 'q1000000-0000-4000-8000-000000000008';

update quotes set status = 'accepted', accepted_at = now() - interval '18 days'
where id in ('q1000000-0000-4000-8000-000000000006', 'q1000000-0000-4000-8000-000000000007',
             'q1000000-0000-4000-8000-000000000009', 'q1000000-0000-4000-8000-000000000010',
             'q1000000-0000-4000-8000-000000000011', 'q1000000-0000-4000-8000-000000000012');

insert into quote_items (quote_id, item_type, opening_type, location_in_house, width_mm, height_mm, quantity, sqft, system_series, glass_spec, finish, hardware, mesh, rate, amount, sort_order)
values
  ('q1000000-0000-4000-8000-000000000001', 'window', 'sliding_2_track', 'Bedroom 1', 1500, 1200, 2, 38.75, 'Domal', '5mm_tinted', 'powder_coated', 'standard', true, 600, 23250, 1),
  ('q1000000-0000-4000-8000-000000000001', 'door',   'sliding_2_track', 'Living room', 2100, 2100, 1, 47.46, 'Domal', '5mm_tinted', 'powder_coated', 'standard', false, 620, 29425, 2),

  ('q1000000-0000-4000-8000-000000000002', 'window', 'openable', 'Kitchen', 1200, 1200, 3, 46.53, 'Jindal', '5mm_clear', 'powder_coated', 'standard', true, 580, 26988, 1),
  ('q1000000-0000-4000-8000-000000000002', 'door',   'sliding_3_track', 'Balcony', 2400, 2100, 1, 54.24, 'Jindal', '6mm_toughened', 'powder_coated', 'premium', false, 640, 34714, 2),

  ('q1000000-0000-4000-8000-000000000003', 'window', 'sliding_2_track', 'Bedroom 2', 1500, 1200, 3, 58.13, 'Domal', '5mm_tinted', 'powder_coated', 'standard', true, 620, 36041, 1),

  ('q1000000-0000-4000-8000-000000000004', 'shower_cubicle', 'fixed', 'Bathroom 1', 900, 1900, 2, 36.85, 'Local', '8mm_toughened', 'anodized', 'premium', false, 850, 31323, 1),
  ('q1000000-0000-4000-8000-000000000004', 'window', 'sliding_2_track', 'Hall', 1800, 1200, 2, 46.51, 'Domal', '5mm_tinted', 'powder_coated', 'standard', true, 610, 28371, 2),

  ('q1000000-0000-4000-8000-000000000005', 'partition', 'fixed', 'Office room', 3000, 2400, 1, 77.51, 'Jindal', '5mm_clear', 'mill_finish', 'standard', false, 530, 41081, 1),

  ('q1000000-0000-4000-8000-000000000006', 'window', 'sliding_2_track', 'Bedroom 1', 1500, 1200, 2, 38.75, 'Domal', '5mm_tinted', 'powder_coated', 'standard', true, 605, 23444, 1),
  ('q1000000-0000-4000-8000-000000000006', 'door',   'openable', 'Kitchen', 900, 2100, 1, 20.36, 'Domal', '5mm_clear', 'powder_coated', 'standard', false, 600, 12216, 2),

  ('q1000000-0000-4000-8000-000000000007', 'glass_railing', 'fixed', 'Staircase', 4500, 1000, 1, 48.44, 'Local', '8mm_toughened', 'anodized', 'premium', false, 900, 43596, 1),

  ('q1000000-0000-4000-8000-000000000009', 'window', 'sliding_2_track', 'Bedroom 1', 1200, 1200, 3, 46.53, 'Domal', '5mm_tinted', 'powder_coated', 'standard', true, 590, 27453, 1),

  ('q1000000-0000-4000-8000-000000000010', 'mosquito_mesh', 'fixed', 'Whole house', 1500, 1200, 6, 116.24, 'Local', '5mm_clear', 'mill_finish', 'standard', true, 220, 25573, 1),

  ('q1000000-0000-4000-8000-000000000011', 'window', 'sliding_2_track', 'Bedroom 1', 1500, 1500, 3, 72.66, 'Jindal', '5mm_tinted', 'powder_coated', 'standard', true, 600, 43596, 1),

  ('q1000000-0000-4000-8000-000000000012', 'door', 'sliding_folding', 'Living room', 3000, 2100, 1, 67.85, 'Domal', '6mm_toughened', 'powder_coated', 'premium', false, 700, 47495, 1),

  ('q1000000-0000-4000-8000-000000000008', 'window', 'sliding_2_track', 'Bedroom 1', 1500, 1200, 2, 38.75, 'Local', '5mm_clear', 'powder_coated', 'standard', true, 560, 21700, 1)
on conflict do nothing;

-- ============================================================================
-- RATE HISTORY — derived from every approved+ quote's line items, so the
-- rate-memory hint on the wizard has real "last quoted" data to surface.
-- ============================================================================

insert into rate_history (customer_id, item_type, opening_type, system_series, glass_spec, rate, quote_id, quoted_at)
select q.customer_id, qi.item_type, qi.opening_type, qi.system_series, qi.glass_spec, qi.rate, q.id,
       coalesce(q.approved_at, q.sent_at, q.created_at)
from quote_items qi
join quotes q on q.id = qi.quote_id
where q.status in ('approved', 'sent', 'accepted')
  and q.id::text like 'q1000000-0000-4000-8000-%';

-- ============================================================================
-- ENQUIRIES — the pre-site-visit stage Bala added to the scope
-- ============================================================================

insert into enquiries (id, customer_name, customer_mobile, source, rough_need, assigned_supervisor, status, converted_quote_id, created_by, created_at) values
  ('e1000000-0000-4000-8000-000000000001', 'Bineesh K',   '9847000001', 'phone_call', '3 bedroom windows + 1 balcony door, sliding', null, 'new', null, 'a1000000-0000-4000-8000-000000000001', now() - interval '2 hours'),
  ('e1000000-0000-4000-8000-000000000002', 'Priya Menon', '9847000002', 'whatsapp',   'Wants a quote for a glass partition in the new office', 'a1000000-0000-4000-8000-000000000003', 'assigned', null, 'a1000000-0000-4000-8000-000000000001', now() - interval '1 day'),
  ('e1000000-0000-4000-8000-000000000003', 'Renjith C',   '9847000003', 'referral',   'Full house windows, referred by Rasheed', 'a1000000-0000-4000-8000-000000000002', 'site_visit_scheduled', null, 'a1000000-0000-4000-8000-000000000001', now() - interval '3 days'),
  ('e1000000-0000-4000-8000-000000000004', 'Anoop Varghese', '9846000009', 'phone_call', 'Bedroom windows, tinted glass', 'a1000000-0000-4000-8000-000000000002', 'converted', 'q1000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000001', now() - interval '31 days')
on conflict (id) do nothing;

-- ============================================================================
-- JOBS + STAGES + PAYMENTS (6 live jobs: 2 blocked, 1 overdue, 1 closed)
-- ============================================================================

insert into jobs (id, job_no, quote_id, customer_id, site_id, status, promised_date, actual_delivery_date, assigned_supervisor, created_at) values
  ('j1000000-0000-4000-8000-000000000001', next_job_no(), 'q1000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000006', '51000000-0000-4000-8000-000000000006', 'active',    '2026-08-18', null,         'a1000000-0000-4000-8000-000000000003', now() - interval '18 days'),
  ('j1000000-0000-4000-8000-000000000002', next_job_no(), 'q1000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000007', '51000000-0000-4000-8000-000000000007', 'active',    '2026-08-22', null,         'a1000000-0000-4000-8000-000000000002', now() - interval '22 days'),
  ('j1000000-0000-4000-8000-000000000003', next_job_no(), 'q1000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000009', '51000000-0000-4000-8000-000000000009', 'active',    '2026-08-25', null,         'a1000000-0000-4000-8000-000000000002', now() - interval '15 days'),
  ('j1000000-0000-4000-8000-000000000004', next_job_no(), 'q1000000-0000-4000-8000-000000000010', 'c0000000-0000-4000-8000-000000000010', '51000000-0000-4000-8000-000000000010', 'active',    '2026-08-20', null,         'a1000000-0000-4000-8000-000000000003', now() - interval '12 days'),
  ('j1000000-0000-4000-8000-000000000005', next_job_no(), 'q1000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000011', '51000000-0000-4000-8000-000000000011', 'active',    '2026-08-05', null,         'a1000000-0000-4000-8000-000000000002', now() - interval '30 days'),
  ('j1000000-0000-4000-8000-000000000006', next_job_no(), 'q1000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000012', '51000000-0000-4000-8000-000000000012', 'completed', '2026-07-20', '2026-07-25', 'a1000000-0000-4000-8000-000000000003', now() - interval '45 days')
on conflict (id) do nothing;

select create_default_job_stages('j1000000-0000-4000-8000-000000000001');
select create_default_job_stages('j1000000-0000-4000-8000-000000000002');
select create_default_job_stages('j1000000-0000-4000-8000-000000000003');
select create_default_job_stages('j1000000-0000-4000-8000-000000000004');
select create_default_job_stages('j1000000-0000-4000-8000-000000000005');
select create_default_job_stages('j1000000-0000-4000-8000-000000000006');

-- J1 Sherin — fitting in progress
update job_stages set status = 'done', completed_at = now() - interval '14 days'
  where job_id = 'j1000000-0000-4000-8000-000000000001' and stage_key in ('advance_received','material_procurement','cutting');
update job_stages set status = 'in_progress', started_at = now() - interval '2 days'
  where job_id = 'j1000000-0000-4000-8000-000000000001' and stage_key = 'fitting';

-- J2 Vinod — powder coating in progress (outsourced)
update job_stages set status = 'done', completed_at = now() - interval '15 days'
  where job_id = 'j1000000-0000-4000-8000-000000000002' and stage_key in ('advance_received','material_procurement','cutting','fitting');
update job_stages set status = 'in_progress', started_at = now() - interval '3 days', notes = 'Outsourced — Wayanad Powder Coaters, expected back in 4 days'
  where job_id = 'j1000000-0000-4000-8000-000000000002' and stage_key = 'powder_coating';

-- J3 Anoop — blocked, milestone payment awaited before cutting
update job_stages set status = 'done', completed_at = now() - interval '10 days'
  where job_id = 'j1000000-0000-4000-8000-000000000003' and stage_key in ('advance_received','material_procurement');
update job_stages set status = 'blocked', blocked_reason = 'awaiting_payment', blocked_note = 'Milestone payment ₹9,735 pending since 6 days', started_at = now() - interval '6 days'
  where job_id = 'j1000000-0000-4000-8000-000000000003' and stage_key = 'cutting';

-- J4 Salini — blocked, glass delayed from vendor
update job_stages set status = 'done', completed_at = now() - interval '8 days'
  where job_id = 'j1000000-0000-4000-8000-000000000004' and stage_key = 'advance_received';
update job_stages set status = 'blocked', blocked_reason = 'material_unavailable', blocked_note = 'Toughened glass sheets delayed from Kochi vendor', started_at = now() - interval '5 days'
  where job_id = 'j1000000-0000-4000-8000-000000000004' and stage_key = 'material_procurement';

-- J5 Musthafa — ready for delivery, past promised date
update job_stages set status = 'done', completed_at = now() - interval '9 days'
  where job_id = 'j1000000-0000-4000-8000-000000000005' and stage_key in ('advance_received','material_procurement','cutting','fitting','powder_coating','glazing','quality_check');
update job_stages set status = 'in_progress', started_at = now() - interval '6 days'
  where job_id = 'j1000000-0000-4000-8000-000000000005' and stage_key = 'ready_for_delivery';

-- J6 Deepa — fully closed
update job_stages set status = 'done', completed_at = now() - interval '20 days'
  where job_id = 'j1000000-0000-4000-8000-000000000006';

insert into payments (job_id, quote_id, type, amount, mode, received_on, recorded_by) values
  ('j1000000-0000-4000-8000-000000000001', 'q1000000-0000-4000-8000-000000000006', 'advance', 27730, 'upi',   current_date - 18, 'a1000000-0000-4000-8000-000000000003'),
  ('j1000000-0000-4000-8000-000000000002', 'q1000000-0000-4000-8000-000000000007', 'advance', 34220, 'bank',  current_date - 22, 'a1000000-0000-4000-8000-000000000002'),
  ('j1000000-0000-4000-8000-000000000003', 'q1000000-0000-4000-8000-000000000009', 'advance', 19470, 'cash',  current_date - 15, 'a1000000-0000-4000-8000-000000000002'),
  ('j1000000-0000-4000-8000-000000000004', 'q1000000-0000-4000-8000-000000000010', 'advance', 15930, 'upi',   current_date - 12, 'a1000000-0000-4000-8000-000000000003'),
  ('j1000000-0000-4000-8000-000000000005', 'q1000000-0000-4000-8000-000000000011', 'advance', 28910, 'bank',  current_date - 30, 'a1000000-0000-4000-8000-000000000002'),
  ('j1000000-0000-4000-8000-000000000006', 'q1000000-0000-4000-8000-000000000012', 'advance', 35990, 'upi',   current_date - 45, 'a1000000-0000-4000-8000-000000000003'),
  ('j1000000-0000-4000-8000-000000000006', 'q1000000-0000-4000-8000-000000000012', 'balance', 35990, 'upi',   current_date - 20, 'a1000000-0000-4000-8000-000000000003');

-- ============================================================================
-- VENDOR BOOK — 25 vendors across 12 categories
-- ============================================================================

insert into vendor_categories (name, sort_order) values
  ('Aluminium profiles / sections', 1), ('uPVC profiles', 2), ('Glass — plain & tinted', 3),
  ('Glass — toughened', 4), ('Glass — DGU/insulated', 5), ('Mirrors', 6),
  ('Hardware — handles & locks', 7), ('Hardware — hinges', 8), ('Hardware — rollers & channels', 9),
  ('Hardware — sliding systems', 10), ('Screws & fasteners', 11), ('Gaskets & weatherstrips', 12),
  ('Sealants & silicone', 13), ('Mosquito mesh', 14), ('ACP sheets', 15),
  ('Powder coating services', 16), ('Anodizing services', 17), ('Machinery & tools', 18),
  ('Adhesives', 19), ('Packing materials', 20), ('Transport / logistics', 21)
on conflict (name) do nothing;

insert into vendors (company, contact_person, mobile, city, categories, products, met_at, met_on, rating, created_by) values
  ('Domal Kerala Distributors',   'Suresh Kumar',  '9895100001', 'Kochi',      array['Aluminium profiles / sections'], 'Domal profile systems, all series', 'Kochi Build Expo 2025', '2025-11-12', 5, 'a1000000-0000-4000-8000-000000000001'),
  ('Jindal Aluminium Depot',      'Manoj Pillai',  '9895100002', 'Kozhikode',  array['Aluminium profiles / sections'], 'Jindal sections, coils', 'Fenestration Expo Bangalore', '2025-09-03', 4, 'a1000000-0000-4000-8000-000000000001'),
  ('Hindalco Direct Kerala',      'Ratheesh Nair', '9895100003', 'Kochi',      array['Aluminium profiles / sections'], 'Hindalco extrusions', null, null, 4, 'a1000000-0000-4000-8000-000000000001'),
  ('Wayanad uPVC Traders',        'Ajmal Rahman',  '9895100004', 'Kalpetta',   array['uPVC profiles'], 'uPVC window/door profiles', null, null, 3, 'a1000000-0000-4000-8000-000000000002'),
  ('Malabar Glass House',         'Shibu Thomas',  '9895100005', 'Kozhikode',  array['Glass — plain & tinted','Glass — toughened'], 'Plain, tinted, toughened glass — all thickness', 'Kochi Build Expo 2025', '2025-11-12', 5, 'a1000000-0000-4000-8000-000000000001'),
  ('Saint-Gobain Kerala Agent',   'Ramesh Iyer',   '9895100006', 'Kochi',      array['Glass — toughened','Glass — DGU/insulated'], 'Toughened + DGU insulated glass units', 'Fenestration Expo Bangalore', '2025-09-03', 5, 'a1000000-0000-4000-8000-000000000001'),
  ('Wayanad Mirror Works',        'Prakash Menon', '9895100007', 'Kalpetta',   array['Mirrors'], 'Custom cut mirrors, beveled edges', null, null, 4, 'a1000000-0000-4000-8000-000000000002'),
  ('Dorset Hardware Kerala',      'Anil Kumar',    '9895100008', 'Kochi',      array['Hardware — handles & locks'], 'Handles, mortise locks, premium range', 'Kochi Build Expo 2025', '2025-11-12', 5, 'a1000000-0000-4000-8000-000000000001'),
  ('Ebco Hinge Distributors',     'Sajeev Nambiar','9895100009', 'Kozhikode',  array['Hardware — hinges'], 'Hinges — all types', null, null, 4, 'a1000000-0000-4000-8000-000000000002'),
  ('Roller Systems Kerala',       'Faisal K',      '9895100010', 'Kannur',     array['Hardware — rollers & channels'], 'Rollers, channels for sliding systems', null, null, 3, 'a1000000-0000-4000-8000-000000000003'),
  ('Sliding Systems India',       'Vinu Balan',    '9895100011', 'Kochi',      array['Hardware — sliding systems'], 'Complete sliding door/window systems', 'Fenestration Expo Bangalore', '2025-09-03', 4, 'a1000000-0000-4000-8000-000000000001'),
  ('Wayanad Fasteners Co',        'Rajeev P',      '9895100012', 'Kalpetta',   array['Screws & fasteners'], 'SS screws, rivets, fasteners', null, null, 3, 'a1000000-0000-4000-8000-000000000002'),
  ('Kerala Gasket Supply',        'Nazar Ahmed',   '9895100013', 'Kozhikode',  array['Gaskets & weatherstrips'], 'EPDM gaskets, weatherstrips', null, null, 3, 'a1000000-0000-4000-8000-000000000003'),
  ('Dow Silicone Agents',         'Bineesh Raj',   '9895100014', 'Kochi',      array['Sealants & silicone'], 'Structural + weatherproof silicone', null, null, 4, 'a1000000-0000-4000-8000-000000000001'),
  ('Wayanad Mesh Solutions',      'Aboobacker T',  '9895100015', 'Kalpetta',   array['Mosquito mesh'], 'Fiberglass + SS mosquito mesh', null, null, 4, 'a1000000-0000-4000-8000-000000000002'),
  ('ACP Panels Kerala',           'Deepak Nair',   '9895100016', 'Kochi',      array['ACP sheets'], 'ACP sheets — all colors', 'Kochi Build Expo 2025', '2025-11-12', 4, 'a1000000-0000-4000-8000-000000000001'),
  ('Wayanad Powder Coaters',      'Muhammed Ali',  '9895100017', 'Kalpetta',   array['Powder coating services'], 'Powder coating — all RAL shades', null, null, 5, 'a1000000-0000-4000-8000-000000000002'),
  ('Kozhikode Anodizing Works',   'Santhosh K',    '9895100018', 'Kozhikode',  array['Anodizing services'], 'Anodizing — natural + color', null, null, 4, 'a1000000-0000-4000-8000-000000000003'),
  ('South India Machinery Co',    'George Mathew', '9895100019', 'Coimbatore', array['Machinery & tools'], 'Fabrication machinery, cutting tools', 'Fenestration Expo Bangalore', '2025-09-03', 5, 'a1000000-0000-4000-8000-000000000001'),
  ('Wayanad Tool House',          'Sunil Kumar',   '9895100020', 'Kalpetta',   array['Machinery & tools'], 'Hand tools, consumables', null, null, 3, 'a1000000-0000-4000-8000-000000000002'),
  ('Fevicol Industrial Agents',   'Rajesh T',      '9895100021', 'Kochi',      array['Adhesives'], 'Industrial adhesives', null, null, 3, 'a1000000-0000-4000-8000-000000000001'),
  ('Wayanad Packing Supplies',    'Joseph V',      '9895100022', 'Kalpetta',   array['Packing materials'], 'Bubble wrap, corner guards, crates', null, null, 3, 'a1000000-0000-4000-8000-000000000003'),
  ('Kalpetta Transport Service',  'Shameer K',     '9895100023', 'Kalpetta',   array['Transport / logistics'], 'Local + district delivery', null, null, 4, 'a1000000-0000-4000-8000-000000000002'),
  ('Wayanad Express Cargo',       'Biju Antony',   '9895100024', 'Kalpetta',   array['Transport / logistics'], 'Kerala-wide cargo', null, null, 4, 'a1000000-0000-4000-8000-000000000003'),
  ('Everest Fenestration Supplies','Kiran Reddy',  '9895100025', 'Bangalore',  array['Hardware — sliding systems','Hardware — rollers & channels'], 'Premium sliding hardware imports', 'Fenestration Expo Bangalore', '2025-09-03', 5, 'a1000000-0000-4000-8000-000000000001')
on conflict do nothing;
