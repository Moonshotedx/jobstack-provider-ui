# syntax=docker/dockerfile:1.6

FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_ENDPOINT
ARG VITE_ORG_API_KEY
ARG VITE_USE_GOOGLE_MAPS
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_API_ENDPOINT=$VITE_API_ENDPOINT \
    VITE_ORG_API_KEY=$VITE_ORG_API_KEY \
    VITE_USE_GOOGLE_MAPS=$VITE_USE_GOOGLE_MAPS \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

RUN pnpm build

FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
