# 1. Node.js 20버전 (가벼운 Alpine 리눅스 기반) 사용
FROM node:20-alpine

# 2. 작업 디렉터리 설정
WORKDIR /app

# 3. 패키지 파일 복사 및 종속성 설치
COPY package*.json ./
RUN npm install

# 4. 소스 코드 복사 및 Next.js 프로덕션 빌드
COPY . .
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
RUN npm run build

# 5. 실행 포트 및 시작 명령어 설정
EXPOSE 3000

CMD ["npm", "run", "start"]