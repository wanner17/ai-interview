# 1. Node.js 20버전 (가벼운 Alpine 리눅스 기반) 사용
FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
# postinstall(prisma generate) 건너뛰고 설치 — 빌드 중 DATABASE_URL 없음
RUN npm install --ignore-scripts

COPY prisma ./prisma/
# schema만 읽음, DB 연결 불필요
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]