#!/bin/sh
echo "Aguardando o banco de dados estar pronto"
npx prisma migrate deploy

echo "Rodando seed "
npx ts-node src/prisma/seed.ts || echo "seed falhou (ignorado)."

npm run dev
