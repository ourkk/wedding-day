FROM oven/bun:1.4.4-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM caddy:2-alpine

# Write Caddyfile inline
RUN printf ':80 {\n\
    root * /srv\n\
    encode gzip\n\
    try_files {path} /index.html\n\
    file_server\n\
\n\
    header {\n\
        # Security headers\n\
        X-Content-Type-Options nosniff\n\
        X-Frame-Options SAMEORIGIN\n\
        Referrer-Policy strict-origin-when-cross-origin\n\
        # Cache static assets aggressively, revalidate HTML\n\
        Cache-Control "no-cache" path *.html\n\
    }\n\
\n\
    @static {\n\
        path /assets/*\n\
    }\n\
    header @static Cache-Control "public, max-age=31536000, immutable"\n\
}\n' > /etc/caddy/Caddyfile

COPY --from=builder /app/dist /srv

EXPOSE 80
