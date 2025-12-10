create table if not exists membership_plans (
  id uuid primary key,
  park_id text not null,
  name text not null,
  type text,
  eligibility jsonb,
  benefit jsonb,
  applies_to jsonb,
  stacking_rule text,
  priority int not null default 100 check (priority between 1 and 10000),
  active_from date,
  active_to date,
  created_by text,
  created_at timestamptz default now()
);
create index if not exists idx_membership_plans_active
  on membership_plans (park_id, active_from, active_to);

create table if not exists promo_codes (
  id uuid primary key,
  park_id text not null,
  code text not null,
  benefit jsonb,
  usage_limit_total int,
  usage_limit_per_user int,
  min_stay int,
  max_stay int,
  blackouts jsonb,
  eligibility jsonb,
  channels jsonb,
  stacking_rule text,
  priority int not null default 200 check (priority between 1 and 10000),
  active_from date,
  active_to date,
  created_at timestamptz default now()
);
create unique index if not exists uq_promo_codes_code
  on promo_codes (park_id, code);
create index if not exists idx_promo_codes_active
  on promo_codes (park_id, active_from, active_to);

create table if not exists promo_usages (
  id bigserial primary key,
  promo_code_id uuid references promo_codes(id) on delete cascade,
  customer_id text not null,
  reservation_id text not null,
  used_at timestamptz default now()
);
create unique index if not exists uq_promo_usages_reservation
  on promo_usages (promo_code_id, reservation_id);
create index if not exists idx_promo_usages_customer
  on promo_usages (promo_code_id, customer_id);

create table if not exists discount_applications (
  id bigserial primary key,
  reservation_id text not null,
  source_type text not null check (source_type in ('membership','promo')),
  source_id uuid not null,
  amount numeric(12,2) not null,
  currency text not null,
  reason text,
  applied_at timestamptz default now()
);

