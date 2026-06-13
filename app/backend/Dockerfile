FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY app/backend/package.json ./app/backend/package.json
COPY app/frontend/package.json ./app/frontend/package.json
RUN npm ci

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
RUN npm install -g prisma
COPY --from=builder /app/app/backend/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY app/backend/package.json ./
COPY app/backend/prisma ./prisma
EXPOSE 3000
CMD ["sh", "-c", "prisma migrate deploy && node dist/server.js"]
