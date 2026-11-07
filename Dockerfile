# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.1.0 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY nest-cli.json tsconfig.json tsconfig.build.json drizzle.config.ts ./
COPY src ./src
COPY drizzle ./drizzle
COPY scripts ./scripts
RUN pnpm run build && pnpm prune --prod

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.1.0 --activate \
  && addgroup -S nestjs && adduser -S nestjs -G nestjs

COPY --from=build --chown=nestjs:nestjs /app/package.json /app/pnpm-lock.yaml ./
COPY --from=build --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nestjs /app/dist ./dist
COPY --from=build --chown=nestjs:nestjs /app/drizzle ./drizzle
COPY --chown=nestjs:nestjs scripts/docker-entrypoint.cjs ./scripts/docker-entrypoint.cjs

USER nestjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["node", "./scripts/docker-entrypoint.cjs"]
CMD ["node", "dist/main.js"]
