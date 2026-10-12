# E0-T05 — Politique Versionning Packs (Catalogue / Pack / Asset)

**Statut :** Proposé (en revue)  
**Date :** 2026-03-31  
**Ticket :** E0-T05  
**Dépendance :** E0-T01 ([ADR-0001](./adr/ADR-0001-offline-first-architecture.md))

---

## Objectif

Définir un contrat de versionning unique pour éviter les états mixtes de packs et limiter les téléchargements inutiles.

---

## Niveaux de versionning (v1)

| Niveau | Identifiant | Rôle | Comparaison |
|---|---|---|---|
| Catalogue | `catalog_revision` (entier strictement croissant) | Détecter rapidement qu'une vue globale des packs a changé | `remote_revision > local_revision` |
| Pack | `pack_version` (SemVer `MAJOR.MINOR.PATCH`) | Versionner le contenu d'un pack donné | Comparaison SemVer |
| Asset | `sha256` (contenu immuable) | Garantir l'intégrité et éviter redownload d'asset inchangé | Comparaison hash exacte |

---

## Contrat manifeste catalogue

Exemple v1:

```json
{
  "catalog_revision": 42,
  "generated_at": "2026-03-31T15:00:00Z",
  "packs": [
    {
      "pack_id": "animals",
      "pack_version": "2.3.0",
      "manifest_url": "https://cdn.example/packs/animals/2.3.0/manifest.json",
      "manifest_sha256": "sha256:9e3a..."
    }
  ]
}
```

Règles:
- `catalog_revision` augmente dès qu'au moins un `pack_version` change ou qu'un pack est ajouté/supprimé.
- Le catalogue ne contient pas le détail des assets (uniquement pointeur vers manifeste pack).

---

## Contrat manifeste pack

Exemple v1:

```json
{
  "pack_id": "animals",
  "pack_version": "2.3.0",
  "published_at": "2026-03-31T14:30:00Z",
  "assets": [
    {
      "asset_id": "lion",
      "path": "lion.webp",
      "bytes": 128734,
      "sha256": "sha256:5d2f..."
    },
    {
      "asset_id": "tiger",
      "path": "tiger.webp",
      "bytes": 104221,
      "sha256": "sha256:a14c..."
    }
  ]
}
```

Règles:
- `pack_id + pack_version` identifie immuablement un pack publié.
- Chaque asset est identifié par son `sha256` (contenu).
- Un pack n'est `ready` localement que si tous les assets du manifeste sont présents et hash-valides.

---

## Règles de bump SemVer pack

| Changement pack | Bump requis |
|---|---|
| Suppression/renommage asset ou changement incompatible structure manifeste | `MAJOR` |
| Ajout d'asset rétrocompatible | `MINOR` |
| Correction d'asset existant (nouveau binaire, même contrat fonctionnel) | `PATCH` |
| Changement uniquement de métadonnée non fonctionnelle | `PATCH` |

Note: tout changement de `pack_version` implique une nouvelle entrée de catalogue (`catalog_revision++`).

---

## Règles asset (intégrité + cache)

- Asset immuable: `path` versionné par `pack_version`.
- Si contenu change, `sha256` change obligatoirement.
- Aucune réécriture "en place" d'un asset déjà publié sous la même version de pack.
- Réutilisation possible d'un asset inchangé entre versions si hash identique.

---

## Procédure de mise à jour locale (v1)

1. Lire `catalog_revision` distant.
2. Si inchangé: ne rien télécharger.
3. Si changé: comparer chaque `pack_version` avec local.
4. Télécharger manifeste pack cible en staging.
5. Télécharger uniquement assets absents ou hash mismatch.
6. Vérifier complétude + hash.
7. Activer atomiquement nouvelle version (`ready`), puis purge N-1.

---

## Rollback

- Si validation échoue avant activation: conserver version active actuelle.
- Si activation échoue: revenir immédiatement à version active précédente.
- `catalog_revision` distant n'est jamais "rewind" côté client; le rollback local se fait par choix de version active.

---

## Observabilité minimale

- `catalog_revision.local`, `catalog_revision.remote`.
- `pack.update.available` (pack_id, from_version, to_version).
- `pack.validation.failed` (pack_id, asset_id, reason).
- `pack.activation.success|failed`.
- `pack.rollback.triggered`.

---

## Cas limites obligatoires (QA)

| ID | Scénario | Attendu |
|---|---|---|
| V1 | `catalog_revision` change sans changement de `pack_version` | Détection update catalogue, aucun redownload asset |
| V2 | Manifeste pack incomplet | Pack reste `failed` ou `outdated`, jamais `ready` |
| V3 | Hash mismatch sur 1 asset | Re-download ciblé asset, pas activation partielle |
| V4 | Coupure réseau pendant staging | Reprise sans corrompre version active |
| V5 | Rollback après échec activation | Version N-1 reste utilisable |

---

## Hors portée

- Signature cryptographique des manifests (au-delà checksum).
- Stratégie CDN finale multi-région.
- Marketplace et monétisation packs.
