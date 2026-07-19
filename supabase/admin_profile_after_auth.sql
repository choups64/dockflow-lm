-- À exécuter APRÈS avoir créé et confirmé le compte dans Supabase Authentication.
-- Ce script ne crée pas auth.users et ne contient aucun mot de passe.

insert into public.profiles (id, email, role, admin_scope, magasin_id)
select u.id, u.email, 'ADMIN', 'NATIONAL', m.id
from auth.users u
join public.magasins m on m.code = 'LM_LOCAL'
where u.email = 'remi.deschuyteneer@gmail.com'
on conflict (id) do update set
  email = excluded.email,
  role = 'ADMIN',
  admin_scope = 'NATIONAL',
  magasin_id = excluded.magasin_id;
