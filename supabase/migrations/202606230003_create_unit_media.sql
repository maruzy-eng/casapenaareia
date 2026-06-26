create table if not exists public.unit_media (
  id uuid primary key default gen_random_uuid(),

  unit_id uuid not null references public.units(id) on delete cascade,

  media_type text not null check (media_type in ('image', 'video')),
  url text not null,
  title text,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists unit_media_unit_id_idx
on public.unit_media(unit_id);

create index if not exists unit_media_sort_order_idx
on public.unit_media(unit_id, sort_order);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'property-media',
  'property-media',
  true,
  104857600,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view property media" on storage.objects;

create policy "Public can view property media"
on storage.objects
for select
using (
  bucket_id = 'property-media'
);

drop policy if exists "Service role can manage property media" on storage.objects;

create policy "Service role can manage property media"
on storage.objects
for all
using (
  bucket_id = 'property-media'
)
with check (
  bucket_id = 'property-media'
);