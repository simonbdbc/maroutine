# EPIC 13 — Adaptation Home Smartphone (Compact)

**Statut : 🚧 En cours**  
**Priorité : Haute**  
**Dépendances amont :** EPIC 11  
**Dépendances aval :** EPIC 9 (hardening QA)

---

## Objectif

Adapter l'écran Home au format téléphone uniquement (smartphone), sans dégrader les rendus tablette et desktop.

Périmètre produit demandé:
- réduire la taille du header Home,
- réduire la taille de l'icône profil,
- réduire la taille du bouton bas de page,
- réduire la taille des headers de cards activités/moments et des stickers,
- appliquer ces changements uniquement sur smartphone.

## Principe d'Architecture

- Introduire un contrat responsive unique pour Home (`isSmartphoneHome` + métriques associées).
- Appliquer des styles compacts conditionnels uniquement quand `isSmartphoneHome === true`.
- Conserver le rendu existant inchangé pour tablette/desktop.
- Centraliser les tailles (spacing, radius, typo, dimensions stickers/avatar/CTA) pour éviter la dette inline.

## Sous-lots

- Contrat responsive smartphone-only Home.
- Header Home et avatar profil compacts.
- CTA bas de page compact.
- Cards moments/activités et stickers compacts.
- Garde-fous de non-régression tablette/desktop + QA manuelle.

## Tickets

| ID | Titre | Statut | Priorité | Lot | Dépendances | Portée | Hors portée | Implémentation attendue | DoD | Tests/QA | Rollback | Observabilité | Risques couverts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E13-T01 | Définir le contrat responsive Home smartphone-only | ✅ Fait | Critique | Architecture UI | E11-T23 | Créer une source unique de vérité (breakpoint + tokens de taille) pour Home smartphone | Refonte responsive globale de toute l'app | Helper/mapping responsive Home centralisé et réutilisable | Le mode compact est activé uniquement sur smartphone, jamais sur tablette/desktop | `src/features/home/utils/homeResponsiveCore.ts` + `src/features/home/utils/homeResponsive.ts` | Revenir au rendu statique actuel | Trace debug (dev) du mode layout résolu | 1, 5 |
| E13-T02 | Compacter le header Home sur smartphone | ✅ Fait | Haute | UI Home | E13-T01 | Réduire paddings, hauteur visuelle, rayons et tailles typo du header Home | Changement visuel tablette/desktop | Header lisible et plus dense sur smartphone uniquement | Header compact validé sur petits écrans (320-430dp) | `HomeHeader` branché sur `HOME_LAYOUT_METRICS.header` | Revenir styles header actuels | Captures avant/après Home header | 1, 3, 5 |
| E13-T03 | Réduire l'icône profil Home sur smartphone | ✅ Fait | Haute | UI Home | E13-T01 | Diminuer tailles avatar/ring/bordure de l'icône profil dans Home | Changement de taille avatar dans l'écran Profiles | Avatar conserve lisibilité sticker et équilibre visuel en mode compact | Taille avatar réduite uniquement sur smartphone | `HOME_LAYOUT_METRICS.header.imageSize/ring*` + `HomeHeader` | Revenir tailles avatar actuelles | Screenshot regression avatar home | 1, 2, 3 |
| E13-T04 | Compacter le bouton bas de page (validation journée) sur smartphone | ✅ Fait | Haute | UI Home | E13-T01 | Réduire hauteur, padding, typo et icône du CTA bas de page sur smartphone | Modification du comportement de validation | CTA compact mais accessible (zone tactile min 44px) | Aucun impact tablette/desktop, interaction inchangée | `ValidateDayButton` branché sur `HOME_LAYOUT_METRICS.validateButton` | Revenir dimensions CTA actuelles | Logs interaction CTA (si existants) | 2, 3 |
| E13-T05 | Compacter les headers de cards moments/activités sur smartphone | ✅ Fait | Haute | UI Home | E13-T01 | Réduire tailles/paddings des headers de sections Home (moments/activités) | Refonte structure métier des cards | Cards plus denses sans perte de lisibilité | Alignement visuel cohérent entre toutes sections Home | `MomentSection` + `ActivityCard` branchés sur `HOME_LAYOUT_METRICS` | Revenir styles cards actuels | Captures comparatives sections Home | 1, 3, 5 |
| E13-T06 | Réduire la taille des stickers Home sur smartphone | ✅ Fait | Haute | UI Home | E13-T05 | Diminuer dimensions stickers/slots/check badges en mode compact | Changement assets stickers ou packs | Stickers restent nets et compréhensibles sur smartphone | Aucun clipping/overflow en mode compact | `StickerSlot` branché sur `HOME_LAYOUT_METRICS.stickerSlot` | Revenir tailles stickers actuelles | Suivi erreurs rendu image/sticker | 2, 3, 5 |
| E13-T07 | Garde-fous non-régression tablette/desktop Home | ✅ Fait | Haute | Qualité | E13-T02, E13-T03, E13-T04, E13-T05, E13-T06 | Ajouter checks/tests ciblés pour garantir smartphone-only et protéger le layout non-phone | Mise en place d'une infra e2e complète | Scénarios automatisés sur breakpoints Home critiques | Preuve automatisée que tablette/desktop restent inchangés | `tests/e13-t07/run.ts` + `npm run test:e13-t07` | Désactiver garde-fou en warning temporaire | Rapport CI des variants responsive | 1, 5 |
| E13-T08 | QA manuelle finale Home smartphone + validation produit | 🚧 En cours | Moyenne | QA / Docs | E13-T07 | Recette manuelle dédiée Home sur smartphones (iOS/Android) + non-régression tablette/desktop | Audit UX complet de toute l'app | Checklist QA validée et partagée avec preuves visuelles | Go/no-go produit explicite avant merge final | Voir `docs/roadmap/EPIC13/E13-T08-home-qa-checklist.md` | Revert du lot EPIC13 en cas de blocage | Journal de recette + anomalies | 1, 2, 3, 5 |

## Risques Couverts

- **1**: Régression visuelle tablette/desktop lors de l'ajout du mode compact.
- **2**: Réduction excessive des cibles tactiles sur smartphone.
- **3**: Perte de lisibilité (typo, stickers, hiérarchie visuelle).
- **5**: Dette responsive via styles ad hoc non centralisés.

## Critères de Done EPIC

- Le Home est compact sur smartphone uniquement.
- Le rendu tablette/desktop reste inchangé.
- Header, icône profil, CTA bas, headers de cards et stickers sont réduits de façon cohérente.
- Les garde-fous de non-régression responsive sont actifs.
- Une recette manuelle multi-devices est validée.

## Dépendances Amont/Aval

- Amont: EPIC 11 (socle thème/tokens stable).
- Aval: EPIC 9 (hardening QA prod) pour consolider les scénarios responsive en continu.
