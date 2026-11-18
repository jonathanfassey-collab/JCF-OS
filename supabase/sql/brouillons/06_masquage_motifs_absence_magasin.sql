-- ═══════════════════════════════════════════════════════════════════════════
-- JCF OS — Accès : masquer le motif d'absence aux magasins
-- ═══════════════════════════════════════════════════════════════════════════
-- BROUILLON, NON APPLIQUÉ.
--
-- Constat (lecture du 18/11/2026) : jcf_store_staff_planning() renvoie aux
-- directrices de magasin le type exact des journées de leur équipe :
-- cp, css, maladie, formation, visite... (3 lignes « maladie » en base).
-- Le README de la bascule promettait l'inverse : « ni lieu, ni coût, ni motif
-- d'absence ». Un arrêt maladie est une donnée de santé.
--
-- Correction proposée : le magasin voit « work » (son magasin ou ailleurs),
-- « recup » (qu'il gère lui-même) et « absent » pour tout le reste.
-- Le code client gère déjà ce cas (journée non travaillée → « contactez JCF »).
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.jcf_store_staff_planning()
returns table(id text, collaborator_id text, date text, location_id text, type_id text, hours numeric)
language sql
stable
security definer
set search_path = ''
as $function$
  with me as (select public.jcf_location_id() as loc where public.jcf_role() = 'store'),
  staff as (
    select distinct a.collaborator_id from public.assignments a, me
    where a.location_id = me.loc and a.type_id = 'work' and a.date >= to_char(current_date - 120, 'YYYY-MM-DD'))
  select a.id, a.collaborator_id, a.date,
         case when a.type_id = 'work' and a.location_id = me.loc then a.location_id
              when a.type_id = 'recup' then 'recup'
              else '' end,
         case when a.type_id in ('work', 'recup') then a.type_id else 'absent' end,
         case when a.type_id in ('work', 'recup') then a.hours else 0 end
  from public.assignments a join staff s on s.collaborator_id = a.collaborator_id cross join me
  where a.date >= to_char(current_date - 400, 'YYYY-MM-DD')
$function$;

-- Retour arrière : réappliquer la définition d'origine (copie ci-dessous).
-- ... case when a.type_id <> 'work' or a.location_id = me.loc then a.location_id else '' end,
--         a.type_id, a.hours ...
