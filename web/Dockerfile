# ---------- Dependencies ----------
FROM node:20-alpine AS deps

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies against the lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Dev stage (hot reload) ----------
# Used by docker-compose.override.yml with the source bind-mounted over /app.
FROM deps AS dev

ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--port", "3000", "--hostname", "0.0.0.0"]

# ---------- Build stage ----------
FROM deps AS builder

COPY . .

# NEXT_PUBLIC_API_URL is inlined into the client bundle at build time and must be
# reachable from the browser. INTERNAL_API_URL is used for server-side calls.
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG INTERNAL_API_URL=http://api:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    INTERNAL_API_URL=$INTERNAL_API_URL

RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
# next.config.js imports ./src/env.js, so the source is needed at start time.
COPY --from=builder /app/src ./src

EXPOSE 3000

CMD ["npm", "run", "start", "--", "--port", "3000", "--hostname", "0.0.0.0"]
