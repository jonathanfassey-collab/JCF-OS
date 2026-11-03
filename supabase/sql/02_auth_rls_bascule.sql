-- ═══════════════════════════════════════════════════════════════════════════
-- JCF OS — Migration Supabase Auth, étape 4 : BASCULE des règles RLS
-- ═══════════════════════════════════════════════════════════════════════════
-- À appliquer JUSTE APRÈS le déploiement du nouveau code (fusion de la PR).
-- Avant ce script : la base reste ouverte à tous.
-- Après ce script : l'ancien code (connexion par mots de passe communs) ne
-- peut plus rien lire ni écrire.
-- Retour arrière : voir 02b_auth_rls_retour_arriere.sql
-- ═══════════════════════════════════════════════════════════════════════════

begin;

drop policy if exists "Public access" on public.assignments;
drop policy if exists "Public access" on public.mads;
drop policy if exists "Public access" on public.cp_requests;
drop policy if exists "Public access" on public.users_extra;

-- ── assignments ────────────────────────────────────────────────────────────
create policy asg_admin_all on public.assignments
  for all to authenticated
  using (public.jcf_is_admin()) with check (public.jcf_is_admin());

-- Magasin : lit ses réservations, en crée (travail ou annulation tardive),
-- annule les siennes. Aucune modification, aucun accès aux autres lieux.
create policy asg_store_select on public.assignments
  for select to authenticated
  using (location_id = public.jcf_location_id());

create policy asg_store_insert on public.assignments
  for insert to authenticated
  with check (location_id = public.jcf_location_id()
              and type_id in ('work', 'annulation'));

create policy asg_store_delete on public.assignments
  for delete to authenticated
  using (location_id = public.jcf_location_id() and type_id = 'work');

-- Collaborateur : lit uniquement son propre planning.
create policy asg_repl_select on public.assignments
  for select to authenticated
  using (collaborator_id = public.jcf_collaborator_id());

-- ── cp_requests (congés payés et sans solde) ───────────────────────────────
create policy cp_admin_all on public.cp_requests
  for all to authenticated
  using (public.jcf_is_admin()) with check (public.jcf_is_admin());

create policy cp_repl_select on public.cp_requests
  for select to authenticated
  using (collaborator_id = public.jcf_collaborator_id());

create policy cp_repl_insert on public.cp_requests
  for insert to authenticated
  with check (collaborator_id = public.jcf_collaborator_id()
              and status = 'pending');

-- ── mads (mises à disposition) : admin uniquement ──────────────────────────
create policy mads_admin_all on public.mads
  for all to authenticated
  using (public.jcf_is_admin()) with check (public.jcf_is_admin());

-- ── users_extra : admin uniquement, en attendant sa suppression (étape 5) ──
create policy users_extra_admin_all on public.users_extra
  for all to authenticated
  using (public.jcf_is_admin()) with check (public.jcf_is_admin());

commit;
