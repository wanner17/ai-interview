[README.md](https://github.com/user-attachments/files/26696673/README.md)
# 🤖 AI Interview — 실시간 안면 분석 면접 시스템

> AI 기반 실시간 시선·표정·발화 분석으로 실전 면접을 시뮬레이션하는 웹 애플리케이션

🔗 **Live Demo:** [ai-interview-rho-kohl.vercel.app](https://ai-interview-rho-kohl.vercel.app)

---

## 📌 프로젝트 소개

AI Interview는 구직자가 실전과 동일한 환경에서 면접을 연습할 수 있도록 돕는 AI 면접 시뮬레이션 시스템입니다.

- 카메라와 마이크를 통해 면접자의 **시선, 표정, 발화**를 실시간으로 분석합니다.
- 면접 종료 후 AI가 생성한 **상세 피드백 리포트**를 PDF로 제공합니다.
- 수집된 영상 데이터는 **외부에 저장되지 않으며**, 실시간 분석에만 사용됩니다.

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 👁️ 실시간 안면 분석 | MediaPipe + TensorFlow.js 기반 시선·표정 추적 |
| 🎙️ 실시간 음성 인식 | Google STT(Speech-to-Text)를 통한 발화 분석 |
| 🔌 실시간 통신 | Socket.IO를 통한 프론트-백엔드 실시간 데이터 교환 |
| 📊 AI 피드백 리포트 | 면접 종료 후 분석 결과를 PDF로 자동 생성 |
| 🔒 프라이버시 보호 | 영상 데이터 외부 저장 없음 |

---

## 🛠 기술 스택

### Frontend
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **MediaPipe** (`@mediapipe/face_mesh`, `@mediapipe/tasks-vision`) — 얼굴 랜드마크 실시간 감지
- **TensorFlow.js** — 클라이언트 사이드 AI 추론
- **Socket.IO Client** — 백엔드 실시간 통신
- **html2canvas + jsPDF** — 리포트 PDF 생성

### Backend
- **Node.js** (별도 `server/` 디렉터리)
- **Socket.IO Server** — 실시간 이벤트 처리
- **Google Cloud STT** — 음성 → 텍스트 변환

### Infra / DevOps
- **Docker + Docker Compose** — 프론트/백엔드 컨테이너 분리 운영
- **Vercel** — 프론트엔드 배포

---

## 📁 프로젝트 구조

```
ai-interview/
├── app/                    # Next.js App Router 페이지 및 컴포넌트
├── public/                 # 정적 파일 (이미지, 아이콘 등)
├── server/                 # 백엔드 서버 (Node.js + Socket.IO)
│   ├── Dockerfile          # 백엔드 Docker 이미지 설정
│   ├── .env                # 백엔드 환경 변수 (gitignore)
│   └── google-stt-key.json # Google STT 서비스 계정 키 (gitignore)
├── Dockerfile              # 프론트엔드 Docker 이미지 설정
├── docker-compose.yml      # 프론트+백엔드 통합 실행 설정
├── next.config.ts
├── tailwind.config (postcss.config.mjs)
├── tsconfig.json
└── package.json
```

---

## 🚀 시작하기

### 사전 요구사항

- Node.js 20+
- npm
- Docker & Docker Compose (Docker로 실행 시)
- Google Cloud 프로젝트 및 STT API 활성화

---

### 1. 로컬 개발 (프론트엔드만)

```bash
# 저장소 클론
git clone https://github.com/wanner17/ai-interview.git
cd ai-interview

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

백엔드 `server/.env` 파일 생성:

```env
# 필요한 환경 변수 추가 (Google STT 등)
GOOGLE_APPLICATION_CREDENTIALS=/app/google-stt-key.json
PORT=3001
```

---

### 3. Docker Compose로 전체 실행 (프론트 + 백엔드)

```bash
# Google STT 서비스 계정 키 파일 준비
# server/google-stt-key.json 에 키 파일 위치

# 빌드 및 실행
docker compose up --build

# 백그라운드 실행
docker compose up --build -d
```

| 서비스 | 포트 | URL |
|--------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 3001 | http://localhost:3001 |

---

### 4. 프로덕션 빌드 (로컬)

```bash
npm run build
npm run start
```

---

## 📜 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 코드 검사 |

---

## 🔐 권한 및 보안

이 앱은 다음 브라우저 권한을 요청합니다:

- **카메라(Camera)** — 실시간 안면 분석
- **마이크(Microphone)** — 발화 인식

> ⚠️ 카메라 영상 및 음성 데이터는 실시간 분석에만 사용되며 외부 서버에 저장되지 않습니다.

---

## 🗺 향후 개발 계획 (Roadmap)

- [ ] 면접 유형 선택 (직군별 / 직무별)
- [ ] 면접 질문 커스터마이징
- [ ] 히스토리 및 회차별 리포트 비교
- [ ] 다국어 지원 (영어 면접 모드)
- [ ] 모바일 최적화

---

## 🤝 기여 방법

1. 이 레포지토리를 Fork 합니다.
2. 새 브랜치를 생성합니다: `git checkout -b feature/기능명`
3. 변경사항을 커밋합니다: `git commit -m 'feat: 기능 설명'`
4. 브랜치에 Push 합니다: `git push origin feature/기능명`
5. Pull Request를 생성합니다.

---

## 📄 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.

---

> 개발 중인 프로젝트입니다. 기능 및 문서는 계속 업데이트됩니다.
