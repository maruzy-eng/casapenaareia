create table if not exists public.upgrades (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10, 2) not null default 0,
  pricing_type text not null default 'per_stay',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint upgrades_pricing_type_check check (
    pricing_type in (
      'per_night',
      'per_stay',
      'per_guest_per_night',
      'per_guest_per_stay'
    )
  ),
  constraint upgrades_price_non_negative check (price >= 0)
);

create table if not exists public.unit_upgrades (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  upgrade_id uuid not null references public.upgrades(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint unit_upgrades_unique unique (unit_id, upgrade_id)
);

create table if not exists public.reservation_upgrades (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  upgrade_id uuid references public.upgrades(id) on delete set null,
  name text not null,
  pricing_type text not null,
  unit_price numeric(10, 2) not null default 0,
  quantity numeric(10, 2) not null default 1,
  total numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),

  constraint reservation_upgrades_pricing_type_check check (
    pricing_type in (
      'per_night',
      'per_stay',
      'per_guest_per_night',
      'per_guest_per_stay'
    )
  )
);

create index if not exists upgrades_active_sort_idx
  on public.upgrades (is_active, sort_order, name);

create index if not exists unit_upgrades_unit_active_idx
  on public.unit_upgrades (unit_id, is_active);

create index if not exists reservation_upgrades_reservation_idx
  on public.reservation_upgrades (reservation_id);
