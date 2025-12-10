create table if not exists idempotency_keys (
  key text primary key,
  channel text not null,
  endpoint text not null,
  response jsonb not null,
  created_at timestamptz default now()
);
create index if not exists idx_idempotency_keys_channel_endpoint_created
  on idempotency_keys (channel, endpoint, created_at);

create table if not exists availability (
  park_id text not null,
  unit_type_id text not null,
  date date not null,
  inventory int not null check (inventory >= 0),
  min_stay int check (min_stay is null or min_stay > 0),
  closed_arrival boolean default false,
  closed_departure boolean default false,
  version int not null default 1,
  updated_at timestamptz default now(),
  primary key (park_id, unit_type_id, date)
);

create table if not exists channel_sync_events (
  id bigserial primary key,
  channel text not null,
  park_id text not null,
  type text not null check (type in ('availability','rate','reservation')),
  direction text not null check (direction in ('in','out')),
  status text not null check (status in ('success','stale','conflict','error')),
  version int,
  latency_ms int,
  payload_ref text,
  error text,
  created_at timestamptz default now()
);
create index if not exists idx_channel_sync_events_recent
  on channel_sync_events (channel, park_id, created_at desc);

create table if not exists channel_reservations (
  channel text not null,
  ota_reservation_id text not null,
  park_id text not null,
  unit_type_id text not null,
  status text not null check (status in ('pending','confirmed','cancelled','modified')),
  ota_updated_at timestamptz not null,
  version int not null,
  checksum text,
  payload jsonb,
  internal_reservation_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (channel, ota_reservation_id)
);
create index if not exists idx_channel_reservations_recent
  on channel_reservations (park_id, unit_type_id, ota_updated_at desc);

