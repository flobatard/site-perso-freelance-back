# CLAUDE.md

## Project overview

Backend pour le site perso / freelance. API HTTP construite avec [Hono](https://hono.dev/) exécutée sur Node.js via `@hono/node-server`. Le projet est en TypeScript (ESM, `NodeNext`), sans framework de test ni ORM pour l'instant.

Point d'entrée unique : [src/index.ts](src/index.ts). Le serveur écoute sur le port `3000` par défaut.

## Stack

- **Runtime** : Node.js (ESM, `"type": "module"`)
- **Framework HTTP** : Hono 4 (+ `@hono/node-server`), middleware `hono/cors`
- **Langage** : TypeScript 5 (strict, `verbatimModuleSyntax`)
- **JSX** : `hono/jsx` (configuré dans `tsconfig.json`)
- **Mail** : `nodemailer` (transport SMTP générique)
- **Stockage objet** : S3-compatible (MinIO en dev local, AWS S3/Scaleway/etc. en prod)
- **Dev loop** : `tsx watch`

## Commandes

```bash
npm install        # installer les dépendances
npm run dev        # serveur en watch mode (tsx)
npm run build      # compilation TypeScript vers dist/
npm run start      # lancer la build compilée (node dist/index.js)
```

## Docker / CI-CD

- [Dockerfile](Dockerfile) : build multi-stage (builder TS → runtime Node slim), utilisateur non-root, expose le port `3000`.
- [docker-compose.yml](docker-compose.yml) : orchestration pour la CI/CD et le run local du conteneur. Charge le `.env` via `env_file` et bind-monte `./data:/app/data` pour persister les soumissions. Inclut un service `minio` (+ `minio-init` qui crée le bucket) sous le profil `dev` — non démarré par défaut en CI/CD.
- [.dockerignore](.dockerignore) : exclut `node_modules`, `dist`, `data`, fichiers d'env et artefacts de dev.

Build et run local :

```bash
docker compose build
docker compose up                            # API seule (prod-like)
docker compose --profile dev up              # API + MinIO local
```

Console MinIO disponible sur `http://localhost:9001` (creds = `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`). Endpoint S3 sur `http://localhost:9000`.

## Configuration / variables d'environnement

[template.env](template.env) liste toutes les variables attendues — copier vers `.env` (non commité) et remplir.

| Variable | Rôle |
| --- | --- |
| `PORT` | port HTTP (défaut `3000`) |
| `FRONTEND_URL` | origines CORS autorisées, séparées par des virgules |
| `DATA_DIR` | racine de stockage des soumissions (défaut `data`, mappé sur `/app/data` en conteneur) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | transport nodemailer |
| `SMTP_FROM` | expéditeur des notifications |
| `NOTIFY_TO` | destinataire des notifications |
| `S3_ENDPOINT` | endpoint S3 (vide = AWS S3 par défaut, sinon URL MinIO/Scaleway/...) |
| `S3_REGION` | région S3 (ex: `us-east-1` pour MinIO, `eu-west-3` pour AWS Paris) |
| `S3_BUCKET` | nom du bucket cible pour les uploads |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | credentials S3 |
| `S3_FORCE_PATH_STYLE` | `true` pour MinIO (path-style URLs), `false` pour AWS (virtual-hosted) |

Si `SMTP_HOST`, `SMTP_FROM` ou `NOTIFY_TO` manquent, l'envoi de mail est silencieusement skippé (warn dans les logs) — la soumission reste persistée.

## Routes

| Méthode | Chemin | Description |
| --- | --- | --- |
| GET | `/` | health / hello |
| POST | `/form/showcase-form` | réception du formulaire vitrine (multipart) |

### `POST /form/showcase-form`

Multipart attendu : champ `data` (JSON sérialisé des scalars du formulaire), champ optionnel `logo` (1 fichier), champ optionnel `photos` (N fichiers).

Génère un identifiant `YYYYMMDDHHMMSS-<6 hex>` puis, en parallèle :
1. Persiste sous `${DATA_DIR}/showcase-forms/<id>/` : `data.json`, `logo.<ext>`, `photos/photo-<i>.<ext>`.
2. Envoie un mail HTML récapitulatif via SMTP.

Réponse JSON : `{ id, folder, emailSent }`. 500 si la persistance échoue ; un échec mail est loggé mais ne fait pas échouer la requête.

## Nettoyage automatique des soumissions

[src/cleanup.ts](src/cleanup.ts) déclenche au démarrage du serveur, puis toutes les 24 h, la suppression récursive des sous-dossiers de `${DATA_DIR}/showcase-forms/` dont le `mtime` est antérieur à 30 jours. La rétention (30 j) et l'intervalle (24 h) sont en dur dans le module. L'interval utilise `.unref()` pour ne pas empêcher l'arrêt du process.

Le nettoyage ne concerne que le stockage disque local — les objets S3 ne sont pas touchés (à gérer via une lifecycle rule côté bucket si nécessaire).

## Conventions

- ESM strict : toujours inclure l'extension `.js` dans les imports relatifs compilés (`NodeNext`).
- Port actuellement en dur à `3000` dans [src/index.ts](src/index.ts) (à rendre configurable via `process.env.PORT` quand le besoin se présentera ; la variable est déjà propagée par le Dockerfile et le compose).
- Les secrets et config sensibles passent par `.env` (non commité).

## Structure

```
src/
  index.ts        # bootstrap Hono + serveur, CORS, montage des routes, scheduler de cleanup
  cleanup.ts      # purge récurrente des soumissions de plus de 30 jours
  mailer.ts       # transport SMTP nodemailer + template de notification
  storage.ts      # client S3 + helpers d'upload
  routes/
    form.ts       # /form/showcase-form (persistance disque + S3 + mail)
data/             # soumissions persistées (gitignored, bind-mount Docker)
template.env      # gabarit des variables d'environnement
```

Quand de nouveaux modules seront ajoutés (routes, services, middlewares), garder une structure plate par domaine plutôt qu'une sur-découpe par type de fichier tant que le projet reste petit. Les nouvelles routes vont dans `src/routes/<domaine>.ts` et sont montées via `app.route('/<prefix>', router)` dans [src/index.ts](src/index.ts).
