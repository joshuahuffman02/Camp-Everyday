create table if not exists public_pages (
  id uuid primary key,
  park_id text not null,
  slug text not null,
  title text not null,
  body_json jsonb,
  hero_media jsonb,
  gallery_json jsonb,
  seo_meta_json jsonb,
  structured_data_json jsonb,
  status text not null check (status in ('draft','published')),
  published_at timestamptz,
  updated_by text,
  version int not null default 1,
  created_at timestamptz default now()
);
create unique index if not exists uq_public_pages_published
  on public_pages (park_id, slug, status) where status = 'published';
create index if not exists idx_public_pages_status
  on public_pages (park_id, status);
create index if not exists idx_public_pages_slug
  on public_pages (park_id, slug);

