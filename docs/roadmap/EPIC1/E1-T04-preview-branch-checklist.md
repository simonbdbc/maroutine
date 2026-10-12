# E1-T04 — Preview par branche (Checklist d'execution)

**Statut :** En cours  
**Date de demarrage :** 2026-03-31  
**Ticket :** E1-T04  
**Dependance amont :** E1-T03

---

## Objectif

Verifier que chaque push sur une branche non `main` declenche un deploy preview
Cloudflare Pages avec une URL stable exploitable pour la validation.

---

## Branche de validation

| Champ | Valeur |
|---|---|
| Branche test | `codex/epic1` |
| Commit teste | |
| Date/heure | |

---

## Verification preview

| Point de controle | Resultat |
|---|---|
| Build declenche automatiquement apres push | [ ] |
| URL preview generee | [ ] |
| URL preview stable au redeploy de la meme branche | [ ] |
| Statut build = success | [ ] |

---

## Verification isolation env

| Controle | Resultat |
|---|---|
| Variables Preview configurees | [ ] |
| Variables Production inchangées | [ ] |
| Aucune fuite de secret/prod dans preview | [ ] |

---

## Preuves a consigner

- URL preview:
- Commit SHA deploye:
- Statut build Cloudflare:
- Capture/log deploiement:

---

## DoD E1-T04

- [ ] Un push branche declenche un deploy preview.
- [ ] L'URL preview est documentee et reutilisable.
- [ ] L'isolation preview/prod est verifiee.
- [ ] Les preuves sont consignees dans ce document.

---

## Rollback

1. Suspendre l'usage de l'URL preview concernee.
2. Corriger la configuration build/env de la branche.
3. Relancer un deploy preview sur nouveau commit.
