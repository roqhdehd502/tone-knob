FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/auth-svc/package.json ./backend/auth-svc/

RUN npm ci --workspace=@tone-knob/shared --workspace=@tone-knob/auth-svc --include-workspace-root

COPY packages/shared/ ./packages/shared/
COPY backend/auth-svc/ ./backend/auth-svc/

RUN npx turbo run build --filter=@tone-knob/auth-svc

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/backend/auth-svc/dist ./dist
COPY --from=builder /app/backend/auth-svc/package.json ./
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/main"]
