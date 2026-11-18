-- ═══════════════════════════════════════════════════════════════════════════
-- JCF OS — D03 : validations CP/CSS et MAD en une seule opération serveur
-- ═══════════════════════════════════════════════════════════════════════════
-- BROUILLON, NON APPLIQUÉ. À relire, puis tester sur une branche Supabase
-- (ou une copie) avant toute application en production.
--
-- Constat au 18/11/2026 : 0 MAD et 0 demande CP/CSS en base. Le risque est donc
-- pour l'instant théorique : c'est le bon moment pour poser la règle.
--
-- Principe :
--   • chaque affectation créée par une demande porte sa provenance
--     (source_kind = 'leave' | 'mad', source_id = id de la demande) ;
--   • anti-doublon UNIQUEMENT par (provenance, date) : deux demi-journées
--     indépendantes le même jour restent possibles ;
--   • validation = une transaction : tout ou rien, rejouable sans doublon ;
--   • suppression d'une MAD = suppression de SES affectations seulement.
--
-- La colonne existante `source` (texte libre : « déclaré par Jonathan le... »)
-- n'est pas touchée.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

alter table public.assignments
  add column if not exists source_kind text,
  add column if not exists source_id   text;

create unique index if not exists assignments_provenance_uniq
  on public.assignments (source_kind, source_id, date)
  where source_kind is not null;

-- ── Validation d'une demande CP / CSS ──────────────────────────────────────
-- DÉCISION MÉTIER À CONFIRMER : peut-on valider une demande déjà refusée ?
-- Ce brouillon l'autorise (pending ou refused → approved).
create or replace function public.jcf_validate_leave(p_request_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.cp_requests%rowtype;
  d text;
begin
  if not public.jcf_is_admin() then
    raise exception 'Action réservée à l''administrateur' using errcode = '42501';
  end if;

  -- Verrou : deux administrateurs simultanés sont traités l'un après l'autre
  select * into r from public.cp_requests where id = p_request_id for update;
  if not found then
    raise exception 'Demande introuvable' using errcode = 'P0002';
  end if;
  if r.status = 'approved' then
    return 'deja_validee';                       -- idempotent : double clic sans effet
  end if;

  foreach d in array r.dates::text[] loop
    insert into public.assignments
      (id, collaborator_id, date, location_id, type_id, hours, booking_type, source_kind, source_id)
    values
      ('ax-' || gen_random_uuid(), r.collaborator_id, d, coalesce(r.type, 'cp'), coalesce(r.type, 'cp'), 8, 'day', 'leave', r.id)
    on conflict (source_kind, source_id, date) where source_kind is not null do nothing;
  end loop;

  update public.cp_requests set status = 'approved' where id = r.id;
  return 'validee';
end;
$$;

-- ── Création d'une MAD avec ses journées, en une transaction ───────────────
-- p_mad : objet JSON avec les colonnes de public.mads (sans id)
-- p_days : tableau JSON de journées {date, location_id, hours, period_cost, hotel_nights, hotel_cost, repas_soirs, repas_cost}
create or replace function public.jcf_create_mad(p_mad jsonb, p_days jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id text := 'JCF-MAD-' || gen_random_uuid();
  j jsonb;
begin
  if not public.jcf_is_admin() then
    raise exception 'Action réservée à l''administrateur' using errcode = '42501';
  end if;

  insert into public.mads
    (id, partner_id, collaborator_id, booking_type, start_date, end_date, blocked_hours, extra_hours,
     collab_cost, hotel_nights, hotel_cost, repas_soirs, repas_cost, ouverture_cost, cost, status, comment)
  select v_id, m.partner_id, m.collaborator_id, m.booking_type, m.start_date, m.end_date,
         coalesce(m.blocked_hours,0), coalesce(m.extra_hours,0), coalesce(m.collab_cost,0),
         coalesce(m.hotel_nights,0), coalesce(m.hotel_cost,0), coalesce(m.repas_soirs,0),
         coalesce(m.repas_cost,0), coalesce(m.ouverture_cost,0), coalesce(m.cost,0),
         coalesce(m.status,'confirmed'), coalesce(m.comment,'')
  from jsonb_populate_record(null::public.mads, p_mad) m;

  for j in select * from jsonb_array_elements(coalesce(p_days, '[]'::jsonb)) loop
    insert into public.assignments
      (id, collaborator_id, date, location_id, type_id, hours, booking_type, period_cost,
       hotel_nights, hotel_cost, repas_soirs, repas_cost, source_kind, source_id)
    values
      ('ax-' || gen_random_uuid(), p_mad->>'collaborator_id', j->>'date', coalesce(j->>'location_id','work'), 'work',
       coalesce((j->>'hours')::numeric, 8), coalesce(p_mad->>'booking_type','day'),
       coalesce((j->>'period_cost')::numeric,0), coalesce((j->>'hotel_nights')::numeric,0),
       coalesce((j->>'hotel_cost')::numeric,0), coalesce((j->>'repas_soirs')::numeric,0),
       coalesce((j->>'repas_cost')::numeric,0), 'mad', v_id);
  end loop;

  return v_id;
end;
$$;

-- ── Suppression d'une MAD : uniquement ses propres journées ────────────────
create or replace function public.jcf_delete_mad(p_mad_id text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare n integer;
begin
  if not public.jcf_is_admin() then
    raise exception 'Action réservée à l''administrateur' using errcode = '42501';
  end if;
  delete from public.assignments where source_kind = 'mad' and source_id = p_mad_id;
  get diagnostics n = row_count;
  delete from public.mads where id = p_mad_id;
  if not found then
    raise exception 'MAD introuvable' using errcode = 'P0002';
  end if;
  return n;   -- nombre de journées retirées
end;
$$;

revoke execute on function public.jcf_validate_leave(text)       from public, anon;
revoke execute on function public.jcf_create_mad(jsonb, jsonb)   from public, anon;
revoke execute on function public.jcf_delete_mad(text)           from public, anon;
grant  execute on function public.jcf_validate_leave(text)       to authenticated;
grant  execute on function public.jcf_create_mad(jsonb, jsonb)   to authenticated;
grant  execute on function public.jcf_delete_mad(text)           to authenticated;

commit;

-- ── Retour arrière (si besoin) ─────────────────────────────────────────────
-- begin;
-- drop function if exists public.jcf_validate_leave(text);
-- drop function if exists public.jcf_create_mad(jsonb, jsonb);
-- drop function if exists public.jcf_delete_mad(text);
-- drop index if exists public.assignments_provenance_uniq;
-- -- Les colonnes source_kind / source_id peuvent rester (vides, sans effet).
-- commit;
