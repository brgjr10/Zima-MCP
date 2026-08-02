FROM node:20-slim

RUN apt-get update && apt-get install -y \
    openssh-client \
    curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN chmod +x node_modules/.bin/tsc && npm run build

EXPOSE 9761

ENV NODE_ENV=production
CMD ["node", "dist/web-server.js"]
