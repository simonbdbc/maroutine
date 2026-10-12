# E1-T06 — Domaine custom `maroutine.app` + HTTPS (Checklist d'execution)

**Statut :** En cours  
**Date de demarrage :** 2026-03-31  
**Ticket :** E1-T06  
**Dependance amont :** E1-T05

---

## Objectif

Attacher `maroutine.app` au projet Cloudflare Pages `maroutine`,
activer HTTPS valide et verifier l'accessibilite en production.

---

## Configuration cible

| Champ | Valeur cible | Renseignee |
|---|---|---|
| Projet Pages | `maroutine` | [ ] |
| Domaine custom | `maroutine.app` | [ ] |
| Domaine fallback | `*.pages.dev` conserve temporairement | [ ] |
| Redirection legacy | `maroutine.sbcenter.fr` -> `maroutine.app` en 301 | [ ] |
| TLS | Certificat "Active" | [ ] |

## DNS cible

| Type | Name | Content | Proxy status | Statut |
|---|---|---|---|---|
| `CNAME` | `maroutine.app` | cible Pages proposee par Cloudflare, ex. `maroutine.pages.dev` | Proxied | [ ] |
| `CNAME` | `www` | cible Pages proposee par Cloudflare, ex. `maroutine.pages.dev` | Proxied | [ ] |
| `MX` | `maroutine.app` | `mx1.mail.ovh.net` | DNS only | [ ] |
| `MX` | `maroutine.app` | `mx2.mail.ovh.net` | DNS only | [ ] |
| `MX` | `maroutine.app` | `mx3.mail.ovh.net` | DNS only | [ ] |
| `TXT` | `maroutine.app` | `v=spf1 include:mx.ovh.com -all` | DNS only | [ ] |

À supprimer/remplacer:

- `A maroutine.app -> 213.186.33.5`
- `A www -> 213.186.33.5`
- `TXT maroutine.app -> "1|www.maroutine.app"`
- `TXT www -> "3|welcome"`

À décider:

- `CNAME ftp -> maroutine.app`: passer en `DNS only` si FTP encore utilisé,
  sinon supprimer.

---

## Etapes Cloudflare (Pages + DNS)

1. Ouvrir `Workers & Pages > maroutine > Custom domains`.
2. Ajouter `maroutine.app`.
3. Appliquer la configuration DNS recommandee par Cloudflare
   (en general CNAME proxied vers le domaine Pages).
4. Attendre le passage du certificat en `Active`.
5. Configurer la redirection 301 legacy `maroutine.sbcenter.fr/*` vers
   `https://maroutine.app/:path` via Redirect Rules ou Bulk Redirects.

---

## Verification HTTPS et acces

| Controle | Resultat |
|---|---|
| `https://maroutine.app` repond | [ ] |
| Certificat TLS valide (chaine complete) | [ ] |
| Pas d'alerte navigateur | [ ] |
| Redirection HTTP -> HTTPS active (si souhaitee) | [ ] |
| `https://maroutine.sbcenter.fr` redirige en 301 vers `https://maroutine.app` | [ ] |
| `GET /manifest.webmanifest` retourne 200 | [ ] |
| `GET /version.json` retourne 200 | [ ] |

---

## Commandes de verification (local)

```bash
curl -I https://maroutine.app/
curl -I https://maroutine.app/manifest.webmanifest
curl -I https://maroutine.app/version.json
curl -I http://maroutine.app/
curl -I https://maroutine.sbcenter.fr/
```

---

## Preuves a consigner

- URL custom verifiee:
- Horodatage validation:
- Statut certificat Cloudflare:
- Extrait de `curl -I`:

---

## Rollback

1. Retirer temporairement le domaine custom du projet Pages.
2. Revenir sur l'URL `pages.dev` comme point d'entree.
3. Corriger DNS/TLS puis re-attacher le domaine custom.

---

## DoD E1-T06

- [ ] `maroutine.app` resolu vers Pages.
- [ ] Certificat TLS actif et valide.
- [ ] Endpoint principal et manifest accessibles en HTTPS.
- [ ] Redirection 301 legacy `maroutine.sbcenter.fr` -> `maroutine.app` active.
- [ ] Preuves de validation renseignees.
