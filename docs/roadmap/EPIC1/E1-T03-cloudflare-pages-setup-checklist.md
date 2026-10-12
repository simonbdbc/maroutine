# E1-T03 — Setup Cloudflare Pages + GitLab (Checklist d'execution)

**Statut :** En cours  
**Date de demarrage :** 2026-03-31  
**Ticket :** E1-T03  
**Dependance amont :** E0-T01

---

## Objectif

Configurer le projet Cloudflare Pages relie au repository GitLab `maroutine`
avec un build web Expo fiable et reproductible.

---

## Configuration cible

| Cle | Valeur cible | Renseignee |
|---|---|---|
| Git provider | GitLab | [ ] |
| Repository | `simonbdbc/maroutine` | [ ] |
| Production branch | `main` | [ ] |
| Build command | `npm run web:build:prod` | [ ] |
| Build output directory | `dist` | [ ] |
| Node version | `20` minimum | [ ] |

---

## Variables d'environnement Pages

Configurer les memes variables sur les environnements Preview et Production.

| Variable | Preview | Production |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | [ ] | [ ] |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | [ ] | [ ] |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (optionnelle) | [ ] | [ ] |

---

## Validation du ticket (preuves)

| Point de controle | Valeur constatee |
|---|---|
| URL premier build preview | |
| Commit SHA deploye | |
| Statut build Pages | |
| Verification `GET /` (200) | |
| Verification `GET /manifest.webmanifest` (200) | |

---

## DoD E1-T03

- [ ] Projet Cloudflare Pages cree et connecte a GitLab.
- [ ] Build automatique configure avec `npm run web:build:prod`.
- [ ] Variables d'environnement renseignees pour Preview + Production.
- [ ] Premier deploy execute avec succes.
- [ ] Trace de preuve completee dans ce document.

---

## Rollback

1. Desactiver le projet Pages si build invalide.
2. Revenir au dernier hebergement stable.
3. Corriger configuration build/env puis relancer un deploy.
