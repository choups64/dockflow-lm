-- Un RR ne peut créer un arrivage que pour un rayon actif qui lui est affecté.
-- Cette règle est évaluée par Supabase, indépendamment des valeurs envoyées par le navigateur.
drop policy if exists arrivages_insert_rr on public.arrivages;
create policy arrivages_insert_rr on public.arrivages for insert with check (
  magasin_id = public.current_profile_magasin_id()
  and (
    public.current_profile_role() = 'ADMIN'
    or (
      public.current_profile_role() = 'RR'
      and exists (
        select 1
        from public.profile_rayons pr
        join public.rayons r on r.id = pr.rayon_id
        where pr.profile_id = auth.uid()
          and pr.rayon_id = arrivages.rayon_id
          and r.magasin_id = arrivages.magasin_id
          and r.actif = true
      )
    )
  )
);
