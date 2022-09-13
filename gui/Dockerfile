FROM node:18 AS builder

# Run as CI
ENV CI=true

# Set up working directory
WORKDIR /app

# Copy packages definition
COPY ./package.json /app
COPY ./package-lock.json /app
RUN npm install --no-audit --no-save

# Copy code
COPY . /app

# Build code
RUN API_URL="/api" npm run build

FROM nginx:1.23.1-alpine

# Enable back-end proxy
RUN mkdir -p /etc/nginx/templates && echo "\
  server {\
    listen 80;\
    listen [::]:80;\
    server_name localhost;\
    location / {\
      root /usr/share/nginx/html;\
      index index.html;\
    }\
    location /api {\
        proxy_pass \${CONFIG_API_URL}/;\
    }\
}\
" > /etc/nginx/templates/default.conf.template

# Copy front-end
COPY --from=builder /app/dist /usr/share/nginx/html
