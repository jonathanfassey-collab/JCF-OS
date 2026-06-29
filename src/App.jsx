import React from "react";
import { useState, useMemo, useEffect } from "react";
// ─── Supabase config ──────────────────────────────────────────────────────────
const SUPA_URL = "https://hwjuqtrdjcowgcvmhfed.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3anVxdHJkamNvd2djdm1oZmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODY5NDAsImV4cCI6MjA5Nzk2Mjk0MH0.2_sbmMTkGAnvffLlAsoLW8ZTy1nOpeNeGQtCg73q_bI";

async function supaFetch(table, method, body, filters) {
  const url = SUPA_URL + "/rest/v1/" + table + (filters ? "?" + filters : "");
  const headers = {
    "apikey": SUPA_KEY,
    "Authorization": "Bearer " + SUPA_KEY,
    "Content-Type": "application/json",
  };
  if (method === "POST") headers["Prefer"] = "return=representation";
  const res = await fetch(url, { method: method||"GET", headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) { console.error("Supabase error:", res.status, await res.text()); return null; }
  if (method === "DELETE" || method === "PATCH") return true;
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

function asgToRow(a) {
  return { id:a.id, collaborator_id:a.collaboratorId, date:a.date, location_id:a.locationId, type_id:a.typeId, hours:a.hours||0, booking_type:a.bookingType||"day", period_cost:a.periodCost||0, hotel_nights:a.hotelNights||0, hotel_cost:a.hotelCost||0, repas_soirs:a.repasSoirs||0, repas_cost:a.repasCost||0, ouverture:a.ouverture||false, ouverture_cost:a.ouvertureCost||0, penalite:a.penalite||0 };
}
function rowToAsg(r) {
  return { id:r.id, collaboratorId:r.collaborator_id, date:r.date, locationId:r.location_id, typeId:r.type_id, hours:Number(r.hours)||0, bookingType:r.booking_type||"day", periodCost:Number(r.period_cost)||0, hotelNights:Number(r.hotel_nights)||0, hotelCost:Number(r.hotel_cost)||0, repasSoirs:Number(r.repas_soirs)||0, repasCost:Number(r.repas_cost)||0, ouverture:r.ouverture||false, ouvertureCost:Number(r.ouverture_cost)||0, penalite:Number(r.penalite)||0 };
}
function madToRow(m) {
  return { id:m.id, partner_id:m.partnerId, collaborator_id:m.collaboratorId, booking_type:m.bookingType, start_date:m.startDate, end_date:m.endDate, blocked_hours:m.blockedHours||0, extra_hours:m.extraHours||0, collab_cost:m.collabCost||0, hotel_nights:m.hotelNights||0, hotel_cost:m.hotelCost||0, repas_soirs:m.repasSoirs||0, repas_cost:m.repasCost||0, ouverture_cost:m.ouvertureCost||0, cost:m.cost||0, status:m.status||"confirmed", comment:m.comment||"" };
}
function rowToMad(r) {
  return { id:r.id, partnerId:r.partner_id, collaboratorId:r.collaborator_id, bookingType:r.booking_type, startDate:r.start_date, endDate:r.end_date, blockedHours:Number(r.blocked_hours)||0, extraHours:Number(r.extra_hours)||0, collabCost:Number(r.collab_cost)||0, hotelNights:Number(r.hotel_nights)||0, hotelCost:Number(r.hotel_cost)||0, repasSoirs:Number(r.repas_soirs)||0, repasCost:Number(r.repas_cost)||0, ouvertureCost:Number(r.ouverture_cost)||0, cost:Number(r.cost)||0, status:r.status||"confirmed", comment:r.comment||"" };
}
function cpToRow(r) {
  return { id:r.id, collaborator_id:r.collaboratorId, dates:r.dates, comment:r.comment||"", status:r.status, type:r.type||"cp" };
}
function rowToCp(r) {
  return { id:r.id, collaboratorId:r.collaborator_id, dates:r.dates||[], comment:r.comment||"", status:r.status, type:r.type||"cp" };
}



// ─── Palette JCF officielle ──────────────────────────────────────────────────
// Navy   : #1E2F4F   Or     : #D4AF37   Fond   : #F8F9FB
// Navy2  : #2D456B   OrL    : #E7C766   Carte  : #FFFFFF
// Texte  : #2C2C2C   Sub    : #6B7280   Accent : #5D84C3
// Vert   : #2E8B57   Rouge  : #C0392B

// ════════════════════════════════════════════════════════════
// DONNÉES MÉTIER
// ════════════════════════════════════════════════════════════

const COLLABORATORS = [
  { id:"c1",  name:"Margaux M",  contract:121,  weeklyHours:28, avatar:"MM", color:"#10B981" },
  { id:"c2",  name:"Benjamin",   contract:160,  weeklyHours:37, avatar:"BE", color:"#3B82F6" },
  { id:"c3",  name:"Dozkhaz",    contract:173,  weeklyHours:40, avatar:"DO", color:"#8B5CF6" },
  { id:"c4",  name:"Mathilde",   contract:152,  weeklyHours:35, avatar:"MA", color:"#F59E0B" },
  { id:"c5",  name:"Pauline",    contract:173,  weeklyHours:40, avatar:"PA", color:"#EF4444" },
  { id:"c6",  name:"Laura S",    contract:139,  weeklyHours:32, avatar:"LS", color:"#EC4899" },
  { id:"c7",  name:"ABBI",       contract:139,  weeklyHours:32, avatar:"AG", color:"#14B8A6" },
  { id:"c8",  name:"Margaux K",  contract:173,  weeklyHours:40, avatar:"MK", color:"#6366F1" },
  { id:"c9",  name:"Laura G",    contract:139,  weeklyHours:32, avatar:"LG", color:"#84CC16" },
  { id:"c10", name:"Caroline",   contract:152,  weeklyHours:35, avatar:"CA", color:"#F97316" },
  { id:"c11", name:"Julie W",    contract:173,  weeklyHours:40, avatar:"JW", color:"#06B6D4" },
  { id:"c12", name:"Lucinda",    contract:120,  weeklyHours:28, avatar:"LU", color:"#A855F7" },
  { id:"c13", name:"Valerie",    contract:69,   weeklyHours:16, avatar:"VA", color:"#D4AF37", special:"associate" },
  { id:"c14", name:"Guillaume",  contract:16,   weeklyHours:4,  avatar:"GP", color:"#2D456B", special:"associate" },
  { id:"c15", name:"Celine H",   contract:0,    weeklyHours:0,  avatar:"CH", color:"#9CA3AF", special:"associate" },
];

const STORES = [
  { id:"l1",  name:"PAM"             }, { id:"l2",  name:"Nancy centre"    },
  { id:"l3",  name:"Pulnoy"          }, { id:"l4",  name:"Ludres"          },
  { id:"l5",  name:"Frouard"         }, { id:"l6",  name:"Bouxieres"       },
  { id:"l7",  name:"St Avold"        }, { id:"l8",  name:"Faulquemont"     },
  { id:"l9",  name:"Longeville"      }, { id:"l10", name:"Fameck"          },
  { id:"l11", name:"Hagondange"      }, { id:"l12", name:"Luxembourg"      },
  { id:"l13", name:"Revin"           }, { id:"l14", name:"Givet"           },
  { id:"l15", name:"Sedan"           }, { id:"l16", name:"Rethel"          },
  { id:"l17", name:"Reims"           }, { id:"l18", name:"Epinal"          },
  { id:"l19", name:"Charmes"         }, { id:"l20", name:"Mirecourt"       },
  { id:"l21", name:"Bazaine"         }, { id:"l22", name:"Jeuxey"          },
  { id:"l23", name:"Xertigny"        }, { id:"l24", name:"Betting"         },
  { id:"l25", name:"Hettange-Grande" }, { id:"l26", name:"Clouange"        },
  { id:"l27", name:"Haguenau"        },
];

const MISSIONS = [
  { id:"m1", name:"AGENT F"              }, { id:"m2", name:"ALEBA"               },
  { id:"m3", name:"APEX"                 }, { id:"m4", name:"FOYER"               },
  { id:"m5", name:"GLOBUS"               }, { id:"m6", name:"ONE LIFE"            },
  { id:"m7", name:"Depistage entreprise" }, { id:"m8", name:"BIL"                 },
  { id:"m9", name:"Raiffeisen"           }, { id:"m10", name:"Post"               },
];

const MISSION_COLORS = {
  "FOYER":"#1E2F4F", "APEX":"#8B5CF6", "ALEBA":"#2E8B57",
  "GLOBUS":"#C0392B","ONE LIFE":"#D97706","AGENT F":"#5D84C3",
  "Depistage entreprise":"#6B7280",
  "BIL":"#1E6B4F","Raiffeisen":"#C0392B","Post":"#F59E0B",
};

const ALL_LOCATIONS = [...STORES, ...MISSIONS];

const ABSENCE_TYPES = [
  { id:"repos",    name:"Repos",    countsHours:false, color:"#6B7280", bg:"#F3F4F6", textColor:"#4B5563" },
  { id:"dimanche", name:"Dimanche", countsHours:false, color:"#9CA3AF", bg:"#F9FAFB", textColor:"#6B7280" },
  { id:"cp",       name:"Conges",   countsHours:false, color:"#8B5CF6", bg:"#F5F3FF", textColor:"#6D28D9" },
  { id:"annulation", name:"Annulation", countsHours:false, color:"#C0392B", bg:"#FEF2F2", textColor:"#C0392B" },
  { id:"ferie",    name:"Ferie",    countsHours:false, color:"#2E8B57", bg:"#ECFDF5", textColor:"#047857" },
  { id:"maladie",  name:"Maladie",  countsHours:false, color:"#C0392B", bg:"#FEF2F2", textColor:"#B91C1C" },
  { id:"absence",  name:"Absence",  countsHours:false, color:"#C0392B", bg:"#FEF2F2", textColor:"#B91C1C" },
  { id:"recup",    name:"Recup",    countsHours:false, color:"#5D84C3", bg:"#EFF6FF", textColor:"#1D4ED8" },
];

const INITIAL_RATES = {
  "c1": { weeklyHours:28, mutuelle:92.77, hourly:27.84, day:155.9, week:779.52, fortnight:1559.04, minimumMonthly:3378.28, month:3378.28 },
  "c2": { weeklyHours:37, mutuelle:50.77, hourly:32.09, day:215.65, week:1034.15, fortnight:2275.12, minimumMonthly:3893.78, month:3947.46 },
  "c3": { weeklyHours:40, mutuelle:58.77, hourly:46.83, day:359.62, week:1721.19, fortnight:3786.63, minimumMonthly:6480.67, month:6539.44 },
  "c4": { weeklyHours:35, mutuelle:50.77, hourly:37.02, day:248.75, week:1192.88, fortnight:2624.35, minimumMonthly:4491.47, month:4542.24 },
  "c5": { weeklyHours:40, mutuelle:50.77, hourly:27.36, day:210.14, week:1005.77, fortnight:2212.69, minimumMonthly:3786.94, month:3837.71 },
  "c6": { weeklyHours:32, mutuelle:55.77, hourly:37.08, day:227.81, week:1092.45, fortnight:2403.4, minimumMonthly:4113.33, month:4169.1 },
  "c7": { weeklyHours:32, mutuelle:55.77, hourly:34.32, day:210.88, week:1011.28, fortnight:2224.81, minimumMonthly:3807.68, month:3863.45 },
  "c8": { weeklyHours:40, mutuelle:55.77, hourly:31.91, day:245.1, week:1173.08, fortnight:2580.77, minimumMonthly:4416.89, month:4472.66 },
  "c9": { weeklyHours:32, mutuelle:55.77, hourly:41.03, day:252.1, week:1208.96, fortnight:2659.71, minimumMonthly:4551.99, month:4607.76 },
  "c10": { weeklyHours:35, mutuelle:92.77, hourly:0, day:0, week:0, fortnight:0, minimumMonthly:0, month:0 },
  "c11": { weeklyHours:40, mutuelle:58.77, hourly:45.06, day:346.07, week:1656.33, fortnight:3643.92, minimumMonthly:6236.43, month:6295.2 },
  "c12": { weeklyHours:32, mutuelle:40.77, hourly:31.28, day:192.18, week:921.6, fortnight:2027.53, minimumMonthly:3470.04, month:3510.81 },
  "c13": { weeklyHours:16, mutuelle:0, hourly:0, day:0, week:0, fortnight:0, minimumMonthly:0, month:0 },
  "c14": { weeklyHours:4, mutuelle:0, hourly:0, day:0, week:0, fortnight:0, minimumMonthly:0, month:0 },
  "c15": { weeklyHours:0, mutuelle:0, hourly:0, day:0, week:0, fortnight:0, minimumMonthly:0, month:0 },
};

const RATES = { hourly:45, halfDay:180, fullDay:320, week:1400, fortnight:2600, month:4500 };

// ── Referentiels administrables (Chapitre 2) ─────────────────────────────────
const INITIAL_JOB_CATEGORIES = [
  "Opticien diplome", "Audioprothesiste", "Optometriste",
  "Vendeur en optique", "Assistant optique", "Secretaire", "Personnel administratif",
];

const INITIAL_SKILLS = [
  "Depistage entreprise", "FOYER", "Agent FOYER", "APEX",
  "ALEBA", "GLOBUS", "ONE LIFE", "SYMPASS",
];

const INITIAL_SECTORS = [
  "Luxembourg", "Lorraine", "Ardennes", "Alsace", "Grand Est",
  "Belgique", "France", "Multi-secteurs",
];

// ── Referentiels Partenaires (Chapitre 3) ────────────────────────────────────
const PARTNER_CATEGORIES = [
  "Magasin", "Entreprise", "Assureur", "Association",
  "Grand compte", "Reseau", "Partenaire institutionnel",
];

const INITIAL_PARTNERS = [
  { id:"p1",  name:"FOYER",          commercial:"FOYER Assurances",  category:"Assureur",   city:"Luxembourg",    country:"Luxembourg", phone:"+352 24 24 1",    email:"contact@foyer.lu",   contact:"Service RH",    comment:"Client entreprise principal", sites:["s1"],       status:"active" },
  { id:"p2",  name:"APEX",           commercial:"APEX Assurances",   category:"Assureur",   city:"Luxembourg",    country:"Luxembourg", phone:"+352 42 42 1",    email:"contact@apex.lu",    contact:"Direction",     comment:"",                            sites:["s2"],       status:"active" },
  { id:"p3",  name:"ALEBA",          commercial:"ALEBA",             category:"Association",city:"Luxembourg",    country:"Luxembourg", phone:"+352 48 48 1",    email:"contact@aleba.lu",   contact:"Secretariat",   comment:"Syndicat banque",             sites:["s3"],       status:"active" },
  { id:"p4",  name:"GLOBUS",         commercial:"Globus Luxembourg", category:"Grand compte",city:"Luxembourg",   country:"Luxembourg", phone:"+352 22 22 1",    email:"contact@globus.lu",  contact:"RH",            comment:"",                            sites:["s4"],       status:"active" },
  { id:"p5",  name:"ONE LIFE",       commercial:"One Life",          category:"Assureur",   city:"Luxembourg",    country:"Luxembourg", phone:"+352 26 26 1",    email:"info@onelife.eu",    contact:"Operations",    comment:"",                            sites:["s5"],       status:"active" },
  { id:"p6",  name:"Nancy CC",       commercial:"Krys Nancy CC",     category:"Magasin",    city:"Nancy",         country:"France",     phone:"+33 3 83 11 11",  email:"nancy-cc@krys.fr",   contact:"Responsable",   comment:"",                            sites:["s6"],       status:"active" },
  { id:"p7",  name:"Nancy centre",   commercial:"Krys Nancy centre", category:"Magasin",    city:"Nancy",         country:"France",     phone:"+33 3 83 22 22",  email:"nancy-ctr@krys.fr",  contact:"Responsable",   comment:"",                            sites:["s7"],       status:"active" },
  { id:"p8",  name:"Luxembourg",     commercial:"Krys Luxembourg",   category:"Magasin",    city:"Luxembourg",    country:"Luxembourg", phone:"+352 26 10 10",   email:"lux@krys.lu",        contact:"Responsable",   comment:"Site principal LU",           sites:["s8"],       status:"active" },
  { id:"p9",  name:"Reims",          commercial:"Krys Reims",        category:"Magasin",    city:"Reims",         country:"France",     phone:"+33 3 26 11 11",  email:"reims@krys.fr",      contact:"Responsable",   comment:"",                            sites:["s9"],       status:"active" },
  { id:"p10", name:"AGENT F",        commercial:"Agent FOYER",       category:"Reseau",     city:"Luxembourg",    country:"Luxembourg", phone:"",                email:"",                   contact:"",              comment:"Reseau agents FOYER",          sites:[],           status:"active" },
  { id:"p11", name:"PAM",            commercial:"PAM Nancy",          category:"Magasin",    city:"Nancy",         country:"France",     phone:"",                email:"pam@jcf.lu",         contact:"Responsable",   comment:"",                            sites:["s10"],      status:"active" },
  { id:"p12", name:"Mirecourt",      commercial:"Optique Mirecourt",  category:"Magasin",    city:"Mirecourt",     country:"France",     phone:"",                email:"mirecourt@jcf.lu",   contact:"Responsable",   comment:"",                            sites:["s11"],      status:"active" },
  { id:"p13", name:"Bazaine",        commercial:"Optique Bazaine",    category:"Magasin",    city:"Bazaine",       country:"France",     phone:"",                email:"bazaine@jcf.lu",     contact:"Responsable",   comment:"",                            sites:["s12"],      status:"active" },
  { id:"p14", name:"Jeuxey",         commercial:"Optique Jeuxey",     category:"Magasin",    city:"Jeuxey",        country:"France",     phone:"",                email:"jeuxey@jcf.lu",      contact:"Responsable",   comment:"",                            sites:["s13"],      status:"active" },
  { id:"p15", name:"Xertigny",       commercial:"Optique Xertigny",   category:"Magasin",    city:"Xertigny",      country:"France",     phone:"",                email:"xertigny@jcf.lu",    contact:"Responsable",   comment:"",                            sites:["s14"],      status:"active" },
  { id:"p16", name:"Betting",        commercial:"Optique Betting",    category:"Magasin",    city:"Betting",       country:"France",     phone:"",                email:"betting@jcf.lu",     contact:"Responsable",   comment:"",                            sites:["s15"],      status:"active" },
  { id:"p17", name:"Hettange-Grande",commercial:"Optique Hettange",   category:"Magasin",    city:"Hettange-Grande",country:"France",   phone:"",                email:"hettange@jcf.lu",    contact:"Responsable",   comment:"",                            sites:["s16"],      status:"active" },
  { id:"p18", name:"Clouange",       commercial:"Optique Clouange",   category:"Magasin",    city:"Clouange",      country:"France",     phone:"",                email:"clouange@jcf.lu",    contact:"Responsable",   comment:"",                            sites:["s17"],      status:"active" },
  { id:"p19", name:"Haguenau",       commercial:"Optique Haguenau",   category:"Magasin",    city:"Haguenau",      country:"France",     phone:"",                email:"haguenau@jcf.lu",    contact:"Responsable",   comment:"",                            sites:["s18"],      status:"active" },
  { id:"p20", name:"BIL",            commercial:"Banque BIL",         category:"Entreprise", city:"Luxembourg",    country:"Luxembourg", phone:"",                email:"bil@jcf.lu",         contact:"RH",            comment:"",                            sites:["s19"],      status:"active" },
  { id:"p21", name:"Raiffeisen",     commercial:"Banque Raiffeisen",  category:"Entreprise", city:"Luxembourg",    country:"Luxembourg", phone:"",                email:"raiffeisen@jcf.lu",  contact:"RH",            comment:"",                            sites:["s20"],      status:"active" },
  { id:"p22", name:"Post",           commercial:"Post Luxembourg",    category:"Entreprise", city:"Luxembourg",    country:"Luxembourg", phone:"",                email:"post@jcf.lu",        contact:"RH",            comment:"",                            sites:["s21"],      status:"active" },
];

const INITIAL_SITES = [
  { id:"s1", partnerId:"p1", name:"Siege FOYER",     address:"12 rue Leon Laval", city:"Luxembourg", country:"Luxembourg" },
  { id:"s2", partnerId:"p2", name:"Siege APEX",      address:"4 rue Albert Borschette", city:"Luxembourg", country:"Luxembourg" },
  { id:"s3", partnerId:"p3", name:"Siege ALEBA",     address:"2 rue de la Greve", city:"Luxembourg", country:"Luxembourg" },
  { id:"s4", partnerId:"p4", name:"Globus LU",       address:"22 bd Royal", city:"Luxembourg", country:"Luxembourg" },
  { id:"s5", partnerId:"p5", name:"One Life HQ",     address:"15 rue Edward Steichen", city:"Luxembourg", country:"Luxembourg" },
  { id:"s6", partnerId:"p6", name:"Nancy CC",        address:"Centre commercial St Sebastian", city:"Nancy", country:"France" },
  { id:"s7", partnerId:"p7", name:"Nancy centre",    address:"10 rue St Jean", city:"Nancy", country:"France" },
  { id:"s8", partnerId:"p8", name:"Luxembourg ville",address:"3 rue Philippe II", city:"Luxembourg", country:"Luxembourg" },
  { id:"s9",  partnerId:"p9",  name:"Reims centre",          address:"15 place Drouet d'Erlon", city:"Reims",           country:"France"      },
  { id:"s10", partnerId:"p11", name:"PAM Nancy",              address:"",                        city:"Nancy",           country:"France"      },
  { id:"s11", partnerId:"p12", name:"Optique Mirecourt",      address:"",                        city:"Mirecourt",       country:"France"      },
  { id:"s12", partnerId:"p13", name:"Optique Bazaine",        address:"",                        city:"Bazaine",         country:"France"      },
  { id:"s13", partnerId:"p14", name:"Optique Jeuxey",         address:"",                        city:"Jeuxey",          country:"France"      },
  { id:"s14", partnerId:"p15", name:"Optique Xertigny",       address:"",                        city:"Xertigny",        country:"France"      },
  { id:"s15", partnerId:"p16", name:"Optique Betting",        address:"",                        city:"Betting",         country:"France"      },
  { id:"s16", partnerId:"p17", name:"Optique Hettange-Grande",address:"",                        city:"Hettange-Grande", country:"France"      },
  { id:"s17", partnerId:"p18", name:"Optique Clouange",       address:"",                        city:"Clouange",        country:"France"      },
  { id:"s18", partnerId:"p19", name:"Optique Haguenau",       address:"",                        city:"Haguenau",        country:"France"      },
  { id:"s19", partnerId:"p20", name:"BIL Luxembourg",         address:"",                        city:"Luxembourg",      country:"Luxembourg"  },
  { id:"s20", partnerId:"p21", name:"Raiffeisen Luxembourg",  address:"",                        city:"Luxembourg",      country:"Luxembourg"  },
  { id:"s21", partnerId:"p22", name:"Post Luxembourg",        address:"",                        city:"Luxembourg",      country:"Luxembourg"  },
];

// ── Mises a disposition initiales (Chapitre 4) ───────────────────────────────
const INITIAL_MADS = [];


// Enrichissement des collaborateurs existants (Ch.2)
const COLLAB_EXTRA = {
  "c1":  { jobCategory:"Opticienne remplacante", skills:["FOYER","ALEBA"],              sector:"Moselle",     sectorAlt:"Luxembourg", country:"France",     phone:"", email:"margauxm@jcf.lu",  comment:"CDI 02/06/2025 · 28h · 145,60h CP", status:"active", contractDate:"2025-06-02", cpHours:145.6, noWorkDays:[] },
  "c2":  { jobCategory:"Opticien diplome",       skills:["APEX","Depistage entreprise"],sector:"Lorraine",    sectorAlt:"Luxembourg", country:"France",     phone:"", email:"benjamin@jcf.lu",  comment:"CDI 02/09/2024 · 37h (avenant) · 192,40h CP", status:"active", contractDate:"2024-09-02", cpHours:192.4, noWorkDays:[] },
  "c3":  { jobCategory:"Opticienne remplacante", skills:["FOYER","GLOBUS","APEX"],      sector:"Luxembourg",  sectorAlt:"Lorraine",   country:"Luxembourg", phone:"", email:"dozkhaz@jcf.lu",   comment:"CDI 01/12/2024 · 40h · 208h CP · Vehicule · +350/an x2", status:"active", contractDate:"2024-12-01", cpHours:208, noWorkDays:[] },
  "c4":  { jobCategory:"Opticienne",             skills:["ALEBA"],                      sector:"Lorraine",    sectorAlt:"Luxembourg", country:"France",     phone:"", email:"mathilde@jcf.lu",   comment:"CDI 01/07/2024 · 35h · 182h CP", status:"active", contractDate:"2024-07-01", cpHours:182, noWorkDays:[] },
  "c5":  { jobCategory:"Vendeuse remplacante",   skills:["APEX","FOYER"],               sector:"Grand Est",   sectorAlt:"Luxembourg", country:"France",     phone:"", email:"pauline@jcf.lu",    comment:"CDI 02/06/2025 · 40h · 26j CP · Vehicule · 15/j repas", status:"active", contractDate:"2025-06-02", cpHours:208.0, noWorkDays:[] },
  "c6":  { jobCategory:"Opticienne remplacante", skills:["ALEBA","Depistage entreprise"],sector:"Lorraine",   sectorAlt:"Luxembourg", country:"France",     phone:"", email:"lauras@jcf.lu",     comment:"CDI 20/06/2026 · 32h · 166,40h CP · Mercredi sur demande", status:"active", contractDate:"2026-06-20", cpHours:166.4, noWorkDays:[3] },
  "c7":  { jobCategory:"Opticienne remplacante", skills:["FOYER","ONE LIFE"],           sector:"Luxembourg",  sectorAlt:"Lorraine",   country:"France",     phone:"", email:"abbi@jcf.lu",       comment:"CDI 01/05/2026 · 32h · 166,40h CP · Mercredi sur demande", status:"active", contractDate:"2026-05-01", cpHours:166.4, noWorkDays:[3] },
  "c8":  { jobCategory:"Opticienne remplacante", skills:["ALEBA","FOYER"],              sector:"Luxembourg",  sectorAlt:"Lorraine",   country:"France",     phone:"", email:"margauxk@jcf.lu",   comment:"CDI 23/06/2026 · 40h · 208h CP", status:"active", contractDate:"2026-06-23", cpHours:208, noWorkDays:[] },
  "c9":  { jobCategory:"Opticienne remplacante", skills:["GLOBUS","Depistage entreprise"],sector:"Lorraine",  sectorAlt:"Luxembourg", country:"France",     phone:"", email:"laurag@jcf.lu",     comment:"CDI 01/06/2026 · 32h · 166,40h CP · Mercredi sur demande", status:"active", contractDate:"2026-06-01", cpHours:166.4, noWorkDays:[3] },
  "c10": { jobCategory:"Opticienne",             skills:["APEX","ONE LIFE"],            sector:"Grand Est",   sectorAlt:"Luxembourg", country:"France",     phone:"", email:"caroline@jcf.lu",    comment:"", status:"active", contractDate:"", cpHours:182, noWorkDays:[] },
  "c11": { jobCategory:"Opticienne Manager",     skills:["FOYER","GLOBUS","ONE LIFE"],  sector:"Luxembourg",  sectorAlt:"Lorraine",   country:"Luxembourg", phone:"", email:"juliew@jcf.lu",     comment:"CDI 05/08/2024 · 40h · 248h CP", status:"active", contractDate:"2024-08-05", cpHours:208.0, noWorkDays:[] },
  "c12": { jobCategory:"Vendeuse en optique",    skills:["FOYER","ALEBA"],              sector:"Luxembourg",  sectorAlt:"",           country:"Luxembourg", phone:"", email:"lucinda@jcf.lu",     comment:"", status:"active", contractDate:"", cpHours:166.4, noWorkDays:[] },
  "c13": { jobCategory:"Optometriste",           skills:["Depistage entreprise"],       sector:"Luxembourg",  sectorAlt:"",           country:"Luxembourg", phone:"", email:"valerie@jcf.lu",     comment:"CDI 01/10/2025 · 16h · 83,20h CP · Associee", status:"active", contractDate:"2025-10-01", cpHours:83.2, noWorkDays:[], special:"associate" },
  "c14": { jobCategory:"Responsable commercial", skills:["Depistage entreprise"],       sector:"Luxembourg",  sectorAlt:"",           country:"France",     phone:"", email:"guillaume@jcf.lu",    comment:"CDI 01/01/2026 · 16h/mois · 26j CP · 1200 net + 300 frais · Associe", status:"active", contractDate:"2026-01-01", cpHours:26, noWorkDays:[], special:"associate" },
  "c15": { jobCategory:"",                       skills:[],                             sector:"",            sectorAlt:"",           country:"Luxembourg", phone:"", email:"celineh@jcf.lu",     comment:"Profil a completer", status:"active", contractDate:"", cpHours:0, noWorkDays:[], special:"associate" },
};


// ── Convention comptes JCF OS ────────────────────────────────────────────────
// Admin        : admin@jcf.lu          / admin123
// Partenaires  : [ville]@jcf.lu        / store123   ex: luxembourg@jcf.lu
// Collaborateurs: [prenom]@jcf.lu      / remp123    ex: sophie@jcf.lu
// La convention est appliquee automatiquement a la creation.
// ─────────────────────────────────────────────────────────────────────────────

const STORE_PASSWORD = "store123";
const REMP_PASSWORD  = "remp123";

const USERS = [
  // Admin
  { id:"u1", name:"Jonathan",       role:"admin",       email:"admin@jcf.lu",       password:"admin123"      },

  // Partenaires — [ville]@jcf.lu / store123
  { id:"u2",  name:"Luxembourg",      role:"store", email:"luxembourg@jcf.lu",  password:STORE_PASSWORD, locationId:"l12" },
  { id:"u3",  name:"PAM",            role:"store", email:"pam@jcf.lu",         password:STORE_PASSWORD, locationId:"l1"  },
  { id:"u4",  name:"Nancy centre",   role:"store", email:"nancy@jcf.lu",       password:STORE_PASSWORD, locationId:"l2"  },
  { id:"u5",  name:"FOYER",          role:"store", email:"foyer@jcf.lu",       password:STORE_PASSWORD, locationId:"m4"  },
  { id:"u21", name:"Mirecourt",      role:"store", email:"mirecourt@jcf.lu",   password:STORE_PASSWORD, locationId:"l20" },
  { id:"u22", name:"Bazaine",        role:"store", email:"bazaine@jcf.lu",     password:STORE_PASSWORD, locationId:"l21" },
  { id:"u23", name:"Jeuxey",         role:"store", email:"jeuxey@jcf.lu",      password:STORE_PASSWORD, locationId:"l22" },
  { id:"u24", name:"Xertigny",       role:"store", email:"xertigny@jcf.lu",    password:STORE_PASSWORD, locationId:"l23" },
  { id:"u25", name:"Betting",        role:"store", email:"betting@jcf.lu",     password:STORE_PASSWORD, locationId:"l24" },
  { id:"u26", name:"Hettange",       role:"store", email:"hettange@jcf.lu",    password:STORE_PASSWORD, locationId:"l25" },
  { id:"u27", name:"Clouange",       role:"store", email:"clouange@jcf.lu",    password:STORE_PASSWORD, locationId:"l26" },
  { id:"u28", name:"Haguenau",       role:"store", email:"haguenau@jcf.lu",    password:STORE_PASSWORD, locationId:"l27" },
  { id:"u29", name:"BIL",            role:"store", email:"bil@jcf.lu",         password:STORE_PASSWORD, locationId:"m8"  },
  { id:"u30", name:"Raiffeisen",     role:"store", email:"raiffeisen@jcf.lu",  password:STORE_PASSWORD, locationId:"m9"  },
  { id:"u31", name:"Post",           role:"store", email:"post@jcf.lu",        password:STORE_PASSWORD, locationId:"m10" },
  { id:"u32", name:"Pulnoy",         role:"store", email:"pulnoy@jcf.lu",      password:STORE_PASSWORD, locationId:"l3"  },
  { id:"u33", name:"Ludres",         role:"store", email:"ludres@jcf.lu",      password:STORE_PASSWORD, locationId:"l4"  },
  { id:"u34", name:"Frouard",        role:"store", email:"frouard@jcf.lu",     password:STORE_PASSWORD, locationId:"l5"  },
  { id:"u35", name:"Bouxieres",      role:"store", email:"bouxieres@jcf.lu",   password:STORE_PASSWORD, locationId:"l6"  },
  { id:"u36", name:"St Avold",       role:"store", email:"stavold@jcf.lu",     password:STORE_PASSWORD, locationId:"l7"  },
  { id:"u37", name:"Faulquemont",    role:"store", email:"faulquemont@jcf.lu", password:STORE_PASSWORD, locationId:"l8"  },
  { id:"u38", name:"Longeville",     role:"store", email:"longeville@jcf.lu",  password:STORE_PASSWORD, locationId:"l9"  },
  { id:"u39", name:"Fameck",         role:"store", email:"fameck@jcf.lu",      password:STORE_PASSWORD, locationId:"l10" },
  { id:"u40", name:"Hagondange",     role:"store", email:"hagondange@jcf.lu",  password:STORE_PASSWORD, locationId:"l11" },
  { id:"u41", name:"Revin",          role:"store", email:"revin@jcf.lu",       password:STORE_PASSWORD, locationId:"l13" },
  { id:"u42", name:"Givet",          role:"store", email:"givet@jcf.lu",       password:STORE_PASSWORD, locationId:"l14" },
  { id:"u43", name:"Sedan",          role:"store", email:"sedan@jcf.lu",       password:STORE_PASSWORD, locationId:"l15" },
  { id:"u44", name:"Rethel",         role:"store", email:"rethel@jcf.lu",      password:STORE_PASSWORD, locationId:"l16" },
  { id:"u45", name:"Reims",          role:"store", email:"reims@jcf.lu",       password:STORE_PASSWORD, locationId:"l17" },
  { id:"u46", name:"Epinal",         role:"store", email:"epinal@jcf.lu",      password:STORE_PASSWORD, locationId:"l18" },
  { id:"u47", name:"Charmes",        role:"store", email:"charmes@jcf.lu",     password:STORE_PASSWORD, locationId:"l19" },
  { id:"u48", name:"APEX",           role:"store", email:"apex@jcf.lu",        password:STORE_PASSWORD, locationId:"m3"  },
  { id:"u49", name:"ALEBA",          role:"store", email:"aleba@jcf.lu",       password:STORE_PASSWORD, locationId:"m2"  },
  { id:"u50", name:"GLOBUS",         role:"store", email:"globus@jcf.lu",      password:STORE_PASSWORD, locationId:"m5"  },
  { id:"u51", name:"ONE LIFE",       role:"store", email:"onelife@jcf.lu",     password:STORE_PASSWORD, locationId:"m6"  },

  // Collaborateurs — [prenom]@jcf.lu / remp123
  { id:"u6",  name:"Margaux M",  role:"replacement", email:"margauxm@jcf.lu",  password:REMP_PASSWORD, collaboratorId:"c1"  },
  { id:"u7",  name:"Benjamin",   role:"replacement", email:"benjamin@jcf.lu",  password:REMP_PASSWORD, collaboratorId:"c2"  },
  { id:"u8",  name:"Dozkhaz",    role:"replacement", email:"dozkhaz@jcf.lu",   password:REMP_PASSWORD, collaboratorId:"c3"  },
  { id:"u9",  name:"Mathilde",   role:"replacement", email:"mathilde@jcf.lu",  password:REMP_PASSWORD, collaboratorId:"c4"  },
  { id:"u10", name:"Pauline",    role:"replacement", email:"pauline@jcf.lu",   password:REMP_PASSWORD, collaboratorId:"c5"  },
  { id:"u11", name:"Laura S",    role:"replacement", email:"lauras@jcf.lu",    password:REMP_PASSWORD, collaboratorId:"c6"  },
  { id:"u12", name:"ABBI",       role:"replacement", email:"abbi@jcf.lu",      password:REMP_PASSWORD, collaboratorId:"c7"  },
  { id:"u13", name:"Margaux K",  role:"replacement", email:"margauxk@jcf.lu",  password:REMP_PASSWORD, collaboratorId:"c8"  },
  { id:"u14", name:"Laura G",    role:"replacement", email:"laurag@jcf.lu",    password:REMP_PASSWORD, collaboratorId:"c9"  },
  { id:"u15", name:"Caroline",   role:"replacement", email:"caroline@jcf.lu",  password:REMP_PASSWORD, collaboratorId:"c10" },
  { id:"u16", name:"Julie W",    role:"replacement", email:"juliew@jcf.lu",    password:REMP_PASSWORD, collaboratorId:"c11" },
  { id:"u17", name:"Lucinda",    role:"replacement", email:"lucinda@jcf.lu",   password:REMP_PASSWORD, collaboratorId:"c12" },
  { id:"u18", name:"Valerie",    role:"replacement", email:"valerie@jcf.lu",   password:REMP_PASSWORD, collaboratorId:"c13" },
  { id:"u19", name:"Guillaume",  role:"replacement", email:"guillaume@jcf.lu", password:REMP_PASSWORD, collaboratorId:"c14" },
  { id:"u20", name:"Celine H",   role:"replacement", email:"celineh@jcf.lu",   password:REMP_PASSWORD, collaboratorId:"c15" },
];

// Genere automatiquement un compte partenaire selon la convention
// Usage : generateStoreUser("reims", "l17", existingUsers.length)
function generateStoreUser(ville, locationId, index) {
  return {
    id:         "u" + (index + 1),
    name:       ville.charAt(0).toUpperCase() + ville.slice(1),
    role:       "store",
    email:      ville.toLowerCase().replace(/\s+/g,"")+"@jcf.lu",
    password:   STORE_PASSWORD,
    locationId: locationId,
  };
}

const TODAY = new Date().toISOString().split("T")[0];
const WEEK_DAYS = [
  { date:"2026-06-09", label:"Lun 9"  }, { date:"2026-06-10", label:"Mar 10" },
  { date:"2026-06-11", label:"Mer 11" }, { date:"2026-06-12", label:"Jeu 12" },
  { date:"2026-06-13", label:"Ven 13" }, { date:"2026-06-14", label:"Sam 14" },
  { date:"2026-06-15", label:"Dim 15" },
];
const DAY_NAMES   = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const MONTH_NAMES = ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];

const COMMERCIAL_TYPES = [
  { id:"day",       label:"Journee",   sub:"8h bloquees"     },
  { id:"week",      label:"Semaine",   sub:"5 jours ouvres"  },
  { id:"fortnight", label:"Quinzaine", sub:"10 jours ouvres" },
  { id:"month",     label:"Mois",      sub:"Mois complet"    },
];
const EXTRA_HOURS_OPTIONS = [0, 2, 4, 8];

// ─── Génération des données de demo ──────────────────────────────────────────
function generateAssignments() {
  return [];
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────
function getLocName(id) {
  if (!id) return "-";
  const l = ALL_LOCATIONS.find(x => x.id === id);
  if (l) return l.name;
  const a = ABSENCE_TYPES.find(x => x.id === id);
  return a ? a.name : id;
}
function isMission(id) { return MISSIONS.some(m => m.id === id); }
function isWorkType(t)  { return t === "work"; }
function absStyle(t) {
  const a = ABSENCE_TYPES.find(x => x.id === t);
  return a ? { color:a.textColor, bg:a.bg, border:a.color } : { color:"#6B7280", bg:"#F9FAFB", border:"#9CA3AF" };
}
function calcHours(arr) { return arr.filter(a => isWorkType(a.typeId)).reduce((s,a) => s+a.hours, 0); }
function estimateRate(h) { if (h<=0) return 0; if (h<=4) return RATES.halfDay; if (h<=8) return Math.round(h*RATES.hourly); return Math.round(h*RATES.hourly*0.95); }
function fmtEur(n) { return Number(n).toLocaleString("fr-FR") + " \u20AC"; }
function fmtDateFR(ds) {
  if (!ds) return "-";
  const d = new Date(ds + "T12:00:00");
  return DAY_NAMES[d.getDay()] + " " + d.getDate() + " " + MONTH_NAMES[d.getMonth()] + " " + d.getFullYear();
}
let _nextId = 5000;
function newId() { return "ax" + (_nextId++); }

function buildDateRange(s, e) {
  const dates = []; const c = new Date(s + "T12:00:00"); const end = new Date(e + "T12:00:00");
  let safety = 0;
  while (c <= end && safety < 500) {
    safety++;
    const dow = c.getDay();
    if (dow !== 0 && dow !== 6) dates.push(c.toISOString().split("T")[0]);
    c.setDate(c.getDate()+1);
  }
  return dates;
}
function calcEndDate(s, t) {
  if (t === "day") return s;
  // Semaine = 5 jours ouvres (lun-ven), Quinzaine = 10 jours ouvres, Mois = 22 jours ouvres
  const tgt = { week:5, fortnight:10, month:22 }[t] || 5;
  const c = new Date(s + "T12:00:00"); let n = 0;
  let safety = 0;
  while (safety < 500) {
    safety++;
    const dow = c.getDay();
    if (dow !== 0 && dow !== 6) { n++; if (n >= tgt) return c.toISOString().split("T")[0]; }
    c.setDate(c.getDate()+1);
  }
  return s; // fallback
}

function calcTotalRate(rt, days, cId, rates) {
  const r = (rates || INITIAL_RATES)[cId];
  if (!r) { return rt==="day"?RATES.fullDay : rt==="week"?RATES.week : rt==="fortnight"?RATES.fortnight : rt==="month"?RATES.month : Math.round(days*RATES.fullDay*0.9); }
  if (rt==="day") return r.day; if (rt==="week") return r.week; if (rt==="fortnight") return r.fortnight; if (rt==="month") return r.month;
  if (days>=20) return r.month; if (days>=10) return r.fortnight; if (days>=5) return r.week; return Math.round(days*r.day);
}
function estCollab(cId, h, rates, bookingType) {
  const r = (rates || INITIAL_RATES)[cId];
  if (!r) return estimateRate(h);
  if (h <= 0) return 0;
  if (bookingType === "week")      return r.week      || Math.round(r.hourly * r.weeklyHours);
  if (bookingType === "fortnight") return r.fortnight || Math.round(r.week * 2);
  if (bookingType === "month")     return r.month     || Math.round(r.week * 4.33);
  return Math.round(r.hourly * h);
}

// Budget total d'un assignment (collab + hotel + repas)
// periodCost est le cout total de la periode stocke sur le 1er jour uniquement
// Pour les jours 2-5, periodCost=0 → on ne calcule que les frais annexes
function budgetAssignment(a, rates) {
  if (a.periodCost !== undefined) {
    return (a.periodCost||0) + (a.hotelCost||0) + (a.repasCost||0) + (a.ouvertureCost||0);
  }
  // Pas de periodCost (vieilles affectations) : calcul horaire normal
  const collabPart = estCollab(a.collaboratorId, a.hours, rates, a.bookingType);
  return collabPart + (a.hotelCost||0) + (a.repasCost||0);
}
function calcCommercialCost(cId, bt, extra, rates) {
  const r = (rates || INITIAL_RATES)[cId]; if (!r) return 0;
  let base = 0;
  if (bt==="day") base=r.day; if (bt==="week") base=r.week; if (bt==="fortnight") base=r.fortnight; if (bt==="month") base=r.month;
  return base + ((extra||0) * r.hourly);
}
function calcBlockedHours(c, bt, extra) {
  const x = extra || 0;
  if (bt==="day") return 8+x; if (bt==="week") return (c.weeklyHours||35)+x;
  if (bt==="fortnight") return ((c.weeklyHours||35)*2)+x; if (bt==="month") return (c.contract||0)+x;
  return x;
}
// Retourne le collaborateur avec ses surcharges editees (contrat, heures hebdo)
function effectiveCollab(c, collabExtras) {
  const ex = (collabExtras||COLLAB_EXTRA)[c.id] || {};
  return {
    ...c,
    contract:    ex.contract    !== undefined ? ex.contract    : c.contract,
    weeklyHours: ex.weeklyHours !== undefined ? ex.weeklyHours : c.weeklyHours,
  };
}

// ════════════════════════════════════════════════════════════
// APP ROOT
// ════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser]               = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fonction centralisée de chargement
  const loadAllData = async (showLoading) => {
    if (showLoading) setLoading(true);
    try {
      const [asgRows, madRows, cpRows, cssRows] = await Promise.all([
        supaFetch("assignments", "GET", null, "order=date.asc"),
        supaFetch("mads", "GET", null, "order=created_at.desc"),
        supaFetch("cp_requests", "GET", null, "type=eq.cp&order=created_at.desc"),
        supaFetch("cp_requests", "GET", null, "type=eq.css&order=created_at.desc"),
      ]);
      if (asgRows && Array.isArray(asgRows))  setAssignments(asgRows.map(rowToAsg));
      if (madRows && Array.isArray(madRows))  setMads(madRows.map(rowToMad));
      if (cpRows  && Array.isArray(cpRows))   setCpRequests(cpRows.map(rowToCp));
      if (cssRows && Array.isArray(cssRows))  setCssRequests(cssRows.map(rowToCp));
    } catch(e) { console.error("Supabase load error:", e); }
    finally { if (showLoading) setLoading(false); }
  };

  useEffect(() => {
    loadAllData(true);
    // Rechargement auto toutes les 60 secondes
    const interval = setInterval(() => loadAllData(false), 60000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => loadAllData(false);
  const [rates, setRates]             = useState(INITIAL_RATES);
  // Donnees editables — etat React propagé partout
  const [dynCollaborators, setDynCollaborators] = useState(COLLABORATORS);
  const [collabExtras, setCollabExtras] = useState(COLLAB_EXTRA);
  const [partners,     setPartners]     = useState(INITIAL_PARTNERS);
  // Mises a disposition (Ch.4)
  const [mads, setMads] = useState(INITIAL_MADS);
  const addMad = async (m) => {
    const entry = { ...m, id:"JCF-MAD-"+String(Date.now()).slice(-6) };
    setMads(p => [...p, entry]);
    try { await supaFetch("mads", "POST", madToRow(entry)); } catch(e) {}
  };
  const updateMad = async (id, ch) => {
    setMads(p => p.map(m => m.id===id ? { ...m, ...ch } : m));
    try { await supaFetch("mads", "PATCH", madToRow({id,...ch}), "id=eq."+id); } catch(e) {}
  };
  const [cpRequests, setCpRequests] = useState([]);
  const addCpRequest = async (req) => {
    const entry = { ...req, id:"cp-"+Date.now() };
    setCpRequests(p => [...p, entry]);
    try { await supaFetch("cp_requests", "POST", cpToRow(entry)); } catch(e) {}
  };
  const validateCpRequest = async (id) => {
    const req = cpRequests.find(r => r.id===id); if (!req) return;
    for (const ds of req.dates) await addAssignment({ collaboratorId:req.collaboratorId, date:ds, locationId:"cp", typeId:"cp", hours:8 });
    setCpRequests(p => p.map(r => r.id===id ? { ...r, status:"approved" } : r));
    try { await supaFetch("cp_requests", "PATCH", { status:"approved" }, "id=eq."+id); } catch(e) {}
  };
  const refuseCpRequest = async (id) => {
    setCpRequests(p => p.map(r => r.id===id ? { ...r, status:"refused" } : r));
    try { await supaFetch("cp_requests", "PATCH", { status:"refused" }, "id=eq."+id); } catch(e) {}
  };

  const [cssRequests, setCssRequests] = useState([]);
  const addCssRequest = async (req) => {
    const entry = { ...req, id:"css-"+Date.now(), type:"css" };
    setCssRequests(p => [...p, entry]);
    try { await supaFetch("cp_requests", "POST", cpToRow(entry)); } catch(e) {}
  };
  const validateCssRequest = async (id) => {
    const req = cssRequests.find(r => r.id===id); if (!req) return;
    for (const ds of req.dates) await addAssignment({ collaboratorId:req.collaboratorId, date:ds, locationId:"css", typeId:"css", hours:8 });
    setCssRequests(p => p.map(r => r.id===id ? { ...r, status:"approved" } : r));
    try { await supaFetch("cp_requests", "PATCH", { status:"approved" }, "id=eq."+id); } catch(e) {}
  };
  const refuseCssRequest = async (id) => {
    setCssRequests(p => p.map(r => r.id===id ? { ...r, status:"refused" } : r));
    try { await supaFetch("cp_requests", "PATCH", { status:"refused" }, "id=eq."+id); } catch(e) {}
  };

  const addAssignment = async (a) => {
    const entry = { ...a, id: newId() };
    setAssignments(p => [...p, entry]);
    try {
      await supaFetch("assignments", "POST", asgToRow(entry));
    } catch(e) { console.error("addAssignment error:", e); }
  };
  const updateAssignment = async (id, ch) => {
    setAssignments(p => p.map(a => a.id===id ? { ...a, ...ch } : a));
    try { await supaFetch("assignments", "PATCH", asgToRow({id,...ch}), "id=eq."+id); } catch(e) {}
  };
  const deleteAssignment = async (id) => {
    setAssignments(p => p.filter(a => a.id !== id));
    try { await supaFetch("assignments", "DELETE", null, "id=eq."+id); } catch(e) {}
  };
  const updateRate       = (cId, field, val) => setRates(p => ({ ...p, [cId]: { ...p[cId], [field]: parseFloat(val)||0 } }));

  // Mise a jour d'un champ extra collaborateur
  // weeklyHours modifie → recalcul proportionnel des tarifs
  const updateCollabExtra = (cId, field, val) => {
    setCollabExtras(p => ({ ...p, [cId]: { ...p[cId], [field]: val } }));
    if (field === "weeklyHours") {
      const newW = parseInt(val) || 0;
      setRates(prev => {
        const r = prev[cId]; if (!r || !r.weeklyHours || newW === 0) return prev;
        const ratio = newW / r.weeklyHours;
        return { ...prev, [cId]: {
          ...r,
          weeklyHours:    newW,
          hourly:         Math.round(r.hourly         * ratio * 100) / 100,
          day:            Math.round(r.day             * ratio * 100) / 100,
          week:           Math.round(r.week            * ratio * 100) / 100,
          fortnight:      Math.round(r.fortnight       * ratio * 100) / 100,
          minimumMonthly: Math.round(r.minimumMonthly  * ratio * 100) / 100,
          month:          Math.round(r.month           * ratio * 100) / 100,
        }};
      });
    }
    if (field === "contract") {
      const newC = parseInt(val) || 0;
      setRates(prev => {
        const r = prev[cId];
        const baseC = COLLABORATORS.find(c=>c.id===cId)?.contract || 168;
        if (!r || !baseC || newC === 0) return prev;
        const ratio = newC / baseC;
        return { ...prev, [cId]: {
          ...r,
          month:          Math.round(INITIAL_RATES[cId]?.month          * ratio * 100) / 100,
          minimumMonthly: Math.round(INITIAL_RATES[cId]?.minimumMonthly * ratio * 100) / 100,
        }};
      });
    }
  };

  // Ajout d'un nouveau collaborateur dans le state
  const [dynUsers, setDynUsers] = useState(USERS);
  const addCollaborator = (collab, extra, rateData) => {
    setDynCollaborators(p => [...p, collab]);
    setCollabExtras(p => ({ ...p, [collab.id]: extra }));
    setRates(p => ({ ...p, [collab.id]: rateData }));
    setDynUsers(p => [...p, { id:"u-"+Date.now(), name:collab.name, role:"replacement", email:extra.email, password:"remp123", collaboratorId:collab.id }]);
  };

  // Mise a jour d'un champ partenaire
  const updatePartner = (pId, field, val) =>
    setPartners(p => p.map(x => x.id===pId ? { ...x, [field]: val } : x));

  if (loading) {
    return (
      <div style={{ minHeight:"100dvh", background:"#1E2F4F", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:32, marginBottom:16 }}>⏳</div>
        <div style={{ color:"#D4AF37", fontSize:16, fontWeight:700 }}>Chargement JCF OS...</div>
        <div style={{ color:"rgba(255,255,255,.4)", fontSize:12, marginTop:8 }}>Connexion base de donnees</div>
      </div>
    );
  }

  if (!user) {
    return (<LoginScreen onLogin={setUser} dynUsers={dynUsers} />);
  }

  const props = { assignments, addAssignment, updateAssignment, deleteAssignment, rates, collabExtras, updateCollabExtra, partners, updatePartner, mads, addMad, updateMad, dynCollaborators, addCollaborator };

  if (user.role === "admin")       return (<AdminSpace       user={user} onLogout={() => setUser(null)} {...props} updateRate={updateRate} cpRequests={cpRequests} validateCpRequest={validateCpRequest} refuseCpRequest={refuseCpRequest} cssRequests={cssRequests} validateCssRequest={validateCssRequest} refuseCssRequest={refuseCssRequest} />);
  if (user.role === "store")       return (<StoreSpace       user={user} onLogout={() => setUser(null)} {...props} onRefresh={refreshData} />);
  if (user.role === "replacement") return (<ReplacementSpace user={user} onLogout={() => setUser(null)} {...props} addCpRequest={addCpRequest} cpRequests={cpRequests} addCssRequest={addCssRequest} cssRequests={cssRequests} />);
  return null;
}

// ════════════════════════════════════════════════════════════
// CHAPITRE 0 — Vision & Philosophie
// ════════════════════════════════════════════════════════════
function Chapter0({ onDone }) {
  const [page, setPage] = useState(0);

  const slides = [
    {
      tag:     "Chapitre 0",
      title:   "Vision & Philosophie",
      body:    "JCF OS est l'outil operationnel central de JCF Luxtalent.\n\nConcu pour simplifier le pilotage quotidien, proteger la rentabilite et reduire la charge mentale de son dirigeant.\n\nCe n'est pas un ERP generaliste.\nC'est un systeme metier construit pour JCF Luxtalent.",
      badge:   "\u{1F7E2} VALIDE V1",
    },
    {
      tag:     "Mission",
      title:   "Piloter simplement",
      body:    "Collaborateurs · Partenaires · Mises a disposition · Missions · Disponibilites · Heures · Estimations tarifaires · Alertes operationnelles.\n\nChaque fonctionnalite a une utilite metier concrete.",
    },
    {
      tag:     "Philosophie",
      title:   "La complexite est invisible.",
      body:    "Toute la complexite metier est absorbee par le logiciel.\n\nL'utilisateur ne voit que les informations utiles a sa decision.\n\nToute fonctionnalite qui complexifie inutilement l'experience doit etre simplifiee ou supprimee.",
      quote:   true,
    },
    {
      tag:     "Business",
      title:   "Une mise a disposition, pas des heures.",
      body:    "JCF Luxtalent ne vend pas des heures.\n\nJCF Luxtalent met a disposition des professionnels qualifies sur une periode determinee.\n\nToute evolution du logiciel respecte cette logique metier.",
    },
    {
      tag:     "Priorites produit",
      title:   "Dans cet ordre.",
      body:    "1. Simplicite\n2. Robustesse metier\n3. Protection de la rentabilite\n4. Rapidite d'utilisation\n5. Qualite de l'experience",
      numbered: true,
    },
    {
      tag:     "Marque",
      title:   "JCF Luxtalent en premier.",
      body:    "La marque mise en avant est JCF Luxtalent.\n\nLorsqu'un collaborateur est presente a un partenaire, la mention privilegiee est :\n\n« Selectionne par JCF Luxtalent »\n\nsans CV, sans historique, sans biais de selection.",
    },
    {
      tag:     "Mesure du succes",
      title:   "Pas le nombre de fonctionnalites.",
      body:    "Le succes de JCF OS se mesure au temps gagne, a la simplicite d'utilisation, a la qualite des decisions facilitees et a la diminution de la charge mentale.",
    },
    {
      tag:     "Regle fondatrice",
      title:   "Une seule question.",
      body:    "Avant toute evolution, une seule question doit etre posee :\n\n« Cette fonctionnalite rend-elle reellement la vie de l'utilisateur plus simple ? »\n\nSi la reponse est non, elle n'est pas integree en V1.",
      quote:   true,
      last:    true,
    },
  ];

  const slide = slides[page];
  const isLast = page === slides.length - 1;

  return (
    <div style={{ minHeight:"100dvh", background:"#1E2F4F", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", fontFamily:"Inter,system-ui,sans-serif" }}>
      <style>{CSS}</style>

      {/* Progress bar */}
      <div style={{ height:3, background:"rgba(255,255,255,.12)", flexShrink:0 }}>
        <div style={{ height:"100%", width:((page+1)/slides.length*100)+"%", background:"#D4AF37", transition:"width .4s ease" }} />
      </div>

      {/* Header */}
      <div style={{ padding:"20px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="jcf-brand" style={{ fontWeight:700, fontSize:12, color:"#1E2F4F", letterSpacing:"1px" }}>JCF</span>
          </div>
          <span style={{ fontWeight:800, fontSize:14, color:"#D4AF37", letterSpacing:"-0.3px" }}>OS</span>
        </div>
        <button
          onClick={onDone}
          style={{ background:"rgba(255,255,255,.1)", border:"none", borderRadius:8, padding:"6px 14px", color:"rgba(255,255,255,.5)", fontSize:12, cursor:"pointer" }}
        >
          Passer
        </button>
      </div>

      {/* Slide content */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"32px 24px" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#D4AF37", letterSpacing:"1px", textTransform:"uppercase", marginBottom:16 }}>
          {slide.tag}
        </div>

        <h1 style={{ fontSize:slide.quote ? 22 : 26, fontWeight:800, color:"#ffffff", margin:"0 0 20px", lineHeight:1.25, letterSpacing:"-0.5px" }}>
          {slide.title}
        </h1>

        <div style={{ fontSize:15, color:"rgba(255,255,255,.65)", lineHeight:1.75 }}>
          {slide.body.split("\n").map((line, i) => (
            <div key={i} style={{ marginBottom: line === "" ? 8 : 0 }}>
              {line === "" ? "\u00A0" : line}
            </div>
          ))}
        </div>

        {slide.badge && (
          <div style={{ marginTop:24, display:"inline-flex", alignItems:"center", gap:8, background:"rgba(212,175,55,.15)", border:"1px solid rgba(212,175,55,.3)", borderRadius:8, padding:"8px 14px", alignSelf:"flex-start" }}>
            <span style={{ fontSize:12, color:"#D4AF37", fontWeight:600 }}>{slide.badge}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ padding:"0 24px 36px", display:"flex", flexDirection:"column", gap:12, flexShrink:0 }}>
        {/* Dots */}
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:4 }}>
          {slides.map((_, i) => (
            <div
              key={i}
              style={{ width: i===page ? 20 : 6, height:6, borderRadius:3, background: i===page ? "#D4AF37" : "rgba(255,255,255,.2)", transition:"width .3s, background .3s", cursor:"pointer" }}
              onClick={() => setPage(i)}
            />
          ))}
        </div>

        <div style={{ display:"flex", gap:10 }}>
          {page > 0 && (
            <button
              onClick={() => setPage(p => p-1)}
              style={{ flex:1, background:"rgba(255,255,255,.1)", border:"none", borderRadius:12, padding:"14px", fontWeight:600, fontSize:14, color:"rgba(255,255,255,.7)", cursor:"pointer" }}
            >
              Precedent
            </button>
          )}
          <button
            onClick={() => isLast ? onDone() : setPage(p => p+1)}
            style={{ flex:2, background:"#D4AF37", border:"none", borderRadius:12, padding:"14px", fontWeight:700, fontSize:14, color:"#1E2F4F", cursor:"pointer" }}
          >
            {isLast ? "Acceder a JCF OS" : "Suivant"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════
// CHAPITRE 1 — Architecture & Identifiants techniques
// ════════════════════════════════════════════════════════════
function Chapter1({ onDone }) {
  const [page, setPage] = useState(0);

  const slides = [
    {
      tag:   "Chapitre 1",
      title: "Architecture & Identifiants techniques",
      body:  "JCF OS repose sur une architecture stable, evolutive et perenne.\n\nChaque objet metier possede un identifiant interne unique garantissant l'integrite des donnees, la coherence entre modules et l'evolutivite future du systeme.",
      badge: "\uD83D\uDFE2 VALIDE V1",
    },
    {
      tag:   "Principe fondamental",
      title: "Un identifiant unique, permanent, invariable.",
      body:  "Chaque objet cree dans JCF OS recoit automatiquement un identifiant interne :\n\n· Unique\n· Permanent et invariable\n· Genere automatiquement\n· Independant de toute donnee personnelle\n· Non modifiable par les utilisateurs",
    },
    {
      tag:   "Referentiels V1",
      title: "Les 5 objets identifies.",
      ids:   true,
    },
    {
      tag:   "Regle de stabilite",
      title: "Un identifiant ne change jamais.",
      body:  "Il est conserve meme en cas de :\n\n· Changement de nom ou prenom\n· Changement d'e-mail\n· Changement de contrat ou de fonction\n· Depart puis retour dans l'entreprise\n\nL'historique reste ainsi parfaitement coherent.",
    },
    {
      tag:   "Visibilite",
      title: "Reserve a l'usage interne.",
      body:  "Par defaut, les identifiants internes ne sont jamais affiches aux partenaires.\n\nIls restent exclusivement reserves au fonctionnement interne de JCF OS et aux outils d'administration.",
    },
    {
      tag:   "Evolutivite",
      title: "Convention ouverte sur l'avenir.",
      body:  "Toute nouvelle entite creee dans JCF OS respectera cette convention.\n\nExemples futurs :\n\n· JCF-INV-000001 (facture)\n· JCF-CLI-000001 (client)\n· JCF-DOC-000001 (document)\n· JCF-EVT-000001 (evenement)",
      last:  true,
    },
  ];

  const ID_REFS = [
    { prefix:"JCF-COL-000001", label:"Collaborateur" },
    { prefix:"JCF-PAR-000001", label:"Partenaire"    },
    { prefix:"JCF-SIT-000001", label:"Site"           },
    { prefix:"JCF-MIS-000001", label:"Mission"        },
    { prefix:"JCF-MAD-000001", label:"Mise a dispo"   },
  ];

  const slide  = slides[page];
  const isLast = page === slides.length - 1;

  return (
    <div style={{ minHeight:"100dvh", background:"#1E2F4F", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", fontFamily:"Inter,system-ui,sans-serif" }}>
      <style>{CSS}</style>

      {/* Progress */}
      <div style={{ height:3, background:"rgba(255,255,255,.12)", flexShrink:0 }}>
        <div style={{ height:"100%", width:((page+1)/slides.length*100)+"%", background:"#D4AF37", transition:"width .4s ease" }} />
      </div>

      {/* Header */}
      <div style={{ padding:"20px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="jcf-brand" style={{ fontWeight:700, fontSize:12, color:"#1E2F4F", letterSpacing:"1px" }}>JCF</span>
          </div>
          <span style={{ fontWeight:800, fontSize:14, color:"#D4AF37", letterSpacing:"-0.3px" }}>OS · Ch.1</span>
        </div>
        <button onClick={onDone} style={{ background:"rgba(255,255,255,.1)", border:"none", borderRadius:8, padding:"6px 14px", color:"rgba(255,255,255,.5)", fontSize:12, cursor:"pointer" }}>
          Passer
        </button>
      </div>

      {/* Contenu */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"32px 24px" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#D4AF37", letterSpacing:"1px", textTransform:"uppercase", marginBottom:16 }}>
          {slide.tag}
        </div>

        <h1 style={{ fontSize:24, fontWeight:800, color:"#ffffff", margin:"0 0 20px", lineHeight:1.25, letterSpacing:"-0.5px" }}>
          {slide.title}
        </h1>

        {slide.body && (
          <div style={{ fontSize:15, color:"rgba(255,255,255,.65)", lineHeight:1.75 }}>
            {slide.body.split("\n").map((line, i) => (
              <div key={i} style={{ marginBottom: line === "" ? 8 : 0 }}>
                {line === "" ? "\u00A0" : line}
              </div>
            ))}
          </div>
        )}

        {slide.ids && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {ID_REFS.map(ref => (
              <div key={ref.prefix} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,.07)", borderRadius:10, padding:"12px 14px", border:"1px solid rgba(255,255,255,.1)" }}>
                <span style={{ fontSize:11, color:"rgba(255,255,255,.5)" }}>{ref.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:"#D4AF37", fontFamily:"monospace", letterSpacing:"0.5px" }}>{ref.prefix}</span>
              </div>
            ))}
          </div>
        )}

        {slide.badge && (
          <div style={{ marginTop:24, display:"inline-flex", alignItems:"center", gap:8, background:"rgba(212,175,55,.15)", border:"1px solid rgba(212,175,55,.3)", borderRadius:8, padding:"8px 14px", alignSelf:"flex-start" }}>
            <span style={{ fontSize:12, color:"#D4AF37", fontWeight:600 }}>{slide.badge}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ padding:"0 24px 36px", display:"flex", flexDirection:"column", gap:12, flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:4 }}>
          {slides.map((_, i) => (
            <div key={i}
              style={{ width: i===page ? 20 : 6, height:6, borderRadius:3, background: i===page ? "#D4AF37" : "rgba(255,255,255,.2)", transition:"width .3s, background .3s", cursor:"pointer" }}
              onClick={() => setPage(i)}
            />
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {page > 0 && (
            <button onClick={() => setPage(p => p-1)}
              style={{ flex:1, background:"rgba(255,255,255,.1)", border:"none", borderRadius:12, padding:"14px", fontWeight:600, fontSize:14, color:"rgba(255,255,255,.7)", cursor:"pointer" }}>
              Precedent
            </button>
          )}
          <button onClick={() => isLast ? onDone() : setPage(p => p+1)}
            style={{ flex:2, background:"#D4AF37", border:"none", borderRadius:12, padding:"14px", fontWeight:700, fontSize:14, color:"#1E2F4F", cursor:"pointer" }}>
            {isLast ? "Acceder a JCF OS" : "Suivant"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CHAPITRE 2 — Collaborateurs
// ════════════════════════════════════════════════════════════
function Chapter2({ onDone }) {
  const [page, setPage] = useState(0);

  const slides = [
    {
      tag:   "Chapitre 2",
      title: "Collaborateurs",
      body:  "Le module Collaborateurs est le referentiel humain unique de JCF OS.\n\nToutes les fonctionnalites reposent sur cette base : planning, mises a disposition, missions, disponibilites, statistiques et historique.",
      badge: "\uD83D\uDFE2 VALIDE V1",
    },
    {
      tag:   "Creation",
      title: "Une fiche. Un identifiant. Une reference.",
      body:  "L'administrateur peut creer un collaborateur a tout moment.\n\nJCF OS genere automatiquement son identifiant interne :\n\nJCF-COL-000001\n\nCet identifiant devient sa reference definitive.",
    },
    {
      tag:   "Informations",
      title: "La fiche collaborateur.",
      fields: true,
    },
    {
      tag:   "Categorie metier",
      title: "Entierement administrable.",
      body:  "Chaque collaborateur appartient a une categorie metier :\n\n· Opticien diplome\n· Audioprothesiste\n· Optometriste\n· Vendeur en optique\n· Assistant optique\n· Secretaire\n· Personnel administratif\n\nL'ajout d'une categorie ne necessite aucun developpement.",
    },
    {
      tag:   "Competences",
      title: "Independantes de la categorie.",
      body:  "Chaque collaborateur peut avoir des competences specifiques :\n\n· Depistage entreprise\n· FOYER · APEX · ALEBA\n· GLOBUS · ONE LIFE\n· SYMPASS\n· Toute nouvelle competence\n\nCreation, modification et suppression sans intervention technique.",
    },
    {
      tag:   "Disponibilite",
      title: "Calculee automatiquement.",
      body:  "Le collaborateur ne renseigne pas son etat.\n\nSa disponibilite est determinee par le systeme a partir du planning, des mises a disposition, missions, conges, absences et repos.",
      avail: true,
    },
    {
      tag:   "Presentation partenaire",
      title: "Selectionne par JCF Luxtalent.",
      body:  "Seules les informations utiles sont affichees :\n\n· Photo · Prenom · Categorie\n· Contrat horaire\n· Mention « Selectionne par JCF Luxtalent »\n\nAucun CV. Aucun historique. Aucune donnee personnelle inutile.",
      partner: true,
    },
    {
      tag:   "Administration",
      title: "Sans jamais supprimer.",
      body:  "L'administrateur peut creer, modifier, desactiver et reactiver un collaborateur.\n\nPar defaut, un collaborateur n'est jamais supprime physiquement afin de preserver l'historique.",
      last:  true,
    },
  ];

  const FIELD_LIST = [
    "Photo","Prenom · Nom","Categorie metier","Contrat horaire mensuel",
    "Statut actif / inactif","Secteur principal","Secteur secondaire",
    "Telephone","E-mail","Commentaire interne",
  ];

  const AVAIL_STATES = [
    { label:"Disponible",    color:"#2E8B57", bg:"#ECFDF5" },
    { label:"Occupe",        color:"#D4AF37", bg:"#FFFBEB" },
    { label:"Absent",        color:"#C0392B", bg:"#FEF2F2" },
    { label:"Indisponible",  color:"#6B7280", bg:"#F3F4F6" },
  ];

  const slide  = slides[page];
  const isLast = page === slides.length - 1;

  return (
    <div style={{ minHeight:"100dvh", background:"#1E2F4F", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", fontFamily:"Inter,system-ui,sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ height:3, background:"rgba(255,255,255,.12)", flexShrink:0 }}>
        <div style={{ height:"100%", width:((page+1)/slides.length*100)+"%", background:"#D4AF37", transition:"width .4s ease" }} />
      </div>
      <div style={{ padding:"20px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="jcf-brand" style={{ fontWeight:700, fontSize:12, color:"#1E2F4F", letterSpacing:"1px" }}>JCF</span>
          </div>
          <span style={{ fontWeight:800, fontSize:14, color:"#D4AF37", letterSpacing:"-0.3px" }}>OS · Ch.2</span>
        </div>
        <button onClick={onDone} style={{ background:"rgba(255,255,255,.1)", border:"none", borderRadius:8, padding:"6px 14px", color:"rgba(255,255,255,.5)", fontSize:12, cursor:"pointer" }}>
          Passer
        </button>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"32px 24px" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#D4AF37", letterSpacing:"1px", textTransform:"uppercase", marginBottom:16 }}>
          {slide.tag}
        </div>
        <h1 style={{ fontSize:24, fontWeight:800, color:"#ffffff", margin:"0 0 20px", lineHeight:1.25, letterSpacing:"-0.5px" }}>
          {slide.title}
        </h1>
        {slide.body && (
          <div style={{ fontSize:15, color:"rgba(255,255,255,.65)", lineHeight:1.75 }}>
            {slide.body.split("\n").map((line, i) => (
              <div key={i} style={{ marginBottom: line === "" ? 8 : 0 }}>{line === "" ? "\u00A0" : line}</div>
            ))}
          </div>
        )}
        {slide.fields && (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {FIELD_LIST.map((f, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,.07)", borderRadius:8, padding:"9px 12px", border:"1px solid rgba(255,255,255,.08)" }}>
                <div style={{ width:20, height:20, borderRadius:10, background:"rgba(212,175,55,.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:9, color:"#D4AF37", fontWeight:700 }}>{i+1}</span>
                </div>
                <span style={{ fontSize:13, color:"rgba(255,255,255,.75)" }}>{f}</span>
              </div>
            ))}
          </div>
        )}
        {slide.avail && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:8 }}>
            {AVAIL_STATES.map(s => (
              <div key={s.label} style={{ background:s.bg, borderRadius:20, padding:"6px 14px" }}>
                <span style={{ fontSize:12, fontWeight:600, color:s.color }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
        {slide.partner && (
          <div style={{ marginTop:12, background:"rgba(255,255,255,.06)", borderRadius:12, padding:"14px", border:"1px solid rgba(255,255,255,.1)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <div style={{ width:44, height:44, borderRadius:22, background:"rgba(212,175,55,.2)", border:"2px solid #D4AF37", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:16, color:"#D4AF37" }}>👤</span>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:"#ffffff" }}>Sophie M.</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.5)" }}>Opticienne diplômee · 35h</div>
              </div>
            </div>
            <div style={{ background:"rgba(212,175,55,.12)", borderRadius:8, padding:"8px 12px", border:"1px solid rgba(212,175,55,.25)" }}>
              <span style={{ fontSize:11, color:"#D4AF37", fontWeight:600, fontStyle:"italic" }}>Selectionnee par JCF Luxtalent</span>
            </div>
          </div>
        )}
        {slide.badge && (
          <div style={{ marginTop:24, display:"inline-flex", alignItems:"center", gap:8, background:"rgba(212,175,55,.15)", border:"1px solid rgba(212,175,55,.3)", borderRadius:8, padding:"8px 14px", alignSelf:"flex-start" }}>
            <span style={{ fontSize:12, color:"#D4AF37", fontWeight:600 }}>{slide.badge}</span>
          </div>
        )}
      </div>
      <div style={{ padding:"0 24px 36px", display:"flex", flexDirection:"column", gap:12, flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:4 }}>
          {slides.map((_, i) => (
            <div key={i}
              style={{ width: i===page ? 20 : 6, height:6, borderRadius:3, background: i===page ? "#D4AF37" : "rgba(255,255,255,.2)", transition:"width .3s, background .3s", cursor:"pointer" }}
              onClick={() => setPage(i)}
            />
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {page > 0 && (
            <button onClick={() => setPage(p => p-1)}
              style={{ flex:1, background:"rgba(255,255,255,.1)", border:"none", borderRadius:12, padding:"14px", fontWeight:600, fontSize:14, color:"rgba(255,255,255,.7)", cursor:"pointer" }}>
              Precedent
            </button>
          )}
          <button onClick={() => isLast ? onDone() : setPage(p => p+1)}
            style={{ flex:2, background:"#D4AF37", border:"none", borderRadius:12, padding:"14px", fontWeight:700, fontSize:14, color:"#1E2F4F", cursor:"pointer" }}>
            {isLast ? "Acceder a JCF OS" : "Suivant"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════
function LoginScreen({ onLogin, dynUsers }) {
  const [email,  setEmail]  = useState("");
  const [pwd,    setPwd]    = useState("");
  const [err,    setErr]    = useState("");

  const submit = e => {
    e.preventDefault();
    const u = (dynUsers||USERS).find(u => u.email === email && u.password === pwd);
    if (u) onLogin(u); else setErr("Identifiants incorrects");
  };

  return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"#1E2F4F", padding:24, fontFamily:"Inter,system-ui,sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ width:"100%", maxWidth:360 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          {/* Logo JCF Luxtalent — sérif élégante */}
          <img
            src={"data:image/png;base64,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"}
            alt="JCF Luxtalent"
            style={{ width:200, height:200, objectFit:"contain", display:"block", margin:"0 auto" }}
          />
          <div style={{ fontSize:13, color:"rgba(255,255,255,.92)", fontStyle:"italic", letterSpacing:"1.5px", marginTop:12 }}>
            La complexite est invisible.
          </div>
        </div>

        {/* Card */}
        <div style={{ background:"#ffffff", borderRadius:16, padding:28, boxShadow:"0 8px 32px rgba(0,0,0,.25)" }}>
          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>Email</label>
              <input
                style={{ width:"100%", border:"1.5px solid #E5E7EB", borderRadius:10, padding:"11px 13px", fontSize:13, color:"#2C2C2C", background:"#F8F9FB", boxSizing:"border-box" }}
                type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com"
              />
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>Mot de passe</label>
              <input
                style={{ width:"100%", border:"1.5px solid #E5E7EB", borderRadius:10, padding:"11px 13px", fontSize:13, color:"#2C2C2C", background:"#F8F9FB", boxSizing:"border-box" }}
                type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••"
              />
            </div>
            {err && <p style={{ color:"#C0392B", fontSize:12, textAlign:"center", margin:0 }}>{err}</p>}
            <button type="submit" style={{ background:"#D4AF37", color:"#1E2F4F", border:"none", borderRadius:10, padding:"13px", fontWeight:700, fontSize:14, cursor:"pointer", marginTop:4 }}>
              Acceder
            </button>
          </form>

          <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid #F1F3F6" }}>
            <p style={{ fontSize:10, color:"#9CA3AF", textAlign:"center", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.5px" }}>Format de connexion</p>
            {[
              { l:"Admin",        h:"admin@jcf.lu"      },
              { l:"Partenaire",   h:"[ville]@jcf.lu"    },
              { l:"Collaborateur",h:"[prenom]@jcf.lu"   },
            ].map(d => (
              <div key={d.l} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #F8F9FB" }}>
                <span style={{ fontSize:11, color:"#1E2F4F", fontWeight:600 }}>{d.l}</span>
                <span style={{ fontSize:10, color:"#9CA3AF" }}>{d.h}</span>
              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ESPACE ADMIN
// ════════════════════════════════════════════════════════════
function AdminSpace({ user, onLogout, assignments, addAssignment, updateAssignment, deleteAssignment, rates, updateRate, collabExtras, updateCollabExtra, partners, updatePartner, mads, addMad, updateMad, dynCollaborators, addCollaborator, cpRequests, validateCpRequest, refuseCpRequest, cssRequests, validateCssRequest, refuseCssRequest }) {
  const [tab, setTab]     = useState("dashboard");
  const [modal, setModal] = useState(null);
  const props = { assignments, addAssignment, updateAssignment, deleteAssignment, setModal, rates, collabExtras, updateCollabExtra, partners, updatePartner, mads, addMad, updateMad, dynCollaborators, addCollaborator };

  const tabs = [
    { id:"dashboard",     icon:"\uD83C\uDFE0", label:"Board"      },
    { id:"planning",      icon:"\uD83D\uDCC5", label:"Planning"   },
    { id:"mad",           icon:"\uD83D\uDCCB", label:"MAD"        },
    { id:"missions",      icon:"\uD83C\uDFAF", label:"Missions"   },
    { id:"collaborators", icon:"\uD83D\uDC65", label:"Equipe"     },
    { id:"conges",        icon:"\uD83C\uDF34", label:"Conges"+((cpRequests||[]).filter(r=>r.status==="pending").length+(cssRequests||[]).filter(r=>r.status==="pending").length>0?" ("+(((cpRequests||[]).filter(r=>r.status==="pending").length)+((cssRequests||[]).filter(r=>r.status==="pending").length))+")":"") },
    { id:"partners",      icon:"\uD83E\uDD1D", label:"Partenaires"},
    { id:"hours",         icon:"\u23F1",        label:"Heures"     },
    { id:"ca",            icon:"\uD83D\uDCC8", label:"CA"         },
    { id:"rates",         icon:"\uD83D\uDCB6", label:"Tarifs"     },
    { id:"settings",      icon:"\u2699",        label:"Config"     },
  ];

  return (
    <div style={S.app}>
      <style>{CSS}</style>
      <TopBar user={user} onLogout={onLogout} onRefresh={onRefresh} section={tabs.find(t => t.id===tab)?.label || ""} />
      <div style={S.body}>
        {tab==="dashboard"     && <AdminDashboard    {...props} />}
        {tab==="planning"      && <PlanningView      {...props} />}
        {tab==="mad"           && <MadView            mads={mads} addMad={addMad} updateMad={updateMad} assignments={assignments} rates={rates} partners={partners} collabExtras={collabExtras} />}
        {tab==="missions"      && <MissionsView      {...props} />}
        {tab==="conges" && (
          <div style={{ padding:"0 16px" }}>
            <SectionTitle title="Conges Payes" sub={(cpRequests||[]).filter(r=>r.status==="pending").length+" en attente"} />
            {(cpRequests||[]).length === 0 && <Empty text="Aucune demande CP" />}
            {[...(cpRequests||[])].sort((a,b)=>a.status==="pending"?-1:1).map(req => {
              const collab = COLLABORATORS.find(c => c.id===req.collaboratorId);
              return <CPRequestCard key={req.id} req={req} collab={collab} onValidate={validateCpRequest} onRefuse={refuseCpRequest} />;
            })}
            <SectionTitle title="Conges Sans Solde" sub={(cssRequests||[]).filter(r=>r.status==="pending").length+" en attente"} />
            {(cssRequests||[]).length === 0 && <Empty text="Aucune demande CSS" />}
            {[...(cssRequests||[])].sort((a,b)=>a.status==="pending"?-1:1).map(req => {
              const collab = COLLABORATORS.find(c => c.id===req.collaboratorId);
              return <CPRequestCard key={req.id} req={{...req, isCss:true}} collab={collab} onValidate={validateCssRequest} onRefuse={refuseCssRequest} />;
            })}
          </div>
        )}
        {tab==="collaborators" && <CollaboratorsView {...props} jobCategories={INITIAL_JOB_CATEGORIES} skills={INITIAL_SKILLS} sectors={INITIAL_SECTORS} collabExtras={collabExtras} updateCollabExtra={updateCollabExtra} dynCollaborators={dynCollaborators} addCollaborator={addCollaborator} />}
        {tab==="partners"      && <PartnersView assignments={assignments} partners={partners} updatePartner={updatePartner} />}
        {tab==="hours"         && <HoursView         assignments={assignments} rates={rates} collabExtras={collabExtras} />}
        {tab==="ca"            && <CaDetailView      assignments={assignments} rates={rates} />}
        {tab==="rates"         && <RatesView         rates={rates} updateRate={updateRate} collabExtras={collabExtras} />}
        {tab==="settings"      && <SettingsView />}
      </div>
      <BottomNav tabs={tabs} active={tab} onChange={setTab} />
      {modal && <AssignmentModal modal={modal} onClose={() => setModal(null)} {...props} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MODAL RESERVATION COMMERCIALE
// ════════════════════════════════════════════════════════════
function ReservationModal({ collab, locationId, assignments, onClose, onConfirm, rates }) {
  const [step,      setStep]      = useState("form");
  const [resType,   setResType]   = useState("day");
  const [startDate, setStartDate] = useState(TODAY);
  const [monthStr,  setMonthStr]  = useState("2026-06");
  const [inclSat,   setInclSat]   = useState(false);
  const [extraH,    setExtraH]    = useState(0);
  const [hotelNights,  setHotelNights]  = useState(0);
  const [repasSoirs,   setRepasSoirs]   = useState(0);
  const [ouverture,    setOuverture]    = useState(false);
  const HOTEL_RATE = 120;
  const REPAS_RATE = 18;
  const OUVERTURE_RATE = 150;
  const [conflicts, setConflicts] = useState([]);
  const [skipConfl, setSkipConfl] = useState(false);

  const r       = (rates || INITIAL_RATES)[collab.id] || {};
  const locName = (ALL_LOCATIONS.find(l => l.id===locationId) || {}).name || locationId;

  const candidateDates = useMemo(() => {
    if (resType==="day") return [startDate];
    if (resType==="week") { const e=calcEndDate(startDate,"week"); return buildDateRange(startDate,e); }
    if (resType==="fortnight") { const e=calcEndDate(startDate,"fortnight"); return buildDateRange(startDate,e); }
    if (resType==="month") {
      const parts = monthStr.split("-"); const y=parseInt(parts[0]); const m=parseInt(parts[1]);
      return buildDateRange(new Date(y,m-1,1).toISOString().split("T")[0], new Date(y,m,0).toISOString().split("T")[0], inclSat);
    }
    return [];
  }, [resType, startDate, inclSat, monthStr]);

  const conflictDates  = useMemo(() => candidateDates.filter(ds => assignments.some(a => a.collaboratorId===collab.id && a.date===ds && isWorkType(a.typeId))), [candidateDates, assignments, collab.id]);
  const availableDates = candidateDates.filter(ds => !conflictDates.includes(ds));
  const datesToBook    = skipConfl ? availableDates : candidateDates;
  const totalDays      = datesToBook.length;
  const blockedHours   = calcBlockedHours(collab, resType, extraH);
  const collabCost     = calcCommercialCost(collab.id, resType, extraH, rates);
  const hotelCost      = hotelNights * HOTEL_RATE;
  const repasCost      = repasSoirs * REPAS_RATE;
  const ouvertureCost  = ouverture ? OUVERTURE_RATE : 0;
  const totalCost      = collabCost + hotelCost + repasCost + ouvertureCost;
  const hoursPerDay    = totalDays > 0 ? Math.round(blockedHours/totalDays) : 8;

  const goSummary = () => {
    if (candidateDates.length === 0) return;
    if (conflictDates.length > 0 && !skipConfl) { setConflicts(conflictDates); return; }
    setConflicts([]); setStep("summary");
  };
  const confirm = async () => {
    // Insérer les assignments un par un pour éviter les conflits Supabase
    for (let idx = 0; idx < datesToBook.length; idx++) {
      const ds = datesToBook[idx];
      await onConfirm({
        collaboratorId:collab.id, date:ds, locationId, typeId:"work",
        hours:hoursPerDay, bookingType:resType, blockedHours, extraHours:extraH,
        periodCost:    idx===0 ? Math.round(collabCost) : 0,
        hotelNights:   idx===0 ? hotelNights   : 0,
        hotelCost:     idx===0 ? hotelCost     : 0,
        repasSoirs:    idx===0 ? repasSoirs    : 0,
        repasCost:     idx===0 ? repasCost     : 0,
        ouverture:     idx===0 ? ouverture     : false,
        ouvertureCost: idx===0 ? ouvertureCost : 0,
      });
    }
    onClose();
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.sheet, maxHeight:"92dvh" }} onClick={e => e.stopPropagation()}>
        <div style={S.sheetHeader}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {step==="summary" && (
              <button onClick={() => { setStep("form"); setSkipConfl(false); }} style={S.closeBtn}>
                &#8592;
              </button>
            )}
            <span style={{ fontWeight:700, fontSize:15, color:"#1E2F4F" }}>
              {step==="form" ? "Mise a disposition" : "Resume"}
            </span>
          </div>
          <button onClick={onClose} style={S.closeBtn}>&#x2715;</button>
        </div>

        {/* Fiche collab */}
        <div style={{ background:"#F8F9FB", borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
            <ColAvatar c={collab} size={42} />
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:"#1E2F4F" }}>{collab.name}</div>
              <div style={{ fontSize:11, color:"#6B7280" }}>{(r.weeklyHours||collab.weeklyHours)}h/sem · {collab.contract}h/mois</div>
            </div>
          </div>
          {(()=>{
            const exC = (COLLAB_EXTRA||{})[collab.id]||{};
            const warnDates = candidateDates.filter(ds => (exC.noWorkDays||[]).includes(new Date(ds+"T12:00:00").getDay()));
            if (!warnDates.length) return null;
            return (
              <div style={{ background:"#FFF5F5", border:"1px solid #FECACA", borderRadius:10, padding:"10px 12px", marginBottom:10 }}>
                <div style={{ fontWeight:600, fontSize:12, color:"#C0392B", marginBottom:2 }}>Jour(s) non travaille(s) normalement</div>
                <div style={{ fontSize:11, color:"#C0392B" }}>{warnDates.map(ds=>fmtDateFR(ds)).join(", ")} — reservation sur demande</div>
              </div>
            );
          })()}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
            {[{l:"Journee",v:r.day||0},{l:"Semaine",v:r.week||0},{l:"Quinzaine",v:r.fortnight||0},{l:"Mois",v:r.month||0}].map(t => (
              <div key={t.l} style={{ background:"#ffffff", borderRadius:8, padding:"6px 10px", display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:11, color:"#6B7280" }}>{t.l}</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#1E2F4F", fontVariantNumeric:"tabular-nums" }}>{fmtEur(t.v)}</span>
              </div>
            ))}
          </div>
        </div>

        {step==="form" && (
          <div>
            <FormLabel text="Duree commerciale" />
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
              {COMMERCIAL_TYPES.map(ct => {
                const bh   = calcBlockedHours(collab, ct.id, 0);
                const cost = calcCommercialCost(collab.id, ct.id, 0, rates);
                const sel  = resType === ct.id;
                return (
                  <button key={ct.id}
                    onClick={() => { setResType(ct.id); setConflicts([]); setSkipConfl(false); setExtraH(0); }}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", border:"2px solid " + (sel ? "#D4AF37" : "#E5E7EB"), borderRadius:10, cursor:"pointer", background: sel ? "#FFFBEB" : "#ffffff", textAlign:"left" }}
                  >
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:"#1E2F4F" }}>{ct.label}</div>
                      <div style={{ fontSize:10, color:"#6B7280" }}>{bh}h bloquees · {ct.sub}</div>
                    </div>
                    <span style={{ fontWeight:700, fontSize:13, color: sel ? "#D4AF37" : "#2C2C2C", fontVariantNumeric:"tabular-nums" }}>{fmtEur(cost)}</span>
                  </button>
                );
              })}
            </div>

            {resType==="day" && (
              <div>
                <FormLabel text="Date" />
                <input type="date" style={S.input} value={startDate} onChange={e => { setStartDate(e.target.value); setConflicts([]); }} />
              </div>
            )}
            {(resType==="week" || resType==="fortnight") && (
              <div>
                <FormLabel text="Date de debut" />
                <input type="date" style={S.input} value={startDate} onChange={e => { setStartDate(e.target.value); setConflicts([]); }} />
              </div>
            )}
            {resType==="month" && (
              <div>
                <FormLabel text="Mois" />
                <input type="month" style={S.input} value={monthStr} onChange={e => { setMonthStr(e.target.value); setConflicts([]); }} />
              </div>
            )}

            {resType !== "day" && (
              <label style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, fontSize:13, color:"#2C2C2C", cursor:"pointer", userSelect:"none" }}>
                <input type="checkbox" checked={inclSat} onChange={e => setInclSat(e.target.checked)} style={{ width:16, height:16, accentColor:"#1E2F4F" }} />
                Inclure les samedis
              </label>
            )}

            <FormLabel text="Extension d'heures" />
            <div style={{ display:"flex", gap:6, marginBottom:8 }}>
              {EXTRA_HOURS_OPTIONS.map(h => (
                <button key={h} onClick={() => setExtraH(h)}
                  style={{ flex:1, border:"1.5px solid " + (extraH===h ? "#D4AF37" : "#E5E7EB"), borderRadius:8, padding:"8px 4px", fontSize:11, fontWeight:600, cursor:"pointer", background: extraH===h ? "#FFFBEB" : "#F8F9FB", color: extraH===h ? "#1E2F4F" : "#6B7280" }}
                >
                  {h===0 ? "Aucune" : "+"+h+"h"}
                </button>
              ))}
            </div>
            {extraH > 0 && (
              <div style={{ fontSize:11, color:"#6B7280", marginBottom:8 }}>
                +{extraH}h x {fmtEur(r.hourly||0)}/h = +{fmtEur(Math.round(extraH*(r.hourly||0)))}
              </div>
            )}

            {candidateDates.length > 0 && (
              <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"10px 12px", marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#1E2F4F" }}>{candidateDates.length} jour{candidateDates.length>1?"s":""} · {blockedHours}h bloquees</span>
                  <span style={{ fontSize:13, fontWeight:800, color:"#D4AF37", fontVariantNumeric:"tabular-nums" }}>{fmtEur(Math.round(totalCost))}</span>
                </div>
                <div style={{ fontSize:10, color:"#6B7280" }}>
                  {(COMMERCIAL_TYPES.find(ct => ct.id===resType)||{}).label||resType}{extraH>0?" + "+extraH+"h":""}
                </div>
              </div>
            )}

            {conflicts.length > 0 && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#C0392B", marginBottom:6 }}>
                  {conflicts.length} conflit{conflicts.length>1?"s":""} detecte{conflicts.length>1?"s":""}
                </div>
                <div style={{ fontSize:11, color:"#B91C1C", marginBottom:10, lineHeight:1.6 }}>
                  {collab.name} est deja reserve{" "}
                  {conflicts.map(ds => { const d=new Date(ds+"T12:00:00"); return DAY_NAMES[d.getDay()]+" "+d.getDate(); }).join(", ")}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button style={{ ...S.btn, flex:1, background:"#FEE2E2", color:"#C0392B", fontSize:12, padding:"8px" }} onClick={() => setConflicts([])}>Annuler</button>
                  <button style={{ ...S.btnGold, flex:2, fontSize:12, padding:"8px" }} onClick={() => { setSkipConfl(true); setConflicts([]); setStep("summary"); }}>
                    Creer les {availableDates.length} jours dispo
                  </button>
                </div>
              </div>
            )}

            {/* Hotel */}
            <FormLabel text="Nuits d'hotel (optionnel)" />
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <button onClick={()=>setHotelNights(Math.max(0,hotelNights-1))}
                style={{ width:36, height:36, borderRadius:8, border:"1.5px solid #E5E7EB", background:"#F8F9FB", fontSize:18, cursor:"pointer", color:"#1E2F4F" }}>−</button>
              <div style={{ flex:1, textAlign:"center" }}>
                <span style={{ fontSize:20, fontWeight:800, color:"#1E2F4F" }}>{hotelNights}</span>
                <span style={{ fontSize:12, color:"#6B7280", marginLeft:6 }}>nuit{hotelNights>1?"s":""}</span>
                {hotelNights>0 && <div style={{ fontSize:11, color:"#D4AF37", fontWeight:600 }}>{fmtEur(hotelNights*HOTEL_RATE)} ({HOTEL_RATE}€/nuit)</div>}
              </div>
              <button onClick={()=>setHotelNights(hotelNights+1)}
                style={{ width:36, height:36, borderRadius:8, border:"1.5px solid #E5E7EB", background:"#F8F9FB", fontSize:18, cursor:"pointer", color:"#1E2F4F" }}>+</button>
            </div>
            {/* Frais de bouche */}
            <FormLabel text="Repas du soir (18€/soir)" />
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <button onClick={()=>setRepasSoirs(Math.max(0,repasSoirs-1))}
                style={{ width:36, height:36, borderRadius:8, border:"1.5px solid #E5E7EB", background:"#F8F9FB", fontSize:18, cursor:"pointer", color:"#1E2F4F" }}>−</button>
              <div style={{ flex:1, textAlign:"center" }}>
                <span style={{ fontSize:20, fontWeight:800, color:"#1E2F4F" }}>{repasSoirs}</span>
                <span style={{ fontSize:12, color:"#6B7280", marginLeft:6 }}>soir{repasSoirs>1?"s":""}</span>
                {repasSoirs>0 && <div style={{ fontSize:11, color:"#D4AF37", fontWeight:600 }}>{fmtEur(repasSoirs*REPAS_RATE)} ({REPAS_RATE}€/soir)</div>}
              </div>
              <button onClick={()=>setRepasSoirs(repasSoirs+1)}
                style={{ width:36, height:36, borderRadius:8, border:"1.5px solid #E5E7EB", background:"#F8F9FB", fontSize:18, cursor:"pointer", color:"#1E2F4F" }}>+</button>
            </div>
            {/* Ouverture / Fermeture */}
            <FormLabel text="Responsabilite ouverture/fermeture (+150€)" />
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              {[{id:false,label:"Non"},{id:true,label:"Oui +150€"}].map(opt => (
                <button key={String(opt.id)}
                  onClick={()=>setOuverture(opt.id)}
                  style={{ flex:1, border:"1.5px solid "+(ouverture===opt.id?"#D4AF37":"#E5E7EB"), borderRadius:8, padding:"9px 6px", fontSize:12, fontWeight:600, cursor:"pointer", background:ouverture===opt.id?"#FFFBEB":"#F8F9FB", color:ouverture===opt.id?"#1E2F4F":"#6B7280" }}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              style={{ ...S.btnGold, width:"100%", marginTop:4, opacity: candidateDates.length===0 ? 0.5 : 1 }}
              disabled={candidateDates.length===0}
              onClick={goSummary}
            >
              Voir le resume
            </button>
          </div>
        )}

        {step==="summary" && (
          <div>
            {[
              { label:"Collaborateur",     value:collab.name },
              { label:"Lieu",              value:locName },
              { label:"Duree commerciale", value:(COMMERCIAL_TYPES.find(ct=>ct.id===resType)||{}).label||resType },
              { label:"Date de debut",     value:fmtDateFR(datesToBook[0]) },
              { label:"Date de fin",       value:fmtDateFR(datesToBook[datesToBook.length-1]) },
              { label:"Jours",             value:totalDays+" jour"+(totalDays>1?"s":"") },
              { label:"Heures bloquees",   value:blockedHours+"h" },
            ].concat(extraH>0 ? [{ label:"Extension", value:"+"+extraH+"h" }] : []).map(row => (
              <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #F8F9FB", padding:"9px 0" }}>
                <span style={{ fontSize:12, color:"#6B7280" }}>{row.label}</span>
                <span style={{ fontSize:13, fontWeight:600, color:"#1E2F4F" }}>{row.value}</span>
              </div>
            ))}

            <div style={{ background:"#1E2F4F", borderRadius:12, padding:"14px 16px", marginTop:14, marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:hotelNights>0?8:0 }}>
                <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>Tarif collaborateur HT</span>
                <span style={{ fontWeight:700, fontSize:16, color:"rgba(255,255,255,.85)" }}>{fmtEur(Math.round(collabCost))}</span>
              </div>
              {hotelNights > 0 && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>Hotel ({hotelNights} nuit{hotelNights>1?"s":""} × {HOTEL_RATE}€)</span>
                  <span style={{ fontWeight:700, fontSize:16, color:"rgba(255,255,255,.85)" }}>{fmtEur(hotelCost)}</span>
                </div>
              )}
              {repasSoirs > 0 && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>Repas soir ({repasSoirs} × {REPAS_RATE}€)</span>
                  <span style={{ fontWeight:700, fontSize:16, color:"rgba(255,255,255,.85)" }}>{fmtEur(repasCost)}</span>
                </div>
              )}
              {(hotelNights > 0 || repasSoirs > 0) && (
                <div style={{ borderTop:"1px solid rgba(255,255,255,.15)", paddingTop:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>Total HT</span>
                    <span style={{ fontWeight:800, fontSize:22, color:"#D4AF37" }}>{fmtEur(Math.round(totalCost))}</span>
                  </div>
                </div>
              )}
              {ouverture && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>Ouverture/Fermeture</span>
                  <span style={{ fontWeight:700, fontSize:16, color:"rgba(255,255,255,.85)" }}>{fmtEur(OUVERTURE_RATE)}</span>
                </div>
              )}
              {(hotelNights === 0 && repasSoirs === 0 && !ouverture) && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>Total HT</span>
                  <span style={{ fontWeight:800, fontSize:22, color:"#D4AF37" }}>{fmtEur(Math.round(totalCost))}</span>
                </div>
              )}
              {extraH > 0 && (
                <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", marginTop:4 }}>
                  Extension : {extraH}h x {fmtEur(r.hourly||0)}/h
                </div>
              )}
            </div>

            <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"10px 12px", marginBottom:12, fontSize:10, color:"#92400E", lineHeight:1.6 }}>
              La disponibilite du collaborateur est bloquee sur la periode reservee. Les heures non utilisees restent dues. Estimation indicative — facturation finale par JCF Luxtalent.
            </div>

            {skipConfl && conflictDates.length > 0 && (
              <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:8, padding:"8px 12px", fontSize:11, color:"#92400E", marginBottom:10 }}>
                {conflictDates.length} jour{conflictDates.length>1?"s":""} en conflit exclu{conflictDates.length>1?"s":""}
              </div>
            )}

            <button
              style={{ ...S.btnGold, width:"100%", opacity: totalDays===0 ? 0.5 : 1 }}
              disabled={totalDays===0}
              onClick={confirm}
            >
              Confirmer — {blockedHours}h bloquees
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CALENDRIER MENSUEL MAGASIN
// ════════════════════════════════════════════════════════════
function StoreCalendar({ myReservations, rates, onClickEntry }) {
  const [calYear,  setCalYear]  = useState(2026);
  const [calMonth, setCalMonth] = useState(5);
  const [filter,   setFilter]   = useState("all");

  const monthStr = calYear + "-" + String(calMonth+1).padStart(2,"0");
  const monthRes = myReservations.filter(a => a.date.startsWith(monthStr) && (filter==="all" || a.collaboratorId===filter));

  const stats = useMemo(() => {
    const all = myReservations.filter(a => a.date.startsWith(monthStr));
    return {
      days:    all.length,
      hours:   all.reduce((s,a) => s+a.hours, 0),
      budget:  Math.round(all.reduce((s,a) => s+budgetAssignment(a,rates), 0)),
      collabs: new Set(all.map(a => a.collaboratorId)).size,
    };
  }, [myReservations, monthStr, rates]);

  const firstDay   = new Date(calYear, calMonth, 1);
  const lastDay    = new Date(calYear, calMonth+1, 0);
  const startDow   = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7;

  const prevMonth = () => { if (calMonth===0) { setCalYear(y=>y-1); setCalMonth(11); } else setCalMonth(m=>m-1); };
  const nextMonth = () => { if (calMonth===11) { setCalYear(y=>y+1); setCalMonth(0);  } else setCalMonth(m=>m+1); };

  const dayMap = useMemo(() => {
    const m = {};
    monthRes.forEach(a => { if (!m[a.date]) m[a.date]=[]; m[a.date].push(a); });
    return m;
  }, [monthRes]);

  const usedCollabs = useMemo(() => {
    const ids = [...new Set(myReservations.filter(a => a.date.startsWith(monthStr)).map(a => a.collaboratorId))];
    return ids.map(id => COLLABORATORS.find(c => c.id===id)).filter(Boolean);
  }, [myReservations, monthStr]);

  const cells = Array.from({ length:totalCells }, (_, i) => {
    const n = i - startDow + 1;
    if (n < 1 || n > lastDay.getDate()) return null;
    const ds = calYear + "-" + String(calMonth+1).padStart(2,"0") + "-" + String(n).padStart(2,"0");
    return { n, ds, entries: dayMap[ds] || [] };
  });

  const DOW = ["L","M","M","J","V","S","D"];

  return (
    <div>
      {/* KPI */}
      <div style={{ display:"flex", gap:6, padding:"10px 16px 6px", overflowX:"auto" }}>
        {[
          { v:stats.days,       l:"Jours",    c:"#1E2F4F" },
          { v:stats.hours+"h",  l:"Heures",   c:"#2D456B" },
          { v:String(stats.collabs), l:"Collabs", c:"#2E8B57" },
          { v:fmtEur(stats.budget), l:"Budget estim.", c:"#D4AF37" },
        ].map((k, i) => (
          <div key={i} style={{ flex:"0 0 auto", minWidth:74, background:"#ffffff", borderRadius:12, padding:"10px 8px", textAlign:"center", boxShadow:"0 1px 4px rgba(30,47,79,.07)", borderTop:"3px solid "+k.c }}>
            <div style={{ fontSize:13, fontWeight:800, color:k.c, fontVariantNumeric:"tabular-nums", whiteSpace:"nowrap" }}>{k.v}</div>
            <div style={{ fontSize:9, color:"#6B7280", marginTop:2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Nav mois */}
      <div style={{ padding:"4px 16px", display:"flex", alignItems:"center", gap:8 }}>
        <button onClick={prevMonth} style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F", fontSize:16 }}>&#8249;</button>
        <div style={{ flex:1, textAlign:"center", fontWeight:700, fontSize:14, color:"#1E2F4F" }}>{MONTH_NAMES[calMonth]} {calYear}</div>
        <button onClick={() => { setCalYear(2026); setCalMonth(5); }} style={{ ...S.btn, padding:"5px 10px", background:"#FFFBEB", color:"#1E2F4F", fontSize:11 }}>Auj.</button>
        <button onClick={nextMonth} style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F", fontSize:16 }}>&#8250;</button>
      </div>

      {/* Filtre collab */}
      {usedCollabs.length > 1 && (
        <div style={{ padding:"2px 16px 6px", display:"flex", gap:6, overflowX:"auto" }}>
          <button onClick={() => setFilter("all")} style={{ ...S.btn, padding:"4px 10px", fontSize:10, flexShrink:0, background: filter==="all" ? "#1E2F4F" : "#F8F9FB", color: filter==="all" ? "#fff" : "#2C2C2C" }}>Tous</button>
          {usedCollabs.map(c => (
            <button key={c.id} onClick={() => setFilter(filter===c.id ? "all" : c.id)} style={{ ...S.btn, padding:"4px 10px", fontSize:10, flexShrink:0, background: filter===c.id ? c.color : "#F8F9FB", color: filter===c.id ? "#fff" : "#2C2C2C" }}>
              {c.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Jours headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"0 8px 2px", gap:2 }}>
        {DOW.map((d, i) => (
          <div key={i} style={{ textAlign:"center", fontSize:10, fontWeight:600, color: i>=5 ? "#C0392B" : "#6B7280", paddingBottom:2 }}>{d}</div>
        ))}
      </div>

      {/* Grille */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, padding:"0 8px 8px" }}>
        {cells.map((cell, i) => {
          if (!cell) return (<div key={i} style={{ minHeight:52 }} />);
          const isToday = cell.ds === TODAY;
          const weekend = i%7 >= 5;
          return (
            <div key={i} style={{ minHeight:52, borderRadius:8, background: isToday ? "#FFFBEB" : "#ffffff", border: isToday ? "1.5px solid #D4AF37" : "1px solid #F8F9FB", padding:"3px", boxShadow: cell.entries.length ? "0 1px 4px rgba(30,47,79,.07)" : "none" }}>
              <div style={{ fontSize:10, fontWeight: isToday ? 700 : 500, color: isToday ? "#D4AF37" : weekend ? "#C0392B" : "#6B7280", marginBottom:2, paddingLeft:2 }}>{cell.n}</div>
              {cell.entries.map((a, ei) => {
                const c = COLLABORATORS.find(x => x.id===a.collaboratorId);
                if (!c) return null;
                return (
                  <div key={ei} onClick={() => onClickEntry(a)} style={{ background:c.color+"20", borderLeft:"2px solid "+c.color, borderRadius:3, padding:"1px 3px", marginBottom:1, cursor:"pointer" }}>
                    <div style={{ fontSize:9, fontWeight:700, color:c.color, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name.split(" ")[0]}</div>
                    <div style={{ fontSize:8, color:"#6B7280" }}>{a.hours}h</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div style={{ padding:"0 16px 4px", fontSize:10, color:"#9CA3AF", textAlign:"center" }}>Budget estimatif HT — facturation finale par JCF Luxtalent</div>
    </div>
  );
}

function ReservationDetail({ assignment, rates, onClose, onCancel, onCancelLate }) {
  // useState EN PREMIER — règle des hooks React
  const [confirmCancel, setConfirmCancel] = useState(false);

  const c   = COLLABORATORS.find(x => x.id===assignment.collaboratorId);
  const loc = ALL_LOCATIONS.find(l => l.id===assignment.locationId);
  const d   = new Date(assignment.date + "T12:00:00");
  const bh  = assignment.hours;
  const btl = (COMMERCIAL_TYPES.find(ct => ct.id===assignment.bookingType)||{}).label || "Journee";
  const budget = budgetAssignment(assignment, rates);

  // Vérification annulation tardive (moins de 24h)
  const now = new Date();
  const diffH = (d - now) / (1000 * 60 * 60);
  const isLate = diffH < 24 && diffH > -24;
  const penalite = Math.round(estCollab(assignment.collaboratorId, assignment.hours, rates) * 0.30);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.sheet, maxHeight:"80dvh" }} onClick={e => e.stopPropagation()}>
        <div style={S.sheetHeader}>
          <span style={{ fontWeight:700, fontSize:15, color:"#1E2F4F" }}>Detail reservation</span>
          <button onClick={onClose} style={S.closeBtn}>&#x2715;</button>
        </div>
        {c && (
          <div style={{ display:"flex", alignItems:"center", gap:12, background:"#F8F9FB", borderRadius:12, padding:"10px 12px", marginBottom:14 }}>
            <ColAvatar c={c} size={42} />
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:"#1E2F4F" }}>{c.name}</div>
              <div style={{ fontSize:12, color:"#6B7280" }}>{DAY_NAMES[d.getDay()]} {d.getDate()} {MONTH_NAMES[d.getMonth()]} {d.getFullYear()}</div>
            </div>
          </div>
        )}
        {[
          {label:"Lieu",            value:(loc||{}).name||assignment.locationId},
          {label:"Duree",           value:btl},
          {label:"Heures",          value:bh+"h"},
          {label:"Statut",          value: assignment.typeId==="annulation" ? "Annule — penalite" : "Confirme"},
        ].map(row => (
          <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #F8F9FB", padding:"9px 0" }}>
            <span style={{ fontSize:12, color:"#6B7280" }}>{row.label}</span>
            <span style={{ fontSize:13, fontWeight:600, color:"#1E2F4F" }}>{row.value}</span>
          </div>
        ))}
        <div style={{ background:"#1E2F4F", borderRadius:12, padding:"14px 16px", marginTop:12, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>Budget HT</span>
            <span style={{ fontWeight:800, fontSize:20, color:"#D4AF37" }}>{fmtEur(Math.round(budget))}</span>
          </div>
        </div>

        {/* Annulation tardive — alerte */}
        {isLate && !confirmCancel && assignment.typeId !== "annulation" && (
          <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
            <div style={{ fontWeight:700, fontSize:13, color:"#C0392B", marginBottom:4 }}>
              Annulation tardive — moins de 24h
            </div>
            <div style={{ fontSize:12, color:"#C0392B", marginBottom:8 }}>
              Une penalite de 30% sera automatiquement facturee : {fmtEur(penalite)}
            </div>
          </div>
        )}

        {/* Confirmation annulation tardive */}
        {confirmCancel && (
          <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
            <div style={{ fontWeight:700, fontSize:13, color:"#C0392B", marginBottom:8 }}>
              Confirmer l'annulation ? Penalite : {fmtEur(penalite)}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button style={{ ...S.btn, flex:1, background:"#F8F9FB", color:"#6B7280" }} onClick={() => setConfirmCancel(false)}>Retour</button>
              <button style={{ flex:2, border:"none", borderRadius:8, padding:"10px", fontSize:12, fontWeight:700, cursor:"pointer", background:"#C0392B", color:"#ffffff" }}
                onClick={() => { onCancelLate(assignment, penalite); onClose(); }}>
                Confirmer — {fmtEur(penalite)} factures
              </button>
            </div>
          </div>
        )}

        {!confirmCancel && assignment.typeId !== "annulation" && (
          <div style={{ display:"flex", gap:8 }}>
            <button style={{ ...S.btn, background:"#FEF2F2", color:"#C0392B", flex:1 }}
              onClick={() => isLate ? setConfirmCancel(true) : onCancel(assignment.id)}>
              Annuler{isLate ? " (30%)" : ""}
            </button>
            <button style={{ ...S.btnGold, flex:1 }} onClick={onClose}>Fermer</button>
          </div>
        )}
        {assignment.typeId === "annulation" && (
          <div style={{ textAlign:"center", fontSize:12, color:"#C0392B", fontWeight:600 }}>Reservation annulee — penalite facturee</div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ESPACE MAGASIN
// ════════════════════════════════════════════════════════════
function StoreSpace({ user, onLogout, assignments, addAssignment, deleteAssignment, rates, onRefresh }) {
  const [tab,         setTab]    = useState("calendar");
  const [selDate,     setSelDate]= useState(TODAY);
  const [resModal,    setResMod] = useState(null);
  const [detailEntry, setDetail] = useState(null);

  const myLoc = ALL_LOCATIONS.find(l => l.id===user.locationId);

  const available = useMemo(() =>
    COLLABORATORS.filter(c => { const a=assignments.find(x=>x.collaboratorId===c.id&&x.date===selDate); return !a||!isWorkType(a.typeId); }),
    [assignments, selDate]);

  const myReservations = useMemo(() =>
    assignments.filter(a => a.locationId===user.locationId && isWorkType(a.typeId)).sort((a,b) => a.date.localeCompare(b.date)),
    [assignments, user.locationId]);

  const grouped = useMemo(() => {
    const gs = [];
    myReservations.forEach(r => {
      const last = gs[gs.length-1];
      if (last && last.collaboratorId===r.collaboratorId) {
        last.dates.push(r.date); last.totalHours+=r.hours;
        // Frais annexes : accumuler seulement les jours où ils sont > 0
        last.totalHotel     += (r.hotelCost||0);
        last.totalRepas     += (r.repasCost||0);
        last.totalOuverture += (r.ouvertureCost||0);
        if ((r.periodCost||0) > 0) last.periodCost = r.periodCost;
      } else gs.push({
        collaboratorId:r.collaboratorId, dates:[r.date], totalHours:r.hours, hours:r.hours,
        bookingType:r.bookingType||"day",
        periodCost:      r.periodCost||0,
        totalHotel:      r.hotelCost||0,
        totalRepas:      r.repasCost||0,
        totalOuverture:  r.ouvertureCost||0,
      });
    });
    return gs;
  }, [myReservations]);

  const tabs = [
    { id:"calendar",     icon:"\uD83D\uDDD3", label:"Calendrier"  },
    { id:"available",    icon:"\u2705",        label:"Disponibles" },
    { id:"reservations", icon:"\uD83D\uDCCB",  label:"Reservations"},
  ];

  return (
    <div style={S.app}>
      <style>{CSS}</style>
      <TopBar user={user} onLogout={onLogout} onRefresh={onRefresh} section={(myLoc||{}).name||user.name} />
      <div style={S.body}>
        <div style={{ background:"#1E2F4F", padding:"14px 16px", color:"#ffffff", marginBottom:8 }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:"0.5px" }}>Espace partenaire</div>
          <div style={{ fontSize:18, fontWeight:700 }}>{(myLoc||{}).name||user.name}</div>
        </div>

        {tab==="calendar" && (
          <StoreCalendar myReservations={myReservations} rates={rates} locationId={user.locationId} onClickEntry={a => setDetail(a)} />
        )}

        {tab==="available" && (
          <div style={{ padding:"0 16px" }}>
            <div style={{ marginBottom:12 }}>
              <label style={S.lbl}>Disponibilite a partir du</label>
              <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)} style={S.input} />
            </div>
            <SectionTitle title={available.length+" disponibles"} />
            {available.length===0 ? <Empty text="Aucun collaborateur disponible" /> : available.map(c => (
              <div key={c.id} style={{ ...S.card, background:c.isNoWork?"#FFF5F5":"#ffffff", borderLeft:c.isNoWork?"4px solid #FCA5A5":"none" }}>
                <ColAvatar c={c} size={40} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:c.isNoWork?"#C0392B":"#1E2F4F" }}>{c.name}</div>
                  {c.isNoWork ? (
                    <div style={{ fontSize:11, color:"#C0392B", fontWeight:600 }}>Disponible sur demande uniquement</div>
                  ) : (
                    <>
                      <div style={{ fontSize:11, color:"#6B7280" }}>{c.weeklyHours}h/sem · {c.contract}h/mois</div>
                      <div style={{ fontSize:11, color:"#D4AF37", fontWeight:600 }}>Journee · {fmtEur(calcTotalRate("day",1,c.id,rates))} HT</div>
                    </>
                  )}
                </div>
                {c.isNoWork ? (
                  <button style={{ ...S.btn, fontSize:11, padding:"7px 10px", background:"#FEF2F2", color:"#C0392B", border:"1.5px solid #FECACA" }}
                    onClick={() => setResMod(c)}>Sur demande</button>
                ) : (
                  <button style={{ ...S.btnGold, fontSize:12, padding:"7px 14px" }} onClick={() => setResMod(c)}>Reserver</button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab==="reservations" && (
          <div style={{ padding:"0 16px" }}>
            <SectionTitle title="Reservations" sub={myReservations.length+" jour"+(myReservations.length!==1?"s":"")} />
            {grouped.length===0 ? <Empty text="Aucune reservation" /> : grouped.map((g, i) => {
              const c  = COLLABORATORS.find(x => x.id===g.collaboratorId);
              const dS = new Date(g.dates[0]+"T12:00:00");
              const dE = new Date(g.dates[g.dates.length-1]+"T12:00:00");
              const days = g.dates.length;
              const rt = g.bookingType || "day";
              // Utiliser periodCost si disponible, sinon tarif contractuel
              const collabBudget = g.periodCost > 0
                ? g.periodCost
                : calcCommercialCost(g.collaboratorId, rt, 0, rates);
              const totalFrais = (g.totalHotel||0) + (g.totalRepas||0) + (g.totalOuverture||0);
              const totalBudget = collabBudget + totalFrais;
              return (
                <div key={i} style={{ ...S.card, flexDirection:"column", alignItems:"stretch", gap:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    {c && <ColAvatar c={c} size={36} />}
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:"#1E2F4F" }}>{c ? c.name : "-"}</div>
                      <div style={{ fontSize:11, color:"#6B7280" }}>
                        {days===1 ? DAY_NAMES[dS.getDay()]+" "+dS.getDate()+" "+MONTH_NAMES[dS.getMonth()] : "Du "+dS.getDate()+" au "+dE.getDate()+" "+MONTH_NAMES[dE.getMonth()]+" · "+days+" jours"}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#D4AF37" }}>{fmtEur(Math.round(totalBudget))}</div>
                      {totalFrais > 0 && <div style={{ fontSize:10, color:"#9CA3AF" }}>dont {fmtEur(totalFrais)} frais</div>}
                      {totalFrais === 0 && <div style={{ fontSize:10, color:"#9CA3AF" }}>Budget HT</div>}
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:"#6B7280", paddingTop:6, borderTop:"1px solid #F8F9FB" }}>
                    {(COMMERCIAL_TYPES.find(ct=>ct.id===rt)||{}).label||rt} · {g.totalHours}h
                    {(g.totalHotel||0)>0 && " · Hotel "+fmtEur(g.totalHotel)}
                    {(g.totalRepas||0)>0 && " · Repas "+fmtEur(g.totalRepas)}
                    {(g.totalOuverture||0)>0 && " · Ouverture/Ferm. "+fmtEur(g.totalOuverture)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav tabs={tabs} active={tab} onChange={setTab} />
      {resModal && (
        <ReservationModal collab={resModal} locationId={user.locationId} assignments={assignments} onClose={() => setResMod(null)} onConfirm={entry => addAssignment(entry)} rates={rates} />
      )}
      {detailEntry && (
        <ReservationDetail
          assignment={detailEntry}
          rates={rates}
          onClose={() => setDetail(null)}
          onCancel={id => { deleteAssignment(id); setDetail(null); }}
          onCancelLate={(a, penalite) => {
            // Transformer en annulation tardive avec pénalité 30%
            addAssignment({
              collaboratorId: a.collaboratorId,
              date: a.date,
              locationId: a.locationId,
              typeId: "annulation",
              hours: a.hours,
              bookingType: a.bookingType,
              periodCost: penalite,
              hotelCost: 0, repasCost: 0,
              penalite: penalite,
            });
            deleteAssignment(a.id);
            setDetail(null);
          }}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ESPACE REMPLACANT
// ════════════════════════════════════════════════════════════
function ReplacementSpace({ user, onLogout, assignments, addCpRequest, cpRequests, addCssRequest, cssRequests, onRefresh }) {
  const [tab,        setTab]       = useState("planning");
  // Planning : semaine + calendrier
  const [weekStart,  setWeekStart] = useState("2026-06-09");
  const [planView,   setPlanView]  = useState("week"); // "week" | "cal"
  const [calYear,    setCalYear]   = useState(2026);
  const [calMonth,   setCalMonth]  = useState(5);
  // Heures : navigation mois
  const [hYear,      setHYear]     = useState(2026);
  const [hMonth,     setHMonth]    = useState(5);
  // Missions : navigation mois
  const [mYear,      setMYear]     = useState(2026);
  const [mMonth,     setMMonth]    = useState(5);

  const collab = COLLABORATORS.find(c => c.id===user.collaboratorId);
  const myA    = assignments.filter(a => a.collaboratorId===user.collaboratorId);

  const weekDates = Array.from({ length:7 }, (_, i) => {
    const d = new Date(weekStart+"T12:00:00"); d.setDate(d.getDate()+i); return d.toISOString().split("T")[0];
  });

  const [cpModal,  setCpModal]  = useState(false);
  const [cssModal, setCssModal] = useState(false);
  const myCssRequests = (cssRequests||[]).filter(r => r.collaboratorId === (user.collaboratorId||""));
  const myRequests = (cpRequests||[]).filter(r => r.collaboratorId === (user.collaboratorId||""));
  const myEx = (COLLAB_EXTRA||{})[user.collaboratorId||""] || {};

  const tabs = [
    { id:"planning", icon:"\uD83D\uDCC5", label:"Planning" },
    { id:"hours",    icon:"\u23F1",        label:"Heures"   },
    { id:"missions", icon:"\uD83C\uDFAF",  label:"Missions" },
    { id:"cp",       icon:"\uD83C\uDF34",  label:"Conges"  },
  ];

  // Helpers navigation
  const prevMonth = (y,m,setY,setM) => { if(m===0){setY(y-1);setM(11);}else setM(m-1); };
  const nextMonth = (y,m,setY,setM) => { if(m===11){setY(y+1);setM(0);}else setM(m+1); };
  const MonthNav  = ({y,m,setY,setM,onToday}) => (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px 6px" }}>
      <button onClick={()=>prevMonth(y,m,setY,setM)} style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F", fontSize:16 }}>&#8249;</button>
      <div style={{ flex:1, textAlign:"center", fontWeight:700, fontSize:14, color:"#1E2F4F" }}>{MONTH_NAMES[m]} {y}</div>
      <button onClick={onToday} style={{ ...S.btn, padding:"5px 10px", background:"#FFFBEB", color:"#1E2F4F", fontSize:11 }}>Auj.</button>
      <button onClick={()=>nextMonth(y,m,setY,setM)} style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F", fontSize:16 }}>&#8250;</button>
    </div>
  );

  return (
    <div style={S.app}>
      <style>{CSS}</style>
      <TopBar user={user} onLogout={onLogout} onRefresh={onRefresh} section={collab ? collab.name : user.name} />
      <div style={S.body}>
        <div style={{ background:"#1E2F4F", padding:"14px 16px", color:"#ffffff", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {collab && <ColAvatar c={collab} size={44} textColor="#ffffff" bgAlpha="40" />}
            <div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.5)" }}>Bonjour,</div>
              <div style={{ fontSize:18, fontWeight:700 }}>{collab ? collab.name : user.name}</div>
            </div>
          </div>
        </div>

        {/* ── PLANNING : semaine + calendrier ── */}
        {tab==="planning" && (
          <div>
            {/* Bascule vue */}
            <div style={{ display:"flex", padding:"4px 16px 6px", gap:6 }}>
              {[{id:"week",label:"Semaine"},{id:"cal",label:"Calendrier"}].map(v=>(
                <button key={v.id} onClick={()=>setPlanView(v.id)}
                  style={{ flex:1, border:"none", borderRadius:8, padding:"7px", fontSize:12, fontWeight:600, cursor:"pointer",
                    background: planView===v.id?"#1E2F4F":"#F8F9FB",
                    color:      planView===v.id?"#D4AF37":"#6B7280" }}>
                  {v.label}
                </button>
              ))}
            </div>

            {/* Vue semaine */}
            {planView==="week" && (
              <div>
                <WeekNav weekDates={weekDates}
                  onPrev={() => { const ws=new Date(weekStart+"T12:00:00"); ws.setDate(ws.getDate()-7); setWeekStart(ws.toISOString().split('T')[0]); }}
                  onNext={() => { const ws=new Date(weekStart+"T12:00:00"); ws.setDate(ws.getDate()+7); setWeekStart(ws.toISOString().split('T')[0]); }}
                />
                <div style={{ display:"flex", flexDirection:"column", gap:6, padding:"0 16px" }}>
                  {weekDates.map(ds => {
                    const a = myA.find(x => x.date===ds);
                    const d = new Date(ds+"T12:00:00");
                    const isToday = ds===TODAY;
                    const abs = a&&!isWorkType(a.typeId)?absStyle(a.typeId):null;
                    return (
                      <div key={ds} style={{ ...S.planRow,
                        borderLeft:"4px solid "+(isToday?"#D4AF37":a&&isWorkType(a.typeId)?(collab?collab.color:"#1E2F4F"):abs?abs.border:"#E5E7EB"),
                        background:isToday?"#FFFBEB":"#ffffff" }}>
                        <div style={{ width:48, fontSize:12, fontWeight:isToday?700:500, color:isToday?"#D4AF37":"#6B7280" }}>
                          {DAY_NAMES[d.getDay()]} {d.getDate()}
                        </div>
                        <div style={{ flex:1 }}>
                          {a?<span style={{ fontSize:13, fontWeight:600, color:abs?abs.color:"#1E2F4F" }}>{getLocName(a.locationId)}</span>
                            :<span style={{ fontSize:12, color:"#9CA3AF" }}>Disponible</span>}
                        </div>
                        {a&&isWorkType(a.typeId)&&<StatusTag label={a.hours+"h"} color="#1E2F4F" bg="#FFFBEB"/>}
                        {a&&!isWorkType(a.typeId)&&abs&&<StatusTag label={getLocName(a.locationId)} color={abs.textColor} bg={abs.bg}/>}
                        {!a&&<StatusTag label="Dispo" color="#2E8B57" bg="#ECFDF5"/>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Vue calendrier mensuel */}
            {planView==="cal" && (
              <div>
                {(()=>{
                  const fD=new Date(calYear,calMonth,1);
                  const lD=new Date(calYear,calMonth+1,0);
                  const sDow=(fD.getDay()+6)%7;
                  const tc=Math.ceil((sDow+lD.getDate())/7)*7;
                  const cells=Array.from({length:tc},(_,i)=>{
                    const n=i-sDow+1;
                    if(n<1||n>lD.getDate()) return null;
                    const ds=calYear+"-"+String(calMonth+1).padStart(2,"0")+"-"+String(n).padStart(2,"0");
                    return{n,ds};
                  });
                  const prevCal=()=>{if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1);};
                  const nextCal=()=>{if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1);};
                  return (
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 8px 6px" }}>
                        <button onClick={prevCal} style={{ ...S.btn,padding:"5px 10px",background:"#F8F9FB",color:"#1E2F4F",fontSize:14 }}>&#8249;</button>
                        <div style={{ flex:1,textAlign:"center",fontWeight:700,fontSize:13,color:"#1E2F4F" }}>{MONTH_NAMES[calMonth]} {calYear}</div>
                        <button onClick={()=>{setCalYear(2026);setCalMonth(5);}} style={{ ...S.btn,padding:"5px 8px",background:"#FFFBEB",color:"#1E2F4F",fontSize:10 }}>Auj.</button>
                        <button onClick={nextCal} style={{ ...S.btn,padding:"5px 10px",background:"#F8F9FB",color:"#1E2F4F",fontSize:14 }}>&#8250;</button>
                      </div>
                      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0 8px 2px",gap:2 }}>
                        {["L","M","M","J","V","S","D"].map((d,i)=><div key={i} style={{ textAlign:"center",fontSize:10,fontWeight:600,color:i>=5?"#C0392B":"#9CA3AF" }}>{d}</div>)}
                      </div>
                      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,padding:"0 8px 8px" }}>
                        {cells.map((cell,i)=>{
                          if(!cell) return (<div key={i} style={{ minHeight:44 }}/>);
                          const{n,ds}=cell;
                          const a=myA.find(x=>x.date===ds);
                          const abs=a&&!isWorkType(a.typeId)?absStyle(a.typeId):null;
                          const isToday=ds===TODAY;
                          const isWork=a&&isWorkType(a.typeId);
                          const isMiss=isWork&&isMission(a.locationId);
                          return (
                            <div key={i} style={{ minHeight:44,borderRadius:7,
                              background:isToday?"#FFFBEB":isWork?(isMiss?"#FFFBEB":(collab?collab.color+"14":"#EFF6FF")):a?"#F5F3FF":"#ffffff",
                              border:"1px solid "+(isToday?"#D4AF37":isWork?(collab?collab.color+"50":"#BFDBFE"):a?"#C4B5FD50":"#F8F9FB"),
                              padding:"4px 3px" }}>
                              <div style={{ fontSize:10,fontWeight:isToday?700:400,color:isToday?"#D4AF37":(i%7)>=5?"#C0392B":"#6B7280",marginBottom:3 }}>{n}</div>
                              {isWork&&!isMiss&&collab&&<div style={{ width:6,height:6,borderRadius:3,background:collab.color }}/>}
                              {isMiss&&<div style={{ width:6,height:6,borderRadius:3,background:"#D4AF37" }}/>}
                              {a&&!isWork&&abs&&<div style={{ fontSize:7,color:abs.color,fontWeight:600,lineHeight:1 }}>{getLocName(a.locationId).slice(0,3)}</div>}
                              {!a&&<div style={{ fontSize:9,color:"#D1FAE5",textAlign:"center" }}>·</div>}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ padding:"0 16px 4px",display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center" }}>
                        {collab&&<div style={{ background:collab.color+"18",borderRadius:10,padding:"3px 10px" }}><span style={{ fontSize:10,fontWeight:600,color:collab.color }}>Travail</span></div>}
                        <div style={{ background:"#FFFBEB",borderRadius:10,padding:"3px 10px" }}><span style={{ fontSize:10,fontWeight:600,color:"#D4AF37" }}>Mission</span></div>
                        <div style={{ background:"#ECFDF5",borderRadius:10,padding:"3px 10px" }}><span style={{ fontSize:10,fontWeight:600,color:"#2E8B57" }}>Disponible</span></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── HEURES : navigation mois par mois ── */}
        {tab==="hours" && (
          <div style={{ padding:"8px 0" }}>
            <MonthNav y={hYear} m={hMonth} setY={setHYear} setM={setHMonth} onToday={()=>{setHYear(2026);setHMonth(5);}} />
            {(()=>{
              const monthStr = hYear+"-"+String(hMonth+1).padStart(2,"0");
              const monthA   = myA.filter(a=>a.date.startsWith(monthStr));
              const planned  = calcHours(monthA);
              // Heures CP posées ce mois → à déduire du contrat
              const hJour    = myEx.weeklyHours ? Math.round(myEx.weeklyHours/5*10)/10 : 8;
              const cpPosesMois = monthA.filter(a=>a.typeId==="cp"||a.typeId==="css").length;
              const heuresCPMois = cpPosesMois * hJour;
              const cont     = Math.max(0, (collab?collab.contract:0) - heuresCPMois);
              const diff     = planned-cont;
              const pct      = cont>0?Math.min(100,Math.round((planned/cont)*100)):0;
              return (
                <div style={{ padding:"0 16px" }}>
                  {cpPosesMois > 0 && (
                    <div style={{ background:"#F0FDF4", borderRadius:10, padding:"10px 14px", marginBottom:10, display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:12, color:"#2E8B57" }}>Absences ce mois : {cpPosesMois}j ({heuresCPMois}h deduits)</span>
                      <span style={{ fontSize:12, fontWeight:700, color:"#2E8B57" }}>Contrat ajuste : {cont}h</span>
                    </div>
                  )}
                  <div style={S.kpiRow}>
                    <KpiBox value={planned+"h"} label="Planifiees"  color="#1E2F4F"/>
                    <KpiBox value={cont+"h"}    label={cpPosesMois>0?"Contrat ajuste":"Contrat"} color="#6B7280"/>
                    <KpiBox value={Math.abs(diff)+"h"} label={diff>0?"Sup":"Restantes"} color={diff>0?"#C0392B":"#2E8B57"}/>
                    <KpiBox value={pct+"%"}     label="Occupation"  color="#D4AF37"/>
                  </div>
                  <div style={{ background:"#E5E7EB",borderRadius:3,height:5,overflow:"hidden",marginTop:8,marginBottom:12 }}>
                    <div style={{ height:"100%",width:pct+"%",background:pct>=100?"#2E8B57":pct>=80?"#D97706":"#C0392B",transition:"width .4s",borderRadius:3 }}/>
                  </div>
                  {/* Detail par semaine */}
                  <SectionTitle title="Par semaine" sub="" />
                  {(()=>{
                    const weeks=[];
                    const first=new Date(hYear,hMonth,1);
                    const last=new Date(hYear,hMonth+1,0);
                    let cur=new Date(first);
                    cur.setDate(cur.getDate()-((cur.getDay()+6)%7));
                    while(cur<=last){
                      const ws=cur.toISOString().split("T")[0];
                      const we=new Date(cur);we.setDate(cur.getDate()+6);
                      const wed=we.toISOString().split("T")[0];
                      const wH=calcHours(myA.filter(a=>a.date>=ws&&a.date<=wed));
                      weeks.push({ws,we:wed,wH});
                      cur=new Date(cur);cur.setDate(cur.getDate()+7);
                    }
                    return weeks.map((w,i)=>(
                      <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",background:"#ffffff",borderRadius:10,padding:"10px 14px",marginBottom:6,boxShadow:"0 1px 4px rgba(30,47,79,.04)" }}>
                        <span style={{ fontSize:12,color:"#6B7280" }}>
                          {new Date(w.ws+"T12:00:00").getDate()} - {new Date(w.we+"T12:00:00").getDate()} {MONTH_NAMES[hMonth].slice(0,3)} {hYear}
                        </span>
                        <span style={{ fontSize:13,fontWeight:700,color:w.wH>0?"#1E2F4F":"#D1D5DB" }}>{w.wH}h</span>
                      </div>
                    ));
                  })()}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── MISSIONS : navigation mois par mois ── */}
        {tab==="cp" && (
          <div style={{ padding:"0 16px" }}>
            <CPSoldeCard
              collabId={user.collaboratorId||""}
              cpHours={myEx.cpHours||0}
              assignments={assignments}
              contractDate={myEx.contractDate}
            />
            <button style={{ ...S.btnGold, width:"100%", marginBottom:8 }} onClick={() => setCpModal(true)}>
              Demander des conges payes
            </button>
            <button style={{ ...S.btn, width:"100%", marginBottom:16, background:"#FFF7ED", color:"#C2410C", border:"1.5px solid #FED7AA" }} onClick={() => setCssModal(true)}>
              Demander un conge sans solde
            </button>
            <SectionTitle title="Mes demandes" />
            {myRequests.length === 0 && <Empty text="Aucune demande en cours" />}
            {myRequests.map(req => (
              <div key={req.id} style={{ background:"#ffffff", borderRadius:12, padding:"12px 14px", marginBottom:8, boxShadow:"0 1px 4px rgba(30,47,79,.05)", borderLeft:"4px solid "+(req.status==="pending"?"#D4AF37":req.status==="approved"?"#2E8B57":"#C0392B") }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color:"#1E2F4F" }}>{req.dates.length} jour{req.dates.length>1?"s":""}</div>
                    <div style={{ fontSize:11, color:"#6B7280" }}>{fmtDateFR(req.dates[0])}{req.dates.length>1?" -> "+fmtDateFR(req.dates[req.dates.length-1]):""}</div>
                  </div>
                  <div style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:6,
                    background:req.status==="pending"?"#FFFBEB":req.status==="approved"?"#ECFDF5":"#FEF2F2",
                    color:req.status==="pending"?"#92400E":req.status==="approved"?"#2E8B57":"#C0392B" }}>
                    {req.status==="pending"?"En attente":req.status==="approved"?"Validee":"Refusee"}
                  </div>
                </div>
                {req.comment && <div style={{ fontSize:11, color:"#9CA3AF", fontStyle:"italic", marginTop:4 }}>"{req.comment}"</div>}
              </div>
            ))}
            {cpModal && (
              <CPRequestModal
                collabId={user.collaboratorId||""}
                cpHours={myEx.cpHours||0}
                assignments={assignments}
                onClose={() => setCpModal(false)}
                onSubmit={addCpRequest}
              />
            )}
            <SectionTitle title="Mes conges sans solde" />
            {myCssRequests.length === 0 && <Empty text="Aucune demande sans solde" />}
            {myCssRequests.map(req => (
              <div key={req.id} style={{ background:"#ffffff", borderRadius:12, padding:"12px 14px", marginBottom:8, boxShadow:"0 1px 4px rgba(30,47,79,.05)", borderLeft:"4px solid "+(req.status==="pending"?"#F97316":req.status==="approved"?"#2E8B57":"#C0392B") }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color:"#1E2F4F" }}>{req.dates.length}j sans solde</div>
                    <div style={{ fontSize:11, color:"#6B7280" }}>{fmtDateFR(req.dates[0])}{req.dates.length>1?" -> "+fmtDateFR(req.dates[req.dates.length-1]):""}</div>
                  </div>
                  <div style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:6,
                    background:req.status==="pending"?"#FFF7ED":req.status==="approved"?"#ECFDF5":"#FEF2F2",
                    color:req.status==="pending"?"#C2410C":req.status==="approved"?"#2E8B57":"#C0392B" }}>
                    {req.status==="pending"?"En attente":req.status==="approved"?"Valide":"Refuse"}
                  </div>
                </div>
                {req.comment && <div style={{ fontSize:11, color:"#9CA3AF", fontStyle:"italic", marginTop:4 }}>"{req.comment}"</div>}
              </div>
            ))}
            {cssModal && (
              <CPRequestModal
                collabId={user.collaboratorId||""}
                cpHours={999}
                assignments={[]}
                onClose={() => setCssModal(false)}
                onSubmit={(req) => addCssRequest({...req, type:"css"})}
                isCss={true}
              />
            )}
          </div>
        )}

        {tab==="missions" && (
          <div style={{ padding:"8px 0" }}>
            <MonthNav y={mYear} m={mMonth} setY={setMYear} setM={setMMonth} onToday={()=>{setMYear(2026);setMMonth(5);}} />
            {(()=>{
              const monthStr   = mYear+"-"+String(mMonth+1).padStart(2,"0");
              const monthMiss  = myA.filter(a=>a.date.startsWith(monthStr)&&isMission(a.locationId)&&isWorkType(a.typeId));
              return (
                <div style={{ padding:"0 16px" }}>
                  {monthMiss.length===0 ? (
                    <Empty text={"Aucune mission en "+MONTH_NAMES[mMonth]+" "+mYear} />
                  ) : monthMiss.map(m=>{
                    const d   = new Date(m.date+"T12:00:00");
                    const loc = MISSIONS.find(x=>x.id===m.locationId);
                    const mCol= loc?(MISSION_COLORS[loc.name]||"#1E2F4F"):"#1E2F4F";
                    const team= assignments.filter(a=>a.locationId===m.locationId&&a.date===m.date&&a.collaboratorId!==user.collaboratorId&&isWorkType(a.typeId));
                    return (
                      <div key={m.id} style={{ ...S.missionCard, borderLeft:"4px solid "+mCol }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                          <div>
                            <div style={{ fontWeight:700,fontSize:14,color:"#1E2F4F" }}>{loc?loc.name:m.locationId}</div>
                            <div style={{ fontSize:11,color:"#6B7280" }}>{DAY_NAMES[d.getDay()]} {d.getDate()} {MONTH_NAMES[d.getMonth()]} {d.getFullYear()}</div>
                          </div>
                          <StatusTag label={m.hours+"h"} color="#1E2F4F" bg="#FFFBEB"/>
                        </div>
                        {team.length>0&&(
                          <div>
                            <div style={{ fontSize:10,color:"#9CA3AF",marginBottom:5 }}>Equipe</div>
                            <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                              {team.map(t=>{
                                const tc=COLLABORATORS.find(x=>x.id===t.collaboratorId);
                                return tc?(
                                  <div key={t.id} style={{ display:"flex",alignItems:"center",gap:5,background:"#F8F9FB",borderRadius:8,padding:"3px 8px" }}>
                                    <ColAvatar c={tc} size={18}/>
                                    <span style={{ fontSize:11,color:"#2C2C2C" }}>{tc.name.split(" ")[0]}</span>
                                  </div>
                                ):null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>
      <BottomNav tabs={tabs} active={tab} onChange={setTab} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// VUES ADMIN
// ════════════════════════════════════════════════════════════
function AdminDashboard({ assignments, setModal, rates }) {
  const todayA = assignments.filter(a => a.date===TODAY);
  const active = todayA.filter(a => isWorkType(a.typeId));
  const absent = todayA.filter(a => !isWorkType(a.typeId));
  const noA    = COLLABORATORS.filter(c => !todayA.find(a => a.collaboratorId===c.id));
  const entToday = [...new Set(active.filter(a => isMission(a.locationId)).map(a => a.locationId))];
  const caToday  = active.reduce((s,a) => s+estCollab(a.collaboratorId,a.hours,rates), 0);
  const caWeek   = assignments.filter(a => WEEK_DAYS.some(d => d.date===a.date) && isWorkType(a.typeId)).reduce((s,a) => s+estCollab(a.collaboratorId,a.hours,rates), 0);
  const mGroups  = groupMissions(todayA);
  const alerts   = COLLABORATORS.map(c => { const ph=calcHours(assignments.filter(a=>a.collaboratorId===c.id)); return ph>c.contract?{name:c.name,over:ph-c.contract}:null; }).filter(Boolean);

  return (
    <div style={S.page}>
      <div style={S.kpiRow}>
        <KpiBox value={active.length}    label="Actifs"      color="#1E2F4F" />
        <KpiBox value={noA.length}       label="Disponibles" color="#2E8B57" />
        <KpiBox value={absent.length}    label="Absents"     color="#C0392B" />
        <KpiBox value={entToday.length}  label="Missions"    color="#D4AF37" />
      </div>

      <div style={S.row2}>
        <CaCard label="CA aujourd'hui" value={caToday} />
        <CaCard label="CA semaine"     value={caWeek}  dark />
      </div>

      <SectionTitle title="Aujourd'hui" sub="Mar 10 juin 2026" />
      <div style={S.cardList}>
        {COLLABORATORS.map(c => {
          const a = todayA.find(x => x.collaboratorId===c.id);
          const abs = a && !isWorkType(a.typeId) ? absStyle(a.typeId) : null;
          return (
            <div key={c.id} style={{ ...S.card, opacity: !a ? 0.5 : 1 }}>
              <ColAvatar c={c} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13, color:"#1E2F4F" }}>{c.name}</div>
                <div style={{ fontSize:11, color:"#6B7280" }}>
                  {a ? getLocName(a.locationId) + (a.hours>0 ? " · "+a.hours+"h" : "") : "Non planifie"}
                </div>
              </div>
              {a && isWorkType(a.typeId)  && <StatusTag label="Travail"    color="#1E2F4F" bg="#FFFBEB" />}
              {a && !isWorkType(a.typeId) && abs && <StatusTag label={getLocName(a.locationId)} color={abs.textColor} bg={abs.bg} />}
              {!a && <StatusTag label="Disponible" color="#2E8B57" bg="#ECFDF5" />}
            </div>
          );
        })}
      </div>

      {mGroups.length > 0 && (
        <div>
          <SectionTitle title="Missions entreprises" sub="Aujourd'hui" />
          {mGroups.map((g, i) => <MissionGroupCard key={i} group={g} rates={rates} />)}
        </div>
      )}

      {alerts.length > 0 && (
        <div>
          <SectionTitle title="Alertes" sub="Heures sup" />
          <div style={S.cardList}>
            {alerts.map((al, i) => (
              <div key={i} style={{ background:"#FFFBEB", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#92400E", borderLeft:"3px solid #D97706" }}>
                {al.name} — +{al.over}h potentielles
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function groupMissions(assignments) {
  const map = {};
  assignments.forEach(a => {
    if (!isMission(a.locationId) || !isWorkType(a.typeId)) return;
    const k = a.date + "::" + a.locationId;
    if (!map[k]) map[k] = { date:a.date, locationId:a.locationId, assignments:[] };
    map[k].assignments.push(a);
  });
  return Object.values(map).sort((a,b) => a.date.localeCompare(b.date));
}

function MissionGroupCard({ group, rates }) {
  const collabs = group.assignments.map(a => COLLABORATORS.find(c => c.id===a.collaboratorId)).filter(Boolean);
  const totalH  = group.assignments.reduce((s,a) => s+a.hours, 0);
  const ca      = group.assignments.reduce((s,a) => s+estCollab(a.collaboratorId,a.hours,rates), 0);
  const d       = new Date(group.date+"T12:00:00");
  const locName = (MISSIONS.find(m => m.id===group.locationId)||{}).name || group.locationId;
  const mCol    = MISSION_COLORS[locName] || "#1E2F4F";
  return (
    <div style={{ ...S.missionCard, margin:"0 16px 8px", borderLeft:"4px solid "+mCol }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:12, color:"#6B7280", marginBottom:6 }}>{DAY_NAMES[d.getDay()]} {d.getDate()} {MONTH_NAMES[d.getMonth()]}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {collabs.map(c => (
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <ColAvatar c={c} size={22} />
                <span style={{ fontSize:12, fontWeight:600, color:"#1E2F4F" }}>{c.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:11, color:"#6B7280" }}>{collabs.length} pers · {totalH}h</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#D4AF37" }}>{fmtEur(Math.round(ca))}</div>
        </div>
      </div>
    </div>
  );
}

function PlanningView({ assignments, setModal }) {
  const [selDate,   setSelDate]   = useState(TODAY);
  const [weekStart, setWeekStart] = useState("2026-06-09");
  const [viewMode,  setViewMode]  = useState("week"); // "week" | "cal" | "timeline"
  const [calYear,   setCalYear]   = useState(2026);
  const [calMonth,  setCalMonth]  = useState(5);
  const [tlYear,    setTlYear]    = useState(2026);
  const [tlMonth,   setTlMonth]   = useState(5);

  const weekDates = Array.from({ length:7 }, (_, i) => {
    const d = new Date(weekStart+"T12:00:00"); d.setDate(d.getDate()+i); return d.toISOString().split("T")[0];
  });

  // Calendrier mensuel
  const firstDay   = new Date(calYear, calMonth, 1);
  const lastDay    = new Date(calYear, calMonth+1, 0);
  const startDow   = (firstDay.getDay()+6)%7;
  const totalCells = Math.ceil((startDow+lastDay.getDate())/7)*7;
  const calCells   = Array.from({length:totalCells},(_,i)=>{
    const n=i-startDow+1;
    if(n<1||n>lastDay.getDate()) return null;
    const ds = calYear+"-"+String(calMonth+1).padStart(2,"0")+"-"+String(n).padStart(2,"0");
    return {n,ds};
  });
  const prevCal=()=>{ if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1);};
  const nextCal=()=>{ if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1);};

  return (
    <div style={S.page}>
      {/* Bascule vue */}
      <div style={{ display:"flex", padding:"8px 16px 4px", gap:4 }}>
        {[{id:"week",label:"Semaine"},{id:"cal",label:"Calendrier"},{id:"timeline",label:"Timeline"}].map(v=>(
          <button key={v.id} onClick={()=>setViewMode(v.id)}
            style={{ flex:1, border:"none", borderRadius:8, padding:"7px", fontSize:11, fontWeight:600, cursor:"pointer",
              background: viewMode===v.id?"#1E2F4F":"#F8F9FB",
              color:      viewMode===v.id?"#D4AF37":"#6B7280" }}>
            {v.label}
          </button>
        ))}
        <button style={{ ...S.btnGold, fontSize:11, padding:"7px 10px", flexShrink:0 }} onClick={() => setModal({ type:"new", data:{ date:selDate } })}>+</button>
      </div>

      {/* ── VUE SEMAINE ── */}
      {viewMode==="week" && (
        <div>
          <WeekNav weekDates={weekDates}
            onPrev={() => { const ws=new Date(weekStart+"T12:00:00"); ws.setDate(ws.getDate()-7); setWeekStart(ws.toISOString().split('T')[0]); }}
            onNext={() => { const ws=new Date(weekStart+"T12:00:00"); ws.setDate(ws.getDate()+7); setWeekStart(ws.toISOString().split('T')[0]); }}
          />
          <div style={S.dayTabs}>
            {weekDates.map(ds => {
              const d = new Date(ds+"T12:00:00");
              return (
                <button key={ds}
                  style={{ ...S.dayTab, ...(selDate===ds ? S.dayTabActive : {}), ...(ds===TODAY ? { fontWeight:700 } : {}) }}
                  onClick={() => setSelDate(ds)}
                >
                  <span style={{ fontSize:9, opacity:.7 }}>{DAY_NAMES[d.getDay()]}</span>
                  <span style={{ fontSize:13, fontWeight:600 }}>{d.getDate()}</span>
                </button>
              );
            })}
          </div>
          <div style={{ padding:"4px 16px 8px" }}>
            <span style={{ fontSize:12, color:"#6B7280" }}>
              {DAY_NAMES[new Date(selDate+"T12:00:00").getDay()]} {new Date(selDate+"T12:00:00").getDate()} {MONTH_NAMES[new Date(selDate+"T12:00:00").getMonth()]}
            </span>
          </div>
          <div style={S.cardList}>
            {COLLABORATORS.map(c => {
              const a = assignments.find(x => x.collaboratorId===c.id && x.date===selDate);
              const abs = a && !isWorkType(a.typeId) ? absStyle(a.typeId) : null;
              const cxEx = (COLLAB_EXTRA||{})[c.id]||{};
              const selDow = new Date(selDate+"T12:00:00").getDay();
              const isNoWork = (cxEx.noWorkDays||[]).includes(selDow);
              return (
                <div key={c.id}
                  style={{...S.planRow,borderLeft:"4px solid "+(isNoWork?"#FCA5A5":a?(isWorkType(a.typeId)?c.color:(abs?abs.border:"#9CA3AF")):"#E5E7EB"),background:isNoWork?"#FFF5F5":"#ffffff"}}
                  onClick={()=>isNoWork?alert("Ce collaborateur ne travaille pas ce jour. Affectation sur demande et validation admin."):setModal({type:a?"edit":"new",data:{assignment:a,collaborator:c,date:selDate}})}
                >
                  <ColAvatar c={c} size={32}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13,color:isNoWork?"#C0392B":"#1E2F4F"}}>{c.name}</div>
                    {isNoWork?<div style={{fontSize:10,color:"#C0392B"}}>Jour non travaille — sur demande</div>
                    :a?<div style={{fontSize:11,color:isWorkType(a.typeId)?"#2D456B":(abs?abs.textColor:"#6B7280")}}>{getLocName(a.locationId)}{a.hours>0?" · "+a.hours+"h":""}</div>
                    :<div style={{fontSize:11,color:"#9CA3AF"}}>Non planifie</div>}
                  </div>
                  {!isNoWork&&a&&isWorkType(a.typeId)&&<StatusTag label="Travail" color="#1E2F4F" bg="#FFFBEB"/>}
                  {!isNoWork&&a&&!isWorkType(a.typeId)&&abs&&<StatusTag label={getLocName(a.locationId)} color={abs.textColor} bg={abs.bg}/>}
                  {!isNoWork&&!a&&<span style={{color:"#D1D5DB",fontSize:20}}>+</span>}
                  {isNoWork&&<StatusTag label="Sur demande" color="#C0392B" bg="#FEF2F2"/>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── VUE CALENDRIER MENSUEL ── */}
      {viewMode==="cal" && (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 16px 6px" }}>
            <button onClick={prevCal} style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F", fontSize:16 }}>&#8249;</button>
            <div style={{ flex:1, textAlign:"center", fontWeight:700, fontSize:14, color:"#1E2F4F" }}>{MONTH_NAMES[calMonth]} {calYear}</div>
            <button onClick={()=>{setCalYear(2026);setCalMonth(5);}} style={{ ...S.btn, padding:"5px 10px", background:"#FFFBEB", color:"#1E2F4F", fontSize:11 }}>Auj.</button>
            <button onClick={nextCal} style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F", fontSize:16 }}>&#8250;</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"0 8px 2px", gap:2 }}>
            {["L","M","M","J","V","S","D"].map((d,i)=>(
              <div key={i} style={{ textAlign:"center", fontSize:10, fontWeight:600, color:i>=5?"#C0392B":"#9CA3AF", paddingBottom:2 }}>{d}</div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, padding:"0 8px 8px" }}>
            {calCells.map((cell,i) => {
              if(!cell) return (<div key={i} style={{ minHeight:44 }}/>);
              const {n,ds} = cell;
              const isToday = ds===TODAY;
              const isSelected = ds===selDate;
              const dayA = assignments.filter(a=>a.date===ds&&isWorkType(a.typeId));
              const absent = assignments.filter(a=>a.date===ds&&!isWorkType(a.typeId));
              return (
                <div key={i}
                  onClick={()=>{setSelDate(ds);setViewMode("week");const d=new Date(ds+"T12:00:00");d.setDate(d.getDate()-((d.getDay()+6)%7));setWeekStart(d.toISOString().split("T")[0]);}}
                  style={{ minHeight:44, borderRadius:6, background:isToday?"#FFFBEB":isSelected?"#EFF6FF":"#ffffff",
                    border:"1px solid "+(isToday?"#D4AF37":isSelected?"#BFDBFE":"#F8F9FB"),
                    padding:"3px", cursor:"pointer" }}>
                  <div style={{ fontSize:10, fontWeight:isToday?700:400, color:isToday?"#D4AF37":(i%7)>=5?"#C0392B":"#6B7280", marginBottom:2 }}>{n}</div>
                  {dayA.length>0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:1 }}>
                      {dayA.slice(0,3).map(a=>{
                        const c=COLLABORATORS.find(x=>x.id===a.collaboratorId);
                        return c?<div key={a.id} style={{width:6,height:6,borderRadius:3,background:c.color,flexShrink:0}}/>:null;
                      })}
                      {dayA.length>3&&<div style={{fontSize:7,color:"#9CA3AF"}}>+{dayA.length-3}</div>}
                    </div>
                  )}
                  {absent.length>0&&dayA.length===0&&<div style={{width:6,height:6,borderRadius:3,background:"#E5E7EB"}}/>}
                </div>
              );
            })}
          </div>
          <div style={{ padding:"0 16px 6px", fontSize:11, color:"#6B7280", textAlign:"center" }}>
            Cliquer sur un jour pour le voir en detail
          </div>
        </div>
      )}

      {/* ── VUE TIMELINE (Gantt horizontal) ── */}
      {viewMode==="timeline" && (
        <PlanningTimeline
          assignments={assignments}
          year={tlYear} month={tlMonth}
          onPrev={()=>{ if(tlMonth===0){setTlYear(y=>y-1);setTlMonth(11);}else setTlMonth(m=>m-1); }}
          onNext={()=>{ if(tlMonth===11){setTlYear(y=>y+1);setTlMonth(0);}else setTlMonth(m=>m+1); }}
          onToday={()=>{ setTlYear(2026);setTlMonth(5); }}
          onCellClick={(cId,ds)=>setModal({type:"new",data:{collaborator:COLLABORATORS.find(c=>c.id===cId),date:ds}})}
          onBlockClick={(a)=>setModal({type:"edit",data:{assignment:a,collaborator:COLLABORATORS.find(c=>c.id===a.collaboratorId),date:a.date}})}
        />
      )}
    </div>
  );
}

function MissionsView({ assignments, rates }) {
  const [calYear,  setCalYear]  = useState(2026);
  const [calMonth, setCalMonth] = useState(5);
  const monthStr = calYear+"-"+String(calMonth+1).padStart(2,"0");
  const prevMonth=()=>{ if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1);};
  const nextMonth=()=>{ if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1);};

  const monthA    = assignments.filter(a => a.date.startsWith(monthStr));
  const allGroups = groupMissions(monthA);
  const byLoc = {};
  allGroups.forEach(g => { if (!byLoc[g.locationId]) byLoc[g.locationId]=[]; byLoc[g.locationId].push(g); });

  const totalMissions = allGroups.length;
  const totalCA = allGroups.reduce((s,g) => s+g.assignments.reduce((s2,a)=>s2+estCollab(a.collaboratorId,a.hours,rates),0), 0);

  return (
    <div style={S.page}>
      {/* Navigation mois */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px 4px" }}>
        <button onClick={prevMonth} style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F", fontSize:16 }}>&#8249;</button>
        <div style={{ flex:1, textAlign:"center", fontWeight:700, fontSize:14, color:"#1E2F4F" }}>{MONTH_NAMES[calMonth]} {calYear}</div>
        <button onClick={()=>{setCalYear(2026);setCalMonth(5);}} style={{ ...S.btn, padding:"5px 10px", background:"#FFFBEB", color:"#1E2F4F", fontSize:11 }}>Auj.</button>
        <button onClick={nextMonth} style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F", fontSize:16 }}>&#8250;</button>
      </div>

      {/* KPIs mois */}
      <div style={S.kpiRow}>
        <KpiBox value={String(totalMissions)} label="Missions" color="#1E2F4F" />
        <KpiBox value={fmtEur(Math.round(totalCA))} label="CA estimatif" color="#D4AF37" />
      </div>

      {/* Par mission */}
      {MISSIONS.map(m => {
        const gs  = byLoc[m.id];
        const mCol = MISSION_COLORS[m.name] || "#1E2F4F";
        return (
          <div key={m.id} style={{ borderBottom:"1px solid #F8F9FB", paddingBottom:8, marginBottom:4 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px 6px" }}>
              <div style={{ width:10, height:10, borderRadius:5, background:mCol }} />
              <span style={{ fontWeight:700, fontSize:15, color:"#1E2F4F" }}>{m.name}</span>
              {(!gs || !gs.length) && <span style={{ fontSize:11, color:"#9CA3AF", marginLeft:"auto" }}>Aucune mission</span>}
              {gs && gs.length>0 && <span style={{ fontSize:11, color:mCol, marginLeft:"auto", fontWeight:600 }}>{gs.length} session{gs.length>1?"s":""}</span>}
            </div>
            {gs && gs.map((g, i) => <MissionGroupCard key={i} group={g} rates={rates} />)}
          </div>
        );
      })}
      {totalMissions===0 && <Empty text={"Aucune mission en "+MONTH_NAMES[calMonth]} />}
    </div>
  );
}

function CollaboratorsView({ assignments, setModal, jobCategories, skills, sectors, collabExtras, updateCollabExtra, dynCollaborators, addCollaborator }) {
  const [sel,    setSel]    = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "active" | "inactive"
  const [mode,   setMode]   = useState("list"); // "list" | "create"

  const collabSource = dynCollaborators || COLLABORATORS;
  const filtered = collabSource.filter(c => {
    const ex   = collabExtras[c.id] || {};
    const matchStatus = filter==="all" || (filter==="active"?ex.status!=="inactive":ex.status==="inactive");
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || (ex.jobCategory||"").toLowerCase().includes(q) || (ex.sector||"").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  if (sel) {
    return (<CollaboratorDetail c={sel} assignments={assignments} onBack={() => setSel(null)} setModal={setModal} collabExtras={collabExtras} updateCollabExtra={updateCollabExtra} />);
  }

  return (
    <div style={S.page}>
      {/* Barre de recherche + filtre */}
      <div style={{ padding:"10px 16px 6px", display:"flex", gap:8 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          style={{ ...S.input, flex:1, margin:0, padding:"9px 12px", fontSize:12 }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ ...S.input, width:100, margin:0, padding:"9px 8px", fontSize:12 }}>
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>

      <div style={{ padding:"2px 16px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:11, color:"#6B7280" }}>{filtered.length} collaborateur{filtered.length!==1?"s":""}</span>
        <button style={{ ...S.btnGold, fontSize:11, padding:"6px 12px" }} onClick={() => setMode("create")}>
          + Nouveau
        </button>
      </div>

      <div style={S.cardList}>
        {filtered.map(c => {
          const ex      = collabExtras[c.id] || {};
          const planned = calcHours(assignments.filter(a => a.collaboratorId===c.id));
          const pct     = Math.min(100, Math.round((planned/c.contract)*100));
          const over    = planned > c.contract;
          const inactive = ex.status === "inactive";
          return (
            <div key={c.id} style={{ ...S.card, opacity: inactive ? 0.55 : 1 }} onClick={() => setSel(c)}>
              <ColAvatar c={c} size={40} />
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontWeight:700, fontSize:13, color:"#1E2F4F" }}>{c.name}</span>
                  {inactive && <StatusTag label="Inactif" color="#6B7280" bg="#F3F4F6" />}
                </div>
                <div style={{ fontSize:11, color:"#6B7280" }}>{ex.jobCategory || "—"} · {ex.sector || "—"}</div>
                <div style={S.progressBar}>
                  <div style={{ ...S.progressFill, width:pct+"%", background: over ? "#C0392B" : c.color }} />
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:12, fontWeight:700, color: over ? "#C0392B" : "#2E8B57" }}>{over?"+":""}{over?planned-c.contract:c.contract-planned}h</div>
                <div style={{ fontSize:10, color:"#9CA3AF" }}>{over?"sup":"restant"}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal creation */}
      {mode==="create" && (
        <CreateCollaboratorModal onClose={() => setMode("list")} addCollaborator={addCollaborator} existingCount={collabSource.length} />
      )}
    </div>
  );
}

function CollaboratorDetail({ c, assignments, onBack, setModal, collabExtras, updateCollabExtra }) {
  const ex      = collabExtras[c.id] || {};
  const myA     = assignments.filter(a => a.collaboratorId===c.id);
  const planned = calcHours(myA);
  const over    = planned > c.contract;
  const pct     = Math.min(100, Math.round((planned/c.contract)*100));
  const [tab, setTab]             = useState("info"); // "info"|"planning"|"hours"|"partner"
  const [planView, setPlanView]   = useState("week"); // "week"|"cal"
  const [planWeek, setPlanWeek]   = useState("2026-06-09");
  const [hYear,    setHYear]      = useState(2026);
  const [hMonth,   setHMonth]     = useState(5);

  // Disponibilite today
  const todayA  = myA.find(a => a.date===TODAY);
  const availStatus = !todayA ? "Disponible" : isWorkType(todayA.typeId) ? "Occupe" : getLocName(todayA.locationId);
  const availColor  = !todayA ? "#2E8B57" : isWorkType(todayA.typeId) ? "#D4AF37" : "#C0392B";

  // ID interne format JCF-COL
  const idNum  = String(COLLABORATORS.findIndex(x => x.id===c.id)+1).padStart(6,"0");
  const internalId = "JCF-COL-" + idNum;

  return (
    <div style={S.page}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:"#D4AF37", fontSize:13, fontWeight:600, padding:"8px 16px", cursor:"pointer" }}>
        &#8592; Equipe
      </button>

      {/* Hero */}
      <div style={{ display:"flex", alignItems:"center", gap:14, padding:"4px 16px 12px" }}>
        <ColAvatar c={c} size={56} />
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
            <span style={{ fontWeight:700, fontSize:18, color:"#1E2F4F" }}>{c.name}</span>
            <StatusTag label={availStatus} color={availColor} bg={availColor+"18"} />
          </div>
          <div style={{ fontSize:12, color:"#6B7280" }}>{ex.jobCategory || "—"}</div>
          <div style={{ fontSize:10, color:"#9CA3AF", fontFamily:"monospace", marginTop:2 }}>{internalId}</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={S.kpiRow}>
        <KpiBox value={planned+"h"} label="Planifiees" color="#1E2F4F" />
        <KpiBox value={Math.abs(planned-c.contract)+"h"} label={over?"Sup":"Restantes"} color={over?"#C0392B":"#2E8B57"} />
        <KpiBox value={pct+"%"}     label="Occupation" color="#D4AF37" />
      </div>
      <div style={{ padding:"0 16px 8px" }}>
        <div style={S.progressBar}>
          <div style={{ ...S.progressFill, width:pct+"%", background: over ? "#C0392B" : c.color }} />
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display:"flex", padding:"0 16px 12px", gap:4, overflowX:"auto" }}>
        {[{id:"info",label:"Fiche"},{id:"planning",label:"Planning"},{id:"hours",label:"Heures"},{id:"partner",label:"Partenaire"}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, border:"none", borderRadius:8, padding:"8px 4px", fontSize:11, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap",
              background: tab===t.id ? "#1E2F4F" : "#F8F9FB",
              color:      tab===t.id ? "#D4AF37" : "#6B7280" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ONGLET FICHE (editable) ── */}
      {tab==="info" && (
        <div style={{ padding:"0 16px" }}>

          {/* Contrat — champs numeriques editables */}
          <EditSection title="Contrat">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:4 }}>Mensuel (h)</div>
                <input type="number" min={0}
                  value={ex.contract !== undefined ? ex.contract : c.contract}
                  onChange={e => updateCollabExtra(c.id, "contract", parseInt(e.target.value)||0)}
                  style={{ ...S.input, margin:0, padding:"8px 10px", fontWeight:700, fontSize:15, color:"#1E2F4F", textAlign:"center" }}
                />
              </div>
              <div>
                <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:4 }}>Hebdomadaire (h)</div>
                <input type="number" min={0}
                  value={ex.weeklyHours !== undefined ? ex.weeklyHours : c.weeklyHours}
                  onChange={e => updateCollabExtra(c.id, "weeklyHours", parseInt(e.target.value)||0)}
                  style={{ ...S.input, margin:0, padding:"8px 10px", fontWeight:700, fontSize:15, color:"#1E2F4F", textAlign:"center" }}
                />
              </div>
            </div>
          </EditSection>

          {/* Categorie metier */}
          <EditSection title="Categorie metier">
            <select value={ex.jobCategory || ""}
              onChange={e => updateCollabExtra(c.id, "jobCategory", e.target.value)}
              style={{ ...S.input, margin:0 }}>
              {INITIAL_JOB_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </EditSection>

          {/* Secteurs */}
          <EditSection title="Secteurs">
            <div style={{ display:"flex", gap:8 }}>
              <select value={ex.sector || ""}
                onChange={e => updateCollabExtra(c.id, "sector", e.target.value)}
                style={{ ...S.input, margin:0, flex:1 }}>
                <option value="">— Principal</option>
                {INITIAL_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={ex.sectorAlt || ""}
                onChange={e => updateCollabExtra(c.id, "sectorAlt", e.target.value)}
                style={{ ...S.input, margin:0, flex:1 }}>
                <option value="">— Secondaire</option>
                {INITIAL_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </EditSection>

          {/* Competences */}
          <EditSection title="Competences">
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {INITIAL_SKILLS.map(s => {
                const active = (ex.skills||[]).includes(s);
                return (
                  <button key={s}
                    onClick={() => {
                      const curr = ex.skills || [];
                      updateCollabExtra(c.id, "skills", active ? curr.filter(x=>x!==s) : [...curr, s]);
                    }}
                    style={{ border:"1.5px solid "+(active?"#D4AF37":"#E5E7EB"), borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:600, cursor:"pointer", background:active?"#FFFBEB":"#F8F9FB", color:active?"#1E2F4F":"#6B7280" }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </EditSection>

          {/* Contact */}
          <EditSection title="Contact">
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { label:"Pays",      field:"country", placeholder:"Luxembourg", type:"text"  },
                { label:"Telephone", field:"phone",   placeholder:"+352 ...",   type:"tel"   },
                { label:"E-mail",    field:"email",   placeholder:"prenom@...", type:"email" },
              ].map(row => (
                <div key={row.field} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:11, color:"#9CA3AF", width:72, flexShrink:0 }}>{row.label}</span>
                  <input type={row.type} value={ex[row.field]||""} placeholder={row.placeholder}
                    onChange={e => updateCollabExtra(c.id, row.field, e.target.value)}
                    style={{ ...S.input, margin:0, flex:1, padding:"7px 10px", fontSize:12 }}
                  />
                </div>
              ))}
            </div>
          </EditSection>

          {/* Commentaire interne */}
          <EditSection title="Commentaire interne">
            <textarea value={ex.comment||""} placeholder="Notes internes..."
              onChange={e => updateCollabExtra(c.id, "comment", e.target.value)}
              style={{ ...S.input, margin:0, resize:"none", height:60, lineHeight:1.5, fontSize:12 }}
            />
          </EditSection>

          {/* Statut actif / inactif */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#ffffff", borderRadius:12, padding:"12px 14px", marginBottom:8, boxShadow:"0 1px 4px rgba(30,47,79,.05)" }}>
            <div>
              <div style={{ fontSize:11, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px" }}>Statut</div>
              <div style={{ fontWeight:600, fontSize:13, color:"#1E2F4F", marginTop:4 }}>{ex.status==="inactive"?"Inactif":"Actif"}</div>
            </div>
            <button onClick={() => updateCollabExtra(c.id, "status", ex.status==="inactive"?"active":"inactive")}
              style={{ border:"none", borderRadius:20, padding:"6px 14px", fontSize:11, fontWeight:600, cursor:"pointer",
                background: ex.status==="inactive"?"#ECFDF5":"#FEF2F2",
                color:      ex.status==="inactive"?"#2E8B57":"#C0392B" }}>
              {ex.status==="inactive" ? "Reactiver" : "Desactiver"}
            </button>
          </div>

          {/* Conges Payes — solde et alerte */}
          {ex.cpHours > 0 && (
            <CPSoldeCard
              collabId={c.id}
              cpHours={ex.cpHours}
              assignments={assignments}
              contractDate={ex.contractDate}
            />
          )}
          {ex.contractDate && (
            <div style={{ fontSize:11, color:"#6B7280", marginBottom:8 }}>
              CDI depuis le {ex.contractDate}
            </div>
          )}

          {/* ID interne — non modifiable */}
          <div style={{ background:"#F8F9FB", borderRadius:10, padding:"10px 14px", border:"1px solid #E5E7EB" }}>
            <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:2 }}>Identifiant interne · non modifiable</div>
            <div style={{ fontFamily:"monospace", fontSize:12, fontWeight:700, color:"#2D456B", letterSpacing:"0.5px" }}>{internalId}</div>
          </div>

          <div style={{ height:8 }} />
        </div>
      )}

      {/* ── ONGLET PLANNING (semaine + calendrier) ── */}
      {tab==="planning" && (
        <div>
          {/* Bascule vue */}
          <div style={{ display:"flex", padding:"0 16px 8px", gap:6 }}>
            {[{id:"week",label:"Semaine"},{id:"cal",label:"Calendrier"}].map(v=>(
              <button key={v.id} onClick={()=>setPlanView(v.id)}
                style={{ flex:1, border:"none", borderRadius:8, padding:"7px", fontSize:12, fontWeight:600, cursor:"pointer",
                  background: planView===v.id?"#1E2F4F":"#F8F9FB",
                  color:      planView===v.id?"#D4AF37":"#6B7280" }}>
                {v.label}
              </button>
            ))}
          </div>

          {/* Vue semaine */}
          {planView==="week" && (
            <div>
              <WeekNav
                weekDates={Array.from({length:7},(_,i)=>{const d=new Date(planWeek+"T12:00:00");d.setDate(d.getDate()+i);return d.toISOString().split("T")[0];})}
                onPrev={()=>{const d=new Date(planWeek+'T12:00:00');d.setDate(d.getDate()-7);setPlanWeek(d.toISOString().split('T')[0]);}}
                onNext={()=>{const d=new Date(planWeek+'T12:00:00');d.setDate(d.getDate()+7);setPlanWeek(d.toISOString().split('T')[0]);}}
              />
              <div style={S.cardList}>
                {Array.from({length:7},(_,i)=>{const d=new Date(planWeek+"T12:00:00");d.setDate(d.getDate()+i);return d.toISOString().split("T")[0];}).map(ds=>{
                  const a   = myA.find(x => x.date===ds);
                  const abs = a && !isWorkType(a.typeId) ? absStyle(a.typeId) : null;
                  const d   = new Date(ds+"T12:00:00");
                  return (
                    <div key={ds}
                      style={{ ...S.planRow, borderLeft:"4px solid "+(a?(isWorkType(a.typeId)?c.color:(abs?abs.border:"#9CA3AF")):"#E5E7EB") }}
                      onClick={() => setModal({ type:a?"edit":"new", data:{ assignment:a, collaborator:c, date:ds } })}
                    >
                      <div style={{ width:44, fontSize:11, fontWeight:ds===TODAY?700:500, color:ds===TODAY?"#D4AF37":"#6B7280" }}>{DAY_NAMES[d.getDay()]} {d.getDate()}</div>
                      <div style={{ flex:1, fontSize:12, color:isWorkType(a?.typeId)?"#1E2F4F":(abs?abs.textColor:"#9CA3AF") }}>
                        {a?getLocName(a.locationId)+(a.hours>0?" · "+a.hours+"h":""):"-"}
                      </div>
                      {a&&!isWorkType(a.typeId)&&abs&&<StatusTag label={getLocName(a.locationId)} color={abs.textColor} bg={abs.bg}/>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vue calendrier mensuel */}
          {planView==="cal" && (
            <div>
              {(()=>{
                const [cY,setCY]=useState(2026);const [cM,setCM]=useState(5);
                const fD=new Date(cY,cM,1);const lD=new Date(cY,cM+1,0);
                const sDow=(fD.getDay()+6)%7;const tc=Math.ceil((sDow+lD.getDate())/7)*7;
                const cells=Array.from({length:tc},(_,i)=>{const n=i-sDow+1;if(n<1||n>lD.getDate())return null;const ds=cY+"-"+String(cM+1).padStart(2,"0")+"-"+String(n).padStart(2,"0");return{n,ds};});
                return (
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 8px 6px"}}>
                      <button onClick={()=>{if(cM===0){setCY(y=>y-1);setCM(11);}else setCM(m=>m-1);}} style={{...S.btn,padding:"5px 10px",background:"#F8F9FB",color:"#1E2F4F",fontSize:14}}>&#8249;</button>
                      <div style={{flex:1,textAlign:"center",fontWeight:700,fontSize:13,color:"#1E2F4F"}}>{MONTH_NAMES[cM]} {cY}</div>
                      <button onClick={()=>{setCY(2026);setCM(5);}} style={{...S.btn,padding:"5px 8px",background:"#FFFBEB",color:"#1E2F4F",fontSize:10}}>Auj.</button>
                      <button onClick={()=>{if(cM===11){setCY(y=>y+1);setCM(0);}else setCM(m=>m+1);}} style={{...S.btn,padding:"5px 10px",background:"#F8F9FB",color:"#1E2F4F",fontSize:14}}>&#8250;</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0 8px 2px",gap:2}}>
                      {["L","M","M","J","V","S","D"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,fontWeight:600,color:i>=5?"#C0392B":"#9CA3AF"}}>{d}</div>)}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,padding:"0 8px 8px"}}>
                      {cells.map((cell,i)=>{
                        if(!cell) return (<div key={i} style={{minHeight:40}}/>);
                        const{n,ds}=cell;const a=myA.find(x=>x.date===ds);const abs=a&&!isWorkType(a.typeId)?absStyle(a.typeId):null;
                        const isToday=ds===TODAY;
                        return (
                          <div key={i} onClick={()=>setModal({type:a?"edit":"new",data:{assignment:a,collaborator:c,date:ds}})}
                            style={{minHeight:40,borderRadius:6,background:isToday?"#FFFBEB":a&&isWorkType(a.typeId)?c.color+"18":a?"#F3F4F6":"#ffffff",border:"1px solid "+(isToday?"#D4AF37":"#F8F9FB"),padding:"3px",cursor:"pointer"}}>
                            <div style={{fontSize:10,fontWeight:isToday?700:400,color:isToday?"#D4AF37":(i%7)>=5?"#C0392B":"#6B7280"}}>{n}</div>
                            {a&&isWorkType(a.typeId)&&<div style={{width:6,height:6,borderRadius:3,background:c.color,marginTop:2}}/>}
                            {a&&!isWorkType(a.typeId)&&abs&&<div style={{fontSize:7,color:abs.color,marginTop:1}}>{getLocName(a.locationId).slice(0,4)}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── ONGLET HEURES (navigation mois) ── */}
      {tab==="hours" && (
        <div style={{ padding:"8px 16px" }}>
          {/* Nav mois */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <button onClick={()=>{if(hMonth===0){setHYear(y=>y-1);setHMonth(11);}else setHMonth(m=>m-1);}} style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F", fontSize:16 }}>&#8249;</button>
            <div style={{ flex:1, textAlign:"center", fontWeight:700, fontSize:14, color:"#1E2F4F" }}>{MONTH_NAMES[hMonth]} {hYear}</div>
            <button onClick={()=>{setHYear(2026);setHMonth(5);}} style={{ ...S.btn, padding:"5px 10px", background:"#FFFBEB", color:"#1E2F4F", fontSize:11 }}>Auj.</button>
            <button onClick={()=>{if(hMonth===11){setHYear(y=>y+1);setHMonth(0);}else setHMonth(m=>m+1);}} style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F", fontSize:16 }}>&#8250;</button>
          </div>
          {(()=>{
            const monthStr = hYear+"-"+String(hMonth+1).padStart(2,"0");
            const ex = (collabExtras||{})[c.id]||{};
            const contract = ex.contract!==undefined?ex.contract:c.contract;
            const planned  = calcHours(myA.filter(a=>a.date.startsWith(monthStr)));
            const diff     = planned-contract;
            const pct      = contract>0?Math.min(100,Math.round((planned/contract)*100)):0;
            return (
              <div>
                <div style={S.kpiRow}>
                  <KpiBox value={planned+"h"}              label="Planifiees"  color="#1E2F4F" />
                  <KpiBox value={contract+"h"}             label="Contrat"     color="#6B7280" />
                  <KpiBox value={Math.abs(diff)+"h"}       label={diff>0?"Sup":"Restantes"} color={diff>0?"#C0392B":"#2E8B57"} />
                  <KpiBox value={pct+"%"}                  label="Occupation"  color="#D4AF37" />
                </div>
                <div style={{ ...S.progressBar, marginTop:8 }}>
                  <div style={{ ...S.progressFill, width:pct+"%", background:diff>0?"#C0392B":c.color }} />
                </div>
                <div style={{ fontSize:11, marginTop:6, color:diff>0?"#C0392B":diff<0?"#2E8B57":"#6B7280", textAlign:"center" }}>
                  {diff>0?"+"+diff+"h heures sup potentielles":diff<0?Math.abs(diff)+"h restantes sur le contrat":"Contrat atteint ce mois"}
                </div>
                {/* Detail par semaine */}
                <SectionTitle title="Par semaine" sub="" />
                {(()=>{
                  const weeks=[]; const first=new Date(hYear,hMonth,1); const last=new Date(hYear,hMonth+1,0);
                  let cur=new Date(first); cur.setDate(cur.getDate()-((cur.getDay()+6)%7));
                  while(cur<=last){
                    const ws=cur.toISOString().split("T")[0];
                    const we=new Date(cur);we.setDate(cur.getDate()+6);const wed=we.toISOString().split("T")[0];
                    const wA=myA.filter(a=>a.date>=ws&&a.date<=wed);
                    const wH=calcHours(wA);
                    weeks.push({ws,we:wed,wH});
                    cur=new Date(cur);cur.setDate(cur.getDate()+7);
                  }
                  return weeks.map((w,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#ffffff",borderRadius:10,padding:"10px 14px",marginBottom:6,boxShadow:"0 1px 4px rgba(30,47,79,.04)"}}>
                      <span style={{fontSize:12,color:"#6B7280"}}>{new Date(w.ws+"T12:00:00").getDate()} - {new Date(w.we+"T12:00:00").getDate()} {MONTH_NAMES[hMonth].slice(0,3)}</span>
                      <span style={{fontSize:13,fontWeight:700,color:w.wH>0?"#1E2F4F":"#D1D5DB"}}>{w.wH}h</span>
                    </div>
                  ));
                })()}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── ONGLET PRESENTATION PARTENAIRE ── */}
      {tab==="partner" && (
        <div style={{ padding:"0 16px" }}>
          <div style={{ background:"#1E2F4F", borderRadius:16, padding:"20px", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
              <div style={{ width:52, height:52, borderRadius:26, background:"rgba(212,175,55,.2)", border:"2px solid #D4AF37", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontWeight:900, fontSize:16, color:"#D4AF37" }}>{c.avatar}</span>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:18, color:"#ffffff" }}>{c.name.split(" ")[0]} {c.name.split(" ").slice(1).map(s=>s[0]+".").join(" ")}</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.6)" }}>{ex.jobCategory || "—"}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              <div style={{ background:"rgba(255,255,255,.08)", borderRadius:8, padding:"8px 12px", flex:1, textAlign:"center" }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", marginBottom:2 }}>Contrat</div>
                <div style={{ fontWeight:700, fontSize:14, color:"#ffffff" }}>{c.weeklyHours}h/sem</div>
              </div>
              <div style={{ background:"rgba(212,175,55,.12)", borderRadius:8, padding:"8px 12px", flex:1, textAlign:"center", border:"1px solid rgba(212,175,55,.25)" }}>
                <div style={{ fontSize:10, color:"rgba(212,175,55,.7)", marginBottom:2 }}>Selection</div>
                <div style={{ fontWeight:700, fontSize:12, color:"#D4AF37" }}>JCF Luxtalent</div>
              </div>
            </div>
            <div style={{ background:"rgba(212,175,55,.12)", borderRadius:10, padding:"12px 14px", border:"1px solid rgba(212,175,55,.2)" }}>
              <div style={{ fontSize:12, color:"#D4AF37", fontWeight:600, fontStyle:"italic", textAlign:"center" }}>
                Selectionne par JCF Luxtalent
              </div>
            </div>
          </div>
          <div style={{ background:"#FFFBEB", borderRadius:10, padding:"10px 14px", fontSize:11, color:"#92400E", lineHeight:1.6 }}>
            Aucun CV · Aucun historique · Aucune experience detaillee<br/>
            Presentation conforme a la charte JCF Luxtalent
          </div>
        </div>
      )}
    </div>
  );
}

function HoursView({ assignments, collabExtras }) {
  const [mode,      setMode]      = useState("week");  // "week" | "month"
  const [weekStart, setWeekStart] = useState("2026-06-09");
  const [calYear,   setCalYear]   = useState(2026);
  const [calMonth,  setCalMonth]  = useState(5);

  const weekDates = Array.from({length:7},(_,i)=>{
    const d=new Date(weekStart+"T12:00:00"); d.setDate(d.getDate()+i); return d.toISOString().split("T")[0];
  });
  const monthStr  = calYear+"-"+String(calMonth+1).padStart(2,"0");
  const prevMonth = ()=>{ if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1);};
  const nextMonth = ()=>{ if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1);};

  // Filtre selon la periode affichee
  const filteredA = assignments.filter(a =>
    mode==="week" ? weekDates.includes(a.date) : a.date.startsWith(monthStr)
  );

  return (
    <div style={S.page}>
      {/* Bascule semaine / mois */}
      <div style={{ display:"flex", padding:"8px 16px 4px", gap:6 }}>
        {[{id:"week",label:"Semaine"},{id:"month",label:"Mois"}].map(v=>(
          <button key={v.id} onClick={()=>setMode(v.id)}
            style={{ flex:1, border:"none", borderRadius:8, padding:"7px", fontSize:12, fontWeight:600, cursor:"pointer",
              background: mode===v.id?"#1E2F4F":"#F8F9FB",
              color:      mode===v.id?"#D4AF37":"#6B7280" }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Navigation periode */}
      {mode==="week" ? (
        <WeekNav weekDates={weekDates}
          onPrev={()=>{const d=new Date(weekStart+"T12:00:00");d.setDate(d.getDate()-7);setWeekStart(d.toISOString().split("T")[0]);}}
          onNext={()=>{const d=new Date(weekStart+"T12:00:00");d.setDate(d.getDate()+7);setWeekStart(d.toISOString().split("T")[0]);}} />
      ) : (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 16px 6px" }}>
          <button onClick={prevMonth} style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F", fontSize:16 }}>&#8249;</button>
          <div style={{ flex:1, textAlign:"center", fontWeight:700, fontSize:14, color:"#1E2F4F" }}>{MONTH_NAMES[calMonth]} {calYear}</div>
          <button onClick={()=>{setCalYear(2026);setCalMonth(5);}} style={{ ...S.btn, padding:"5px 10px", background:"#FFFBEB", color:"#1E2F4F", fontSize:11 }}>Auj.</button>
          <button onClick={nextMonth} style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F", fontSize:16 }}>&#8250;</button>
        </div>
      )}

      {/* Liste collaborateurs */}
      {COLLABORATORS.map(c => {
        const ex      = (collabExtras||{})[c.id] || {};
        const contract= ex.contract !== undefined ? ex.contract : c.contract;
        const colabA  = filteredA.filter(a => a.collaboratorId===c.id);
        const planned = calcHours(colabA);
        // Déduire les jours CP et CSS du contrat de référence
        const hJour   = ex.weeklyHours ? Math.round(ex.weeklyHours/5*10)/10 : 8;
        const absJours= colabA.filter(a => a.typeId==="cp"||a.typeId==="css").length;
        const absH    = absJours * hJour;
        const ref     = mode==="week"
          ? Math.max(0, Math.round(contract/4.33) - absH)
          : Math.max(0, contract - absH);
        const diff    = planned - ref;
        const pct     = ref>0 ? Math.min(100, Math.round((planned/ref)*100)) : planned>0?100:0;
        return (
          <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, background:"#ffffff", borderRadius:12, padding:"12px 14px", margin:"0 16px 8px", boxShadow:"0 1px 4px rgba(30,47,79,.05)" }}>
            <ColAvatar c={c} size={32} />
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontWeight:600, fontSize:13, color:"#1E2F4F" }}>{c.name}</span>
                <span style={{ fontSize:12, fontVariantNumeric:"tabular-nums" }}>
                  <span style={{ color:c.color, fontWeight:700 }}>{planned}h</span>
                  <span style={{ color:"#9CA3AF" }}> / {ref}h</span>
                </span>
              </div>
              <div style={S.progressBar}>
                <div style={{ ...S.progressFill, width:pct+"%", background: diff>0?"#C0392B":c.color }} />
              </div>
              {absJours>0 && (
                <div style={{ fontSize:10, color:"#8B5CF6", marginBottom:2 }}>
                  {absJours}j abs. ({absH}h deduits du contrat)
                </div>
              )}
              <div style={{ fontSize:11, marginTop:3, color: diff>0?"#C0392B":diff<0?"#2E8B57":"#6B7280" }}>
                {diff>0 ? "+"+diff+"h heures sup" : diff<0 ? Math.abs(diff)+"h restantes" : "Contrat atteint"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RatesView({ rates, updateRate, collabExtras }) {
  const [selCollab, setSel] = useState(COLLABORATORS[0].id);
  const r = rates[selCollab] || {};
  const c = COLLABORATORS.find(x => x.id===selCollab);
  const FIELDS = [
    { key:"weeklyHours",    label:"Heures hebdo",    unit:"h"     },
    { key:"mutuelle",       label:"Mutuelle",        unit:"\u20AC"},
    { key:"hourly",         label:"Tarif heure",     unit:"\u20AC/h"},
    { key:"day",            label:"Tarif journee",   unit:"\u20AC"},
    { key:"week",           label:"Tarif semaine",   unit:"\u20AC"},
    { key:"fortnight",      label:"Tarif quinzaine", unit:"\u20AC"},
    { key:"minimumMonthly", label:"Minimum mensuel", unit:"\u20AC"},
    { key:"month",          label:"Tarif mois",      unit:"\u20AC"},
  ];
  return (
    <div style={S.page}>
      <div style={{ margin:"8px 16px 4px", background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#92400E", fontStyle:"italic" }}>
        Estimation indicative — facturation finale par JCF Luxtalent
      </div>
      <div style={{ padding:"8px 16px 4px" }}>
        <FormLabel text="Collaborateur" />
        <select style={S.input} value={selCollab} onChange={e => setSel(e.target.value)}>
          {COLLABORATORS.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
        </select>
      </div>
      {c && (
        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"0 16px 8px", background:"#F8F9FB", borderRadius:12, padding:"10px 14px" }}>
          <ColAvatar c={c} size={36} />
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:"#1E2F4F" }}>{c.name}</div>
            <div style={{ fontSize:11, color:"#6B7280" }}>
              {(()=>{const ex=(collabExtras||{})[selCollab]||{};const wh=ex.weeklyHours!==undefined?ex.weeklyHours:(r.weeklyHours||0);const ct=ex.contract!==undefined?ex.contract:(c?c.contract:0);return wh+"h/sem · "+ct+"h/mois";})()}
              {" · Mutuelle "}{fmtEur(r.mutuelle||0)}
            </div>
          </div>
        </div>
      )}
      <div style={{ padding:"0 16px" }}>
        {FIELDS.map(f => (
          <div key={f.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#ffffff", borderRadius:10, padding:"10px 14px", marginBottom:6, boxShadow:"0 1px 4px rgba(30,47,79,.05)" }}>
            <div>
              <div style={{ fontWeight:600, fontSize:13, color:"#1E2F4F" }}>{f.label}</div>
              <div style={{ fontSize:11, color:"#9CA3AF" }}>{f.unit}</div>
            </div>
            <input type="number" value={r[f.key]||0} step={f.key==="weeklyHours"?"1":"0.01"} min="0"
              onChange={e => updateRate(selCollab, f.key, e.target.value)}
              style={{ width:90, border:"1.5px solid #E5E7EB", borderRadius:8, padding:"6px 10px", fontSize:13, fontWeight:700, color:"#1E2F4F", textAlign:"right", background:"#F8F9FB" }}
            />
          </div>
        ))}
      </div>
      <SectionTitle title="CA estimatif" sub={c ? c.name : ""} />
      <div style={{ background:"#1E2F4F", borderRadius:12, margin:"0 16px", padding:"14px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>Tarif mensuel</span>
          <span style={{ fontWeight:700, color:"#D4AF37", fontVariantNumeric:"tabular-nums" }}>{fmtEur(r.month||0)}</span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>Minimum mensuel</span>
          <span style={{ fontWeight:600, color:"rgba(255,255,255,.7)", fontVariantNumeric:"tabular-nums" }}>{fmtEur(r.minimumMonthly||0)}</span>
        </div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", marginTop:6 }}>CA estimatif — facturation finale manuelle par JCF Luxtalent</div>
      </div>
      <div style={{ height:24 }} />
    </div>
  );
}

function CaDetailView({ assignments, rates }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const [selYear,  setSelYear]  = useState(currentYear);
  const [selMonth, setSel]      = useState(String(currentYear)+"-"+String(now.getMonth()+1).padStart(2,"0"));

  // Générer les 12 mois de l'année sélectionnée
  const months = Array.from({length:12}, (_,i) => selYear+"-"+String(i+1).padStart(2,"0"));

  const REPAS_SOIR = 18; // €/soir frais de bouche
  const HOTEL_RATE = 120; // €/nuit

  const workA = assignments.filter(a => isWorkType(a.typeId) && a.date.startsWith(selMonth));

  const byCollab = useMemo(() => {
    const m = {};
    workA.forEach(a => {
      if (!m[a.collaboratorId]) m[a.collaboratorId] = { hours:0, budget:0, hotel:0, repas:0, ouverture:0 };
      m[a.collaboratorId].hours     += a.hours;
      m[a.collaboratorId].budget    += budgetAssignment(a, rates);
      m[a.collaboratorId].hotel     += (a.hotelCost||0);
      m[a.collaboratorId].repas     += (a.repasCost||0);
      m[a.collaboratorId].ouverture += (a.ouvertureCost||0);
    });
    return m;
  }, [workA, rates]);

  const byClient = useMemo(() => {
    const m = {};
    workA.forEach(a => { const n=getLocName(a.locationId); if(!m[n])m[n]=0; m[n]+=budgetAssignment(a,rates); });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,8);
  }, [workA, rates]);

  const byMission = useMemo(() => {
    const m = {};
    workA.filter(a=>isMission(a.locationId)).forEach(a => { const n=getLocName(a.locationId); if(!m[n])m[n]=0; m[n]+=budgetAssignment(a,rates); });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  }, [workA, rates]);

  const totalBudget = Object.values(byCollab).reduce((s,v) => s+v.budget, 0);

  return (
    <div style={S.page}>
      {/* Sélecteur année */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 16px 4px" }}>
        <button onClick={()=>{ const y=selYear-1; setSelYear(y); setSel(String(y)+"-"+selMonth.split("-")[1]); }}
          style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F" }}>◀</button>
        <span style={{ fontWeight:700, fontSize:15, color:"#1E2F4F" }}>{selYear}</span>
        <button onClick={()=>{ const y=selYear+1; setSelYear(y); setSel(String(y)+"-"+selMonth.split("-")[1]); }}
          style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F" }}>▶</button>
      </div>
      {/* Sélecteur mois — grille 4×3 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4, padding:"4px 16px 8px" }}>
        {months.map(m => (
          <button key={m} onClick={() => setSel(m)}
            style={{ border:"none", borderRadius:8, padding:"7px 4px", fontSize:11, fontWeight:600, cursor:"pointer",
              background: selMonth===m?"#1E2F4F":"#F8F9FB",
              color:      selMonth===m?"#D4AF37":"#6B7280" }}>
            {MONTH_NAMES[parseInt(m.split("-")[1])-1].slice(0,3)}
          </button>
        ))}
      </div>
      <div style={{ background:"#1E2F4F", borderRadius:14, margin:"8px 16px", padding:"16px" }}>
        <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:"0.5px" }}>Budget total estimatif</div>
        <div style={{ fontSize:26, fontWeight:800, color:"#D4AF37", fontVariantNumeric:"tabular-nums", marginTop:4 }}>{fmtEur(Math.round(totalBudget))}</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", marginTop:4 }}>Tarifs collaborateurs HT · hors frais annexes · facturation manuelle JCF</div>
      </div>
      <SectionTitle title="Par collaborateur" sub={MONTH_NAMES[parseInt(selMonth.split("-")[1])-1]+" "+selYear} />
      <div style={S.cardList}>
        {COLLABORATORS.map(c => {
          const s = byCollab[c.id];
          if (!s) return null;
          return (
            <div key={c.id} style={S.card}>
              <ColAvatar c={c} size={30} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13, color:"#1E2F4F" }}>{c.name}</div>
                <div style={{ fontSize:11, color:"#6B7280" }}>{s.hours}h travaillees</div>
                {(s.hotel>0||s.repas>0||s.ouverture>0) && (
                  <div style={{ fontSize:10, color:"#9CA3AF" }}>
                    {s.hotel>0     && "Hotel "+fmtEur(s.hotel)+" "}
                    {s.repas>0     && "· Repas "+fmtEur(s.repas)+" "}
                    {s.ouverture>0 && "· Ouv/Ferm "+fmtEur(s.ouverture)}
                  </div>
                )}
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#D4AF37", fontVariantNumeric:"tabular-nums" }}>{fmtEur(Math.round(s.budget))}</div>
                {(s.hotel>0||s.repas>0||s.ouverture>0) && (
                  <div style={{ fontSize:10, color:"#9CA3AF" }}>dont {fmtEur(s.hotel+s.repas+s.ouverture)} frais</div>
                )}
              </div>
            </div>
          );
        }).filter(Boolean)}
      </div>
      <SectionTitle title="Par client" sub="Top 8" />
      <div style={S.cardList}>
        {byClient.map(([n, ca], i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#ffffff", borderRadius:10, padding:"12px 14px", boxShadow:"0 1px 4px rgba(30,47,79,.04)" }}>
            <span style={{ fontSize:13, color:"#2C2C2C" }}>{n}</span>
            <span style={{ fontWeight:700, color:"#D4AF37", fontVariantNumeric:"tabular-nums" }}>{fmtEur(Math.round(ca))}</span>
          </div>
        ))}
      </div>
      {byMission.length > 0 && (
        <div>
          <SectionTitle title="Par mission" />
          <div style={S.cardList}>
            {byMission.map(([n, ca], i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#ffffff", borderRadius:10, padding:"12px 14px", boxShadow:"0 1px 4px rgba(30,47,79,.04)" }}>
                <span style={{ fontSize:13, color:"#2C2C2C" }}>{n}</span>
                <span style={{ fontWeight:700, color:"#D4AF37", fontVariantNumeric:"tabular-nums" }}>{fmtEur(Math.round(ca))}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ height:24 }} />
    </div>
  );
}

function SettingsView() {
  return (
    <div style={S.page}>
      <SectionTitle title="Types d'affectation" sub="Parametrage" />
      <div style={S.cardList}>
        {[{id:"work",label:"Travail",color:"#1E2F4F",bg:"#FFFBEB",textColor:"#1E2F4F",countsHours:true},...ABSENCE_TYPES].map(t => (
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, background:"#ffffff", borderRadius:10, padding:"10px 12px", borderLeft:"4px solid "+t.color, boxShadow:"0 1px 4px rgba(30,47,79,.04)" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:13, color:"#1E2F4F" }}>{t.label}</div>
              <div style={{ fontSize:11, color:"#9CA3AF" }}>{t.countsHours ? "Compte les heures" : "Ne compte pas les heures"}</div>
            </div>
            <StatusTag label={t.countsHours?"Travail":"Non travaille"} color={t.textColor} bg={t.bg} />
          </div>
        ))}
      </div>
      <SectionTitle title="Collaborateurs" sub="12 actifs" />
      <div style={{ padding:"0 16px", fontSize:12, color:"#6B7280", lineHeight:1.9 }}>
        {COLLABORATORS.map(c => c.name+" ("+c.contract+"h · "+c.weeklyHours+"h/sem)").join(" · ")}
      </div>
      <SectionTitle title="Partenaires" sub={STORES.length+" lieux"} />
      <div style={{ padding:"0 16px", fontSize:12, color:"#6B7280", lineHeight:1.9 }}>
        {STORES.map(s => s.name).join(" · ")}
      </div>

      <SectionTitle title="Documentation produit" sub="Chapitres JCF OS" />
      <DocChapters />

      <div style={{ height:24 }} />
    </div>
  );
}

// Acces aux chapitres depuis les Parametres
function DocChapters() {
  const [open, setOpen] = useState(null); // null | "ch0" | "ch1" | "ch2"
  const chapters = [
    { id:"ch0", label:"Chapitre 0", sub:"Vision & Philosophie" },
    { id:"ch1", label:"Chapitre 1", sub:"Architecture & Identifiants" },
    { id:"ch2", label:"Chapitre 2", sub:"Collaborateurs" },
    { id:"ch3", label:"Chapitre 3", sub:"Partenaires" },
    { id:"ch4", label:"Chapitre 4", sub:"Mises a disposition" },
    { id:"ch5", label:"Chapitre 5", sub:"Planning" },
    { id:"ch6", label:"Chapitre 6", sub:"Tarification" },
    { id:"ch7", label:"Chapitre 7", sub:"Dashboard" },
  ];
  if (open === "ch0") return (<Chapter0 onDone={() => setOpen(null)} />);
  if (open === "ch1") return (<Chapter1 onDone={() => setOpen(null)} />);
  if (open === "ch2") return (<Chapter2 onDone={() => setOpen(null)} />);
  if (open === "ch3") return (<Chapter3 onDone={() => setOpen(null)} />);
  if (open === "ch4") return (<Chapter4 onDone={() => setOpen(null)} />);
  if (open === "ch5") return (<Chapter5 onDone={() => setOpen(null)} />);
  if (open === "ch6") return (<Chapter6 onDone={() => setOpen(null)} />);
  if (open === "ch7") return (<Chapter7 onDone={() => setOpen(null)} />);
  return (
    <div style={{ padding:"0 16px" }}>
      {chapters.map(ch => (
        <div key={ch.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#ffffff", borderRadius:10, padding:"12px 14px", marginBottom:6, boxShadow:"0 1px 4px rgba(30,47,79,.05)", cursor:"pointer" }} onClick={() => setOpen(ch.id)}>
          <div>
            <div style={{ fontWeight:600, fontSize:13, color:"#1E2F4F" }}>{ch.label}</div>
            <div style={{ fontSize:11, color:"#6B7280" }}>{ch.sub}</div>
          </div>
          <span style={{ color:"#D4AF37", fontSize:16 }}>&#8250;</span>
        </div>
      ))}
    </div>
  );
}

function AssignmentModal({ modal, onClose, addAssignment, updateAssignment, deleteAssignment, rates }) {
  const isEdit = modal.type === "edit";
  const a      = modal.data && modal.data.assignment;
  const collab = modal.data && modal.data.collaborator;
  const [collabId, setCollabId] = useState(a ? a.collaboratorId : (collab ? collab.id : ""));
  const [date,     setDate]     = useState(a ? a.date : (modal.data ? modal.data.date : TODAY) || TODAY);
  const [dateFin,  setDateFin]  = useState(a ? a.date : (modal.data ? modal.data.date : TODAY) || TODAY);
  const [periodeType, setPeriode] = useState("day");
  const [locId,    setLocId]    = useState(a ? a.locationId : "");
  const [typeId,   setTypeId]   = useState(a ? a.typeId : "work");
  const [hours,    setHours]    = useState(a ? a.hours : 8);
  // Recalculer les heures par défaut quand on change de collaborateur
  const defaultHours = useMemo(() => {
    if (!collabId) return 8;
    const r = (rates || INITIAL_RATES)[collabId];
    if (!r || !r.weeklyHours) return 8;
    return Math.round(r.weeklyHours / 5 * 10) / 10; // weeklyHours / 5 jours
  }, [collabId, rates]);
  const isWork = isWorkType(typeId);

  // Dates à créer selon la période
  const datesToCreate = useMemo(() => {
    if (periodeType === "day") return [date];
    const end = periodeType === "custom" ? dateFin : calcEndDate(date, periodeType);
    return buildDateRange(date, end);
  }, [date, dateFin, periodeType]);

  // Estimation selon la période choisie
  const est = isWork ? (
    periodeType === "day"       ? estCollab(collabId, hours, rates) :
    periodeType === "week"      ? estCollab(collabId, hours, rates, "week") :
    periodeType === "fortnight" ? estCollab(collabId, hours, rates, "fortnight") :
    periodeType === "month"     ? estCollab(collabId, hours, rates, "month") :
    estCollab(collabId, hours, rates) * datesToCreate.length  // période libre
  ) : 0;
  const estTotal = isWork ? est : 0; // est est déjà le total pour la période

  const save = async () => {
    if (!collabId) return;
    if (isEdit) {
      const entry = { collaboratorId:collabId, date, locationId:locId||typeId, typeId, hours: isWork?hours:0 };
      updateAssignment(a.id, entry);
    } else {
      for (const ds of datesToCreate) {
        await addAssignment({ collaboratorId:collabId, date:ds, locationId:locId||typeId, typeId, hours: isWork?hours:0 });
      }
    }
    onClose();
  };
  const del = () => { deleteAssignment(a.id); onClose(); };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={e => e.stopPropagation()}>
        <div style={S.sheetHeader}>
          <span style={{ fontWeight:700, fontSize:15, color:"#1E2F4F" }}>{isEdit ? "Modifier" : "Nouvelle affectation"}</span>
          <button onClick={onClose} style={S.closeBtn}>&#x2715;</button>
        </div>
        <FormLabel text="Collaborateur" />
        <select style={S.input} value={collabId} onChange={e => setCollabId(e.target.value)}>
          <option value="">— Choisir</option>
          {COLLABORATORS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <FormLabel text="Type de periode" />
        <div style={{ display:"flex", gap:4, marginBottom:10, flexWrap:"wrap" }}>
          {[
            { id:"day",       label:"1 jour"    },
            { id:"week",      label:"Semaine (5j)"   },
            { id:"fortnight", label:"Quinzaine (10j)" },
            { id:"month",     label:"Mois (22j)"      },
            { id:"custom",    label:"Periode libre" },
          ].map(p => (
            <button key={p.id}
              style={{ flex:"1 1 auto", border:"1.5px solid "+(periodeType===p.id?"#D4AF37":"#E5E7EB"), borderRadius:8, padding:"7px 4px", fontSize:11, fontWeight:600, cursor:"pointer", background:periodeType===p.id?"#FFFBEB":"#F8F9FB", color:periodeType===p.id?"#1E2F4F":"#6B7280" }}
              onClick={() => setPeriode(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        <FormLabel text={periodeType==="custom" ? "Date de debut" : "Date"} />
        <input type="date" style={S.input} value={date} onChange={e => setDate(e.target.value)} />
        {periodeType === "custom" && (
          <>
            <FormLabel text="Date de fin" />
            <input type="date" style={S.input} value={dateFin} min={date} onChange={e => setDateFin(e.target.value)} />
          </>
        )}
        {datesToCreate.length > 1 && (
          <div style={{ background:"#EFF6FF", borderRadius:8, padding:"8px 12px", marginBottom:8, fontSize:12, color:"#2D456B" }}>
            {datesToCreate.length} jour{datesToCreate.length>1?"s":""} · du {fmtDateFR(datesToCreate[0])} au {fmtDateFR(datesToCreate[datesToCreate.length-1])}
          </div>
        )}
        <FormLabel text="Type" />
        <select style={S.input} value={typeId} onChange={e => { setTypeId(e.target.value); if (!isWorkType(e.target.value)) setLocId(e.target.value); }}>
          <option value="work">Travail</option>
          {ABSENCE_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {isWork && (
          <div>
            <FormLabel text="Lieu" />
            <select style={S.input} value={locId} onChange={e => setLocId(e.target.value)}>
              <option value="">— Choisir</option>
              <optgroup label="Missions">{MISSIONS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</optgroup>
              <optgroup label="Partenaires">{STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>
            </select>
            <FormLabel text="Heures" />
            <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:4 }}>
              Base contractuelle : {defaultHours}h/jour
            </div>
            <div style={{ display:"flex", gap:6, marginBottom:10 }}>
              {[4, Math.round(defaultHours), 8, 10].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b).map(h => (
                <button key={h} style={{ flex:1, border:"1.5px solid "+(hours===h?"#D4AF37":"#E5E7EB"), borderRadius:8, padding:"9px 4px", fontSize:12, fontWeight:600, cursor:"pointer", background: hours===h?"#FFFBEB":"#F8F9FB", color: hours===h?"#1E2F4F":"#6B7280" }} onClick={() => setHours(h)}>
                  {h}h
                </button>
              ))}
              <input type="number" style={{ ...S.input, flex:1, margin:0, padding:"8px 10px" }} value={hours} min={1} max={24} onChange={e => setHours(+e.target.value)} />
            </div>
            {est > 0 && (
              <div style={{ background:"#1E2F4F", borderRadius:10, padding:"10px 14px" }}>
                {periodeType === "day" ? (
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>Estimation HT · {hours}h</span>
                    <span style={{ fontWeight:800, fontSize:17, color:"#D4AF37" }}>{fmtEur(est)}</span>
                  </div>
                ) : (
                  <>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>
                        {periodeType==="week"?"Tarif semaine":periodeType==="fortnight"?"Tarif quinzaine":periodeType==="month"?"Tarif mois":"Tarif "+datesToCreate.length+" jours"}
                      </span>
                      <span style={{ fontWeight:800, fontSize:17, color:"#D4AF37" }}>{fmtEur(estTotal)}</span>
                    </div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", marginTop:4 }}>
                      {datesToCreate.length} jour{datesToCreate.length>1?"s":""} ouvrés · {hours}h/jour
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        <div style={{ display:"flex", gap:8, marginTop:16 }}>
          {isEdit && <button style={{ ...S.btn, background:"#FEF2F2", color:"#C0392B", flex:1 }} onClick={del}>Supprimer</button>}
          <button style={{ ...S.btnGold, flex:2 }} onClick={save}>{isEdit ? "Enregistrer" : "Affecter"}</button>
        </div>
      </div>
    </div>
  );
}


// ── Modal creation collaborateur (Ch.2) ──────────────────────────────────────
function CreateCollaboratorModal({ onClose, addCollaborator, existingCount }) {
  const [name,     setName]     = useState("");
  const [category, setCategory] = useState(INITIAL_JOB_CATEGORIES[0]);
  const [contract, setContract] = useState(168);
  const [weekly,   setWeekly]   = useState(35);
  const [sector,   setSector]   = useState(INITIAL_SECTORS[0]);
  const [sectorAlt,setSectorAlt]= useState("");
  const [country,  setCountry]  = useState("Luxembourg");
  const [phone,    setPhone]    = useState("");
  const [email,    setEmail]    = useState("");
  const [comment,  setComment]  = useState("");
  const [skills,   setSkills]   = useState([]);
  const baseCount = existingCount || COLLABORATORS.length;
  const nextNum   = String(baseCount + 1).padStart(6, "0");
  const newCId    = "c" + (baseCount + 1);
  const previewId = "JCF-COL-" + nextNum;

  const [hourly,    setHourly]    = useState(45);
  const [dayRate,   setDayRate]   = useState(320);
  const [weekRate,  setWeekRate]  = useState(1400);
  const [fnRate,    setFnRate]    = useState(2600);
  const [monthRate, setMonthRate] = useState(4500);
  const [mutuelle,  setMutuelle]  = useState(50);

  const [created, setCreated] = useState(null);
  const autoEmail = email.trim() || (name.trim().split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]/g,"")) + "@jcf.lu";
  const canCreate = name.trim().length >= 2;

  const handleCreate = () => {
    if (!canCreate || !addCollaborator) return;
    const words = name.trim().split(" ");
    const avatar = words.map(w=>w[0]?.toUpperCase()||"").slice(0,2).join("");
    const palette = ["#10B981","#3B82F6","#8B5CF6","#F59E0B","#EF4444","#EC4899","#14B8A6","#6366F1","#84CC16","#F97316","#06B6D4","#A855F7","#0EA5E9","#D946EF"];
    const newCollab = { id:newCId, name:name.trim(), contract, weeklyHours:weekly, avatar, color:palette[(baseCount)%palette.length] };
    const newExtra  = { jobCategory:category, skills, sector, sectorAlt, country, phone, email, comment, status:"active" };
    const newRate   = { weeklyHours:weekly, mutuelle, hourly, day:dayRate, week:weekRate, fortnight:fnRate, minimumMonthly:Math.round(monthRate*0.95), month:monthRate };
    addCollaborator(newCollab, newExtra, newRate);
    onClose();
  };

  const toggleSkill = s => setSkills(p => p.includes(s) ? p.filter(x => x!==s) : [...p, s]);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.sheet, maxHeight:"88dvh" }} onClick={e => e.stopPropagation()}>
        <div style={S.sheetHeader}>
          <span style={{ fontWeight:700, fontSize:15, color:"#1E2F4F" }}>Nouveau collaborateur</span>
          <button onClick={onClose} style={S.closeBtn}>&#x2715;</button>
        </div>

        {/* ID preview */}
        <div style={{ background:"#F8F9FB", borderRadius:10, padding:"8px 12px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center", border:"1px solid #E5E7EB" }}>
          <span style={{ fontSize:11, color:"#9CA3AF" }}>Identifiant genere</span>
          <span style={{ fontFamily:"monospace", fontSize:12, fontWeight:700, color:"#2D456B" }}>{previewId}</span>
        </div>

        <FormLabel text="Prenom · Nom" />
        <input style={S.input} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Sophie Martin" />

        <FormLabel text="Categorie metier" />
        <select style={S.input} value={category} onChange={e=>setCategory(e.target.value)}>
          {INITIAL_JOB_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1 }}>
            <FormLabel text="Contrat mensuel (h)" />
            <input type="number" style={S.input} value={contract} min={0} onChange={e=>setContract(+e.target.value)} />
          </div>
          <div style={{ flex:1 }}>
            <FormLabel text="Base hebdo (h)" />
            <input type="number" style={S.input} value={weekly} min={0} onChange={e=>setWeekly(+e.target.value)} />
          </div>
        </div>

        <FormLabel text="Secteur principal" />
        <select style={S.input} value={sector} onChange={e=>setSector(e.target.value)}>
          {INITIAL_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <FormLabel text="Secteur secondaire" />
        <select style={S.input} value={sectorAlt} onChange={e=>setSectorAlt(e.target.value)}>
          <option value="">— Aucun</option>
          {INITIAL_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <FormLabel text="Pays" />
        <select style={S.input} value={country} onChange={e=>setCountry(e.target.value)}>
          {["Luxembourg","France","Belgique","Allemagne","Autre"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1 }}>
            <FormLabel text="Telephone" />
            <input style={S.input} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+352 ..." />
          </div>
          <div style={{ flex:1 }}>
            <FormLabel text="E-mail" />
            <input type="email" style={S.input} value={email} onChange={e=>setEmail(e.target.value)} placeholder="prenom@..." />
          </div>
        </div>

        <FormLabel text="Commentaire interne" />
        <textarea style={{ ...S.input, resize:"none", height:64, lineHeight:1.5 }} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Notes internes..." />

        <FormLabel text="Competences" />
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
          {INITIAL_SKILLS.map(s => (
            <button key={s} onClick={() => toggleSkill(s)}
              style={{ border:"1.5px solid "+(skills.includes(s)?"#D4AF37":"#E5E7EB"), borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:600, cursor:"pointer",
                background: skills.includes(s) ? "#FFFBEB" : "#F8F9FB",
                color:      skills.includes(s) ? "#1E2F4F" : "#6B7280" }}>
              {s}
            </button>
          ))}
        </div>

        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"10px 12px", marginBottom:14, fontSize:11, color:"#92400E" }}>
          En V1, la fiche est creee en demo. La persistance reelle necessite une base de donnees.
        </div>

        {/* Grille tarifaire */}
        <EditSection title="Grille tarifaire initiale">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              {l:"Tarif/heure", v:hourly,    set:setHourly    },
              {l:"Mutuelle",    v:mutuelle,   set:setMutuelle  },
              {l:"Journee",     v:dayRate,    set:setDayRate   },
              {l:"Semaine",     v:weekRate,   set:setWeekRate  },
              {l:"Quinzaine",   v:fnRate,     set:setFnRate    },
              {l:"Mois",        v:monthRate,  set:setMonthRate },
            ].map(f=>(
              <div key={f.l}>
                <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:3 }}>{f.l}</div>
                <input type="number" value={f.v} min={0} step="0.01"
                  onChange={e=>f.set(parseFloat(e.target.value)||0)}
                  style={{ width:"100%", border:"1.5px solid #E5E7EB", borderRadius:8, padding:"7px 10px", fontSize:12, fontWeight:700, color:"#1E2F4F", textAlign:"right", background:"#F8F9FB", boxSizing:"border-box" }} />
              </div>
            ))}
          </div>
        </EditSection>

        {!created ? (
          <button style={{ ...S.btnGold, width:"100%", opacity:canCreate?1:0.5 }}
            disabled={!canCreate} onClick={handleCreate}>
            Creer {name.trim() || "le collaborateur"}
          </button>
        ) : (
          <div>
            <div style={{ background:"#ECFDF5", border:"1px solid #6EE7B7", borderRadius:12, padding:"14px", marginBottom:12 }}>
              <div style={{ fontWeight:700, fontSize:13, color:"#2E8B57", marginBottom:10 }}>Collaborateur cree !</div>
              <div style={{ fontSize:12, color:"#1E2F4F", marginBottom:4 }}><span style={{ color:"#6B7280" }}>Nom : </span><strong>{created.name}</strong></div>
              <div style={{ background:"#F8F9FB", borderRadius:8, padding:"10px 12px", marginTop:8 }}>
                <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>Identifiants de connexion</div>
                <div style={{ fontSize:13, color:"#1E2F4F", marginBottom:4 }}>Email : <strong>{created.email}</strong></div>
                <div style={{ fontSize:13, color:"#1E2F4F" }}>Mot de passe : <strong>{created.password}</strong></div>
              </div>
              <div style={{ fontSize:10, color:"#6B7280", marginTop:8 }}>Communiquer ces identifiants au collaborateur.</div>
            </div>
            <button style={{ ...S.btnGold, width:"100%" }} onClick={onClose}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CHAPITRE 3 — Partenaires
// ════════════════════════════════════════════════════════════
function Chapter3({ onDone }) {
  const [page, setPage] = useState(0);
  const slides = [
    { tag:"Chapitre 3", title:"Partenaires", body:"Le module Partenaires est le referentiel unique de toutes les structures avec lesquelles JCF Luxtalent travaille.\n\nChaque partenaire possede une fiche unique utilisee par l'ensemble de l'application.", badge:"\uD83D\uDFE2 VALIDE V1" },
    { tag:"Philosophie", title:"Un seul referentiel. Aucune distinction.", body:"Magasin, entreprise, assureur, association, grand compte ou reseau : tous sont des partenaires.\n\nCette approche garantit une architecture simple et evolutive sans cas particuliers." },
    { tag:"Identifiant", title:"JCF-PAR-000001", body:"A la creation, JCF OS genere automatiquement l'identifiant interne du partenaire.\n\nCet identifiant est permanent et ne change jamais, independamment des evolutions de la structure.", mono:true },
    { tag:"Informations", title:"La fiche partenaire.", fields:true },
    { tag:"Sites", title:"Un ou plusieurs sites.", body:"Un partenaire peut posseder un seul site ou plusieurs.\n\nChaque site possede son propre identifiant interne JCF-SIT-000001.\n\nLe systeme supporte naturellement cette evolution des la V1." },
    { tag:"Utilisation", title:"Point d'entree des operations.", body:"Les partenaires servent a :\n\n· Creer une mise a disposition\n· Planifier un collaborateur\n· Creer une mission\n· Consulter les reservations\n· Retrouver l'historique des affectations", last:true },
  ];
  const FIELDS_P = ["Raison sociale","Nom commercial","Adresse · CP · Ville","Pays","Telephone","E-mail","Interlocuteur principal","Categorie","Commentaire interne"];
  const slide = slides[page]; const isLast = page === slides.length - 1;
  return (
    <div style={{ minHeight:"100dvh", background:"#1E2F4F", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", fontFamily:"Inter,system-ui,sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ height:3, background:"rgba(255,255,255,.12)", flexShrink:0 }}>
        <div style={{ height:"100%", width:((page+1)/slides.length*100)+"%", background:"#D4AF37", transition:"width .4s ease" }} />
      </div>
      <div style={{ padding:"20px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="jcf-brand" style={{ fontWeight:700, fontSize:12, color:"#1E2F4F", letterSpacing:"1px" }}>JCF</span>
          </div>
          <span style={{ fontWeight:800, fontSize:14, color:"#D4AF37" }}>OS · Ch.3</span>
        </div>
        <button onClick={onDone} style={{ background:"rgba(255,255,255,.1)", border:"none", borderRadius:8, padding:"6px 14px", color:"rgba(255,255,255,.5)", fontSize:12, cursor:"pointer" }}>Passer</button>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"32px 24px" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#D4AF37", letterSpacing:"1px", textTransform:"uppercase", marginBottom:16 }}>{slide.tag}</div>
        <h1 style={{ fontSize: slide.mono ? 28 : 24, fontWeight:800, color: slide.mono ? "#D4AF37" : "#ffffff", fontFamily: slide.mono ? "monospace" : "inherit", margin:"0 0 20px", lineHeight:1.25, letterSpacing: slide.mono ? "1px" : "-0.5px" }}>{slide.title}</h1>
        {slide.body && (
          <div style={{ fontSize:15, color:"rgba(255,255,255,.65)", lineHeight:1.75 }}>
            {slide.body.split("\n").map((line, i) => (
              <div key={i} style={{ marginBottom: line===""?8:0 }}>{line===""?"\u00A0":line}</div>
            ))}
          </div>
        )}
        {slide.fields && (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {FIELDS_P.map((f, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,.07)", borderRadius:8, padding:"9px 12px", border:"1px solid rgba(255,255,255,.08)" }}>
                <div style={{ width:20, height:20, borderRadius:10, background:"rgba(212,175,55,.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:9, color:"#D4AF37", fontWeight:700 }}>{i+1}</span>
                </div>
                <span style={{ fontSize:13, color:"rgba(255,255,255,.75)" }}>{f}</span>
              </div>
            ))}
          </div>
        )}
        {slide.badge && (
          <div style={{ marginTop:24, display:"inline-flex", alignItems:"center", gap:8, background:"rgba(212,175,55,.15)", border:"1px solid rgba(212,175,55,.3)", borderRadius:8, padding:"8px 14px", alignSelf:"flex-start" }}>
            <span style={{ fontSize:12, color:"#D4AF37", fontWeight:600 }}>{slide.badge}</span>
          </div>
        )}
      </div>
      <div style={{ padding:"0 24px 36px", display:"flex", flexDirection:"column", gap:12, flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:4 }}>
          {slides.map((_, i) => (
            <div key={i} style={{ width:i===page?20:6, height:6, borderRadius:3, background:i===page?"#D4AF37":"rgba(255,255,255,.2)", transition:"width .3s, background .3s", cursor:"pointer" }} onClick={() => setPage(i)} />
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {page > 0 && (
            <button onClick={() => setPage(p=>p-1)} style={{ flex:1, background:"rgba(255,255,255,.1)", border:"none", borderRadius:12, padding:"14px", fontWeight:600, fontSize:14, color:"rgba(255,255,255,.7)", cursor:"pointer" }}>Precedent</button>
          )}
          <button onClick={() => isLast ? onDone() : setPage(p=>p+1)} style={{ flex:2, background:"#D4AF37", border:"none", borderRadius:12, padding:"14px", fontWeight:700, fontSize:14, color:"#1E2F4F", cursor:"pointer" }}>
            {isLast ? "Acceder a JCF OS" : "Suivant"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// VUE PARTENAIRES (Admin)
// ════════════════════════════════════════════════════════════
function PartnersView({ assignments, partners, updatePartner }) {
  const [sel,    setSel]    = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [mode,   setMode]   = useState("list");

  const filtered = partners.filter(p => {
    const matchStatus = filter==="all" || (filter==="active"?p.status!=="inactive":p.status==="inactive");
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  if (sel) {
    return (<PartnerDetail p={sel} assignments={assignments} onBack={() => setSel(null)} updatePartner={updatePartner} />);
  }

  return (
    <div style={S.page}>
      <div style={{ padding:"10px 16px 6px", display:"flex", gap:8 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." style={{ ...S.input, flex:1, margin:0, padding:"9px 12px", fontSize:12 }} />
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{ ...S.input, width:100, margin:0, padding:"9px 8px", fontSize:12 }}>
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>
      <div style={{ padding:"2px 16px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:11, color:"#6B7280" }}>{filtered.length} partenaire{filtered.length!==1?"s":""}</span>
        <button style={{ ...S.btnGold, fontSize:11, padding:"6px 12px" }} onClick={() => setMode("create")}>+ Nouveau</button>
      </div>
      <div style={S.cardList}>
        {filtered.map(p => {
          const nbMissions = assignments.filter(a => {
            const loc = ALL_LOCATIONS.find(l => l.id===a.locationId);
            return isWorkType(a.typeId) && loc && (loc.name===p.name || p.sites.some(sid => {
              const site = INITIAL_SITES.find(s=>s.id===sid);
              return site && site.name===loc.name;
            }));
          }).length;
          return (
            <div key={p.id} style={{ ...S.card, opacity: p.status==="inactive"?.55:1 }} onClick={() => setSel(p)}>
              <div style={{ width:40, height:40, borderRadius:10, background:"#EFF6FF", border:"1.5px solid #BFDBFE", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:12, fontWeight:800, color:"#1E2F4F" }}>{p.name.slice(0,2).toUpperCase()}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontWeight:700, fontSize:13, color:"#1E2F4F" }}>{p.name}</span>
                  {p.status==="inactive" && <StatusTag label="Inactif" color="#6B7280" bg="#F3F4F6" />}
                </div>
                <div style={{ fontSize:11, color:"#6B7280" }}>{p.category} · {p.city}</div>
                <div style={{ fontSize:10, color:"#9CA3AF" }}>{p.country}{nbMissions>0?" · "+nbMissions+" affectation"+(nbMissions>1?"s":""):""}</div>
              </div>
              <span style={{ color:"#D4AF37", fontSize:16 }}>&#8250;</span>
            </div>
          );
        })}
      </div>
      {mode==="create" && (<CreatePartnerModal onClose={() => setMode("list")} />)}
    </div>
  );
}

function PartnerDetail({ p, assignments, onBack, updatePartner }) {
  const [tab, setTab] = useState("info");

  const idNum     = String(INITIAL_PARTNERS.findIndex(x=>x.id===p.id)+1).padStart(6,"0");
  const internalId = "JCF-PAR-" + idNum;

  const sites = INITIAL_SITES.filter(s => p.sites.includes(s.id));

  // Affectations liees a ce partenaire
  const partnerAssignments = useMemo(() => {
    return assignments.filter(a => {
      const loc = ALL_LOCATIONS.find(l => l.id===a.locationId);
      return isWorkType(a.typeId) && loc && loc.name===p.name;
    }).sort((a,b) => b.date.localeCompare(a.date)).slice(0, 20);
  }, [assignments, p.name]);

  return (
    <div style={S.page}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:"#D4AF37", fontSize:13, fontWeight:600, padding:"8px 16px", cursor:"pointer" }}>
        &#8592; Partenaires
      </button>

      {/* Hero */}
      <div style={{ display:"flex", alignItems:"center", gap:14, padding:"4px 16px 12px" }}>
        <div style={{ width:52, height:52, borderRadius:12, background:"#EFF6FF", border:"1.5px solid #BFDBFE", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <span style={{ fontSize:16, fontWeight:800, color:"#1E2F4F" }}>{p.name.slice(0,2).toUpperCase()}</span>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
            <span style={{ fontWeight:700, fontSize:18, color:"#1E2F4F" }}>{p.name}</span>
            <StatusTag label={p.status==="inactive"?"Inactif":"Actif"} color={p.status==="inactive"?"#6B7280":"#2E8B57"} bg={p.status==="inactive"?"#F3F4F6":"#ECFDF5"} />
          </div>
          <div style={{ fontSize:12, color:"#6B7280" }}>{p.category} · {p.city}, {p.country}</div>
          <div style={{ fontSize:10, color:"#9CA3AF", fontFamily:"monospace", marginTop:2 }}>{internalId}</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={S.kpiRow}>
        <KpiBox value={String(partnerAssignments.length)} label="Affectations"  color="#1E2F4F" />
        <KpiBox value={String(sites.length || 1)}         label="Sites"         color="#5D84C3" />
        <KpiBox value={String(new Set(partnerAssignments.map(a=>a.collaboratorId)).size)} label="Collaborateurs" color="#D4AF37" />
      </div>

      {/* Onglets */}
      <div style={{ display:"flex", padding:"0 16px 12px", gap:6 }}>
        {[{id:"info",label:"Fiche"},{id:"sites",label:"Sites"},{id:"history",label:"Historique"}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, border:"none", borderRadius:8, padding:"8px 4px", fontSize:12, fontWeight:600, cursor:"pointer",
              background: tab===t.id ? "#1E2F4F" : "#F8F9FB",
              color:      tab===t.id ? "#D4AF37" : "#6B7280" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── FICHE (editable) ── */}
      {tab==="info" && (
        <div style={{ padding:"0 16px" }}>

          <EditSection title="Identification">
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { label:"Nom commercial", field:"name",       placeholder:"Ex: FOYER",    type:"text" },
                { label:"Raison sociale", field:"commercial", placeholder:"Denomination", type:"text" },
              ].map(row => (
                <div key={row.field} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:11, color:"#9CA3AF", width:90, flexShrink:0 }}>{row.label}</span>
                  <input type={row.type} value={p[row.field]||""} placeholder={row.placeholder}
                    onChange={e => updatePartner(p.id, row.field, e.target.value)}
                    style={{ ...S.input, margin:0, flex:1, padding:"7px 10px", fontSize:12 }}
                  />
                </div>
              ))}
            </div>
          </EditSection>

          <EditSection title="Categorie">
            <select value={p.category||""} onChange={e => updatePartner(p.id, "category", e.target.value)}
              style={{ ...S.input, margin:0 }}>
              {PARTNER_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </EditSection>

          <EditSection title="Adresse">
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { label:"Ville",  field:"city",    placeholder:"Luxembourg", type:"text" },
                { label:"Pays",   field:"country", placeholder:"Luxembourg", type:"text" },
              ].map(row => (
                <div key={row.field} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:11, color:"#9CA3AF", width:48, flexShrink:0 }}>{row.label}</span>
                  <input type={row.type} value={p[row.field]||""} placeholder={row.placeholder}
                    onChange={e => updatePartner(p.id, row.field, e.target.value)}
                    style={{ ...S.input, margin:0, flex:1, padding:"7px 10px", fontSize:12 }}
                  />
                </div>
              ))}
            </div>
          </EditSection>

          <EditSection title="Contact">
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { label:"Telephone",      field:"phone",   placeholder:"+352 ...",    type:"tel"   },
                { label:"E-mail",         field:"email",   placeholder:"contact@...", type:"email" },
                { label:"Interlocuteur",  field:"contact", placeholder:"Nom, poste",  type:"text"  },
              ].map(row => (
                <div key={row.field} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:11, color:"#9CA3AF", width:80, flexShrink:0 }}>{row.label}</span>
                  <input type={row.type} value={p[row.field]||""} placeholder={row.placeholder}
                    onChange={e => updatePartner(p.id, row.field, e.target.value)}
                    style={{ ...S.input, margin:0, flex:1, padding:"7px 10px", fontSize:12 }}
                  />
                </div>
              ))}
            </div>
          </EditSection>

          <EditSection title="Commentaire interne">
            <textarea value={p.comment||""} placeholder="Notes internes..."
              onChange={e => updatePartner(p.id, "comment", e.target.value)}
              style={{ ...S.input, margin:0, resize:"none", height:60, lineHeight:1.5, fontSize:12 }}
            />
          </EditSection>

          {/* Statut */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#ffffff", borderRadius:12, padding:"12px 14px", marginBottom:8, boxShadow:"0 1px 4px rgba(30,47,79,.05)" }}>
            <div>
              <div style={{ fontSize:11, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px" }}>Statut</div>
              <div style={{ fontWeight:600, fontSize:13, color:"#1E2F4F", marginTop:4 }}>{p.status==="inactive"?"Inactif":"Actif"}</div>
            </div>
            <button onClick={() => updatePartner(p.id, "status", p.status==="inactive"?"active":"inactive")}
              style={{ border:"none", borderRadius:20, padding:"6px 14px", fontSize:11, fontWeight:600, cursor:"pointer",
                background: p.status==="inactive"?"#ECFDF5":"#FEF2F2",
                color:      p.status==="inactive"?"#2E8B57":"#C0392B" }}>
              {p.status==="inactive" ? "Reactiver" : "Desactiver"}
            </button>
          </div>

          {/* ID interne — non modifiable */}
          <div style={{ background:"#F8F9FB", borderRadius:10, padding:"10px 14px", border:"1px solid #E5E7EB" }}>
            <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:2 }}>Identifiant interne · non modifiable</div>
            <div style={{ fontFamily:"monospace", fontSize:12, fontWeight:700, color:"#2D456B", letterSpacing:"0.5px" }}>{internalId}</div>
          </div>

          <div style={{ height:8 }} />
        </div>
      )}

      {/* ── SITES ── */}
      {tab==="sites" && (
        <div style={{ padding:"0 16px" }}>
          {sites.length === 0 ? (
            <Empty text="Aucun site enregistre" />
          ) : sites.map(site => {
            const siteNum = String(INITIAL_SITES.findIndex(s=>s.id===site.id)+1).padStart(6,"0");
            return (
              <div key={site.id} style={{ background:"#ffffff", borderRadius:12, padding:"12px 14px", marginBottom:8, boxShadow:"0 1px 4px rgba(30,47,79,.05)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <span style={{ fontWeight:600, fontSize:13, color:"#1E2F4F" }}>{site.name}</span>
                  <span style={{ fontFamily:"monospace", fontSize:10, color:"#9CA3AF" }}>JCF-SIT-{siteNum}</span>
                </div>
                <div style={{ fontSize:11, color:"#6B7280" }}>{site.address}</div>
                <div style={{ fontSize:11, color:"#6B7280" }}>{site.city} · {site.country}</div>
              </div>
            );
          })}
          <button style={{ ...S.btnGold, width:"100%", fontSize:12, marginTop:4 }}>+ Ajouter un site</button>
        </div>
      )}

      {/* ── HISTORIQUE ── */}
      {tab==="history" && (
        <div style={{ padding:"0 16px" }}>
          {partnerAssignments.length === 0 ? (
            <Empty text="Aucune affectation enregistree" />
          ) : partnerAssignments.map((a, i) => {
            const c = COLLABORATORS.find(x=>x.id===a.collaboratorId);
            const d = new Date(a.date+"T12:00:00");
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:"#ffffff", borderRadius:10, padding:"10px 12px", marginBottom:6, boxShadow:"0 1px 4px rgba(30,47,79,.04)" }}>
                {c && <ColAvatar c={c} size={28} />}
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:12, color:"#1E2F4F" }}>{c ? c.name : "—"}</div>
                  <div style={{ fontSize:11, color:"#6B7280" }}>{DAY_NAMES[d.getDay()]} {d.getDate()} {MONTH_NAMES[d.getMonth()]} · {a.hours}h</div>
                </div>
                <StatusTag label="Travail" color="#1E2F4F" bg="#FFFBEB" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreatePartnerModal({ onClose }) {
  const [name,     setName]     = useState("");
  const [commercial,setComm]   = useState("");
  const [category, setCategory] = useState(PARTNER_CATEGORIES[0]);
  const [city,     setCity]     = useState("");
  const [country,  setCountry]  = useState("Luxembourg");
  const [phone,    setPhone]    = useState("");
  const [email,    setEmail]    = useState("");
  const [contact,  setContact]  = useState("");
  const [comment,  setComment]  = useState("");
  const nextNum = String(INITIAL_PARTNERS.length + 1).padStart(6, "0");
  const previewId = "JCF-PAR-" + nextNum;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.sheet, maxHeight:"90dvh" }} onClick={e => e.stopPropagation()}>
        <div style={S.sheetHeader}>
          <span style={{ fontWeight:700, fontSize:15, color:"#1E2F4F" }}>Nouveau partenaire</span>
          <button onClick={onClose} style={S.closeBtn}>&#x2715;</button>
        </div>
        {/* ID preview */}
        <div style={{ background:"#F8F9FB", borderRadius:10, padding:"8px 12px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center", border:"1px solid #E5E7EB" }}>
          <span style={{ fontSize:11, color:"#9CA3AF" }}>Identifiant genere</span>
          <span style={{ fontFamily:"monospace", fontSize:12, fontWeight:700, color:"#2D456B" }}>{previewId}</span>
        </div>

        <FormLabel text="Nom commercial" />
        <input style={S.input} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: FOYER Assurances" />

        <FormLabel text="Raison sociale" />
        <input style={S.input} value={commercial} onChange={e=>setComm(e.target.value)} placeholder="Denomination legale" />

        <FormLabel text="Categorie" />
        <select style={S.input} value={category} onChange={e=>setCategory(e.target.value)}>
          {PARTNER_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:2 }}>
            <FormLabel text="Ville" />
            <input style={S.input} value={city} onChange={e=>setCity(e.target.value)} placeholder="Luxembourg" />
          </div>
          <div style={{ flex:1 }}>
            <FormLabel text="Pays" />
            <select style={S.input} value={country} onChange={e=>setCountry(e.target.value)}>
              {["Luxembourg","France","Belgique","Allemagne","Autre"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1 }}>
            <FormLabel text="Telephone" />
            <input style={S.input} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+352 ..." />
          </div>
          <div style={{ flex:1 }}>
            <FormLabel text="E-mail" />
            <input type="email" style={S.input} value={email} onChange={e=>setEmail(e.target.value)} placeholder="contact@..." />
          </div>
        </div>

        <FormLabel text="Interlocuteur principal" />
        <input style={S.input} value={contact} onChange={e=>setContact(e.target.value)} placeholder="Nom, fonction" />

        <FormLabel text="Commentaire interne" />
        <textarea style={{ ...S.input, resize:"none", height:56, lineHeight:1.5 }} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Notes internes..." />

        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"10px 12px", marginBottom:14, fontSize:11, color:"#92400E" }}>
          En V1, la fiche est creee en demo. La persistance reelle necessite une base de donnees.
        </div>

        <button style={{ ...S.btnGold, width:"100%" }} onClick={onClose}>
          Creer {name ? name : "le partenaire"}
        </button>
      </div>
    </div>
  );
}

// Wrapper section editable — titre + contenu
function EditSection({ title, children }) {
  return (
    <div style={{ background:"#ffffff", borderRadius:12, padding:"12px 14px", marginBottom:8, boxShadow:"0 1px 4px rgba(30,47,79,.05)" }}>
      <div style={{ fontSize:11, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>{title}</div>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CHAPITRE 4 — Mises a disposition
// ════════════════════════════════════════════════════════════
function Chapter4({ onDone }) {
  const [page, setPage] = useState(0);
  const slides = [
    { tag:"Chapitre 4", title:"Mises a disposition", body:"Le module MAD est le coeur operationnel de JCF OS.\n\nIl permet a un partenaire de reserver un collaborateur sur une periode determinee, dans le respect des regles metier et de la logique economique de JCF Luxtalent.", badge:"\uD83D\uDFE2 VALIDE V1" },
    { tag:"Philosophie", title:"Une periode. Pas des heures.", body:"JCF Luxtalent ne vend pas des heures isolees.\n\nJCF Luxtalent met a disposition un professionnel sur une periode donnee.\n\nLe logiciel protege systematiquement cette logique." },
    { tag:"Identifiant", title:"JCF-MAD-000001", body:"A la creation, JCF OS genere automatiquement l'identifiant interne de la mise a disposition.\n\nCet identifiant est permanent.", mono:true },
    { tag:"Types de reservation", title:"4 formats commerciaux.", types:true },
    { tag:"Estimation", title:"Indicatif. Jamais une facture.", body:"L'estimation tarifaire est affichee a titre indicatif, exprimee hors taxes.\n\nElle ne constitue jamais une facture et ne remplace jamais la validation administrative.\n\nLa facturation reste entierement manuelle." },
    { tag:"Interface partenaire", title:"Parcours en 4 etapes.", steps:true },
    { tag:"Administration", title:"Le controle reste cote admin.", body:"L'administrateur peut a tout moment creer, modifier, corriger, prolonger, raccourcir ou annuler une mise a disposition.\n\nL'administration garde toujours le controle final.", last:true },
  ];
  const TYPES_MAD = [
    { label:"Journee",   sub:"8h bloquees",     price:"Tarif journee"    },
    { label:"Semaine",   sub:"5 jours ouvres",  price:"Tarif semaine"    },
    { label:"Quinzaine", sub:"10 jours ouvres", price:"Tarif quinzaine"  },
    { label:"Mois",      sub:"Mois complet",    price:"Tarif mensuel"    },
  ];
  const STEPS = ["Choisir une periode","Choisir un collaborateur","Consulter l'estimation","Confirmer la demande"];
  const slide = slides[page]; const isLast = page === slides.length - 1;
  return (
    <div style={{ minHeight:"100dvh", background:"#1E2F4F", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", fontFamily:"Inter,system-ui,sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ height:3, background:"rgba(255,255,255,.12)", flexShrink:0 }}>
        <div style={{ height:"100%", width:((page+1)/slides.length*100)+"%", background:"#D4AF37", transition:"width .4s ease" }} />
      </div>
      <div style={{ padding:"20px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="jcf-brand" style={{ fontWeight:700, fontSize:12, color:"#1E2F4F", letterSpacing:"1px" }}>JCF</span>
          </div>
          <span style={{ fontWeight:800, fontSize:14, color:"#D4AF37" }}>OS · Ch.4</span>
        </div>
        <button onClick={onDone} style={{ background:"rgba(255,255,255,.1)", border:"none", borderRadius:8, padding:"6px 14px", color:"rgba(255,255,255,.5)", fontSize:12, cursor:"pointer" }}>Passer</button>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"32px 24px" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#D4AF37", letterSpacing:"1px", textTransform:"uppercase", marginBottom:16 }}>{slide.tag}</div>
        <h1 style={{ fontSize:slide.mono?28:24, fontWeight:800, color:slide.mono?"#D4AF37":"#ffffff", fontFamily:slide.mono?"monospace":"inherit", margin:"0 0 20px", lineHeight:1.25, letterSpacing:slide.mono?"1px":"-0.5px" }}>{slide.title}</h1>
        {slide.body && (
          <div style={{ fontSize:15, color:"rgba(255,255,255,.65)", lineHeight:1.75 }}>
            {slide.body.split("\n").map((line, i) => (
              <div key={i} style={{ marginBottom:line===""?8:0 }}>{line===""?"\u00A0":line}</div>
            ))}
          </div>
        )}
        {slide.types && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {TYPES_MAD.map(t => (
              <div key={t.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,.07)", borderRadius:10, padding:"12px 14px", border:"1px solid rgba(255,255,255,.1)" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:"#ffffff" }}>{t.label}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", marginTop:2 }}>{t.sub}</div>
                </div>
                <span style={{ fontSize:11, color:"#D4AF37", fontWeight:600 }}>{t.price}</span>
              </div>
            ))}
          </div>
        )}
        {slide.steps && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:28, height:28, borderRadius:14, background:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:"#1E2F4F" }}>{i+1}</span>
                </div>
                <span style={{ fontSize:15, color:"rgba(255,255,255,.8)" }}>{s}</span>
              </div>
            ))}
          </div>
        )}
        {slide.badge && (
          <div style={{ marginTop:24, display:"inline-flex", alignItems:"center", gap:8, background:"rgba(212,175,55,.15)", border:"1px solid rgba(212,175,55,.3)", borderRadius:8, padding:"8px 14px", alignSelf:"flex-start" }}>
            <span style={{ fontSize:12, color:"#D4AF37", fontWeight:600 }}>{slide.badge}</span>
          </div>
        )}
      </div>
      <div style={{ padding:"0 24px 36px", display:"flex", flexDirection:"column", gap:12, flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:4 }}>
          {slides.map((_, i) => (
            <div key={i} style={{ width:i===page?20:6, height:6, borderRadius:3, background:i===page?"#D4AF37":"rgba(255,255,255,.2)", transition:"width .3s, background .3s", cursor:"pointer" }} onClick={() => setPage(i)} />
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {page > 0 && (
            <button onClick={() => setPage(p=>p-1)} style={{ flex:1, background:"rgba(255,255,255,.1)", border:"none", borderRadius:12, padding:"14px", fontWeight:600, fontSize:14, color:"rgba(255,255,255,.7)", cursor:"pointer" }}>Precedent</button>
          )}
          <button onClick={() => isLast ? onDone() : setPage(p=>p+1)} style={{ flex:2, background:"#D4AF37", border:"none", borderRadius:12, padding:"14px", fontWeight:700, fontSize:14, color:"#1E2F4F", cursor:"pointer" }}>
            {isLast ? "Acceder a JCF OS" : "Suivant"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// VUE MAD — Mises a disposition (Admin)
// ════════════════════════════════════════════════════════════
const MAD_STATUS = {
  confirmed: { label:"Confirmee",  color:"#2E8B57", bg:"#ECFDF5" },
  pending:   { label:"En attente", color:"#D4AF37", bg:"#FFFBEB" },
  cancelled: { label:"Annulee",    color:"#C0392B", bg:"#FEF2F2" },
};

function MadView({ mads, addMad, updateMad, assignments, rates, partners, collabExtras }) {
  const [sel,    setSel]    = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [create, setCreate] = useState(false);

  const filtered = mads.filter(m => {
    const matchStatus = filter==="all" || m.status===filter;
    const q = search.toLowerCase();
    const c = COLLABORATORS.find(x => x.id===m.collaboratorId);
    const p = partners.find(x => x.id===m.partnerId);
    const matchSearch = !q || (c&&c.name.toLowerCase().includes(q)) || (p&&p.name.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  }).sort((a,b) => b.startDate.localeCompare(a.startDate));

  if (sel) {
    return (<MadDetail mad={sel} onBack={() => setSel(null)} updateMad={updateMad} rates={rates} partners={partners} collabExtras={collabExtras} />);
  }

  // KPIs
  const confirmed = mads.filter(m => m.status==="confirmed");
  const totalCA   = confirmed.reduce((s,m) => s+m.cost, 0);
  const active    = confirmed.filter(m => m.startDate <= TODAY && m.endDate >= TODAY);

  return (
    <div style={S.page}>
      {/* KPIs */}
      <div style={S.kpiRow}>
        <KpiBox value={String(confirmed.length)} label="Confirmees"   color="#1E2F4F" />
        <KpiBox value={String(active.length)}    label="En cours"     color="#2E8B57" />
        <KpiBox value={String(mads.filter(m=>m.status==="pending").length)} label="En attente" color="#D4AF37" />
        <KpiBox value={fmtEur(Math.round(totalCA))} label="CA estimatif" color="#D4AF37" />
      </div>

      {/* Barre recherche + filtre + bouton */}
      <div style={{ padding:"6px 16px", display:"flex", gap:8 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Collaborateur, partenaire..."
          style={{ ...S.input, flex:1, margin:0, padding:"9px 12px", fontSize:12 }} />
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          style={{ ...S.input, width:110, margin:0, padding:"9px 8px", fontSize:11 }}>
          <option value="all">Toutes</option>
          <option value="confirmed">Confirmees</option>
          <option value="pending">En attente</option>
          <option value="cancelled">Annulees</option>
        </select>
      </div>
      <div style={{ padding:"2px 16px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:11, color:"#6B7280" }}>{filtered.length} mise{filtered.length!==1?"s":""} a dispo</span>
        <button style={{ ...S.btnGold, fontSize:11, padding:"6px 12px" }} onClick={() => setCreate(true)}>+ Nouvelle MAD</button>
      </div>

      {/* Liste */}
      <div style={S.cardList}>
        {filtered.map(m => {
          const c   = COLLABORATORS.find(x => x.id===m.collaboratorId);
          const p   = partners.find(x => x.id===m.partnerId);
          const st  = MAD_STATUS[m.status] || MAD_STATUS.pending;
          const dS  = new Date(m.startDate+"T12:00:00");
          const dE  = new Date(m.endDate+"T12:00:00");
          const ct  = (COMMERCIAL_TYPES.find(x=>x.id===m.bookingType)||{}).label || m.bookingType;
          return (
            <div key={m.id} style={{ ...S.card, flexDirection:"column", alignItems:"stretch", gap:0, cursor:"pointer" }} onClick={() => setSel(m)}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                {c && <ColAvatar c={c} size={36} />}
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontWeight:700, fontSize:13, color:"#1E2F4F" }}>{c ? c.name : "—"}</span>
                    <StatusTag label={st.label} color={st.color} bg={st.bg} />
                  </div>
                  <div style={{ fontSize:11, color:"#6B7280" }}>{p ? p.name : "—"} · {ct}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#D4AF37", fontVariantNumeric:"tabular-nums" }}>{fmtEur(m.cost)}</div>
                  <div style={{ fontSize:9, color:"#9CA3AF" }}>HT estim.</div>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, borderTop:"1px solid #F8F9FB" }}>
                <span style={{ fontSize:11, color:"#6B7280" }}>
                  {dS.getDate()} {MONTH_NAMES[dS.getMonth()].slice(0,3)} → {dE.getDate()} {MONTH_NAMES[dE.getMonth()].slice(0,3)} {dE.getFullYear()}
                </span>
                <span style={{ fontSize:10, color:"#9CA3AF", fontFamily:"monospace" }}>{m.id}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <Empty text="Aucune mise a disposition" />}
      </div>

      {create && <CreateMadModal onClose={() => setCreate(false)} addMad={addMad} rates={rates} partners={partners} assignments={assignments} />}
    </div>
  );
}

function MadDetail({ mad, onBack, updateMad, rates, partners, collabExtras }) {
  const c  = COLLABORATORS.find(x => x.id===mad.collaboratorId);
  const p  = partners.find(x => x.id===mad.partnerId);
  const st = MAD_STATUS[mad.status] || MAD_STATUS.pending;
  const ct = (COMMERCIAL_TYPES.find(x=>x.id===mad.bookingType)||{}).label || mad.bookingType;
  const dS = new Date(mad.startDate+"T12:00:00");
  const dE = new Date(mad.endDate+"T12:00:00");

  return (
    <div style={S.page}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:"#D4AF37", fontSize:13, fontWeight:600, padding:"8px 16px", cursor:"pointer" }}>
        &#8592; Mises a disposition
      </button>

      {/* Hero */}
      <div style={{ display:"flex", alignItems:"center", gap:14, padding:"4px 16px 12px" }}>
        {c && <ColAvatar c={c} size={52} />}
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
            <span style={{ fontWeight:700, fontSize:18, color:"#1E2F4F" }}>{c ? c.name : "—"}</span>
            <StatusTag label={st.label} color={st.color} bg={st.bg} />
          </div>
          <div style={{ fontSize:12, color:"#6B7280" }}>{p ? p.name : "—"} · {ct}</div>
          <div style={{ fontSize:10, color:"#9CA3AF", fontFamily:"monospace", marginTop:2 }}>{mad.id}</div>
        </div>
      </div>

      {/* Tarif */}
      <div style={{ background:"#1E2F4F", borderRadius:14, margin:"0 16px 12px", padding:"14px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.45)", textTransform:"uppercase", letterSpacing:"0.5px" }}>Tarif estimatif HT</div>
            <div style={{ fontSize:26, fontWeight:800, color:"#D4AF37", fontVariantNumeric:"tabular-nums", marginTop:2 }}>{fmtEur(mad.cost)}</div>
            {mad.hotelNights > 0 && (
              <div style={{ marginTop:8, fontSize:11, color:"rgba(255,255,255,.6)" }}>
                Dont {mad.hotelNights} nuit{mad.hotelNights>1?"s":""} d'hotel · {fmtEur(mad.hotelCost||0)}
              </div>
            )}
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.45)" }}>{mad.blockedHours}h bloquees</div>
            {mad.extraHours>0 && <div style={{ fontSize:11, color:"rgba(255,255,255,.45)" }}>+{mad.extraHours}h extension</div>}
          </div>
        </div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,.3)", marginTop:8 }}>Estimation indicative — facturation finale par JCF Luxtalent</div>
      </div>

      {/* Details */}
      <div style={{ padding:"0 16px" }}>
        <EditSection title="Periode">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:4 }}>Debut</div>
              <input type="date" value={mad.startDate} onChange={e=>updateMad(mad.id,"startDate",e.target.value)}
                style={{ ...S.input, margin:0, padding:"8px 10px", fontSize:12 }} />
            </div>
            <div>
              <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:4 }}>Fin</div>
              <input type="date" value={mad.endDate} onChange={e=>updateMad(mad.id,"endDate",e.target.value)}
                style={{ ...S.input, margin:0, padding:"8px 10px", fontSize:12 }} />
            </div>
          </div>
        </EditSection>

        <EditSection title="Statut">
          <div style={{ display:"flex", gap:8 }}>
            {Object.entries(MAD_STATUS).map(([key, val]) => (
              <button key={key} onClick={() => updateMad(mad.id,"status",key)}
                style={{ flex:1, border:"1.5px solid "+(mad.status===key?val.color:"#E5E7EB"), borderRadius:8, padding:"8px 4px", fontSize:11, fontWeight:600, cursor:"pointer",
                  background: mad.status===key ? val.bg : "#F8F9FB",
                  color:      mad.status===key ? val.color : "#6B7280" }}>
                {val.label}
              </button>
            ))}
          </div>
        </EditSection>

        <EditSection title="Commentaire interne">
          <textarea value={mad.comment||""} placeholder="Notes internes..."
            onChange={e=>updateMad(mad.id,"comment",e.target.value)}
            style={{ ...S.input, margin:0, resize:"none", height:60, lineHeight:1.5, fontSize:12 }} />
        </EditSection>

        {/* Infos en lecture */}
        <div style={{ background:"#F8F9FB", borderRadius:10, padding:"10px 14px", border:"1px solid #E5E7EB", marginBottom:8 }}>
          <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:6 }}>Informations</div>
          {[
            { label:"Type",         value:ct },
            { label:"Collaborateur",value:c?c.name:"—" },
            { label:"Partenaire",   value:p?p.name:"—" },
            { label:"Cree le",      value:mad.createdAt||"—" },
          ].map(row => (
            <div key={row.label} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"3px 0" }}>
              <span style={{ color:"#9CA3AF" }}>{row.label}</span>
              <span style={{ color:"#1E2F4F", fontWeight:500 }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* ID non modifiable */}
        <div style={{ background:"#F8F9FB", borderRadius:10, padding:"10px 14px", border:"1px solid #E5E7EB" }}>
          <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:2 }}>Identifiant interne · non modifiable</div>
          <div style={{ fontFamily:"monospace", fontSize:12, fontWeight:700, color:"#2D456B", letterSpacing:"0.5px" }}>{mad.id}</div>
        </div>
        <div style={{ height:8 }} />
      </div>
    </div>
  );
}

function CreateMadModal({ onClose, addMad, rates, partners, assignments }) {
  const [step,      setStep]      = useState("partner"); // partner > collab > type > summary
  const [partnerId, setPartnerId] = useState("");
  const [collabId,  setCollabId]  = useState("");
  const [bookType,  setBookType]  = useState("day");
  const [startDate, setStartDate] = useState(TODAY);
  const [monthStr,  setMonthStr]  = useState("2026-06");
  const [inclSat,   setInclSat]   = useState(false);
  const [extraH,    setExtraH]    = useState(0);
  const [comment,   setComment]   = useState("");
  const [hotelNights,  setHotelNights]  = useState(0);
  const [repasSoirs,   setRepasSoirs]   = useState(0);
  const HOTEL_RATE = 120; // €/nuit
  const REPAS_RATE = 18;  // €/soir

  const collab = COLLABORATORS.find(c=>c.id===collabId);
  const r      = collab ? (rates||INITIAL_RATES)[collab.id]||{} : {};

  // Calcul dates
  const candidateDates = useMemo(() => {
    if (!collabId) return [];
    if (bookType==="day") return [startDate];
    if (bookType==="week") { const e=calcEndDate(startDate,"week"); return buildDateRange(startDate,e); }
    if (bookType==="fortnight") { const e=calcEndDate(startDate,"fortnight"); return buildDateRange(startDate,e); }
    if (bookType==="month") {
      const [y,m]=monthStr.split("-").map(Number);
      return buildDateRange(new Date(y,m-1,1).toISOString().split("T")[0],new Date(y,m,0).toISOString().split("T")[0],inclSat);
    }
    return [];
  }, [collabId, bookType, startDate, inclSat, monthStr]);

  const conflictDates = useMemo(() =>
    candidateDates.filter(ds => assignments.some(a=>a.collaboratorId===collabId&&a.date===ds&&isWorkType(a.typeId))),
    [candidateDates, assignments, collabId]);

  const blockedHours = collab ? calcBlockedHours(collab, bookType, extraH) : 0;
  const collabCost   = collab ? calcCommercialCost(collabId, bookType, extraH, rates) : 0;
  const hotelCost    = hotelNights * HOTEL_RATE;
  const repasCost    = repasSoirs * REPAS_RATE;
  const totalCost    = collabCost + hotelCost + repasCost;
  const endDate      = candidateDates.length>0 ? candidateDates[candidateDates.length-1] : startDate;

  const nextNum = String(INITIAL_MADS.length + 1).padStart(6,"0");

  const confirm = () => {
    addMad({ partnerId, collaboratorId:collabId, bookingType:bookType,
      startDate:candidateDates[0]||startDate, endDate,
      blockedHours, extraHours:extraH,
      collabCost:Math.round(collabCost), hotelNights, hotelCost:Math.round(hotelCost),
      repasSoirs, repasCost:Math.round(repasCost),
      cost:Math.round(totalCost),
      status:"confirmed", comment, createdAt:TODAY });
    onClose();
  };

  const STEPS_NAV = ["Partenaire","Collaborateur","Periode","Resume"];
  const stepIdx   = ["partner","collab","type","summary"].indexOf(step);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.sheet, maxHeight:"92dvh" }} onClick={e=>e.stopPropagation()}>
        <div style={S.sheetHeader}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {step!=="partner" && <button onClick={()=>setStep(["partner","partner","collab","type"][stepIdx])} style={S.closeBtn}>&#8592;</button>}
            <span style={{ fontWeight:700, fontSize:15, color:"#1E2F4F" }}>Nouvelle mise a disposition</span>
          </div>
          <button onClick={onClose} style={S.closeBtn}>&#x2715;</button>
        </div>

        {/* Stepper */}
        <div style={{ display:"flex", gap:4, marginBottom:16 }}>
          {STEPS_NAV.map((s, i) => (
            <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i<=stepIdx?"#D4AF37":"#E5E7EB", transition:"background .3s" }} />
          ))}
        </div>

        {/* ID preview */}
        <div style={{ background:"#F8F9FB", borderRadius:10, padding:"7px 12px", marginBottom:12, display:"flex", justifyContent:"space-between", border:"1px solid #E5E7EB" }}>
          <span style={{ fontSize:11, color:"#9CA3AF" }}>Identifiant genere</span>
          <span style={{ fontFamily:"monospace", fontSize:11, fontWeight:700, color:"#2D456B" }}>JCF-MAD-{nextNum}</span>
        </div>

        {/* ETAPE 1 — Partenaire */}
        {step==="partner" && (
          <div>
            <FormLabel text="Partenaire" />
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
              {partners.filter(p=>p.status!=="inactive").map(p => (
                <button key={p.id} onClick={()=>{setPartnerId(p.id);setStep("collab");}}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", border:"1.5px solid "+(partnerId===p.id?"#D4AF37":"#E5E7EB"), borderRadius:10, cursor:"pointer", background:partnerId===p.id?"#FFFBEB":"#ffffff", textAlign:"left" }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:11, fontWeight:800, color:"#1E2F4F" }}>{p.name.slice(0,2).toUpperCase()}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:"#1E2F4F" }}>{p.name}</div>
                    <div style={{ fontSize:11, color:"#9CA3AF" }}>{p.category} · {p.city}</div>
                  </div>
                  <span style={{ color:"#D4AF37" }}>&#8250;</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ETAPE 2 — Collaborateur */}
        {step==="collab" && (
          <div>
            <FormLabel text="Collaborateur" />
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
              {COLLABORATORS.map(c => {
                const todayBusy = assignments.some(a=>a.collaboratorId===c.id&&a.date===TODAY&&isWorkType(a.typeId));
                return (
                  <button key={c.id} onClick={()=>{setCollabId(c.id);setStep("type");}}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", border:"1.5px solid "+(collabId===c.id?"#D4AF37":"#E5E7EB"), borderRadius:10, cursor:"pointer", background:collabId===c.id?"#FFFBEB":"#ffffff", textAlign:"left" }}>
                    <ColAvatar c={c} size={36} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:"#1E2F4F" }}>{c.name}</div>
                      <div style={{ fontSize:11, color:"#9CA3AF" }}>{c.weeklyHours}h/sem</div>
                    </div>
                    {todayBusy && <StatusTag label="Occupe" color="#D4AF37" bg="#FFFBEB" />}
                    <span style={{ color:"#D4AF37" }}>&#8250;</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ETAPE 3 — Periode + type */}
        {step==="type" && collab && (
          <div>
            {/* Fiche collab recap */}
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"#F8F9FB", borderRadius:10, padding:"10px 12px", marginBottom:12 }}>
              <ColAvatar c={collab} size={36} />
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:"#1E2F4F" }}>{collab.name}</div>
                <div style={{ fontSize:11, color:"#6B7280" }}>{collab.weeklyHours}h/sem · {collab.contract}h/mois</div>
              </div>
            </div>
            <FormLabel text="Duree commerciale" />
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
              {COMMERCIAL_TYPES.map(ct => {
                const bh   = calcBlockedHours(collab, ct.id, 0);
                const cost = calcCommercialCost(collabId, ct.id, 0, rates);
                const sel  = bookType===ct.id;
                return (
                  <button key={ct.id} onClick={()=>{setBookType(ct.id);setExtraH(0);}}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", border:"2px solid "+(sel?"#D4AF37":"#E5E7EB"), borderRadius:10, cursor:"pointer", background:sel?"#FFFBEB":"#ffffff", textAlign:"left" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:"#1E2F4F" }}>{ct.label}</div>
                      <div style={{ fontSize:10, color:"#6B7280" }}>{bh}h bloquees · {ct.sub}</div>
                    </div>
                    <span style={{ fontWeight:700, fontSize:13, color:sel?"#D4AF37":"#2C2C2C", fontVariantNumeric:"tabular-nums" }}>{fmtEur(cost)}</span>
                  </button>
                );
              })}
            </div>
            {bookType==="day" && (<><FormLabel text="Date"/><input type="date" style={S.input} value={startDate} onChange={e=>setStartDate(e.target.value)}/></>)}
            {(bookType==="week"||bookType==="fortnight") && (<><FormLabel text="Date de debut"/><input type="date" style={S.input} value={startDate} onChange={e=>setStartDate(e.target.value)}/></>)}
            {bookType==="month" && (<><FormLabel text="Mois"/><input type="month" style={S.input} value={monthStr} onChange={e=>setMonthStr(e.target.value)}/></>)}
            {bookType!=="day" && (
              <label style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, fontSize:13, color:"#2C2C2C", cursor:"pointer" }}>
                <input type="checkbox" checked={inclSat} onChange={e=>setInclSat(e.target.checked)} style={{ width:16, height:16, accentColor:"#1E2F4F" }}/>
                Inclure les samedis
              </label>
            )}
            <FormLabel text="Extension d'heures" />
            <div style={{ display:"flex", gap:6, marginBottom:8 }}>
              {EXTRA_HOURS_OPTIONS.map(h => (
                <button key={h} onClick={()=>setExtraH(h)}
                  style={{ flex:1, border:"1.5px solid "+(extraH===h?"#D4AF37":"#E5E7EB"), borderRadius:8, padding:"8px 4px", fontSize:11, fontWeight:600, cursor:"pointer", background:extraH===h?"#FFFBEB":"#F8F9FB", color:extraH===h?"#1E2F4F":"#6B7280" }}>
                  {h===0?"Aucune":"+"+h+"h"}
                </button>
              ))}
            </div>
            {conflictDates.length>0 && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 12px", marginBottom:10, fontSize:11, color:"#C0392B" }}>
                {conflictDates.length} conflit{conflictDates.length>1?"s":""} detecto sur la periode
              </div>
            )}
            {candidateDates.length>0 && (
              <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"10px 12px", marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#1E2F4F" }}>{candidateDates.length} jours · {blockedHours}h bloquees</span>
                  <span style={{ fontSize:13, fontWeight:800, color:"#D4AF37" }}>{fmtEur(Math.round(totalCost))}</span>
                </div>
              </div>
            )}
            {/* Hotel */}
            <FormLabel text="Nuits d'hotel (optionnel)" />
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <button onClick={()=>setHotelNights(Math.max(0,hotelNights-1))}
                style={{ width:36, height:36, borderRadius:8, border:"1.5px solid #E5E7EB", background:"#F8F9FB", fontSize:18, cursor:"pointer", color:"#1E2F4F" }}>−</button>
              <div style={{ flex:1, textAlign:"center" }}>
                <span style={{ fontSize:20, fontWeight:800, color:"#1E2F4F" }}>{hotelNights}</span>
                <span style={{ fontSize:12, color:"#6B7280", marginLeft:6 }}>nuit{hotelNights>1?"s":""}</span>
                {hotelNights>0 && <div style={{ fontSize:11, color:"#D4AF37", fontWeight:600 }}>{fmtEur(hotelNights*HOTEL_RATE)} ({HOTEL_RATE}€/nuit)</div>}
              </div>
              <button onClick={()=>setHotelNights(hotelNights+1)}
                style={{ width:36, height:36, borderRadius:8, border:"1.5px solid #E5E7EB", background:"#F8F9FB", fontSize:18, cursor:"pointer", color:"#1E2F4F" }}>+</button>
            </div>
            {/* Frais de bouche */}
            <FormLabel text="Repas du soir (18€/soir)" />
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <button onClick={()=>setRepasSoirs(Math.max(0,repasSoirs-1))}
                style={{ width:36, height:36, borderRadius:8, border:"1.5px solid #E5E7EB", background:"#F8F9FB", fontSize:18, cursor:"pointer", color:"#1E2F4F" }}>−</button>
              <div style={{ flex:1, textAlign:"center" }}>
                <span style={{ fontSize:20, fontWeight:800, color:"#1E2F4F" }}>{repasSoirs}</span>
                <span style={{ fontSize:12, color:"#6B7280", marginLeft:6 }}>soir{repasSoirs>1?"s":""}</span>
                {repasSoirs>0 && <div style={{ fontSize:11, color:"#D4AF37", fontWeight:600 }}>{fmtEur(repasSoirs*REPAS_RATE)} ({REPAS_RATE}€/soir)</div>}
              </div>
              <button onClick={()=>setRepasSoirs(repasSoirs+1)}
                style={{ width:36, height:36, borderRadius:8, border:"1.5px solid #E5E7EB", background:"#F8F9FB", fontSize:18, cursor:"pointer", color:"#1E2F4F" }}>+</button>
            </div>
            <button style={{ ...S.btnGold, width:"100%" }} onClick={()=>setStep("summary")}>Voir le resume</button>
          </div>
        )}

        {/* ETAPE 4 — Resume */}
        {step==="summary" && collab && (
          <div>
            {[
              { label:"Partenaire",        value:(partners.find(x=>x.id===partnerId)||{}).name||"—" },
              { label:"Collaborateur",     value:collab.name },
              { label:"Duree commerciale", value:(COMMERCIAL_TYPES.find(x=>x.id===bookType)||{}).label||bookType },
              { label:"Date de debut",     value:fmtDateFR(candidateDates[0]||startDate) },
              { label:"Date de fin",       value:fmtDateFR(endDate) },
              { label:"Jours",             value:candidateDates.length+" jour"+(candidateDates.length!==1?"s":"") },
              { label:"Heures bloquees",   value:blockedHours+"h" },
              ...(extraH>0?[{label:"Extension",value:"+"+extraH+"h"}]:[]),
            ].map(row=>(
              <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #F8F9FB", padding:"9px 0" }}>
                <span style={{ fontSize:12, color:"#6B7280" }}>{row.label}</span>
                <span style={{ fontSize:13, fontWeight:600, color:"#1E2F4F" }}>{row.value}</span>
              </div>
            ))}
            <div style={{ background:"#1E2F4F", borderRadius:12, padding:"14px 16px", marginTop:14, marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: hotelNights>0?8:0 }}>
                <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>Tarif collaborateur HT</span>
                <span style={{ fontWeight:700, fontSize:16, color:"rgba(255,255,255,.85)" }}>{fmtEur(Math.round(collabCost))}</span>
              </div>
              {hotelNights > 0 && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>Hotel ({hotelNights} nuit{hotelNights>1?"s":""} × {HOTEL_RATE}€)</span>
                  <span style={{ fontWeight:700, fontSize:16, color:"rgba(255,255,255,.85)" }}>{fmtEur(hotelCost)}</span>
                </div>
              )}
              {repasSoirs > 0 && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>Repas soir ({repasSoirs} × {REPAS_RATE}€)</span>
                  <span style={{ fontWeight:700, fontSize:16, color:"rgba(255,255,255,.85)" }}>{fmtEur(repasCost)}</span>
                </div>
              )}
              {(hotelNights > 0 || repasSoirs > 0) && (
                <div style={{ borderTop:"1px solid rgba(255,255,255,.15)", paddingTop:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>Total HT</span>
                    <span style={{ fontWeight:800, fontSize:22, color:"#D4AF37" }}>{fmtEur(Math.round(totalCost))}</span>
                  </div>
                </div>
              )}
              {hotelNights === 0 && repasSoirs === 0 && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>Total HT</span>
                  <span style={{ fontWeight:800, fontSize:22, color:"#D4AF37" }}>{fmtEur(Math.round(totalCost))}</span>
                </div>
              )}
            </div>
            <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"10px 12px", marginBottom:12, fontSize:10, color:"#92400E", lineHeight:1.6 }}>
              Estimation indicative HT — ne constitue pas une facture. Facturation finale par JCF Luxtalent.
            </div>
            <FormLabel text="Commentaire (optionnel)" />
            <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Notes internes..."
              style={{ ...S.input, resize:"none", height:52, lineHeight:1.5, fontSize:12 }} />
            <button style={{ ...S.btnGold, width:"100%", marginTop:4 }} onClick={confirm}>
              Confirmer la mise a disposition
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CHAPITRE 5 — Planning
// ════════════════════════════════════════════════════════════
function Chapter5({ onDone }) {
  const [page, setPage] = useState(0);
  const slides = [
    {
      tag:"Chapitre 5", title:"Planning",
      body:"Le planning est le coeur visuel de JCF OS.\n\nEn moins de 5 secondes, l'utilisateur doit comprendre qui travaille, ou, quand, avec qui, et qui reste disponible.",
      badge:"\uD83D\uDFE2 VALIDE V1"
    },
    {
      tag:"Philosophie", title:"Un agenda. Pas un tableur.",
      body:"Le planning doit etre clair, visuel, intuitif, agreable et premium.\n\nL'utilisateur doit avoir le sentiment de consulter un agenda moderne plutot qu'un logiciel de gestion.",
    },
    {
      tag:"3 vues disponibles", title:"Semaine · Calendrier · Timeline",
      views:true,
    },
    {
      tag:"Codes couleur", title:"Lisibilite immediate.",
      colors:true,
    },
    {
      tag:"Vue Admin", title:"La vue la plus complete.",
      body:"L'administrateur voit tous les collaborateurs, toutes les mises a disposition, toutes les missions, toutes les absences.\n\nIl peut creer, modifier, deplacer ou supprimer directement depuis le planning.",
    },
    {
      tag:"Vue Collaborateur", title:"Uniquement ses propres donnees.",
      body:"Chaque collaborateur voit uniquement ses propres affectations, missions, mises a disposition, conges et absences.\n\nLecture simple. Aucune information superflue.",
    },
    {
      tag:"Vue Partenaire", title:"Les reservations au premier plan.",
      body:"Chaque partenaire visualise les collaborateurs reserves, leurs periodes, les reservations a venir et l'historique.\n\nLecture visuelle immediate sans liste complexe.",
      last:true,
    },
  ];

  const VIEWS_LIST = [
    { icon:"\uD83D\uDCC5", label:"Semaine",    sub:"Vue jour par jour, tous les collabs" },
    { icon:"\uD83D\uDDD3", label:"Calendrier", sub:"Vue mensuelle avec points couleur"   },
    { icon:"\uD83D\uDCCA", label:"Timeline",   sub:"Blocs continus type Gantt, par mois" },
  ];
  const COLORS_LIST = [
    { color:"#2E8B57", bg:"#ECFDF5", label:"Disponible"  },
    { color:"#1E2F4F", bg:"#EFF6FF", label:"Travail"     },
    { color:"#1E2F4F", bg:"#FFFBEB", label:"Mission"     },
    { color:"#8B5CF6", bg:"#F5F3FF", label:"Conges"      },
    { color:"#C0392B", bg:"#FEF2F2", label:"Maladie"     },
    { color:"#5D84C3", bg:"#EFF6FF", label:"Recup"       },
    { color:"#6B7280", bg:"#F3F4F6", label:"Repos"       },
  ];

  const slide = slides[page]; const isLast = page === slides.length - 1;
  return (
    <div style={{ minHeight:"100dvh", background:"#1E2F4F", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", fontFamily:"Inter,system-ui,sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ height:3, background:"rgba(255,255,255,.12)", flexShrink:0 }}>
        <div style={{ height:"100%", width:((page+1)/slides.length*100)+"%", background:"#D4AF37", transition:"width .4s ease" }} />
      </div>
      <div style={{ padding:"20px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="jcf-brand" style={{ fontWeight:700, fontSize:12, color:"#1E2F4F", letterSpacing:"1px" }}>JCF</span>
          </div>
          <span style={{ fontWeight:800, fontSize:14, color:"#D4AF37" }}>OS · Ch.5</span>
        </div>
        <button onClick={onDone} style={{ background:"rgba(255,255,255,.1)", border:"none", borderRadius:8, padding:"6px 14px", color:"rgba(255,255,255,.5)", fontSize:12, cursor:"pointer" }}>Passer</button>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"32px 24px" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#D4AF37", letterSpacing:"1px", textTransform:"uppercase", marginBottom:16 }}>{slide.tag}</div>
        <h1 style={{ fontSize:24, fontWeight:800, color:"#ffffff", margin:"0 0 20px", lineHeight:1.25, letterSpacing:"-0.5px" }}>{slide.title}</h1>
        {slide.body && (
          <div style={{ fontSize:15, color:"rgba(255,255,255,.65)", lineHeight:1.75 }}>
            {slide.body.split("\n").map((line, i) => (
              <div key={i} style={{ marginBottom:line===""?8:0 }}>{line===""?"\u00A0":line}</div>
            ))}
          </div>
        )}
        {slide.views && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {VIEWS_LIST.map((v,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:14, background:"rgba(255,255,255,.07)", borderRadius:12, padding:"14px", border:"1px solid rgba(255,255,255,.1)" }}>
                <span style={{ fontSize:22 }}>{v.icon}</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:"#ffffff" }}>{v.label}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", marginTop:2 }}>{v.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {slide.colors && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {COLORS_LIST.map(c => (
              <div key={c.label} style={{ background:c.bg, borderRadius:20, padding:"6px 14px" }}>
                <span style={{ fontSize:12, fontWeight:600, color:c.color }}>{c.label}</span>
              </div>
            ))}
          </div>
        )}
        {slide.badge && (
          <div style={{ marginTop:24, display:"inline-flex", alignItems:"center", gap:8, background:"rgba(212,175,55,.15)", border:"1px solid rgba(212,175,55,.3)", borderRadius:8, padding:"8px 14px", alignSelf:"flex-start" }}>
            <span style={{ fontSize:12, color:"#D4AF37", fontWeight:600 }}>{slide.badge}</span>
          </div>
        )}
      </div>
      <div style={{ padding:"0 24px 36px", display:"flex", flexDirection:"column", gap:12, flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:4 }}>
          {slides.map((_, i) => (
            <div key={i} style={{ width:i===page?20:6, height:6, borderRadius:3, background:i===page?"#D4AF37":"rgba(255,255,255,.2)", transition:"width .3s, background .3s", cursor:"pointer" }} onClick={() => setPage(i)} />
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {page > 0 && (
            <button onClick={() => setPage(p=>p-1)} style={{ flex:1, background:"rgba(255,255,255,.1)", border:"none", borderRadius:12, padding:"14px", fontWeight:600, fontSize:14, color:"rgba(255,255,255,.7)", cursor:"pointer" }}>Precedent</button>
          )}
          <button onClick={() => isLast ? onDone() : setPage(p=>p+1)} style={{ flex:2, background:"#D4AF37", border:"none", borderRadius:12, padding:"14px", fontWeight:700, fontSize:14, color:"#1E2F4F", cursor:"pointer" }}>
            {isLast ? "Acceder a JCF OS" : "Suivant"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPOSANT PLANNING TIMELINE (vue Gantt horizontale)
// Vue premium : blocs continus par collaborateur x jours du mois
// ════════════════════════════════════════════════════════════
function PlanningTimeline({ assignments, year, month, onPrev, onNext, onToday, onCellClick, onBlockClick }) {
  const monthStr  = year+"-"+String(month+1).padStart(2,"0");
  const lastDay   = new Date(year, month+1, 0).getDate();
  const days      = Array.from({length:lastDay},(_,i)=>{
    const n = i+1;
    const ds = year+"-"+String(month+1).padStart(2,"0")+"-"+String(n).padStart(2,"0");
    const dow = new Date(ds+"T12:00:00").getDay();
    return { n, ds, dow };
  });

  // Légende codes couleur
  const LEGEND = [
    { label:"Travail",   color:"#1E2F4F", bg:"#EFF6FF"  },
    { label:"Mission",   color:"#1E2F4F", bg:"#FFFBEB"  },
    { label:"Conges",    color:"#8B5CF6", bg:"#F5F3FF"  },
    { label:"Maladie",   color:"#C0392B", bg:"#FEF2F2"  },
    { label:"Repos",     color:"#6B7280", bg:"#F3F4F6"  },
    { label:"Dispo",     color:"#2E8B57", bg:"#ECFDF5"  },
  ];

  // Par collaborateur et par jour
  const assignMap = useMemo(() => {
    const m = {};
    assignments.filter(a => a.date.startsWith(monthStr)).forEach(a => {
      const key = a.collaboratorId+":"+a.date;
      m[key] = a;
    });
    return m;
  }, [assignments, monthStr]);

  // Stat du mois
  const monthA = assignments.filter(a=>a.date.startsWith(monthStr));
  const actifs = new Set(monthA.filter(a=>isWorkType(a.typeId)).map(a=>a.collaboratorId)).size;
  const totalH = monthA.filter(a=>isWorkType(a.typeId)).reduce((s,a)=>s+a.hours,0);

  // Couleur d'une case
  const cellStyle = (a) => {
    if (!a) return { bg:"#F8F9FB", color:"transparent", border:"none" };
    if (isWorkType(a.typeId)) {
      const c = COLLABORATORS.find(x=>x.id===a.collaboratorId);
      if (isMission(a.locationId)) return { bg:"#FFFBEB", color:"#D4AF37", border:c?c.color:"#D4AF37" };
      return { bg:c?c.color+"18":"#EFF6FF", color:c?c.color:"#1E2F4F", border:c?c.color+"60":"#BFDBFE" };
    }
    const abs = absStyle(a.typeId);
    return { bg:abs.bg, color:abs.textColor, border:abs.border+"40" };
  };

  const CELL_W = 28; // largeur px par jour
  const ROW_H  = 40;

  return (
    <div>
      {/* Nav mois */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 16px 4px" }}>
        <button onClick={onPrev} style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F", fontSize:16 }}>&#8249;</button>
        <div style={{ flex:1, textAlign:"center", fontWeight:700, fontSize:14, color:"#1E2F4F" }}>{MONTH_NAMES[month]} {year}</div>
        <button onClick={onToday} style={{ ...S.btn, padding:"5px 10px", background:"#FFFBEB", color:"#1E2F4F", fontSize:11 }}>Auj.</button>
        <button onClick={onNext} style={{ ...S.btn, padding:"5px 12px", background:"#F8F9FB", color:"#1E2F4F", fontSize:16 }}>&#8250;</button>
      </div>

      {/* KPIs */}
      <div style={{ display:"flex", gap:6, padding:"4px 16px 6px" }}>
        <div style={{ flex:1, background:"#ffffff", borderRadius:10, padding:"8px 10px", textAlign:"center", boxShadow:"0 1px 4px rgba(30,47,79,.06)", borderTop:"3px solid #1E2F4F" }}>
          <div style={{ fontSize:16, fontWeight:800, color:"#1E2F4F" }}>{actifs}</div>
          <div style={{ fontSize:9, color:"#6B7280" }}>actifs ce mois</div>
        </div>
        <div style={{ flex:1, background:"#ffffff", borderRadius:10, padding:"8px 10px", textAlign:"center", boxShadow:"0 1px 4px rgba(30,47,79,.06)", borderTop:"3px solid #D4AF37" }}>
          <div style={{ fontSize:16, fontWeight:800, color:"#D4AF37" }}>{totalH}h</div>
          <div style={{ fontSize:9, color:"#6B7280" }}>heures planifiees</div>
        </div>
        <div style={{ flex:2, background:"#ffffff", borderRadius:10, padding:"8px 10px", textAlign:"center", boxShadow:"0 1px 4px rgba(30,47,79,.06)", borderTop:"3px solid #2E8B57" }}>
          <div style={{ fontSize:11, fontWeight:600, color:"#6B7280" }}>
            {MONTH_NAMES[month]} {year} · {lastDay} jours
          </div>
        </div>
      </div>

      {/* Légende */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:4, padding:"0 16px 6px" }}>
        {LEGEND.map(l=>(
          <div key={l.label} style={{ background:l.bg, borderRadius:10, padding:"3px 8px" }}>
            <span style={{ fontSize:10, fontWeight:600, color:l.color }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Grille scrollable horizontalement */}
      <div style={{ overflowX:"auto", paddingBottom:8 }}>
        <div style={{ minWidth: 120+CELL_W*lastDay }}>

          {/* En-tête jours */}
          <div style={{ display:"flex", borderBottom:"1px solid #E5E7EB", position:"sticky", top:0, background:"#F8F9FB", zIndex:2 }}>
            <div style={{ width:120, flexShrink:0, padding:"6px 10px", fontSize:11, fontWeight:700, color:"#1E2F4F", borderRight:"1px solid #E5E7EB" }}>
              {MONTH_NAMES[month].slice(0,3).toUpperCase()}
            </div>
            {days.map(d=>{
              const isToday = d.ds===TODAY;
              const isWE    = d.dow===0||d.dow===6;
              return (
                <div key={d.ds} style={{ width:CELL_W, flexShrink:0, textAlign:"center", padding:"4px 0",
                  background:isToday?"#FFFBEB":"transparent",
                  borderLeft:"1px solid "+(isToday?"#D4AF37":"#F1F3F6") }}>
                  <div style={{ fontSize:9, color:isToday?"#D4AF37":isWE?"#C0392B":"#9CA3AF", fontWeight:isToday?700:400 }}>{DAY_NAMES[d.dow].slice(0,1)}</div>
                  <div style={{ fontSize:11, fontWeight:isToday?700:500, color:isToday?"#D4AF37":isWE?"#C0392B":"#6B7280" }}>{d.n}</div>
                </div>
              );
            })}
          </div>

          {/* Lignes collaborateurs */}
          {COLLABORATORS.map((c,ci)=>(
            <div key={c.id} style={{ display:"flex", borderBottom:"1px solid #F1F3F6",
              background:ci%2===0?"#ffffff":"#FAFBFC", minHeight:ROW_H }}>
              {/* Nom collab */}
              <div style={{ width:120, flexShrink:0, display:"flex", alignItems:"center", gap:8, padding:"0 10px",
                borderRight:"1px solid #E5E7EB", position:"sticky", left:0, background:"inherit", zIndex:1 }}>
                <ColAvatar c={c} size={22} />
                <span style={{ fontSize:11, fontWeight:600, color:"#1E2F4F", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {c.name.split(" ")[0]}
                </span>
              </div>
              {/* Cellules jours */}
              {days.map(d=>{
                const a   = assignMap[c.id+":"+d.ds];
                const cs  = cellStyle(a);
                const isToday = d.ds===TODAY;
                return (
                  <div key={d.ds}
                    style={{ width:CELL_W, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                      background:a?cs.bg:(isToday?"#FFFBEB08":"transparent"),
                      borderLeft:"1px solid "+(isToday?"#D4AF3730":"#F1F3F6"),
                      borderTop:a?"2px solid "+cs.border:"none",
                      cursor:"pointer", position:"relative" }}
                    onClick={()=>a?onBlockClick(a):onCellClick(c.id,d.ds)}
                  >
                    {a && isWorkType(a.typeId) && (
                      <div style={{ width:CELL_W-4, height:ROW_H-8, borderRadius:3, background:cs.bg,
                        border:"1px solid "+cs.border, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <div style={{ width:4, height:4, borderRadius:2, background:cs.color }} />
                      </div>
                    )}
                    {a && !isWorkType(a.typeId) && (
                      <div style={{ width:CELL_W-6, height:ROW_H-10, borderRadius:3, background:cs.bg,
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <div style={{ fontSize:7, color:cs.color, fontWeight:700, textAlign:"center", lineHeight:1 }}>
                          {getLocName(a.locationId).slice(0,2)}
                        </div>
                      </div>
                    )}
                    {!a && (
                      <div style={{ width:CELL_W-6, height:ROW_H-10, borderRadius:3,
                        background:"transparent", display:"flex", alignItems:"center", justifyContent:"center",
                        opacity:0, transition:"opacity .15s" }}
                        onMouseEnter={e=>e.currentTarget.style.opacity="1"}
                        onMouseLeave={e=>e.currentTarget.style.opacity="0"}
                      >
                        <span style={{ fontSize:12, color:"#D4AF37" }}>+</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:"4px 16px 4px", fontSize:10, color:"#9CA3AF", textAlign:"center" }}>
        Cliquer sur un bloc pour le modifier · Cliquer sur une case vide pour affecter
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CHAPITRE 6 — Tarification
// ════════════════════════════════════════════════════════════
function Chapter6({ onDone }) {
  const [page, setPage] = useState(0);

  const slides = [
    {
      tag:"Chapitre 6", title:"Tarification",
      body:"Le module Tarification permet a JCF OS d'afficher automatiquement une estimation coherente des mises a disposition.\n\nIl constitue un outil d'aide a la decision. Il ne remplace jamais la facturation officielle.",
      badge:"\uD83D\uDFE2 VALIDE V1",
    },
    {
      tag:"Philosophie", title:"Pilotee par JCF Luxtalent. Uniquement.",
      body:"La tarification est entierement pilotee par JCF Luxtalent.\n\nLes partenaires consultent une estimation.\n\nLa validation finale reste toujours sous le controle de l'administration.",
    },
    {
      tag:"Grille individuelle", title:"Chaque collaborateur a sa propre grille.",
      body:"Deux collaborateurs occupant le meme poste peuvent avoir des tarifs differents.\n\nAucune categorie metier ne suppose automatiquement un tarif identique.\n\nLa grille est administrable uniquement par l'administration.",
      grid:true,
    },
    {
      tag:"Estimation automatique", title:"Collaborateur + periode = estimation.",
      body:"L'utilisateur choisit un collaborateur et une periode.\n\nJCF OS calcule automatiquement l'estimation a partir de la grille tarifaire, de la periode et des regles metier.",
      calc:true,
    },
    {
      tag:"Affichage", title:"Toujours indicatif. Jamais contractuel.",
      body:"Les montants affiches sont :\n\n· Des estimations hors taxes\n· Fournis a titre indicatif\n\nIls ne constituent jamais :\n\n· Une facture\n· Un engagement contractuel\n· Un document comptable",
    },
    {
      tag:"Protection", title:"Le modele economique est protege.",
      body:"Le moteur tarifaire ne permet jamais a un partenaire de contourner les regles en fractionnant artificiellement une reservation ou en reduisant sa duree pour en diminuer le cout.\n\nLes regles de calcul protegent en priorite le modele economique de JCF Luxtalent.",
    },
    {
      tag:"Administration", title:"Un acces reserve a l'admin.",
      body:"L'administrateur peut creer, modifier et mettre a jour toutes les grilles tarifaires.\n\nLes partenaires ne disposent d'aucun acces a ces parametres.",
      last:true,
    },
  ];

  const GRID_ITEMS = [
    { label:"Tarif journee",   key:"day"       },
    { label:"Tarif semaine",   key:"week"       },
    { label:"Tarif quinzaine", key:"fortnight"  },
    { label:"Tarif mensuel",   key:"month"      },
    { label:"Tarif horaire",   key:"hourly"     },
    { label:"Minimum mensuel", key:"minimumMonthly" },
  ];

  const CALC_STEPS = [
    { n:"1", label:"Collaborateur selectionne",  sub:"Grille tarifaire individuelle" },
    { n:"2", label:"Periode choisie",            sub:"Journee · Semaine · Quinzaine · Mois" },
    { n:"3", label:"Estimation calculee",        sub:"Affichage instantane HT" },
  ];

  const slide = slides[page]; const isLast = page === slides.length - 1;

  return (
    <div style={{ minHeight:"100dvh", background:"#1E2F4F", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", fontFamily:"Inter,system-ui,sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ height:3, background:"rgba(255,255,255,.12)", flexShrink:0 }}>
        <div style={{ height:"100%", width:((page+1)/slides.length*100)+"%", background:"#D4AF37", transition:"width .4s ease" }} />
      </div>
      <div style={{ padding:"20px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="jcf-brand" style={{ fontWeight:700, fontSize:12, color:"#1E2F4F", letterSpacing:"1px" }}>JCF</span>
          </div>
          <span style={{ fontWeight:800, fontSize:14, color:"#D4AF37" }}>OS · Ch.6</span>
        </div>
        <button onClick={onDone} style={{ background:"rgba(255,255,255,.1)", border:"none", borderRadius:8, padding:"6px 14px", color:"rgba(255,255,255,.5)", fontSize:12, cursor:"pointer" }}>Passer</button>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"32px 24px" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#D4AF37", letterSpacing:"1px", textTransform:"uppercase", marginBottom:16 }}>{slide.tag}</div>
        <h1 style={{ fontSize:22, fontWeight:800, color:"#ffffff", margin:"0 0 20px", lineHeight:1.25, letterSpacing:"-0.5px" }}>{slide.title}</h1>

        {slide.body && (
          <div style={{ fontSize:15, color:"rgba(255,255,255,.65)", lineHeight:1.75 }}>
            {slide.body.split("\n").map((line, i) => (
              <div key={i} style={{ marginBottom:line===""?8:0 }}>{line===""?"\u00A0":line}</div>
            ))}
          </div>
        )}

        {slide.grid && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
            {GRID_ITEMS.map(item => (
              <div key={item.key} style={{ background:"rgba(255,255,255,.07)", borderRadius:10, padding:"10px 12px", border:"1px solid rgba(255,255,255,.1)" }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", marginBottom:4 }}>{item.label}</div>
                <div style={{ fontSize:13, fontWeight:700, color:"#D4AF37" }}>
                  {fmtEur(INITIAL_RATES["c7"][item.key] || 0)}
                </div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,.3)", marginTop:2 }}>ex: ABBI</div>
              </div>
            ))}
          </div>
        )}

        {slide.calc && (
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:8 }}>
            {CALC_STEPS.map((step, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:14, background:"rgba(255,255,255,.07)", borderRadius:12, padding:"14px", border:"1px solid rgba(255,255,255,.1)" }}>
                <div style={{ width:32, height:32, borderRadius:16, background:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:14, fontWeight:800, color:"#1E2F4F" }}>{step.n}</span>
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:"#ffffff" }}>{step.label}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", marginTop:2 }}>{step.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {slide.badge && (
          <div style={{ marginTop:24, display:"inline-flex", alignItems:"center", gap:8, background:"rgba(212,175,55,.15)", border:"1px solid rgba(212,175,55,.3)", borderRadius:8, padding:"8px 14px", alignSelf:"flex-start" }}>
            <span style={{ fontSize:12, color:"#D4AF37", fontWeight:600 }}>{slide.badge}</span>
          </div>
        )}
      </div>

      <div style={{ padding:"0 24px 36px", display:"flex", flexDirection:"column", gap:12, flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:4 }}>
          {slides.map((_, i) => (
            <div key={i}
              style={{ width:i===page?20:6, height:6, borderRadius:3, background:i===page?"#D4AF37":"rgba(255,255,255,.2)", transition:"width .3s, background .3s", cursor:"pointer" }}
              onClick={() => setPage(i)} />
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {page > 0 && (
            <button onClick={() => setPage(p=>p-1)}
              style={{ flex:1, background:"rgba(255,255,255,.1)", border:"none", borderRadius:12, padding:"14px", fontWeight:600, fontSize:14, color:"rgba(255,255,255,.7)", cursor:"pointer" }}>
              Precedent
            </button>
          )}
          <button onClick={() => isLast ? onDone() : setPage(p=>p+1)}
            style={{ flex:2, background:"#D4AF37", border:"none", borderRadius:12, padding:"14px", fontWeight:700, fontSize:14, color:"#1E2F4F", cursor:"pointer" }}>
            {isLast ? "Acceder a JCF OS" : "Suivant"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CHAPITRE 7 — Dashboard
// ════════════════════════════════════════════════════════════
function Chapter7({ onDone }) {
  const [page, setPage] = useState(0);

  const slides = [
    {
      tag:   "Chapitre 7 · Final",
      title: "Dashboard",
      body:  "Le Dashboard est la page d'accueil de JCF OS.\n\nEn quelques secondes, l'utilisateur comprend la situation operationnelle complete de l'entreprise.\n\nIl privilegie la lisibilite, la rapidite et la prise de decision.",
      badge: "\uD83D\uDFE2 VALIDE V1",
    },
    {
      tag:   "Philosophie",
      title: "Un outil operationnel. Pas des statistiques.",
      body:  "Le Dashboard n'est pas un tableau de bord analytique.\n\nIl repond immediatement aux questions essentielles du quotidien sans obliger l'utilisateur a ouvrir plusieurs ecrans.",
    },
    {
      tag:   "Questions essentielles",
      title: "6 reponses en un coup d'oeil.",
      questions: true,
    },
    {
      tag:   "Lecture immediate",
      title: "Cartes, badges, couleurs, pictogrammes.",
      body:  "Le Dashboard privilegie :\n\n· Les cartes visuelles\n· Les badges de statut\n· Les indicateurs couleur\n· Les pictogrammes\n\nIl evite absolument les tableaux complexes.",
      visual: true,
    },
    {
      tag:   "Navigation rapide",
      title: "Tout accessible en un minimum d'actions.",
      nav:   true,
    },
    {
      tag:   "Alertes",
      title: "Rares. Pertinentes. Jamais envahissantes.",
      body:  "Le Dashboard peut signaler visuellement un conflit de planning, une absence importante ou une anomalie necessitant une intervention.\n\nLes alertes restent rares et ne surchargent jamais l'ecran.",
      alert: true,
    },
    {
      tag:   "Experience utilisateur",
      title: "Maitrise. Fluidite. Serenite.",
      body:  "En ouvrant JCF OS, l'utilisateur doit immediatement ressentir que toute l'activite est parfaitement organisee sans effort apparent.\n\nLe Dashboard est la vitrine de qualite de JCF OS.",
      last:  true,
    },
  ];

  const QUESTIONS = [
    { icon:"\uD83D\uDC65", q:"Qui travaille aujourd'hui ?"       },
    { icon:"\u2705",         q:"Qui est disponible ?"              },
    { icon:"\uD83D\uDEAB",  q:"Qui est absent ?"                 },
    { icon:"\uD83C\uDFAF",  q:"Quelles missions sont en cours ?" },
    { icon:"\uD83D\uDCCB",  q:"Quelles MAD sont actives ?"       },
    { icon:"\uD83D\uDCC5",  q:"Quelles affectations arrivent ?"  },
  ];

  const NAV_ITEMS = [
    { icon:"\uD83D\uDC65", label:"Collaborateur", color:"#1E2F4F" },
    { icon:"\uD83E\uDD1D", label:"Partenaire",    color:"#2D456B" },
    { icon:"\uD83D\uDCCB", label:"Mise a dispo",  color:"#5D84C3" },
    { icon:"\uD83C\uDFAF", label:"Mission",        color:"#2E8B57" },
    { icon:"\uD83D\uDCC5", label:"Planning",       color:"#D4AF37" },
  ];

  const slide  = slides[page];
  const isLast = page === slides.length - 1;

  return (
    <div style={{ minHeight:"100dvh", background:"#1E2F4F", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", fontFamily:"Inter,system-ui,sans-serif" }}>
      <style>{CSS}</style>

      {/* Progress */}
      <div style={{ height:3, background:"rgba(255,255,255,.12)", flexShrink:0 }}>
        <div style={{ height:"100%", width:((page+1)/slides.length*100)+"%", background:"#D4AF37", transition:"width .4s ease" }} />
      </div>

      {/* Header */}
      <div style={{ padding:"20px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="jcf-brand" style={{ fontWeight:700, fontSize:12, color:"#1E2F4F", letterSpacing:"1px" }}>JCF</span>
          </div>
          <span style={{ fontWeight:800, fontSize:14, color:"#D4AF37" }}>OS · Ch.7</span>
        </div>
        <button onClick={onDone} style={{ background:"rgba(255,255,255,.1)", border:"none", borderRadius:8, padding:"6px 14px", color:"rgba(255,255,255,.5)", fontSize:12, cursor:"pointer" }}>
          Passer
        </button>
      </div>

      {/* Contenu */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"32px 24px" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#D4AF37", letterSpacing:"1px", textTransform:"uppercase", marginBottom:16 }}>
          {slide.tag}
        </div>
        <h1 style={{ fontSize:22, fontWeight:800, color:"#ffffff", margin:"0 0 20px", lineHeight:1.25, letterSpacing:"-0.5px" }}>
          {slide.title}
        </h1>

        {slide.body && (
          <div style={{ fontSize:15, color:"rgba(255,255,255,.65)", lineHeight:1.75 }}>
            {slide.body.split("\n").map((line, i) => (
              <div key={i} style={{ marginBottom:line===""?8:0 }}>{line===""?"\u00A0":line}</div>
            ))}
          </div>
        )}

        {slide.questions && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {QUESTIONS.map((q, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,.07)", borderRadius:10, padding:"11px 14px", border:"1px solid rgba(255,255,255,.08)" }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{q.icon}</span>
                <span style={{ fontSize:13, color:"rgba(255,255,255,.8)", fontWeight:500 }}>{q.q}</span>
              </div>
            ))}
          </div>
        )}

        {slide.visual && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:4 }}>
            {[
              { label:"Actifs",      color:"#1E2F4F", bg:"#EFF6FF"  },
              { label:"Disponibles", color:"#2E8B57", bg:"#ECFDF5"  },
              { label:"Absents",     color:"#C0392B", bg:"#FEF2F2"  },
              { label:"Missions",    color:"#D4AF37", bg:"#FFFBEB"  },
              { label:"MAD actives", color:"#5D84C3", bg:"#EFF6FF"  },
              { label:"Alertes",     color:"#D97706", bg:"#FFFBEB"  },
            ].map(b => (
              <div key={b.label} style={{ background:b.bg, borderRadius:20, padding:"6px 14px" }}>
                <span style={{ fontSize:12, fontWeight:600, color:b.color }}>{b.label}</span>
              </div>
            ))}
          </div>
        )}

        {slide.nav && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {NAV_ITEMS.map((item, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,.07)", borderRadius:10, padding:"12px 14px", border:"1px solid rgba(255,255,255,.08)", cursor:"pointer" }}>
                <div style={{ width:34, height:34, borderRadius:17, background:item.color+"30", border:"1.5px solid "+item.color+"60", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:16 }}>{item.icon}</span>
                </div>
                <span style={{ fontSize:13, color:"rgba(255,255,255,.8)", fontWeight:600 }}>{item.label}</span>
                <span style={{ marginLeft:"auto", color:"rgba(255,255,255,.3)", fontSize:16 }}>&#8250;</span>
              </div>
            ))}
          </div>
        )}

        {slide.alert && (
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8 }}>
            {[
              { icon:"\u26A0\uFE0F", label:"Conflit de planning detecte",     color:"#D97706", bg:"rgba(217,119,6,.15)",  border:"rgba(217,119,6,.3)"  },
              { icon:"\uD83D\uDEAB", label:"Absence non planifiee",           color:"#C0392B", bg:"rgba(192,57,43,.15)",  border:"rgba(192,57,43,.3)"  },
            ].map((a, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:a.bg, borderRadius:10, padding:"12px 14px", border:"1px solid "+a.border }}>
                <span style={{ fontSize:18 }}>{a.icon}</span>
                <span style={{ fontSize:13, color:a.color, fontWeight:600 }}>{a.label}</span>
              </div>
            ))}
            <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", marginTop:4, lineHeight:1.6 }}>
              Les alertes restent rares et pertinentes. Elles ne surchargent jamais l'ecran.
            </div>
          </div>
        )}

        {slide.badge && (
          <div style={{ marginTop:24, display:"inline-flex", alignItems:"center", gap:8, background:"rgba(212,175,55,.15)", border:"1px solid rgba(212,175,55,.3)", borderRadius:8, padding:"8px 14px", alignSelf:"flex-start" }}>
            <span style={{ fontSize:12, color:"#D4AF37", fontWeight:600 }}>{slide.badge}</span>
          </div>
        )}

        {slide.last && (
          <div style={{ marginTop:20, background:"rgba(212,175,55,.08)", borderRadius:12, padding:"16px", border:"1px solid rgba(212,175,55,.2)" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>
              JCF OS V1 — Documentation complete
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,.6)", lineHeight:1.7 }}>
              7 chapitres · Architecture stable · Logique metier protegee
            </div>
            <div style={{ fontSize:12, color:"#D4AF37", fontStyle:"italic", marginTop:10 }}>
              La complexite est invisible.
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ padding:"0 24px 36px", display:"flex", flexDirection:"column", gap:12, flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:4 }}>
          {slides.map((_, i) => (
            <div key={i}
              style={{ width:i===page?20:6, height:6, borderRadius:3, background:i===page?"#D4AF37":"rgba(255,255,255,.2)", transition:"width .3s, background .3s", cursor:"pointer" }}
              onClick={() => setPage(i)} />
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {page > 0 && (
            <button onClick={() => setPage(p=>p-1)}
              style={{ flex:1, background:"rgba(255,255,255,.1)", border:"none", borderRadius:12, padding:"14px", fontWeight:600, fontSize:14, color:"rgba(255,255,255,.7)", cursor:"pointer" }}>
              Precedent
            </button>
          )}
          <button onClick={() => isLast ? onDone() : setPage(p=>p+1)}
            style={{ flex:2, background:"#D4AF37", border:"none", borderRadius:12, padding:"14px", fontWeight:700, fontSize:14, color:"#1E2F4F", cursor:"pointer" }}>
            {isLast ? "Acceder a JCF OS" : "Suivant"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPOSANTS PARTAGES
// ════════════════════════════════════════════════════════════
function TopBar({ user, onLogout, section, onRefresh }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:"#1E2F4F", flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span className="jcf-brand" style={{ fontWeight:700, fontSize:18, color:"#D4AF37", letterSpacing:"3px" }}>JCF</span>
        <span className="jcf-brand" style={{ fontWeight:400, fontSize:14, color:"rgba(255,255,255,.5)", letterSpacing:"2px", marginLeft:4 }}>LUXTALENT</span>
        {section && <span style={{ fontSize:12, color:"rgba(255,255,255,.45)", marginLeft:6 }}>{section}</span>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:12, color:"rgba(255,255,255,.5)" }}>{user.name}</span>
        <button onClick={onLogout} style={{ background:"none", border:"none", color:"rgba(255,255,255,.5)", fontSize:16, cursor:"pointer" }} title="Deconnexion">&#x21A9;</button>
      </div>
    </div>
  );
}

function BottomNav({ tabs, active, onChange }) {
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, display:"flex", background:"#1E2F4F", borderTop:"1px solid rgba(255,255,255,.07)", paddingBottom:"env(safe-area-inset-bottom,0)" }}>
      {tabs.map(t => (
        <button key={t.id}
          style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"8px 2px", background:"none", border:"none", color: active===t.id ? "#D4AF37" : "#5D84C3", cursor:"pointer", fontSize:10, lineHeight:1.2, borderTop: active===t.id ? "2px solid #D4AF37" : "2px solid transparent" }}
          onClick={() => onChange(t.id)}
        >
          <span style={{ fontSize:16 }}>{t.icon}</span>
          <span style={{ fontSize:9, marginTop:1 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function WeekNav({ weekDates, onPrev, onNext }) {
  const s = new Date(weekDates[0]+"T12:00:00");
  const e = new Date(weekDates[6]+"T12:00:00");
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 16px 4px" }}>
      <button onClick={onPrev} style={{ ...S.btn, padding:"6px 12px", background:"#F8F9FB", color:"#1E2F4F" }}>&#8249;</button>
      <div style={{ textAlign:"center", fontWeight:600, fontSize:13, color:"#1E2F4F" }}>
        {s.getDate()} - {e.getDate()} {MONTH_NAMES[e.getMonth()]} {e.getFullYear()}
      </div>
      <button onClick={onNext} style={{ ...S.btn, padding:"6px 12px", background:"#F8F9FB", color:"#1E2F4F" }}>&#8250;</button>
    </div>
  );
}

function ColAvatar({ c, size=36, textColor, bgAlpha }) {
  const alpha = bgAlpha || "20";
  return (
    <div style={{ width:size, height:size, borderRadius:size/2, background:c.color+alpha, border:"2px solid "+c.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.28, fontWeight:700, color:textColor||c.color, flexShrink:0, fontFamily:"monospace" }}>
      {c.avatar}
    </div>
  );
}


// ════════════════════════════════════════════════════════════
// MODULE CP — Congés Payés Luxembourg
// ════════════════════════════════════════════════════════════

function calcCPSolde(collabId, cpHours, assignments) {
  const y = new Date().getFullYear();
  const cpPoses = (assignments||[]).filter(a =>
    a.collaboratorId === collabId && a.typeId === "cp" &&
    (a.date.startsWith(String(y)) ||
     a.date.startsWith(String(y+1)+"-01") ||
     a.date.startsWith(String(y+1)+"-02") ||
     a.date.startsWith(String(y+1)+"-03"))
  );
  const jours = cpPoses.length;
  // Heures posées = nombre de jours × heures journalières du collaborateur
  const ex = (typeof COLLAB_EXTRA !== "undefined" ? COLLAB_EXTRA : {})[collabId] || {};
  const hJour = ex.weeklyHours ? Math.round(ex.weeklyHours / 5 * 10) / 10 : 8;
  const heuresPosees = jours * hJour;
  const joursTotal = Math.round((cpHours||0) / hJour);
  const joursTotal26 = 26; // Luxembourg : 26 jours légaux
  return { total:cpHours||0, pose:heuresPosees, solde:Math.max(0,(cpHours||0)-heuresPosees), jours, joursTotal:Math.min(joursTotal, joursTotal26) };
}

function alerteCP(solde, contractDate) {
  if (!contractDate || solde <= 0) return null;
  const month = new Date().getMonth() + 1;
  if (month === 3) return { level:"urgent",  msg:"Solde CP a poser avant le 31 mars !" };
  if (month === 2) return { level:"warning", msg:"Solde CP a poser avant le 31/03" };
  return null;
}

function CPSoldeCard({ collabId, cpHours, assignments, contractDate }) {
  if (!cpHours || cpHours === 0) return null;
  const s = calcCPSolde(collabId, cpHours, assignments);
  const alerte = alerteCP(s.solde, contractDate);
  const pct = s.joursTotal > 0 ? Math.round((s.jours / s.joursTotal) * 100) : 0;
  return (
    <div style={{ background:"#ffffff", borderRadius:12, padding:"14px", marginBottom:8, boxShadow:"0 1px 4px rgba(30,47,79,.06)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#1E2F4F", textTransform:"uppercase", letterSpacing:"0.5px" }}>Conges Payes</div>
        <div style={{ fontSize:11, color:"#6B7280" }}>Droit annuel : {s.joursTotal}j ({s.total}h)</div>
      </div>
      <div style={{ height:8, background:"#F0F0F0", borderRadius:4, marginBottom:8, overflow:"hidden" }}>
        <div style={{ height:"100%", width:pct+"%", background:pct>80?"#C0392B":pct>50?"#F59E0B":"#2E8B57", borderRadius:4 }} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#2E8B57" }}>{s.joursTotal-s.jours}j</div>
          <div style={{ fontSize:10, color:"#6B7280" }}>Solde restant</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#1E2F4F" }}>{s.jours}j</div>
          <div style={{ fontSize:10, color:"#6B7280" }}>Poses</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#D4AF37" }}>{s.joursTotal}j</div>
          <div style={{ fontSize:10, color:"#6B7280" }}>Total annuel</div>
        </div>
      </div>
      {alerte && (
        <div style={{ marginTop:10, background:alerte.level==="urgent"?"#FEF2F2":"#FFFBEB", borderRadius:8, padding:"8px 12px", border:"1px solid "+(alerte.level==="urgent"?"#FECACA":"#FDE68A") }}>
          <div style={{ fontSize:12, fontWeight:600, color:alerte.level==="urgent"?"#C0392B":"#92400E" }}>{alerte.msg}</div>
          <div style={{ fontSize:10, color:"#6B7280", marginTop:2 }}>Date butoir : 31 mars {new Date().getFullYear()}</div>
        </div>
      )}
      {contractDate && <div style={{ fontSize:11, color:"#6B7280", marginTop:8 }}>CDI depuis le {contractDate}</div>}
    </div>
  );
}

function CPRequestCard({ req, collab, onValidate, onRefuse }) {
  const st = { pending:{bg:"#FFFBEB",color:"#92400E",label:"En attente"}, approved:{bg:"#ECFDF5",color:"#2E8B57",label:"Validee"}, refused:{bg:"#FEF2F2",color:"#C0392B",label:"Refusee"} }[req.status]||{bg:"#F8F9FB",color:"#6B7280",label:req.status};
  return (
    <div style={{ background:"#ffffff", borderRadius:12, padding:"14px", marginBottom:8, boxShadow:"0 1px 4px rgba(30,47,79,.06)", borderLeft:"4px solid "+(req.status==="pending"?"#D4AF37":req.status==="approved"?"#2E8B57":"#C0392B") }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:13, color:"#1E2F4F" }}>{collab?collab.name:req.collaboratorId}</div>
          <div style={{ fontSize:11, color:"#6B7280", marginTop:2 }}>{req.dates.length} jour{req.dates.length>1?"s":""} · {fmtDateFR(req.dates[0])}{req.dates.length>1?" -> "+fmtDateFR(req.dates[req.dates.length-1]):""}</div>
        </div>
        <div style={{ background:st.bg, borderRadius:6, padding:"3px 8px", fontSize:10, fontWeight:600, color:st.color }}>{st.label}</div>
      </div>
      {req.comment && <div style={{ fontSize:11, color:"#6B7280", fontStyle:"italic", marginBottom:8 }}>"{req.comment}"</div>}
      {req.status==="pending" && (
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>onRefuse(req.id)} style={{ flex:1, border:"1.5px solid #FECACA", borderRadius:8, padding:"8px", fontSize:12, fontWeight:600, cursor:"pointer", background:"#FEF2F2", color:"#C0392B" }}>Refuser</button>
          <button onClick={()=>onValidate(req.id)} style={{ flex:2, border:"none", borderRadius:8, padding:"8px", fontSize:12, fontWeight:700, cursor:"pointer", background:"#D4AF37", color:"#1E2F4F" }}>Valider</button>
        </div>
      )}
      {req.status==="approved" && <div style={{ fontSize:11, color:"#2E8B57", marginTop:4 }}>CP poses dans le planning</div>}
    </div>
  );
}

function CPRequestModal({ collabId, cpHours, assignments, onClose, onSubmit, isCss }) {
  const [dateDebut, setDateDebut] = useState(TODAY);
  const [dateFin,   setDateFin]   = useState(TODAY);
  const [comment,   setComment]   = useState("");
  const s = calcCPSolde(collabId, cpHours, assignments);
  const dates = buildDateRange(dateDebut, dateFin);
  const joursOk = isCss ? dates.length > 0 : dates.length > 0 && dates.length <= (s.joursTotal - s.jours);
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={e=>e.stopPropagation()}>
        <div style={S.sheetHeader}>
          <span style={{ fontWeight:700, fontSize:15, color:"#1E2F4F" }}>Demander des conges</span>
          <button onClick={onClose} style={S.closeBtn}>&#x2715;</button>
        </div>
        {!isCss ? (
          <div style={{ background:"#F0FDF4", borderRadius:10, padding:"10px 14px", marginBottom:14, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, color:"#2E8B57" }}>Solde disponible</span>
            <span style={{ fontWeight:700, fontSize:14, color:"#2E8B57" }}>{s.joursTotal-s.jours}j</span>
          </div>
        ) : (
          <div style={{ background:"#FFF7ED", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
            <span style={{ fontSize:12, color:"#C2410C", fontWeight:600 }}>Conge sans solde — non remunere</span>
          </div>
        )}
        <FormLabel text="Date de debut" />
        <input type="date" style={S.input} value={dateDebut} min={TODAY} onChange={e=>{setDateDebut(e.target.value);if(e.target.value>dateFin)setDateFin(e.target.value);}} />
        <FormLabel text="Date de fin" />
        <input type="date" style={S.input} value={dateFin} min={dateDebut} onChange={e=>setDateFin(e.target.value)} />
        {dates.length > 0 && (
          <div style={{ background:joursOk?"#EFF6FF":"#FEF2F2", borderRadius:8, padding:"8px 12px", marginBottom:10, fontSize:12, color:joursOk?"#2D456B":"#C0392B" }}>
            {dates.length} jour{dates.length>1?"s":""} ouvre{dates.length>1?"s":""}{!joursOk?" — solde insuffisant":""}
          </div>
        )}
        <FormLabel text="Commentaire (optionnel)" />
        <textarea style={{ width:"100%", border:"1.5px solid #E5E7EB", borderRadius:10, padding:"10px", fontSize:13, color:"#2C2C2C", background:"#F8F9FB", marginBottom:12, resize:"none", height:72, boxSizing:"border-box" }} placeholder="Precisez si besoin..." value={comment} onChange={e=>setComment(e.target.value)} />
        <button style={{ ...S.btnGold, width:"100%", opacity:(dates.length===0||!joursOk)?0.5:1 }} disabled={dates.length===0||!joursOk}
          onClick={()=>{onSubmit({collaboratorId:collabId,dates,comment,status:"pending",createdAt:TODAY});onClose();}}>
          Envoyer la demande · {dates.length}j
        </button>
      </div>
    </div>
  );
}

function StatusTag({ label, color, bg }) {
  return (
    <span style={{ fontSize:10, fontWeight:600, color, background:bg, padding:"2px 8px", borderRadius:9, whiteSpace:"nowrap", flexShrink:0 }}>
      {label}
    </span>
  );
}

function KpiBox({ value, label, color }) {
  return (
    <div style={{ flex:1, background:"#ffffff", borderRadius:12, padding:"10px 6px", textAlign:"center", boxShadow:"0 1px 4px rgba(30,47,79,.06)", borderTop:"3px solid "+color }}>
      <div style={{ fontSize:18, fontWeight:800, color, fontVariantNumeric:"tabular-nums" }}>{value}</div>
      <div style={{ fontSize:9, color:"#6B7280", marginTop:2, lineHeight:1.3 }}>{label}</div>
    </div>
  );
}

function CaCard({ label, value, dark }) {
  return (
    <div style={{ flex:1, borderRadius:12, padding:"14px", background: dark ? "#1E2F4F" : "#ffffff", boxShadow:"0 1px 6px rgba(30,47,79,.06)" }}>
      <div style={{ fontSize:10, color: dark ? "rgba(255,255,255,.5)" : "#6B7280", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, color: dark ? "#D4AF37" : "#1E2F4F", fontVariantNumeric:"tabular-nums" }}>{fmtEur(value)}</div>
      <div style={{ fontSize:9, color: dark ? "rgba(255,255,255,.35)" : "#9CA3AF", marginTop:2 }}>Estimation HT</div>
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px 8px" }}>
      <span style={{ fontWeight:700, fontSize:14, color:"#1E2F4F" }}>{title}</span>
      {sub && <span style={{ fontSize:11, color:"#6B7280" }}>{sub}</span>}
    </div>
  );
}

function FormLabel({ text }) {
  return (
    <div style={{ fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:5, marginTop:10, letterSpacing:"0.3px", textTransform:"uppercase" }}>
      {text}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ background:"#ffffff", borderRadius:12, padding:"28px 16px", textAlign:"center", fontSize:13, color:"#9CA3AF", margin:"0 0 8px", boxShadow:"0 1px 4px rgba(30,47,79,.04)" }}>
      {text}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STYLES PARTAGÉS
// ════════════════════════════════════════════════════════════

const S = {
  app:          { display:"flex", flexDirection:"column", height:"100dvh", maxWidth:480, margin:"0 auto", fontFamily:"Inter,system-ui,sans-serif", background:"#F8F9FB", overflow:"hidden" },
  body:         { flex:1, overflowY:"auto", paddingBottom:80 },
  page:         { paddingTop:4 },

  card:         { display:"flex", alignItems:"center", gap:12, background:"#ffffff", borderRadius:12, padding:"13px 14px", marginBottom:8, boxShadow:"0 1px 4px rgba(30,47,79,.05)", cursor:"pointer" },
  cardList:     { display:"flex", flexDirection:"column", gap:6, padding:"0 16px 8px" },
  missionCard:  { background:"#ffffff", borderRadius:12, padding:"14px", boxShadow:"0 1px 4px rgba(30,47,79,.05)", marginBottom:8 },

  kpiRow:       { display:"flex", gap:8, padding:"8px 16px" },
  row2:         { display:"flex", gap:10, padding:"0 16px 8px" },

  planRow:      { display:"flex", alignItems:"center", gap:10, background:"#ffffff", borderRadius:12, padding:"11px 14px", cursor:"pointer", boxShadow:"0 1px 4px rgba(30,47,79,.04)" },
  dayTabs:      { display:"flex", padding:"6px 16px", overflowX:"auto", gap:4 },
  dayTab:       { display:"flex", flexDirection:"column", alignItems:"center", padding:"6px 10px", border:"none", background:"transparent", cursor:"pointer", borderRadius:8, color:"#6B7280", minWidth:36, flexShrink:0 },
  dayTabActive: { background:"#FFFBEB", color:"#1E2F4F" },

  progressBar:  { height:5, background:"#EEF0F3", borderRadius:3, overflow:"hidden", marginTop:5 },
  progressFill: { height:"100%", borderRadius:3, transition:"width .4s ease" },

  btn:          { border:"none", borderRadius:10, padding:"10px 18px", fontWeight:600, fontSize:13, cursor:"pointer" },
  btnGold:      { border:"none", borderRadius:10, padding:"11px 18px", fontWeight:700, fontSize:13, cursor:"pointer", background:"#D4AF37", color:"#1E2F4F" },

  overlay:      { position:"fixed", inset:0, background:"rgba(30,47,79,.45)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:999 },
  sheet:        { background:"#ffffff", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxWidth:480, maxHeight:"88dvh", overflowY:"auto" },
  sheetHeader:  { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 },
  closeBtn:     { background:"#F8F9FB", border:"none", borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:14, color:"#6B7280", display:"flex", alignItems:"center", justifyContent:"center" },

  input:        { width:"100%", border:"1.5px solid #E5E7EB", borderRadius:10, padding:"11px 13px", fontSize:13, color:"#2C2C2C", background:"#F8F9FB", marginBottom:4, boxSizing:"border-box" },
  lbl:          { display:"block", fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:5, letterSpacing:"0.3px", textTransform:"uppercase" },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap');
  * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  body { margin:0; }
  select, input { outline:none; appearance:none; -webkit-appearance:none; }
  ::-webkit-scrollbar { width:0; height:0; }
  button:active { opacity:.82; transform:scale(.98); }
  ::placeholder { color:#9CA3AF; }
  input[type=date]::-webkit-calendar-picker-indicator { opacity:0.4; }
  .jcf-brand { font-family:'Cormorant Garamond', Georgia, serif; }
`;
