alter table public.arrivage_lignes
  add column if not exists commentaire_cariste text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'arrivage_lignes_commentaire_cariste_length_check'
      and conrelid = 'public.arrivage_lignes'::regclass
  ) then
    alter table public.arrivage_lignes
      add constraint arrivage_lignes_commentaire_cariste_length_check
      check (commentaire_cariste is null or char_length(commentaire_cariste) <= 500);
  end if;
end
$$;
