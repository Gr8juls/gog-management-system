# Production Dockerfile for GOG Management System
FROM node:20-alpine AS base

# Install required shared libraries for Prisma engine on Alpine
RUN apk add --no-cache libc6-compat openssl

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build the application ───────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# DATABASE_URL is required only at runtime; provide a dummy value so
# `prisma generate` succeeds and Next.js static analysis does not fail.
ENV DATABASE_URL="mongodb://placeholder:27017/placeholder?directConnection=true"

RUN npx prisma generate
RUN npm run build

# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="mongodb+srv://rubajul_db_user:wX4C%21M%3AEHzmTy34@cluster0.enkqgtm.mongodb.net/gog_management_system?retryWrites=true&w=majority&appName=Cluster0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy Next.js standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use the standalone server.js entry point
CMD ["node", "server.js"]
