# EPIC 18 — Preferences Layout Locales

**Statut : 🔲 À faire**
**Priorité : Haute**
**Dépendances amont :** EPIC 13
**Dépendances aval :** EPIC 9 (hardening QA)

---

## Objectif

Permettre a chaque support local d'adapter l'affichage sans synchronisation
serveur:

- choisir si le side menu reste ancre sur grand ecran ou devient masquable;
- afficher automatiquement plusieurs routines cote a cote quand la largeur
  disponible le permet;
- forcer le menu masquable et une seule routine sur smartphone.

## Principe d'Architecture

- Reutiliser les deux etats existants du side menu: ancre desktop et overlay.
- Remplacer le basculement automatique desktop par une preference locale.
- Stocker les preferences dans AsyncStorage avec une cle par utilisateur
  authentifie.
- Garder les contraintes smartphone comme regle effective prioritaire.
- Ne pas ajouter de table Supabase, migration SQL ou synchronisation distante.

## Tickets

| ID      | Titre                              | Statut     | Priorité | Lot             | Dépendances             | Portée                                                        | Hors portée                  | Implémentation attendue                         | DoD                                  | Tests/QA               | Rollback                       | Observabilité                        | Risques couverts |
| ------- | ---------------------------------- | ---------- | -------- | --------------- | ----------------------- | ------------------------------------------------------------- | ---------------------------- | ----------------------------------------------- | ------------------------------------ | ---------------------- | ------------------------------ | ------------------------------------ | ---------------- |
| E18-T01 | Documentation EPIC18 + tickets     | 🔲 À faire | Haute    | Docs            | EPIC13                  | Creer EPIC18, tickets GitLab, ordre roadmap                   | Refonte roadmap globale      | Documentation exploitable pour dev/QA           | EPIC et index a jour                 | Relecture docs         | Retirer EPIC18 docs            | N/A                                  | 1                |
| E18-T02 | Service preferences locales layout | 🔲 À faire | Haute    | Architecture UI | E18-T01                 | AsyncStorage, defaults, hook/context, helpers purs            | Stockage BDD / sync distante | Preferences locales par `user.id`               | Defaults stables, validation payload | Tests helpers          | Revenir defaults statiques     | Erreur locale affichee non bloquante | 1, 2             |
| E18-T03 | Side menu pilote par bouton        | 🔲 À faire | Haute    | Navigation      | E18-T02                 | Bouton ancrer/desancrer dans side menu, contrainte smartphone | Refaire le side menu         | Etat fixe/overlay choisi localement             | Menu fixe interdit smartphone        | QA desktop/smartphone  | Revenir bascule auto existante | N/A                                  | 1, 3             |
| E18-T04 | Parametre routines cote a cote     | 🔲 À faire | Haute    | Compte          | E18-T02                 | Controle local dans Compte                                    | Reglage numerique avance     | Preference `single/auto` sauvegardee localement | Reload conserve le choix             | QA Compte              | Masquer section affichage      | Message erreur locale                | 2, 4             |
| E18-T05 | Home multi-routines auto           | 🔲 À faire | Haute    | Home            | E18-T04                 | Colonnes automatiques grand ecran, une routine smartphone     | Refonte contenu routine      | Plusieurs routines visibles selon largeur       | Mode mono-routine intact             | QA profils 1 a 5       | Revenir pager mono-routine     | N/A                                  | 2, 4             |
| E18-T06 | Tests non-regression layout        | 🔲 À faire | Haute    | Qualite         | E18-T02,E18-T03,E18-T05 | Tests helpers preferences/responsive/colonnes                 | E2E complet                  | Script cible disponible                         | `npm run test:e18-t06` passe         | `npm run test:e13-t07` | Retirer script dedie           | Rapport test console                 | 1, 2, 3          |
| E18-T07 | QA finale layout local             | 🔲 À faire | Moyenne  | QA              | E18-T03,E18-T05,E18-T06 | Checklist desktop/tablette/smartphone + reload                | Audit UX complet             | Recette documentee                              | Cas critiques valides                | QA manuelle web/mobile | Revenir preferences locales    | Journal anomalies                    | 1, 2, 3, 4       |

## Risques Couverts

- **1**: Regression navigation desktop en modifiant le side menu existant.
- **2**: Ambiguite entre preference locale et contrainte smartphone effective.
- **3**: Menu fixe accessible sur smartphone.
- **4**: Home illisible si trop de routines sont affichees simultanement.

## Critères de Done EPIC

- Le side menu peut etre ancre ou desancre depuis le menu sur grand ecran.
- Le choix est conserve localement par utilisateur authentifie.
- Le side menu fixe est impossible sur smartphone.
- Home peut afficher plusieurs routines cote a cote en mode auto.
- Home reste limite a une routine sur smartphone.
- Les tests cibles et la recette manuelle sont disponibles.
