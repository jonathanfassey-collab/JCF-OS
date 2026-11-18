// Gestion d'erreur structurée des appels Supabase.
// Une écriture n'est jamais considérée réussie sans confirmation du serveur.

export class SupaError extends Error {
  constructor(kind, message, status, detail) {
    super(message);
    this.name = "SupaError";
    this.kind = kind;       // "network" | "auth" | "forbidden" | "server" | "no_row" | "http"
    this.status = status || 0;
    this.detail = detail || "";
  }
}

// Message compréhensible pour l'utilisateur, sans jeton ni donnée technique sensible.
export function userMessage(err) {
  if (!err || err.name !== "SupaError") return "Erreur inattendue. Rien n'a été enregistré.";
  switch (err.kind) {
    case "network":   return "Connexion impossible. Vérifiez internet : rien n'a été enregistré.";
    case "auth":      return "Session expirée. Reconnectez-vous : rien n'a été enregistré.";
    case "forbidden": return "Action non autorisée pour ce compte. Rien n'a été enregistré.";
    case "no_row":    return "Le serveur n'a modifié aucune ligne (droits ou élément supprimé). Rechargez la page.";
    case "server":    return "Erreur du serveur (" + err.status + "). Rien n'a été enregistré.";
    default:          return "Erreur " + err.status + ". Rien n'a été enregistré.";
  }
}

export function classifyStatus(status) {
  if (status === 401) return "auth";
  if (status === 403) return "forbidden";
  if (status >= 500) return "server";
  return "http";
}

// Interprète la réponse fetch. `expectRows` : PATCH/DELETE doivent toucher au moins une ligne.
// Avec Prefer: return=representation, une règle RLS qui refuse renvoie 200 et [] : c'est un échec.
export async function interpret(res, method, expectRows) {
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.text()).slice(0, 300); } catch (e) {}
    // Jeton expiré renvoyé en 400/401 par PostgREST avec code PGRST301/PGRST303
    const kind = /JWT|PGRST30[13]/i.test(detail) ? "auth" : classifyStatus(res.status);
    throw new SupaError(kind, "HTTP " + res.status, res.status, detail);
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : [];
  if (expectRows && (method === "PATCH" || method === "DELETE") && Array.isArray(data) && data.length === 0) {
    throw new SupaError("no_row", "Aucune ligne modifiée", res.status);
  }
  return data;
}

// Petit bus d'erreurs : l'application affiche une notification avec « Réessayer ».
const listeners = new Set();
export function onWriteError(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function reportWriteError(err, retry) {
  console.error("Écriture refusée :", err && err.kind, err && err.status);
  listeners.forEach(fn => fn({ message: userMessage(err), retry }));
}
