# FinControl Monorepo

Monorepo com:

- `frontend`: app React (CRA + CRACO)
- `backend`: API Node.js/Express + Supabase

## Requisitos

- Node.js 20+
- npm 10+

## Instalação

```bash
npm install
```

## Rodar em desenvolvimento

Terminal 1 (API):

```bash
npm run dev:api
```

Terminal 2 (Frontend):

```bash
npm run dev:web
```

## Build

```bash
npm run build
```

## Variáveis de ambiente

Backend (`backend/.env`):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGINS`
- `PORT`

Frontend (`frontend/.env`):

- `REACT_APP_BACKEND_URL`
  - Local: `http://localhost:3001`
  - Vercel em projeto único: deixe vazio para usar o mesmo domínio (`/api`)
  - Vercel em projetos separados: use URL pública da API

## Deploy na Vercel

O repositório já contém `vercel.json` para deploy em **projeto único**:

- Frontend como site estático (`frontend/build`)
- Backend como Serverless Function (`backend/api/index.ts`)
- Rotas `/api/*` encaminhadas para o backend

### Variáveis de ambiente na Vercel

Defina no projeto:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGINS`

Opcional:

- `REACT_APP_BACKEND_URL` (não precisa quando frontend e API estão no mesmo projeto/domínio)
