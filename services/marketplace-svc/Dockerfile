FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/marketplace-svc/package.json ./services/marketplace-svc/

RUN npm ci --workspace=@tone-knob/shared --workspace=@tone-knob/marketplace-svc --include-workspace-root

COPY packages/shared/ ./packages/shared/
COPY services/marketplace-svc/ ./services/marketplace-svc/

RUN npx turbo run build --filter=@tone-knob/marketplace-svc

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/services/marketplace-svc/dist ./dist
COPY --from=builder /app/services/marketplace-svc/package.json ./
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/main"]
