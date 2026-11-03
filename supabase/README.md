# Migration Supabase Auth : guide de bascule

Ce dossier contient tout ce qu'il faut côté Supabase pour remplacer les mots de passe communs par des comptes individuels.

**Rien ici ne s'applique automatiquement.** Chaque script est appliqué à la main, dans l'ordre ci-dessous, après accord.

| Fichier | Rôle | Quand |
|---|---|---|
| `sql/01_auth_profiles.sql` | Table `profiles`, fonctions de rôle, planning partagé sans coûts | Étape 1 |
| `functions/admin-users/` | Création, réinitialisation et désactivation des comptes (admin uniquement) | Étape 1 |
| `functions/no-email/` | Bloque **tous** les e-mails d'authentification | Étape 1 |
| `sql/02_auth_rls_bascule.sql` | Remplace « Public access » par des règles par rôle | Étape 4, juste après la fusion |
| `sql/02b_auth_rls_retour_arriere.sql` | Annule l'étape 4 en cas de problème | Seulement si besoin |
| `sql/03_nettoyage.sql` | Supprime `users_extra` et sa colonne `password` | Étape 5, à J+7 |

## Étape 0 : réglages dans le tableau de bord Supabase (admin)

1. **Authentication → Sign In / Providers → Email** :
   - *Allow new users to sign up* : **désactivé**
   - *Confirm email* : **désactivé**
   - *Minimum password length* : **10**
2. **Authentication → Users → Add user → Create new user** :
   - e-mail `admin@jcf.lu`, ton mot de passe ;
   - *Auto Confirm User* **coché**.
3. Faire une sauvegarde de la base (*Database → Backups*), ou au minimum un export des tables `assignments`, `mads` et `cp_requests`.

## Étape 1 : base et fonctions, sans impact sur l'app en ligne

1. Appliquer `sql/01_auth_profiles.sql`. Le script crée aussi le profil admin de `admin@jcf.lu`.
2. Déployer les deux Edge Functions :
   - `admin-users` avec vérification JWT (par défaut) ;
   - `no-email` **sans** vérification JWT.
3. **Authentication → Hooks → Send Email Hook** :
   - type **HTTPS** ;
   - URL : `https://hwjuqtrdjcowgcvmhfed.supabase.co/functions/v1/no-email`.

## Étape 2 : relecture de la PR et test sur la prévisualisation Vercel

Sur l'URL de prévisualisation de la PR :
- se connecter avec `admin` et le mot de passe de l'étape 0 ;
- vérifier l'onglet **Comptes**.

## Étape 3 : création des comptes (admin, sur la prévisualisation)

Onglet **Comptes**, filtre **« A creer »**. Pour chaque compte : *Creer le compte*, puis saisir le mot de passe choisi.

Transmettre chaque mot de passe **de vive voix ou par SMS**. Jamais par e-mail : les adresses `@jcf.lu` ne sont pas de vraies boîtes.

Tester un compte magasin et un compte collaborateur.

## Étape 4 : bascule (en soirée, environ 30 minutes)

1. Fusionner la PR. Vercel déploie le nouveau code.
2. **Juste après**, appliquer `sql/02_auth_rls_bascule.sql`.
3. Vérifier que la base ne répond plus sans connexion. Le résultat attendu est `[]` :
   ```bash
   curl "https://hwjuqtrdjcowgcvmhfed.supabase.co/rest/v1/assignments?select=id" -H "apikey: <clé anon>"
   ```
4. Se reconnecter avec un compte de chaque rôle.

En cas de problème : appliquer `sql/02b_auth_rls_retour_arriere.sql`, ce qui rouvre la base comme avant, puis corriger.

## Étape 5 : nettoyage (J+7)

Appliquer `sql/03_nettoyage.sql`.

## Qui voit quoi après la bascule

| Données | Admin | Magasin / partenaire | Collaborateur |
|---|---|---|---|
| Affectations | tout | ses réservations : création, annulation, annulation tardive | son planning |
| Créneaux des autres | tout | « occupé » seulement : ni lieu, ni coût, ni motif d'absence | créneaux de travail de l'équipe, sans coûts |
| Congés (CP / CSS) | tout, validation | rien | ses demandes |
| Mises à disposition | tout | rien | rien |
| Comptes | gestion complète | son profil | son profil |
