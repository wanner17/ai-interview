import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SpeechClient } from '@google-cloud/speech';
import OpenAI from 'openai';
import multer from 'multer';
import { authRouter } from './routes/auth.route';
import { videoRouter } from './routes/video.route';

const app = express();
const httpServer = createServer(app);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', clientOrigin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});
app.use(express.json());
app.use('/auth', authRouter);
app.use('/videos', videoRouter);

const io = new Server(httpServer, {
  cors: { origin: clientOrigin, methods: ['GET', 'POST'], credentials: true },
});

let speechClient: SpeechClient | null = null;
try { speechClient = new SpeechClient(); }
catch { console.log('⚠️ GCP STT Mock 모드'); }

const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy_key' });

const DEFAULT_QUESTIONS = [
  "1. 1분 자기소개를 부탁드립니다.",
  "2. 우리 회사에 지원하게 된 동기는 무엇인가요?",
  "3. 본인의 가장 큰 장점과 단점은 무엇인지 경험을 들어 설명해주세요.",
  "4. 마지막으로 하고 싶은 질문이나 말이 있다면 자유롭게 해주세요.",
];

const LANGUAGE_NAMES: Record<string, string> = {
  'ko-KR': '한국어', 'en-US': 'English', 'ja-JP': '日本語', 'zh-CN': '中文',
};

// ── 집단면접 방 관리 ─────────────────────────────────────────────────────────
interface GroupParticipant { socketId: string; name: string; order: number; }
interface GroupAnswerResult {
  participantId: string; participantName: string;
  answer: string; focusScore: number; answerScore: number;
  feedback: { good: string; bad: string };
}
interface GroupRoom {
  code: string; hostId: string; participants: GroupParticipant[];
  status: 'waiting' | 'interviewing' | 'finished';
  questions: string[]; currentQuestionIndex: number; currentAnswererIndex: number;
  results: Array<{ question: string; answers: GroupAnswerResult[] }>;
  roomName: string; isPrivate: boolean; password?: string;
}
const groupRooms = new Map<string, GroupRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return groupRooms.has(code) ? generateRoomCode() : code;
}

function broadcastRoomList() {
  const publicRooms = Array.from(groupRooms.values())
    .filter(r => r.status === 'waiting' && !r.isPrivate)
    .map(r => ({ code: r.code, roomName: r.roomName, participantCount: r.participants.length }));
  io.emit('room_list_updated', publicRooms);
}

// ── 토론면접 방 관리 ──────────────────────────────────────────────────────────
interface DebateParticipant { socketId: string; name: string; side: 'pro' | 'con' | 'neutral'; }
interface DebateSpeech {
  participantId: string; participantName: string; side: string;
  speech: string; focusScore: number; round: number; answerScore: number;
  feedback: { good: string; bad: string };
}
interface DebateRoom {
  code: string; hostId: string; participants: DebateParticipant[];
  status: 'waiting' | 'debating' | 'finished';
  topic: string; topicDescription: string; proLabel: string; conLabel: string;
  debateType: 'pro-con' | 'free';
  totalRounds: number; currentRound: number; currentSpeakerIndex: number;
  roundOrder: string[]; speeches: DebateSpeech[];
  isPrivate: boolean; password?: string; roomName: string;
}
const debateRooms = new Map<string, DebateRoom>();

function generateDebateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return (debateRooms.has(code) || groupRooms.has(code)) ? generateDebateRoomCode() : code;
}

function broadcastDebateRoomList() {
  const list = Array.from(debateRooms.values())
    .filter(r => r.status === 'waiting' && !r.isPrivate)
    .map(r => ({ code: r.code, roomName: r.roomName, topic: r.topic, debateType: r.debateType, participantCount: r.participants.length }));
  io.emit('debate_room_list_updated', list);
}

// ── 이력서 업로드 ─────────────────────────────────────────────────────────────
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/generate-questions', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) { res.status(400).json({ error: '파일이 없습니다.' }); return; }
    const { mimetype, buffer } = req.file;
    let resumeText = '';
    if (mimetype === 'application/pdf') {
      const { PDFParse } = require('pdf-parse') as { PDFParse: new (o: { data: Buffer }) => { getText: () => Promise<{ text: string }> } };
      resumeText = (await new PDFParse({ data: buffer }).getText()).text;
    } else if (mimetype.includes('wordprocessingml') || mimetype === 'application/msword') {
      const mammoth = require('mammoth') as { extractRawText: (o: { buffer: Buffer }) => Promise<{ value: string }> };
      resumeText = (await mammoth.extractRawText({ buffer })).value;
    } else if (mimetype === 'text/plain') {
      resumeText = buffer.toString('utf-8');
    } else {
      res.status(400).json({ error: 'PDF, DOCX, TXT 파일만 지원합니다.' }); return;
    }
    if (!resumeText.trim()) { res.status(400).json({ error: '텍스트 추출 실패' }); return; }
    if (!hasOpenAIKey) { res.json({ questions: DEFAULT_QUESTIONS }); return; }

    const truncated = resumeText.length > 3000 ? resumeText.substring(0, 3000) + '...' : resumeText;
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: `당신은 전문 면접관입니다. 이력서를 분석하여 맞춤 면접 질문 4개를 생성하세요.\n\n이력서:\n${truncated}\n\n첫 질문은 자기소개, 마지막은 역질문 기회. 한국어로 작성.\nJSON: {"questions": ["질문1","질문2","질문3","질문4"]}` }],
      model: 'gpt-3.5-turbo', response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(completion.choices[0].message?.content || '{}');
    if (!Array.isArray(parsed.questions) || !parsed.questions.length) { res.json({ questions: DEFAULT_QUESTIONS }); return; }
    res.json({ questions: parsed.questions.map((q: string, i: number) => `${i + 1}. ${q}`) });
  } catch (err) {
    console.error('⚠️ [Resume]', err);
    res.status(500).json({ error: '질문 생성 실패' });
  }
});

// ── PT 주제 생성 ──────────────────────────────────────────────────────────────
const PT_CATEGORY_NAMES: Record<string, string> = {
  business: '경영/전략', tech: 'IT/기술', marketing: '마케팅/브랜딩',
  finance: '금융/경제', social: '사회/이슈', hr: '조직/인사',
};
const PT_DEFAULT_TOPICS: Record<string, { topic: string; outline: string[] }> = {
  business: { topic: '디지털 전환이 기업 경쟁력에 미치는 영향', outline: ['디지털 전환의 현황과 필요성', '국내외 성공 사례 분석', '도입 시 주요 도전 과제', '우리 기업의 디지털 전환 추진 전략'] },
  tech:     { topic: '생성형 AI가 소프트웨어 개발 생태계에 미치는 영향', outline: ['생성형 AI 기술 현황', '개발 생산성 향상 사례', '보안·윤리적 리스크', '개발자의 역할 변화와 대응 방안'] },
  marketing:{ topic: 'MZ세대를 공략하는 숏폼 콘텐츠 마케팅 전략', outline: ['MZ세대 미디어 소비 트렌드', '숏폼 플랫폼별 특성 비교', '성공적인 바이럴 캠페인 사례', '브랜드 적용 전략 제언'] },
  finance:  { topic: '고금리 시대 기업의 재무 리스크 관리 방안', outline: ['글로벌 금리 환경 분석', '기업 재무 건전성 평가 지표', '리스크 헤지 전략', '사례 기반 실행 로드맵'] },
  social:   { topic: '저출산·고령화 사회에서 기업의 지속 가능 성장 전략', outline: ['인구 구조 변화의 경제적 영향', '노동력 부족 문제와 대응', '시니어 시장 기회 분석', '기업 차원의 중장기 전략'] },
  hr:       { topic: '하이브리드 근무 환경에서의 조직 문화 구축 방안', outline: ['하이브리드 근무 현황과 과제', '직원 몰입도 저하 요인 분석', '성공적인 글로벌 사례', '우리 조직에 맞는 실행 방안'] },
};

app.post('/api/pt-generate-topic', async (req, res) => {
  try {
    const { category = 'business', customTopic } = req.body as { category?: string; customTopic?: string };
    if (customTopic?.trim()) {
      const outline = hasOpenAIKey
        ? await (async () => {
            const c = await openai.chat.completions.create({
              messages: [{ role: 'user', content: `PT 발표 주제: "${customTopic}"\n이 주제로 5분 발표 구조(4개 항목)를 JSON으로 생성하세요.\nJSON: {"outline":["항목1","항목2","항목3","항목4"]}` }],
              model: 'gpt-3.5-turbo', response_format: { type: 'json_object' },
            });
            const p = JSON.parse(c.choices[0].message?.content || '{}');
            return Array.isArray(p.outline) ? p.outline : [];
          })()
        : PT_DEFAULT_TOPICS[category]?.outline || [];
      res.json({ topic: customTopic.trim(), outline, timeLimit: 5 }); return;
    }

    if (!hasOpenAIKey) {
      const def = PT_DEFAULT_TOPICS[category] || PT_DEFAULT_TOPICS.business;
      res.json({ ...def, timeLimit: 5 }); return;
    }
    const categoryName = PT_CATEGORY_NAMES[category] || '경영/전략';
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: `당신은 대기업 면접 출제위원입니다. ${categoryName} 분야 PT면접 주제 1개와 5분 발표 구조를 생성하세요.\nJSON: {"topic":"발표 주제(한 문장)","outline":["발표 구조 항목1","항목2","항목3","항목4"]}` }],
      model: 'gpt-3.5-turbo', response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(completion.choices[0].message?.content || '{}');
    res.json({ topic: parsed.topic || PT_DEFAULT_TOPICS.business.topic, outline: parsed.outline || [], timeLimit: 5 });
  } catch (err) {
    console.error('⚠️ [PT Topic]', err);
    res.status(500).json({ error: '주제 생성 실패' });
  }
});

// ── 토론 주제 생성 ────────────────────────────────────────────────────────────
const DEBATE_DEFAULTS: Record<string, { topic: string; description: string; proLabel: string; conLabel: string }> = {
  social:   { topic: '주 4일 근무제 전면 도입은 바람직한가', description: '근로 시간 단축이 생산성, 워라밸, 기업 경쟁력에 미치는 영향을 논의합니다.', proLabel: '찬성: 삶의 질 향상 및 생산성 증대', conLabel: '반대: 경제적 비용 및 업무 과부하 우려' },
  tech:     { topic: 'AI가 인간의 창의적 직업을 대체할 것인가', description: 'AI 기술 발전이 창작·예술·디자인 분야에 미치는 영향을 논의합니다.', proLabel: '찬성: AI의 창의적 능력 무한 확장', conLabel: '반대: 인간 고유 창의성은 대체 불가' },
  education:{ topic: '대입 수능 시험 폐지는 바람직한가', description: '현행 수능의 교육적 효과와 대안적 입시 제도를 논의합니다.', proLabel: '찬성: 창의 인재 발굴·교육 다양화', conLabel: '반대: 공정성·객관적 평가 기준 필요' },
  economy:  { topic: '기본소득제 도입은 한국 경제에 도움이 되는가', description: '모든 시민에게 조건 없이 소득을 지급하는 기본소득제의 경제 효과를 논의합니다.', proLabel: '찬성: 소득 불평등 해소 및 소비 진작', conLabel: '반대: 재정 부담 및 노동 의욕 저하' },
  environment: { topic: '원자력 발전 확대는 탄소중립 달성에 필요한가', description: '원자력 에너지의 안전성과 재생에너지 전환 속도를 중심으로 논의합니다.', proLabel: '찬성: 안정적 탄소중립 에너지원', conLabel: '반대: 안전 리스크와 핵폐기물 문제' },
};

app.post('/api/debate-topic', async (req, res) => {
  try {
    const { category = 'social', customTopic, debateType = 'pro-con' } = req.body as { category?: string; customTopic?: string; debateType?: string };
    if (!hasOpenAIKey) {
      const def = DEBATE_DEFAULTS[category] || DEBATE_DEFAULTS.social;
      res.json(def); return;
    }
    const catNames: Record<string, string> = { social: '사회/노동', tech: 'IT/기술', education: '교육', economy: '경제', environment: '환경/에너지' };
    const prompt = customTopic?.trim()
      ? `토론 주제: "${customTopic}"\n이 주제로 찬반 토론 정보를 JSON으로 생성하세요.\nJSON: {"topic":"${customTopic}","description":"주제 설명 1문장","proLabel":"찬성 입장 한 줄 요약","conLabel":"반대 입장 한 줄 요약"}`
      : `당신은 토론 출제위원입니다. ${catNames[category] || '사회'} 분야 토론 주제 1개를 생성하세요.\nJSON: {"topic":"토론 주제(~은/는 바람직한가 형식)","description":"주제 설명 1문장","proLabel":"찬성 입장 한 줄","conLabel":"반대 입장 한 줄"}`;
    const c = await openai.chat.completions.create({ messages: [{ role: 'user', content: prompt }], model: 'gpt-3.5-turbo', response_format: { type: 'json_object' } });
    const p = JSON.parse(c.choices[0].message?.content || '{}');
    res.json({ topic: p.topic || DEBATE_DEFAULTS.social.topic, description: p.description || '', proLabel: p.proLabel || '', conLabel: p.conLabel || '' });
  } catch (err) { console.error('⚠️ [DebateTopic]', err); res.status(500).json({ error: '주제 생성 실패' }); }
});

// ── AI 헬퍼 함수들 ────────────────────────────────────────────────────────────
async function generateFollowupQuestion(question: string, answer: string, language: string): Promise<string | null> {
  const isKorean = language === 'ko-KR';
  const prompt = isKorean
    ? `당신은 날카로운 면접관입니다. 지원자의 답변에서 불명확한 부분을 파고드는 압박 꼬리 질문 1개를 생성하세요.\n질문: ${question}\n답변: ${answer}\n꼬리 질문만 출력하세요.`
    : `You are a sharp interviewer. Generate 1 probing follow-up question based on the answer.\nQuestion: ${question}\nAnswer: ${answer}\nOutput only the follow-up question.`;
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }], model: 'gpt-3.5-turbo', max_tokens: 120,
  });
  return completion.choices[0].message?.content?.trim() || null;
}

async function generateFeedback(
  question: string, answer: string, focusScore: number, language: string, isFollowup: boolean,
): Promise<{ score: number; good: string; bad: string }> {
  const langName = LANGUAGE_NAMES[language] || language;
  const prompt = language === 'ko-KR'
    ? `당신은 매우 엄격한 대기업 수석 면접관입니다. 날카롭고 객관적인 피드백을 제공하세요.\nJSON: {"score":정수(0~100),"good":"긍정 평가 1줄","bad":"개선점 1줄"}\n\n질문: ${question}${isFollowup ? ' [꼬리질문]' : ''}\n답변: ${answer}\n시선집중도: ${focusScore}%`
    : `You are a strict senior interviewer evaluating a ${langName} interview. Analyze content, grammar, vocabulary, fluency.\nJSON: {"score":int(0-100),"good":"one positive","bad":"one improvement"}\n\nQuestion: ${question}${isFollowup ? ' [Follow-up]' : ''}\nAnswer: ${answer}\nEye contact: ${focusScore}%`;
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }], model: 'gpt-3.5-turbo', response_format: { type: 'json_object' },
  });
  const r = JSON.parse(completion.choices[0].message?.content || '{}');
  return { score: typeof r.score === 'number' ? r.score : 0, good: r.good || '', bad: r.bad || '' };
}

// ── Socket.IO ──────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Connected] ${socket.id}`);
  let recognizeStream: any = null;

  // 개인/외국어 면접 세션 상태
  let sessionQuestions = [...DEFAULT_QUESTIONS];
  let currentQuestionIndex = 0;
  let sessionInterviewType = 'individual';
  let sessionLanguage = 'ko-KR';
  let followupAskedForCurrent = false;
  let lastMainQA: { question: string; answer: string } | null = null;
  const interviewResults: any[] = [];

  // PT 면접 세션 상태
  let ptQAQuestions: string[] = [];
  let ptQAIndex = 0;
  const ptResults: any[] = [];

  // ── STT ────────────────────────────────────────────────────────────────────
  socket.on('start_audio_stream', () => {
    if (!speechClient) return;
    recognizeStream = speechClient.streamingRecognize({
      config: { encoding: 'WEBM_OPUS' as const, sampleRateHertz: 48000, languageCode: sessionLanguage },
      interimResults: true,
    })
    .on('error', (err) => { console.error(`⚠️ [STT]`, err.message); if (recognizeStream) recognizeStream.destroy(); recognizeStream = null; })
    .on('data', (data) => {
      const r = data.results[0];
      if (r?.alternatives[0]) socket.emit('stt_result', { transcript: r.alternatives[0].transcript, isFinal: r.isFinal });
    });
  });

  socket.on('audio_chunk', (chunk) => {
    if (recognizeStream && !recognizeStream.destroyed) recognizeStream.write(chunk);
    else socket.emit('stt_result', { transcript: `(STT 연결 대기 중...) ${chunk.length}bytes`, isFinal: false });
  });

  socket.on('stop_audio_stream', () => {
    if (recognizeStream) { recognizeStream.end(); recognizeStream = null; }
  });

  // ── 개인/외국어 면접 ─────────────────────────────────────────────────────────
  socket.on('start_interview', (data?: { customQuestions?: string[]; interviewType?: string; language?: string }) => {
    currentQuestionIndex = 0; followupAskedForCurrent = false; lastMainQA = null; interviewResults.length = 0;
    sessionInterviewType = data?.interviewType || 'individual';
    sessionLanguage = data?.language || 'ko-KR';
    sessionQuestions = data?.customQuestions?.length ? data.customQuestions : [...DEFAULT_QUESTIONS];
    console.log(`📋 [Interview] type=${sessionInterviewType} lang=${sessionLanguage} q=${sessionQuestions.length}개`);
    socket.emit('next_question', { question: sessionQuestions[0], isEnd: false, isFollowup: false });
  });

  socket.on('request_next_question', async () => {
    if (sessionInterviewType === 'individual' && hasOpenAIKey && !followupAskedForCurrent && lastMainQA) {
      followupAskedForCurrent = true;
      try {
        const fq = await generateFollowupQuestion(lastMainQA.question, lastMainQA.answer, sessionLanguage);
        if (fq) { socket.emit('next_question', { question: fq, isEnd: false, isFollowup: true }); return; }
      } catch (err) { console.error('⚠️ [Followup]', err); }
    }
    followupAskedForCurrent = false; lastMainQA = null;
    currentQuestionIndex++;
    if (currentQuestionIndex < sessionQuestions.length) {
      socket.emit('next_question', { question: sessionQuestions[currentQuestionIndex], isEnd: false, isFollowup: false });
    } else {
      socket.emit('next_question', { question: '면접이 모두 종료되었습니다. 수고하셨습니다!', isEnd: true, isFollowup: false });
      socket.emit('interview_finished', interviewResults);
    }
  });

  socket.on('submit_answer', async (data) => {
    const isFollowup: boolean = !!data.isFollowup;
    if (!isFollowup) lastMainQA = { question: data.question, answer: data.answer };
    const { totalFrames, lookAwayFrames } = data.analysis;
    const focusScore = totalFrames > 0 ? Math.round(((totalFrames - lookAwayFrames) / totalFrames) * 100) : 0;
    const answerLength = data.answer?.trim().length || 0;
    let good = '답변이 완료되었습니다.', bad = '더 구체적인 답변을 준비하세요.', score = 0;
    if (hasOpenAIKey && answerLength > 0) {
      try { const fb = await generateFeedback(data.question, data.answer, focusScore, sessionLanguage, isFollowup); score = fb.score; good = fb.good; bad = fb.bad; }
      catch (err) { console.error('⚠️ [Feedback]', err); }
    } else {
      if (focusScore >= 80) good = '시선 처리는 무난합니다.';
      if (focusScore < 60) bad = '시선이 분산되어 있습니다.';
      score = answerLength >= 30 ? 70 : answerLength >= 15 ? 50 : 20;
    }
    interviewResults.push({ question: data.question, answer: data.answer, focusScore, answerScore: score, analysis: data.analysis, isFollowup, feedback: { good, bad } });
  });

  // ── PT 면접 ──────────────────────────────────────────────────────────────────
  socket.on('pt_submit_presentation', async (data: { topic: string; transcript: string; analysis: any }) => {
    const { totalFrames, lookAwayFrames } = data.analysis || {};
    const focusScore = totalFrames > 0 ? Math.round(((totalFrames - lookAwayFrames) / totalFrames) * 100) : 0;

    let score = 70, good = '발표가 완료되었습니다.', bad = '더 구체적인 내용을 준비하세요.';
    let qaQs = ['발표에서 가장 중점을 둔 부분은 무엇인가요?', '이 주제에 대한 본인만의 차별화된 시각은 무엇인가요?'];

    if (hasOpenAIKey && data.transcript.trim().length > 0) {
      try {
        const comp = await openai.chat.completions.create({
          messages: [{ role: 'user', content: `당신은 엄격한 면접관입니다. PT 발표를 평가하고 Q&A 질문 2개를 생성하세요.\n발표 주제: ${data.topic}\n발표 내용: ${data.transcript.substring(0, 2000)}\n시선집중도: ${focusScore}%\n\nJSON: {"score":정수(0-100),"good":"긍정평가 1줄","bad":"개선점 1줄","qa":["질문1","질문2"]}` }],
          model: 'gpt-3.5-turbo', response_format: { type: 'json_object' },
        });
        const r = JSON.parse(comp.choices[0].message?.content || '{}');
        score = typeof r.score === 'number' ? r.score : 70;
        good = r.good || good; bad = r.bad || bad;
        if (Array.isArray(r.qa) && r.qa.length >= 2) qaQs = r.qa.slice(0, 2);
      } catch (err) { console.error('⚠️ [PT Feedback]', err); }
    }

    ptQAQuestions = qaQs;
    ptQAIndex = 0;
    ptResults.length = 0;
    ptResults.push({ type: 'presentation', topic: data.topic, transcript: data.transcript, focusScore, answerScore: score, feedback: { good, bad }, analysis: data.analysis });

    socket.emit('pt_presentation_feedback', { focusScore, answerScore: score, feedback: { good, bad }, qaQuestion: qaQs[0], qaIndex: 0, totalQA: qaQs.length });
    console.log(`📊 [PT] 발표 제출 topic="${data.topic.substring(0, 30)}" score=${score}`);
  });

  socket.on('pt_submit_qa_answer', async (data: { question: string; answer: string; analysis: any }) => {
    const { totalFrames, lookAwayFrames } = data.analysis || {};
    const focusScore = totalFrames > 0 ? Math.round(((totalFrames - lookAwayFrames) / totalFrames) * 100) : 0;

    let score = 70, good = '답변이 완료되었습니다.', bad = '더 구체적인 답변을 준비하세요.';
    if (hasOpenAIKey && data.answer.trim().length > 0) {
      try {
        const fb = await generateFeedback(data.question, data.answer, focusScore, 'ko-KR', false);
        score = fb.score; good = fb.good; bad = fb.bad;
      } catch (err) { console.error('⚠️ [PT QA Feedback]', err); }
    }

    ptResults.push({ type: 'qa', question: data.question, answer: data.answer, focusScore, answerScore: score, feedback: { good, bad }, analysis: data.analysis });
    socket.emit('pt_qa_feedback', { focusScore, answerScore: score, feedback: { good, bad } });

    ptQAIndex++;
    if (ptQAIndex < ptQAQuestions.length) {
      socket.emit('pt_next_qa', { question: ptQAQuestions[ptQAIndex], qaIndex: ptQAIndex, totalQA: ptQAQuestions.length });
    } else {
      socket.emit('pt_finished', [...ptResults]);
      console.log(`✅ [PT] 완료 QA ${ptResults.length - 1}개`);
    }
  });

  // ── 토론면접 ─────────────────────────────────────────────────────────────────
  socket.on('get_debate_room_list', () => {
    const list = Array.from(debateRooms.values())
      .filter(r => r.status === 'waiting' && !r.isPrivate)
      .map(r => ({ code: r.code, roomName: r.roomName, topic: r.topic, debateType: r.debateType, participantCount: r.participants.length }));
    socket.emit('debate_room_list_updated', list);
  });

  socket.on('create_debate_room', (data: { name: string; roomName?: string; topic: string; topicDescription: string; proLabel: string; conLabel: string; debateType: 'pro-con' | 'free'; totalRounds: number; isPrivate?: boolean; password?: string }) => {
    const code = generateDebateRoomCode();
    const room: DebateRoom = {
      code, hostId: socket.id,
      participants: [{ socketId: socket.id, name: data.name.trim(), side: 'neutral' }],
      status: 'waiting',
      topic: data.topic, topicDescription: data.topicDescription, proLabel: data.proLabel, conLabel: data.conLabel,
      debateType: data.debateType, totalRounds: data.totalRounds,
      currentRound: 0, currentSpeakerIndex: 0, roundOrder: [], speeches: [],
      roomName: data.roomName?.trim() || `${data.name.trim()}의 토론방`,
      isPrivate: data.isPrivate || false, password: data.isPrivate ? data.password : undefined,
    };
    debateRooms.set(code, room);
    socket.join(`debate:${code}`);
    socket.emit('debate_room_created', { code, room });
    broadcastDebateRoomList();
    console.log(`💬 [Debate] 방 생성 ${code} topic="${data.topic.substring(0, 20)}"`);
  });

  socket.on('join_debate_room', (data: { code: string; name: string; password?: string }) => {
    const code = data.code.toUpperCase().trim();
    const room = debateRooms.get(code);
    if (!room) { socket.emit('debate_room_error', { error: '방 코드를 다시 확인해주세요.' }); return; }
    if (room.status !== 'waiting') { socket.emit('debate_room_error', { error: '이미 시작된 토론입니다.' }); return; }
    if (room.participants.length >= 8) { socket.emit('debate_room_error', { error: '방이 가득 찼습니다.' }); return; }
    if (room.isPrivate && room.password && room.password !== data.password) { socket.emit('debate_room_error', { error: '비밀번호가 틀렸습니다.' }); return; }
    const name = data.name.trim();
    if (room.participants.some(p => p.name === name)) { socket.emit('debate_room_error', { error: '이미 사용 중인 이름입니다.' }); return; }
    room.participants.push({ socketId: socket.id, name, side: 'neutral' });
    socket.join(`debate:${code}`);
    socket.emit('debate_room_joined', { code, room });
    io.to(`debate:${code}`).emit('debate_room_updated', { room });
    broadcastDebateRoomList();
    console.log(`👤 [Debate] ${name} 참가 → ${code}`);
  });

  socket.on('start_debate', (data: { code: string }) => {
    const room = debateRooms.get(data.code);
    if (!room || room.hostId !== socket.id || room.participants.length < 2) return;
    room.status = 'debating';

    // 찬반 배정
    if (room.debateType === 'pro-con') {
      const shuffled = [...room.participants].sort(() => Math.random() - 0.5);
      const half = Math.ceil(shuffled.length / 2);
      shuffled.forEach((p, i) => {
        const original = room.participants.find(o => o.socketId === p.socketId)!;
        original.side = i < half ? 'pro' : 'con';
      });
    } else {
      room.participants.forEach(p => { p.side = 'neutral'; });
    }

    // 라운드 순서 (찬반: 찬성-반대 교대, 자유: 랜덤)
    const buildRoundOrder = () => {
      if (room.debateType === 'pro-con') {
        const pros = room.participants.filter(p => p.side === 'pro');
        const cons = room.participants.filter(p => p.side === 'con');
        const order: string[] = [];
        const max = Math.max(pros.length, cons.length);
        for (let i = 0; i < max; i++) {
          if (pros[i]) order.push(pros[i].socketId);
          if (cons[i]) order.push(cons[i].socketId);
        }
        return order;
      }
      return [...room.participants].sort(() => Math.random() - 0.5).map(p => p.socketId);
    };

    room.currentRound = 1;
    room.currentSpeakerIndex = 0;
    room.roundOrder = buildRoundOrder();

    io.to(`debate:${data.code}`).emit('debate_started', {
      room,
      currentSpeakerId: room.roundOrder[0],
      round: 1, totalRounds: room.totalRounds,
    });
    console.log(`🚀 [Debate] 시작 ${data.code} (${room.participants.length}명, ${room.totalRounds}라운드)`);
  });

  socket.on('debate_submit_speech', async (data: { code: string; speech: string; analysis: any }) => {
    const room = debateRooms.get(data.code);
    if (!room || room.status !== 'debating') return;
    const speakerId = room.roundOrder[room.currentSpeakerIndex];
    if (speakerId !== socket.id) return;

    const speaker = room.participants.find(p => p.socketId === socket.id)!;
    const { totalFrames, lookAwayFrames } = data.analysis || {};
    const focusScore = totalFrames > 0 ? Math.round(((totalFrames - lookAwayFrames) / totalFrames) * 100) : 0;

    let score = 70, good = '발언이 완료되었습니다.', bad = '논거를 더 구체적으로 제시하세요.';
    if (hasOpenAIKey && data.speech.trim()) {
      try {
        const sideLabel = speaker.side === 'pro' ? '찬성' : speaker.side === 'con' ? '반대' : '자유';
        const c = await openai.chat.completions.create({
          messages: [{ role: 'user', content: `당신은 토론 심사위원입니다. 발언을 평가하세요.\n발언자: ${speaker.name}(${sideLabel})\n주제: ${room.topic}\n발언: ${data.speech.substring(0, 1000)}\n시선집중도: ${focusScore}%\nJSON: {"score":정수(0-100),"good":"긍정평가 1줄","bad":"개선점 1줄"}` }],
          model: 'gpt-3.5-turbo', response_format: { type: 'json_object' },
        });
        const r = JSON.parse(c.choices[0].message?.content || '{}');
        score = typeof r.score === 'number' ? r.score : 70;
        good = r.good || good; bad = r.bad || bad;
      } catch {}
    }

    room.speeches.push({ participantId: socket.id, participantName: speaker.name, side: speaker.side, speech: data.speech, focusScore, round: room.currentRound, answerScore: score, feedback: { good, bad } });
    socket.emit('debate_speech_feedback', { focusScore, answerScore: score, feedback: { good, bad } });

    room.currentSpeakerIndex++;

    if (room.currentSpeakerIndex < room.roundOrder.length) {
      // 같은 라운드 다음 발언자
      io.to(`debate:${data.code}`).emit('debate_turn', { currentSpeakerId: room.roundOrder[room.currentSpeakerIndex], round: room.currentRound, totalRounds: room.totalRounds });
    } else {
      // 라운드 종료 → 요약 생성
      const roundSpeeches = room.speeches.filter(s => s.round === room.currentRound);
      let summary = `${room.currentRound}라운드가 종료되었습니다. 다음 라운드에서는 상대방의 주장에 더 구체적으로 반박해 보세요.`;
      if (hasOpenAIKey && roundSpeeches.length > 0) {
        try {
          const speechSummary = roundSpeeches.map(s => `[${s.participantName}(${s.side === 'pro' ? '찬성' : s.side === 'con' ? '반대' : '자유'})] ${s.speech.substring(0, 200)}`).join('\n');
          const c = await openai.chat.completions.create({
            messages: [{ role: 'user', content: `당신은 토론 사회자입니다. ${room.currentRound}라운드 발언을 정리하고 다음 라운드 방향을 제시하세요.\n주제: ${room.topic}\n발언 요약:\n${speechSummary}\n\n사회자 코멘트 2-3문장만 출력하세요.` }],
            model: 'gpt-3.5-turbo', max_tokens: 200,
          });
          summary = c.choices[0].message?.content?.trim() || summary;
        } catch {}
      }

      io.to(`debate:${data.code}`).emit('debate_round_summary', { round: room.currentRound, summary });

      if (room.currentRound < room.totalRounds) {
        // 다음 라운드
        room.currentRound++;
        room.currentSpeakerIndex = 0;
        // 라운드마다 찬반 순서 뒤집기
        if (room.debateType === 'pro-con' && room.currentRound % 2 === 0) room.roundOrder = [...room.roundOrder].reverse();
        else room.roundOrder = [...room.roundOrder].sort(() => Math.random() - 0.5);
        io.to(`debate:${data.code}`).emit('debate_turn', { currentSpeakerId: room.roundOrder[0], round: room.currentRound, totalRounds: room.totalRounds });
      } else {
        // 모든 라운드 종료
        room.status = 'finished';
        const results: any = { topic: room.topic, participants: room.participants, speeches: room.speeches, evaluations: [] };

        if (hasOpenAIKey) {
          try {
            const allSpeeches = room.participants.map(p => {
              const pSpeeches = room.speeches.filter(s => s.participantId === p.socketId);
              return `${p.name}(${p.side}): ${pSpeeches.map(s => s.speech.substring(0, 150)).join(' / ')}`;
            }).join('\n');
            const c = await openai.chat.completions.create({
              messages: [{ role: 'user', content: `토론 심사위원으로서 전체 토론을 평가하세요.\n주제: ${room.topic}\n발언 요약:\n${allSpeeches}\nJSON: {"evaluations":[{"participantId":"socketId","avgScore":정수(0-100),"strength":"강점 1줄","weakness":"약점 1줄"}]}` }],
              model: 'gpt-3.5-turbo', response_format: { type: 'json_object' },
            });
            const r = JSON.parse(c.choices[0].message?.content || '{}');
            if (Array.isArray(r.evaluations)) results.evaluations = r.evaluations;
          } catch {}
        }

        // 점수 기반 평균 fallback
        room.participants.forEach(p => {
          if (!results.evaluations.find((e: any) => e.participantId === p.socketId)) {
            const pSpeeches = room.speeches.filter(s => s.participantId === p.socketId);
            const avg = pSpeeches.length > 0 ? Math.round(pSpeeches.reduce((a, s) => a + s.answerScore, 0) / pSpeeches.length) : 60;
            results.evaluations.push({ participantId: p.socketId, avgScore: avg, strength: '적극적으로 발언했습니다.', weakness: '논거를 더 구체화하세요.' });
          }
        });

        io.to(`debate:${data.code}`).emit('debate_finished', results);
        debateRooms.delete(data.code);
        console.log(`✅ [Debate] 완료 ${data.code}`);
      }
    }
  });

  // ── 집단면접 ─────────────────────────────────────────────────────────────────
  socket.on('create_group_room', (data: { name: string; roomName?: string; isPrivate?: boolean; password?: string }) => {
    const code = generateRoomCode();
    const room: GroupRoom = {
      code, hostId: socket.id,
      participants: [{ socketId: socket.id, name: data.name.trim(), order: 0 }],
      status: 'waiting', questions: [], currentQuestionIndex: 0, currentAnswererIndex: 0, results: [],
      roomName: data.roomName?.trim() || `${data.name.trim()}의 방`,
      isPrivate: data.isPrivate || false,
      password: data.isPrivate ? data.password : undefined,
    };
    groupRooms.set(code, room);
    socket.join(`group:${code}`);
    socket.emit('group_room_created', { code, room });
    broadcastRoomList();
    console.log(`🏠 [Group] 방 생성 ${code} host=${data.name} private=${data.isPrivate}`);
  });

  socket.on('get_room_list', () => {
    const publicRooms = Array.from(groupRooms.values())
      .filter(r => r.status === 'waiting' && !r.isPrivate)
      .map(r => ({ code: r.code, roomName: r.roomName, participantCount: r.participants.length }));
    socket.emit('room_list_updated', publicRooms);
  });

  socket.on('join_group_room', (data: { code: string; name: string; password?: string }) => {
    const code = data.code.toUpperCase().trim();
    const room = groupRooms.get(code);
    if (!room) { socket.emit('group_room_error', { error: '방 코드를 다시 확인해주세요.' }); return; }
    if (room.status !== 'waiting') { socket.emit('group_room_error', { error: '이미 시작된 면접입니다.' }); return; }
    if (room.participants.length >= 8) { socket.emit('group_room_error', { error: '방이 가득 찼습니다. (최대 8명)' }); return; }
    if (room.isPrivate && room.password && room.password !== data.password) {
      socket.emit('group_room_error', { error: '비밀번호가 틀렸습니다.' }); return;
    }
    const trimmedName = data.name.trim();
    if (room.participants.some(p => p.name === trimmedName)) { socket.emit('group_room_error', { error: '이미 사용 중인 이름입니다.' }); return; }
    room.participants.push({ socketId: socket.id, name: trimmedName, order: room.participants.length });
    socket.join(`group:${code}`);
    socket.emit('group_room_joined', { code, room });
    io.to(`group:${code}`).emit('group_room_updated', { room });
    broadcastRoomList();
    console.log(`👤 [Group] ${trimmedName} 참가 → ${code}`);
  });

  socket.on('start_group_interview', (data: { code: string; customQuestions?: string[] }) => {
    const room = groupRooms.get(data.code);
    if (!room || room.hostId !== socket.id || room.participants.length < 1) return;
    room.status = 'interviewing';
    room.questions = data.customQuestions?.length ? data.customQuestions : [...DEFAULT_QUESTIONS];
    // 답변 순서 셔플
    for (let i = room.participants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [room.participants[i], room.participants[j]] = [room.participants[j], room.participants[i]];
    }
    room.participants.forEach((p, i) => { p.order = i; });
    room.currentQuestionIndex = 0; room.currentAnswererIndex = 0; room.results = [];
    io.to(`group:${data.code}`).emit('group_question', {
      question: room.questions[0], questionIndex: 0, totalQuestions: room.questions.length,
      answererOrder: room.participants.map(p => ({ name: p.name, socketId: p.socketId })),
      currentAnswererId: room.participants[0].socketId,
    });
    console.log(`🚀 [Group] 시작 ${data.code} (${room.participants.length}명)`);
  });

  socket.on('group_submit_answer', async (data: { code: string; answer: string; analysis: any }) => {
    const room = groupRooms.get(data.code);
    if (!room || room.status !== 'interviewing') return;
    const answerer = room.participants[room.currentAnswererIndex];
    if (answerer?.socketId !== socket.id) return;

    const { totalFrames, lookAwayFrames } = data.analysis;
    const focusScore = totalFrames > 0 ? Math.round(((totalFrames - lookAwayFrames) / totalFrames) * 100) : 0;
    const answerLength = data.answer?.trim().length || 0;
    let good = '답변이 완료되었습니다.', bad = '더 구체적인 답변을 준비하세요.', score = answerLength >= 30 ? 70 : 50;

    if (hasOpenAIKey && answerLength > 0) {
      try { const fb = await generateFeedback(room.questions[room.currentQuestionIndex], data.answer, focusScore, 'ko-KR', false); score = fb.score; good = fb.good; bad = fb.bad; }
      catch {}
    }

    const qi = room.currentQuestionIndex;
    if (!room.results[qi]) room.results[qi] = { question: room.questions[qi], answers: [] };
    room.results[qi].answers.push({ participantId: socket.id, participantName: answerer.name, answer: data.answer, focusScore, answerScore: score, feedback: { good, bad } });

    socket.emit('group_answer_received', { focusScore, answerScore: score, feedback: { good, bad } });

    room.currentAnswererIndex++;
    if (room.currentAnswererIndex < room.participants.length) {
      // 다음 사람 차례
      io.to(`group:${data.code}`).emit('group_turn_changed', { currentAnswererId: room.participants[room.currentAnswererIndex].socketId });
    } else {
      // 이번 질문 모두 답변 완료 → 다음 질문
      room.currentAnswererIndex = 0;
      room.currentQuestionIndex++;
      if (room.currentQuestionIndex < room.questions.length) {
        // 다음 질문 순서 재셔플
        for (let i = room.participants.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [room.participants[i], room.participants[j]] = [room.participants[j], room.participants[i]];
        }
        room.participants.forEach((p, i) => { p.order = i; });
        io.to(`group:${data.code}`).emit('group_question', {
          question: room.questions[room.currentQuestionIndex],
          questionIndex: room.currentQuestionIndex, totalQuestions: room.questions.length,
          answererOrder: room.participants.map(p => ({ name: p.name, socketId: p.socketId })),
          currentAnswererId: room.participants[0].socketId,
        });
      } else {
        // 면접 종료
        room.status = 'finished';
        io.to(`group:${data.code}`).emit('group_interview_finished', { results: room.results, participants: room.participants });
        groupRooms.delete(data.code);
        console.log(`✅ [Group] 완료 ${data.code}`);
      }
    }
  });

  // ── 연결 종료 ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[Disconnected] ${socket.id}`);
    if (recognizeStream) recognizeStream.end();

    // 토론면접 방 정리
    for (const [code, room] of debateRooms) {
      const idx = room.participants.findIndex(p => p.socketId === socket.id);
      if (idx === -1) continue;
      room.participants.splice(idx, 1);
      if (room.participants.length === 0) { debateRooms.delete(code); broadcastDebateRoomList(); break; }
      if (room.hostId === socket.id) room.hostId = room.participants[0].socketId;
      if (room.status === 'debating') {
        // 현재 발언자 이탈 시 다음 사람으로
        room.roundOrder = room.roundOrder.filter(id => id !== socket.id);
        if (room.currentSpeakerIndex >= room.roundOrder.length) room.currentSpeakerIndex = 0;
        if (room.roundOrder.length > 0) io.to(`debate:${code}`).emit('debate_turn', { currentSpeakerId: room.roundOrder[room.currentSpeakerIndex], round: room.currentRound, totalRounds: room.totalRounds });
      }
      io.to(`debate:${code}`).emit('debate_room_updated', { room });
      broadcastDebateRoomList();
      break;
    }

    // 집단면접 방 정리
    for (const [code, room] of groupRooms) {
      const idx = room.participants.findIndex(p => p.socketId === socket.id);
      if (idx === -1) continue;
      room.participants.splice(idx, 1);
      if (room.participants.length === 0) {
        groupRooms.delete(code); break;
      }
      if (room.hostId === socket.id) room.hostId = room.participants[0].socketId;
      // 면접 중 현재 답변자 이탈 시 다음 사람으로 넘김
      if (room.status === 'interviewing') {
        if (room.currentAnswererIndex >= room.participants.length) room.currentAnswererIndex = 0;
        io.to(`group:${code}`).emit('group_turn_changed', { currentAnswererId: room.participants[room.currentAnswererIndex]?.socketId });
      }
      io.to(`group:${code}`).emit('group_room_updated', { room });
      broadcastRoomList();
      break;
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
