'use client';

import { useEffect, useState, useRef } from 'react';
import { socket } from './socket';
import type { Results } from '@mediapipe/face_mesh';

const API_BASE = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState('N/A');

  // 미디어 제어용 상태
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // 이력서 업로드 관련 상태
  const [resumeStepDone, setResumeStepDone] = useState<boolean>(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<string[] | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // 면접 유형 선택 상태
  const [interviewType, setInterviewType] = useState<string | null>(null);
  const [foreignLanguage, setForeignLanguage] = useState<string>('en-US');
  const [interviewTypeStepDone, setInterviewTypeStepDone] = useState<boolean>(false);

  // 꼬리 질문 여부
  const [isCurrentFollowup, setIsCurrentFollowup] = useState<boolean>(false);

  // 집단면접 상태
  const [mySocketId, setMySocketId] = useState<string>('');
  const [groupMyName, setGroupMyName] = useState<string>('');
  const [groupJoinCode, setGroupJoinCode] = useState<string>('');
  const [groupJoinPassword, setGroupJoinPassword] = useState<string>('');
  const [groupRoomCode, setGroupRoomCode] = useState<string>('');
  const [groupParticipants, setGroupParticipants] = useState<any[]>([]);
  const [isGroupHost, setIsGroupHost] = useState<boolean>(false);
  const [groupSetupStep, setGroupSetupStep] = useState<'setup' | 'waiting' | 'interviewing'>('setup');
  const [groupSetupTab, setGroupSetupTab] = useState<'list' | 'private' | 'create'>('list');
  const [groupCurrentQuestion, setGroupCurrentQuestion] = useState<string>('');
  const [groupCurrentAnswererId, setGroupCurrentAnswererId] = useState<string>('');
  const [groupAnswererOrder, setGroupAnswererOrder] = useState<any[]>([]);
  const [groupQuestionIndex, setGroupQuestionIndex] = useState<number>(0);
  const [groupTotalQuestions, setGroupTotalQuestions] = useState<number>(0);
  const [groupResults, setGroupResults] = useState<any>(null);
  const [groupRoomError, setGroupRoomError] = useState<string | null>(null);
  const [groupAnswerFeedback, setGroupAnswerFeedback] = useState<any>(null);
  // 방 목록 및 방 생성 옵션
  const [roomList, setRoomList] = useState<Array<{ code: string; roomName: string; participantCount: number }>>([]);
  const [groupRoomName, setGroupRoomName] = useState<string>('');
  const [groupIsPrivate, setGroupIsPrivate] = useState<boolean>(false);
  const [groupRoomPassword, setGroupRoomPassword] = useState<string>('');

  // PT 면접 상태
  const [ptPhase, setPtPhase] = useState<'setup' | 'prep' | 'presenting' | 'qa' | null>(null);
  const [ptCategory, setPtCategory] = useState<string>('business');
  const [ptCustomTopic, setPtCustomTopic] = useState<string>('');
  const [ptUseCustom, setPtUseCustom] = useState<boolean>(false);
  const [ptTopic, setPtTopic] = useState<string>('');
  const [ptOutline, setPtOutline] = useState<string[]>([]);
  const [ptIsGenerating, setPtIsGenerating] = useState<boolean>(false);
  const [ptTopicError, setPtTopicError] = useState<string | null>(null);
  const [ptPrepTimeLeft, setPtPrepTimeLeft] = useState<number>(300);
  const [ptPresentTimeLeft, setPtPresentTimeLeft] = useState<number>(300);
  const [ptSlides, setPtSlides] = useState<string[]>([]);
  const [ptCurrentSlide, setPtCurrentSlide] = useState<number>(0);
  const [ptSlidesLoading, setPtSlidesLoading] = useState<boolean>(false);
  const [ptPresentationFeedback, setPtPresentationFeedback] = useState<any>(null);
  const [ptQAQuestion, setPtQAQuestion] = useState<string>('');
  const [ptQAIndex, setPtQAIndex] = useState<number>(0);
  const [ptTotalQA, setPtTotalQA] = useState<number>(0);
  const [ptQAFeedback, setPtQAFeedback] = useState<any>(null);
  const [ptResults, setPtResults] = useState<any[] | null>(null);
  const ptTranscriptRef = useRef<string>('');

  // 토론면접 상태
  const [debateSetupStep, setDebateSetupStep] = useState<'setup' | 'waiting' | 'debating'>('setup');
  const [debateSetupTab, setDebateSetupTab] = useState<'list' | 'private' | 'create'>('list');
  const [debateMyName, setDebateMyName] = useState<string>('');
  const [debateRoomCode, setDebateRoomCode] = useState<string>('');
  const [debateJoinCode, setDebateJoinCode] = useState<string>('');
  const [debateJoinPassword, setDebateJoinPassword] = useState<string>('');
  const [debateParticipants, setDebateParticipants] = useState<any[]>([]);
  const [debateIsHost, setDebateIsHost] = useState<boolean>(false);
  const [debateRoomList, setDebateRoomList] = useState<any[]>([]);
  const [debateRoomError, setDebateRoomError] = useState<string | null>(null);
  const [debateRoomName, setDebateRoomName] = useState<string>('');
  const [debateType, setDebateType] = useState<'pro-con' | 'free'>('pro-con');
  const [debateTopic, setDebateTopic] = useState<string>('');
  const [debateTopicDesc, setDebateTopicDesc] = useState<string>('');
  const [debateProLabel, setDebateProLabel] = useState<string>('');
  const [debateConLabel, setDebateConLabel] = useState<string>('');
  const [debateCategory, setDebateCategory] = useState<string>('social');
  const [debateCustomTopic, setDebateCustomTopic] = useState<string>('');
  const [debateUseCustom, setDebateUseCustom] = useState<boolean>(false);
  const [debateTotalRounds, setDebateTotalRounds] = useState<number>(3);
  const [debateIsPrivate, setDebateIsPrivate] = useState<boolean>(false);
  const [debateRoomPassword, setDebateRoomPassword] = useState<string>('');
  const [debateIsGenerating, setDebateIsGenerating] = useState<boolean>(false);
  const [debateTopicError, setDebateTopicError] = useState<string | null>(null);
  // 토론 진행 상태
  const [debateCurrentRound, setDebateCurrentRound] = useState<number>(0);
  const [debateTotalRoundsState, setDebateTotalRoundsState] = useState<number>(3);
  const [debateCurrentSpeakerId, setDebateCurrentSpeakerId] = useState<string>('');
  const [debateRoundOrder, setDebateRoundOrder] = useState<any[]>([]);
  const [debateMySide, setDebateMySide] = useState<string>('neutral');
  const [debateSpeechTimeLeft, setDebateSpeechTimeLeft] = useState<number>(90);
  const [debateSpeechFeedback, setDebateSpeechFeedback] = useState<any>(null);
  const [debateRoundSummary, setDebateRoundSummary] = useState<string>('');
  const [debateShowSummary, setDebateShowSummary] = useState<boolean>(false);
  const [debateResults, setDebateResults] = useState<any>(null);

  // AI 안면 분석 상태
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(false);
  const [isFaceCentered, setIsFaceCentered] = useState<boolean>(false);
  const [isMouthOpen, setIsMouthOpen] = useState<boolean>(false);
  const [isLookingAway, setIsLookingAway] = useState<boolean>(false);
  const [sttText, setSttText] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [isInterviewFinished, setIsInterviewFinished] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any[] | null>(null);

  // 분석 데이터 취합용 Ref
  const analysisDataRef = useRef({
    totalFrames: 0,
    lookAwayFrames: 0,
    mouthOpenFrames: 0,
  });
  const finalizedTextRef = useRef<string>(''); // 확정된 이전 문장들 누적 보관용
  const reportRef = useRef<HTMLDivElement>(null); // 리포트 캡처용 Ref

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setMySocketId(socket.id ?? '');
      setTransport(socket.io.engine.transport.name);
      socket.emit('get_room_list');
      socket.emit('get_debate_room_list');

      socket.io.engine.on('upgrade', (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport('N/A');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('stt_result', (data: { transcript: string; isFinal: boolean }) => {
      if (data.isFinal) {
        finalizedTextRef.current += data.transcript + ' ';
        setSttText(finalizedTextRef.current);
      } else {
        setSttText(finalizedTextRef.current + data.transcript);
      }
    });
    socket.on('next_question', (data: { question: string; isEnd: boolean; isFollowup?: boolean }) => {
      setCurrentQuestion(data.question);
      setIsInterviewFinished(data.isEnd);
      setIsCurrentFollowup(data.isFollowup || false);
    });
    socket.on('interview_finished', (results: any[]) => {
      setReportData(results);
    });

    // 집단면접 이벤트
    socket.on('group_room_created', (data: any) => {
      setGroupRoomCode(data.code);
      setGroupParticipants(data.room.participants);
      setIsGroupHost(true);
      setGroupSetupStep('waiting');
    });
    socket.on('group_room_joined', (data: any) => {
      setGroupRoomCode(data.code);
      setGroupParticipants(data.room.participants);
      setIsGroupHost(false);
      setGroupSetupStep('waiting');
    });
    socket.on('group_room_updated', (data: any) => {
      setGroupParticipants(data.room.participants);
    });
    socket.on('group_room_error', (data: any) => {
      setGroupRoomError(data.error);
    });
    socket.on('room_list_updated', (list: any[]) => {
      setRoomList(list);
    });
    socket.on('group_question', (data: any) => {
      setGroupCurrentQuestion(data.question);
      setGroupCurrentAnswererId(data.currentAnswererId);
      setGroupAnswererOrder(data.answererOrder);
      setGroupQuestionIndex(data.questionIndex);
      setGroupTotalQuestions(data.totalQuestions);
      setGroupSetupStep('interviewing');
      setSttText('');
      finalizedTextRef.current = '';
      analysisDataRef.current = { totalFrames: 0, lookAwayFrames: 0, mouthOpenFrames: 0 };
      setGroupAnswerFeedback(null);
    });
    socket.on('group_turn_changed', (data: any) => {
      setGroupCurrentAnswererId(data.currentAnswererId);
      setSttText('');
      finalizedTextRef.current = '';
      analysisDataRef.current = { totalFrames: 0, lookAwayFrames: 0, mouthOpenFrames: 0 };
    });
    socket.on('group_answer_received', (data: any) => {
      setGroupAnswerFeedback(data);
      if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        socket.emit('stop_audio_stream');
      }
    });
    socket.on('group_interview_finished', (data: any) => {
      setGroupResults(data);
    });

    // PT 면접 이벤트
    socket.on('pt_presentation_feedback', (data: any) => {
      setPtPresentationFeedback(data);
      setPtQAQuestion(data.qaQuestion);
      setPtQAIndex(data.qaIndex);
      setPtTotalQA(data.totalQA);
      setPtQAFeedback(null);
      setPtPhase('qa');
      setSttText('');
      finalizedTextRef.current = '';
      analysisDataRef.current = { totalFrames: 0, lookAwayFrames: 0, mouthOpenFrames: 0 };
    });
    socket.on('pt_qa_feedback', (data: any) => {
      setPtQAFeedback(data);
    });
    socket.on('pt_next_qa', (data: any) => {
      setPtQAQuestion(data.question);
      setPtQAIndex(data.qaIndex);
      setPtQAFeedback(null);
      setSttText('');
      finalizedTextRef.current = '';
      analysisDataRef.current = { totalFrames: 0, lookAwayFrames: 0, mouthOpenFrames: 0 };
    });
    socket.on('pt_finished', (results: any[]) => {
      setPtResults(results);
    });

    // 토론면접 이벤트
    socket.on('debate_room_list_updated', (list: any[]) => setDebateRoomList(list));
    socket.on('debate_room_created', (data: any) => {
      setDebateRoomCode(data.code);
      setDebateParticipants(data.room.participants);
      setDebateIsHost(true);
      setDebateSetupStep('waiting');
    });
    socket.on('debate_room_joined', (data: any) => {
      setDebateRoomCode(data.code);
      setDebateParticipants(data.room.participants);
      setDebateTopic(data.room.topic);
      setDebateTopicDesc(data.room.topicDescription);
      setDebateProLabel(data.room.proLabel);
      setDebateConLabel(data.room.conLabel);
      setDebateType(data.room.debateType);
      setDebateTotalRoundsState(data.room.totalRounds);
      setDebateIsHost(false);
      setDebateSetupStep('waiting');
    });
    socket.on('debate_room_updated', (data: any) => setDebateParticipants(data.room.participants));
    socket.on('debate_room_error', (data: any) => setDebateRoomError(data.error));
    socket.on('debate_started', (data: any) => {
      setDebateParticipants(data.room.participants);
      setDebateCurrentSpeakerId(data.currentSpeakerId);
      setDebateRoundOrder(data.room.participants);
      setDebateCurrentRound(data.round);
      setDebateTotalRoundsState(data.totalRounds);
      const me = data.room.participants.find((p: any) => p.socketId === socket.id);
      setDebateMySide(me?.side || 'neutral');
      setDebateSetupStep('debating');
      setDebateSpeechFeedback(null);
      setDebateShowSummary(false);
      setDebateRoundSummary('');
      setSttText(''); finalizedTextRef.current = '';
      analysisDataRef.current = { totalFrames: 0, lookAwayFrames: 0, mouthOpenFrames: 0 };
    });
    socket.on('debate_turn', (data: any) => {
      setDebateCurrentSpeakerId(data.currentSpeakerId);
      setDebateCurrentRound(data.round);
      setDebateSpeechFeedback(null);
      setDebateShowSummary(false);
      setSttText(''); finalizedTextRef.current = '';
      analysisDataRef.current = { totalFrames: 0, lookAwayFrames: 0, mouthOpenFrames: 0 };
    });
    socket.on('debate_speech_feedback', (data: any) => {
      setDebateSpeechFeedback(data);
      if (isRecording && mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); socket.emit('stop_audio_stream'); }
    });
    socket.on('debate_round_summary', (data: any) => {
      setDebateRoundSummary(data.summary);
      setDebateShowSummary(true);
    });
    socket.on('debate_finished', (data: any) => setDebateResults(data));

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('stt_result');
      socket.off('next_question');
      socket.off('interview_finished');
      socket.off('group_room_created');
      socket.off('group_room_joined');
      socket.off('group_room_updated');
      socket.off('group_room_error');
      socket.off('room_list_updated');
      socket.off('group_question');
      socket.off('group_turn_changed');
      socket.off('group_answer_received');
      socket.off('group_interview_finished');
      socket.off('pt_presentation_feedback');
      socket.off('pt_qa_feedback');
      socket.off('pt_next_qa');
      socket.off('pt_finished');
      socket.off('debate_room_list_updated');
      socket.off('debate_room_created');
      socket.off('debate_room_joined');
      socket.off('debate_room_updated');
      socket.off('debate_room_error');
      socket.off('debate_started');
      socket.off('debate_turn');
      socket.off('debate_speech_feedback');
      socket.off('debate_round_summary');
      socket.off('debate_finished');
      socket.disconnect();

      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // 결과 리포트가 생성되면 부모 프로젝트(iframe 외부)로 데이터 전송
  useEffect(() => {
    if (reportData) {
      window.parent.postMessage({
        type: 'AI_INTERVIEW_COMPLETED',
        payload: reportData
      }, '*'); // 실서비스 적용 시 '*' 대신 'https://부모프로젝트.com' 등 명시적 도메인 사용 권장
    }
  }, [reportData]);

  useEffect(() => {
    if (hasMediaPermission && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [hasMediaPermission, mediaStream, resumeStepDone, interviewTypeStepDone, groupSetupStep, ptPhase, debateSetupStep]);

  // MediaPipe Face Mesh 실시간 처리
  useEffect(() => {
    const isVideoPhase = (interviewType !== 'group' || groupSetupStep === 'interviewing') &&
                         (interviewType !== 'pt' || ptPhase === 'presenting' || ptPhase === 'qa') &&
                         (interviewType !== 'discussion' || debateSetupStep === 'debating');
    if (!hasMediaPermission || !resumeStepDone || !interviewTypeStepDone || !isVideoPhase || !videoRef.current) return;

    const faceMeshModule = require('@mediapipe/face_mesh');
    const FaceMesh = faceMeshModule.FaceMesh || (window as any).FaceMesh;

    const faceMesh = new FaceMesh({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results: Results) => {
      if (!videoRef.current || !canvasRef.current) return;

      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (videoWidth === 0 || videoHeight === 0 || !ctx) return;

      if (canvas.width !== videoWidth) canvas.width = videoWidth;
      if (canvas.height !== videoHeight) canvas.height = videoHeight;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        setIsFaceDetected(true);
        const landmarks = results.multiFaceLandmarks[0];

        const nose = landmarks[1];
        const isCentered = nose.x > 0.3 && nose.x < 0.7 && nose.y > 0.2 && nose.y < 0.8;
        setIsFaceCentered(isCentered);

        const upperLip = landmarks[13];
        const lowerLip = landmarks[14];
        const faceTop = landmarks[10];
        const faceBottom = landmarks[152];
        const mouthDistance = Math.abs(lowerLip.y - upperLip.y);
        const faceHeight = Math.abs(faceBottom.y - faceTop.y);
        const isSpeaking = (mouthDistance / faceHeight) > 0.03;
        setIsMouthOpen(isSpeaking);

        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const headTurnRatio = Math.abs(nose.x - leftEye.x) / Math.abs(nose.x - rightEye.x);
        const lookingAway = headTurnRatio < 0.5 || headTurnRatio > 2.0 || !isCentered;
        setIsLookingAway(lookingAway);

        analysisDataRef.current.totalFrames += 1;
        if (lookingAway) analysisDataRef.current.lookAwayFrames += 1;
        if (isSpeaking) analysisDataRef.current.mouthOpenFrames += 1;
      } else {
        setIsFaceDetected(false);
        setIsFaceCentered(false);
        setIsMouthOpen(false);
        setIsLookingAway(true);
      }
      ctx.restore();
    });

    let animationFrameId: number;
    let isProcessing = false;

    const processVideo = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && !isProcessing) {
        isProcessing = true;
        await faceMesh.send({ image: videoRef.current });
        isProcessing = false;
      }
      animationFrameId = requestAnimationFrame(processVideo);
    };
    processVideo();

    return () => {
      cancelAnimationFrame(animationFrameId);
      faceMesh.close();
    };
  }, [hasMediaPermission, resumeStepDone, interviewTypeStepDone, groupSetupStep, interviewType, ptPhase, debateSetupStep]);

  // ── PT 준비 타이머 ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (ptPhase !== 'prep') return;
    const id = setInterval(() => setPtPrepTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [ptPhase]);

  // ── PT 발표 타이머 ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (ptPhase !== 'presenting') return;
    setPtPresentTimeLeft(300);
    const id = setInterval(() => {
      setPtPresentTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          // 시간 초과 자동 제출
          if (isRecording && mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            socket.emit('stop_audio_stream');
          }
          socket.emit('pt_submit_presentation', { topic: ptTopic, transcript: ptTranscriptRef.current, analysis: analysisDataRef.current });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [ptPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PDF 슬라이드 로더 ────────────────────────────────────────────────────────
  const loadPdfSlides = async (file: File) => {
    setPtSlidesLoading(true);
    setPtSlides([]);
    try {
      const win = window as any;
      if (!win.pdfjsLib) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('PDF.js 로드 실패'));
          document.head.appendChild(s);
        });
      }
      const lib = win.pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const ab = await file.arrayBuffer();
      const pdf = await lib.getDocument({ data: ab }).promise;
      const pages: string[] = [];
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
        pages.push(canvas.toDataURL('image/jpeg', 0.85));
      }
      setPtSlides(pages);
      setPtCurrentSlide(0);
    } catch (err) {
      console.error('[PT] PDF 로드 실패:', err);
    } finally {
      setPtSlidesLoading(false);
    }
  };

  // ── PT 주제 생성 ─────────────────────────────────────────────────────────────
  const handleGeneratePtTopic = async () => {
    setPtIsGenerating(true);
    setPtTopicError(null);
    try {
      const body = ptUseCustom ? { category: ptCategory, customTopic: ptCustomTopic } : { category: ptCategory };
      const res = await fetch(`${API_BASE}/api/pt-generate-topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || '주제 생성 실패');
      const data = await res.json();
      setPtTopic(data.topic);
      setPtOutline(data.outline || []);
      setPtPhase('prep');
      setPtPrepTimeLeft(300);
    } catch (err: any) {
      setPtTopicError(err.message || '오류가 발생했습니다.');
    } finally {
      setPtIsGenerating(false);
    }
  };

  // ── 토론 발언 타이머 ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (debateSetupStep !== 'debating' || debateSpeechFeedback || debateShowSummary) return;
    setDebateSpeechTimeLeft(90);
    const id = setInterval(() => {
      setDebateSpeechTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          if (debateCurrentSpeakerId === mySocketId) {
            if (isRecording && mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); socket.emit('stop_audio_stream'); }
            socket.emit('debate_submit_speech', { code: debateRoomCode, speech: sttText, analysis: analysisDataRef.current });
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [debateCurrentSpeakerId, debateSetupStep, debateShowSummary]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 토론 주제 생성 ───────────────────────────────────────────────────────────
  const handleGenerateDebateTopic = async () => {
    setDebateIsGenerating(true);
    setDebateTopicError(null);
    try {
      const body = { category: debateCategory, debateType, ...(debateUseCustom && debateCustomTopic.trim() ? { customTopic: debateCustomTopic } : {}) };
      const res = await fetch(`${API_BASE}/api/debate-topic`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || '주제 생성 실패');
      const data = await res.json();
      setDebateTopic(data.topic);
      setDebateTopicDesc(data.description);
      setDebateProLabel(data.proLabel);
      setDebateConLabel(data.conLabel);
    } catch (err: any) {
      setDebateTopicError(err.message || '오류가 발생했습니다.');
    } finally {
      setDebateIsGenerating(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowed.includes(file.type)) {
      setResumeError('PDF, DOCX, TXT 파일만 업로드 가능합니다.');
      return;
    }
    setResumeFile(file);
    setResumeError(null);
    setIsGeneratingQuestions(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch(`${API_BASE}/api/generate-questions`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '질문 생성에 실패했습니다.');
      }

      const data = await res.json();
      setGeneratedQuestions(data.questions);
    } catch (err: any) {
      setResumeError(err.message || '오류가 발생했습니다. 이력서 없이 진행해주세요.');
      setGeneratedQuestions(null);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleResumeUpload(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleResumeUpload(file);
  };

  const requestMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setMediaStream(stream);
      setHasMediaPermission(true);
      setMediaError(null);
    } catch (err: any) {
      console.error('Media permission error:', err);
      if (err.name === 'NotAllowedError') {
        setMediaError('카메라 및 마이크 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요.');
      } else if (err.name === 'NotFoundError') {
        setMediaError('연결된 카메라나 마이크를 찾을 수 없습니다.');
      } else {
        setMediaError(`미디어 장치에 접근할 수 없습니다: ${err.message}`);
      }
      setHasMediaPermission(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      socket.emit('stop_audio_stream');
    } else if (mediaStream) {
      const audioStream = new MediaStream(mediaStream.getAudioTracks());
      const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket.connected) {
          socket.emit('audio_chunk', event.data);
        }
      };

      setSttText('');
      finalizedTextRef.current = '';
      socket.emit('start_audio_stream');
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Tailwind v4 compiles colors to oklch/oklab/lab/color-mix which html2canvas
      // cannot parse. Pre-normalise every colour in the capture area to rgb() by
      // running each value through a 1×1 offscreen canvas (browser does the conversion).
      const offscreen = document.createElement('canvas');
      offscreen.width = offscreen.height = 1;
      const offCtx = offscreen.getContext('2d')!;

      const toRgba = (raw: string): string | null => {
        try {
          offCtx.clearRect(0, 0, 1, 1);
          offCtx.fillStyle = '#000';
          offCtx.fillStyle = raw; // browser parses any CSS colour here
          offCtx.fillRect(0, 0, 1, 1);
          const [r, g, b, a] = offCtx.getImageData(0, 0, 1, 1).data;
          if (a === 0) return 'transparent';
          return a === 255
            ? `rgb(${r},${g},${b})`
            : `rgba(${r},${g},${b},${+(a / 255).toFixed(3)})`;
        } catch { return null; }
      };

      // Matches lab(), oklab(), lch(), oklch(), and color-mix() in complex values
      const MODERN_RE = /(?:ok)?lab\([^)]*\)|(?:ok)?lch\([^)]*\)|color-mix\([^,]+,[^)]+\)/gi;
      const normaliseComplex = (val: string) =>
        val.replace(MODERN_RE, (m) => toRgba(m) ?? 'rgba(0,0,0,0.1)');

      const SIMPLE_PROPS = [
        'color', 'background-color',
        'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
        'outline-color',
      ];
      const COMPLEX_PROPS = ['box-shadow', 'text-shadow'];

      const target = reportRef.current;
      const nodes = [target, ...Array.from(target.querySelectorAll<HTMLElement>('*'))];
      const restores: Array<() => void> = [];

      const patch = (el: HTMLElement, prop: string, value: string) => {
        const prev = el.style.getPropertyValue(prop);
        const prevPri = el.style.getPropertyPriority(prop);
        el.style.setProperty(prop, value, 'important');
        restores.push(() => {
          el.style.removeProperty(prop);
          if (prev) el.style.setProperty(prop, prev, prevPri);
        });
      };

      nodes.forEach((el) => {
        const cs = window.getComputedStyle(el);

        SIMPLE_PROPS.forEach((prop) => {
          const val = cs.getPropertyValue(prop).trim();
          if (!val || val.startsWith('rgb')) return;
          const rgb = toRgba(val);
          if (rgb) patch(el, prop, rgb);
        });

        COMPLEX_PROPS.forEach((prop) => {
          const val = cs.getPropertyValue(prop).trim();
          MODERN_RE.lastIndex = 0;
          if (!val || val === 'none' || !MODERN_RE.test(val)) return;
          MODERN_RE.lastIndex = 0;
          patch(el, prop, normaliseComplex(val));
        });
      });

      const canvas = await html2canvas(target, { scale: 2, useCORS: true });
      restores.forEach((fn) => fn());

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('AI_Interview_Report.pdf');
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 다운로드 중 오류가 발생했습니다.');
    }
  };

  // ─── 집단면접 결과 화면 ──────────────────────────────────────────────────────
  if (groupResults) {
    const { results, participants } = groupResults;
    const rankMap: Record<string, number> = {};
    participants?.forEach((p: any) => {
      let total = 0, count = 0;
      results?.forEach((q: any) => {
        const ans = q.answers?.find((a: any) => a.participantId === p.socketId);
        if (ans) { total += ans.answerScore || 0; count++; }
      });
      rankMap[p.socketId] = count > 0 ? Math.round(total / count) : 0;
    });
    const ranked = [...(participants || [])].sort((a: any, b: any) => (rankMap[b.socketId] || 0) - (rankMap[a.socketId] || 0));

    return (
      <div className="min-h-screen bg-[#F0F4FF] dark:bg-[#0A0A0F] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#6366F1] rounded-3xl px-8 py-12 text-white text-center">
            <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-2">Group Interview</p>
            <h1 className="text-3xl font-black mb-1">집단면접 종합 결과</h1>
            <p className="text-blue-200 text-sm">방 코드: {groupRoomCode} · 참가자 {ranked.length}명</p>
          </div>

          {/* 종합 순위 */}
          <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-lg font-black text-zinc-800 dark:text-white">🏆 종합 순위</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {ranked.map((p: any, idx: number) => {
                const avg = rankMap[p.socketId] || 0;
                const isMe = p.socketId === mySocketId;
                const medal = ['🥇', '🥈', '🥉'][idx] || `${idx + 1}위`;
                const barColor = avg >= 80 ? 'bg-emerald-500' : avg >= 60 ? 'bg-blue-500' : 'bg-amber-500';
                return (
                  <div key={p.socketId} className={`px-8 py-5 flex items-center gap-4 ${isMe ? 'bg-blue-50 dark:bg-blue-500/10' : ''}`}>
                    <span className="text-2xl w-8 text-center flex-shrink-0">{medal}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                        {p.name} {isMe && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">나</span>}
                      </p>
                      <div className="mt-1.5 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${avg}%` }} />
                      </div>
                    </div>
                    <span className="font-black text-2xl text-zinc-800 dark:text-white flex-shrink-0">{avg}<span className="text-sm font-normal text-zinc-400">점</span></span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 질문별 비교 */}
          {results?.map((q: any, qi: number) => (
            <div key={qi} className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
              <div className="px-8 py-5 border-b border-gray-100 dark:border-white/5 flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-black">Q{qi + 1}</span>
                <p className="font-bold text-zinc-800 dark:text-white leading-snug">{q.question?.replace(/^\d+\.\s*/, '')}</p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {q.answers?.map((ans: any, ai: number) => {
                  const isMe = ans.participantId === mySocketId;
                  return (
                    <div key={ai} className={`px-8 py-6 space-y-3 ${isMe ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold text-sm text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                          {ans.participantName} {isMe && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">나</span>}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-zinc-400">👀 {ans.focusScore}%</span>
                          <span className="font-black text-blue-600 dark:text-blue-400">{ans.answerScore}점</span>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 leading-relaxed">
                        {ans.answer || '(답변 없음)'}
                      </p>
                      {ans.feedback && (
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                            ✅ {ans.feedback.good}
                          </span>
                          <span className="text-xs px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-500/20">
                            ⚡ {ans.feedback.bad}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <button onClick={() => window.location.reload()} className="w-full flex items-center justify-center gap-2.5 px-8 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold border border-gray-200 dark:border-zinc-700 shadow-md hover:-translate-y-0.5 transition-all">
            🔄 새로운 면접 시작하기
          </button>
        </div>
      </div>
    );
  }

  // ─── 토론면접 결과 화면 ─────────────────────────────────────────────────────
  if (debateResults) {
    const { topic, participants, speeches, evaluations } = debateResults;
    const ranked = [...(participants || [])].sort((a: any, b: any) => {
      const eA = evaluations?.find((e: any) => e.participantId === a.socketId)?.avgScore || 0;
      const eB = evaluations?.find((e: any) => e.participantId === b.socketId)?.avgScore || 0;
      return eB - eA;
    });
    return (
      <div className="min-h-screen bg-[#F0F4FF] dark:bg-[#0A0A0F] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4338CA] rounded-3xl px-8 py-12 text-white text-center">
            <p className="text-violet-200 text-sm font-semibold tracking-widest uppercase mb-2">Discussion Interview</p>
            <h1 className="text-3xl font-black mb-2">토론면접 종합 결과</h1>
            <p className="text-violet-200 text-sm max-w-xl mx-auto leading-relaxed">{topic}</p>
          </div>

          {/* 순위 */}
          <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-lg font-black text-zinc-800 dark:text-white">🏆 종합 순위</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {ranked.map((p: any, idx: number) => {
                const ev = evaluations?.find((e: any) => e.participantId === p.socketId);
                const score = ev?.avgScore || 0;
                const isMe = p.socketId === mySocketId;
                const medal = ['🥇', '🥈', '🥉'][idx] || `${idx + 1}위`;
                const sideLabel = p.side === 'pro' ? '찬성' : p.side === 'con' ? '반대' : '자유';
                const sideColor = p.side === 'pro' ? 'bg-blue-500' : p.side === 'con' ? 'bg-rose-500' : 'bg-zinc-500';
                const barColor = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : 'bg-amber-500';
                return (
                  <div key={p.socketId} className={`px-8 py-5 flex items-center gap-4 ${isMe ? 'bg-violet-50 dark:bg-violet-500/10' : ''}`}>
                    <span className="text-2xl w-8 text-center flex-shrink-0">{medal}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-zinc-800 dark:text-white">{p.name}</p>
                        <span className={`text-xs text-white px-2 py-0.5 rounded-full ${sideColor}`}>{sideLabel}</span>
                        {isMe && <span className="text-xs bg-violet-500 text-white px-2 py-0.5 rounded-full">나</span>}
                      </div>
                      {ev && <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">💪 {ev.strength}</p>}
                      <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${score}%` }} />
                      </div>
                    </div>
                    <span className="font-black text-2xl text-zinc-800 dark:text-white flex-shrink-0">{score}<span className="text-sm font-normal text-zinc-400">점</span></span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 라운드별 발언 */}
          {Array.from({ length: debateTotalRoundsState }, (_, ri) => {
            const roundSpeeches = speeches?.filter((s: any) => s.round === ri + 1) || [];
            if (roundSpeeches.length === 0) return null;
            return (
              <div key={ri} className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
                <div className="px-8 py-5 border-b border-gray-100 dark:border-white/5">
                  <h2 className="text-base font-black text-zinc-800 dark:text-white">📢 라운드 {ri + 1} 발언</h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {roundSpeeches.map((s: any, si: number) => {
                    const isMe = s.participantId === mySocketId;
                    const sideColor = s.side === 'pro' ? 'bg-blue-500' : s.side === 'con' ? 'bg-rose-500' : 'bg-zinc-500';
                    const sideLabel = s.side === 'pro' ? '찬성' : s.side === 'con' ? '반대' : '자유';
                    return (
                      <div key={si} className={`px-8 py-5 space-y-2 ${isMe ? 'bg-violet-50/50 dark:bg-violet-500/5' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs text-white px-2 py-0.5 rounded-full ${sideColor}`}>{sideLabel}</span>
                            <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{s.participantName} {isMe && <span className="text-xs bg-violet-500 text-white px-1.5 py-0.5 rounded-full">나</span>}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span>👀 {s.focusScore}%</span>
                            <span className="font-black text-violet-600 dark:text-violet-400">{s.answerScore}점</span>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 leading-relaxed">{s.speech || '(발언 없음)'}</p>
                        {s.feedback && (
                          <div className="flex gap-2 flex-wrap">
                            <span className="text-xs px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-500/20">✅ {s.feedback.good}</span>
                            <span className="text-xs px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-500/20">⚡ {s.feedback.bad}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <button onClick={() => window.location.reload()} className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold border border-gray-200 dark:border-zinc-700 shadow-md hover:-translate-y-0.5 transition-all">
            🔄 새로운 면접 시작하기
          </button>
        </div>
      </div>
    );
  }

  // ─── PT 결과 화면 ───────────────────────────────────────────────────────────
  if (ptResults) {
    const presentation = ptResults.find(r => r.type === 'presentation');
    const qaItems = ptResults.filter(r => r.type === 'qa');
    const avgScore = Math.round(ptResults.reduce((a, r) => a + (r.answerScore || 0), 0) / ptResults.length);
    const scoreColor = avgScore >= 80 ? '#10B981' : avgScore >= 60 ? '#3B82F6' : '#F59E0B';
    return (
      <div className="min-h-screen bg-[#F0F4FF] dark:bg-[#0A0A0F] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4F46E5] rounded-3xl px-8 py-12 text-white text-center">
            <p className="text-violet-200 text-sm font-semibold tracking-widest uppercase mb-2">PT Interview</p>
            <h1 className="text-3xl font-black mb-1">PT면접 종합 결과</h1>
            <p className="text-violet-200 text-sm">{presentation?.topic}</p>
          </div>

          {/* 종합 점수 */}
          <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
            <div className="relative flex-shrink-0">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth="10"/>
                <circle cx="60" cy="60" r="52" fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`} strokeDashoffset={`${2 * Math.PI * 52 * (1 - avgScore / 100)}`}/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-zinc-900 dark:text-white">{avgScore}</span>
                <span className="text-sm text-zinc-400">/ 100</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-1">종합 PT 점수</p>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
                {avgScore >= 80 ? '우수한 발표 역량입니다!' : avgScore >= 60 ? '좋은 발표였습니다.' : '더 연습이 필요합니다.'}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">발표 + Q&A {ptResults.length}개 항목 평균 점수입니다.</p>
            </div>
          </div>

          {/* 발표 평가 */}
          {presentation && (
            <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
              <div className="px-8 py-5 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
                <span className="w-8 h-8 bg-violet-600 text-white rounded-lg flex items-center justify-center text-sm font-black">📊</span>
                <p className="font-black text-zinc-800 dark:text-white">발표 평가</p>
                <span className="ml-auto font-black text-violet-600 dark:text-violet-400 text-lg">{presentation.answerScore}점</span>
              </div>
              <div className="p-8 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 bg-violet-50 dark:bg-violet-500/10 rounded-2xl p-4">
                    <p className="text-xs font-bold text-violet-500 mb-1">👀 시선 집중도</p>
                    <p className="text-3xl font-black text-violet-800 dark:text-violet-200">{presentation.focusScore}<span className="text-base font-normal text-violet-400">%</span></p>
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-2xl p-4">
                    <p className="text-xs font-bold text-zinc-500 mb-1">🎙️ 발표 내용</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-3">{presentation.transcript || '(인식된 발표 없음)'}</p>
                  </div>
                </div>
                {presentation.feedback && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-500/20">
                      <p className="text-xs font-bold text-emerald-600 mb-1">✅ 강점</p>
                      <p className="text-sm text-emerald-800 dark:text-emerald-300">{presentation.feedback.good}</p>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-500/10 rounded-xl p-4 border border-rose-100 dark:border-rose-500/20">
                      <p className="text-xs font-bold text-rose-600 mb-1">⚡ 보완점</p>
                      <p className="text-sm text-rose-800 dark:text-rose-300">{presentation.feedback.bad}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Q&A 결과 */}
          {qaItems.map((item, i) => (
            <div key={i} className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
              <div className="px-8 py-5 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
                <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-black">Q{i + 1}</span>
                <p className="font-bold text-zinc-800 dark:text-white flex-1">{item.question}</p>
                <span className="font-black text-indigo-600 dark:text-indigo-400">{item.answerScore}점</span>
              </div>
              <div className="p-8 space-y-3">
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                  <p className="text-xs font-bold text-zinc-400 mb-2">🎙️ 답변</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.answer || '(답변 없음)'}</p>
                </div>
                {item.feedback && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-500/20">
                      <p className="text-xs font-bold text-emerald-600 mb-1">✅ 강점</p>
                      <p className="text-sm text-emerald-800 dark:text-emerald-300">{item.feedback.good}</p>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-500/10 rounded-xl p-4 border border-rose-100 dark:border-rose-500/20">
                      <p className="text-xs font-bold text-rose-600 mb-1">⚡ 보완점</p>
                      <p className="text-sm text-rose-800 dark:text-rose-300">{item.feedback.bad}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          <button onClick={() => window.location.reload()} className="w-full flex items-center justify-center gap-2.5 px-8 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold border border-gray-200 dark:border-zinc-700 shadow-md hover:-translate-y-0.5 transition-all">
            🔄 새로운 면접 시작하기
          </button>
        </div>
      </div>
    );
  }

  // ─── 결과 리포트 화면 ───────────────────────────────────────────────────────
  if (reportData) {
    const avgScore = Math.round(reportData.reduce((acc, item) => acc + (item.answerScore || 0), 0) / reportData.length);
    const scoreColor = avgScore >= 80 ? '#10B981' : avgScore >= 60 ? '#3B82F6' : '#F59E0B';

    return (
      <div className="min-h-screen bg-[#F0F4FF] dark:bg-[#0A0A0F] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">

          {/* 캡처 영역 */}
          <div ref={reportRef} className="bg-white dark:bg-[#111118] rounded-3xl overflow-hidden shadow-2xl">

            {/* 리포트 헤더 */}
            <div className="relative bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#6366F1] px-8 py-12 text-white text-center overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px'}}></div>
              <div className="relative">
                <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-3">AI Interview</p>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">종합 분석 리포트</h1>
                <p className="text-blue-200 text-base">답변과 안면 인식 데이터를 기반으로 분석된 결과입니다</p>
              </div>
            </div>

            {/* 종합 점수 */}
            <div className="px-8 -mt-6 mb-8">
              <div className="bg-white dark:bg-[#1A1A28] rounded-2xl border border-gray-100 dark:border-[rgba(255,255,255,0.05)] shadow-xl p-8 flex flex-col sm:flex-row items-center gap-6">
                <div className="relative flex-shrink-0">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth="10" style={{stroke: 'var(--ring-track, #E5E7EB)'}}/>
                    <circle
                      cx="60" cy="60" r="52" fill="none"
                      stroke={scoreColor}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={`${2 * Math.PI * 52 * (1 - avgScore / 100)}`}
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-zinc-900 dark:text-white">{avgScore}</span>
                    <span className="text-sm text-zinc-400 font-medium">/ 100</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-1">종합 면접 점수</p>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
                    {avgScore >= 80 ? '우수한 면접 역량입니다!' : avgScore >= 60 ? '좋은 면접 역량입니다.' : '더 연습이 필요합니다.'}
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                    총 {reportData.length}개 질문에 대한 AI 평가 점수 평균입니다. 하단에서 질문별 상세 피드백을 확인하세요.
                  </p>
                </div>
              </div>
            </div>

            {/* 질문별 카드 */}
            <div className="px-8 pb-10 space-y-6">
              {reportData.map((item, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-[#1A1A28] rounded-2xl border border-gray-100 dark:border-[rgba(255,255,255,0.05)] overflow-hidden">

                  {/* 질문 헤더 */}
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-[rgba(255,255,255,0.05)] flex items-start gap-3">
                    <span className={`flex-shrink-0 w-8 h-8 text-white rounded-lg flex items-center justify-center text-sm font-black ${item.isFollowup ? 'bg-orange-500' : 'bg-blue-600'}`}>
                      Q{idx + 1}
                    </span>
                    <div className="flex flex-col gap-1">
                      {item.isFollowup && (
                        <span className="self-start text-xs font-black px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full">🔁 꼬리 질문</span>
                      )}
                      <p className="font-bold text-zinc-800 dark:text-zinc-100 leading-snug">
                        {item.question.replace(new RegExp('^\\d+\\.\\s*'), '')}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* 지원자 답변 */}
                    <div className="bg-white dark:bg-[#111118] rounded-xl p-4 border border-gray-100 dark:border-[rgba(255,255,255,0.05)]">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <span className="text-base">🎙️</span> 지원자 답변
                      </p>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {item.answer || '(답변을 인식하지 못했습니다.)'}
                      </p>
                    </div>

                    {/* 분석 지표 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 dark:bg-[rgba(23,37,84,0.3)] rounded-xl p-4 border border-blue-100 dark:border-[rgba(59,130,246,0.1)]">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">👀 시선 집중도</p>
                        <p className="text-3xl font-black text-blue-900 dark:text-blue-100">
                          {item.focusScore}<span className="text-lg font-bold text-blue-400">%</span>
                        </p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-[rgba(2,44,34,0.3)] rounded-xl p-4 border border-emerald-100 dark:border-[rgba(16,185,129,0.1)]">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">🗣️ 발화 프레임</p>
                        <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100">
                          {item.analysis.mouthOpenFrames}
                          <span className="text-base font-bold text-emerald-400"> / {item.analysis.totalFrames}</span>
                        </p>
                      </div>
                    </div>

                    {/* AI 피드백 */}
                    {item.feedback && (
                      <div className="bg-indigo-50 dark:bg-[rgba(49,46,129,0.2)] rounded-xl border border-indigo-100 dark:border-[rgba(99,102,241,0.15)] overflow-hidden">
                        <div className="px-5 py-3 border-b border-indigo-100 dark:border-[rgba(99,102,241,0.15)] flex items-center justify-between">
                          <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                            <span>💡</span> AI 면접관 피드백
                          </p>
                          <span className="text-xs font-black px-3 py-1 bg-indigo-200 dark:bg-[rgba(99,102,241,0.2)] text-indigo-800 dark:text-indigo-200 rounded-full border border-indigo-300 dark:border-[rgba(99,102,241,0.2)]">
                            {item.answerScore || 0}점
                          </span>
                        </div>
                        <div className="p-5 space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 text-xs font-black px-2 py-0.5 bg-emerald-100 dark:bg-[rgba(16,185,129,0.2)] text-emerald-700 dark:text-emerald-300 rounded-md mt-0.5">강점</span>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{item.feedback.good}</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 text-xs font-black px-2 py-0.5 bg-rose-100 dark:bg-[rgba(244,63,94,0.2)] text-rose-700 dark:text-rose-300 rounded-md mt-0.5">보완</span>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{item.feedback.bad}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center justify-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-2xl font-bold text-base transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
            >
              <span className="text-lg">📄</span> PDF로 다운로드
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2.5 px-8 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold text-base transition-all shadow-lg shadow-zinc-200/50 dark:shadow-black/20 hover:-translate-y-0.5 border border-gray-200 dark:border-zinc-700"
            >
              <span className="text-lg">🔄</span> 새로운 면접 시작하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── 메인 인터뷰 화면 ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0F4FF] dark:bg-[#0A0A0F] p-4 md:p-8 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col items-center">

      {/* 헤더 */}
      <header className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-600/30">
            🤖
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none">AI Interview</h1>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">실시간 안면 분석 면접 시스템</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border transition-colors ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            {isConnected ? '서버 연결됨' : '연결 끊김'}
          </div>

          <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border transition-colors ${
            hasMediaPermission
              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
              : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700'
          }`}>
            {hasMediaPermission ? '🎥 카메라 ON' : '📷 카메라 대기'}
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl flex flex-col gap-5">
        {!hasMediaPermission ? (
          /* ── 권한 요청 화면 ── */
          <div className="bg-white dark:bg-[#111118] rounded-3xl shadow-xl shadow-blue-900/5 dark:shadow-black/30 border border-gray-100 dark:border-white/5 overflow-hidden">

            {/* 상단 그라디언트 배너 */}
            <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>

            <div className="flex flex-col items-center text-center px-8 py-14">
              {/* 아이콘 */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-2xl scale-150"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-blue-600/30">
                  🎙️
                </div>
              </div>

              <h2 className="text-3xl font-black mb-3 text-zinc-900 dark:text-white">면접 준비를 시작할까요?</h2>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-10 leading-relaxed">
                실전과 같은 AI 면접을 위해 카메라와 마이크 권한이 필요합니다.<br/>
                수집된 영상은 실시간 안면 분석에만 사용됩니다.
              </p>

              {/* 특징 카드 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-10">
                {[
                  { icon: '👁️', title: '실시간 분석', desc: '시선·표정·발화를 AI가 실시간으로 추적' },
                  { icon: '🔒', title: '안전한 처리', desc: '영상 데이터는 외부로 저장되지 않음' },
                  { icon: '📊', title: '상세 리포트', desc: '면접 종료 후 AI 피드백 리포트 제공' },
                ].map((f) => (
                  <div key={f.title} className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 text-left">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200 mb-1">{f.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={requestMedia}
                className="px-10 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/30 transition-all hover:-translate-y-0.5 text-base"
              >
                권한 허용하기 →
              </button>

              {mediaError && (
                <div className="mt-6 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-3 rounded-xl">
                  <span>⚠️</span> {mediaError}
                </div>
              )}
            </div>
          </div>
        ) : !resumeStepDone ? (
          /* ── 이력서 업로드 단계 ── */
          <div className="bg-white dark:bg-[#111118] rounded-3xl shadow-xl shadow-blue-900/5 dark:shadow-black/30 border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500"></div>
            <div className="flex flex-col items-center text-center px-8 py-12">

              <div className="relative mb-6">
                <div className="absolute inset-0 bg-violet-400/20 dark:bg-violet-500/10 rounded-full blur-2xl scale-150"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-violet-500 to-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-2xl shadow-violet-600/30">
                  📄
                </div>
              </div>

              <h2 className="text-2xl font-black mb-2 text-zinc-900 dark:text-white">이력서 기반 맞춤 질문</h2>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8 leading-relaxed text-sm">
                이력서를 업로드하면 AI가 경력·기술스택에 맞는 질문을 생성합니다.<br/>
                건너뛰면 기본 면접 질문으로 진행됩니다.
              </p>

              {/* 파일 드롭존 */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative w-full max-w-lg border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer mb-4 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                    : generatedQuestions
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                    : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/5'
                }`}
                onClick={() => !isGeneratingQuestions && document.getElementById('resume-input')?.click()}
              >
                <input
                  id="resume-input"
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                {isGeneratingQuestions ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">AI가 맞춤 질문을 생성하는 중...</p>
                  </div>
                ) : generatedQuestions ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <span className="text-3xl">✅</span>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{resumeFile?.name}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500">{generatedQuestions.length}개 맞춤 질문 생성 완료</p>
                    <ul className="mt-3 text-left space-y-2 w-full">
                      {generatedQuestions.map((q, i) => (
                        <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          <span className="font-bold text-blue-600 dark:text-blue-400">Q{i + 1}.</span> {q.replace(/^\d+\.\s*/, '')}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl">📎</span>
                    <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                      {isDragging ? '여기에 놓으세요!' : 'PDF / DOCX / TXT 파일을 드래그하거나 클릭하여 업로드'}
                    </p>
                    <p className="text-xs text-zinc-400">최대 10MB</p>
                  </div>
                )}
              </div>

              {resumeError && (
                <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-2 rounded-xl mb-4">
                  ⚠️ {resumeError}
                </p>
              )}

              <div className="flex flex-col gap-3 w-full max-w-lg">
                <button
                  onClick={() => setResumeStepDone(true)}
                  disabled={isGeneratingQuestions}
                  className="w-full px-6 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-zinc-900 font-bold rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatedQuestions ? '맞춤 질문으로 면접 시작' : '면접 시작하기'}
                </button>
                <div className="flex gap-3">
                  {generatedQuestions ? (
                    <>
                      <button
                        onClick={() => resumeFile && handleResumeUpload(resumeFile)}
                        disabled={isGeneratingQuestions}
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 text-sm"
                      >
                        🔄 다시 생성하기
                      </button>
                      <button
                        onClick={() => {
                          setGeneratedQuestions(null);
                          setResumeFile(null);
                          setResumeError(null);
                          document.getElementById('resume-input')?.click();
                        }}
                        disabled={isGeneratingQuestions}
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 text-sm"
                      >
                        📁 파일 다시 올리기
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setResumeStepDone(true)}
                      disabled={isGeneratingQuestions}
                      className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 font-semibold rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 text-sm"
                    >
                      이력서 없이 시작
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : !interviewTypeStepDone ? (
          /* ── 면접 유형 선택 단계 ── */
          <div className="bg-white dark:bg-[#111118] rounded-3xl shadow-xl shadow-blue-900/5 dark:shadow-black/30 border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>
            <div className="flex flex-col items-center text-center px-8 py-12">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-2xl scale-150"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center text-3xl shadow-2xl shadow-indigo-600/30">
                  🎯
                </div>
              </div>
              <h2 className="text-2xl font-black mb-2 text-zinc-900 dark:text-white">면접 유형 선택</h2>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8 text-sm leading-relaxed">
                원하는 면접 유형을 선택하세요.
              </p>

              {/* 유형 카드 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-6">
                {[
                  { id: 'individual', icon: '🧑‍💼', label: '개인면접', sub: '1:1 AI', desc: '이력서 기반 심층 압박 질문 + 꼬리 질문', available: true },
                  { id: 'foreign', icon: '🌐', label: '외국어면접', sub: 'Foreign', desc: '영어·일본어·중국어 면접 유창성 분석', available: true },
                  { id: 'group', icon: '👥', label: '집단면접', sub: 'N:AI', desc: '공통 질문과 상대 비교 분석', available: true },
                  { id: 'pt', icon: '📊', label: 'PT면접', sub: 'Presentation', desc: 'AI 주제 + 발표 분석 + Q&A', available: true },
                  { id: 'discussion', icon: '💬', label: '토론면접', sub: 'Discussion', desc: 'AI 사회자 + 찬반/자유 토론', available: true },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => type.available && setInterviewType(type.id)}
                    disabled={!type.available}
                    className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                      !type.available
                        ? 'opacity-50 cursor-not-allowed border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/3'
                        : interviewType === type.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-lg shadow-blue-500/10'
                        : 'border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-md'
                    }`}
                  >
                    {!type.available && (
                      <span className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-full">준비 중</span>
                    )}
                    {type.available && interviewType === type.id && (
                      <span className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 bg-blue-500 text-white rounded-full">선택됨</span>
                    )}
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <p className="font-black text-zinc-800 dark:text-zinc-100 text-sm">{type.label}</p>
                    <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold mb-1">{type.sub}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{type.desc}</p>
                  </button>
                ))}
              </div>

              {/* 외국어 면접 언어 선택 */}
              {interviewType === 'foreign' && (
                <div className="w-full max-w-2xl mb-6 p-5 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                  <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-3">면접 언어 선택</p>
                  <div className="flex gap-3">
                    {[
                      { code: 'en-US', label: '🇺🇸 영어' },
                      { code: 'ja-JP', label: '🇯🇵 일본어' },
                      { code: 'zh-CN', label: '🇨🇳 중국어' },
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setForeignLanguage(lang.code)}
                        className={`flex-1 py-2 rounded-xl font-semibold text-sm border-2 transition-all ${
                          foreignLanguage === lang.code
                            ? 'border-indigo-500 bg-indigo-500 text-white'
                            : 'border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:border-indigo-400'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => interviewType && setInterviewTypeStepDone(true)}
                disabled={!interviewType}
                className="w-full max-w-2xl px-6 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-zinc-900 font-bold rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {interviewType ? '선택 완료 →' : '유형을 선택해주세요'}
              </button>
            </div>
          </div>
        ) : interviewType === 'discussion' ? (
          /* ── 토론면접 ── */
          <div className="flex flex-col gap-5">

            {/* ── Setup 단계 ── */}
            {debateSetupStep === 'setup' && (
              <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
                <div className="h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"></div>
                <div className="px-8 py-10 flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-violet-400/20 rounded-full blur-2xl scale-150"></div>
                      <div className="relative w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl">💬</div>
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-zinc-900 dark:text-white">토론면접 입장</h2>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm">이름을 입력하고 방을 선택하거나 만드세요</p>
                    </div>
                  </div>

                  {/* 이름 입력 */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">내 이름</label>
                    <input type="text" maxLength={12} placeholder="이름을 입력하세요" value={debateMyName} onChange={e => setDebateMyName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-violet-500 transition-colors text-lg" />
                  </div>

                  {/* 탭 */}
                  <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-2xl p-1">
                    {([['list', '📋 공개 방 목록'], ['private', '🔒 비밀 방'], ['create', '🏠 방 만들기']] as const).map(([tab, label]) => (
                      <button key={tab} onClick={() => { setDebateSetupTab(tab); setDebateRoomError(null); if (tab === 'list') socket.emit('get_debate_room_list'); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${debateSetupTab === tab ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* 공개 방 목록 */}
                  {debateSetupTab === 'list' && (
                    <div className="space-y-2">
                      {debateRoomList.length === 0 ? (
                        <div className="text-center py-10 text-zinc-400">
                          <p className="text-3xl mb-2">💬</p>
                          <p className="text-sm font-semibold">대기 중인 공개 토론방이 없습니다</p>
                        </div>
                      ) : (
                        debateRoomList.map((r: any) => (
                          <div key={r.code} className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-bold text-zinc-800 dark:text-zinc-100 truncate text-sm">{r.roomName}</p>
                                <span className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-full flex-shrink-0">{r.debateType === 'pro-con' ? '찬반' : '자유'}</span>
                              </div>
                              <p className="text-xs text-zinc-400 truncate">{r.topic} · {r.participantCount}명</p>
                            </div>
                            <button onClick={() => { setDebateRoomError(null); socket.emit('join_debate_room', { code: r.code, name: debateMyName }); }} disabled={!debateMyName.trim()}
                              className="flex-shrink-0 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed">
                              참가 →
                            </button>
                          </div>
                        ))
                      )}
                      <button onClick={() => socket.emit('get_debate_room_list')} className="w-full py-2 text-xs text-zinc-400 hover:text-violet-500 transition-colors font-semibold">🔄 목록 새로고침</button>
                    </div>
                  )}

                  {/* 비밀 방 */}
                  {debateSetupTab === 'private' && (
                    <div className="space-y-3">
                      <input type="text" maxLength={6} placeholder="방 코드 6자리" value={debateJoinCode} onChange={e => setDebateJoinCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-bold focus:outline-none focus:border-violet-500 transition-colors text-center tracking-widest text-lg" />
                      <input type="password" placeholder="비밀번호" value={debateJoinPassword} onChange={e => setDebateJoinPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-violet-500 transition-colors" />
                      <button onClick={() => { setDebateRoomError(null); socket.emit('join_debate_room', { code: debateJoinCode, name: debateMyName, password: debateJoinPassword }); }} disabled={!debateMyName.trim() || debateJoinCode.length < 6}
                        className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed">
                        🔒 비밀 방 입장
                      </button>
                    </div>
                  )}

                  {/* 방 만들기 */}
                  {debateSetupTab === 'create' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">방 이름</label>
                        <input type="text" maxLength={20} placeholder={debateMyName ? `${debateMyName}의 토론방` : '방 이름'} value={debateRoomName} onChange={e => setDebateRoomName(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-violet-500 transition-colors" />
                      </div>

                      {/* 토론 방식 */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">토론 방식</label>
                        <div className="flex gap-2">
                          {([['pro-con', '⚔️ 찬반 토론', '찬성/반대 입장을 배정하여 토론'], ['free', '🗣️ 자유 토론', '입장 제한 없이 자유롭게 의견 공유']] as const).map(([v, label, desc]) => (
                            <button key={v} onClick={() => setDebateType(v)}
                              className={`flex-1 py-3 px-3 rounded-2xl border-2 text-left transition-all ${debateType === v ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10' : 'border-gray-100 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30'}`}>
                              <p className={`text-sm font-bold ${debateType === v ? 'text-violet-700 dark:text-violet-300' : 'text-zinc-700 dark:text-zinc-300'}`}>{label}</p>
                              <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 라운드 수 */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">라운드 수</label>
                        <div className="flex gap-2">
                          {[2, 3, 4].map(n => (
                            <button key={n} onClick={() => setDebateTotalRounds(n)}
                              className={`flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${debateTotalRounds === n ? 'border-violet-500 bg-violet-500 text-white' : 'border-gray-200 dark:border-white/10 text-zinc-500 hover:border-violet-400'}`}>
                              {n}라운드
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 토론 주제 */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">토론 주제</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3">
                          {([['social','🧑‍🤝‍🧑','사회/노동'],['tech','💻','IT/기술'],['education','📚','교육'],['economy','💰','경제'],['environment','🌿','환경']] as const).map(([id, icon, label]) => (
                            <button key={id} onClick={() => { setPtCategory(id); setDebateCategory(id); }}
                              className={`py-2 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center gap-0.5 ${debateCategory === id ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300' : 'border-gray-100 dark:border-white/10 text-zinc-500 hover:border-violet-300 dark:hover:border-violet-500/30'}`}>
                              <span>{icon}</span>{label}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setDebateUseCustom(v => !v)} className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline mb-2 flex items-center gap-1">
                          {debateUseCustom ? '▲ AI 주제 생성으로 돌아가기' : '▼ 직접 주제 입력하기'}
                        </button>
                        {debateUseCustom && (
                          <input type="text" maxLength={60} placeholder="토론 주제를 직접 입력하세요" value={debateCustomTopic} onChange={e => setDebateCustomTopic(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-medium focus:outline-none focus:border-violet-500 transition-colors text-sm" />
                        )}
                        {debateTopic && (
                          <div className="mt-3 p-4 bg-violet-50 dark:bg-violet-500/10 rounded-2xl border border-violet-100 dark:border-violet-500/20">
                            <p className="text-xs font-bold text-violet-500 mb-1">생성된 주제</p>
                            <p className="font-bold text-violet-800 dark:text-violet-200 text-sm">{debateTopic}</p>
                            {debateTopicDesc && <p className="text-xs text-violet-600 dark:text-violet-300 mt-1">{debateTopicDesc}</p>}
                            {debateType === 'pro-con' && (
                              <div className="mt-2 flex gap-2 flex-wrap">
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg">👍 {debateProLabel}</span>
                                <span className="text-xs px-2 py-1 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-lg">👎 {debateConLabel}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {debateTopicError && <p className="text-sm text-rose-500 mt-2">⚠️ {debateTopicError}</p>}
                        <button onClick={handleGenerateDebateTopic} disabled={debateIsGenerating || (debateUseCustom && !debateCustomTopic.trim())}
                          className="mt-3 w-full py-2.5 text-sm font-bold rounded-xl border-2 border-violet-500 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                          {debateIsGenerating ? <><div className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin"></div> 생성 중...</> : '✨ AI 주제 생성'}
                        </button>
                      </div>

                      {/* 공개/비밀 */}
                      <div className="flex gap-2">
                        <button onClick={() => setDebateIsPrivate(false)} className={`flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${!debateIsPrivate ? 'border-violet-500 bg-violet-500 text-white' : 'border-gray-200 dark:border-white/10 text-zinc-500 hover:border-violet-400'}`}>🌐 공개 방</button>
                        <button onClick={() => setDebateIsPrivate(true)} className={`flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${debateIsPrivate ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 dark:border-white/10 text-zinc-500 hover:border-blue-400'}`}>🔒 비밀 방</button>
                      </div>
                      {debateIsPrivate && (
                        <input type="password" placeholder="비밀번호" value={debateRoomPassword} onChange={e => setDebateRoomPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-blue-500 transition-colors" />
                      )}

                      {debateRoomError && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-3 rounded-xl">⚠️ {debateRoomError}</p>}

                      <button onClick={() => {
                        if (!debateTopic) { setDebateRoomError('주제를 먼저 생성해주세요.'); return; }
                        setDebateRoomError(null);
                        socket.emit('create_debate_room', { name: debateMyName, roomName: debateRoomName || undefined, topic: debateTopic, topicDescription: debateTopicDesc, proLabel: debateProLabel, conLabel: debateConLabel, debateType, totalRounds: debateTotalRounds, isPrivate: debateIsPrivate, password: debateIsPrivate ? debateRoomPassword : undefined });
                      }} disabled={!debateMyName.trim() || !debateTopic || (debateIsPrivate && !debateRoomPassword.trim())}
                        className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed">
                        💬 토론방 만들기
                      </button>
                    </div>
                  )}

                  {debateSetupTab !== 'create' && debateRoomError && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-3 rounded-xl">⚠️ {debateRoomError}</p>}
                </div>
              </div>
            )}

            {/* ── 대기실 ── */}
            {debateSetupStep === 'waiting' && (
              <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
                <div className="h-2 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
                <div className="px-8 py-10 flex flex-col gap-6">
                  <div className="text-center">
                    <h2 className="text-xl font-black text-zinc-800 dark:text-white mb-2">대기실</h2>
                    <div className="flex items-center gap-2 justify-center">
                      <span className="font-black text-2xl tracking-widest text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-4 py-1 rounded-xl border border-violet-100 dark:border-violet-500/20">{debateRoomCode}</span>
                      <button onClick={() => navigator.clipboard.writeText(debateRoomCode)} className="text-xs text-zinc-400 hover:text-violet-500 transition-colors">복사</button>
                    </div>
                  </div>

                  {/* 주제 카드 */}
                  <div className="bg-violet-50 dark:bg-violet-500/10 rounded-2xl p-5 border border-violet-100 dark:border-violet-500/20">
                    <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-2">토론 주제</p>
                    <p className="font-black text-violet-900 dark:text-violet-100 leading-snug">{debateTopic}</p>
                    {debateTopicDesc && <p className="text-xs text-violet-600 dark:text-violet-300 mt-2">{debateTopicDesc}</p>}
                    {debateType === 'pro-con' && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        <span className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg font-semibold">👍 {debateProLabel}</span>
                        <span className="text-xs px-3 py-1.5 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-lg font-semibold">👎 {debateConLabel}</span>
                      </div>
                    )}
                  </div>

                  {/* 참가자 목록 */}
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">참가자 ({debateParticipants.length}명)</p>
                    <div className="space-y-2">
                      {debateParticipants.map((p: any, i: number) => (
                        <div key={p.socketId} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                          <span className="w-7 h-7 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white rounded-lg flex items-center justify-center text-xs font-black">{i + 1}</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex-1">{p.name}</span>
                          {p.socketId === socket.id && <span className="text-xs bg-violet-500 text-white px-2 py-0.5 rounded-full">나</span>}
                          {p.socketId === debateParticipants[0]?.socketId && <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">방장</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {debateIsHost ? (
                    <button onClick={() => socket.emit('start_debate', { code: debateRoomCode })} disabled={debateParticipants.length < 2}
                      className="w-full px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl shadow-xl shadow-violet-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-40">
                      🚀 토론 시작하기 ({debateParticipants.length}명) {debateParticipants.length < 2 && '— 최소 2명 필요'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 justify-center text-zinc-500">
                      <div className="w-5 h-5 border-2 border-zinc-300 border-t-violet-500 rounded-full animate-spin"></div>
                      <span className="text-sm">방장이 토론을 시작할 때까지 대기 중...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── 토론 진행 ── */}
            {debateSetupStep === 'debating' && (() => {
              const isMyTurn = debateCurrentSpeakerId === mySocketId;
              const currentSpeaker = debateParticipants.find((p: any) => p.socketId === debateCurrentSpeakerId);
              const me = debateParticipants.find((p: any) => p.socketId === mySocketId);
              const mySideLabel = me?.side === 'pro' ? '찬성' : me?.side === 'con' ? '반대' : '자유';
              const mySideColor = me?.side === 'pro' ? 'bg-blue-500' : me?.side === 'con' ? 'bg-rose-500' : 'bg-zinc-500';
              return (
                <>
                  {/* 상태 바 */}
                  <div className="bg-white dark:bg-[#111118] rounded-2xl border border-gray-100 dark:border-white/5 px-6 py-4 shadow-md flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-0.5">라운드 {debateCurrentRound} / {debateTotalRoundsState}</p>
                      <p className="font-bold text-zinc-800 dark:text-white text-sm truncate">{debateTopic}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs text-white px-2 py-1 rounded-lg font-bold ${mySideColor}`}>{mySideLabel}</span>
                      {isMyTurn
                        ? <span className="text-xs font-black px-3 py-1 bg-violet-500 text-white rounded-full animate-pulse">내 차례</span>
                        : <span className="text-xs font-bold px-3 py-1 bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 rounded-full">{currentSpeaker?.name || '?'} 발언 중</span>}
                      {isMyTurn && !debateSpeechFeedback && !debateShowSummary && (
                        <div className={`text-lg font-black tabular-nums ${debateSpeechTimeLeft <= 30 ? 'text-rose-500' : 'text-violet-600 dark:text-violet-400'}`}>
                          {String(Math.floor(debateSpeechTimeLeft / 60)).padStart(2, '0')}:{String(debateSpeechTimeLeft % 60).padStart(2, '0')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 발언 순서 */}
                  <div className="bg-white dark:bg-[#111118] rounded-2xl border border-gray-100 dark:border-white/5 px-6 py-4 shadow-md">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">발언 순서</p>
                    <div className="flex flex-wrap gap-2">
                      {debateParticipants.map((p: any) => {
                        const isCurrent = p.socketId === debateCurrentSpeakerId;
                        const sideColor = p.side === 'pro' ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300' : p.side === 'con' ? 'border-rose-400 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300' : 'border-zinc-300 bg-zinc-50 dark:bg-white/5 text-zinc-600 dark:text-zinc-400';
                        return (
                          <span key={p.socketId} className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all ${isCurrent ? 'bg-violet-500 text-white border-violet-500 shadow-md' : sideColor}`}>
                            {p.name}{p.socketId === mySocketId ? ' (나)' : ''} {p.side !== 'neutral' ? (p.side === 'pro' ? '👍' : '👎') : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* 라운드 요약 카드 */}
                  {debateShowSummary && (
                    <div className="bg-violet-50 dark:bg-violet-500/10 rounded-2xl border border-violet-200 dark:border-violet-500/30 px-6 py-5">
                      <p className="text-sm font-black text-violet-700 dark:text-violet-300 mb-2">🎙️ AI 사회자 코멘트</p>
                      <p className="text-sm text-violet-800 dark:text-violet-200 leading-relaxed">{debateRoundSummary}</p>
                      {debateCurrentRound < debateTotalRoundsState && (
                        <p className="text-xs text-violet-500 mt-3 font-semibold">잠시 후 라운드 {debateCurrentRound + 1}이 시작됩니다...</p>
                      )}
                    </div>
                  )}

                  {/* 카메라 */}
                  <div className="relative w-full aspect-video bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80" />
                    {isFaceDetected && (
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <StatusBadge ok={isFaceCentered} okLabel="위치 안정적" failLabel="위치 이탈" okIcon="🎯" failIcon="⚠️" />
                        <StatusBadge ok={!isLookingAway} okLabel="시선 집중" failLabel="모니터 응시 요망" okIcon="👀" failIcon="⚠️" />
                      </div>
                    )}
                    {isRecording && (
                      <div className="absolute top-4 right-4 flex items-center gap-2 bg-rose-500/90 backdrop-blur-sm text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> REC
                      </div>
                    )}
                    <div className="absolute bottom-5 inset-x-5 flex justify-center">
                      <div className="bg-black/70 backdrop-blur-md text-white px-6 py-4 rounded-2xl max-w-3xl w-full text-center min-h-[60px] flex items-center justify-center border border-white/10">
                        {sttText ? <p className="text-base leading-relaxed font-medium">{sttText}</p> : <p className="text-white/35 text-sm">{isMyTurn ? '발언을 시작하면 자막이 표시됩니다...' : `${currentSpeaker?.name || '?'}님이 발언 중입니다...`}</p>}
                      </div>
                    </div>
                  </div>

                  {/* 내 차례 컨트롤 */}
                  {isMyTurn && !debateSpeechFeedback && !debateShowSummary && (
                    <div className="flex gap-3">
                      <button onClick={toggleRecording}
                        className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-base transition-all shadow-lg hover:-translate-y-0.5 ${isRecording ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/25'}`}>
                        {isRecording ? <><span className="w-4 h-4 bg-white rounded-sm"></span> 녹음 종료</> : <><span>🎙️</span> 발언 녹음 시작</>}
                      </button>
                      <button onClick={() => {
                        if (isRecording && mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); socket.emit('stop_audio_stream'); }
                        socket.emit('debate_submit_speech', { code: debateRoomCode, speech: sttText, analysis: analysisDataRef.current });
                      }}
                        className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold border border-gray-200 dark:border-zinc-700 shadow-md hover:-translate-y-0.5 transition-all">
                        <span>✅</span> 발언 완료
                      </button>
                    </div>
                  )}

                  {/* 내 차례 아님 or 피드백 */}
                  {(!isMyTurn || debateSpeechFeedback) && !debateShowSummary && (
                    <div className={`rounded-2xl border px-6 py-5 ${debateSpeechFeedback ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'}`}>
                      {debateSpeechFeedback ? (
                        <>
                          <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-3">💡 내 발언 피드백</p>
                          <div className="flex gap-2 flex-wrap mb-2">
                            <span className="text-xs px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-100 dark:border-emerald-500/20">✅ {debateSpeechFeedback.feedback?.good}</span>
                            <span className="text-xs px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-100 dark:border-rose-500/20">⚡ {debateSpeechFeedback.feedback?.bad}</span>
                          </div>
                          <p className="text-xs text-zinc-500">다음 발언자를 기다리는 중...</p>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 text-zinc-500">
                          <div className="w-5 h-5 border-2 border-zinc-300 border-t-violet-500 rounded-full animate-spin"></div>
                          <span className="text-sm font-semibold"><span className="text-violet-600 dark:text-violet-400 font-black">{currentSpeaker?.name || '?'}</span>님이 발언 중입니다...</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : interviewType === 'pt' ? (
          /* ── PT 면접 ── */
          <div className="flex flex-col gap-5">
            {/* ── Setup 단계 ── */}
            {ptPhase === null && (
              <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
                <div className="h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500"></div>
                <div className="px-8 py-10 flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-violet-400/20 rounded-full blur-2xl scale-150"></div>
                      <div className="relative w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl">📊</div>
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-zinc-900 dark:text-white">PT면접 주제 설정</h2>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm">카테고리 선택 후 AI가 주제를 생성합니다</p>
                    </div>
                  </div>

                  {/* 카테고리 선택 */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">카테고리</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {([['business','📈','경영/전략'],['tech','💻','IT/기술'],['marketing','📣','마케팅'],['finance','💰','금융/경제'],['social','🌍','사회/이슈'],['hr','🤝','조직/인사']] as const).map(([id, icon, label]) => (
                        <button key={id} onClick={() => setPtCategory(id)}
                          className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${ptCategory === id ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300' : 'border-gray-100 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:border-violet-300 dark:hover:border-violet-500/30'}`}>
                          <span>{icon}</span>{label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 직접 주제 입력 토글 */}
                  <div>
                    <button onClick={() => setPtUseCustom(v => !v)}
                      className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
                      {ptUseCustom ? '▲ AI 주제 생성으로 돌아가기' : '▼ 직접 주제 입력하기'}
                    </button>
                    {ptUseCustom && (
                      <textarea
                        rows={2} maxLength={100} placeholder="발표 주제를 직접 입력하세요 (예: 친환경 포장재 도입 전략)"
                        value={ptCustomTopic} onChange={e => setPtCustomTopic(e.target.value)}
                        className="mt-3 w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-medium focus:outline-none focus:border-violet-500 transition-colors resize-none text-sm"
                      />
                    )}
                  </div>

                  {/* PDF 슬라이드 업로드 */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">발표 자료 (선택)</label>
                    <label className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-violet-400 dark:hover:border-violet-500/40 cursor-pointer transition-all bg-gray-50 dark:bg-white/5">
                      <span className="text-2xl">{ptSlidesLoading ? '⏳' : ptSlides.length > 0 ? '✅' : '📎'}</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          {ptSlidesLoading ? 'PDF 로딩 중...' : ptSlides.length > 0 ? `슬라이드 ${ptSlides.length}장 로드됨` : 'PDF 파일 업로드 (선택)'}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">발표 중 슬라이드를 화면에 표시합니다</p>
                      </div>
                      <input type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadPdfSlides(f); }} />
                    </label>
                  </div>

                  {ptTopicError && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-3 rounded-xl">⚠️ {ptTopicError}</p>}

                  <button onClick={handleGeneratePtTopic} disabled={ptIsGenerating || (ptUseCustom && !ptCustomTopic.trim())}
                    className="w-full px-6 py-4 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl shadow-lg shadow-violet-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {ptIsGenerating ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> 주제 생성 중...</> : '🚀 PT면접 시작하기'}
                  </button>
                </div>
              </div>
            )}

            {/* ── 준비 단계 ── */}
            {ptPhase === 'prep' && (
              <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
                <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500"></div>
                <div className="px-8 py-10 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">준비 시간</p>
                      <h2 className="text-xl font-black text-zinc-900 dark:text-white">발표를 준비하세요</h2>
                    </div>
                    <div className="text-center">
                      <div className={`text-4xl font-black tabular-nums ${ptPrepTimeLeft <= 60 ? 'text-rose-500' : 'text-amber-500'}`}>
                        {String(Math.floor(ptPrepTimeLeft / 60)).padStart(2, '0')}:{String(ptPrepTimeLeft % 60).padStart(2, '0')}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">남은 준비 시간</p>
                    </div>
                  </div>

                  <div className="bg-violet-50 dark:bg-violet-500/10 rounded-2xl p-6 border border-violet-100 dark:border-violet-500/20">
                    <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-3">발표 주제</p>
                    <h3 className="text-xl font-black text-violet-900 dark:text-violet-100 leading-snug mb-4">{ptTopic}</h3>
                    {ptOutline.length > 0 && (
                      <>
                        <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-2">발표 구조 (참고)</p>
                        <ol className="space-y-2">
                          {ptOutline.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-violet-800 dark:text-violet-200">
                              <span className="w-5 h-5 rounded-full bg-violet-200 dark:bg-violet-500/30 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">{i + 1}</span>
                              {item}
                            </li>
                          ))}
                        </ol>
                      </>
                    )}
                  </div>

                  <button onClick={() => { setPtPhase('presenting'); ptTranscriptRef.current = ''; setSttText(''); finalizedTextRef.current = ''; analysisDataRef.current = { totalFrames: 0, lookAwayFrames: 0, mouthOpenFrames: 0 }; }}
                    className="w-full px-6 py-4 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl shadow-lg shadow-violet-600/25 transition-all hover:-translate-y-0.5">
                    📊 발표 시작하기
                  </button>
                </div>
              </div>
            )}

            {/* ── 발표 단계 ── */}
            {ptPhase === 'presenting' && (
              <>
                {/* 상태 바 */}
                <div className="bg-white dark:bg-[#111118] rounded-2xl border border-gray-100 dark:border-white/5 px-6 py-4 shadow-md flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-0.5">발표 주제</p>
                    <p className="font-bold text-zinc-800 dark:text-white text-sm truncate">{ptTopic}</p>
                  </div>
                  <div className="text-center flex-shrink-0">
                    <div className={`text-3xl font-black tabular-nums ${ptPresentTimeLeft <= 60 ? 'text-rose-500 animate-pulse' : 'text-violet-600 dark:text-violet-400'}`}>
                      {String(Math.floor(ptPresentTimeLeft / 60)).padStart(2, '0')}:{String(ptPresentTimeLeft % 60).padStart(2, '0')}
                    </div>
                    <p className="text-xs text-zinc-400">발표 시간</p>
                  </div>
                </div>

                {/* 슬라이드 + 카메라 레이아웃 */}
                <div className={`grid gap-4 ${ptSlides.length > 0 ? 'grid-cols-1 lg:grid-cols-[1fr_auto]' : 'grid-cols-1'}`}>
                  {ptSlides.length > 0 && (
                    <div className="bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                      <img src={ptSlides[ptCurrentSlide]} alt={`슬라이드 ${ptCurrentSlide + 1}`} className="w-full object-contain" />
                      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80">
                        <button onClick={() => setPtCurrentSlide(s => Math.max(0, s - 1))} disabled={ptCurrentSlide === 0}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-30 transition-all">← 이전</button>
                        <span className="text-xs text-zinc-400 font-semibold">{ptCurrentSlide + 1} / {ptSlides.length}</span>
                        <button onClick={() => setPtCurrentSlide(s => Math.min(ptSlides.length - 1, s + 1))} disabled={ptCurrentSlide === ptSlides.length - 1}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-30 transition-all">다음 →</button>
                      </div>
                    </div>
                  )}

                  {/* 카메라 */}
                  <div className={`relative bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5 ${ptSlides.length > 0 ? 'w-full lg:w-72 aspect-video lg:aspect-auto' : 'w-full aspect-video'}`}>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80" />
                    {isFaceDetected && (
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        <StatusBadge ok={isFaceCentered} okLabel="위치 안정" failLabel="위치 이탈" okIcon="🎯" failIcon="⚠️" />
                        <StatusBadge ok={!isLookingAway} okLabel="시선 집중" failLabel="시선 이탈" okIcon="👀" failIcon="⚠️" />
                      </div>
                    )}
                    {isRecording && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-rose-500/90 text-white text-xs font-black px-2.5 py-1 rounded-full">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> REC
                      </div>
                    )}
                    <div className="absolute bottom-3 inset-x-3">
                      <div className="bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-xl text-center min-h-[44px] flex items-center justify-center border border-white/10">
                        {sttText ? <p className="text-xs leading-relaxed">{sttText.slice(-120)}</p> : <p className="text-white/35 text-xs">답변을 녹음하면 자막이 표시됩니다...</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 발표 아웃라인 힌트 */}
                {ptOutline.length > 0 && (
                  <div className="bg-violet-50 dark:bg-violet-500/10 rounded-2xl px-5 py-4 border border-violet-100 dark:border-violet-500/20">
                    <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-2">발표 구조</p>
                    <div className="flex flex-wrap gap-2">
                      {ptOutline.map((item, i) => (
                        <span key={i} className="text-xs px-3 py-1 bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 rounded-lg font-semibold">{i + 1}. {item}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 녹음 + 제출 */}
                <div className="flex gap-3">
                  <button onClick={toggleRecording}
                    className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-base transition-all shadow-lg hover:-translate-y-0.5 ${isRecording ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/25'}`}>
                    {isRecording ? <><span className="w-4 h-4 bg-white rounded-sm"></span> 녹음 종료</> : <><span>🎙️</span> 발표 녹음 시작</>}
                  </button>
                  <button onClick={() => {
                    if (isRecording && mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); socket.emit('stop_audio_stream'); }
                    ptTranscriptRef.current = sttText;
                    socket.emit('pt_submit_presentation', { topic: ptTopic, transcript: sttText, analysis: analysisDataRef.current });
                  }}
                    className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold border border-gray-200 dark:border-zinc-700 shadow-md hover:-translate-y-0.5 transition-all">
                    <span>✅</span> 발표 완료
                  </button>
                </div>
              </>
            )}

            {/* ── Q&A 단계 ── */}
            {ptPhase === 'qa' && (
              <>
                {/* 발표 피드백 요약 */}
                {ptPresentationFeedback && (
                  <div className="bg-violet-50 dark:bg-violet-500/10 rounded-2xl border border-violet-100 dark:border-violet-500/20 px-6 py-4">
                    <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-2">발표 평가</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-black text-violet-700 dark:text-violet-300 text-lg">{ptPresentationFeedback.answerScore}점</span>
                      <span className="text-xs px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg">✅ {ptPresentationFeedback.feedback?.good}</span>
                      <span className="text-xs px-3 py-1 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-lg">⚡ {ptPresentationFeedback.feedback?.bad}</span>
                    </div>
                  </div>
                )}

                {/* Q&A 질문 카드 */}
                <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
                  <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
                  <div className="px-8 py-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Q&A {ptQAIndex + 1} / {ptTotalQA}</span>
                      {ptQAFeedback && <span className="text-xs font-black px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full">{ptQAFeedback.answerScore}점</span>}
                    </div>
                    <h2 className="text-xl font-bold text-zinc-800 dark:text-white leading-snug">{ptQAQuestion}</h2>
                  </div>
                </div>

                {/* 카메라 */}
                <div className="relative w-full aspect-video bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80" />
                  {isFaceDetected && (
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <StatusBadge ok={isFaceCentered} okLabel="위치 안정적" failLabel="위치 이탈" okIcon="🎯" failIcon="⚠️" />
                      <StatusBadge ok={!isLookingAway} okLabel="시선 집중" failLabel="모니터 응시 요망" okIcon="👀" failIcon="⚠️" />
                    </div>
                  )}
                  {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-rose-500/90 backdrop-blur-sm text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> REC
                    </div>
                  )}
                  <div className="absolute bottom-5 inset-x-5 flex justify-center">
                    <div className="bg-black/70 backdrop-blur-md text-white px-6 py-4 rounded-2xl max-w-3xl w-full text-center min-h-[60px] flex items-center justify-center border border-white/10">
                      {sttText ? <p className="text-base leading-relaxed font-medium">{sttText}</p> : <p className="text-white/35 text-sm">답변을 녹음하면 자막이 표시됩니다...</p>}
                    </div>
                  </div>
                </div>

                {/* 피드백 또는 컨트롤 */}
                {ptQAFeedback ? (
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 px-6 py-5 space-y-3">
                    <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">💡 AI 피드백</p>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-100 dark:border-emerald-500/20">✅ {ptQAFeedback.feedback?.good}</span>
                      <span className="text-xs px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-100 dark:border-rose-500/20">⚡ {ptQAFeedback.feedback?.bad}</span>
                    </div>
                    <p className="text-xs text-zinc-400">다음 질문으로 이동하거나 결과를 기다려주세요...</p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={toggleRecording}
                      className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-base transition-all shadow-lg hover:-translate-y-0.5 ${isRecording ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'}`}>
                      {isRecording ? <><span className="w-4 h-4 bg-white rounded-sm"></span> 녹음 종료</> : <><span>🎙️</span> 답변 녹음 시작</>}
                    </button>
                    <button onClick={() => {
                      if (isRecording && mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); socket.emit('stop_audio_stream'); }
                      socket.emit('pt_submit_qa_answer', { question: ptQAQuestion, answer: sttText, analysis: analysisDataRef.current });
                    }}
                      className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold border border-gray-200 dark:border-zinc-700 shadow-md hover:-translate-y-0.5 transition-all">
                      <span>✅</span> 답변 제출
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : interviewType === 'group' ? (
          /* ── 집단면접 ── */
          <div className="flex flex-col gap-5">
            {groupSetupStep === 'setup' && (
              <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
                <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
                <div className="px-8 py-10 flex flex-col gap-6">
                  {/* 헤더 */}
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-2xl scale-150"></div>
                      <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl">👥</div>
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-zinc-900 dark:text-white">집단면접 입장</h2>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm">이름을 입력하고 방을 선택하거나 만드세요</p>
                    </div>
                  </div>

                  {/* 이름 입력 */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">내 이름</label>
                    <input
                      type="text" maxLength={12} placeholder="이름을 입력하세요"
                      value={groupMyName} onChange={e => setGroupMyName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-emerald-500 transition-colors text-lg"
                    />
                  </div>

                  {/* 탭 */}
                  <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-2xl p-1">
                    {([['list', '📋 공개 방 목록'], ['private', '🔒 비밀 방'], ['create', '🏠 방 만들기']] as const).map(([tab, label]) => (
                      <button key={tab} onClick={() => { setGroupSetupTab(tab); setGroupRoomError(null); if (tab === 'list') socket.emit('get_room_list'); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${groupSetupTab === tab ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* 공개 방 목록 탭 */}
                  {groupSetupTab === 'list' && (
                    <div className="space-y-2">
                      {roomList.length === 0 ? (
                        <div className="text-center py-10 text-zinc-400">
                          <p className="text-3xl mb-2">🏠</p>
                          <p className="text-sm font-semibold">대기 중인 공개 방이 없습니다</p>
                          <p className="text-xs mt-1">방을 만들거나 비밀 방에 참가하세요</p>
                        </div>
                      ) : (
                        roomList.map(r => (
                          <div key={r.code} className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-zinc-800 dark:text-zinc-100 truncate">{r.roomName}</p>
                              <p className="text-xs text-zinc-400 mt-0.5">참가자 {r.participantCount}명</p>
                            </div>
                            <button
                              onClick={() => { setGroupRoomError(null); socket.emit('join_group_room', { code: r.code, name: groupMyName }); }}
                              disabled={!groupMyName.trim()}
                              className="flex-shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              참가 →
                            </button>
                          </div>
                        ))
                      )}
                      <button onClick={() => socket.emit('get_room_list')} className="w-full py-2 text-xs text-zinc-400 hover:text-emerald-500 transition-colors font-semibold">
                        🔄 목록 새로고침
                      </button>
                    </div>
                  )}

                  {/* 비밀 방 탭 */}
                  {groupSetupTab === 'private' && (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">방장으로부터 받은 코드와 비밀번호를 입력하세요.</p>
                      <input
                        type="text" maxLength={6} placeholder="방 코드 6자리"
                        value={groupJoinCode} onChange={e => setGroupJoinCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-bold focus:outline-none focus:border-blue-500 transition-colors text-center tracking-widest text-lg"
                      />
                      <input
                        type="password" placeholder="비밀번호"
                        value={groupJoinPassword} onChange={e => setGroupJoinPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button
                        onClick={() => { setGroupRoomError(null); socket.emit('join_group_room', { code: groupJoinCode, name: groupMyName, password: groupJoinPassword }); }}
                        disabled={!groupMyName.trim() || groupJoinCode.length < 6}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        🔒 비밀 방 입장
                      </button>
                    </div>
                  )}

                  {/* 방 만들기 탭 */}
                  {groupSetupTab === 'create' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">방 이름</label>
                        <input
                          type="text" maxLength={20} placeholder={groupMyName ? `${groupMyName}의 방` : '방 이름을 입력하세요'}
                          value={groupRoomName} onChange={e => setGroupRoomName(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>

                      {/* 공개/비밀 토글 */}
                      <div className="flex gap-2">
                        <button onClick={() => setGroupIsPrivate(false)}
                          className={`flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${!groupIsPrivate ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-200 dark:border-white/10 text-zinc-500 hover:border-emerald-400'}`}>
                          🌐 공개 방
                        </button>
                        <button onClick={() => setGroupIsPrivate(true)}
                          className={`flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${groupIsPrivate ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 dark:border-white/10 text-zinc-500 hover:border-blue-400'}`}>
                          🔒 비밀 방
                        </button>
                      </div>

                      {groupIsPrivate && (
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">비밀번호</label>
                          <input
                            type="password" placeholder="참가자에게 공유할 비밀번호"
                            value={groupRoomPassword} onChange={e => setGroupRoomPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setGroupRoomError(null);
                          socket.emit('create_group_room', {
                            name: groupMyName,
                            roomName: groupRoomName || undefined,
                            isPrivate: groupIsPrivate,
                            password: groupIsPrivate ? groupRoomPassword : undefined,
                          });
                        }}
                        disabled={!groupMyName.trim() || (groupIsPrivate && !groupRoomPassword.trim())}
                        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        🏠 방 만들기
                      </button>
                    </div>
                  )}

                  {groupRoomError && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-3 rounded-xl">⚠️ {groupRoomError}</p>}
                </div>
              </div>
            )}

            {groupSetupStep === 'waiting' && (
              /* 대기실 */
              <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
                <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                <div className="px-8 py-10 flex flex-col items-center gap-6">
                  <div className="text-center">
                    <h2 className="text-xl font-black text-zinc-800 dark:text-white mb-1">대기실</h2>
                    <div className="flex items-center gap-2 justify-center flex-wrap">
                      {groupIsPrivate && <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full">🔒 비밀 방</span>}
                      <span className="font-black text-2xl tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-4 py-1 rounded-xl border border-blue-100 dark:border-blue-500/20">{groupRoomCode}</span>
                      <button onClick={() => navigator.clipboard.writeText(groupRoomCode)} className="text-xs text-zinc-400 hover:text-blue-500 transition-colors">복사</button>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{groupIsPrivate ? '비밀번호와 함께 코드를 참가자들에게 공유하세요' : '이 코드를 참가자들에게 공유하세요'}</p>
                  </div>

                  {/* 참가자 목록 */}
                  <div className="w-full max-w-md">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">참가자 ({groupParticipants.length}명)</p>
                    <div className="space-y-2">
                      {groupParticipants.map((p: any, i: number) => (
                        <div key={p.socketId} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                          <span className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-black">{i + 1}</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex-1">{p.name}</span>
                          {p.socketId === socket.id && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">나</span>}
                          {p.socketId === groupParticipants[0]?.socketId && <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">방장</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 방장만 시작 버튼 */}
                  {isGroupHost ? (
                    <button
                      onClick={() => socket.emit('start_group_interview', { code: groupRoomCode, customQuestions: generatedQuestions || [] })}
                      disabled={groupParticipants.length < 1}
                      className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-40"
                    >
                      🚀 면접 시작하기 ({groupParticipants.length}명)
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 text-zinc-500">
                      <div className="w-5 h-5 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin"></div>
                      <span className="text-sm">방장이 면접을 시작할 때까지 대기 중...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {groupSetupStep === 'interviewing' && (() => {
              const isMyTurn = groupCurrentAnswererId === mySocketId;
              const myName = groupParticipants.find((p: any) => p.socketId === mySocketId)?.name || '';
              const currentAnswererName = groupParticipants.find((p: any) => p.socketId === groupCurrentAnswererId)?.name || '?';

              return (
                <>
                  {/* 진행 상황 + 질문 */}
                  <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
                    <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                    <div className="px-8 py-8">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">질문 {groupQuestionIndex + 1} / {groupTotalQuestions}</span>
                        {isMyTurn
                          ? <span className="text-xs font-black px-3 py-1 bg-emerald-500 text-white rounded-full animate-pulse">내 차례</span>
                          : <span className="text-xs font-bold px-3 py-1 bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 rounded-full">{currentAnswererName} 답변 중</span>}
                      </div>
                      <h2 className="text-xl font-bold text-zinc-800 dark:text-white leading-snug">
                        {groupCurrentQuestion.replace(/^\d+\.\s*/, '')}
                      </h2>
                    </div>
                  </div>

                  {/* 답변 순서 */}
                  <div className="bg-white dark:bg-[#111118] rounded-2xl border border-gray-100 dark:border-white/5 px-6 py-4 shadow-md">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">답변 순서</p>
                    <div className="flex flex-wrap gap-2">
                      {groupAnswererOrder.map((p: any, i: number) => {
                        const isCurrent = p.socketId === groupCurrentAnswererId;
                        const isAnswered = groupAnswererOrder.slice(0, i).some((prev: any) => prev.socketId !== groupCurrentAnswererId) && !isCurrent;
                        return (
                          <span key={p.socketId} className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all ${
                            isCurrent ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' :
                            'bg-gray-50 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border-gray-100 dark:border-white/5'
                          }`}>
                            {i + 1}. {p.name} {p.socketId === mySocketId ? '(나)' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* 비디오 + 컨트롤 */}
                  <div className="relative w-full aspect-video bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80" />
                    {isFaceDetected && (
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <StatusBadge ok={isFaceCentered} okLabel="위치 안정적" failLabel="위치 이탈" okIcon="🎯" failIcon="⚠️" />
                        <StatusBadge ok={!isLookingAway} okLabel="시선 집중" failLabel="모니터 응시 요망" okIcon="👀" failIcon="⚠️" />
                      </div>
                    )}
                    {!isFaceDetected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-zinc-900/95 border border-white/10 text-white px-8 py-6 rounded-2xl flex flex-col items-center gap-3">
                          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <p className="text-base font-semibold text-white/80">얼굴을 화면 중앙에 맞춰주세요</p>
                        </div>
                      </div>
                    )}
                    {/* 자막 */}
                    <div className="absolute bottom-5 inset-x-5 flex justify-center">
                      <div className="bg-black/70 backdrop-blur-md text-white px-6 py-4 rounded-2xl max-w-3xl w-full text-center min-h-[60px] flex items-center justify-center border border-white/10">
                        {sttText ? <p className="text-base leading-relaxed font-medium">{sttText}</p> : <p className="text-white/35 text-sm">{isMyTurn ? '답변을 녹음하면 자막이 표시됩니다...' : `${currentAnswererName}님이 답변 중입니다...`}</p>}
                      </div>
                    </div>
                    {isRecording && (
                      <div className="absolute top-4 right-4 flex items-center gap-2 bg-rose-500/90 backdrop-blur-sm text-white text-xs font-black px-3 py-1.5 rounded-full border border-rose-400/30 shadow-lg">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> REC
                      </div>
                    )}
                  </div>

                  {/* 내 차례일 때만 녹음 컨트롤 */}
                  {isMyTurn && !groupAnswerFeedback && (
                    <div className="flex gap-3">
                      <button
                        onClick={toggleRecording}
                        className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-base transition-all shadow-lg ${isRecording ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'} hover:-translate-y-0.5`}
                      >
                        {isRecording ? <><span className="w-4 h-4 bg-white rounded-sm"></span> 녹음 종료</> : <><span className="text-lg">🎙️</span> 답변 녹음 시작</>}
                      </button>
                      <button
                        onClick={() => {
                          if (isRecording && mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); socket.emit('stop_audio_stream'); }
                          socket.emit('group_submit_answer', { code: groupRoomCode, answer: sttText, analysis: analysisDataRef.current });
                        }}
                        className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold border border-gray-200 dark:border-zinc-700 shadow-md hover:-translate-y-0.5 transition-all"
                      >
                        <span className="text-lg">✅</span> 답변 제출
                      </button>
                    </div>
                  )}

                  {/* 내 차례 아닐 때 또는 제출 후 피드백 */}
                  {(!isMyTurn || groupAnswerFeedback) && (
                    <div className={`rounded-2xl border px-6 py-5 ${groupAnswerFeedback ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'}`}>
                      {groupAnswerFeedback ? (
                        <>
                          <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-3">💡 내 답변 피드백</p>
                          <div className="flex gap-2 flex-wrap mb-2">
                            <span className="text-xs px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-100 dark:border-emerald-500/20">✅ {groupAnswerFeedback.feedback?.good}</span>
                            <span className="text-xs px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-100 dark:border-rose-500/20">⚡ {groupAnswerFeedback.feedback?.bad}</span>
                          </div>
                          <p className="text-xs text-zinc-500">다음 참가자가 답변 중입니다...</p>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 text-zinc-500">
                          <div className="w-5 h-5 border-2 border-zinc-300 border-t-emerald-500 rounded-full animate-spin"></div>
                          <span className="text-sm font-semibold"><span className="text-emerald-600 dark:text-emerald-400 font-black">{currentAnswererName}</span>님이 답변 중입니다...</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          /* ── 인터뷰 메인 스테이지 ── */
          <div className="flex flex-col gap-5">

            {/* 질문 카드 */}
            <div className="bg-white dark:bg-[#111118] rounded-3xl shadow-xl shadow-blue-900/5 dark:shadow-black/30 border border-gray-100 dark:border-white/5 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <div className="px-8 py-10 flex flex-col items-center justify-center min-h-[140px] text-center">
                {!currentQuestion ? (
                  <button
                    onClick={() => socket.emit('start_interview', {
                      customQuestions: generatedQuestions || [],
                      interviewType: interviewType || 'individual',
                      language: interviewType === 'foreign' ? foreignLanguage : 'ko-KR',
                    })}
                    className="px-10 py-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-gray-50 text-white dark:text-zinc-900 font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 text-lg"
                  >
                    면접 시작하기
                  </button>
                ) : (
                  <div className="flex items-start gap-4 text-left w-full max-w-3xl">
                    <span className={`flex-shrink-0 w-10 h-10 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg mt-1 ${
                      isCurrentFollowup
                        ? 'bg-gradient-to-br from-orange-400 to-rose-500 shadow-orange-500/25'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-600/25'
                    }`}>
                      Q
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {isCurrentFollowup && (
                        <span className="self-start text-xs font-black px-2.5 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full border border-orange-200 dark:border-orange-500/30">
                          🔁 꼬리 질문
                        </span>
                      )}
                      <h2 className="text-xl md:text-2xl font-bold text-zinc-800 dark:text-white leading-snug">
                        {currentQuestion.replace(new RegExp('^\\d+\\.\\s*'), '')}
                      </h2>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 비디오 영역 */}
            <div className="relative w-full aspect-video bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl shadow-black/30 ring-1 ring-white/5">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80"
              />

              {/* 상태 뱃지 (좌측 상단) */}
              {isFaceDetected && (
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <StatusBadge
                    ok={isFaceCentered}
                    okLabel="위치 안정적"
                    failLabel="위치 이탈"
                    okIcon="🎯"
                    failIcon="⚠️"
                  />
                  <StatusBadge
                    ok={!isLookingAway}
                    okLabel="시선 집중"
                    failLabel="모니터 응시 요망"
                    okIcon="👀"
                    failIcon="⚠️"
                  />
                  <StatusBadge
                    ok={isMouthOpen}
                    okLabel="발화 감지됨"
                    failLabel="답변 대기 중"
                    okIcon="🗣️"
                    failIcon="🤐"
                    neutralOnFail
                  />
                </div>
              )}

              {/* 얼굴 미인식 오버레이 */}
              {!isFaceDetected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="bg-zinc-900/95 border border-white/10 text-white px-8 py-6 rounded-2xl flex flex-col items-center gap-3 shadow-2xl">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <p className="text-base font-semibold text-white/80">얼굴을 화면 중앙에 맞춰주세요</p>
                  </div>
                </div>
              )}

              {/* 실시간 자막 */}
              <div className="absolute bottom-5 inset-x-5 flex justify-center">
                <div className="bg-black/70 backdrop-blur-md text-white px-6 py-4 rounded-2xl max-w-3xl w-full text-center min-h-[60px] flex items-center justify-center border border-white/10 shadow-2xl">
                  {sttText ? (
                    <p className="text-base md:text-lg leading-relaxed font-medium">{sttText}</p>
                  ) : (
                    <p className="text-white/35 text-sm">답변을 녹음하면 자막이 여기에 표시됩니다...</p>
                  )}
                </div>
              </div>

              {/* 녹음 중 표시 (우측 상단) */}
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-rose-500/90 backdrop-blur-sm text-white text-xs font-black px-3 py-1.5 rounded-full border border-rose-400/30 shadow-lg shadow-rose-500/30">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  REC
                </div>
              )}
            </div>

            {/* 컨트롤 버튼 */}
            {currentQuestion && !isInterviewFinished && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={toggleRecording}
                  className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-base transition-all shadow-lg ${
                    isRecording
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25 hover:shadow-rose-500/40'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25 hover:shadow-blue-600/40'
                  } hover:-translate-y-0.5`}
                >
                  {isRecording ? (
                    <><span className="w-4 h-4 bg-white rounded-sm flex-shrink-0"></span> 답변 녹음 종료</>
                  ) : (
                    <><span className="text-lg">🎙️</span> 답변 녹음 시작</>
                  )}
                </button>

                <button
                  onClick={() => {
                    socket.emit('submit_answer', {
                      question: currentQuestion,
                      answer: sttText,
                      analysis: analysisDataRef.current,
                      isFollowup: isCurrentFollowup,
                    });
                    setSttText('');
                    finalizedTextRef.current = '';
                    analysisDataRef.current = { totalFrames: 0, lookAwayFrames: 0, mouthOpenFrames: 0 };
                    socket.emit('request_next_question');
                  }}
                  className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold text-base transition-all border border-gray-200 dark:border-zinc-700 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  <span className="text-lg">⏭️</span> 제출 후 다음 질문
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── 헬퍼 컴포넌트 ──────────────────────────────────────────────────────────
function StatusBadge({
  ok, okLabel, failLabel, okIcon, failIcon, neutralOnFail = false,
}: {
  ok: boolean;
  okLabel: string;
  failLabel: string;
  okIcon: string;
  failIcon: string;
  neutralOnFail?: boolean;
}) {
  const base = 'backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5';
  const okStyle = 'bg-emerald-500/20 text-emerald-200 border-emerald-400/25';
  const failStyle = neutralOnFail
    ? 'bg-zinc-500/20 text-zinc-300 border-zinc-400/20'
    : 'bg-rose-500/20 text-rose-200 border-rose-400/25';

  return (
    <span className={`${base} ${ok ? okStyle : failStyle}`}>
      {ok ? okIcon : failIcon}
      {ok ? okLabel : failLabel}
    </span>
  );
}
