'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { socket } from './socket';
import type { Results } from '@mediapipe/face_mesh';

import { LandingPage } from './components/LandingPage';
import { AuthPanel } from './components/auth-panel';
import { MediaPermission } from './components/MediaPermission';
import { ResumeUpload } from './components/ResumeUpload';
import { InterviewTypeSelect } from './components/InterviewTypeSelect';
import { GeneralInterview } from './components/interview/GeneralInterview';
import { GroupInterview } from './components/interview/GroupInterview';
import { PTInterview } from './components/interview/PTInterview';
import { DebateInterview } from './components/interview/DebateInterview';
import { GeneralReport } from './components/results/GeneralReport';
import { GroupReport } from './components/results/GroupReport';
import { PTReport } from './components/results/PTReport';
import { DebateReport } from './components/results/DebateReport';
import { loginWithPassword, signUpWithPassword } from './lib/auth';

const API_BASE = '';

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const authParam = searchParams.get('auth');
  const authView = authParam === 'login' || authParam === 'signup' ? authParam : null;

  const [landingDone, setLandingDone] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [userName, setUserName] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // 미디어 제어용 상태
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const compositeRafRef = useRef<number | null>(null);
  const activeQuestionRef = useRef<string | null>(null);
  const startVideoRecordingCbRef = useRef<() => void>(() => {});
  const stopAndUploadVideoCbRef = useRef<(cat: string) => Promise<void>>(() => Promise.resolve());

  // 이력서 업로드 관련 상태
  const [resumeStepDone, setResumeStepDone] = useState<boolean>(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<string[] | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // 면접 유형 선택 상태
  const [interviewType, setInterviewType] = useState<string | null>(null);
  const [saveVideo, setSaveVideo] = useState<boolean>(false);
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

  const analysisDataRef = useRef({
    totalFrames: 0,
    lookAwayFrames: 0,
    mouthOpenFrames: 0,
  });
  const finalizedTextRef = useRef<string>('');
  const reportRef = useRef<HTMLDivElement>(null);

  const updateAuthRoute = (nextView: 'login' | 'signup' | null) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (nextView) {
      nextParams.set('auth', nextView);
    } else {
      nextParams.delete('auth');
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const handleAuthViewChange = (nextView: 'login' | 'signup') => {
    setAuthError(null);
    setAuthMessage(null);
    setPassword('');
    updateAuthRoute(nextView);
  };

  const handleAuthSubmit = async () => {
    setAuthError(null);
    setAuthMessage(null);

    if (!authView) {
      return;
    }

    if (authView === 'login') {
      if (!identifier.trim() || !password.trim()) {
        setAuthError('아이디 또는 이메일과 비밀번호를 입력해주세요.');
        return;
      }
    } else {
      if (!loginId.trim() || !email.trim() || !nickname.trim() || !password.trim()) {
        setAuthError('아이디, 이메일, 닉네임, 비밀번호는 필수입니다.');
        return;
      }
    }

    setIsSubmittingAuth(true);

    try {
      if (authView === 'login') {
        const result = await loginWithPassword({
          identifier: identifier.trim(),
          password,
        });

        setAuthMessage(result.message);
        setPassword('');
        updateAuthRoute(null);
      } else {
        const result = await signUpWithPassword({
          loginId: loginId.trim(),
          email: email.trim(),
          password,
          nickname: nickname.trim(),
          userName: userName.trim() || undefined,
        });

        setAuthMessage(result.message);
        setIdentifier(loginId.trim());
        setPassword('');
        updateAuthRoute(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '인증 처리 중 오류가 발생했습니다.';
      setAuthError(message);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  useEffect(() => { mediaStreamRef.current = mediaStream; }, [mediaStream]);
  useEffect(() => { activeQuestionRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { if (groupCurrentQuestion) activeQuestionRef.current = groupCurrentQuestion; }, [groupCurrentQuestion]);
  useEffect(() => { if (ptQAQuestion) activeQuestionRef.current = ptQAQuestion; }, [ptQAQuestion]);

  // ── 소켓 이벤트 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setMySocketId(socket.id ?? '');
      socket.emit('get_room_list');
      socket.emit('get_debate_room_list');
    }
    function onDisconnect() {
      setIsConnected(false);
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
      startVideoRecordingCbRef.current();
      setCurrentQuestion(data.question);
      setIsInterviewFinished(data.isEnd);
      setIsCurrentFollowup(data.isFollowup || false);
    });
    socket.on('interview_finished', (results: any[]) => {
      stopAndUploadVideoCbRef.current('individual').then(() => setReportData(results));
    });

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
    socket.on('group_room_updated', (data: any) => setGroupParticipants(data.room.participants));
    socket.on('group_room_error', (data: any) => setGroupRoomError(data.error));
    socket.on('room_list_updated', (list: any[]) => setRoomList(list));
    socket.on('group_question', (data: any) => {
      startVideoRecordingCbRef.current();
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
      stopAndUploadVideoCbRef.current('group').then(() => setGroupResults(data));
    });

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
    socket.on('pt_qa_feedback', (data: any) => setPtQAFeedback(data));
    socket.on('pt_next_qa', (data: any) => {
      setPtQAQuestion(data.question);
      setPtQAIndex(data.qaIndex);
      setPtQAFeedback(null);
      setSttText('');
      finalizedTextRef.current = '';
      analysisDataRef.current = { totalFrames: 0, lookAwayFrames: 0, mouthOpenFrames: 0 };
    });
    socket.on('pt_finished', (results: any[]) => {
      stopAndUploadVideoCbRef.current('pt').then(() => setPtResults(results));
    });

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
      startVideoRecordingCbRef.current();
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
    socket.on('debate_finished', (data: any) => {
      stopAndUploadVideoCbRef.current('discussion').then(() => setDebateResults(data));
    });

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (reportData) {
      window.parent.postMessage({ type: 'AI_INTERVIEW_COMPLETED', payload: reportData }, '*');
    }
  }, [reportData]);

  useEffect(() => {
    if (hasMediaPermission && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [hasMediaPermission, mediaStream, resumeStepDone, interviewTypeStepDone, groupSetupStep, ptPhase, debateSetupStep]);

  // ── MediaPipe Face Mesh ───────────────────────────────────────────────────────
  useEffect(() => {
    const isVideoPhase = (interviewType !== 'group' || groupSetupStep === 'interviewing') &&
                         (interviewType !== 'pt' || ptPhase === 'presenting' || ptPhase === 'qa') &&
                         (interviewType !== 'discussion' || debateSetupStep === 'debating');
    if (!hasMediaPermission || !resumeStepDone || !interviewTypeStepDone || !isVideoPhase || !videoRef.current) return;

    const faceMeshModule = require('@mediapipe/face_mesh');
    const FaceMesh = faceMeshModule.FaceMesh || (window as any).FaceMesh;
    const faceMesh = new FaceMesh({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
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

  // ── PT 타이머 ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (ptPhase !== 'prep') return;
    const id = setInterval(() => setPtPrepTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [ptPhase]);

  useEffect(() => {
    if (ptPhase !== 'presenting') return;
    setPtPresentTimeLeft(300);
    const id = setInterval(() => {
      setPtPresentTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          if (isRecording && mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); socket.emit('stop_audio_stream'); }
          socket.emit('pt_submit_presentation', { topic: ptTopic, transcript: ptTranscriptRef.current, analysis: analysisDataRef.current });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [ptPhase]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── 핸들러 함수들 ────────────────────────────────────────────────────────────

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

  const handleGeneratePtTopic = async () => {
    setPtIsGenerating(true);
    setPtTopicError(null);
    try {
      const body = ptUseCustom ? { category: ptCategory, customTopic: ptCustomTopic } : { category: ptCategory };
      const res = await fetch(`${API_BASE}/api/pt-generate-topic`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
    if (!allowed.includes(file.type)) { setResumeError('PDF, DOCX, TXT 파일만 업로드 가능합니다.'); return; }
    setResumeFile(file);
    setResumeError(null);
    setIsGeneratingQuestions(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await fetch(`${API_BASE}/api/generate-questions`, { method: 'POST', body: formData });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || '질문 생성에 실패했습니다.'); }
      const data = await res.json();
      setGeneratedQuestions(data.questions);
    } catch (err: any) {
      setResumeError(err.message || '오류가 발생했습니다. 이력서 없이 진행해주세요.');
      setGeneratedQuestions(null);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const requestMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      setHasMediaPermission(true);
      setMediaError(null);
    } catch (err: any) {
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
        if (event.data.size > 0 && socket.connected) socket.emit('audio_chunk', event.data);
      };
      setSttText('');
      finalizedTextRef.current = '';
      socket.emit('start_audio_stream');
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    }
  };

  const startVideoRecording = () => {
    if (!saveVideo || !mediaStreamRef.current || videoRecorderRef.current) return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    compositeCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d')!;

    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    const drawFrame = () => {
      const cw = canvas.width;
      const ch = canvas.height;

      ctx.save();
      ctx.translate(cw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoEl, 0, 0, cw, ch);
      ctx.restore();

      const question = activeQuestionRef.current;
      if (question) {
        const text = question.replace(/^\d+\.\s*/, '');
        ctx.font = 'bold 24px sans-serif';
        const maxTextWidth = cw - 80;

        // 텍스트 줄바꿈
        const words = text.split(' ');
        const lines: string[] = [];
        let line = '';
        for (const word of words) {
          const test = line + word + ' ';
          if (ctx.measureText(test).width > maxTextWidth && line) {
            lines.push(line.trim());
            line = word + ' ';
          } else {
            line = test;
          }
        }
        if (line) lines.push(line.trim());

        const lineH = 32;
        const padV = 14;
        const boxH = lines.length * lineH + padV * 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        drawRoundRect(16, 16, cw - 32, boxH, 12);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        lines.forEach((l, i) => ctx.fillText(l, 36, 16 + padV + i * lineH, maxTextWidth));
      }

      compositeRafRef.current = requestAnimationFrame(drawFrame);
    };
    drawFrame();

    const canvasStream = canvas.captureStream(30);
    mediaStreamRef.current.getAudioTracks().forEach(t => canvasStream.addTrack(t));

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    videoChunksRef.current = [];
    const recorder = new MediaRecorder(canvasStream, { mimeType });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };
    recorder.start(5000);
    videoRecorderRef.current = recorder;
  };

  const stopAndUploadVideo = (category: string): Promise<void> => {
    return new Promise((resolve) => {
      if (compositeRafRef.current !== null) {
        cancelAnimationFrame(compositeRafRef.current);
        compositeRafRef.current = null;
      }
      compositeCanvasRef.current = null;

      const recorder = videoRecorderRef.current;
      if (!recorder) { resolve(); return; }
      recorder.onstop = async () => {
        const contentType = recorder.mimeType.split(';')[0];
        const blob = new Blob(videoChunksRef.current, { type: contentType });
        videoRecorderRef.current = null;
        videoChunksRef.current = [];
        try {
          const presignRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'}/videos/presign-upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contentType }),
            credentials: 'include',
          });
          const { presignedUrl, key } = await presignRes.json();
          await fetch(presignedUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': contentType } });
          const categoryMap: Record<string, string> = { individual: '개인', group: '집단', pt: 'PT', discussion: '토론', foreign: '외국어' };
          const title = `${categoryMap[category] ?? category}면접 ${new Date().toLocaleDateString('ko-KR')}`;
          await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'}/videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, title, category, price: 0 }),
            credentials: 'include',
          });
        } catch (e) {
          console.error('[video] 업로드 실패:', e);
        }
        resolve();
      };
      recorder.stop();
    });
  };

  // 콜백 ref를 매 렌더마다 최신 함수로 갱신 (소켓 클로저에서 항상 최신 버전 호출 보장)
  useEffect(() => {
    startVideoRecordingCbRef.current = startVideoRecording;
    stopAndUploadVideoCbRef.current = stopAndUploadVideo;
  });

  // PT 면접: 발표 시작 시 녹화 시작
  useEffect(() => {
    if (ptPhase === 'presenting') startVideoRecordingCbRef.current();
  }, [ptPhase]);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const offscreen = document.createElement('canvas');
      offscreen.width = offscreen.height = 1;
      const offCtx = offscreen.getContext('2d')!;
      const toRgba = (raw: string): string | null => {
        try {
          offCtx.clearRect(0, 0, 1, 1);
          offCtx.fillStyle = '#000';
          offCtx.fillStyle = raw;
          offCtx.fillRect(0, 0, 1, 1);
          const [r, g, b, a] = offCtx.getImageData(0, 0, 1, 1).data;
          if (a === 0) return 'transparent';
          return a === 255 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${+(a / 255).toFixed(3)})`;
        } catch { return null; }
      };
      const MODERN_RE = /(?:ok)?lab\([^)]*\)|(?:ok)?lch\([^)]*\)|color-mix\([^,]+,[^)]+\)/gi;
      const normaliseComplex = (val: string) => val.replace(MODERN_RE, (m) => toRgba(m) ?? 'rgba(0,0,0,0.1)');
      const SIMPLE_PROPS = ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color'];
      const COMPLEX_PROPS = ['box-shadow', 'text-shadow'];
      const target = reportRef.current;
      const nodes = [target, ...Array.from(target.querySelectorAll<HTMLElement>('*'))];
      const restores: Array<() => void> = [];
      const patch = (el: HTMLElement, prop: string, value: string) => {
        const prev = el.style.getPropertyValue(prop);
        const prevPri = el.style.getPropertyPriority(prop);
        el.style.setProperty(prop, value, 'important');
        restores.push(() => { el.style.removeProperty(prop); if (prev) el.style.setProperty(prop, prev, prevPri); });
      };
      nodes.forEach((el) => {
        const cs = window.getComputedStyle(el);
        SIMPLE_PROPS.forEach((prop) => { const val = cs.getPropertyValue(prop).trim(); if (!val || val.startsWith('rgb')) return; const rgb = toRgba(val); if (rgb) patch(el, prop, rgb); });
        COMPLEX_PROPS.forEach((prop) => { const val = cs.getPropertyValue(prop).trim(); MODERN_RE.lastIndex = 0; if (!val || val === 'none' || !MODERN_RE.test(val)) return; MODERN_RE.lastIndex = 0; patch(el, prop, normaliseComplex(val)); });
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
      while (heightLeft > 0) { position -= pageHeight; pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight); heightLeft -= pageHeight; }
      pdf.save('AI_Interview_Report.pdf');
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 다운로드 중 오류가 발생했습니다.');
    }
  };

  // ── 결과 화면 라우팅 ─────────────────────────────────────────────────────────
  if (groupResults) return <GroupReport groupResults={groupResults} mySocketId={mySocketId} groupRoomCode={groupRoomCode} />;
  if (debateResults) return <DebateReport debateResults={debateResults} mySocketId={mySocketId} debateTotalRoundsState={debateTotalRoundsState} />;
  if (ptResults) return <PTReport ptResults={ptResults} />;
  if (reportData) return <GeneralReport reportData={reportData} reportRef={reportRef} onDownloadPdf={handleDownloadPdf} />;

  // ── 랜딩 화면 ────────────────────────────────────────────────────────────────
  if (authView) {
    return (
      <AuthPanel
        view={authView}
        identifier={identifier}
        loginId={loginId}
        email={email}
        password={password}
        nickname={nickname}
        userName={userName}
        isSubmitting={isSubmittingAuth}
        authError={authError}
        authMessage={authMessage}
        onViewChange={handleAuthViewChange}
        onIdentifierChange={setIdentifier}
        onLoginIdChange={setLoginId}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onNicknameChange={setNickname}
        onUserNameChange={setUserName}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  if (!landingDone) {
    return <LandingPage onStart={() => setLandingDone(true)} />;
  }

  // ── 메인 화면 ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl flex items-center gap-2 text-xs mb-4 justify-end">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
          isConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-500'
        }`}>
          <span className="relative flex h-1.5 w-1.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${isConnected ? 'bg-emerald-500' : 'bg-rose-400'}`} />
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isConnected ? 'bg-emerald-500' : 'bg-rose-400'}`} />
          </span>
          <span className="font-medium">{isConnected ? '연결됨' : '연결 끊김'}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
          hasMediaPermission ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-400'
        }`}>
          <span className="font-medium">{hasMediaPermission ? '카메라 ON' : '카메라 대기'}</span>
        </div>
      </div>
      <main className="w-full max-w-5xl flex flex-col gap-5">
        {!hasMediaPermission ? (
          <MediaPermission onRequestMedia={requestMedia} mediaError={mediaError} />
        ) : !resumeStepDone ? (
          <ResumeUpload
            resumeFile={resumeFile}
            generatedQuestions={generatedQuestions}
            isGeneratingQuestions={isGeneratingQuestions}
            resumeError={resumeError}
            isDragging={isDragging}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleResumeUpload(file); }}
            onFileInputChange={(e) => { const file = e.target.files?.[0]; if (file) handleResumeUpload(file); }}
            onResumeUpload={handleResumeUpload}
            onNext={() => setResumeStepDone(true)}
            onClearResume={() => { setGeneratedQuestions(null); setResumeFile(null); setResumeError(null); }}
          />
        ) : !interviewTypeStepDone ? (
          <InterviewTypeSelect
            interviewType={interviewType}
            onSelectType={setInterviewType}
            foreignLanguage={foreignLanguage}
            onSelectLanguage={setForeignLanguage}
            saveVideo={saveVideo}
            onToggleSaveVideo={() => setSaveVideo(v => !v)}
            onConfirm={() => setInterviewTypeStepDone(true)}
          />
        ) : interviewType === 'discussion' ? (
          <DebateInterview
            debateSetupStep={debateSetupStep}
            debateSetupTab={debateSetupTab}
            onSetupTabChange={setDebateSetupTab}
            debateMyName={debateMyName}
            onMyNameChange={setDebateMyName}
            debateJoinCode={debateJoinCode}
            onJoinCodeChange={setDebateJoinCode}
            debateJoinPassword={debateJoinPassword}
            onJoinPasswordChange={setDebateJoinPassword}
            debateRoomName={debateRoomName}
            onRoomNameChange={setDebateRoomName}
            debateType={debateType}
            onDebateTypeChange={setDebateType}
            debateTotalRounds={debateTotalRounds}
            onTotalRoundsChange={setDebateTotalRounds}
            debateCategory={debateCategory}
            onCategoryChange={setDebateCategory}
            debateCustomTopic={debateCustomTopic}
            onCustomTopicChange={setDebateCustomTopic}
            debateUseCustom={debateUseCustom}
            onToggleCustom={() => setDebateUseCustom(v => !v)}
            debateTopic={debateTopic}
            debateTopicDesc={debateTopicDesc}
            debateProLabel={debateProLabel}
            debateConLabel={debateConLabel}
            debateIsPrivate={debateIsPrivate}
            onIsPrivateChange={setDebateIsPrivate}
            debateRoomPassword={debateRoomPassword}
            onRoomPasswordChange={setDebateRoomPassword}
            debateIsGenerating={debateIsGenerating}
            debateTopicError={debateTopicError}
            debateRoomError={debateRoomError}
            onClearRoomError={() => setDebateRoomError(null)}
            debateRoomList={debateRoomList}
            onGenerateTopic={handleGenerateDebateTopic}
            debateRoomCode={debateRoomCode}
            debateParticipants={debateParticipants}
            debateIsHost={debateIsHost}
            debateTotalRoundsState={debateTotalRoundsState}
            debateCurrentRound={debateCurrentRound}
            debateCurrentSpeakerId={debateCurrentSpeakerId}
            debateRoundOrder={debateRoundOrder}
            debateMySide={debateMySide}
            debateSpeechTimeLeft={debateSpeechTimeLeft}
            debateSpeechFeedback={debateSpeechFeedback}
            debateRoundSummary={debateRoundSummary}
            debateShowSummary={debateShowSummary}
            mySocketId={mySocketId}
            sttText={sttText}
            videoRef={videoRef}
            canvasRef={canvasRef}
            isFaceDetected={isFaceDetected}
            isFaceCentered={isFaceCentered}
            isLookingAway={isLookingAway}
            isRecording={isRecording}
            onToggleRecording={toggleRecording}
            onSubmitSpeech={() => {
              if (isRecording && mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); socket.emit('stop_audio_stream'); }
              socket.emit('debate_submit_speech', { code: debateRoomCode, speech: sttText, analysis: analysisDataRef.current });
            }}
          />
        ) : interviewType === 'pt' ? (
          <PTInterview
            ptPhase={ptPhase}
            ptCategory={ptCategory}
            onCategoryChange={setPtCategory}
            ptCustomTopic={ptCustomTopic}
            onCustomTopicChange={setPtCustomTopic}
            ptUseCustom={ptUseCustom}
            onToggleCustom={() => setPtUseCustom(v => !v)}
            ptTopic={ptTopic}
            ptOutline={ptOutline}
            ptIsGenerating={ptIsGenerating}
            ptTopicError={ptTopicError}
            ptPrepTimeLeft={ptPrepTimeLeft}
            ptPresentTimeLeft={ptPresentTimeLeft}
            ptSlides={ptSlides}
            ptCurrentSlide={ptCurrentSlide}
            onSlideChange={setPtCurrentSlide}
            ptSlidesLoading={ptSlidesLoading}
            onLoadPdfSlides={loadPdfSlides}
            ptPresentationFeedback={ptPresentationFeedback}
            ptQAQuestion={ptQAQuestion}
            ptQAIndex={ptQAIndex}
            ptTotalQA={ptTotalQA}
            ptQAFeedback={ptQAFeedback}
            onGenerateTopic={handleGeneratePtTopic}
            onStartPresenting={() => {
              setPtPhase('presenting');
              ptTranscriptRef.current = '';
              setSttText('');
              finalizedTextRef.current = '';
              analysisDataRef.current = { totalFrames: 0, lookAwayFrames: 0, mouthOpenFrames: 0 };
            }}
            videoRef={videoRef}
            canvasRef={canvasRef}
            isFaceDetected={isFaceDetected}
            isFaceCentered={isFaceCentered}
            isLookingAway={isLookingAway}
            isRecording={isRecording}
            sttText={sttText}
            onToggleRecording={toggleRecording}
            onSubmitPresentation={() => {
              if (isRecording && mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); socket.emit('stop_audio_stream'); }
              ptTranscriptRef.current = sttText;
              socket.emit('pt_submit_presentation', { topic: ptTopic, transcript: sttText, analysis: analysisDataRef.current });
            }}
            onSubmitQAAnswer={() => {
              if (isRecording && mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); socket.emit('stop_audio_stream'); }
              socket.emit('pt_submit_qa_answer', { question: ptQAQuestion, answer: sttText, analysis: analysisDataRef.current });
            }}
          />
        ) : interviewType === 'group' ? (
          <GroupInterview
            groupSetupStep={groupSetupStep}
            groupSetupTab={groupSetupTab}
            onSetupTabChange={setGroupSetupTab}
            groupMyName={groupMyName}
            onMyNameChange={setGroupMyName}
            groupJoinCode={groupJoinCode}
            onJoinCodeChange={setGroupJoinCode}
            groupJoinPassword={groupJoinPassword}
            onJoinPasswordChange={setGroupJoinPassword}
            groupRoomName={groupRoomName}
            onRoomNameChange={setGroupRoomName}
            groupIsPrivate={groupIsPrivate}
            onIsPrivateChange={setGroupIsPrivate}
            groupRoomPassword={groupRoomPassword}
            onRoomPasswordChange={setGroupRoomPassword}
            groupRoomError={groupRoomError}
            onClearRoomError={() => setGroupRoomError(null)}
            roomList={roomList}
            groupRoomCode={groupRoomCode}
            groupParticipants={groupParticipants}
            isGroupHost={isGroupHost}
            generatedQuestions={generatedQuestions}
            groupCurrentQuestion={groupCurrentQuestion}
            groupCurrentAnswererId={groupCurrentAnswererId}
            groupAnswererOrder={groupAnswererOrder}
            groupQuestionIndex={groupQuestionIndex}
            groupTotalQuestions={groupTotalQuestions}
            groupAnswerFeedback={groupAnswerFeedback}
            mySocketId={mySocketId}
            videoRef={videoRef}
            canvasRef={canvasRef}
            isFaceDetected={isFaceDetected}
            isFaceCentered={isFaceCentered}
            isLookingAway={isLookingAway}
            isRecording={isRecording}
            sttText={sttText}
            onToggleRecording={toggleRecording}
          />
        ) : (
          <GeneralInterview
            videoRef={videoRef}
            canvasRef={canvasRef}
            isFaceDetected={isFaceDetected}
            isFaceCentered={isFaceCentered}
            isMouthOpen={isMouthOpen}
            isLookingAway={isLookingAway}
            isRecording={isRecording}
            sttText={sttText}
            currentQuestion={currentQuestion}
            isInterviewFinished={isInterviewFinished}
            isCurrentFollowup={isCurrentFollowup}
            generatedQuestions={generatedQuestions}
            interviewType={interviewType}
            foreignLanguage={foreignLanguage}
            onToggleRecording={toggleRecording}
            onSubmitAnswer={() => {
              socket.emit('submit_answer', { question: currentQuestion, answer: sttText, analysis: analysisDataRef.current, isFollowup: isCurrentFollowup });
              setSttText('');
              finalizedTextRef.current = '';
              analysisDataRef.current = { totalFrames: 0, lookAwayFrames: 0, mouthOpenFrames: 0 };
              socket.emit('request_next_question');
            }}
          />
        )}
      </main>
    </div>
  );
}
