FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/gateway/package.json ./backend/gateway/

RUN npm ci --workspace=@tone-knob/shared --workspace=@tone-knob/gateway --include-workspace-root

COPY packages/shared/ ./packages/shared/
COPY backend/gateway/ ./backend/gateway/

RUN npx turbo run build --filter=@tone-knob/gateway

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/backend/gateway/dist ./dist
COPY --from=builder /app/backend/gateway/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/main"]
