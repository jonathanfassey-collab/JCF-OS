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

1. **Le motif d'absence est visible des magasins (à corriger).** `jcf_store_staff_planning()` renvoie le type exact (`maladie`, `cp`, `css`, `formation`...) des journées de l'équipe du magasin. Le README promettait « ni motif d'absence ». Correction prête : `sql/brouillons/06_masquage_motifs_absence_magasin.sql`.
2. **Le prix d'une réservation magasin est fixé par le navigateur (à trancher).** La règle `asg_store_insert` accepte n'importe quel `period_cost`, collaborateur ou frais. Un compte magasin qui appelle l'API directement pourrait réserver à 0 €. Piste : calculer ou contrôler le prix côté serveur (fonction `jcf_book` ou déclencheur).
3. **Annulation magasin sans contrôle serveur (à trancher).** `asg_store_delete` permet de supprimer toute journée `work` du magasin, y compris une journée posée par l'admin ou une date passée. Les règles d'annulation tardive ne sont appliquées que dans l'écran.
4. **Les magasins lisent les coûts de leurs propres réservations via l'API** (`asg_store_select` renvoie toute la ligne), alors que l'écran les masque. C'est acceptable si c'est le prix qu'ils ont accepté. À confirmer.
5. **`users_extra`** : la table est vide, mais la colonne `password` existe encore. L'étape 5 (`03_nettoyage.sql`) peut être appliquée.
6. **Protection contre les mots de passe compromis** : désactivée. Selon la documentation Supabase, elle est réservée au plan Pro et plus. À activer dans Authentication → Policies si le plan le permet. Elle ne s'applique qu'aux nouveaux mots de passe, sans impact sur les comptes existants.

## Recette proposée (comptes de test, pas de vrais comptes)

admin, magasin A, magasin B, collaborateur A, collaborateur B, anonyme. Pour chacun, tester en appel direct à l'API REST (pas seulement via les menus) :
- lecture de `assignments`, `mads`, `cp_requests`, `collaborator_hr`, `monthly_charges` et `profiles` ;
- insertion d'une réservation pour un autre magasin (doit échouer) ;
- insertion à 0 € (aujourd'hui elle passe : point 2) ;
- suppression d'une journée admin dans son magasin (aujourd'hui elle passe : point 3) ;
- appel des 8 fonctions RPC en anonyme (doit échouer).

Remédiation du linter : https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
