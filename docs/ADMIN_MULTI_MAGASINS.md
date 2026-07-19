# Administration multi-magasins

Chaque donnée métier appartient à `magasins` via `magasin_id`. Le magasin pilote initial est `LM_LOCAL` / `Leroy Merlin - Magasin pilote`.

## Rôles

- `RR` crée et prépare les arrivages de son magasin.
- `CARISTE` lit les arrivages de son magasin.
- `ADMIN` utilise `admin_scope` : `MAGASIN` limite son administration à `magasin_id`, `NATIONAL` couvre tous les magasins.

Les rayons et destinations sont uniques par couple `(magasin_id, code)`. Un R11 peut donc exister dans plusieurs magasins.

## Mise en service

1. Exécuter `supabase/migrations/20260719133000_add_multi_store_admin.sql` dans Supabase.
2. Dans **Authentication > Users**, créer manuellement le compte administrateur avec l’e-mail fourni par l’équipe, définir son mot de passe initial et cocher la confirmation d’e-mail.
3. Exécuter `supabase/admin_profile_after_auth.sql` pour rattacher cet UUID Auth au magasin pilote, avec `role = ADMIN` et `admin_scope = NATIONAL`.
4. Exécuter ensuite `supabase/migrations/20260719150000_harden_admin_resource_management.sql`.

Ne jamais placer une `SUPABASE_SERVICE_ROLE_KEY` dans une variable `NEXT_PUBLIC_*` ni dans le navigateur. La création future d’utilisateurs devra passer par une route serveur authentifiée et vérifier le rôle ADMIN avant d’utiliser l’Admin API.

Dans Vercel, ajouter `SUPABASE_SERVICE_ROLE_KEY` uniquement aux variables serveur (Production, Preview et Development si nécessaire). Elle ne doit jamais être préfixée par `NEXT_PUBLIC_`.

## Exploitation

Un administrateur national crée et active les magasins. Il associe les profils aux magasins et les RR aux rayons dans `profile_rayons`. La désactivation d’un magasin utilise `actif = false` : aucun magasin possédant des données ne doit être supprimé physiquement.
