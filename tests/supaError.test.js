import test from "node:test";
import assert from "node:assert/strict";
import { interpret, userMessage, onWriteError, reportWriteError } from "../src/lib/supaError.js";

const res = (status, body) => new Response(body === undefined ? "" : body, { status });

async function kindOf(p) {
  try { await p; return "ok"; } catch (e) { return e.kind; }
}

test("D02 : 403, 500, 401 et jeton expiré lèvent une erreur typée", async () => {
  assert.equal(await kindOf(interpret(res(403, "denied"), "POST", true)), "forbidden");
  assert.equal(await kindOf(interpret(res(500, "boom"), "PATCH", true)), "server");
  assert.equal(await kindOf(interpret(res(401, "x"), "DELETE", true)), "auth");
  assert.equal(await kindOf(interpret(res(400, '{"code":"PGRST301","message":"JWT expired"}'), "GET", true)), "auth");
});

test("D02 : PATCH/DELETE sans ligne modifiée = échec (RLS silencieuse)", async () => {
  assert.equal(await kindOf(interpret(res(200, "[]"), "PATCH", true)), "no_row");
  assert.equal(await kindOf(interpret(res(200, "[]"), "DELETE", true)), "no_row");
});

test("D02 : GET vide = résultat vide légitime, pas une erreur", async () => {
  assert.deepEqual(await interpret(res(200, "[]"), "GET", true), []);
  assert.deepEqual(await interpret(res(200, ""), "GET", true), []);
});

test("D02 : réponse réussie renvoie les lignes", async () => {
  assert.deepEqual(await interpret(res(200, '[{"id":"a"}]'), "PATCH", true), [{ id: "a" }]);
  assert.deepEqual(await interpret(res(201, '[{"id":"b"}]'), "POST", true), [{ id: "b" }]);
});

test("D02 : message utilisateur sans détail technique", async () => {
  try { await interpret(res(500, "secret stack"), "POST", true); }
  catch (e) {
    const m = userMessage(e);
    assert.match(m, /Rien n'a été enregistré/);
    assert.doesNotMatch(m, /secret/);
  }
  assert.match(userMessage({ name: "SupaError", kind: "network" }), /Connexion impossible/);
});

test("D02 : la notification transporte la fonction Réessayer", () => {
  let got = null;
  const off = onWriteError(x => { got = x; });
  const retry = () => {};
  const orig = console.error; console.error = () => {};
  reportWriteError({ name: "SupaError", kind: "forbidden" }, retry);
  console.error = orig; off();
  assert.equal(got.retry, retry);
  assert.match(got.message, /non autorisée/);
});
