// JCF OS — Edge Function « no-email »
// Branchée sur le « Send Email Hook » de Supabase Auth
// (Authentication → Hooks → Send Email Hook → type HTTPS → cette fonction).
//
// Supabase appelle ce hook À LA PLACE d'envoyer tout e-mail d'authentification
// (confirmation, lien magique, mot de passe oublié, changement d'e-mail…).
// La fonction répond « OK » sans rien envoyer : aucun e-mail ne part jamais
// vers les adresses @jcf.lu, qui ne sont pas de vraies boîtes mail, même si
// quelqu'un réutilise la clé publique pour en demander un.
//
// À déployer SANS vérification JWT (Supabase l'appelle sans session).
Deno.serve(() =>
  new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
);
