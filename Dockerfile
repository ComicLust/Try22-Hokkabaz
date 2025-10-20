# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# ---- deps ----
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma client üret
RUN npx prisma generate
# Next build
RUN npm run build

# ---- runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Production için gerekli modüller
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --production

# Build çıktıları ve statikler
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Uploads klasörü
RUN mkdir -p /app/public/uploads

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Kalıcı veri için volume’lar
VOLUME ["/app/public/uploads", "/app/prisma/db"]

# Prisma migrasyon + custom server start
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm start"]