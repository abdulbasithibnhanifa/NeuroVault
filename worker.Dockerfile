# Base stage
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Runner stage
FROM base AS runner
ENV NODE_ENV production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install tsx globally or use the local one
RUN npm install -g tsx

CMD ["tsx", "workers/documentWorker.ts"]
