# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_WOMPI_API_URL
ARG VITE_WOMPI_PUBLIC_KEY

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WOMPI_API_URL=$VITE_WOMPI_API_URL
ENV VITE_WOMPI_PUBLIC_KEY=$VITE_WOMPI_PUBLIC_KEY

COPY apps/frontend apps/frontend
COPY packages/shared packages/shared

RUN pnpm -F frontend build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g serve@14.2.4

COPY --from=build /app/apps/frontend/dist /app/dist

EXPOSE 3000
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
