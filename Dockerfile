FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json .npmrc ./
RUN npm install --no-audit --no-fund

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
