# site-perso-freelance-back

Backend Hono / TypeScript pour le site perso et le formulaire vitrine.

## Démarrage rapide

```bash
cp template.env .env       # remplir les valeurs SMTP et S3 si besoin
npm install
npm run dev
```

```bash
open http://localhost:3000
```

## Stockage objet (S3 / MinIO)

Les fichiers uploadés transitent par un stockage S3-compatible. En local, on utilise MinIO via Docker Compose :

```bash
docker compose --profile dev up minio minio-init
```

- API S3 : `http://localhost:9000`
- Console : `http://localhost:9001` (creds `minioadmin` / `minioadmin` par défaut)

Le bucket défini par `S3_BUCKET` est créé automatiquement par le service `minio-init`.

## Documentation

Voir [CLAUDE.md](CLAUDE.md) pour la stack, les routes, les variables d'env et les conventions.
