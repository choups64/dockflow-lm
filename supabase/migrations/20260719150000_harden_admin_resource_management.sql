-- Compléments non destructifs pour la gestion Admin.
alter table public.profiles add column if not exists actif boolean not null default true;
alter table public.rayons add column if not exists actif boolean not null default true;
alter table public.destinations add column if not exists actif boolean not null default true;
update public.profiles set actif = true where actif is null;
update public.rayons set actif = true where actif is null;
update public.destinations set actif = true where actif is null;

create index if not exists profile_rayons_profile_id_idx on public.profile_rayons(profile_id);
create index if not exists profile_rayons_rayon_id_idx on public.profile_rayons(rayon_id);
create index if not exists profiles_magasin_role_actif_idx on public.profiles(magasin_id, role, actif);

-- Une association RR ne peut viser qu’un rayon du même magasin que son profil.
create or replace function public.profile_rayon_same_magasin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.profiles p join public.rayons r on r.id = new.rayon_id
    where p.id = new.profile_id and p.magasin_id = r.magasin_id
  ) then raise exception 'Le rayon doit appartenir au même magasin que le profil'; end if;
  return new;
end $$;
drop trigger if exists profile_rayons_same_magasin on public.profile_rayons;
create trigger profile_rayons_same_magasin before insert or update on public.profile_rayons for each row execute function public.profile_rayon_same_magasin();
