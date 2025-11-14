# ALTAA-MINI — Ambiente completo com Docker

Este repositório contém a aplicação ALTAA-MINI, composta por:

- Frontend (Next.js)
- Backend (Node.js / TypeScript)
- Banco PostgreSQL
- Orquestração via Docker Compose

O objetivo é disponibilizar um ambiente de desenvolvimento simples, isolado e com hot-reload funcionando em todos os serviços.

---

## Estrutura do Projeto

ALTAA-MINI/
│
├── backend/
│   ├── Dockerfile
│   ├── src/
│   ├── package.json
│   └── .env.docker
│
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   ├── package.json
│   └── .env.docker
│
├── docker-compose.yml
└── README.md

---

## Como subir o ambiente

docker compose up --build

---

## Endpoints

Frontend: http://localhost:3000
Backend: http://localhost:4000
Postgres: localhost:5433

---

## Comandos úteis

docker compose up --build
docker compose down

---

## Dockerfiles

Frontend:

FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

Backend:

FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

---

