-- ═══════════════════════════════════════════════════════════════════════════
-- JCF OS — Migration Supabase Auth, étape 1 : profils et fonctions de rôle
-- ═══════════════════════════════════════════════════════════════════════════
-- Sans impact sur l'app actuelle : les règles « Public access » restent en
-- place. À appliquer APRÈS avoir créé le compte admin@jcf.lu à la main dans
-- Supabase (Authentication → Users → Add user, « Auto Confirm User » coché).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Table des profils : relie un compte Supabase Auth à un rôle JCF OS
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  login           text not null unique,            -- ex. pauline@jcf.lu
  display_name    text not null default '',
  role            text not null check (role in ('admin', 'store', 'replacement')),
  collaborator_id text,                            -- rôle replacement : c1…c16
  location_id     text,                            -- rôle store : l1…l28, m1…m16
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  constraint profiles_role_link check (
       role = 'admin'
    or (role = 'store'       and location_id     is not null)
    or (role = 'replacement' and collaborator_id is not null)
  )
);

alter table public.profiles enable row level security;

-- 2. Fonctions de rôle (lues par les règles RLS)
--    SECURITY DEFINER : lisent profiles sans dépendre de ses propres règles.
--    Un compte désactivé (active = false) n'a plus aucun rôle.
create or replace function public.jcf_role()
returns text language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.active
$$;

create or replace function public.jcf_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.jcf_role() = 'admin', false)
$$;

create or replace function public.jcf_location_id()
returns text language sql stable security definer set search_path = '' as $$
  select p.location_id from public.profiles p
  where p.id = auth.uid() and p.active and p.role = 'store'
$$;

create or replace function public.jcf_collaborator_id()
returns text language sql stable security definer set search_path = '' as $$
  select p.collaborator_id from public.profiles p
  where p.id = auth.uid() and p.active and p.role = 'replacement'
$$;

-- 3. Planning partagé, sans coûts ni absences
--    Magasin      : créneaux « occupé » des collaborateurs (lieu masqué sauf le sien)
--                   → sert à la liste des disponibles et à la détection de conflits.
--    Collaborateur: créneaux de travail de tous, avec le lieu
--                   → sert à l'affichage « équipe du jour » sur une mission.
--    Aucun montant, aucune pénalité, aucun motif d'absence (maladie, congés…).
create or replace function public.jcf_shared_planning()
returns table (id text, collaborator_id text, date text, location_id text, type_id text, hours numeric)
language sql stable security definer set search_path = '' as $$
  select a.id,
         a.collaborator_id,
         a.date,
         case when public.jcf_role() = 'replacement'
                or a.location_id = public.jcf_location_id()
              then a.location_id else '' end,
         'work'::text,
         a.hours
  from public.assignments a
  where public.jcf_role() in ('store', 'replacement')
    and a.type_id = 'work'
$$;

revoke execute on function public.jcf_role()            from public, anon;
revoke execute on function public.jcf_is_admin()        from public, anon;
revoke execute on function public.jcf_location_id()     from public, anon;
revoke execute on function public.jcf_collaborator_id() from public, anon;
revoke execute on function public.jcf_shared_planning() from public, anon;
grant  execute on function public.jcf_role()            to authenticated;
grant  execute on function public.jcf_is_admin()        to authenticated;
grant  execute on function public.jcf_location_id()     to authenticated;
grant  execute on function public.jcf_collaborator_id() to authenticated;
grant  execute on function public.jcf_shared_planning() to authenticated;

-- 4. Règles sur profiles : chacun lit son profil, l'admin lit tout.
--    Aucune écriture côté navigateur : création, réinitialisation et
--    désactivation passent par l'Edge Function admin-users.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.jcf_is_admin());

-- 5. Profil du compte admin créé à la main (ne fait rien s'il n'existe pas)
insert into public.profiles (id, login, display_name, role)
select u.id, u.email, 'Jonathan', 'admin'
from auth.users u
where u.email = 'admin@jcf.lu'
on conflict (id) do nothing;
