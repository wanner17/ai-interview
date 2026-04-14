'use client';

import { useEffect, useState, useRef } from 'react';
import { socket } from './socket';
import type { Results } from '@mediapipe/face_mesh';

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
      setTransport(socket.io.engine.transport.name);

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
    socket.on('next_question', (data: { question: string; isEnd: boolean }) => {
      setCurrentQuestion(data.question);
      setIsInterviewFinished(data.isEnd);
    });
    socket.on('interview_finished', (results: any[]) => {
      setReportData(results);
    });

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('stt_result');
      socket.off('next_question');
      socket.off('interview_finished');
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
  }, [hasMediaPermission, mediaStream]);

  // MediaPipe Face Mesh 실시간 처리
  useEffect(() => {
    if (!hasMediaPermission || !videoRef.current) return;

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
  }, [hasMediaPermission]);

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
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-black">
                      Q{idx + 1}
                    </span>
                    <p className="font-bold text-zinc-800 dark:text-zinc-100 leading-snug pt-0.5">
                      {item.question.replace(new RegExp('^\\d+\\.\\s*'), '')}
                    </p>
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
                권한 허용하고 면접 시작하기 →
              </button>

              {mediaError && (
                <div className="mt-6 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-3 rounded-xl">
                  <span>⚠️</span> {mediaError}
                </div>
              )}
            </div>
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
                    onClick={() => socket.emit('start_interview')}
                    className="px-10 py-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-gray-50 text-white dark:text-zinc-900 font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 text-lg"
                  >
                    🚀 면접 시작하기
                  </button>
                ) : (
                  <div className="flex items-start gap-4 text-left w-full max-w-3xl">
                    <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-blue-600/25 mt-1">
                      Q
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-zinc-800 dark:text-white leading-snug">
                      {currentQuestion.replace(new RegExp('^\\d+\\.\\s*'), '')}
                    </h2>
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
