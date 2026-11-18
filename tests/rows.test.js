import test from "node:test";
import assert from "node:assert/strict";
import { asgToRow, asgToPatch, madToPatch, withGridCost, normalizeChange } from "../src/lib/rows.js";

test("D01 : modifier seulement les heures n'envoie que les heures", () => {
  assert.deepEqual(asgToPatch({ hours: 7 }), { hours: 7 });
  // ancien comportement : frais remis à zéro, booking_type écrasé
  const old = asgToRow({ id: "x", hours: 7 });
  assert.equal(old.hotel_cost, 0);
  assert.equal(old.booking_type, "day");
});

test("D01 : zéro, false et null explicites sont envoyés", () => {
  assert.deepEqual(asgToPatch({ hotelCost: 0, ouverture: false, penalite: null }),
    { hotel_cost: 0, ouverture: false, penalite: null });
});

test("D01 : propriété undefined ou inconnue ignorée", () => {
  assert.deepEqual(asgToPatch({ hours: undefined, foo: 3 }), {});
});

test("D01 : MAD, modifier le commentaire ne touche ni coûts, ni statut, ni dates", () => {
  assert.deepEqual(madToPatch({ comment: "ok" }), { comment: "ok" });
});

test("updateMad(id, 'champ', valeur) est accepté (ancien bug : chaîne étalée)", () => {
  assert.deepEqual(normalizeChange("status", "cancelled"), { status: "cancelled" });
  assert.deepEqual(normalizeChange({ comment: "a" }), { comment: "a" });
  assert.deepEqual({ ..."status" }, { 0: "s", 1: "t", 2: "a", 3: "t", 4: "u", 5: "s" }); // preuve du bug
});

test("recalcul grille : journée tarifée grille → coût recalculé", () => {
  const grid = a => a.hours * 10;
  const prev = { hours: 8, periodCost: 80 };
  assert.deepEqual(withGridCost(prev, { hours: 7 }, grid), { hours: 7, periodCost: 70 });
});

test("recalcul grille : prix commercial conservé", () => {
  const grid = a => a.hours * 10;
  const prev = { hours: 8, periodCost: 250 };
  assert.deepEqual(withGridCost(prev, { hours: 7 }, grid), { hours: 7 });
});

test("recalcul grille : periodCost explicite (même 0) jamais écrasé", () => {
  const grid = a => a.hours * 10;
  assert.deepEqual(withGridCost({ hours: 8, periodCost: 80 }, { periodCost: 0 }, grid), { periodCost: 0 });
});
