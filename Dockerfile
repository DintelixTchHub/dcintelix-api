
FROM node:18-alpine AS builder

RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

COPY . .

RUN npm ci

RUN npm run build

FROM node:18-alpine


RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

COPY --from=builder /app/prisma ./prisma

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma


EXPOSE 3007

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3007/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)});" || exit 1

CMD ["sh", "-c", "npm run prisma:deploy && npm start"]
