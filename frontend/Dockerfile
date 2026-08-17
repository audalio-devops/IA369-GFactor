# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Baked into the JS bundle at build time (Vite inlines import.meta.env.*).
# Default is a relative path: nginx below proxies /api to the backend
# container, so the bundle never needs to know the host's public IP/domain.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Login credentials — inlined at build time by Vite (import.meta.env.*)
# Must be passed as build args in docker-compose.yml or via --build-arg
ARG VITE_LOGIN_USR
ARG VITE_LOGIN_PWD
ENV VITE_LOGIN_USR=$VITE_LOGIN_USR
ENV VITE_LOGIN_PWD=$VITE_LOGIN_PWD

RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
