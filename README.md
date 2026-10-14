# Maroutine — routines quotidiennes pour enfants

Application de routines quotidiennes gamifiées pour enfants : profils, catalogue,
validation quotidienne, étoiles et récompenses. Le package porte la version 2.1.2 ;
cette version déclarée ne constitue pas une qualification de release ou de production.

Le développement reste sur [GitLab](https://gitlab.com/simonbdbc/maroutine).
Le [miroir GitHub public](https://github.com/simonbdbc/maroutine) reçoit le contenu
filtré dans un historique public séparé.

Pour obtenir les sources :

```bash
git clone https://github.com/simonbdbc/maroutine.git
cd maroutine
```

L'accès à la source de développement GitLab requiert une autorisation privée.
Les droits de redistribution du code et des stickers restent à confirmer ;
cette présentation n'accorde aucun droit nouveau.

## Architecture web

Le dépôt est un workspace npm composé de deux applications :

- `apps/landing` : landing page Astro publique et orientée SEO ;
- `apps/pwa` : application Expo Router existante, publiée sous `/app`.

La PWA peut aussi être construite seule à la racine de
`https://app.maroutine.app` pour son projet Cloudflare Pages dédié.

La structure, les routes et la stratégie de déploiement sont documentées dans
[docs/architecture.md](./docs/architecture.md).

## Vision produit

- v1 prioritaire: PWA web-first/offline-first sur Cloudflare Pages (`maroutine.app`)
- v2 secondaire: extension Android/iOS avec le meme modele local-first

## Fonctionnalites principales

- Menu lateral masque par defaut avec les entrees `Routines`, `Enfants`, `Catalogue`, `Historique`, `Compte`.
- Routines quotidiennes par enfant, validation de journee et tirelire d'etoiles.
- Catalogue separe pour moments, activites, taches et recompenses.
- Gestion des recompenses par enfant avec duree d'utilisation et cout en etoiles.
- Historique des mouvements de tirelire par enfant, filtrable par semaine ou mois.

## Prerequis

- Node `>=20.19.5` (voir `package.json`/`.nvmrc`)
- npm
- fichier d'environnement local

```bash
cp apps/pwa/.env.example apps/pwa/.env.local
```

Variables minimales pour la recette web locale:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Le modèle est entièrement fictif. Sa clé TEST_ONLY_FAKE_KEY permet le build,
pas une connexion Auth réelle ; utiliser ensuite la clé cliente de l’instance
Supabase de recette.

Variable optionnelle:

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (si login Google actif)

## Installation

```bash
npm ci
```

En CI:

```bash
npm ci
```

## Commandes de developpement

```bash
npm run start
npm run web
npm run android
npm run ios
npm run dev:landing
npm run dev:pwa
```

## Commandes qualite / checks

### Images de la landing

```bash
npm run test:images --workspace @maroutine/landing
```

Le service d'images conserve les règles Astro 5 et utilise Sharp 0.35.5.
Le test contrôle le décodeur réellement chargé, les transformations synthétiques,
les entrées invalides et la limite de pixels. Voir [sécurité](docs/SECURITY.md).

### TypeScript / lint global

```bash
npm run tsc
npm run lint
```

### Qualite theme (EPIC11)

```bash
npm run lint:colors
npm run lint:contrast
npm run lint:theme:contract
npm run lint:theme:shell
npm run lint:tokens:legacy
npm run lint:tokens:legacy:strict
npm run qa:theme
```

`npm run qa:theme` est la commande bloquante recommandee en CI pour la coherence theme.

### Stickers (sync + coherence Pages)

```bash
npm run sync:stickers:public
npm run lint:stickers:pages
```

Ces commandes:

1. synchronisent `assets/stickers/**` vers `public/stickers/**`
2. normalisent les noms de fichiers en lowercase
3. detectent les incoherences entre assets sources et assets publies

## Tests cibles par ticket

```bash
npm run test:e8-r09
npm run test:e9-r11
npm run test:e11-t04
npm run test:e11-t12
npm run test:e11-t13
npm run test:e11-t16
npm run test:e11-t17
npm run test:e16-rewards-history
```

`test:e16-rewards-history` couvre les filtres semaine/mois, la validation d'échange de récompense et le mapping d'historique tirelire.

Le test SQL indépendant exécute le schéma et la migration E16 dans deux bases
PostgreSQL jetables avec comptes/profils entièrement fictifs :

```bash
# PostgreSQL 17 : initdb, pg_ctl et psql sur PATH ; ne pas lancer en root.
python3 scripts/test-validate-day.py
# Homebrew, si les binaires ne sont pas sur PATH :
PG_BINDIR=/opt/homebrew/opt/postgresql@17/bin python3 scripts/test-validate-day.py
```

Il teste les refus intercomptes/anonymes, la validation propre, les retries, les
jours sans étoiles, les dates nulles et deux appels concurrents. Il n'utilise
aucune URL de base distante. Ce test PostgreSQL avec identité Supabase simulée
ne valide pas à lui seul le service Auth ou l'API Supabase déployés.

## Reference complete des scripts npm

```bash
npm run start
npm run android
npm run ios
npm run web
npm run dev:landing
npm run build:landing
npm run preview:landing
npm run check:landing
npm run dev:pwa
npm run build:pwa

npm run sync:stickers:public
npm run lint:stickers:pages

npm run lint:colors
npm run lint:contrast
npm run lint:theme:contract
npm run lint:theme:shell
npm run lint:tokens:legacy
npm run lint:tokens:legacy:strict
npm run qa:theme

npm run web:env:check
npm run web:build
npm run web:serve:dist
npm run pwa:contract:test
npm run validate:pwa
npm run e2e:pwa
npm run e2e:pwa:build

npm run tsc
npm run lint
npm run format

npm run test:e8-r09
npm run test:e9-r11
npm run test:e11-t04
npm run test:e11-t12
npm run test:e11-t13
npm run test:e11-t16
npm run test:e11-t17
npm run test:e16-rewards-history
```

## Supabase / SQL

- Schéma complet pour base neuve: [docs/sql/schema-v2.sql](./docs/sql/schema-v2.sql)
- Guide Supabase: [docs/sql/EPIC3-supabase.md](./docs/sql/EPIC3-supabase.md)
- Migration récompenses + historique: [docs/sql/migration-e16-rewards-history.sql](./docs/sql/migration-e16-rewards-history.sql)
- Droits Data API explicites: [docs/sql/migration-e19-data-api-grants.sql](./docs/sql/migration-e19-data-api-grants.sql)

Le schéma complet commence par un **reset destructif** : le réserver à une
base neuve/jetable, jamais à une base de production. Les changements sur une
base existante exigent sauvegarde, revue et autorisation de migration.

Pour une base existante, appliquer les migrations `docs/sql/migration-*.sql` dans l'ordre documenté dans le guide Supabase. La migration E16 ajoute `rewards`, `profile_rewards`, `balance_history`, `set_profile_balance` et `redeem_profile_reward`. E19 accorde uniquement les droits de table nécessaires à authenticated, avec les policies RLS existantes ; elle ne révoque pas les ACL anciennes. Le schéma neuf inclut ces droits sans dépendre des privilèges Supabase historiques.

## Build web local

Commande unique:

```bash
npm run web:build
```

Cette commande enchaine:

1. build Astro de `apps/landing` ;
2. sync et validation des stickers et du thème de `apps/pwa` ;
3. vérification des variables Expo ;
4. export Expo web avec la base `/app` ;
5. génération de `pwa-build.json`, `version.json` et du service worker scopé ;
6. assemblage de la landing à `/` et de la PWA à `/app` dans `dist/`.

Valider l'artefact et le mode offline:

```bash
npm run validate:pwa
npm run e2e:pwa
```

Servir localement le build statique:

```bash
npm run web:serve:dist
```

## Modes, données et sécurité

Le modèle produit est local-first ; les données locales persistent dans le
stockage du navigateur/SQLite selon la plateforme. Les comptes et les RPC cloud
utilisent Supabase. Le fonctionnement offline, la synchronisation et l'authentification
cloud doivent être testés séparément ; utiliser deux comptes fictifs et des profils
« Enfant fictif » en recette. Ne pas importer de données familiales ou de production.

`EXPO_PUBLIC_SUPABASE_URL` et la clé client `anon` sont publiques dans le bundle ;
elles ne remplacent pas les règles RLS et les vérifications de propriété des RPC.
Ne jamais mettre une clé `service_role`, un JWT serveur ou un mot de passe dans
une variable `EXPO_PUBLIC_*`. Le client ID Google est public et optionnel.
Voir [sécurité et validation SQL](docs/SECURITY.md).

Le parcours cloud exige une instance Supabase de développement distincte,
initialisée avec le schéma et des comptes synthétiques. Les fichiers `.env.local`
restent privés. L'absence de configuration cloud ne prouve pas un parcours cloud
fonctionnel. Aucun script de publication distante n’est inclus dans cet export.

Arrêter les serveurs de développement avec `Ctrl+C`. Le test SQL arrête et retire
son cluster jetable automatiquement ; il ne touche ni aux données locales de la
PWA ni aux bases existantes. Effacer le stockage du navigateur supprime les routines
locales : sauvegarder les données nécessaires avant une réinitialisation.

## Synchronisation du dépôt de présentation

La version publique est disponible sur https://github.com/simonbdbc/maroutine. Son historique est séparé de l’historique privé GitLab. Le job de publication exporte les fichiers autorisés depuis la branche dédiée `publication/github-main`, contrôle le contenu puis ajoute un commit à la suite du dernier commit public. Les anciennes branches, étiquettes, données privées et artefacts internes ne sont pas transférés. Les propositions de modification sont revues dans GitLab avant publication. Cette synchronisation des sources ne déploie pas l’application. Le job contrôlé vérifie la branche toutes les quinze minutes lorsque le Mac de publication est éveillé et connecté. La branche `publication/github-main` est exclue des builds Cloudflare.

## Périmètre public nettoyé

Les stickers de travail/debug, anciennes roadmaps, suivi de prospection et outils de déploiement/vérification de production restent privés. Les 42 stickers finaux et leurs variantes web/natives sont conservés. `npm run build` produit uniquement une sortie locale ; `npm run web:serve:dist` sert cette sortie. Aucun script Wrangler ni publication distante n’est inclus.

[Périmètre de publication et exclusions de production](PUBLICATION.md).
