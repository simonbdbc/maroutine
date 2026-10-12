# E1-T05 — Production sur `main` (Checklist d'execution)

**Statut :** En cours  
**Date de demarrage :** 2026-03-31  
**Ticket :** E1-T05  
**Dependance amont :** E1-T03

---

## Objectif

Valider que tout push sur `main` declenche bien un deploiement production Cloudflare
Pages et que les smoke tests minimaux passent.

---

## Parametres de reference

| Champ | Valeur |
|---|---|
| Branche production | `main` |
| Projet Pages | `maroutine` |
| Build command | `npm run web:build:prod` |
| Build output | `dist` |

---

## Execution production

| Controle | Resultat |
|---|---|
| Push sur `main` effectue | [ ] |
| Build prod declenche automatiquement | [ ] |
| Commit SHA deploie correspond au dernier `main` | [ ] |
| Statut deploy = Success | [ ] |

---

## Smoke tests post-deploiement

| Test | Resultat |
|---|---|
| `GET /` retourne 200 | [ ] |
| Navigation interne SPA fonctionnelle | [ ] |
| `GET /manifest.webmanifest` retourne 200 | [ ] |
| `GET /icons/icon-192.png` retourne 200 | [ ] |

---

## Preuves a consigner

- URL production:
- Commit SHA deploie:
- Horodatage deploy:
- Extrait log Cloudflare:

---

## Rollback (N-1)

1. Identifier le dernier deploiement stable N-1 dans Cloudflare.
2. Redeployer N-1.
3. Rejouer les smoke tests ci-dessus.
4. Noter cause racine + action corrective dans le journal de ticket.

---

## Notes operationnelles

- Sur ce projet, `main` est protegee: pas de force-push.
- Un "Retry" relance le meme commit; pour tester un nouveau commit, pousser un nouveau SHA sur `main`.

---

## DoD E1-T05

- [ ] Deploiement prod automatique confirme sur push `main`.
- [ ] Smoke tests prod minimaux valides.
- [ ] Procedure rollback N-1 testee ou documentee.
- [ ] Preuves de deploiement renseignees dans ce document.
