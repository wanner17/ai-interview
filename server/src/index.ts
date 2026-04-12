import dotenv from 'dotenv';
dotenv.config(); // 환경 변수(.env) 로드

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SpeechClient } from '@google-cloud/speech';
import OpenAI from 'openai';

const app = express();
const httpServer = createServer(app);

// 클라이언트(Next.js) 도메인에 대한 CORS 허용
const io = new Server(httpServer, {
  cors: {
    origin: '*', // 내부망 어디서든 iframe으로 접근할 수 있도록 모든 출처 허용
    methods: ['GET', 'POST'],
  },
});

// GCP STT 클라이언트 초기화 시도
let speechClient: SpeechClient | null = null;
try {
  speechClient = new SpeechClient();
} catch (error) {
  console.log('⚠️ GCP STT 인증 정보가 없어 Mock 모드로 동작합니다.');
}

// OpenAI API 클라이언트 초기화 시도
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

io.on('connection', (socket) => {
  console.log(`[Socket Connected] Client ID: ${socket.id}`);
  let recognizeStream: any = null;
  
  // 면접 시나리오 질문 리스트
  const INTERVIEW_QUESTIONS = [
    "1. 1분 자기소개를 부탁드립니다.",
    "2. 우리 회사에 지원하게 된 동기는 무엇인가요?",
    "3. 본인의 가장 큰 장점과 단점은 무엇인지 경험을 들어 설명해주세요.",
    "4. 마지막으로 하고 싶은 질문이나 말이 있다면 자유롭게 해주세요."
  ];
  let currentQuestionIndex = 0;

  // 지원자 면접 결과 데이터 저장소 (DB 연동 전 메모리 저장)
  const interviewResults: any[] = [];

  // STT 스트림 시작
  socket.on('start_audio_stream', () => {
    console.log(`🎙️ [STT Stream Started] Client ID: ${socket.id}`);

    if (speechClient) {
      const request = {
        config: {
          encoding: 'WEBM_OPUS' as const, // 브라우저 MediaRecorder 기본 포맷
          sampleRateHertz: 48000,
          languageCode: 'ko-KR',
        },
        interimResults: true, // 실시간 중간 변환 결과 활성화
      };

      recognizeStream = speechClient
        .streamingRecognize(request)
        .on('error', (err) => {
          console.error(`⚠️ [STT Error] ${err.message || err}`);
          if (recognizeStream) recognizeStream.destroy();
          recognizeStream = null; // 에러 발생 시 스트림 해제 (Mock 모드로 전환됨)
        })
        .on('data', (data) => {
          const result = data.results[0];
          if (result && result.alternatives[0]) {
            socket.emit('stt_result', {
              transcript: result.alternatives[0].transcript,
              isFinal: result.isFinal,
            });
          }
        });
    }
  });

  socket.on('audio_chunk', (chunk) => {
    console.log(`🎤 [Audio Chunk Received] Size: ${chunk.length} bytes from ${socket.id}`);
    if (recognizeStream && !recognizeStream.destroyed) {
      recognizeStream.write(chunk);
    } else {
      // GCP 키가 없을 때 동작하는 가짜 자막 응답 (Mock)
      socket.emit('stt_result', {
        transcript: `(STT 연결 대기 중...) 전달된 음성 크기: ${chunk.length} bytes`,
        isFinal: false
      });
    }
  });

  // 면접 시나리오 제어
  socket.on('start_interview', () => {
    currentQuestionIndex = 0;
    console.log(`📋 [Interview Started] Client ID: ${socket.id}`);
    socket.emit('next_question', { question: INTERVIEW_QUESTIONS[currentQuestionIndex], isEnd: false });
  });

  socket.on('request_next_question', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < INTERVIEW_QUESTIONS.length) {
      socket.emit('next_question', { question: INTERVIEW_QUESTIONS[currentQuestionIndex], isEnd: false });
    } else {
      socket.emit('next_question', { question: "면접이 모두 종료되었습니다. 수고하셨습니다!", isEnd: true });
      // 면접 종료 시 수집된 전체 분석 데이터를 클라이언트로 전송
      socket.emit('interview_finished', interviewResults);
    }
  });

  // 클라이언트로부터 답변 및 분석 데이터 수신
  socket.on('submit_answer', async (data) => {
    console.log(`\n📥 [Answer Submitted] Client ID: ${socket.id}`);
    console.log(`- Question: ${data.question}`);
    console.log(`- Answer: ${data.answer}`);
    
    const { totalFrames, lookAwayFrames, mouthOpenFrames } = data.analysis;
    const focusScore = totalFrames > 0 
      ? Math.round(((totalFrames - lookAwayFrames) / totalFrames) * 100) 
      : 0;
      
    console.log(`- Focus Score (시선 집중도): ${focusScore}%`);
    console.log(`- Speaking Frames (발화량): ${mouthOpenFrames} / ${totalFrames}`);

    // 규칙 기반 모의 AI 피드백 생성
    const answerLength = data.answer.trim().length;
    let goodFeedback = "답변이 완료되었으나 특별히 돋보이는 강점은 없습니다.";
    let badFeedback = "태도와 답변 내용 모두 전반적인 개선이 시급합니다.";
    let answerScore = 0; // AI가 평가한 답변 점수

    // OpenAI API를 통해 답변 문맥 및 태도 분석
    if (hasOpenAIKey && answerLength > 0) {
      try {
        console.log('🤖 OpenAI(ChatGPT)로 피드백을 생성하는 중...');
        const prompt = `
          당신은 매우 엄격하고 냉철한 대기업 수석 면접관입니다. 지원자의 답변 내용과 태도(시선 집중도)를 분석하여 날카롭고 객관적인 팩트 폭행 피드백을 제공하세요.
          지원자의 문제점을 가감 없이 지적하고, 칭찬할 점이 부족하다면 억지로 칭찬하지 말고 건조하게 평가하세요.
          반드시 JSON 형식으로 응답하세요: {"score": 정수(0~100, 답변의 논리와 직무 적합성을 매우 엄격하게 평가), "good": "객관적인 긍정적 평가 1줄", "bad": "냉정하고 날카로운 개선점 1줄"}

          [면접 데이터]
          - 질문: ${data.question}
          - 지원자 답변: ${data.answer}
          - 시선 집중도: ${focusScore}%
        `;

        const completion = await openai.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-3.5-turbo',
          response_format: { type: 'json_object' } // JSON 응답 강제
        });

        const aiResponse = JSON.parse(completion.choices[0].message?.content || '{}');
        if (typeof aiResponse.score === 'number') answerScore = aiResponse.score;
        if (aiResponse.good) goodFeedback = aiResponse.good;
        if (aiResponse.bad) badFeedback = aiResponse.bad;
      } catch (error) {
        console.error('⚠️ [OpenAI Error] 피드백 생성 실패:', error);
      }
    } else {
      // 키가 없거나 답변이 비어있을 경우 기존의 가짜 규칙 기반으로 Fallback 처리
      if (focusScore >= 80) goodFeedback = "시선 처리는 무난한 수준이나, 이것이 합격을 보장하진 않습니다.";
      else if (answerLength >= 30) goodFeedback = "기본적인 분량은 채웠으나 내용의 깊이는 더 검증이 필요합니다.";
      if (focusScore < 60) badFeedback = "시선이 심각하게 분산되어 산만하고 자신감이 없어 보입니다. 면접에 집중하십시오.";
      else if (answerLength < 15) badFeedback = "답변이 지나치게 짧아 성의가 전혀 안 느껴집니다. 실전에서 이렇게 대답하면 무조건 탈락입니다.";
      answerScore = answerLength >= 30 ? 70 : (answerLength >= 15 ? 50 : 20); // 가짜 점수 부여
    }

    interviewResults.push({
      question: data.question,
      answer: data.answer,
      focusScore,
      answerScore,
      analysis: data.analysis,
      feedback: {
        good: goodFeedback,
        bad: badFeedback
      }
    });
  });

  // STT 스트림 종료
  socket.on('stop_audio_stream', () => {
    console.log(`🛑 [STT Stream Stopped] Client ID: ${socket.id}`);
    if (recognizeStream) {
      recognizeStream.end();
      recognizeStream = null;
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] Client ID: ${socket.id}`);
    if (recognizeStream) {
      recognizeStream.end();
    }
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});