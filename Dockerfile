# Dockerfile for mutasi-klikbca
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production
COPY . .

EXPOSE 3040

# Install Chromium for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

CMD ["node", "index.js"]
