# Sécurité et validation de Ma Routine

Les données de profils enfants appartiennent à leur compte. Aucun profil familial,
export de base, capture privée ou credential serveur ne doit entrer dans un exemple
public. Les fixtures de test SQL sont inventées et identifiées comme telles.

## Décodeur d'images de la landing

Sharp est fixé à 0.35.5, y compris les résolutions transitives, pour utiliser
les bibliothèques natives corrigées. Le service local reprend la transformation
d'Astro 5.18.2 et conserve ses validations et méthodes d'URL. Il remplace
`failOnError: false`, supprimé par Sharp 0.35, par `failOn: "none"` pour préserver
la tolérance précédente aux JPEG décodables mais tronqués. Les entrées non
décodables et les dépassements de limite de pixels restent refusés.

Les notices Astro sont conservées dans
`apps/landing/THIRD-PARTY-NOTICES/Astro-LICENSE`. Lors d'une mise à jour d'Astro,
revoir cet adaptateur et relancer `npm run test:images --workspace @maroutine/landing`.
Ce correctif ciblé ne clôture pas les autres avis de dépendances du workspace.

## RPC validate_day

Les définitions du schéma neuf et de la migration E16 vérifient
`profiles.user_id = auth.uid()` et verrouillent ce profil avant de lire une
validation existante. Ce contrôle s'applique aux premiers appels, retries, dates
nulles et appels concurrents. Le refus conserve `Profil introuvable` (`P0001`)
sans indiquer si un profil étranger existe. Le résultat idempotent conserve les
étoiles et le solde enregistrés lors de la validation initiale.

Le rôle `SECURITY DEFINER` permet les opérations atomiques ; les politiques RLS
des tables ne remplacent pas la vérification interne. Le grant `authenticated`
historique n'enlève pas automatiquement le droit EXECUTE de PUBLIC ; même un
appel avec identité absente doit être refusé par la fonction.

## Recette isolée

`python3 scripts/test-validate-day.py` crée un cluster PostgreSQL 17 temporaire,
accessible uniquement par son socket Unix dans un répertoire privé. Il retire
les variables PG héritées, ne prend aucune URL de connexion et ne contacte pas
la production. Les deux variantes chargent le schéma complet ; l'une applique
ensuite la migration E16 complète. La fonction `auth.uid()` simulée utilise
l'identité fictive placée dans la session SQL, comme frontière de test du RPC.

Le test compare propriétaires, autre compte et identité absente, résultats
historiques, calcul des feuilles, nettoyage limité à une date, historique de
solde, retries et concurrence. Il ne qualifie pas PostgREST, Auth, le navigateur
ou les règles réellement déployées. Les tests PWA E16 sont complémentaires.

## Base existante : procédure à faire approuver

1. Relever la définition et les droits actuels de `public.validate_day(UUID, DATE)`
   avec le propriétaire de l'instance, sans exporter des données utilisateurs.
2. Sauvegarder la définition, les ACL et la base selon le runbook privé ; vérifier
   la restauration dans une instance isolée. Ne pas exécuter le reset du schéma.
3. Préparer uniquement le bloc `CREATE OR REPLACE FUNCTION` corrigé de la
   migration E16 ; préserver la signature et les ACL existantes. Ne pas rejouer
   un backfill de données dans le but de changer cette fonction.
4. Après autorisation de migration, appliquer ce bloc en transaction et vérifier
   avec deux comptes de recette les refus et les appels propres/idempotents.
5. En cas d'erreur de migration, annuler la transaction. Si un problème apparaît
   après commit, arrêter les validations cloud et investiguer ; réintroduire la
   définition vulnérable n'est pas un retour sûr. Préserver les preuves expurgées.

Aucune migration de production n'est exécutée par cette préparation. La version
déployée reste inconnue tant qu'elle n'a pas été relevée et validée séparément.

Référence : [fonctions et privilèges Supabase](https://supabase.com/docs/guides/database/functions).
