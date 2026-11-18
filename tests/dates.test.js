// Lancer avec : npm test   (force TZ=Europe/Luxembourg)
import test from "node:test";
import assert from "node:assert/strict";
import { ymd, monthBounds, buildDateRange, calcEndDate, periodDates, addDays } from "../src/lib/dates.js";

test("fuseau de test = Europe/Luxembourg", () => {
  assert.equal(Intl.DateTimeFormat().resolvedOptions().timeZone, "Europe/Luxembourg");
});

test("ymd garde le jour civil (ancien bug : 1er mars → 28 février)", () => {
  assert.equal(new Date(2027, 2, 1).toISOString().slice(0, 10), "2027-02-28"); // preuve du bug
  assert.equal(ymd(new Date(2027, 2, 1)), "2027-03-01");
  assert.equal(ymd(new Date(2027, 2, 31)), "2027-03-31");
  assert.equal(ymd(new Date(2027, 2, 28, 0, 30)), "2027-03-28"); // nuit du changement d'heure
});

test("bornes de mois : mars, octobre (changements d'heure), février bissextile", () => {
  assert.deepEqual(monthBounds(2027, 3), ["2027-03-01", "2027-03-31"]);
  assert.deepEqual(monthBounds(2027, 10), ["2027-10-01", "2027-10-31"]);
  assert.deepEqual(monthBounds(2028, 2), ["2028-02-01", "2028-02-29"]);
  assert.deepEqual(monthBounds(2027, 2), ["2027-02-01", "2027-02-28"]);
});

test("addDays traverse les changements d'heure sans sauter de jour", () => {
  assert.equal(addDays("2027-03-27", 1), "2027-03-28");
  assert.equal(addDays("2027-03-28", 1), "2027-03-29");
  assert.equal(addDays("2027-10-30", 2), "2027-11-01");
});

test("samedi : option réellement propagée", () => {
  assert.deepEqual(buildDateRange("2027-03-05", "2027-03-06", false), ["2027-03-05"]);
  assert.deepEqual(buildDateRange("2027-03-05", "2027-03-06", true), ["2027-03-05", "2027-03-06"]);
  // dimanche jamais compté
  assert.deepEqual(buildDateRange("2027-03-06", "2027-03-08", true), ["2027-03-06", "2027-03-08"]);
});

test("mois finissant en semaine (mars 2027 finit un mercredi)", () => {
  const sans = periodDates("month", null, "2027-03", false);
  const avec = periodDates("month", null, "2027-03", true);
  assert.equal(sans[0], "2027-03-01");
  assert.equal(sans.at(-1), "2027-03-31");
  assert.equal(sans.length, 23);
  assert.equal(avec.length, 27); // + 4 samedis
});

test("octobre 2027 (changement d'heure le 31)", () => {
  const d = periodDates("month", null, "2027-10", false);
  assert.equal(d[0], "2027-10-01");
  assert.equal(d.at(-1), "2027-10-29");
  assert.equal(d.length, 21);
});

test("types jour / semaine / quinzaine, avec et sans samedi", () => {
  assert.deepEqual(periodDates("day", "2027-03-03", null, true), ["2027-03-03"]);
  assert.equal(calcEndDate("2027-03-03", "week"), "2027-03-09");
  assert.equal(periodDates("week", "2027-03-03", null, false).length, 5);
  assert.deepEqual(periodDates("week", "2027-03-03", null, true),
    ["2027-03-03", "2027-03-04", "2027-03-05", "2027-03-06", "2027-03-08", "2027-03-09"]);
  assert.equal(periodDates("fortnight", "2027-03-22", null, false).length, 10);
  assert.equal(periodDates("fortnight", "2027-03-22", null, true).length, 11);
});
