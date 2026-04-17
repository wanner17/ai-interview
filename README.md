# AI Interview — 실시간 안면 분석 면접 시뮬레이션 시스템

> AI 기반 실시간 시선·표정·발화 분석으로 다양한 유형의 실전 면접을 시뮬레이션하는 웹 애플리케이션

🔗 **Live Demo:** [ai-interview-rho-kohl.vercel.app](https://ai-interview-rho-kohl.vercel.app)

---

## 프로젝트 소개

AI Interview는 구직자가 실전과 동일한 환경에서 면접을 연습할 수 있도록 돕는 AI 면접 시뮬레이션 시스템입니다.

- 카메라와 마이크를 통해 면접자의 **시선, 표정, 발화**를 실시간으로 분석합니다.
- **5가지 면접 유형**을 지원하며, 이력서를 업로드하면 맞춤 질문을 자동 생성합니다.
- 면접 종료 후 AI가 생성한 **상세 피드백 리포트**를 PDF로 제공합니다.

---

## 면접 유형

| 유형 | 설명 |
|------|------|
| **개인 면접** | 1:1 AI 면접관 방식, 답변에 따른 AI 꼬리 질문 포함 |
| **외국어 면접** | 한국어·영어·일본어·중국어 선택 가능 |
| **PT 면접** | 주제 발표(5분) + AI가 생성한 Q&A 2문항 |
| **집단 면접** | 방 코드로 최대 8명 참여, 순번 자동 배정 |
| **토론 면접** | 찬반/자유 방식, 라운드별 AI 사회자 코멘트 |

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 실시간 안면 분석 | MediaPipe + TensorFlow.js 기반 시선·표정 추적 |
| 음성 인식 (STT) | Google Cloud STT를 통한 실시간 발화 텍스트 변환 |
| 이력서 기반 질문 생성 | PDF·DOCX·TXT 업로드 → OpenAI로 맞춤 질문 4개 생성 |
| AI 피드백 | 답변 내용·시선집중도·발화 분석 후 점수 및 코멘트 제공 |
| AI 꼬리 질문 | 개인 면접 시 답변에 따른 압박 꼬리 질문 자동 생성 |
| 실시간 멀티플레이 | Socket.IO 기반 집단면접·토론면접 실시간 진행 |
| 공개/비공개 방 | 방 코드 + 비밀번호로 프라이빗 면접 방 운영 가능 |
| PDF 리포트 | 면접 종료 후 전체 결과를 html2canvas + jsPDF로 자동 생성 |

---

## 기술 스택

### Frontend
- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **MediaPipe** (`@mediapipe/face_mesh`, `@mediapipe/tasks-vision`) — 얼굴 랜드마크 감지
- **TensorFlow.js** — 클라이언트 사이드 AI 추론
- **Socket.IO Client** — 실시간 통신
- **html2canvas + jsPDF** — PDF 리포트 생성

### Backend (`server/`)
- **Node.js + Express + TypeScript**
- **Socket.IO Server** — 실시간 이벤트 처리 (집단/토론 면접 방 관리)
- **Google Cloud STT** — 음성 → 텍스트 변환
- **OpenAI API (gpt-3.5-turbo)** — 질문 생성, 피드백, 꼬리 질문, 주제 생성
- **multer** — 이력서 파일 업로드 처리

### Infra / DevOps
- **Docker + Docker Compose** — 프론트/백엔드 컨테이너 분리 운영
- **Vercel** — 프론트엔드 배포

---

## 프로젝트 구조

```
ai-interview/
├── app/                        # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── socket.ts               # Socket.IO 클라이언트 설정
├── public/                     # 정적 파일
├── server/                     # 백엔드 서버
│   ├── src/
│   │   └── index.ts            # Express + Socket.IO 메인 서버
│   ├── Dockerfile
│   ├── .env                    # 백엔드 환경 변수 (gitignore)
│   └── google-stt-key.json     # Google STT 서비스 계정 키 (gitignore)
├── Dockerfile                  # 프론트엔드 Docker 이미지
├── docker-compose.yml          # 통합 실행 설정
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

---

## 시작하기

### 사전 요구사항

- Node.js 20+
- Docker & Docker Compose (Docker 실행 시)
- Google Cloud 프로젝트 및 STT API 활성화
- OpenAI API 키 (없으면 기본 질문·규칙 기반 피드백으로 동작)

---

### 1. 로컬 개발 (프론트엔드만)

```bash
git clone https://github.com/wanner17/ai-interview.git
cd ai-interview
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

### 2. 환경 변수 설정

프로젝트 루트 `.env.local`:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

백엔드 `server/.env`:

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:3000
GOOGLE_APPLICATION_CREDENTIALS=/app/google-stt-key.json
OPENAI_API_KEY=your_openai_api_key
```

---

### 3. Docker Compose로 전체 실행

```bash
# server/google-stt-key.json 에 Google STT 서비스 계정 키 파일 배치 후

docker compose up --build

# 백그라운드 실행
docker compose up --build -d
```

| 서비스 | 포트 | URL |
|--------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 3001 | http://localhost:3001 |

---

### 4. 백엔드 단독 실행

```bash
cd server
npm install
npm run dev
```

---

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 프론트 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 코드 검사 |

---

## 권한 및 보안

이 앱은 다음 브라우저 권한을 요청합니다:

- **카메라(Camera)** — 실시간 안면 분석
- **마이크(Microphone)** — 발화 인식

> 카메라 영상 및 음성 데이터는 실시간 분석에만 사용되며 외부 서버에 저장되지 않습니다.

---

## 향후 개발 계획 (Roadmap)

### 인증 / 계정
- [ ] 회원가입 및 로그인 (소셜 로그인 포함)
- [ ] 면접 히스토리 및 회차별 리포트 비교

### 영상 공유 마켓플레이스
- [ ] 면접 영상 녹화 및 DB 저장 (회원 동의 기반)
- [ ] 토큰 선불 결제 시스템 도입
- [ ] 토큰으로 다른 사람의 면접 영상 구매·열람
- [ ] 영상 공유자에게 수익 자동 배분 (열람 수익의 일정 비율)

### 프라이버시 및 데이터 보호
- [ ] AI 자동 블러 처리 — 업로드 시 선택적 얼굴·배경 익명화
- [ ] 음성 변조 옵션 — 목소리 톤 변경으로 신원 보호
- [ ] 부분 공유 기능 — 특정 질문 구간만 잘라서 판매 가능

### 구매자 경험 개선
- [ ] 기업/직무별 합격 영상 태그 및 인증 마크 시스템 (`[삼성전자/백엔드/최종합격]` 형식)
- [ ] AI 하이라이트 미리보기 — 구매 전 핵심 키워드·STAR 구조 텍스트 노출
- [ ] 유사 답변 비교 (Split View) — 내 답변과 구매 영상 나란히 비교 학습

### 커뮤니티 및 동기부여
- [ ] 면접 스터디 구독 시스템 — 유저 팔로우 및 신규 영상 알림
- [ ] 베스트 답변 주간/월간 랭킹 — 인기 콘텐츠 메인 노출 및 추가 수익
- [ ] 리워드 토큰 충전 — 피드백 댓글·평가 참여 시 소량 토큰 지급

### 기술적 고도화
- [ ] DRM 콘텐츠 보호 — 무단 복제·화면 녹화 방지
- [ ] 적응형 스트리밍 (HLS/DASH) — 다운로드 없이 원하는 구간 즉시 탐색

## 기여 방법

1. 이 레포지토리를 Fork 합니다.
2. 새 브랜치를 생성합니다: `git checkout -b feature/기능명`
3. 변경사항을 커밋합니다: `git commit -m 'feat: 기능 설명'`
4. 브랜치에 Push 합니다: `git push origin feature/기능명`
5. Pull Request를 생성합니다.

---

## 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.

---

> 개발 중인 프로젝트입니다. 기능 및 문서는 계속 업데이트됩니다.
