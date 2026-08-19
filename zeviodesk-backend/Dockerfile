# ─────────────────────────────────────────────────────────────
# Stage 1 — Dependencies
# Install ALL deps (including dev) so we can build TypeScript,
# generate the Prisma client, and bundle with esbuild + vite.
# bcrypt uses native bindings, so we need build tools.
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Build tools required by bcrypt (native node addon)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci


# ─────────────────────────────────────────────────────────────
# Stage 2 — Builder
# Generate the Prisma client, then compile the frontend SPA
# and bundle the Express server into a single CJS file.
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Re-install build tools for any native addon compilation during prisma generate
RUN apk add --no-cache python3 make g++

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (reads schema.prisma → node_modules/@prisma/client)
RUN npx prisma generate

# Build: vite bundles the frontend SPA + esbuild bundles server.ts → dist/server.cjs
RUN npm run build


# ─────────────────────────────────────────────────────────────
# Stage 3 — Production
# Lean runtime image: only production artifacts + prod node_modules.
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies (no dev tools)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy prisma schema + migrations so `prisma migrate deploy` works at startup
COPY --from=builder /app/prisma ./prisma

# Re-generate Prisma client against the production node_modules
RUN npx prisma generate

# Drop to a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001

# Run pending migrations then start the server.
# migrate deploy is idempotent and safe to run on every startup.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.cjs"]
