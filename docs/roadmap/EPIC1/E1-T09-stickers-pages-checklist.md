# E1-T09 — Exposer les Stickers Statiques sur Cloudflare Pages (Checklist d'execution)

## Objectif

Garantir que les assets stickers necessaires a la PWA soient accessibles par URL directe
sur Cloudflare Pages (preview + production), sans erreur 404.

## Prerequis

- E1-T05 operationnel (deploiement production sur `main`).
- E1-T07 operationnel (`_headers` + `_redirects` de base).
- Inventaire des stickers critiques utilise par l'app (Home/Profiles).
- Structure packs cible:
  - `default` (image fallback)
  - `animal`
  - `dino`
  - `fantastic`

## Scope d'execution

1. Definir une arborescence publique stable (`/stickers/<pack>/<asset>.png|webp`).
2. Publier les assets dans `public/stickers/` avec conventions de nommage stables.
3. Mettre a jour le mapping applicatif vers ces URLs (sans casser le fallback local).
4. Ajouter/ajuster les regles cache dans `public/_headers`:
   - assets versionnes: `Cache-Control: public, max-age=31536000, immutable`
   - index/manifest non versionnes: cache controle strict.
5. Verifier le rendu stickers sur les ecrans critiques.

## Commandes locales

```sh
npm run sync:stickers:public
npm run lint:stickers:pages
```

## Checklist

- [x] `public/stickers/` contient les assets requis.
- [ ] URLs stickers critiques repondent `200` en preview.
- [ ] URLs stickers critiques repondent `200` en production.
- [ ] Aucune erreur 404 stickers dans les logs Cloudflare Pages.
- [ ] Home et Profiles affichent les stickers sans regression visuelle.
- [ ] Politique cache conforme (immutable uniquement sur assets versionnes).

## Constat validation (13 avril 2026)

- Verification locale: `sync:stickers:public` + `lint:stickers:pages` OK.
- Verification distante (`maroutine.app` et `maroutine.pages.dev`):
  - les URLs `/stickers/...` repondent `200`, mais avec `content-type: text/html` et `cache-control: max-age=0`.
  - le body retourne l'`index.html` (fallback SPA), donc les stickers ne sont pas encore servis comme assets statiques.

## Validation manuelle

- Ouvrir 10 URLs stickers representatifs (packs differents) en preview et prod.
- Verifier les headers de reponse (`Cache-Control`, `Content-Type`).
- Verifier parcours:
  - Home (cartes/sections avec stickers),
  - Profiles (avatar/picker),
  - ecrans fallback si asset absent.

## Rollback

1. Revenir au mapping sticker precedent (fallback local uniquement).
2. Retirer les regles cache ajoutees pour `public/stickers/*`.
3. Redeployer la derniere version stable.

## Observabilite minimale

- Compter les `404` sur `/stickers/*`.
- Tracer les erreurs de chargement image cote client (`sticker.load.failed`).
