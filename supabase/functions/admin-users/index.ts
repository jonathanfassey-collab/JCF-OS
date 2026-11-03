// JCF OS — Edge Function « admin-users »
// Gestion des comptes par l'admin : création, réinitialisation du mot de passe,
// désactivation / réactivation. Aucun e-mail n'est jamais envoyé.
//
// Sécurité :
//  - l'appelant doit être connecté ET avoir un profil admin actif ;
//  - la clé service_role reste côté serveur (variable fournie par Supabase) ;
//  - les identifiants sont limités au format xxx@jcf.lu.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOGIN_RE = /^[a-z0-9._-]+@jcf\.lu$/;
const MIN_PASSWORD = 10;
const ROLES = ["admin", "store", "replacement"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // 1. Qui appelle ?
  const authHeader = req.headers.get("Authorization") ?? "";
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: who, error: whoErr } = await caller.auth.getUser();
  if (whoErr || !who?.user) return json({ error: "Non connecté" }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: me } = await admin
    .from("profiles").select("role, active").eq("id", who.user.id).maybeSingle();
  if (!me || me.role !== "admin" || !me.active) return json({ error: "Réservé à l'admin" }, 403);

  // 2. Action demandée
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Requête invalide" }, 400); }
  const action = body.action;

  if (action === "create") {
    const login = String(body.login ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = String(body.role ?? "");
    const displayName = String(body.display_name ?? "").trim();
    const collaboratorId = body.collaborator_id ? String(body.collaborator_id) : null;
    const locationId = body.location_id ? String(body.location_id) : null;

    if (!LOGIN_RE.test(login)) return json({ error: "Identifiant invalide (format attendu : nom@jcf.lu)" }, 400);
    if (password.length < MIN_PASSWORD) return json({ error: `Mot de passe trop court (${MIN_PASSWORD} caractères minimum)` }, 400);
    if (!ROLES.includes(role)) return json({ error: "Rôle invalide" }, 400);
    if (role === "store" && !locationId) return json({ error: "Lieu manquant pour un compte magasin" }, 400);
    if (role === "replacement" && !collaboratorId) return json({ error: "Collaborateur manquant" }, 400);

    // email_confirm: true → compte confirmé d'office, aucun e-mail envoyé
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: login, password, email_confirm: true,
    });
    if (cErr || !created?.user) return json({ error: cErr?.message ?? "Création impossible" }, 400);

    const { error: pErr } = await admin.from("profiles").insert({
      id: created.user.id, login, display_name: displayName, role,
      collaborator_id: role === "replacement" ? collaboratorId : null,
      location_id: role === "store" ? locationId : null,
    });
    if (pErr) {
      await admin.auth.admin.deleteUser(created.user.id); // pas de compte sans profil
      return json({ error: pErr.message }, 400);
    }
    return json({ ok: true, id: created.user.id });
  }

  if (action === "reset_password") {
    const userId = String(body.user_id ?? "");
    const password = String(body.password ?? "");
    if (password.length < MIN_PASSWORD) return json({ error: `Mot de passe trop court (${MIN_PASSWORD} caractères minimum)` }, 400);
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  if (action === "set_active") {
    const userId = String(body.user_id ?? "");
    const active = body.active === true;
    if (userId === who.user.id && !active) return json({ error: "Impossible de désactiver son propre compte" }, 400);
    // Désactivé = connexion bloquée (ban) + plus aucun droit via les règles RLS
    const { error: bErr } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: active ? "none" : "876000h",
    });
    if (bErr) return json({ error: bErr.message }, 400);
    const { error: pErr } = await admin.from("profiles").update({ active }).eq("id", userId);
    if (pErr) return json({ error: pErr.message }, 400);
    return json({ ok: true });
  }

  return json({ error: "Action inconnue" }, 400);
});
