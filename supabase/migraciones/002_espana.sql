-- Maltea · abre el registro en España (noviembre de 2026)
-- Ejecutar una vez en Supabase → SQL Editor → New query → Run.
-- Se puede ejecutar más de una vez sin problema. No borra ni cambia datos existentes.

-- Perfiles: país donde compra la persona, Chile o España
alter table public.profiles drop constraint if exists profiles_country_check;
alter table public.profiles add constraint profiles_country_check check (country in ('CL', 'ES'));

-- Notas: país del catálogo desde el que se puntuó
alter table public.ratings drop constraint if exists ratings_country_check;
alter table public.ratings add constraint ratings_country_check check (country in ('CL', 'ES'));
