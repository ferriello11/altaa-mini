# Etapa 1: build
FROM node:20-alpine AS build

# Define diretório de trabalho
WORKDIR /app

# Copia apenas os arquivos de dependência
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante do código
COPY . .

# Gera o Prisma Client (importante antes da etapa de execução)
RUN npx prisma generate

# Etapa 2: execução
FROM node:20-alpine

# Define diretório de trabalho
WORKDIR /app

# Copia tudo da etapa de build
COPY --from=build /app ./

# Dá permissão de execução para o script de entrada
RUN chmod +x ./docker-entrypoint.sh

# Expõe a porta da aplicação
EXPOSE 4000

# Define variável de ambiente padrão
ENV NODE_ENV=production

# Usa o entrypoint customizado que roda migrate + seed + start
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
