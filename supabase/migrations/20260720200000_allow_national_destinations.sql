-- Une destination sans magasin appartient au périmètre national.
alter table public.destinations alter column magasin_id drop not null;

-- NULLS NOT DISTINCT garantit aussi l'unicité des codes nationaux.
drop index if exists public.destinations_magasin_code_key;
create unique index destinations_magasin_code_key
  on public.destinations (magasin_id, code)
  nulls not distinct;
