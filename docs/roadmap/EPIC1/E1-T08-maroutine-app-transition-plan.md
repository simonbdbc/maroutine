# E1-T08 — Migration `maroutine.app` + redirection legacy

**Statut :** En cours

**Date :** 2026-05-28

**Ticket :** E1-T08  
**Dépendance :** E1-T06

---

## Objectif

Basculer le domaine principal de production vers `maroutine.app` sans
interruption majeure, puis rediriger l'ancien domaine vers le nouveau.

---

## Hypothèses

- `maroutine.app` devient la prod v1 stable.
- `maroutine.sbcenter.fr` reste un domaine legacy à rediriger.
- L'hébergement reste Cloudflare Pages.

---

## Stratégie de migration

1. **Préparer le domaine cible**
   - ajouter `maroutine.app` sur le projet Pages;
   - activer TLS et vérifier certificat.
2. **Phase dual-domain**
   - servir l'app simultanément sur les 2 domaines;
   - vérifier que les sessions et assets fonctionnent sur `maroutine.app`.
3. **Bascule canonique**
   - considérer `maroutine.app` comme domaine principal;
   - rediriger 301 de `maroutine.sbcenter.fr` vers `maroutine.app`.
   - afficher un bandeau de redirection côté app si une URL non canonique est
     ouverte dans une PWA déjà installée.
4. **Stabilisation**
   - monitorer erreurs web, SEO, auth callback, métriques trafic.

---

## Points de vigilance

- OAuth/redirect URIs: mettre à jour les URLs autorisées (Supabase/Auth providers).
- CORS/API allowlist: inclure `https://maroutine.app`.
- Service worker/cache: éviter conflits de scope inter-domaines.
- Cookies/session: vérifier stratégie de domaine si cookies utilisés.
- Cloudflare Pages `_redirects` ne gère pas les redirections de niveau domaine;
  utiliser Redirect Rules ou Bulk Redirects pour le 301 legacy.
- PWA installées: une PWA déjà installée sur `maroutine.sbcenter.fr` reste liée
  à cet origin; elle peut rediriger vers `maroutine.app`, mais une installation
  propre sur le nouveau domaine nécessite réinstallation.

---

## Plan d'exécution (runbook)

## J-7 à J-1

- Valider TLS `maroutine.app`.
- Tester preview/staging sur domaine cible.
- Préparer communication interne et checklist rollback.

## Jour J

1. Déployer version applicative stable.
2. Activer redirection 301 `maroutine.sbcenter.fr` -> `maroutine.app`.
3. Vérifier smoke tests:
   - `/`
   - `/version.json`
   - routes profondes
   - auth login/logout
   - installabilité PWA
4. Surveiller 2h les erreurs (4xx/5xx).

## J+1 à J+7

- Confirmer baisse d'usage du domaine source.
- Garder redirection active.
- Mettre à jour les docs produit/support.

---

## Rollback

Déclencheurs rollback:
- hausse d'erreurs auth;
- erreurs TLS/domaine;
- régression critique navigation.

Actions:
1. Désactiver redirection 301.
2. Revenir temporairement au domaine Pages fallback ou au domaine legacy.
3. Communiquer incident et ETA correctif.

---

## Critères d'acceptation

- `maroutine.app` sert la prod stable en HTTPS.
- Redirection 301 fonctionnelle depuis `maroutine.sbcenter.fr`.
- Bandeau de redirection présent si l'app est ouverte sur une URL non canonique.
- Aucun incident critique auth/navigation sur 7 jours.
