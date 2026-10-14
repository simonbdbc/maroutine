# Architecture web : landing Astro + application Expo

## Structure

```text
apps/
  landing/  site public Astro, statique et indexable
  pwa/      application Expo Router existante
scripts/    assemblage, prévisualisation et validation de l'artefact commun
dist/       artefact Cloudflare Pages généré (ignoré par Git)
```

`apps/landing` présente Maroutine et ne contient aucune logique métier. Les
textes, métadonnées SEO et routes de CTA sont centralisés dans
`apps/landing/src/config/site.config.ts`.

`apps/pwa` contient l'application historique, ses assets, tests et outils de
build. Le déplacement ne change ni ses écrans, ni ses appels Supabase, ni ses
flux d'authentification.

Deux profils de publication sont maintenus : l'artefact combiné historique sur
`maroutine.app/app` et la PWA seule à la racine de `app.maroutine.app`.

## Routes publiques

| URL | Rôle |
| --- | --- |
| `/` | landing Astro |
| `/app/` | entrée de la PWA (redirige vers la connexion selon l'état de session) |
| `/app/home` | accueil applicatif |
| `/app/login` | connexion ; l'inscription reste un état interne de cet écran |

Sur le projet Pages dédié, ces mêmes routes sont servies sans préfixe :
`https://app.maroutine.app/`, `/home`, `/login`, `/profiles`, etc.

Les anciennes routes applicatives à la racine (`/login`, `/home`, `/profiles`,
etc.) sont redirigées en `301` vers leur équivalent sous `/app`. Les routes
profondes `/app/*` sont réécrites vers `/app/index.html` pour Expo Router.

## Commandes

Depuis la racine :

```bash
npm install
npm run dev:landing
npm run dev:pwa

npm run build:landing
npm run build:pwa
npm run build:pwa:cloudflare
npm run build
npm run web:serve:dist

npm run check:landing
npm run tsc
npm run lint:pwa
npm run test:pwa
npm run validate
npm run validate:pwa:cloudflare
npm run e2e:pwa:build
```

`npm run build` construit les deux applications puis produit :

```text
dist/
  index.html            landing
  robots.txt
  sitemap-index.xml
  _headers
  _redirects
  app/
    index.html          shell Expo
    manifest.webmanifest
    service-worker.js
    ...
```

## Variables d'environnement

Les variables Expo restent isolées dans `apps/pwa/.env.local`. Initialisation :

```bash
cp apps/pwa/.env.example apps/pwa/.env.local
```

`EXPO_PUBLIC_APP_URL` désigne désormais l'origine applicative complète :
`https://maroutine.app/app`. Le runtime normalise encore une valeur historique
`https://maroutine.app` en lui ajoutant `/app`, afin de rendre la transition
tolérante aux variables CI non encore mises à jour.

## Déploiements

Le profil combiné reste disponible :

```text
https://maroutine.app/      landing
https://maroutine.app/app/  PWA
```

Cloudflare Pages conserve la commande `npm run web:build` et le dossier de
sortie `dist`. GitLab CI installe une seule fois les workspaces npm, vérifie
Astro et la PWA, construit l'artefact commun puis exécute les E2E PWA sur
`/app`. Le fichier `wrangler.jsonc` racine décrit ce projet `maroutine`.

Le profil PWA dédié demandé utilise :

```text
Projet Pages             maroutine-app
Domaine                  https://app.maroutine.app
Commande de build        npm run build:pwa:cloudflare
Validation               npm run validate:pwa:cloudflare
Dossier de publication   apps/pwa/dist
Base Expo Router         /
```

Sa procédure d'exploitation est décrite dans
[`deploy/cloudflare-pwa-maroutine-app.md`](./deploy/cloudflare-pwa-maroutine-app.md).
Sa configuration Wrangler dédiée se trouve dans `apps/pwa/wrangler.jsonc`.

## Points de vigilance

- Le service worker est servi depuis `/app/service-worker.js` et reste limité
  au scope `/app/`; il ne contrôle pas la landing.
- Sur `app.maroutine.app`, le service worker est servi depuis
  `/service-worker.js` avec le scope `/`.
- Les fichiers PWA (`manifest`, icônes, stickers, métadonnées de build) sont
  également préfixés par `/app`.
- Les URL de redirection Supabase doivent accepter
  `https://maroutine.app/app/**` avant le passage en production.
- Le répertoire `dist/` doit toujours provenir de `npm run build`; ne pas
  publier directement `apps/landing/dist` ou `apps/pwa/dist` pour le profil
  combiné. Le projet dédié publie volontairement `apps/pwa/dist` après le build
  et le validateur Cloudflare.
