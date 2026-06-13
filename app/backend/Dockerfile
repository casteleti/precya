FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY app/backend/package.json ./app/backend/package.json
COPY app/backend/prisma ./app/backend/prisma
COPY app/frontend/package.json ./app/frontend/package.json
RUN NODE_ENV=development npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY app/backend/ ./app/backend/
WORKDIR /app/app/backend
RUN /app/node_modules/.bin/tsc

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY --from=builder /app/app/backend/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY app/backend/package.json ./
COPY app/backend/prisma ./prisma
RUN ./node_modules/.bin/prisma generate --schema ./prisma/schema.prisma
EXPOSE 3000
CMD ["sh", "-c", "./node_modules/.bin/prisma db push --schema ./prisma/schema.prisma --skip-generate --accept-data-loss && node dist/server.js"]
