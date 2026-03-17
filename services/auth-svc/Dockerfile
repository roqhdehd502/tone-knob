FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/auth-svc/package.json ./services/auth-svc/

RUN npm ci --workspace=@tone-knob/shared --workspace=@tone-knob/auth-svc --include-workspace-root

COPY packages/shared/ ./packages/shared/
COPY services/auth-svc/ ./services/auth-svc/

RUN npx turbo run build --filter=@tone-knob/auth-svc

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/services/auth-svc/dist ./dist
COPY --from=builder /app/services/auth-svc/package.json ./
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/main"]
