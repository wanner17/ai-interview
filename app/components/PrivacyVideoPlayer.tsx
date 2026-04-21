'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type BlurMode = 'none' | 'face' | 'background';
export type VoicePitch = 'normal' | 'high' | 'low';

interface Props {
  src: string;
  blurMode: BlurMode;
  voicePitch: VoicePitch;
}

const PITCH_FACTOR: Record<VoicePitch, number> = { normal: 1.0, high: 1.35, low: 0.72 };

const WORKLET_CODE = `
class PitchShiftProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.factor = (options.processorOptions && options.processorOptions.factor) || 1.0;
    this.port.onmessage = (e) => { this.factor = e.data.factor; };
  }
  process(inputs, outputs) {
    const inp = inputs[0] && inputs[0][0];
    const out = outputs[0] && outputs[0][0];
    if (!inp || !out) return true;
    const N = inp.length, f = this.factor;
    for (let i = 0; i < N; i++) {
      const j = (i * f) % N, lo = Math.floor(j), hi = (lo + 1) % N, frac = j - lo;
      out[i] = inp[lo] * (1 - frac) + inp[hi] * frac;
    }
    return true;
  }
}
registerProcessor('privacy-pitch-shift', PitchShiftProcessor);
`;

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

// 감지된 얼굴 박스를 타원으로 변환 (여백 포함)
function boxToEllipse(
  topLeft: [number, number],
  bottomRight: [number, number],
) {
  const [x1, y1] = topLeft;
  const [x2, y2] = bottomRight;
  const padX = (x2 - x1) * 0.2;
  const padY = (y2 - y1) * 0.25;
  return {
    cx: (x1 + x2) / 2,
    cy: (y1 + y2) / 2,
    rx: (x2 - x1) / 2 + padX,
    ry: (y2 - y1) / 2 + padY,
  };
}

export function PrivacyVideoPlayer({ src, blurMode, voicePitch }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const blurModeRef = useRef<BlurMode>(blurMode);

  // BlazeFace
  const modelRef = useRef<any | null>(null);
  const faceBoxRef = useRef<{ cx: number; cy: number; rx: number; ry: number } | null>(null);
  const frameCountRef = useRef(0);
  const detectingRef = useRef(false);

  // Audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const pitchNodeRef = useRef<AudioWorkletNode | null>(null);
  const workletLoadedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => { blurModeRef.current = blurMode; }, [blurMode]);

  // BlazeFace 모델 로드
  useEffect(() => {
    if (blurMode === 'none') return;
    let cancelled = false;
    (async () => {
      try {
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        const blazeface = await import('@tensorflow-models/blazeface');
        const model = await blazeface.load();
        if (!cancelled) modelRef.current = model;
      } catch (e) {
        console.error('[blazeface load]', e);
      }
    })();
    return () => {
      cancelled = true;
      modelRef.current = null;
      faceBoxRef.current = null;
    };
  }, [blurMode]);

  // 캔버스 렌더링 루프
  useEffect(() => {
    const videoEl = videoRef.current;
    const canvas = canvasRef.current;
    if (!videoEl || !canvas || blurMode === 'none') {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      return;
    }

    const ctx = canvas.getContext('2d')!;

    const runDetection = async () => {
      if (detectingRef.current || !modelRef.current || videoEl.paused || videoEl.readyState < 2) return;
      detectingRef.current = true;
      try {
        const predictions = await modelRef.current.estimateFaces(videoEl, false);
        if (predictions.length > 0) {
          const p = predictions[0];
          faceBoxRef.current = boxToEllipse(p.topLeft as [number, number], p.bottomRight as [number, number]);
        } else {
          faceBoxRef.current = null;
        }
      } catch {
        // 감지 실패 시 이전 박스 유지
      } finally {
        detectingRef.current = false;
      }
    };

    const render = () => {
      if (videoEl.readyState >= 2) {
        const vw = videoEl.videoWidth || 1280;
        const vh = videoEl.videoHeight || 720;
        if (canvas.width !== vw) canvas.width = vw;
        if (canvas.height !== vh) canvas.height = vh;

        const bm = blurModeRef.current;
        const face = faceBoxRef.current;

        // 5프레임마다 얼굴 감지 실행 (비동기, 렌더 블로킹 없음)
        frameCountRef.current += 1;
        if (frameCountRef.current % 5 === 0) runDetection();

        if (bm === 'background') {
          ctx.save();
          ctx.filter = 'blur(18px)';
          ctx.drawImage(videoEl, 0, 0, vw, vh);
          ctx.restore();

          if (face) {
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(face.cx, face.cy, face.rx, face.ry, 0, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(videoEl, 0, 0, vw, vh);
            ctx.restore();
          }
        } else if (bm === 'face') {
          ctx.drawImage(videoEl, 0, 0, vw, vh);

          if (face) {
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(face.cx, face.cy, face.rx, face.ry, 0, 0, Math.PI * 2);
            ctx.clip();
            ctx.filter = 'blur(24px)';
            ctx.drawImage(videoEl, 0, 0, vw, vh);
            ctx.restore();
          }
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [blurMode]);

  // 음성 변조
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    let cancelled = false;

    (async () => {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext();
        // audioSourceRef는 초기화하지 않음 — mediaElement 비교로 재사용 여부 판단
        workletLoadedRef.current = false;
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      if (cancelled) return;

      // 현재 video 엘리먼트와 연결된 소스 노드가 없을 때만 새로 생성
      // (한 video 엘리먼트는 AudioContext 전체에서 단 하나의 소스 노드만 가질 수 있음)
      if (!audioSourceRef.current || audioSourceRef.current.mediaElement !== videoEl) {
        try {
          audioSourceRef.current = audioCtx.createMediaElementSource(videoEl);
        } catch (e) {
          console.error('[privacy-player] Cannot create audio source:', e);
          return;
        }
      }
      const source = audioSourceRef.current;
      source.disconnect();
      pitchNodeRef.current?.disconnect();
      pitchNodeRef.current = null;
      if (cancelled) return;

      if (voicePitch === 'normal') {
        source.connect(audioCtx.destination);
        return;
      }

      if (!workletLoadedRef.current) {
        const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        try {
          await audioCtx.audioWorklet.addModule(url);
          workletLoadedRef.current = true;
        } catch (e) {
          console.error('[privacy-player] Worklet load failed, falling back:', e);
          source.connect(audioCtx.destination);
          return;
        } finally {
          URL.revokeObjectURL(url);
        }
      }
      if (cancelled) return;

      const node = new AudioWorkletNode(audioCtx, 'privacy-pitch-shift', {
        processorOptions: { factor: PITCH_FACTOR[voicePitch] },
      });
      pitchNodeRef.current = node;
      source.connect(node);
      node.connect(audioCtx.destination);
    })().catch(e => console.error('[privacy-player voice]', e));

    return () => { cancelled = true; };
  }, [voicePitch, blurMode]);

  // 재생 상태 이벤트
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setCurrentTime(v.currentTime);
    const onLoaded = () => setDuration(v.duration);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onLoaded);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onLoaded);
    };
  }, [src]);

  useEffect(() => () => { audioCtxRef.current?.close(); }, []);

  const togglePlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume();
    v.paused ? v.play() : v.pause();
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (v) v.currentTime = Number(e.target.value);
  }, []);

  if (blurMode === 'none') {
    return (
      <div className="aspect-video">
        <video src={src} controls className="h-full w-full object-contain" />
      </div>
    );
  }

  return (
    <div>
      {/* 히든 video — 디코딩 담당 */}
      <video
        ref={videoRef}
        src={src}
        className="hidden"
        onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
      />

      {/* canvas — 블러 처리된 프레임 */}
      <div className="aspect-video relative cursor-pointer bg-gray-900" onClick={togglePlay}>
        <canvas ref={canvasRef} className="h-full w-full object-contain" />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-black/40 p-4">
              <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* 커스텀 컨트롤바 */}
      <div className="flex items-center gap-3 bg-gray-800 px-4 py-3">
        <button onClick={togglePlay} className="text-white hover:text-violet-300 transition-colors">
          {isPlaying
            ? <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            : <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          }
        </button>
        <span className="text-xs text-gray-400 tabular-nums w-20 shrink-0">
          {fmtTime(currentTime)} / {fmtTime(duration)}
        </span>
        <input
          type="range" min={0} max={duration || 1} step={0.1} value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1 accent-violet-500 cursor-pointer"
        />
      </div>
    </div>
  );
}
