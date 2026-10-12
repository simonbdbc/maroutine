# Cloudflare Pages — PWA sur `app.maroutine.app`

## Cible

Ce déploiement publie uniquement `apps/pwa` à la racine :

- domaine public : `https://app.maroutine.app` ;
- projet Cloudflare Pages : `maroutine-app` ;
- mode du projet : Direct Upload, sans intégration Git ;
- branche de production : `main` ;
- dossier envoyé : `apps/pwa/dist` ;
- base Expo Router, manifeste et service worker : `/`.

Le build combiné historique reste disponible séparément : landing à `/` et PWA
à `/app` dans le dossier racine `dist/`.

## Pré-requis externes

1. Disposer de la zone active `maroutine.app` dans le compte Cloudflare cible.
2. Authentifier Wrangler avec le compte qui possède cette zone :

   ```bash
   npx wrangler login
   npx wrangler whoami
   ```

3. Configurer dans Supabase `Authentication > URL Configuration` :

   - `Site URL` : `https://app.maroutine.app` ;
   - `Redirect URLs` : ajouter `https://app.maroutine.app/**` ;
   - conserver provisoirement l'ancienne URL pendant la migration.

Vérifier la zone et le sous-domaine :

```bash
dig maroutine.app SOA
dig app.maroutine.app CNAME
```

## Build et validation locale

Installer les dépendances puis générer l'artefact dédié :

```bash
npm ci
npm run build:pwa:cloudflare
npm run validate:pwa:cloudflare
```

Pour le servir à la racine en local :

```bash
npm run web:serve:cloudflare --workspace @maroutine/pwa
```

Les variables publiques Expo restent celles de `apps/pwa/.env.local`. Le script
de build impose en plus :

```text
EXPO_PUBLIC_APP_BASE_PATH=/
EXPO_PUBLIC_APP_URL=https://app.maroutine.app
EXPO_PUBLIC_RELEASE_CHANNEL=production
```

GitLab CI exécute le même contrat dans le job `pwa:build:cloudflare` et conserve
`apps/pwa/dist` comme artefact pendant une journée. Le job ne s'exécute que si
les deux variables publiques Supabase requises sont présentes.

Après les E2E, le job `pwa:deploy:cloudflare` est toujours présent sur `main` et
publie automatiquement cet artefact. Il échoue explicitement, au lieu de
laisser un pipeline vert sans livraison, si les variables GitLab protégées
suivantes ne sont pas définies :

- `CLOUDFLARE_ACCOUNT_ID` : identifiant du compte Cloudflare ;
- `CLOUDFLARE_API_TOKEN` : jeton masqué, limité au compte cible avec la
  permission Cloudflare Pages `Write`.

Ne jamais enregistrer le jeton dans le dépôt ou dans un fichier `.env`.

Le statut externe `Cloudflare Pages` associé au projet Git `maroutine` concerne
le site vitrine `maroutine.app`. Il ne prouve pas que la PWA Direct Upload
`maroutine-app` a été livrée.

## Création et premier déploiement

Créer une seule fois le projet Pages :

```bash
npx wrangler pages project create maroutine-app --production-branch main
```

Déployer ensuite le build validé :

```bash
npm run deploy:pwa:cloudflare
```

La commande construit `apps/pwa/dist`, valide le contrat racine puis déploie la
branche `main`. Conserver l'URL `*.pages.dev` retournée par Wrangler pour les
tests avant la bascule DNS.

## Domaine personnalisé

Dans `Workers & Pages > maroutine-app > Custom domains` :

1. ajouter `app.maroutine.app` ;
2. laisser Cloudflare créer l'enregistrement DNS Pages proposé ;
3. attendre les statuts DNS et certificat `Active` ;
4. ne pas créer manuellement un CNAME avant d'avoir associé le domaine au
   projet Pages.

## État du premier déploiement — 21 juillet 2026

- projet Pages : `maroutine-app` ;
- branche de production : `main` ;
- alias : `https://maroutine-app.pages.dev` ;
- déploiement initial : `https://ee9eaa29.maroutine-app.pages.dev` ;
- SHA déclaré : `d79163c` ;
- statut du déploiement : `success` ;
- domaine `app.maroutine.app` associé au projet ;
- validation DNS et certificat : `active` ;
- zone Cloudflare : `maroutine.app` (`active`) ;
- DNS : CNAME proxifié `app.maroutine.app` vers `maroutine-app.pages.dev`.

## Smoke tests

```bash
curl -I https://app.maroutine.app/
curl -I https://app.maroutine.app/login
curl -I https://app.maroutine.app/home
curl -I https://app.maroutine.app/manifest.webmanifest
curl -I https://app.maroutine.app/service-worker.js
curl -I https://app.maroutine.app/icons/icon-192-20260604.png
curl -I https://app.maroutine.app/pwa-build.json
```

Le job exécute automatiquement `npm run verify:pwa:production` après Wrangler
et attend la convergence de `app.maroutine.app` et `maroutine-app.pages.dev`.

Attendus : réponses `200`, routes profondes renvoyées vers le shell Expo,
`Service-Worker-Allowed: /`, manifeste avec `start_url` et `scope` égaux à `/`,
`Cache-Control: no-store` sur `service-worker.js` et `pwa-build.json`, origine de
`pwa-build.json` égale à `https://app.maroutine.app` et `buildId` au format
`production-[CI_PIPELINE_ID]-[CI_COMMIT_SHORT_SHA]`.

## Rollback

Dans Cloudflare Pages, sélectionner le dernier déploiement stable et le
promouvoir à nouveau en production, puis rejouer les smoke tests.
