# ALTAA-MINI — Ambiente completo com Docker

Este repositório contém a aplicação ALTAA-MINI, composta por:

- Frontend (Next.js)
- Backend (Node.js / TypeScript / Prisma)
- Banco PostgreSQL (Orquestração via Docker Compose)

O objetivo é disponibilizar um ambiente de desenvolvimento simples, isolado .

---

## Estrutura do Projeto

ALTAA-MINI/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env           ← usado no ambiente local
│
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── next.config.js
│   └── .env.local
│
├── docker-compose.yml ← contém APENAS o banco + seed automático
└── README.md

---

------------------------------------------------------------

# Docker — Banco SOMENTE

O Docker é utilizado apenas para subir o PostgreSQL:

docker compose up -d

Isso cria:

✔ Container do Postgres
✔ Volume persistente

Nenhum seed ou backend roda dentro do Docker.

------------------------------------------------------------

# Migrations + Seed (executados localmente)

Com o Docker rodando, execute:

1 Rodar migrations
cd backend
npx prisma migrate deploy


2 Popular com seed
npm run seed

⚠ O seed limpa o banco e insere dados de desenvolvimento.

------------------------------------------------------------

# Como rodar os serviços

Backend:
cd backend
npm run dev

Frontend:
cd frontend
npm run dev

------------------------------------------------------------

# Endpoints

Frontend: http://localhost:3000
Backend: http://localhost:4000
PostgreSQL: localhost:5433

------------------------------------------------------------

# Reset total do ambiente

docker compose down -v
docker volume prune -f
docker compose up -d
npx prisma migrate deploy
npm run seed

------------------------------------------------------------


# Fluxo de Convite

Todo Convite gerado ira aparecer na aba de Convites, para aceitar basta acessar com a conta do CONVIDADO e aceitar dentro de CONVITES
