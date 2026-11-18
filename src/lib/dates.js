// Dates civiles (AAAA-MM-JJ), calculées en heure locale.
//
// Pourquoi : `new Date(2027, 2, 1).toISOString()` convertit minuit local en UTC.
// En Europe/Luxembourg (UTC+1 / UTC+2), on recule d'un jour : le 1er mars
// devient le 28 février. Toutes les dates du planning passent donc par ymd().

export function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

// Midi local : aucun changement d'heure ne peut faire basculer le jour.
export function parseYmd(s) {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

export function addDays(s, n) {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

export function todayYmd() {
  return ymd(new Date());
}

// Premier et dernier jour d'un mois (m de 1 à 12).
export function monthBounds(y, m) {
  return [ymd(new Date(y, m - 1, 1, 12)), ymd(new Date(y, m, 0, 12))];
}

function isCounted(dow, inclSat) {
  if (dow === 0) return false;           // dimanche : jamais
  if (dow === 6) return !!inclSat;        // samedi : selon l'option
  return true;
}

// Jours travaillés entre s et e inclus. Dimanche exclu ; samedi inclus si inclSat.
export function buildDateRange(s, e, inclSat = false) {
  const dates = [];
  const c = parseYmd(s);
  const end = parseYmd(e);
  let safety = 0;
  while (c <= end && safety < 500) {
    safety++;
    if (isCounted(c.getDay(), inclSat)) dates.push(ymd(c));
    c.setDate(c.getDate() + 1);
  }
  return dates;
}

// Fin de période : semaine = 5 jours ouvrés (lun-ven), quinzaine = 10, mois = 22.
// Règle retenue (à valider métier) : la période facturée reste calée sur les
// jours ouvrés ; l'option samedi ajoute les samedis compris dans cette période
// via buildDateRange, sans allonger ni raccourcir la période.
export function calcEndDate(s, t) {
  if (t === "day") return s;
  const tgt = { week: 5, fortnight: 10, month: 22 }[t] || 5;
  const c = parseYmd(s);
  let n = 0;
  let safety = 0;
  while (safety < 500) {
    safety++;
    const dow = c.getDay();
    if (dow !== 0 && dow !== 6) { n++; if (n >= tgt) return ymd(c); }
    c.setDate(c.getDate() + 1);
  }
  return s;
}

// Dates d'une réservation selon son type.
export function periodDates(type, startDate, monthStr, inclSat = false) {
  if (type === "day") return [startDate];
  if (type === "week" || type === "fortnight") return buildDateRange(startDate, calcEndDate(startDate, type), inclSat);
  if (type === "month") {
    const [y, m] = String(monthStr).split("-").map(Number);
    const [a, b] = monthBounds(y, m);
    return buildDateRange(a, b, inclSat);
  }
  return [];
}
