# Déploiement Web Production (EPIC17 / E17-T02)

## Objectif

Construire une version web production **reproductible** dans `dist/` à partir d'une commande unique:

```bash
npm run web:build:prod
```

## Prérequis

- Node `>=20.19.5` (voir `.nvmrc`).
- Dépendances installées (`npm ci` recommandé en CI, `npm install` en local).
- Variables d'environnement renseignées.

## Variables d'environnement

Obligatoires pour le build web prod:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Optionnelles:

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (si login Google active)
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_APP_ENV` (par défaut `production` en profil EAS prod)
- `EXPO_PUBLIC_APP_URL` (domaine canonique, recommandé en prod:
  `https://maroutine.app`)
- `EXPO_PUBLIC_SUPPORT_CONTACT` (contact écrit dans `pwa-build.json`)
- `EXPO_PUBLIC_PWA_ANALYTICS_ENDPOINT` (endpoint technique optionnel, de préférence same-origin)
- `EXPO_PUBLIC_RELEASE_CHANNEL` (`development`, `preview` ou `production`)
- `BUILD_ID` (identifiant imposé hors CI ; la CI fournit son propre identifiant)

Le script `web:env:check` valide les variables obligatoires et bloque le build
si elles sont absentes ou laissées avec des placeholders.
Les variables optionnelles absentes sont signalées en warning.

## Build local

```bash
cp apps/pwa/.env.example apps/pwa/.env.local
# remplir les variables
npm install
npm run web:build:prod
```

### Profil PWA dédié `app.maroutine.app`

Le projet Cloudflare Pages `maroutine-app` publie uniquement la PWA à la
racine du domaine :

```bash
npm run build:pwa:cloudflare
npm run validate:pwa:cloudflare
```

Ce profil produit `apps/pwa/dist`, force la base Expo Router, le manifeste et
le service worker à `/`, et utilise `https://app.maroutine.app` comme origine
canonique. Il ne remplace pas la commande combinée `npm run web:build:prod`.

Voir [`cloudflare-pwa-maroutine-app.md`](./cloudflare-pwa-maroutine-app.md) pour
la création du projet, le domaine, Supabase Auth et les smoke tests.

Le job GitLab CI `pwa:build:cloudflare` construit et valide ce profil en
parallèle du job combiné, puis expose `apps/pwa/dist` comme artefact. Le job E2E
continue d'utiliser le dossier combiné `dist/`, donc les parcours historiques
sur `/app` restent inchangés.

Sur `main`, `pwa:deploy:cloudflare` attend la réussite de cet artefact et des
E2E, puis le déploie sur le projet Pages Direct Upload `maroutine-app`. Le job
reste visible et échoue explicitement si `CLOUDFLARE_ACCOUNT_ID` ou le secret
protégé `CLOUDFLARE_API_TOKEN` n'est pas renseigné dans GitLab CI/CD. Après
Wrangler, il vérifie que les domaines Pages et personnalisé servent le build
du pipeline et un service worker avec `Cache-Control: no-store`.

Sortie:

- dossier commun `dist/`
- landing Astro à la racine avec `robots.txt` et sitemap
- bundles Expo JS/CSS optimisés sous `dist/app/`
- assets fingerprintés
- fichiers PWA copiés depuis `apps/pwa/public/` sous `/app` (`manifest.webmanifest`, `icons/*`, `screenshots/*`)
- bridge d'installation précoce et fallback statique (`install-prompt-bridge.js`, `offline.html`)
- `pwa-build.json` généré avec version, build, commit, canal, date, origine et support ; le build Cloudflare utilise `production-[CI_PIPELINE_ID]-[CI_COMMIT_SHORT_SHA]`
- `version.json` généré pour compatibilité
- `service-worker.js` généré avec caches versionnés par version et build
- stickers statiques copiés depuis `apps/pwa/public/stickers/*` (URL stables `/app/stickers/...`)

## Build CI (recommandé)

```bash
npm ci
npm run web:build:prod
```

Dans GitLab CI, `web:validate` exécute toujours `npm run tsc`,
`npm run qa:theme` et `npm run pwa:contract:test`. Le job `web:build:prod` est lancé uniquement si les deux
variables obligatoires sont définies dans les variables CI/CD du projet:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Configuration GitLab CI/CD variables

Dans GitLab: `Settings` > `CI/CD` > `Variables` > `Add variable`.

Créer deux variables:

| Champ | `EXPO_PUBLIC_SUPABASE_URL` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| --- | --- | --- |
| Type | `Variable` | `Variable` |
| Environments | `All` | `All` |
| Visibility | `Visible` | `Visible` |
| Protect variable | activé si `main` est une branche protégée | activé si `main` est une branche protégée |
| Expand variable reference | désactivé | désactivé |
| Description | URL publique du projet Supabase | Clé publique `anon` Supabase utilisée côté client |
| Key | `EXPO_PUBLIC_SUPABASE_URL` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| Value | `https://<project-ref>.supabase.co` | clé `anon public`, jamais `service_role` |

Notes:

- Les variables `EXPO_PUBLIC_*` sont intégrées au bundle web Expo. Elles ne
  doivent donc contenir que des valeurs publiques côté client.
- La clé Supabase à utiliser ici est la clé `anon public`; ne jamais renseigner
  la clé `service_role`.
- Si `Protect variable` est activé, GitLab n'expose la variable qu'aux branches
  ou tags protégés. Dans ce cas, les pipelines de branches non protégées
  exécuteront `web:validate`, mais sauteront le job `web:build:prod`.
- Le scope `Environments: All` correspond à la configuration actuelle du job,
  qui ne déclare pas d'environnement GitLab dédié.

La commande force:

- synchronisation des stickers publics (`sync:stickers:public`)
- vérification cohérence stickers (`lint:stickers:pages`)
- garde-fou thème via `npm run qa:theme` (bloquant: inline-colors + contrastes),
- `NODE_ENV=production`
- `CI=1`
- `EXPO_NO_TELEMETRY=1`
- nettoyage préalable des sorties générées
- build Astro dans `apps/landing/dist/`
- export web Expo via le workspace `apps/pwa` dans `apps/pwa/dist/`
- copie post-export des fichiers statiques PWA via `apps/pwa/scripts/post-export-web.cjs`
- assemblage final dans `dist/` (`/` landing, `/app` PWA)
- validation bloquante de l'artefact via `npm run validate:pwa`

Le job `pwa:e2e` récupère ensuite `dist`, installe Chromium et vérifie les
écrans PWA desktop/mobile ainsi qu'un reload réel avec le réseau coupé.

## Validation PWA locale

```bash
npm run pwa:contract:test
npm run web:build:prod
npm run validate:pwa
npx playwright install chromium
npm run e2e:pwa
```

La description de l'architecture, du versioning et du rollback se trouve dans
[`../PWA-IMPLEMENTATION.md`](../PWA-IMPLEMENTATION.md). Le contrat réutilisable
reste [`../PWA-CONTRACT.md`](../PWA-CONTRACT.md).

## Vérification rapide du build statique

```bash
npm run web:serve:dist
```

Puis ouvrir `http://127.0.0.1:4173`. Un autre port peut être fourni avec
`npm run web:serve:dist -- --port 4174`.

## Rollback PWA

1. restaurer le dernier déploiement Cloudflare Pages stable ;
2. vérifier que `/app/pwa-build.json` et `/app/service-worker.js` servent le build restauré ;
3. appliquer la mise à jour proposée depuis le dashboard PWA ;
4. utiliser `Reparer la PWA` uniquement pour les clients dont le worker reste bloqué ;
5. rejouer le validateur, les E2E et les smoke tests post-déploiement ;
6. consigner le build fautif, le build restauré et la cause racine.

Le rollback du shell ne doit pas supprimer les sessions ou données métier.
