FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/tab-svc/package.json ./services/tab-svc/

RUN npm ci --workspace=@tone-knob/shared --workspace=@tone-knob/tab-svc --include-workspace-root

COPY packages/shared/ ./packages/shared/
COPY services/tab-svc/ ./services/tab-svc/

RUN npx turbo run build --filter=@tone-knob/tab-svc

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/services/tab-svc/dist ./dist
COPY --from=builder /app/services/tab-svc/package.json ./
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/main"]
