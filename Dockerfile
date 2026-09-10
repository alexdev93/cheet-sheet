# Multi-stage build for a self-hostable production image.
# Prisma 7 ships its query engine as WASM + TypeScript (no native binary), so
# this needs nothing OS-specific — plain Alpine works on every stage.
#
# Three stages are built, and docker-compose.yml targets two of them:
#   - "builder": full node_modules + the Prisma CLI + migrations, used once
#     per deploy by the one-off `migrate` service (`prisma migrate deploy`).
#   - "runner":  the final, slim `output: "standalone"` image the `app`
#     service actually runs — it never needs the Prisma CLI at all.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Uses `npm install` rather than `npm ci` because no package-lock.json is
# committed yet (generate one with `npm install` once you have registry
# access and commit it — then switch this back to `npm ci` for reproducible,
# faster installs).
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The build needs a syntactically valid DATABASE_URL to generate the Prisma
# client and prerender pages that touch the database at build time — it is
# never actually connected to during `next build`. The real one is supplied
# at container runtime via docker-compose/.env.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
ENV SESSION_SECRET="build-time-placeholder-not-used-at-runtime"
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Uploaded attachments live here — docker-compose.yml mounts a named volume
# over this exact path so they survive container recreation.
RUN mkdir -p /app/data/attachments && chown -R nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV ATTACHMENTS_DIR="/app/data/attachments"

CMD ["node", "server.js"]
