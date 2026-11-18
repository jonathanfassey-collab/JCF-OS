// Conversion entre objets de l'application (camelCase) et lignes Supabase.
//
// Création : valeurs par défaut appliquées (frais à 0, booking_type "day"...).
// Mise à jour (PATCH) : SEULES les propriétés présentes sont envoyées.
//   - propriété absente (undefined) → colonne non touchée
//   - 0 / false / ""                → mise à zéro explicite, envoyée
//   - null                          → envoyé tel quel (toutes ces colonnes l'acceptent)

const ASG_FIELDS = {
  collaboratorId: "collaborator_id", date: "date", locationId: "location_id", typeId: "type_id",
  hours: "hours", bookingType: "booking_type", periodCost: "period_cost",
  hotelNights: "hotel_nights", hotelCost: "hotel_cost", repasSoirs: "repas_soirs", repasCost: "repas_cost",
  ouverture: "ouverture", ouvertureCost: "ouverture_cost", penalite: "penalite",
};

const MAD_FIELDS = {
  partnerId: "partner_id", collaboratorId: "collaborator_id", bookingType: "booking_type",
  startDate: "start_date", endDate: "end_date", blockedHours: "blocked_hours", extraHours: "extra_hours",
  collabCost: "collab_cost", hotelNights: "hotel_nights", hotelCost: "hotel_cost",
  repasSoirs: "repas_soirs", repasCost: "repas_cost", ouvertureCost: "ouverture_cost",
  cost: "cost", status: "status", comment: "comment",
};

function toPatch(map, ch) {
  const out = {};
  for (const [k, col] of Object.entries(map)) {
    if (ch && Object.prototype.hasOwnProperty.call(ch, k) && ch[k] !== undefined) out[col] = ch[k];
  }
  return out;
}

export function asgToRow(a) {
  return { id:a.id, collaborator_id:a.collaboratorId, date:a.date, location_id:a.locationId, type_id:a.typeId, hours:a.hours||0, booking_type:a.bookingType||"day", period_cost:a.periodCost||0, hotel_nights:a.hotelNights||0, hotel_cost:a.hotelCost||0, repas_soirs:a.repasSoirs||0, repas_cost:a.repasCost||0, ouverture:a.ouverture||false, ouverture_cost:a.ouvertureCost||0, penalite:a.penalite||0 };
}
export function asgToPatch(ch) { return toPatch(ASG_FIELDS, ch); }

export function rowToAsg(r) {
  return { id:r.id, collaboratorId:r.collaborator_id, date:r.date, locationId:r.location_id, typeId:r.type_id, hours:Number(r.hours)||0, bookingType:r.booking_type||"day", periodCost:Number(r.period_cost)||0, hotelNights:Number(r.hotel_nights)||0, hotelCost:Number(r.hotel_cost)||0, repasSoirs:Number(r.repas_soirs)||0, repasCost:Number(r.repas_cost)||0, ouverture:r.ouverture||false, ouvertureCost:Number(r.ouverture_cost)||0, penalite:Number(r.penalite)||0 };
}

export function madToRow(m) {
  return { id:m.id, partner_id:m.partnerId, collaborator_id:m.collaboratorId, booking_type:m.bookingType, start_date:m.startDate, end_date:m.endDate, blocked_hours:m.blockedHours||0, extra_hours:m.extraHours||0, collab_cost:m.collabCost||0, hotel_nights:m.hotelNights||0, hotel_cost:m.hotelCost||0, repas_soirs:m.repasSoirs||0, repas_cost:m.repasCost||0, ouverture_cost:m.ouvertureCost||0, cost:m.cost||0, status:m.status||"confirmed", comment:m.comment||"" };
}
export function madToPatch(ch) { return toPatch(MAD_FIELDS, ch); }

export function rowToMad(r) {
  return { id:r.id, partnerId:r.partner_id, collaboratorId:r.collaborator_id, bookingType:r.booking_type, startDate:r.start_date, endDate:r.end_date, blockedHours:Number(r.blocked_hours)||0, extraHours:Number(r.extra_hours)||0, collabCost:Number(r.collab_cost)||0, hotelNights:Number(r.hotel_nights)||0, hotelCost:Number(r.hotel_cost)||0, repasSoirs:Number(r.repas_soirs)||0, repasCost:Number(r.repas_cost)||0, ouvertureCost:Number(r.ouverture_cost)||0, cost:Number(r.cost)||0, status:r.status||"confirmed", comment:r.comment||"" };
}

export function cpToRow(r) { return { id:r.id, collaborator_id:r.collaboratorId, dates:r.dates, comment:r.comment||"", status:r.status, type:r.type||"cp" }; }
export function rowToCp(r) { return { id:r.id, collaboratorId:r.collaborator_id, dates:r.dates||[], comment:r.comment||"", status:r.status, type:r.type||"cp" }; }

// Recalcul intentionnel du coût d'une affectation tarifée selon la grille.
// Une réservation à prix commercial (periodCost différent de la grille) garde son prix.
// Un periodCost fourni explicitement dans `ch` n'est jamais écrasé.
export function withGridCost(prev, ch, gridCost) {
  if (!prev || ch.periodCost !== undefined) return ch;
  const wasGrid = Math.abs((prev.periodCost || 0) - gridCost(prev)) < 0.05 || !(prev.periodCost > 0);
  return wasGrid ? { ...ch, periodCost: gridCost({ ...prev, ...ch }) } : ch;
}

// updateMad était appelé de deux façons : (id, {champ:valeur}) et (id, "champ", valeur).
// La seconde forme étalait la chaîne de caractères au lieu de modifier le champ.
export function normalizeChange(chOrField, value) {
  if (typeof chOrField === "string") return { [chOrField]: value };
  return chOrField || {};
}
