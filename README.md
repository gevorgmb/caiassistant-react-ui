# Clerk AI Assistant — Web UI

React + TypeScript client (Vite) for the Go gRPC API.

Browsers cannot speak native gRPC. This app uses **Connect-ES gRPC-Web**
and an **Envoy** sidecar that translates gRPC-Web → gRPC on `:50051`.

```
Browser (Vite :5173)
   │  gRPC-Web
   ▼
Envoy (:8080)
   │  gRPC
   ▼
Go API (:50051)
```

## Prerequisites

- Node.js 20.19+ or 22.12+ (Node 24 recommended)
- Docker (for the Envoy gRPC-Web proxy)
- Running Go gRPC server from `code/go/container0` on port `50051`

## Setup

```bash
npm install
cp .env.example .env
npm run proto:generate
```

## Run

Terminal 1 — API (from the Go project):

```bash
# start the gRPC server on :50051
```

Terminal 2 — gRPC-Web proxy:

```bash
npm run proxy:up
```

Terminal 3 — UI:

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
| `docker/envoy.yaml` | gRPC-Web → gRPC proxy |

## Calling RPCs

```ts
import { authClient } from "./api/client";

const token = await authClient.login({
  email: "you@example.com",
  password: "secret",
});
```
