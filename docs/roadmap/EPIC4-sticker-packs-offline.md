# EPIC 4 — Packs de Stickers Offline Permanents

**Statut : 🔲 À faire**  
**Priorité : Très critique**  
**Dépendances amont :** EPIC 2, EPIC 3  
**Dépendances aval :** EPIC 5, EPIC 7, EPIC 9

---

## Objectif

Garantir qu'un pack téléchargé soit réellement disponible hors ligne, de manière prévisible et vérifiable.

## Principe d'Architecture

- Distinguer explicitement cache opportuniste navigateur vs stockage produit géré par l'app.
- Gestion locale des états de pack (`not_downloaded`, `downloading`, `ready`, `failed`, `outdated`, `deleting`).
- Passage en `ready` uniquement après vérification de complétude/intégrité.

## Sous-lots

- Catalogue packs avec états offline.
- Download manager (lot/reprise/échecs partiels).
- Vérification locale de complétude + intégrité.
- UX offline (badges + diagnostics stockage).

## Tickets

| ID | Titre | Statut | Priorité | Lot | Dépendances | Portée | Hors portée | Implémentation attendue | DoD | Tests/QA | Rollback | Observabilité | Risques couverts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E4-T01 | Modèle local packs/assets/downloaded | 🔲 À faire | Très critique | Modèle local | E3-T02, E0-T05 | Définir structure locale packs/offline | Marketplace stickers | Modèle local versionné documenté | Tables/collections validées | Revue schéma + cas limites | Revenir schéma N-1 | Audit état local packs | 2 |
| E4-T02 | Catalogue packs + statuts offline | 🔲 À faire | Très critique | Catalogue | E4-T01 | Afficher liste packs, taille, statut | Design final | UI catalogue fiable | Statuts cohérents localement | QA statuts transitions | Masquer fonctionnalités avancées | Logs transitions état pack | 2 |
| E4-T03 | Download manager lot/reprise | 🔲 À faire | Très critique | Téléchargement | E4-T02 | Téléchargement paqueté + reprise | Delta update optimisé | Manager robuste aux coupures | Reprise fonctionne après interruption | Tests coupure réseau | Désactiver reprise et fallback simple | Logs jobs download | 2, 4 |
| E4-T04 | Vérification complétude + intégrité | 🔲 À faire | Très critique | Validation pack | E4-T03 | Vérifier checksums/taille/listes | Signature cryptographique avancée | Validation systématique avant ready | Jamais de ready partiel | Tests assets manquants/corrompus | Revenir à validation stricte minimale | Logs erreurs validation | 2, 4 |
| E4-T05 | Activation stricte du statut ready | 🔲 À faire | Critique | Lifecycle pack | E4-T04 | Bloquer `ready` si validation incomplète | Auto-réparation complète | Contrat d'état appliqué | `ready` uniquement si pack complet | Tests machine d'état | Forcer retour `failed` | Metrics packs ready/failed | 2 |
| E4-T06 | Suppression manuelle + diagnostics stockage | 🔲 À faire | Haute | UX/diagnostic | E4-T02 | Supprimer pack + afficher stockage | Nettoyage OS avancé | Suppression contrôlée et visible | Suppression libère l'espace attendu | QA suppression/re-téléchargement | Désactiver suppression de masse | Logs suppression + taille disque | 2 |

## Risques Couverts

- Risque 2: confusion cache vs stockage permanent.
- Risque 4: packs incohérents.

## Critères de Done EPIC

- Un pack téléchargé apparaît explicitement "offline".
- Le pack reste utilisable hors réseau.
- Intégrité vérifiée avant activation.
- Suppression manuelle possible.

## Dépendances Amont/Aval

- Amont: EPIC 2, EPIC 3.
- Aval: nécessaire pour versionning atomique (EPIC 5) et hardening (EPIC 9).
