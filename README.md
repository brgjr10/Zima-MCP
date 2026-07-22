# Zima-MCP

Zima Terminal MCP — MCP server providing SSH terminal access to ZimaOS.

## Stack

- TypeScript / Node.js + Express
- MCP SDK

## Running

```bash
npm install
npm run build
npm start
```

Server listens on port `9761` by default.

## Docker

```bash
docker compose up -d
```

## Config

Set `SSH_TIMEOUT` and `PORT` via environment variables. Target host defaults to `<<ZIMA_HOST>>`.

## Security

`ACCESS.MD` is gitignored because it contains sensitive credentials. Rotate any exposed passwords immediately.
