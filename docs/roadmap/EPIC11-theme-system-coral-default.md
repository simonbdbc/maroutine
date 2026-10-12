# EPIC 11 — Refonte Système de Thème + `coralSunrise` par Défaut

**Statut : 🚧 En cours**  
**Priorité : Haute**  
**Dépendances amont :** —  
**Dépendances aval :** Tous les tickets UI futurs

---

## Objectif

Mettre en place un système de thème unifié et strict pour l'application:
- thème par défaut global = `coralSunrise`,
- socle thème global fixé: `primary=#FF6B6B`, `secondary=#FFD700`, `grey=#E2E8F3`, `white=#FFF9F7`, `black=#000000`, `success=#15803D`, `error=#DC2626`, `warning=#B45309`,
- pastels dérivés automatiquement via `hexToPastel(..., 0.75)` (pas de pastel codé en dur),
- zéro couleur inline dans le code applicatif,
- usage exclusif soit des couleurs centralisées du thème, soit des couleurs de profil quand elles existent,
- restauration des palettes profils sélectionnables (16 primary + 16 secondary) avec defaults coral/or.

## Principe d'Architecture

- Source unique des couleurs (thèmes nommés + tokens sémantiques).
- Interdiction des couleurs inline hors fichiers explicitement autorisés.
- Règle de priorité explicite:
  - écrans/composants non personnalisés -> thème par défaut centralisé,
  - zones personnalisées par profil -> couleurs du profil (avec fallback thème).
- Règle v2 explicite: `white` reste la couleur de texte de référence sur fonds `primary`.
- Modèle profil: 2 palettes indépendantes (primary/secondary), normalisation nearest-color déterministe des valeurs legacy.
- Alignement des couleurs applicatives sur toutes les surfaces (web, PWA, native config Expo).

## Sous-lots

- Design tokens / thèmes centralisés.
- Activation du thème `coralSunrise` par défaut.
- Migration progressive des écrans/features vers tokens.
- Garde-fous CI/lint anti-réintroduction.
- QA visuelle et accessibilité des contrastes.

## Tickets

| ID | Titre | Statut | Priorité | Lot | Dépendances | Portée | Hors portée | Implémentation attendue | DoD | Tests/QA | Rollback | Observabilité | Risques couverts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E11-T01 | Source unique des thèmes (`themes.ts`) | 🚧 En cours | Haute | Architecture thème | — | Centraliser toutes les couleurs dans un module unique (`coralSunrise`, variantes futures) | Refonte UX complète | `themes.ts` + mapping tokens sémantiques partagés par RN + Tailwind | Plus de duplication entre `tokens.ts` et `tailwind.config.js` pour les couleurs | Tests unitaires mapping tokens | Revenir au mapping précédent derrière un adaptateur | Log de résolution du thème au démarrage | T1, T5 |
| E11-T02 | Activer `coralSunrise` par défaut | 🚧 En cours | Haute | Thème par défaut | E11-T01 | Basculer le thème applicatif par défaut vers `coralSunrise` | Thème dynamique utilisateur (runtime toggle) | `DEFAULT_THEME` branché partout (UI, composants, fallbacks) | L'application démarre en `coralSunrise` sur web et mobile | Snapshot visuel pages clés | Restaurer ancien `DEFAULT_THEME` | Event de boot thème (`theme=coralSunrise`) | T1, T2 |
| E11-T03 | Aligner couleurs système web/PWA/Expo | 🚧 En cours | Haute | Intégration plateforme | E11-T02 | Harmoniser `app.json`, `manifest.webmanifest`, meta `theme-color`, background web | Rebranding assets icônes/splash | Couleurs système alignées avec le thème par défaut | Aucune divergence de couleur entre shell web, PWA et Expo config | Vérification manuelle install PWA + lancement mobile | Restaurer anciennes valeurs config | Check de cohérence config au build | T2 |
| E11-T04 | Utilitaires couleur centralisés (alpha/variants) | ✅ Fait | Haute | Outillage thème | E11-T01 | Fournir helper central (`withAlpha`, variantes pastel) et supprimer concat `+ "22"` | Générateur design avancé | Tous les usages d'opacité passent par utilitaires partagés | Aucune concaténation d'hex en dur dans le code cible | Tests unitaires utilitaires | Revenir helper legacy temporaire | Alerte lint sur concat couleur | T1, T5 |
| E11-T05 | Migration composants UI partagés | ✅ Fait | Haute | UI shared | E11-T01, E11-T04 | Migrer `src/shared/components/ui/*` vers tokens centraux | Refonte structurelle des composants | Composants UI sans hex/rgba inline | 0 couleur inline dans `src/shared/components/ui` | Tests unitaires + snapshots composants | Réactiver styles legacy composant par composant | Compteur inline-colors par dossier | T1, T5 |
| E11-T06 | Migration Auth + Layout | ✅ Fait | Haute | UI features | E11-T05 | Migrer `app/(auth)/*`, `src/features/auth/*`, layouts racines | Nouveaux parcours auth | Écrans auth/layout consomment uniquement thème central | 0 couleur inline sur auth/layout | QA parcours login/register/forgot/verify | Revenir styles auth précédents si blocant | Logs erreurs rendu styles | T3, T5 |
| E11-T07 | Migration Settings / Profiles / Catalog | ✅ Fait | Haute | UI features | E11-T05 | Migrer `settings`, `profiles`, `routine builder` vers tokens centraux + profils | Refonte métier catalogue | Couleurs pilotées par thème/profil, sans inline | 0 couleur inline sur ces écrans | QA CRUD profils + builder + settings | Revenir écrans un par un via feature flag local | Rapport de fichiers non conformes | T4, T5 |
| E11-T08 | Migration Home avec règle profil prioritaire | ✅ Fait | Haute | UI features | E11-T05, E11-T07 | Appliquer strictement: couleurs profil si disponibles, sinon thème | Rework UX Home | Home respecte la priorité profil -> fallback thème | 0 couleur inline sur `home/*` + comportement attendu multi-profils | QA multi-profils + états vides/erreurs | Revenir fallback thème-only temporaire | Traces de résolution couleur par profil | T4, T5 |
| E11-T09 | Garde-fou CI/Lint anti-couleurs inline | ✅ Fait | Haute | Qualité | E11-T06, E11-T07, E11-T08 | Ajouter règle CI bloquante sur `#[...]`/`rgba(...)` hors whitelist | Moteur design tokens auto-fix | Pipeline échoue si réintroduction inline | Commande de contrôle documentée et active en CI | Test pipeline rouge/vert | Désactiver règle en mode warning temporaire | KPI dette inline-colors dans CI | T5 |
| E11-T10 | QA visuelle + accessibilité + documentation | ✅ Fait | Moyenne | QA / Docs | E11-T09 | Campagne QA finale + doc conventions thème | Audit accessibilité WCAG complet app | Checklist de validation et guide contribution thème | Contrastes critiques validés + doc publiée | QA manuelle sur écrans clés + check contrastes | Revenir à la doc N-1 | Dashboard incidents UI liés au thème | T3, T5 |
| E11-T11 | Correctif socle : thème unique mobile-first (10 couleurs) | ✅ Fait | Critique | Architecture thème | E11-T10 | Remplacer le registre multi-thèmes par un seul thème par défaut avec 10 couleurs cibles | Thème runtime multiple | Palette thème exposée contient exactement: `primary`, `secondary`, `grey`, `white`, `black`, `primaryPastel`, `secondaryPastel`, `success`, `error`, `warning` | 0 clé couleur hors modèle 10 dans le socle thème | Revue architecture + validation type | Restaurer registre précédent via commit revert | Compteur de clés palette dans CI | T1, T5 |
| E11-T12 | Correctif génération pastel automatique (theme) | ✅ Fait | Haute | Outillage thème | E11-T11 | Générer `primaryPastel` et `secondaryPastel` à partir des bases (`primary`,`secondary`) via utilitaire central | Ajustements design non liés aux pastels | Pastels calculés automatiquement (pas de duplication statique) | Aucune valeur pastel codée en dur dans la source de vérité thème | Tests unitaires génération pastel | Revenir pastels statiques temporairement | Log debug calcul pastel en dev | T1, T5 |
| E11-T13 | Correctif tokens : alignement API `Colors` sur les 10 couleurs | ✅ Fait | Critique | UI shared | E11-T11, E11-T12 | Refondre `tokens.ts` pour exposer prioritairement les 10 clés cibles et déprécier les alias legacy (`gold`, `text*`, `moment*`) | Refonte visuelle des écrans | API `Colors` alignée modèle 10 couleurs, avec plan de transition explicite | Couche de compat isolée + scan des usages legacy actif pour piloter E11-T14 | Build TS + scan usages tokens | Restaurer alias legacy complets si blocant | Rapport usages clés legacy par fichier | T1, T5 |
| E11-T14 | Correctif migration app vers tokens canoniques | ✅ Fait | Critique | UI features | E11-T13 | Migrer tous les écrans/composants vers les 10 couleurs canoniques (`primary/secondary/grey/white/black/...`) | Nouvelles features UI | Plus aucune consommation directe des anciens tokens sémantiques non canoniques | 0 occurrence de tokens legacy dans `app/` et `src/features/` | QA manuelle auth/home/settings/profiles/catalog | Réactiver mapping compat temporaire | KPI tokens legacy restants | T3, T5 |
| E11-T15 | Correctif Tailwind + shell plateforme sur palette canonique | ✅ Fait | Haute | Intégration plateforme | E11-T11, E11-T13 | Aligner `tailwind.config.js`, `global.css`, `app.json`, `manifest.webmanifest`, `app/+html.tsx` sur la palette demandée (notamment `primary=#FF6B6B`) | Rebranding assets | Classes Tailwind et couleurs système cohérentes avec le modèle 10 couleurs | Aucune divergence de teinte entre app et shell PWA/Expo | Vérification web + mobile + install PWA | Restaurer config précédente via revert ciblé | Check automatique cohérence config | T2, T5 |
| E11-T16 | Correctif dette legacy palettes profils | ✅ Fait | Haute | UI features | E11-T11, E11-T14 | Nettoyer la dette des palettes hex legacy dans `profiles/types` et aligner la stratégie profil avec le modèle mobile-first | Refonte UX profil complète | Stratégie palette profil clarifiée (alignée ou explicitement isolée) avec implémentation cohérente | Plus de liste legacy non maîtrisée dans la couche thème/profil | QA CRUD profils + rendu home multi-profils | Revenir palette legacy si impact fonctionnel | Rapport de conformité palette profil | T4, T5 |
| E11-T17 | Correctif CI strict : garde-fou cardinalité palette (=10) | ✅ Fait | Haute | Qualité | E11-T11, E11-T12, E11-T13 | Ajouter un check CI bloquant qui valide exactement les 10 couleurs attendues et leurs valeurs contractuelles | Outil de theming avancé | Pipeline rouge si clé/valeur palette hors contrat | Commande CI documentée (`qa:theme`) avec check cardinalité | Test rouge/vert en CI | Passer en warning temporaire si incident | KPI dérive palette dans CI | T5 |
| E11-T18 | Rebaser le contrat thème coral v2 | ✅ Fait | Critique | Architecture thème | E11-T17 | Appliquer le nouveau contrat `primary=#FF6B6B`, `secondary=#FFD700` et conserver les 6 couleurs de base globales | Multi-thèmes runtime | Source unique thème + shell plateforme cohérents avec le contrat v2 | Contrat thème v2 validé sur runtime + shell | `lint:theme:contract` + `lint:theme:shell` | Revert ciblé sur registre thème/shell | Rapport CI contrat thème | T1, T2, T5 |
| E11-T19 | Restaurer palettes profils 16/16 | ✅ Fait | Critique | UI features | E11-T18 | Restaurer les listes PRIMARY/SECONDARY exactes (16 chacune) et defaults coral/or | Mapping thème pairé unique | Palettes profils disponibles et normalisation legacy nearest-color déterministe | Profils créés/édités conservent des couleurs autorisées | Tests unitaires profils + QA profils | Revenir palettes restreintes 5/5 | KPI normalisation couleurs legacy | T4, T5 |
| E11-T20 | Réactiver UX complète du picker couleurs profil | ✅ Fait | Haute | UI features | E11-T19 | Assurer la sélection complète des 16 couleurs dans la UI create/edit profil | Refonte ergonomique profonde du modal | ColorPicker/ProfileBuilder reflètent la restauration des palettes | Parcours création/édition profil complet sans régression | QA manuelle profils + home multi-profils | Revert des composants picker/modal | Traces erreurs save profil | T4 |
| E11-T21 | Verrouiller frontière thème défaut vs profil | ✅ Fait | Haute | Architecture thème | E11-T18, E11-T20 | Garantir que hors zones profil-aware, seul le thème par défaut est utilisé | Rework visuel complet écrans | Règle de priorité thème appliquée partout (default vs profil) | Aucune fuite couleur profil hors écrans concernés | QA auth/home/settings/catalog | Revenir règles de fallback antérieures | Audit usages couleurs profil | T1, T4, T5 |
| E11-T22 | Mettre à jour garde-fous CI thème v2 | ✅ Fait | Haute | Qualité | E11-T18, E11-T19 | Mettre à jour scripts/checks (contract/contrast/inline whitelist) selon v2 | Migration infra CI globale | CI bloque toute dérive par rapport au contrat v2 | `npm run qa:theme` vert sur `main` avec nouveaux seuils | Tests rouge/vert CI | Revenir checks pré-v2 temporairement | KPI dérive thème en CI | T3, T5 |
| E11-T23 | Mettre à jour tests EPIC11 (v2) | ✅ Fait | Haute | Qualité | E11-T19, E11-T22 | Aligner les suites `tests/e11-*` avec nouveau contrat + palettes profils | Nouveau framework de tests | Suites E11 couvrent contrat v2, palettes 16/16 et normalisation legacy | `test:e11-*` passent sans xfail | Exécution complète `test:e11-t04/t12/t13/t16/t17` | Revert tests + baseline antérieure | Rapport d'exécution tests E11 | T3, T5 |
| E11-T24 | QA non-régression UI thème v2 | 🔲 À faire | Moyenne | QA / Docs | E11-T20, E11-T21, E11-T23 | Recette manuelle écrans clés (auth/home/settings/profiles/catalog) | Audit WCAG complet | Validation visuelle et fonctionnelle thème/profils sans régression bloquante | Checklist QA validée et signée | QA manuelle multi-plateforme | Revenir commit v2 incriminé | Journal incidents UI thème | T3, T4 |
| E11-T25 | Documentation roadmap & conventions thème v2 | 🚧 En cours | Moyenne | QA / Docs | E11-T24 | Mettre à jour EPIC11, tickets GitLab, guide contribution thème et checklist QA | Réécriture complète des docs produit | Documentation cohérente avec implémentation v2 et état tickets | Docs versionnées et relues | Review doc croisée | Revenir docs N-1 | Historique décisions thème | T5 |

## Risques Couverts

- **T1**: Dérive visuelle due à plusieurs sources de vérité couleur.
- **T2**: Incohérence de marque entre app, PWA et shell système.
- **T3**: Régressions de lisibilité/contraste lors de la migration.
- **T4**: Perte de personnalisation profil dans les écrans dynamiques.
- **T5**: Réintroduction progressive de dette via couleurs inline.

## Critères de Done EPIC

- `coralSunrise` est le thème par défaut effectif sur toutes les plateformes ciblées.
- Toutes les couleurs applicatives passent par le système centralisé ou par les couleurs de profil.
- Aucune couleur inline dans le code applicatif (hors fichiers explicitement whitelistés).
- La règle CI anti-inline-colors est active et bloquante.
- La documentation de contribution thème est à jour.

Commande de contrôle active (CI/Lint):

```sh
npm run qa:theme
```

Implémentation:

- Script bloquant: `scripts/check-inline-colors.cjs`
- Script bloquant contrat palette: `scripts/check-theme-contract.cjs`
- Script bloquant contraste: `scripts/check-theme-contrast.cjs`
- Intégré à `npm run lint`
- Intégré à `npm run web:build:prod` (pipeline Cloudflare/GitLab)
- Whitelist explicite:
  - `src/shared/utils/colorUtils.ts`
  - `src/features/profiles/types/index.ts`
- Docs E11-T10:
  - `docs/roadmap/EPIC11/E11-T10-theme-qa-checklist.md`
  - `docs/roadmap/EPIC11/THEME-CONTRIBUTING.md`

## Dépendances Amont/Aval

- Amont: aucune dépendance bloquante.
- Aval: ce socle devient prérequis pour tous les tickets UI afin d'éviter la dette visuelle.
