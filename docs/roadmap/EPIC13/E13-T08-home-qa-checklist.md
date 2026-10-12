# E13-T08 — QA manuelle finale Home smartphone

Date de campagne: **2026-04-15**  
Périmètre: EPIC13 (adaptation Home smartphone compact)

## 1) Pré-requis build

Environnement attendu:

- Node `>=20.19.0`
- dépendances installées (`npm clean-install`)
- build web exportable (`npm run web:build:prod`)

## 2) Garde-fous automatiques avant recette manuelle

Commandes minimales à lancer avant toute validation device:

```sh
npm run test:e13-t07
node ./scripts/check-inline-colors.cjs
```

Résultat attendu:

- `test:e13-t07` = `9/9 tests OK`
- `check:inline-colors` = `OK`

## 3) Matrice devices cible

- Smartphone iOS Safari (PWA installée)
- Smartphone iOS Brave
- Smartphone Android Chrome (PWA installée)
- Smartphone Android Brave
- iPad Safari (non-régression non-smartphone)
- Desktop Chrome/Brave (non-régression non-smartphone)

## 4) Checklist recette Home

### A. Activation smartphone-only

- [ ] Sur smartphone (largeur <= 500): layout compact actif
- [ ] Sur iPad/desktop: layout compact inactif
- [ ] Aucun saut de layout en rotation portrait/paysage

### B. Header Home compact

- [ ] Header visiblement plus dense sur smartphone
- [ ] Avatar profil réduit (ring + image) sans clipping
- [ ] Badges (tirelire/aujourd'hui) lisibles
- [ ] Bouton réglages toujours facilement touchable

### C. Cards moments/activités + stickers

- [ ] Header de section moment compact mais lisible
- [ ] Header activité compact (titre, statut, sous-texte)
- [ ] Stickers activity/task réduits, sans flou ni overflow
- [ ] États pending/done/check restent compréhensibles

### D. CTA bas de page

- [ ] Bouton "Valider la journée" compact sur smartphone
- [ ] Zone tactile perçue >= 44 px
- [ ] État "Journée validée" lisible et correctement aligné
- [ ] Confirmation validation conserve le comportement attendu

### E. Multi-profils / navigation

- [ ] Tabs profils inchangées fonctionnellement
- [ ] Swipe horizontal profils inchangé
- [ ] Scroll vertical des activités fluide
- [ ] Pas de conflit scroll horizontal/vertical

### F. Non-régression tablette/desktop

- [ ] Header garde ses dimensions historiques
- [ ] Cards/stickers gardent leurs dimensions historiques
- [ ] CTA bas garde ses dimensions historiques
- [ ] Aucun effet de bord sur écrans hors Home

## 5) Tableau de preuves visuelles

| Device | URL/Build | Scénario | Capture | Résultat |
|---|---|---|---|---|
| iOS Safari | | Home mono-profil compact | | ☐ OK / ☐ KO |
| iOS Safari | | Home multi-profils compact | | ☐ OK / ☐ KO |
| iOS Brave | | Home compact + CTA | | ☐ OK / ☐ KO |
| Android Chrome | | Home compact + stickers | | ☐ OK / ☐ KO |
| Android Brave | | Home compact + scroll | | ☐ OK / ☐ KO |
| iPad Safari | | Non-régression non-compact | | ☐ OK / ☐ KO |
| Desktop Chrome/Brave | | Non-régression non-compact | | ☐ OK / ☐ KO |

## 6) Journal anomalies

| ID | Device | Gravité | Description | Repro | Ticket |
|---|---|---|---|---|---|
| A-001 | | | | | |

## 7) Go / No-Go produit

- **GO** si toutes les lignes section 4 passent + aucune anomalie bloquante P1/P2.
- **NO-GO** si régression non-smartphone détectée ou lisibilité/tap-target dégradée sur smartphone.

Décision campagne:

- [ ] GO
- [ ] NO-GO
- Commentaires:

