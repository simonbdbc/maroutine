# ADR-0001 — Architecture Offline-First v1 (EPIC 0 / E0-T01)

**Statut :** Proposé (en revue)  
**Date :** 2026-03-31  
**Ticket :** E0-T01  
**Portée :** v1 web-first (`maroutine.app`)

---

## Contexte

L'application doit rester utilisable hors ligne de manière fiable, sans dépendre d'un cache opportuniste navigateur.  
Les risques principaux à couvrir sont:

- confusion cache réseau vs stockage durable;
- absence de journal explicite des écritures à synchroniser;
- dépendance réseau des écrans métier critiques.

Précondition produit:
- la création de compte, la connexion initiale et la vérification email nécessitent le réseau;
- le mode offline métier est accessible uniquement après authentification réussie et session locale persistée.

---

## Décision

Nous adoptons une architecture **offline-first local-first** avec les règles suivantes:

1. Les écrans métier critiques lisent depuis la base locale (WatermelonDB) uniquement.
2. Les écritures sont persistées localement en priorité puis journalisées dans une outbox locale explicite (`sync_queue`).
3. Supabase (Auth/Postgres/Storage) est un backend distant de synchronisation, pas une source de lecture directe pour les écrans critiques.
4. Le service worker est limité au shell d'application et aux optimisations réseau non métier.
5. Les packs stickers sont gérés dans une couche dédiée (catalogue/version/download/intégrité), distincte du cache navigateur.

---

## Couches et responsabilités

| Couche | Responsabilité | Interdits |
|---|---|---|
| UI (écrans critiques) | Afficher et muter via use-cases/repositories | Appels Supabase directs |
| Domaine / Use-cases | Orchestration métier, validations | Accès HTTP direct |
| Repositories local-first | API unique lecture/écriture pour la UI | Logique d'affichage |
| Persistance locale (WatermelonDB) | Source de vérité locale durable | Dépendance UI |
| Moteur de sync (outbox) | Envoi différé, retry, idempotence, conflits | Couplage à la UI |
| Adapters distants (Supabase) | Auth/Storage/Postgres côté réseau | Lecture UI critique |

---

## Invariants d'architecture

- Aucune lecture Supabase directe depuis un écran critique.
- Toute écriture métier critique crée une trace locale synchronisable.
- L'état affiché provient d'abord du local; le distant converge ensuite.
- L'absence réseau ne doit pas bloquer les parcours métier critiques déjà autorisés localement.
- L'absence réseau ne garantit pas l'onboarding/auth initiale: ce flux reste online-only.
- La résolution de conflits v1 est centralisée dans le moteur de sync (politique détaillée en E0-T04).

---

## Conséquences

### Positives

- Comportement offline prévisible et durable.
- Découplage net UI/réseau.
- Base claire pour observabilité et débogage des sync.

### Coûts / compromis

- Complexité initiale plus élevée (repositories + outbox + règles strictes).
- Gestion explicite de conflits et idempotence obligatoire.
- Discipline de code nécessaire (garde-fous anti-accès direct réseau).

---

## Alternatives rejetées

1. **Online-first + cache opportuniste**: simple au départ mais fragile en offline réel.
2. **UI lisant Supabase directement**: couplage réseau fort, non conforme au besoin offline-first.
3. **Service worker avec logique métier/cache API agressif**: risques élevés d'incohérence et de debug difficile.

---

## Rollback

Si cette décision s'avère invalide, rollback documentaire vers la version précédente de l'ADR et réouverture des tickets dépendants avant implémentation lourde.

---

## Tickets liés

- E0-T02: matrice source de vérité par type de donnée.
- E0-T03: diagrammes lecture/écriture/sync.
- E0-T04: politique conflits v1.
- E0-T05: politique versionning packs.
- E0-T06: audit anti-Supabase direct UI.
