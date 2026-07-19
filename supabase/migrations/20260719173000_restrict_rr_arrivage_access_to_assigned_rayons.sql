-- Les RR ne lisent ou ne modifient que les arrivages de leurs rayons affectés.
-- Les autres rôles conservent leur périmètre magasin existant.
drop policy if exists arrivages_access_dockflow on public.arrivages;
create policy arrivages_access_dockflow on public.arrivages for select using (
  (
    public.current_profile_role() = 'RR'
    and magasin_id = public.current_profile_magasin_id()
    and exists (
      select 1 from public.profile_rayons pr
      where pr.profile_id = auth.uid() and pr.rayon_id = arrivages.rayon_id
    )
  )
  or (
    public.current_profile_role() <> 'RR'
    and public.can_access_magasin(magasin_id)
  )
);

drop policy if exists arrivages_update_rr on public.arrivages;
create policy arrivages_update_rr on public.arrivages for update using (
  (
    public.current_profile_role() = 'RR'
    and magasin_id = public.current_profile_magasin_id()
    and exists (
      select 1 from public.profile_rayons pr
      where pr.profile_id = auth.uid() and pr.rayon_id = arrivages.rayon_id
    )
  )
  or (
    public.current_profile_role() = 'ADMIN'
    and public.can_access_magasin(magasin_id)
  )
) with check (
  (
    public.current_profile_role() = 'RR'
    and magasin_id = public.current_profile_magasin_id()
    and exists (
      select 1 from public.profile_rayons pr
      where pr.profile_id = auth.uid() and pr.rayon_id = arrivages.rayon_id
    )
  )
  or (
    public.current_profile_role() = 'ADMIN'
    and (magasin_id = public.current_profile_magasin_id() or public.is_national_admin())
  )
);

drop policy if exists arrivage_lignes_access_dockflow on public.arrivage_lignes;
create policy arrivage_lignes_access_dockflow on public.arrivage_lignes for select using (
  exists (
    select 1 from public.arrivages a
    where a.id = arrivage_id
      and (
        (
          public.current_profile_role() = 'RR'
          and a.magasin_id = public.current_profile_magasin_id()
          and exists (
            select 1 from public.profile_rayons pr
            where pr.profile_id = auth.uid() and pr.rayon_id = a.rayon_id
          )
        )
        or (
          public.current_profile_role() <> 'RR'
          and public.can_access_magasin(a.magasin_id)
        )
      )
  )
);

drop policy if exists arrivage_lignes_write_dockflow on public.arrivage_lignes;
create policy arrivage_lignes_write_dockflow on public.arrivage_lignes for all using (
  exists (
    select 1 from public.arrivages a
    where a.id = arrivage_id
      and (
        (
          public.current_profile_role() = 'RR'
          and a.magasin_id = public.current_profile_magasin_id()
          and exists (
            select 1 from public.profile_rayons pr
            where pr.profile_id = auth.uid() and pr.rayon_id = a.rayon_id
          )
        )
        or (
          public.current_profile_role() = 'ADMIN'
          and (a.magasin_id = public.current_profile_magasin_id() or public.is_national_admin())
        )
      )
  )
) with check (
  exists (
    select 1 from public.arrivages a
    where a.id = arrivage_id
      and (
        (
          public.current_profile_role() = 'RR'
          and a.magasin_id = public.current_profile_magasin_id()
          and exists (
            select 1 from public.profile_rayons pr
            where pr.profile_id = auth.uid() and pr.rayon_id = a.rayon_id
          )
        )
        or (
          public.current_profile_role() = 'ADMIN'
          and (a.magasin_id = public.current_profile_magasin_id() or public.is_national_admin())
        )
      )
  )
);
