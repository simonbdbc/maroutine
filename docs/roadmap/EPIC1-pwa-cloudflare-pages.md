# EPIC 1 — PWA Installable + Déploiement Cloudflare Pages

**Statut : 🚧 En cours**  
**Priorité : Critique**  
**Dépendances amont :** EPIC 0  
**Dépendances aval :** EPIC 2, EPIC 4, EPIC 9

---

## Objectif

Livrer une PWA installable, déployée automatiquement de GitLab vers Cloudflare Pages, en production v1 sur `maroutine.app`.

## Principe d'Architecture

- Build web Expo publié sur Cloudflare Pages.
- Installabilité PWA standard (`manifest.webmanifest`, icônes, standalone).
- Routing SPA et headers/cache minimaux contrôlés.

## Sous-lots

- Installabilité (manifest, icônes, validation Lighthouse).
- Déploiement GitLab -> Cloudflare Pages (preview et prod).
- Domaine custom + HTTPS.
- `_headers` et `_redirects` minimaux.
- Exposition des assets stickers statiques sur Pages (URL stables + cache).

Livrable PWA courant: `public/manifest.webmanifest`, `app/+html.tsx`, `public/icons/*`  
Livrable routing/cache courant: `public/_headers`, `public/_redirects`  
Livrable infra courant: [Runbook Cloudflare Pages + GitLab](../deploy/cloudflare-pages-gitlab-runbook.md)  
Livrable execution E1-T03 courant: [Checklist setup Cloudflare Pages](./EPIC1/E1-T03-cloudflare-pages-setup-checklist.md)  
Livrable execution E1-T04 courant: [Checklist preview branche](./EPIC1/E1-T04-preview-branch-checklist.md)  
Livrable execution E1-T05 courant: [Checklist production sur main](./EPIC1/E1-T05-production-main-checklist.md)  
Livrable execution E1-T06 courant: [Checklist domaine custom + HTTPS](./EPIC1/E1-T06-custom-domain-https-checklist.md)  
Livrable transition domaine courant: [E1-T08 transition maroutine.app](./EPIC1/E1-T08-maroutine-app-transition-plan.md)
Livrable execution E1-T09 courant: [Checklist exposition stickers Pages](./EPIC1/E1-T09-stickers-pages-checklist.md)

## Tickets

| ID | Titre | Statut | Priorité | Lot | Dépendances | Portée | Hors portée | Implémentation attendue | DoD | Tests/QA | Rollback | Observabilité | Risques couverts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E1-T01 | Manifest PWA v1 | 🚧 En cours | Critique | Installabilité | E0-T01 | Créer `manifest.webmanifest` complet | SW avancé | Manifest valide + metadata produit | Chrome détecte installabilité | Lighthouse PWA | Revenir manifest précédent | Vérif install prompt | 1 |
| E1-T02 | Icônes/splash PWA | 🚧 En cours | Critique | Installabilité | E1-T01 | Fournir set d'icônes requis | Rebranding complet | Icônes référencées et servies | Icônes valides toutes tailles | Audit Lighthouse + manuel | Restaurer icônes N-1 | Logs 404 assets | 1 |
| E1-T03 | Setup Cloudflare Pages + GitLab | 🚧 En cours | Critique | Déploiement | E0-T01 | Lier repo GitLab et config build | Infra multi-provider | Pipeline Pages fonctionnel | Build auto sur push | Vérif déploiement auto | Revenir pipeline manuel | Logs build Pages | 1 |
| E1-T04 | Preview par branche | 🚧 En cours | Critique | Déploiement | E1-T03 | Préviews automatiques | QA exhaustive | URL preview stable par branche | Preview dispo sur branche | Test branches | Désactiver preview | Historique previews | 1 |
| E1-T05 | Production sur `main` | 🚧 En cours | Critique | Déploiement | E1-T03 | Déploiement prod continu | Infra multi-provider | Prod auto sur `main` | Site stable en prod | Smoke test prod | Re-deploy version N-1 | Logs incidents prod | 1 |
| E1-T06 | Domaine `maroutine.app` + HTTPS | 🚧 En cours | Critique | Domaine | E1-T05 | DNS + custom domain + TLS | Migration hors Cloudflare Pages | Domaine v1 opérationnel en HTTPS | Certificat valide + redirections OK | Test SSL + accès global | Revenir domaine pages.dev | Monitoring certif | 1 |
| E1-T07 | `_headers` + `_redirects` | 🚧 En cours | Critique | Routing/cache | E1-T05 | Règles SPA et cache de base | Cache fine-grain avancé | Routing SPA sans 404 direct URL | Navigation directe routes OK | Tests routes profondes | Désactiver règles custom | Logs 404/5xx | 1 |
| E1-T08 | Redirection legacy `maroutine.sbcenter.fr` -> `maroutine.app` | 🚧 En cours | Haute | Domaine | E1-T06 | Redirection 301 legacy + rollback | Migration DNS complète hors Pages | Ancien domaine redirigé vers le nouveau | 301 fonctionnelle | Review Ops + curl | Désactiver redirection legacy | Journal décision domaine | 1 |
| E1-T09 | Exposer les stickers statiques sur Cloudflare Pages | 🚧 En cours | Haute | Assets | E1-T05, E1-T07 | Publier un chemin stable des assets stickers (`/stickers/...`) avec règles cache adaptées et intégration web PWA (packs `default/animal/dino/fantastic`) | Download manager offline/versionning/intégrité avancée | Assets stickers accessibles en URL directe sur preview/prod sans 404 | URLs stickers critiques répondent `200` + politique cache cohérente (`immutable` pour versions figées) | Smoke tests URLs assets + QA parcours Home/Profiles avec stickers | Revenir au mapping local actuel sans URL Pages | Logs 404 assets stickers + compteur erreurs chargement | 1 |

## Risques Couverts

- Base de déploiement saine avant offline/sync.
- Isolation des problèmes hébergement vs problèmes offline.

## Critères de Done EPIC

- App installable.
- Déploiement automatique GitLab -> Cloudflare Pages.
- Preview URL par branche.
- Prod stable sur `maroutine.app`.
- Redirection legacy `maroutine.sbcenter.fr` -> `maroutine.app` active.
- Assets stickers critiques servis de manière fiable via Pages.

## Dépendances Amont/Aval

- Amont: EPIC 0.
- Aval: nécessaire pour les validations EPIC 2 et hardening EPIC 9.
