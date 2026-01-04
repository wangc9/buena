FROM public.ecr.aws/docker/library/node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=server --docker

FROM public.ecr.aws/docker/library/node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN yarn global add turbo
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/yarn.lock ./yarn.lock

RUN yarn install

COPY --from=pruner /app/out/full/ .


RUN turbo run build --filter=server

RUN rm -rf node_modules && yarn install --production --frozen-lockfile --ignore-scripts --prefer-offline

FROM public.ecr.aws/docker/library/node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/server/dist ./apps/server/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "apps/server/dist/main.js"]
