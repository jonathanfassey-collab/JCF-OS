-- ═══════════════════════════════════════════════════════════════════════════
-- JCF OS — RETOUR ARRIÈRE de l'étape 4 (en cas de problème le soir de la bascule)
-- ═══════════════════════════════════════════════════════════════════════════
-- Rétablit l'état d'avant : base de nouveau OUVERTE À TOUS.
-- À n'utiliser que le temps de corriger un problème, puis réappliquer 02.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

drop policy if exists asg_admin_all         on public.assignments;
drop policy if exists asg_store_select      on public.assignments;
drop policy if exists asg_store_insert      on public.assignments;
drop policy if exists asg_store_delete      on public.assignments;
drop policy if exists asg_repl_select       on public.assignments;
drop policy if exists cp_admin_all          on public.cp_requests;
drop policy if exists cp_repl_select        on public.cp_requests;
drop policy if exists cp_repl_insert        on public.cp_requests;
drop policy if exists mads_admin_all        on public.mads;
drop policy if exists users_extra_admin_all on public.users_extra;

create policy "Public access" on public.assignments for all to public using (true) with check (true);
create policy "Public access" on public.mads        for all to public using (true) with check (true);
create policy "Public access" on public.cp_requests for all to public using (true) with check (true);
create policy "Public access" on public.users_extra for all to public using (true) with check (true);

commit;
