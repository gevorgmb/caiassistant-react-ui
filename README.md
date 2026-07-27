# Clerk AI Assistant — Web UI

React + TypeScript client (Vite) for the Go gRPC API.

Browsers cannot speak native gRPC. This app uses **Connect-ES gRPC-Web**
against the API gateway / proxy declared in `local/` (not in this directory).

```
Browser (Vite)
   │  gRPC-Web
   ▼
Gateway / proxy (see local/)
   │  gRPC
   ▼
Go API
```

## Prerequisites

- Node.js 20.19+ or 22.12+ (Node 24 recommended; see `.nvmrc`)
- Infra from `local/` (API + any gRPC-Web gateway) already running
- `VITE_API_BASE_URL` pointing at that gateway

## Setup

```bash
npm install
cp .env.example .env
npm run proto:generate
```

## Run

```bash
npm run dev
```

Open http://localhost:5173

## Proto workflow

Protos live in `proto/` (synced from `code/proto`). After changing contracts:

```bash
npm run proto:lint
npm run proto:generate
```

Generated clients land in `src/gen/`.

## Project layout

| Path | Purpose |
|------|---------|
| `proto/` | API contract (`.proto`) |
| `src/gen/` | Generated TypeScript (do not edit) |
| `src/api/` | Transport + session helpers |
| `src/components/` | UI |

## Calling RPCs

```ts
import { authClient } from "./api/client";

const token = await authClient.login({
  email: "you@example.com",
  password: "secret",
});
```
