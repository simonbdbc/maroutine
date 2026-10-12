# Cloudflare Pages + GitLab — Runbook EPIC1 (E1-T03 à E1-T06)

## Objectif

Mettre en place le pipeline GitLab -> Cloudflare Pages pour:
- previews automatiques par branche;
- production automatique sur `main`;
- domaine `maroutine.app` en HTTPS.

## Pré-requis

- Repo GitLab accessible depuis Cloudflare.
- Build web valide localement via `npm run web:build:prod`.
- Variables d'environnement minimales:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Variable optionnelle (si login Google active):
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

## E1-T03 — Setup projet Cloudflare Pages

1. Dans Cloudflare, créer un projet Pages.
2. Connecter le provider GitLab et sélectionner le repository `maroutine`.
3. Configurer:
   - branch prod: `main`
   - build command: `npm run web:build:prod`
   - build output directory: `dist`
   - node version: `20`
4. Définir les variables d'environnement Pages (Preview + Production).
5. Lancer un premier build manuel et vérifier que `dist/` est servi.

L'artefact contient la landing à `/` et la PWA à `/app/`. Ne pas configurer
`apps/landing/dist` ou `apps/pwa/dist` comme dossier de sortie Pages.

## E1-T04 — Preview par branche

1. Push un commit sur la branche cible (ex: `codex/epic1`).
2. Vérifier que le déploiement preview démarre automatiquement.
3. Vérifier qu'une branche dispose d'une URL preview stable.
4. Contrôler que les variables preview sont isolées de la prod.
5. Enregistrer dans le journal de ticket:
   - URL preview
   - commit SHA
   - statut build

Note opérationnelle:
- Ne pas utiliser "Retry" d'un ancien déploiement pour valider un nouveau commit.

## E1-T05 — Production sur main

1. Vérifier que chaque push sur `main` déclenche un déploiement prod.
2. Vérifier les smoke tests minimaux:
   - chargement `/`
   - navigation interne SPA
   - présence `manifest.webmanifest`
3. Documenter la procédure de rollback:
   - redeploy du commit N-1 depuis Cloudflare.

Note opérationnelle:
- La branche `main` est protégée: éviter tout force-push.
- "Retry" relance le même commit; pousser un nouveau SHA pour valider un nouveau déploiement.

## E1-T06 — Domaine custom + HTTPS

1. Ajouter `maroutine.app` comme custom domain du projet Pages.
2. Créer/ajuster l'entrée DNS côté zone Cloudflare.
3. Vérifier émission du certificat TLS.
4. Vérifier:
   - HTTPS actif
   - absence d'erreur certificat
   - redirections HTTP -> HTTPS (si configurées).

### DNS cible `maroutine.app`

La zone importée depuis OVH contient souvent des entrées web de parking:

- `A maroutine.app -> 213.186.33.5`
- `A www -> 213.186.33.5`
- `TXT maroutine.app -> "1|www.maroutine.app"`
- `TXT www -> "3|welcome"`

Pour servir l'app via Cloudflare Pages, ne pas conserver les deux `A` OVH.
Ajouter le domaine depuis `Workers & Pages > maroutine > Custom domains` et
laisser Cloudflare créer les enregistrements Pages recommandés. La cible doit
pointer vers le projet Pages, typiquement:

| Type | Name | Content | Proxy |
|---|---|---|---|
| `CNAME` | `maroutine.app` | `maroutine.pages.dev` | Proxied |
| `CNAME` | `www` | `maroutine.pages.dev` | Proxied |

Si Cloudflare crée une cible différente pour le projet Pages, utiliser la cible
proposée par Cloudflare.

Conserver les enregistrements mail OVH:

| Type | Name | Content | Proxy |
|---|---|---|---|
| `MX` | `maroutine.app` | `mx1.mail.ovh.net` | DNS only |
| `MX` | `maroutine.app` | `mx2.mail.ovh.net` | DNS only |
| `MX` | `maroutine.app` | `mx3.mail.ovh.net` | DNS only |
| `TXT` | `maroutine.app` | `v=spf1 include:mx.ovh.com -all` | DNS only |

Recommandations:

- Supprimer les TXT OVH de redirection web (`"1|www.maroutine.app"` et
  `"3|welcome"`) après validation du domaine Pages.
- Passer `ftp.maroutine.app` en `DNS only` si un accès FTP OVH est encore
  utilisé; sinon supprimer l'entrée.
- Ajouter DMARC/DKIM/MTA-STS plus tard si l'email devient critique.

Note opérationnelle:
- Conserver temporairement l'URL `pages.dev` comme fallback durant la validation.
- Ne basculer la communication utilisateur qu'après certificat `Active`.

## Redirection legacy

Après validation de `maroutine.app`, configurer une redirection 301 côté
Cloudflare depuis `https://maroutine.sbcenter.fr/*` vers
`https://maroutine.app/:path`.

Cette redirection doit être gérée dans Cloudflare Redirect Rules ou Bulk
Redirects. Ne pas la mettre dans `public/_redirects`: Cloudflare Pages ne prend
pas en charge les redirections de niveau domaine dans ce fichier.

Configuration recommandée:

- condition: host equals `maroutine.sbcenter.fr`
- destination: `https://maroutine.app/${path}`
- status: `301`
- conserver query string: oui

La build applicative contient aussi un bandeau de redirection si l'utilisateur
ouvre une URL non canonique. Ce bandeau évite de forcer une navigation hors
scope dans une PWA déjà installée.

## Supabase Auth

Dans Supabase `Authentication > URL Configuration`:

- `Site URL`: `https://maroutine.app/app`
- `Redirect URLs`: ajouter `https://maroutine.app/app/**`
- conserver temporairement `https://maroutine.sbcenter.fr/**` pendant la
  transition si des liens email déjà envoyés pointent encore vers le domaine
  legacy.

## Validation rapide post-déploiement

- `GET /` retourne 200.
- `GET /robots.txt` retourne 200.
- `GET /app/manifest.webmanifest` retourne 200.
- `GET /app/version.json` retourne 200.
- `GET /app/icons/icon-192.png` retourne 200.
- navigation directe sur une route profonde retourne bien l'app (SPA fallback).

## Rollback

1. Identifier le dernier déploiement stable.
2. Redeployer ce build.
3. Vérifier les endpoints ci-dessus.
4. Ouvrir un incident avec cause racine et actions correctives.
