-- Maltea · esquema para Supabase.
-- Pegar completo en SQL Editor y ejecutar. Se puede volver a ejecutar sin perder datos.

-- ——— Tablas ———

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  country text not null default 'CL' check (country in ('CL', 'ES')),
  region text check (region is null or char_length(region) <= 40),
  adult boolean not null check (adult),
  created_at timestamptz not null default now()
);

create table if not exists public.ratings (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  beer_id text not null check (char_length(beer_id) between 1 and 80),
  score smallint not null check (score between 1 and 5),
  country text not null default 'CL' check (country in ('CL', 'ES')),
  updated_at timestamptz not null default now(),
  primary key (user_id, beer_id)
);
create index if not exists ratings_beer_idx on public.ratings (beer_id);

create table if not exists public.wishlist (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  beer_id text not null check (char_length(beer_id) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (user_id, beer_id)
);

create table if not exists public.suggestions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  brewery text check (brewery is null or char_length(brewery) <= 60),
  style text check (style is null or char_length(style) <= 40),
  created_at timestamptz not null default now()
);

-- ——— Permisos: solo personas con sesión, y solo sobre sus propias filas ———

alter table public.profiles enable row level security;
alter table public.ratings enable row level security;
alter table public.wishlist enable row level security;
alter table public.suggestions enable row level security;

revoke all on public.profiles, public.ratings, public.wishlist, public.suggestions from anon;
grant select, insert, update, delete on public.profiles, public.ratings, public.wishlist to authenticated;
grant select, insert on public.suggestions to authenticated;

drop policy if exists "perfil propio: leer" on public.profiles;
drop policy if exists "perfil propio: crear" on public.profiles;
drop policy if exists "perfil propio: editar" on public.profiles;
drop policy if exists "perfil propio: borrar" on public.profiles;
create policy "perfil propio: leer" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "perfil propio: crear" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "perfil propio: editar" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "perfil propio: borrar" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

drop policy if exists "notas propias: leer" on public.ratings;
drop policy if exists "notas propias: crear" on public.ratings;
drop policy if exists "notas propias: editar" on public.ratings;
drop policy if exists "notas propias: borrar" on public.ratings;
create policy "notas propias: leer" on public.ratings for select to authenticated using ((select auth.uid()) = user_id);
create policy "notas propias: crear" on public.ratings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "notas propias: editar" on public.ratings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notas propias: borrar" on public.ratings for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "lista propia: leer" on public.wishlist;
drop policy if exists "lista propia: crear" on public.wishlist;
drop policy if exists "lista propia: borrar" on public.wishlist;
create policy "lista propia: leer" on public.wishlist for select to authenticated using ((select auth.uid()) = user_id);
create policy "lista propia: crear" on public.wishlist for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "lista propia: borrar" on public.wishlist for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "sugerencias propias: leer" on public.suggestions;
drop policy if exists "sugerencias propias: crear" on public.suggestions;
create policy "sugerencias propias: leer" on public.suggestions for select to authenticated using ((select auth.uid()) = user_id);
create policy "sugerencias propias: crear" on public.suggestions for insert to authenticated with check ((select auth.uid()) = user_id);

-- ——— Promedios públicos: entrega solo totales por cerveza, nunca la nota de una persona ———

create or replace function public.beer_stats()
returns table (beer_id text, votes bigint, total bigint)
language sql stable security definer set search_path = ''
as $$
  select r.beer_id, count(*)::bigint, sum(r.score)::bigint
  from public.ratings r
  group by r.beer_id
$$;
revoke all on function public.beer_stats() from public;
grant execute on function public.beer_stats() to anon, authenticated;

-- ——— Borrar la cuenta propia: elimina a la persona y, en cascada, su perfil, notas, lista y sugerencias ———

create or replace function public.delete_my_account()
returns void
language sql security definer set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid())
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
