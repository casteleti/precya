FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY app/backend/package.json ./app/backend/package.json
COPY app/frontend/package.json ./app/frontend/package.json
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY app/frontend/ ./app/frontend/
WORKDIR /app/app/frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/app/frontend/.next/standalone ./
COPY --from=builder /app/app/frontend/.next/static ./.next/static
COPY --from=builder /app/app/frontend/public ./public
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
