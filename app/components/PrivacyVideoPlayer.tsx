'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type BlurMode = 'none' | 'face' | 'background' | 'both';
export type VoicePitch = 'normal' | 'high' | 'low';

interface Props {
  src: string;
  blurMode: BlurMode;
  voicePitch: VoicePitch;
  clipStart?: number;
  clipEnd?: number;
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
  if (!isFinite(s) || isNaN(s)) return '0:00';
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

export function PrivacyVideoPlayer({ src, blurMode, voicePitch, clipStart, clipEnd }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const blurModeRef = useRef<BlurMode>(blurMode);
  const clipStartRef = useRef<number | undefined>(clipStart);
  const clipEndRef = useRef<number | undefined>(clipEnd);

  useEffect(() => { clipStartRef.current = clipStart; }, [clipStart]);
  useEffect(() => { clipEndRef.current = clipEnd; }, [clipEnd]);

  // BlazeFace
  const modelRef = useRef<any | null>(null);
  const faceBoxRef = useRef<{ cx: number; cy: number; rx: number; ry: number } | null>(null);
  const targetFaceBoxRef = useRef<{ cx: number; cy: number; rx: number; ry: number } | null>(null);
  const frameCountRef = useRef(0);
  const detectingRef = useRef(false);
  const offCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasFirstDetectionRef = useRef(false);

  // Audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const pitchNodeRef = useRef<AudioWorkletNode | null>(null);
  const workletLoadedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => { blurModeRef.current = blurMode; }, [blurMode]);

  // BlazeFace 모델 로드 (none↔active 전환 시에만 재로드, face↔background 전환 시 유지)
  const isBlurActive = blurMode !== 'none';
  useEffect(() => {
    if (!isBlurActive) return;
    if (modelRef.current) return; // 이미 로드됨
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
    };
  }, [isBlurActive]);

  useEffect(() => {
    hasFirstDetectionRef.current = false;
    if (!isBlurActive) {
      modelRef.current = null;
      faceBoxRef.current = null;
      targetFaceBoxRef.current = null;
    }
  }, [isBlurActive]);

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
          targetFaceBoxRef.current = boxToEllipse(p.topLeft as [number, number], p.bottomRight as [number, number]);
        } else {
          targetFaceBoxRef.current = null;
        }
        hasFirstDetectionRef.current = true;
      } catch (e) {
        console.warn('[blazeface detect]', e);
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

        // 3프레임마다 얼굴 감지 실행 (비동기, 렌더 블로킹 없음)
        frameCountRef.current += 1;
        if (frameCountRef.current % 3 === 0) runDetection();

        // 현재 face box를 target 쪽으로 부드럽게 보간
        const LERP = 0.25;
        const target = targetFaceBoxRef.current;
        const current = faceBoxRef.current;
        if (target) {
          if (!current) {
            faceBoxRef.current = { ...target };
          } else {
            faceBoxRef.current = {
              cx: current.cx + (target.cx - current.cx) * LERP,
              cy: current.cy + (target.cy - current.cy) * LERP,
              rx: current.rx + (target.rx - current.rx) * LERP,
              ry: current.ry + (target.ry - current.ry) * LERP,
            };
          }
        } else {
          faceBoxRef.current = null;
        }

        if (bm === 'both') {
          ctx.save();
          ctx.filter = 'blur(24px)';
          ctx.drawImage(videoEl, 0, 0, vw, vh);
          ctx.restore();
        } else if (bm === 'background') {
          ctx.save();
          ctx.filter = 'blur(24px)';
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
          if (!hasFirstDetectionRef.current) {
            ctx.filter = 'blur(32px)';
            ctx.drawImage(videoEl, 0, 0, vw, vh);
            ctx.filter = 'none';
          } else {
          ctx.drawImage(videoEl, 0, 0, vw, vh);
          }

          if (face) {
            // clip 이후 filter를 적용하면 blur가 ellipse 경계 밖 픽셀 참조 불가.
            // offscreen canvas에서 전체 프레임 blur 후 clip-draw.
            if (!offCanvasRef.current) offCanvasRef.current = document.createElement('canvas');
            const off = offCanvasRef.current;
            if (off.width !== vw) off.width = vw;
            if (off.height !== vh) off.height = vh;
            const offCtx = off.getContext('2d')!;
            offCtx.filter = 'blur(32px)';
            offCtx.drawImage(videoEl, 0, 0, vw, vh);

            ctx.save();
            ctx.beginPath();
            ctx.ellipse(face.cx, face.cy, face.rx, face.ry, 0, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(off, 0, 0);
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
        workletLoadedRef.current = false;
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      if (cancelled) return;

      // MediaElementAudioSourceNode는 video 엘리먼트당 AudioContext 전체에서 단 하나만 생성 가능.
      // remount 시 ref가 초기화되더라도 video 엘리먼트에 직접 저장된 노드를 재사용.
      type VideoWithSource = HTMLVideoElement & { _audioSource?: MediaElementAudioSourceNode };
      const tagged = videoEl as VideoWithSource;
      if (!tagged._audioSource || tagged._audioSource.context !== audioCtx) {
        try {
          tagged._audioSource = audioCtx.createMediaElementSource(videoEl);
        } catch (e) {
          console.error('[privacy-player] Cannot create audio source:', e);
          return;
        }
      }
      audioSourceRef.current = tagged._audioSource;
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
  }, [voicePitch]);

  // 재생 상태 이벤트 + 클립 경계 강제
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => {
      setIsPlaying(true);
      const cs = clipStartRef.current;
      if (cs != null && v.currentTime < cs) v.currentTime = cs;
    };
    const onPause = () => setIsPlaying(false);
    const onTime = () => {
      const cs = clipStartRef.current;
      const ce = clipEndRef.current;
      if (ce != null && v.currentTime >= ce) {
        v.pause();
        v.currentTime = cs ?? 0;
      }
      setCurrentTime(v.currentTime);
    };
    const onLoaded = () => {
      if (isFinite(v.duration)) setDuration(v.duration);
      const cs = clipStartRef.current;
      if (cs != null && v.currentTime < cs) v.currentTime = cs;
    };
    const onDurationChange = () => { if (isFinite(v.duration)) setDuration(v.duration); };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('durationchange', onDurationChange);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('durationchange', onDurationChange);
    };
  }, [src]);

  useEffect(() => () => { audioCtxRef.current?.suspend().catch(() => {}); }, []);

  const togglePlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume();
    v.paused ? v.play() : v.pause();
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const cs = clipStartRef.current ?? 0;
    const ce = clipEndRef.current;
    let t = Number(e.target.value);
    if (t < cs) t = cs;
    if (ce != null && t > ce) t = ce;
    v.currentTime = t;
  }, []);

  return (
    <div>
      {/* video — blurMode 관계없이 항상 같은 DOM 엘리먼트 유지 (AudioContext source 재연결 오류 방지) */}
      <video
        ref={videoRef}
        src={src}
        crossOrigin="anonymous"
        controls={blurMode === 'none'}
        className={blurMode === 'none' ? 'aspect-video w-full object-contain' : 'hidden'}
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (!v) return;
          if (isFinite(v.duration)) setDuration(v.duration);
          if (clipStart != null) v.currentTime = clipStart;
        }}
      />

      {/* canvas — 블러 처리된 프레임 (blurMode !== 'none'일 때만) */}
      {blurMode !== 'none' && (
        <>
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
              {fmtTime(currentTime - (clipStart ?? 0))} / {fmtTime((clipEnd ?? duration) - (clipStart ?? 0))}
            </span>
            <input
              type="range"
              min={clipStart ?? 0}
              max={clipEnd ?? duration ?? 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 accent-violet-500 cursor-pointer"
            />
          </div>
        </>
      )}
    </div>
  );
}
