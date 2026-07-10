FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/subscription-svc/package.json ./backend/subscription-svc/

RUN npm ci --workspace=@tone-knob/shared --workspace=@tone-knob/subscription-svc --include-workspace-root

COPY packages/shared/ ./packages/shared/
COPY backend/subscription-svc/ ./backend/subscription-svc/

RUN npx turbo run build --filter=@tone-knob/subscription-svc

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/backend/subscription-svc/dist ./dist
COPY --from=builder /app/backend/subscription-svc/package.json ./
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/main"]
