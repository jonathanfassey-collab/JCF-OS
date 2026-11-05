-- ═══════════════════════════════════════════════════════════════════════════
-- JCF OS — Migration Supabase Auth, étape 5 : nettoyage (J+7 après la bascule)
-- ═══════════════════════════════════════════════════════════════════════════
-- Supprime l'ancienne table users_extra et sa colonne « password » en clair.
-- Vérifier d'abord qu'elle est vide : select count(*) from public.users_extra;
-- ═══════════════════════════════════════════════════════════════════════════

drop table if exists public.users_extra;
