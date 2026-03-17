FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/jam-svc/package.json ./services/jam-svc/

RUN npm ci --workspace=@tone-knob/shared --workspace=@tone-knob/jam-svc --include-workspace-root

COPY packages/shared/ ./packages/shared/
COPY services/jam-svc/ ./services/jam-svc/

RUN npx turbo run build --filter=@tone-knob/jam-svc

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/services/jam-svc/dist ./dist
COPY --from=builder /app/services/jam-svc/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3003 3004
CMD ["node", "dist/main"]
