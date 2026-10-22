# Panthéon

> Un Letterboxd pour les **personnes**, pas pour les œuvres.
> On note les acteurs et les chanteurs sur 5 étoiles, on écrit une critique,
> et on construit son mur de visages.

---

## Ce que fait l'app

- **Recherche unifiée** — un seul champ qui interroge TMDB (acteurs, réalisateurs)
  et Spotify (chanteurs, groupes) en parallèle, résultats mélangés par popularité.
- **Fiche artiste** — portrait, bio, filmographie ou discographie, note moyenne
  de la communauté, histogramme de répartition, critiques.
- **Notation** — demi-étoiles (1 à 10 en interne), critique texte, marquage
  « panthéon » (favori), suivi d'un artiste sans le noter.
- **Profil public** — `/u/<pseudo>` : le mur des artistes notés, le panthéon
  personnel, les suivis, la moyenne donnée.
- **Intro cinématique 3D** — une rotonde de portraits en WebGL (three.js +
  react-three-fiber), travelling avant, poussière dorée. Joue une fois par
  session, se saute avec Échap, désactivée si `prefers-reduced-motion`.

## Stack

| Couche | Choix |
|---|---|
| Framework | Next.js 15 (App Router) + React 18 + TypeScript |
| Style | Tailwind CSS v4 (tokens dans `globals.css`) |
| 3D | three.js + @react-three/fiber |
| Base | PostgreSQL (Neon serverless) + Drizzle ORM |
| Auth | JWT maison (`jose`) en cookie httpOnly + bcrypt |
| Données | TMDB (écran) · Spotify Web API (musique) |

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis remplis les 4 valeurs
npm run db:push              # crée les tables sur Neon
npm run dev
```

### Les clés à récupérer

| Variable | Où |
|---|---|
| `DATABASE_URL` | https://neon.tech — crée un projet, copie la connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `TMDB_API_KEY` | https://www.themoviedb.org/settings/api (gratuit, instantané) |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | https://developer.spotify.com/dashboard → Create app |

Sans clés, l'app démarre quand même : le mur affiche un encart qui explique
ce qui manque, et aucune page ne plante.

## Structure

```
src/
  app/
    page.tsx                     mur d'accueil + intro 3D
    artiste/[kind]/[id]/         fiche artiste (kind = screen | music)
    u/[username]/                profil public
    recherche/  decouvrir/  critiques/
    connexion/  inscription/
    api/
      auth/{register,login,logout}
      search      recherche unifiée TMDB + Spotify
      ratings     POST (upsert) / DELETE
      follow      POST (toggle)
  components/
    CinematicIntro.tsx           scène WebGL
    IntroGate.tsx                joue l'intro 1×/session
    ArtistWall.tsx  ArtistCardTile.tsx  (cartes 3D au survol)
    RatingPanel.tsx  SearchBar.tsx  Stars.tsx  Nav.tsx  AuthForm.tsx
  lib/
    tmdb.ts  spotify.ts          clients API, normalisés en `ArtistCard`
    artists.ts                   couche service (recherche, stats, upsert)
    auth.ts                      sessions JWT
    db/schema.ts                 users · artists · ratings · follows
```

## Modèle de données

L'astuce : **`artists` est un cache local**. Les artistes viennent de TMDB ou
Spotify, mais dès qu'un utilisateur note quelqu'un, la personne est insérée
localement (`upsertArtist`) avec une clé unique `(kind, external_id)`. Toutes
les notes pointent sur cette ligne locale — donc les moyennes, les murs et les
profils marchent sans retaper les APIs externes.

Les notes sont stockées de **1 à 10** (demi-étoiles), affichées sur 5.

## Déploiement

Vercel + Neon, sans configuration particulière : pousse le repo, ajoute les
quatre variables d'environnement, déploie. `npm run db:push` une fois depuis
ta machine pour créer le schéma.

## Pistes suivantes


- Listes thématiques (« Les méchants les plus charismatiques »)
- Suivre d'autres utilisateurs, feed d'activité des abonnements
- Étendre au-delà d'acteurs/chanteurs : réalisateurs, auteurs (Open Library)
- Diary : noter un artiste à une date, comme le journal Letterboxd

