# CLAUDE.md

## Project overview

Backend pour le site perso / freelance. API HTTP construite avec [Hono](https://hono.dev/) exécutée sur Node.js via `@hono/node-server`. Le projet est en TypeScript (ESM, `NodeNext`), sans framework de test ni ORM pour l'instant.

Point d'entrée unique : [src/index.ts](src/index.ts). Le serveur écoute sur le port `3000` par défaut.

## Stack

- **Runtime** : Node.js (ESM, `"type": "module"`)
- **Framework HTTP** : Hono 4 (+ `@hono/node-server`)
- **Langage** : TypeScript 5 (strict, `verbatimModuleSyntax`)
- **JSX** : `hono/jsx` (configuré dans `tsconfig.json`)
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
- [docker-compose.yml](docker-compose.yml) : orchestration pour la CI/CD et le run local du conteneur.
- [.dockerignore](.dockerignore) : exclut `node_modules`, `dist`, fichiers d'env et artefacts de dev.

Build et run local :

```bash
docker compose build
docker compose up
```

## Conventions

- ESM strict : toujours inclure l'extension `.js` dans les imports relatifs compilés (`NodeNext`).
- Port actuellement en dur à `3000` dans [src/index.ts](src/index.ts) (à rendre configurable via `process.env.PORT` quand le besoin se présentera ; la variable est déjà propagée par le Dockerfile et le compose).
- Les secrets et config sensibles passent par `.env` (non commité).

## Structure

```
src/
  index.ts        # bootstrap Hono + serveur
```

Quand de nouveaux modules seront ajoutés (routes, services, middlewares), garder une structure plate par domaine plutôt qu'une sur-découpe par type de fichier tant que le projet reste petit.
