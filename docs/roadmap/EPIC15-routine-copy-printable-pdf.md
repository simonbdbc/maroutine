# EPIC 15 — Copie de Routine & PDF Imprimable

**Statut : 🔲 À faire**
**Priorité : Haute**
**Dépendances amont :** EPIC14 anti-régression recommandé avant livraison complète
**Dépendances aval :** —

---

## Objectif

Faciliter l'administration des routines enfants en permettant:
- de copier la routine configurée d'un profil enfant vers un autre profil enfant;
- d'imprimer ou enregistrer en PDF la page Home du profil enfant depuis l'écran Profils.

## Principe Produit

- La copie est volontairement destructive côté cible: elle remplace toute la routine cible après confirmation.
- L'export PDF représente la Home du jour: couleurs du profil, stickers, progression, états cochés/non cochés et étoiles.
- La v1 PDF est web-first: elle utilise la fenêtre imprimable du navigateur et son option "enregistrer en PDF".
- Aucun changement de schéma Supabase n'est nécessaire.

## Sous-lots

- UX de copie entre profils.
- Service métier de clonage/remplacement de routine.
- UI de sélection du profil cible.
- Génération HTML imprimable depuis `HomeRoutineVM`.
- QA copie/PDF et documentation limites v1.

## Tickets

| ID | Titre | Statut | Priorité | Lot | Dépendances | Portée | Hors portée | Implémentation attendue | DoD | Tests/QA | Rollback | Observabilité | Risques couverts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E15-T01 | Spécification UX copie de routine | 🔲 À faire | Haute | UX copie | — | Définir source/cible, confirmation destructive, succès/erreurs, cas source=cible et profil unique | Fusion intelligente ou modèles de routine | Comportement UX validé et documenté | Spécification prête pour dev | Revue produit | Retirer l'action UI | N/A | Effets de bord cible |
| E15-T02 | Service copie routine en mode remplacement | 🔲 À faire | Haute | Métier copie | E15-T01 | Lire source, cloner pivots, sauvegarder sur cible, conserver ordre/étoiles/stickers | Transaction serveur ou migration schéma | Service `copyProfileRoutine(sourceProfileId, targetProfileId)` | La cible contient une copie complète sans réutiliser les IDs pivot source | Tests clonage profond | Désactiver l'action copie | Erreurs service remontées UI | Effets de bord données |
| E15-T03 | UI copie depuis écran Profils | 🔲 À faire | Haute | UI copie | E15-T02 | Ajouter action par profil, choix cible, confirmation remplacement | Drag/drop ou copie multiple | Parcours source -> cible disponible depuis Profils | Impossible de copier vers soi-même; profil unique géré | QA 2 profils, 3 profils, annulation | Masquer le bouton copie | Alertes succès/erreur | Effets de bord UX |
| E15-T04 | Tests non-régression copie | 🔲 À faire | Haute | Tests copie | E15-T02 | Couvrir clonage profond, IDs pivot neufs, conservation données, routine vide | E2E complet multi-device | Tests ciblés disponibles via script dédié | Tests passent localement | `npm run test:e15-t04` | Retirer test dédié si bloquant | Résultat test console | Régression routine |
| E15-T05 | Spécification PDF Home imprimable | 🔲 À faire | Moyenne | UX PDF | — | Définir contenu A4: Home enfant, couleurs, stickers, progression, états du jour, routine vide, labels longs | Export routine builder brute | Spécification PDF validée et documentée | Contenu imprimable sans ambiguïté | Revue produit | Retirer bouton PDF | N/A | Effets de bord impression |
| E15-T06 | Bouton PDF depuis écran Profils | 🔲 À faire | Moyenne | UI PDF | E15-T05 | Ajouter action web-first sur chaque profil générant HTML Home imprimable puis dialogue navigateur | Génération PDF native mobile | Bouton PDF disponible avec les autres actions profil | Impression/export PDF fonctionnel sur web | QA navigateur desktop/mobile | Masquer le bouton PDF | Alertes blocage pop-up | Régression profils/home |
| E15-T07 | Tests/QA PDF Home | 🔲 À faire | Moyenne | QA PDF | E15-T06 | Vérifier rendu web, stickers, couleurs, états cochés, caractères accentués, labels longs, routine vide, noir/blanc lisible | Automatisation visuelle complète | Checklist QA imprimable/PDF | Cas critiques validés | QA manuelle + test HTML ciblé | Revenir HTML simple | Résultat QA documenté | Régression impression |
| E15-T08 | Documentation et limites v1 | 🔲 À faire | Moyenne | Docs | E15-T03, E15-T06 | Documenter copie remplacement et PDF web-first | Documentation utilisateur complète app-store | Limites v1 et rollback documentés | EPIC et index tickets cohérents | Revue docs | Revenir docs N-1 | N/A | Effets de bord support |

## Critères de Done EPIC

- La routine d'un enfant peut être copiée vers un autre enfant en mode remplacement confirmé.
- Les pivots source ne sont jamais réutilisés côté cible.
- La Home du profil peut être imprimée ou enregistrée en PDF depuis le web.
- Les cas routine vide, labels longs, caractères accentués et activité sans tâche sont couverts.
- Les limites v1 web-first sont documentées.

## Dépendances Amont/Aval

- Amont recommandé: EPIC14 pour verrouiller les garde-fous anti-régression avant livraison produit.
- Aval: peut alimenter une future gestion de modèles de routines, hors v1.
