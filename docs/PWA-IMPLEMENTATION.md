# État et mise en œuvre PWA

## 1. Portée

Ce document décrit l'implémentation PWA effective de ce dépôt. Les règles réutilisables et neutres restent définies dans [`PWA-CONTRACT.md`](./PWA-CONTRACT.md), qui ne contient aucune dépendance au produit.

État au 22 juillet 2026 : **Implémenté, validation de release restante**.

Le statut `Validé` au sens du contrat exige encore une installation réelle sur les plateformes cibles, un passage N vers N+1 et un exercice de rollback sur une preview Cloudflare Pages.

| Domaine | État | Preuve |
|---|---|---|
| Manifest, icônes et screenshots | Implémenté | `public/manifest.webmanifest`, `public/icons/`, `public/screenshots/` |
| Installation et mode standalone | Implémenté | bridge précoce, détection runtime, écran `/install` |
| Désinstallation et réparation | Implémenté | écran `/uninstall`, nettoyage des caches et reset du worker |
| Entrée d'installation et accès PWA stable | Implémenté | entrée latérale contextuelle avant installation, accès permanent depuis Compte |
| Service worker et offline shell | Implémenté et testé | service worker généré, E2E Chromium offline |
| Version et mise à jour consentie | Implémenté | `pwa-build.json`, worker waiting, action utilisateur `SKIP_WAITING` |
| Diagnostics et observabilité | Implémenté | dashboard `/pwa`, diagnostics, événements PWA optionnels |
| Rollback production | Documenté, exercice restant | procédure de la section 8 |
| QA multi-navigateurs et appareils réels | À valider | matrice de la section 12 |

## 2. Comparaison avec ACREA Fitness

ACREA Fitness a servi de référence d'état pour le shell PWA, le cycle d'installation, les écrans de gestion et la chaîne de validation. La parité fonctionnelle visée est atteinte dans le code.

| Capacité de référence | ACREA Fitness | État de ce dépôt | Écart résiduel |
|---|---|---|---|
| Manifest complet et captures | Présent | Présent | Aucun écart fonctionnel |
| Capture précoce de `beforeinstallprompt` | Présente | Présente avant le montage React | Aucun |
| Provider PWA central | Présent | `PwaProvider` compose installation, réseau, worker et diagnostics | Aucun |
| Dashboard, installation, désinstallation, offline | Présents | Routes `/app/pwa`, `/app/install`, `/app/uninstall`, `/app/offline` | Aucun |
| Menu PWA contextuel | Présent | Entrée latérale avant installation, tableau de bord permanent dans Compte | Aucun |
| Worker généré et cache versionné | Présent | Présent ; shell indexé par version **et** build | Cache du shell plus strict ici |
| Update avec consentement | Présente | Présente ; aucun reload automatique sans action utilisateur | Aucun |
| Panic reset | Présent | Désinscription du worker et purge des caches PWA | Aucun |
| Validateur d'artefact et CI | Présents | Validateur, tests contractuels et job Playwright | Aucun |
| Test offline avec worker actif | Couverture partielle | E2E avec worker autorisé puis réseau coupé | Couverture renforcée ici |

La différence d'architecture volontaire concerne les stickers : ils ne font pas partie du précache du shell. Ils sont mis en cache à la demande et leur stockage durable doit rester sous la responsabilité des EPICs de données/packs offline.

## 3. Architecture runtime

Le point d'entrée est `PwaProvider`, monté dans `app/_layout.tsx`. Il ne lit pas directement les API navigateur : chaque cycle de vie est isolé dans un hook ou un service testable.

| Élément | Responsabilité |
|---|---|
| `src/shared/pwa/PwaProvider.tsx` | État PWA consolidé et contrat consommé par l'UI |
| `hooks/useInstallationLifecycle.ts` | Prompt, mode d'affichage, installation, refus et réaffichage |
| `hooks/useServiceWorkerLifecycle.ts` | Enregistrement, détection du worker waiting, update et reload consenti |
| `hooks/useConnectionStatus.ts` | État online/offline |
| `hooks/usePwaDiagnostics.ts` | Manifest, worker, caches, quota et réparation |
| `services/installPromptBridge.ts` | Lecture du prompt capturé avant React |
| `services/serviceWorkerClient.ts` | Messages version/diagnostics/skip waiting et purge contrôlée |
| `services/pwaAnalytics.ts` | Événements techniques anonymisés vers un endpoint optionnel |
| `scripts/post-export-web.cjs` | Métadonnées de build et génération déterministe du service worker |

Le service worker est désactivé dans un bundle `__DEV__`. Un export production l'active, y compris lorsqu'il est servi localement sur `localhost` ou `127.0.0.1`.

## 4. Version et build

La version applicative suit SemVer et doit être identique dans :

- `package.json#version` ;
- `package.json#appVersion` ;
- `src/shared/pwa/appConfig.ts#APP_VERSION`.

Le test contractuel bloque une divergence entre `appVersion` et `APP_VERSION`.

Chaque export produit `apps/pwa/dist/pwa-build.json`, publié sous `/app/pwa-build.json`, avec :

- `appName` et `appVersion` ;
- `buildId` unique au déploiement ;
- `commitSha` ;
- `releaseChannel` (`development`, `preview` ou `production`) ;
- `buildDate`, `origin` et `supportContact`.

`version.json` reste généré pour compatibilité, mais `pwa-build.json` est la source de vérité de détection. Une mise à jour est disponible lorsque le `buildId` distant diffère de celui du worker actif, même si la version SemVer n'a pas changé.

En production GitLab, le build Cloudflare reçoit `production-[CI_PIPELINE_ID]-[CI_COMMIT_SHORT_SHA]`. Chaque pipeline livré possède donc un identifiant distinct, y compris pour deux mises en production conservant la même version SemVer.

## 5. Service worker et caches

Le build génère trois familles de caches :

```text
maroutine-shell-v[APP_VERSION]-[BUILD_ID]
maroutine-assets-v[APP_VERSION]-[BUILD_ID]
maroutine-runtime-v[BUILD_ID]
```

Le précache du shell contient uniquement le HTML, la page offline, le manifest, les métadonnées de build et le bridge d'installation. Le cache d'assets contient les bundles JS/CSS, les polices et les icônes nécessaires. Les stickers sont chargés et mis en cache à la demande.

| Ressource | Stratégie |
|---|---|
| Navigation HTML | Network first, fallback `index.html`, puis `offline.html` |
| `pwa-build.json` | Network first, fallback de la version connue |
| Bundles, polices, icônes et assets same-origin | Cache first |
| `/api/`, `/auth/`, OAuth, OIDC et callbacks | Hors cache |
| Requêtes non `GET` et origines externes | Hors interception |

À l'activation, les anciens shells et caches runtime sont supprimés. Le cache d'assets courant et un cache précédent sont conservés afin de limiter les ruptures pendant une transition de build.

## 6. Écrans, composants et menu

Routes protégées :

- `/pwa` : état global, version, update, stockage et diagnostics ;
- `/install` : état détecté, bouton natif lorsque disponible et instructions par plateforme ;
- `/uninstall` : retrait de l'icône, nettoyage local et réinstallation propre.

Route publique :

- `/app/offline` : écran applicatif de perte de connexion ;
- `/app/offline.html` : dernier fallback statique indépendant du bundle React.

Composants partagés : `InstallAppBanner`, `InstallAppButton`, `UpdateAvailablePrompt`, `ConnectionStatus`, `AppVersionInfo`, `StorageUsagePanel`, `PwaDiagnosticsPanel` et `PwaGlobalPrompts`.

L'entrée latérale suit exactement la visibilité du bandeau d'installation :

| État prioritaire | Libellé | Destination |
|---|---|---|
| Update disponible | `Mise a jour disponible` | `/pwa` |
| Prompt natif disponible | `Installer l'app` | `/install` |
| Installation manuelle | `Comment installer l'app` | `/install` |
| Refus récent | `Reafficher l'installation` | `/install` |
| Erreur | `Diagnostiquer l'installation` | `/install` |

Après installation confirmée, refus via `Plus tard` ou état d'installation non pertinent, le bandeau et l'entrée latérale sont masqués ensemble. L'aide iOS est également masquée après installation. L'entrée reste masquée si une mise à jour est disponible. Le bandeau de mise à jour conserve ce parcours et la page Compte expose en permanence le bouton `Tableau de bord PWA`, qui ouvre `/pwa`. Les écrans `/install` et `/uninstall` restent accessibles depuis le tableau de bord et leurs URL directes.

## 7. Installation et désinstallation

Le script `install-prompt-bridge.js` est chargé dans `<head>` avant le bundle React. Il capture `beforeinstallprompt`, appelle `preventDefault()` et remet l'événement au runtime. Le bouton natif n'est affiché que lorsque cet événement est réellement disponible.

Sur Safari iOS/iPadOS et les navigateurs sans prompt programmable, l'écran affiche les instructions système. Le refus est mémorisé pendant 14 jours et peut être annulé depuis l'écran d'installation.

L'installation confirmée est mémorisée sans expiration dans `localStorage` sous la clé `maroutine.pwa-installed:v1`. Le marqueur est créé après acceptation du prompt, à la réception de `appinstalled` et au lancement en mode `standalone`, `fullscreen` ou `minimal-ui`. Il est prioritaire sur les états manuel, refusé ou disponible afin que tous les composants consomment le même état consolidé.

Un nouveau `beforeinstallprompt` efface le marqueur, car le navigateur indique alors que l'origine est de nouveau installable. L'action `Reparer la PWA` l'efface également avec le refus mémorisé, les workers et les caches ; un rechargement encore effectué en mode installé le recrée immédiatement. Ce marqueur reste local au navigateur, au profil et à l'origine. Aucune API web portable ne signale une désinstallation externe au moment où elle a lieu.

Une application web ne peut pas se désinstaller elle-même de manière portable. L'écran `/uninstall` explique donc le retrait via le navigateur ou le système. Les actions `Vider les caches` et `Reparer la PWA` ne suppriment ni la session, ni les profils, ni les données métier synchronisées.

## 8. Mise à jour et rollback

Flux N vers N+1 :

1. le client contrôle immédiatement le worker et `pwa-build.json` ;
2. le contrôle est relancé au focus, au retour visible, après `pageshow` et après reconnexion, sans interrogation périodique ;
3. le navigateur télécharge le nouveau worker avec `updateViaCache: none` ;
4. le worker reste `waiting` si une version contrôle déjà la page ;
5. l'UI annonce la mise à jour et affiche la version et le `buildId` distants ;
6. l'utilisateur confirme ;
7. l'application envoie `SKIP_WAITING` et attend l'accusé de réception ;
8. le reload n'est déclenché qu'après `controllerchange` et consentement explicite.

Rollback Cloudflare Pages :

1. identifier le dernier déploiement stable et son commit ;
2. restaurer ou redéployer cet artefact sans modifier les données métier ;
3. vérifier `/app/pwa-build.json`, `/app/service-worker.js` et le `buildId` servi ;
4. ouvrir l'application N, attendre la détection du worker restauré et appliquer la mise à jour proposée ;
5. en cas de client bloqué, utiliser `Reparer la PWA`, puis recharger ;
6. rejouer `validate:pwa`, les E2E, le smoke test offline et documenter l'incident.

Le rollback doit être exercé sur une preview avec deux builds distincts avant de marquer la PWA `Validée`.

## 9. Périmètre offline

Le shell, les contrôles PWA et les assets déjà consultés sont disponibles offline après un premier chargement réussi. Le test automatisé vérifie une page contrôlée par le worker, coupe le réseau et recharge le shell.

Cette garantie ne signifie pas encore que tous les parcours métier sont local-first. La persistance métier, les écritures offline, la synchronisation et les packs permanents restent couvertes par les EPICs 3 à 8. Le service worker ne doit jamais transformer une réponse API en source de vérité silencieuse.

## 10. Configuration et en-têtes

Variables optionnelles PWA :

| Variable | Usage |
|---|---|
| `EXPO_PUBLIC_SUPPORT_CONTACT` | Contact écrit dans les métadonnées de build |
| `EXPO_PUBLIC_PWA_ANALYTICS_ENDPOINT` | Collecte technique optionnelle, de préférence same-origin |
| `EXPO_PUBLIC_RELEASE_CHANNEL` | Canal de release explicite |
| `BUILD_ID` | Identifiant de build imposé hors CI |

`public/_headers` impose notamment `no-store` sur `pwa-build.json` et le worker, un cache immutable sur les assets versionnés et une CSP en mode report-only. Le passage de la CSP en mode bloquant exige une phase d'observation sans violation légitime.

## 11. Validation automatisée

```bash
npm run tsc
npm run pwa:contract:test
npm run web:build:prod
npm run validate:pwa
npm run e2e:pwa
```

Couverture actuelle :

- 17 tests contractuels du cycle de vie et de la structure ;
- validation de tous les fichiers et en-têtes de `dist` ;
- E2E du contrôle HTTP/manifest ;
- E2E des trois écrans protégés, des états d'installation, du refus et de deux builds de production successifs sur desktop et mobile avec Supabase simulé ;
- E2E du worker actif et du reload hors ligne.

GitLab CI exécute `pwa:contract:test` dans `web:validate`, `validate:pwa` après le build et les E2E Chromium dans le job `pwa:e2e`.

## 12. QA de release restante

- Chrome/Edge desktop : installation, standalone, update N vers N+1 et désinstallation ;
- Chrome Android : prompt, lancement depuis l'icône, offline et retrait ;
- Safari iOS/iPadOS : instructions `Sur l'écran d'accueil`, lancement et suppression ;
- Safari desktop et Firefox : mode web dégradé sans blocage ;
- preview Cloudflare : route profonde, headers réels, update et rollback ;
- production : smoke tests des endpoints, erreurs console et absence de 404 d'assets.

Le statut contractuel passe de `Implémenté` à `Validé` uniquement après archivage des preuves de cette matrice.
