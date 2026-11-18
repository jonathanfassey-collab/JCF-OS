-- ═══════════════════════════════════════════════════════════════════════════
-- JCF OS — Réservations et annulations magasin contrôlées par le serveur
-- ═══════════════════════════════════════════════════════════════════════════
-- BROUILLON, NON APPLIQUÉ. Dépend de 05 (table rate_grid remplie).
--
-- Règles validées par Jonathan le 18/11/2026 :
--   • le prix vient OBLIGATOIREMENT de la grille tarifaire ; un prix différent
--     se négocie à l'oral, se confirme par mail et se saisit par l'admin ;
--   • un magasin peut annuler toute journée de travail de son magasin,
--     y compris celles posées par l'admin ;
--   • annulation sans frais jusqu'à 48 h avant le début de la journée ;
--     ensuite (et pour une journée passée) : pénalité de 30 %.
--
-- Aujourd'hui, le prix est calculé dans le navigateur et le serveur accepte
-- n'importe quel montant : un appel direct à l'API pourrait réserver à 0 €.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- Frais annexes facturés aux magasins (mêmes valeurs que l'écran de réservation)
create table if not exists public.booking_fees (
  code   text primary key,
  amount numeric not null
);
insert into public.booking_fees (code, amount) values
  ('hotel_nuit', 120), ('repas_soir', 18), ('ouverture', 150), ('penalite_taux', 0.30), ('delai_annulation_h', 48)
on conflict (code) do nothing;
alter table public.booking_fees enable row level security;
create policy fees_admin_all on public.booking_fees for all to authenticated
  using (public.jcf_is_admin()) with check (public.jcf_is_admin());

create or replace function public.jcf_fee(p_code text)
returns numeric language sql stable security definer set search_path = '' as $$
  select amount from public.booking_fees where code = p_code
$$;

-- Tarif de la grille applicable à une date
create or replace function public.jcf_rate_at(p_collab text, p_date date)
returns public.rate_grid language sql stable security definer set search_path = '' as $$
  select * from public.rate_grid
  where collaborator_id = p_collab and effective_from <= p_date
  order by effective_from desc limit 1
$$;

-- ── Réservation magasin ────────────────────────────────────────────────────
-- Le magasin envoie le collaborateur, le type, les dates et les options.
-- Le serveur calcule le prix et crée toutes les journées en une transaction.
create or replace function public.jcf_store_book(
  p_collab        text,
  p_booking_type  text,          -- day | week | fortnight | month
  p_dates         text[],        -- journées réservées (AAAA-MM-JJ)
  p_hours_per_day numeric,
  p_extra_hours   numeric default 0,
  p_hotel_nights  integer default 0,
  p_repas_soirs   integer default 0,
  p_ouverture     boolean default false
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_loc   text := public.jcf_location_id();
  v_ref   date;
  v_rate  public.rate_grid;
  v_price numeric;
  v_id    text := 'BK-' || gen_random_uuid();
  v_first text;
  d       text;
begin
  if v_loc is null then
    raise exception 'Réservé aux comptes magasin' using errcode = '42501';
  end if;
  if p_booking_type not in ('day','week','fortnight','month') then
    raise exception 'Type de réservation inconnu' using errcode = '22023';
  end if;
  if coalesce(array_length(p_dates, 1), 0) = 0 then
    raise exception 'Aucune date' using errcode = '22023';
  end if;
  select min(x) into v_first from unnest(p_dates) x;
  if v_first::date < current_date then
    raise exception 'Impossible de réserver une date passée' using errcode = '22023';
  end if;
  if p_hours_per_day is null or p_hours_per_day < 0 or p_hours_per_day > 12
     or p_extra_hours < 0 or p_hotel_nights < 0 or p_repas_soirs < 0 then
    raise exception 'Valeurs invalides' using errcode = '22023';
  end if;

  v_ref := case when p_booking_type = 'month' then date_trunc('month', v_first::date)::date else v_first::date end;
  v_rate := public.jcf_rate_at(p_collab, v_ref);
  if v_rate.collaborator_id is null then
    raise exception 'Pas de tarif dans la grille pour ce collaborateur' using errcode = 'P0002';
  end if;

  v_price := round(
    case p_booking_type when 'day' then v_rate.day when 'week' then v_rate.week
                        when 'fortnight' then v_rate.fortnight else v_rate.month end
    + coalesce(p_extra_hours, 0) * v_rate.hourly);

  foreach d in array p_dates loop
    insert into public.assignments
      (id, collaborator_id, date, location_id, type_id, hours, booking_type, period_cost,
       hotel_nights, hotel_cost, repas_soirs, repas_cost, ouverture, ouverture_cost,
       source_kind, source_id)
    values
      ('ax-' || gen_random_uuid(), p_collab, d, v_loc, 'work', p_hours_per_day, p_booking_type,
       case when d = v_first then v_price else 0 end,
       case when d = v_first then p_hotel_nights else 0 end,
       case when d = v_first then p_hotel_nights * public.jcf_fee('hotel_nuit') else 0 end,
       case when d = v_first then p_repas_soirs else 0 end,
       case when d = v_first then p_repas_soirs * public.jcf_fee('repas_soir') else 0 end,
       d = v_first and p_ouverture,
       case when d = v_first and p_ouverture then public.jcf_fee('ouverture') else 0 end,
       'store_booking', v_id);
  end loop;
  return v_id;
end;
$$;

-- ── Annulation magasin ─────────────────────────────────────────────────────
create or replace function public.jcf_store_cancel(p_assignment_id text)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_loc  text := public.jcf_location_id();
  a      public.assignments%rowtype;
  v_rate public.rate_grid;
  v_pen  numeric;
begin
  if v_loc is null then
    raise exception 'Réservé aux comptes magasin' using errcode = '42501';
  end if;
  select * into a from public.assignments where id = p_assignment_id for update;
  if not found or a.location_id is distinct from v_loc or a.type_id <> 'work' then
    raise exception 'Journée introuvable dans votre magasin' using errcode = 'P0002';
  end if;

  -- Début de la journée, heure de Luxembourg
  if (a.date::date::timestamp at time zone 'Europe/Luxembourg') - now()
       >= make_interval(hours => public.jcf_fee('delai_annulation_h')::int) then
    delete from public.assignments where id = a.id;
    return 'annulee_sans_frais';
  end if;

  v_rate := public.jcf_rate_at(a.collaborator_id, a.date::date);
  v_pen  := round(coalesce(v_rate.hourly, 0) * coalesce(a.hours, 0) * public.jcf_fee('penalite_taux'));
  insert into public.assignments
    (id, collaborator_id, date, location_id, type_id, hours, booking_type, period_cost, penalite, source_kind, source_id)
  values
    ('ax-' || gen_random_uuid(), a.collaborator_id, a.date, a.location_id, 'annulation', a.hours,
     a.booking_type, v_pen, v_pen, 'late_cancel', a.id);
  delete from public.assignments where id = a.id;
  return 'annulee_penalite';
end;
$$;

revoke execute on function public.jcf_fee(text)              from public, anon;
revoke execute on function public.jcf_rate_at(text, date)    from public, anon, authenticated;  -- usage interne
revoke execute on function public.jcf_store_book(text, text, text[], numeric, numeric, integer, integer, boolean) from public, anon;
revoke execute on function public.jcf_store_cancel(text)     from public, anon;
grant  execute on function public.jcf_fee(text)              to authenticated;
grant  execute on function public.jcf_store_book(text, text, text[], numeric, numeric, integer, integer, boolean) to authenticated;
grant  execute on function public.jcf_store_cancel(text)     to authenticated;

commit;

-- ── Étape 2 : UNIQUEMENT après déploiement du code client qui appelle ces fonctions ──
-- Retirer l'écriture directe des magasins (les récups restent gérées par leurs règles) :
-- begin;
-- drop policy if exists asg_store_insert on public.assignments;
-- drop policy if exists asg_store_delete on public.assignments;
-- commit;
--
-- Retour arrière de l'étape 2 : recréer les deux règles (texte dans 02_auth_rls_bascule.sql).
-- Retour arrière complet : drop function jcf_store_book, jcf_store_cancel, jcf_rate_at, jcf_fee ; drop table booking_fees.
