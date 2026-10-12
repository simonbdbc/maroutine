# EPIC 3 — Supabase : Guide technique

> Référence technique pour le setup Supabase.
> Le schéma SQL complet est dans `docs/sql/schema-v2.sql`.

---

## Setup isolé

Utiliser une instance Supabase de développement distincte, avec uniquement des
comptes parents et des profils enfants fictifs. Le schéma commence par un reset
qui supprime les tables métier : il est réservé à une base neuve/jetable. Une base
existante exige une sauvegarde, une revue des migrations/ACL et une autorisation
avant application ; ne jamais y rejouer le schéma complet.

1. Dans l'instance de développement, exécuter `docs/sql/schema-v2.sql`.
2. Configurer la PWA avec `EXPO_PUBLIC_SUPABASE_URL` et
   `EXPO_PUBLIC_SUPABASE_ANON_KEY`, selon le README. La clé anon/publishable est
   une clé cliente publique ; aucune clé service_role dans le bundle.
3. Créer deux comptes fictifs par Supabase Auth, puis un enfant par compte dans
   l'application. Vérifier lecture/création propres et invisibilité intercompte.
4. Vérifier `validate_day` : crédit propriétaire, retry sans double crédit,
   refus du compte étranger et de l'anonyme, y compris après validation.

Les nouvelles instances ne doivent pas dépendre des anciens privilèges par
défaut Supabase. Le schéma et la migration E19 accordent explicitement les
opérations des repositories à authenticated. Les policies RLS restent actives ;
l'historique est en lecture seule et les validations ne peuvent être créées ou
modifiées directement par la Data API. Aucun grant à anon ni sur les tables
futures. E19 ne révoque pas les éventuels droits d'une installation ancienne.

Contrôle SQL de recette :

```sql
SELECT has_table_privilege('authenticated', 'public.profiles', 'SELECT'),
       has_table_privilege('authenticated', 'public.profiles', 'INSERT'),
       has_table_privilege('authenticated', 'public.balance_history', 'INSERT'),
       has_function_privilege('authenticated', 'public.validate_day(uuid,date)', 'EXECUTE');
-- Attendu sur une installation neuve : true, true, false, true.
```

Les tests PostgreSQL jetables du README vérifient les SQL livrés. Une réussite de
ces tests ne qualifie pas Supabase déployé ni l'interface navigateur.

## Schéma v2 — changements vs v1

| Changement | Détail |
|------------|--------|
| `user_id` sur `moments`, `activities`, `tasks` | Catalogue par user (RLS). `NULL` = données seed globales. |
| `sticker_key` sur `profile_moment_activities` | Sticker propre à chaque activité dans la routine d'un profil. |
| `sticker_key` sur `profiles` | Avatar sticker du profil. |
| `rewards` + `profile_rewards` | Catalogue récompenses par compte et récompenses configurées par enfant. |
| `balance_history` | Historique des ajouts/retraits d'étoiles par enfant. |
| RPC tirelire | `validate_day`, `set_profile_balance`, `redeem_profile_reward` historisent les mouvements. |
| RLS complet | Toutes les tables métier ont des policies (y compris catalogues et historique). |
| `default_points = 0` | Les étoiles par défaut sont à 0 partout (configurables par profil dans le builder). |

## Tables

```
auth.users (Supabase natif)
    └── profiles                    (enfants, liés à auth.users)
          ├── profile_moments       (pivot profil ↔ moment)
          │     └── profile_moment_activities (pivot ↔ activité, + sticker_key)
          │           └── profile_moment_activity_tasks (pivot ↔ tâche)
          ├── profile_rewards       (récompenses configurées pour l'enfant)
          ├── daily_checks          (état coché par jour)
          ├── daily_validations     (validation idempotente du jour)
          └── balance_history       (mouvements de tirelire)

moments     (catalogue, user_id nullable)
activities  (catalogue, user_id nullable)
tasks       (catalogue, user_id nullable)
rewards     (catalogue récompenses, user_id nullable)
```

## Migration depuis le schéma v1

Pour une base existante, préparer et autoriser uniquement les migrations manquantes après vérification de la révision installée. L’ordre historique est le suivant ; ce n’est pas une commande de migration production :

1. `docs/sql/migration-e9-r02-points-to-stars.sql`
2. `docs/sql/migration-e9-r13-pma-sticker-required.sql`
3. `docs/sql/migration-e15-u01-sticker-default-stars-icon.sql`
4. `docs/sql/migration-e15-u02-account-owned-catalog.sql`
5. `docs/sql/migration-e15-u03-fix-legacy-routines-and-catalog-order.sql`
6. `docs/sql/migration-e16-rewards-history.sql`
7. `docs/sql/export-test-catalog-example-snapshot.sql` (outil de préparation E17, uniquement depuis un compte synthétique isolé ; ne pas exporter un profil enfant réel)
8. `docs/sql/migration-e17-default-catalog-rewards-example-profile.sql`
9. `docs/sql/migration-e18-fix-example-profile-rpc-id-ambiguity.sql` (correctif RPC si E17 est déjà appliquée)
10. `docs/sql/migration-e19-data-api-grants.sql` (droits Data API ciblés, sans changement de RLS)

La migration E16 ajoute:

- `rewards`, catalogue récompenses par compte.
- `profile_rewards`, configuration nom/durée/coût par enfant.
- `balance_history`, historique des modifications de tirelire.
- `redeem_profile_reward`, débit atomique pour les échanges.
- `set_profile_balance`, modifications manuelles historisées.
- une version historisée de `validate_day`.

La migration E17 ajoute:

- les récompenses seed globales (`rewards.user_id IS NULL`).
- les tables de template de profil exemple.
- `create_profile_from_template`, qui crée un profil enfant `Exemple` avec routine et récompenses préconfigurées.
- un snapshot de catalogue et profil exemple. Le snapshot livré et sa provenance restent à revoir avant export public ; ne pas le remplacer par des données privées. Un remplacement doit être synthétique et contrôlé.

La migration E18 remplace uniquement `create_profile_from_template` pour qualifier les colonnes `id` retournées par les CTE internes. Elle corrige l'erreur Postgres `column reference "id" is ambiguous` observée après E17.

## Fichier SQL complet

→ **`docs/sql/schema-v2.sql`** — un seul bloc à copier-coller dans Supabase SQL Editor.
