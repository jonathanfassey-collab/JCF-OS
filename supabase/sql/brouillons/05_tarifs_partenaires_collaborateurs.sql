-- ═══════════════════════════════════════════════════════════════════════════
-- JCF OS — D05 : persister tarifs, partenaires et collaborateurs ajoutés
-- ═══════════════════════════════════════════════════════════════════════════
-- BROUILLON, NON APPLIQUÉ.
--
-- Aujourd'hui : INITIAL_RATES, INDEXED_RATES, INITIAL_PARTNERS et COLLABORATORS
-- sont écrits dans le code ; une modification dans l'écran est perdue au
-- rechargement. Les fiches RH (collaborator_hr) sont déjà en base : non touchées.
--
-- Tarifs : une ligne par collaborateur ET par date d'effet. On n'écrase jamais
-- une ligne passée : un changement de tarif = une nouvelle ligne datée.
-- Une facturation du 15/01 utilise la dernière ligne dont effective_from <= 15/01.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create table if not exists public.rate_grid (
  collaborator_id  text        not null,
  effective_from   date        not null,
  hourly           numeric     not null default 0,
  day              numeric     not null default 0,
  week             numeric     not null default 0,
  fortnight        numeric     not null default 0,
  month            numeric     not null default 0,
  minimum_monthly  numeric     not null default 0,
  weekly_hours     numeric,
  note             text,
  created_at       timestamptz not null default now(),
  created_by       uuid        default auth.uid(),
  primary key (collaborator_id, effective_from)
);

create table if not exists public.partners (
  id          text primary key,
  name        text not null,
  commercial  text,
  category    text,
  city        text,
  country     text,
  phone       text,
  email       text,
  contact     text,
  comment     text,
  sites       text[] not null default '{}',
  status      text   not null default 'active',
  updated_at  timestamptz not null default now()
);

create table if not exists public.collaborators (
  id            text primary key,
  name          text not null,
  contract      numeric,
  weekly_hours  numeric,
  avatar        text,
  color         text,
  special       text,
  active        boolean not null default true,
  updated_at    timestamptz not null default now()
);

alter table public.rate_grid     enable row level security;
alter table public.partners      enable row level security;
alter table public.collaborators enable row level security;

-- Tarifs et partenaires : admin uniquement (les prix restent masqués aux magasins/collaborateurs)
create policy rate_admin_all on public.rate_grid for all to authenticated
  using (public.jcf_is_admin()) with check (public.jcf_is_admin());
create policy partners_admin_all on public.partners for all to authenticated
  using (public.jcf_is_admin()) with check (public.jcf_is_admin());

-- Collaborateurs : noms lisibles par tout compte actif (déjà visibles dans le planning),
-- modification admin uniquement.
create policy collab_read on public.collaborators for select to authenticated
  using (public.jcf_role() is not null);
create policy collab_admin_write on public.collaborators for all to authenticated
  using (public.jcf_is_admin()) with check (public.jcf_is_admin());

-- Historique : interdire la modification d'un tarif dont la date d'effet est passée
create or replace function public.jcf_rate_grid_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (tg_op in ('UPDATE','DELETE')) and old.effective_from <= current_date then
    raise exception 'Tarif déjà en vigueur : créer une nouvelle ligne avec une date d''effet future';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists rate_grid_guard on public.rate_grid;
create trigger rate_grid_guard before update or delete on public.rate_grid
  for each row execute function public.jcf_rate_grid_guard();

commit;

-- Étape suivante (script séparé, après accord) : importer les valeurs actuelles
-- du code (INITIAL_RATES au 01/01/2026, INDEXED_RATES à RATE_INDEXATION_DATE,
-- INITIAL_PARTNERS, COLLABORATORS), puis brancher l'application dessus.
--
-- Retour arrière : drop table public.rate_grid, public.partners, public.collaborators;
-- (sans perte : le code garde ses valeurs intégrées tant qu'il n'est pas branché).
