-- Architecture multi-magasins additive pour DockFlow.
-- À exécuter dans Supabase SQL Editor ou via la CLI Supabase.

create extension if not exists pgcrypto;

create table if not exists public.magasins (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  nom text not null,
  ville text,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.magasins (code, nom)
values ('LM_LOCAL', 'Leroy Merlin - Magasin pilote')
on conflict (code) do update set nom = excluded.nom;

alter table public.profiles add column if not exists magasin_id uuid;
alter table public.profiles add column if not exists admin_scope text;
alter table public.profiles add column if not exists actif boolean not null default true;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.rayons add column if not exists magasin_id uuid;
alter table public.rayons add column if not exists actif boolean not null default true;
alter table public.destinations add column if not exists magasin_id uuid;
alter table public.destinations add column if not exists actif boolean not null default true;
alter table public.arrivages add column if not exists magasin_id uuid;

do $$
declare
  pilote uuid;
begin
  select id into pilote from public.magasins where code = 'LM_LOCAL';
  update public.profiles set magasin_id = pilote where magasin_id is null;
  update public.rayons set magasin_id = pilote where magasin_id is null;
  update public.destinations set magasin_id = pilote where magasin_id is null;
  update public.arrivages set magasin_id = pilote where magasin_id is null;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_admin_scope_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_admin_scope_check
      check (admin_scope is null or admin_scope in ('MAGASIN', 'NATIONAL'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_magasin_id_fkey') then
    alter table public.profiles add constraint profiles_magasin_id_fkey foreign key (magasin_id) references public.magasins(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'rayons_magasin_id_fkey') then
    alter table public.rayons add constraint rayons_magasin_id_fkey foreign key (magasin_id) references public.magasins(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'destinations_magasin_id_fkey') then
    alter table public.destinations add constraint destinations_magasin_id_fkey foreign key (magasin_id) references public.magasins(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'arrivages_magasin_id_fkey') then
    alter table public.arrivages add constraint arrivages_magasin_id_fkey foreign key (magasin_id) references public.magasins(id);
  end if;
end $$;

alter table public.profiles alter column magasin_id set not null;
alter table public.rayons alter column magasin_id set not null;
alter table public.destinations alter column magasin_id set not null;
alter table public.arrivages alter column magasin_id set not null;

create index if not exists profiles_magasin_id_idx on public.profiles(magasin_id);
create index if not exists rayons_magasin_id_idx on public.rayons(magasin_id);
create index if not exists destinations_magasin_id_idx on public.destinations(magasin_id);
create index if not exists arrivages_magasin_id_idx on public.arrivages(magasin_id);

-- Les codes doivent être uniques par magasin, jamais globalement.
alter table public.rayons drop constraint if exists rayons_code_key;
alter table public.destinations drop constraint if exists destinations_code_key;
create unique index if not exists rayons_magasin_code_key on public.rayons(magasin_id, code);
create unique index if not exists destinations_magasin_code_key on public.destinations(magasin_id, code);

create or replace function public.current_profile_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.current_profile_magasin_id()
returns uuid language sql stable security definer set search_path = public
as $$ select magasin_id from public.profiles where id = auth.uid() $$;

create or replace function public.current_admin_scope()
returns text language sql stable security definer set search_path = public
as $$ select admin_scope from public.profiles where id = auth.uid() $$;

create or replace function public.is_national_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select public.current_profile_role() = 'ADMIN' and public.current_admin_scope() = 'NATIONAL' $$;

create or replace function public.can_access_magasin(target_magasin uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_national_admin()
    or (public.current_profile_magasin_id() = target_magasin and public.current_profile_role() in ('RR', 'CARISTE', 'ADMIN'))
$$;

alter table public.magasins enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_rayons enable row level security;
alter table public.rayons enable row level security;
alter table public.destinations enable row level security;
alter table public.arrivages enable row level security;

drop policy if exists magasins_select_dockflow on public.magasins;
create policy magasins_select_dockflow on public.magasins for select using (public.can_access_magasin(id));
drop policy if exists magasins_manage_national on public.magasins;
create policy magasins_manage_national on public.magasins for all using (public.is_national_admin()) with check (public.is_national_admin());

drop policy if exists profiles_select_dockflow on public.profiles;
create policy profiles_select_dockflow on public.profiles for select using (id = auth.uid() or public.can_access_magasin(magasin_id));
drop policy if exists profiles_manage_admin on public.profiles;
create policy profiles_manage_admin on public.profiles for update using (public.is_national_admin() or (public.current_profile_role() = 'ADMIN' and magasin_id = public.current_profile_magasin_id())) with check (public.is_national_admin() or magasin_id = public.current_profile_magasin_id());

drop policy if exists profile_rayons_select_dockflow on public.profile_rayons;
create policy profile_rayons_select_dockflow on public.profile_rayons for select using (profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = profile_id and public.can_access_magasin(p.magasin_id)));
drop policy if exists profile_rayons_manage_admin on public.profile_rayons;
create policy profile_rayons_manage_admin on public.profile_rayons for all using (public.current_profile_role() = 'ADMIN') with check (public.current_profile_role() = 'ADMIN');

drop policy if exists rayons_access_dockflow on public.rayons;
create policy rayons_access_dockflow on public.rayons for select using (public.can_access_magasin(magasin_id));
drop policy if exists rayons_manage_admin on public.rayons;
create policy rayons_manage_admin on public.rayons for all using (public.is_national_admin() or (public.current_profile_role() = 'ADMIN' and magasin_id = public.current_profile_magasin_id())) with check (public.is_national_admin() or magasin_id = public.current_profile_magasin_id());

drop policy if exists destinations_access_dockflow on public.destinations;
create policy destinations_access_dockflow on public.destinations for select using (public.can_access_magasin(magasin_id));
drop policy if exists destinations_manage_admin on public.destinations;
create policy destinations_manage_admin on public.destinations for all using (public.is_national_admin() or (public.current_profile_role() = 'ADMIN' and magasin_id = public.current_profile_magasin_id())) with check (public.is_national_admin() or magasin_id = public.current_profile_magasin_id());

drop policy if exists arrivages_access_dockflow on public.arrivages;
create policy arrivages_access_dockflow on public.arrivages for select using (public.can_access_magasin(magasin_id));
drop policy if exists arrivages_insert_rr on public.arrivages;
create policy arrivages_insert_rr on public.arrivages for insert with check (public.current_profile_role() in ('RR', 'ADMIN') and magasin_id = public.current_profile_magasin_id());
drop policy if exists arrivages_update_rr on public.arrivages;
create policy arrivages_update_rr on public.arrivages for update using (public.current_profile_role() in ('RR', 'ADMIN') and public.can_access_magasin(magasin_id)) with check (magasin_id = public.current_profile_magasin_id() or public.is_national_admin());

-- Les lignes suivent le magasin de leur arrivage parent.
alter table public.arrivage_lignes enable row level security;
drop policy if exists arrivage_lignes_access_dockflow on public.arrivage_lignes;
create policy arrivage_lignes_access_dockflow on public.arrivage_lignes for select using (exists (select 1 from public.arrivages a where a.id = arrivage_id and public.can_access_magasin(a.magasin_id)));
drop policy if exists arrivage_lignes_write_dockflow on public.arrivage_lignes;
create policy arrivage_lignes_write_dockflow on public.arrivage_lignes for all using (exists (select 1 from public.arrivages a where a.id = arrivage_id and a.magasin_id = public.current_profile_magasin_id() and public.current_profile_role() in ('RR', 'ADMIN'))) with check (exists (select 1 from public.arrivages a where a.id = arrivage_id and a.magasin_id = public.current_profile_magasin_id() and public.current_profile_role() in ('RR', 'ADMIN')));
