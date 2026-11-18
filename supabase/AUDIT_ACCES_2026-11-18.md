# Audit des accès Supabase : 18/11/2026 (lecture seule)

Projet `hwjuqtrdjcowgcvmhfed`. Rien n'a été modifié.

## Les 8 fonctions SECURITY DEFINER : saines

| Contrôle | Résultat |
|---|---|
| `search_path` figé (`''`) | ✅ les 8 |
| Exécutable par `anon` (non connecté) | ✅ non, aucune |
| Exécutable par `authenticated` | oui, c'est voulu : elles servent aux règles RLS et au planning partagé |
| Contrôle « compte actif » | ✅ toutes passent par `jcf_role()` / `profiles.active` |
| Colonnes de coût exposées | ✅ aucune (ni `period_cost`, ni frais) |

**Conclusion :** l'alerte du linter (lint 0029) est attendue. **Il ne faut pas** passer ces fonctions en SECURITY INVOKER : les règles RLS cesseraient de fonctionner, puisque `profiles` n'est lisible que par son propriétaire. On les laisse telles quelles.

## Points à corriger ou à trancher

1. **Motif d'absence visible des magasins : conservé volontairement** (décision de Jonathan, 18/11/2026). Les directrices voient « maladie » sans le motif médical. Elles doivent distinguer arrêt maladie et absence, car le planning et la déclaration à la comptable diffèrent, et elles l'apprennent parfois avant JCF. Aucune correction.
2. **Prix des réservations magasin fixé par le navigateur : à corriger.** Règle validée : le prix vient obligatoirement de la grille ; un prix différent est négocié à l'oral, confirmé par mail et saisi par l'admin. Script prêt : `sql/brouillons/06_reservations_magasin_serveur.sql` (fonction `jcf_store_book`, qui dépend des tarifs en base du script 05).
3. **Annulation magasin : règle à faire appliquer par le serveur.** Règle validée : le magasin peut annuler toute journée de son magasin, y compris celles posées par l'admin. Sans frais jusqu'à 48 h avant la journée, pénalité de 30 % ensuite, y compris pour une journée passée. L'écran applique déjà les 48 h (PR #28). Côté serveur : `jcf_store_cancel` dans le script 06.
4. **Les magasins lisent les coûts de leurs propres réservations via l'API** (`asg_store_select` renvoie toute la ligne), alors que l'écran les masque. C'est acceptable si c'est le prix qu'ils ont accepté. À confirmer.
5. **`users_extra`** : la table est vide, mais la colonne `password` existe encore. L'étape 5 (`03_nettoyage.sql`) peut être appliquée.
6. **Protection contre les mots de passe compromis** : désactivée. Selon la documentation Supabase, elle est réservée au plan Pro et plus. À activer dans Authentication → Policies si le plan le permet. Elle ne s'applique qu'aux nouveaux mots de passe, sans impact sur les comptes existants.

## Recette proposée (comptes de test, pas de vrais comptes)

admin, magasin A, magasin B, collaborateur A, collaborateur B, anonyme. Pour chacun, tester en appel direct à l'API REST (pas seulement via les menus) :
- lecture de `assignments`, `mads`, `cp_requests`, `collaborator_hr`, `monthly_charges` et `profiles` ;
- insertion d'une réservation pour un autre magasin (doit échouer) ;
- insertion directe à 0 € (aujourd'hui elle passe ; elle doit échouer après le script 06, étape 2) ;
- annulation à moins de 48 h via `jcf_store_cancel` (une pénalité doit être créée) ;
- appel des 8 fonctions RPC en anonyme (doit échouer).

Remédiation du linter : https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
