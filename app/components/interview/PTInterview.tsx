import { RefObject } from 'react';
import { StatusBadge } from '../StatusBadge';
import { socket } from '../../socket';

interface PTInterviewProps {
  ptPhase: 'setup' | 'prep' | 'presenting' | 'qa' | null;
  ptCategory: string;
  onCategoryChange: (cat: string) => void;
  ptCustomTopic: string;
  onCustomTopicChange: (t: string) => void;
  ptUseCustom: boolean;
  onToggleCustom: () => void;
  ptTopic: string;
  ptOutline: string[];
  ptIsGenerating: boolean;
  ptTopicError: string | null;
  ptPrepTimeLeft: number;
  ptPresentTimeLeft: number;
  ptSlides: string[];
  ptCurrentSlide: number;
  onSlideChange: (i: number) => void;
  ptSlidesLoading: boolean;
  onLoadPdfSlides: (file: File) => void;
  ptPresentationFeedback: any;
  ptQAQuestion: string;
  ptQAIndex: number;
  ptTotalQA: number;
  ptQAFeedback: any;
  onGenerateTopic: () => void;
  onStartPresenting: () => void;

  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isFaceDetected: boolean;
  isFaceCentered: boolean;
  isLookingAway: boolean;
  isRecording: boolean;
  sttText: string;
  onToggleRecording: () => void;
  onSubmitPresentation: () => void;
  onSubmitQAAnswer: () => void;
}

export function PTInterview({
  ptPhase, ptCategory, onCategoryChange, ptCustomTopic, onCustomTopicChange,
  ptUseCustom, onToggleCustom, ptTopic, ptOutline, ptIsGenerating, ptTopicError,
  ptPrepTimeLeft, ptPresentTimeLeft, ptSlides, ptCurrentSlide, onSlideChange,
  ptSlidesLoading, onLoadPdfSlides, ptPresentationFeedback,
  ptQAQuestion, ptQAIndex, ptTotalQA, ptQAFeedback,
  onGenerateTopic, onStartPresenting,
  videoRef, canvasRef, isFaceDetected, isFaceCentered, isLookingAway,
  isRecording, sttText, onToggleRecording, onSubmitPresentation, onSubmitQAAnswer,
}: PTInterviewProps) {
  return (
    <div className="flex flex-col gap-5">
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

            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">카테고리</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {([['business','📈','경영/전략'],['tech','💻','IT/기술'],['marketing','📣','마케팅'],['finance','💰','금융/경제'],['social','🌍','사회/이슈'],['hr','🤝','조직/인사']] as const).map(([id, icon, label]) => (
                  <button key={id} onClick={() => onCategoryChange(id)}
                    className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${ptCategory === id ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300' : 'border-gray-100 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:border-violet-300 dark:hover:border-violet-500/30'}`}>
                    <span>{icon}</span>{label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <button onClick={onToggleCustom} className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
                {ptUseCustom ? '▲ AI 주제 생성으로 돌아가기' : '▼ 직접 주제 입력하기'}
              </button>
              {ptUseCustom && (
                <textarea rows={2} maxLength={100} placeholder="발표 주제를 직접 입력하세요 (예: 친환경 포장재 도입 전략)"
                  value={ptCustomTopic} onChange={e => onCustomTopicChange(e.target.value)}
                  className="mt-3 w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-medium focus:outline-none focus:border-violet-500 transition-colors resize-none text-sm" />
              )}
            </div>

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
                <input type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onLoadPdfSlides(f); }} />
              </label>
            </div>

            {ptTopicError && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-3 rounded-xl">⚠️ {ptTopicError}</p>}

            <button onClick={onGenerateTopic} disabled={ptIsGenerating || (ptUseCustom && !ptCustomTopic.trim())}
              className="w-full px-6 py-4 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl shadow-lg shadow-violet-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {ptIsGenerating ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> 주제 생성 중...</> : '🚀 PT면접 시작하기'}
            </button>
          </div>
        </div>
      )}

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

            <button onClick={onStartPresenting}
              className="w-full px-6 py-4 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl shadow-lg shadow-violet-600/25 transition-all hover:-translate-y-0.5">
              📊 발표 시작하기
            </button>
          </div>
        </div>
      )}

      {ptPhase === 'presenting' && (
        <>
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

          <div className={`grid gap-4 ${ptSlides.length > 0 ? 'grid-cols-1 lg:grid-cols-[1fr_auto]' : 'grid-cols-1'}`}>
            {ptSlides.length > 0 && (
              <div className="bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                <img src={ptSlides[ptCurrentSlide]} alt={`슬라이드 ${ptCurrentSlide + 1}`} className="w-full object-contain" />
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80">
                  <button onClick={() => onSlideChange(Math.max(0, ptCurrentSlide - 1))} disabled={ptCurrentSlide === 0}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-30 transition-all">← 이전</button>
                  <span className="text-xs text-zinc-400 font-semibold">{ptCurrentSlide + 1} / {ptSlides.length}</span>
                  <button onClick={() => onSlideChange(Math.min(ptSlides.length - 1, ptCurrentSlide + 1))} disabled={ptCurrentSlide === ptSlides.length - 1}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-30 transition-all">다음 →</button>
                </div>
              </div>
            )}

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

          <div className="flex gap-3">
            <button onClick={onToggleRecording}
              className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-base transition-all shadow-lg hover:-translate-y-0.5 ${isRecording ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/25'}`}>
              {isRecording ? <><span className="w-4 h-4 bg-white rounded-sm"></span> 녹음 종료</> : <><span>🎙️</span> 발표 녹음 시작</>}
            </button>
            <button onClick={onSubmitPresentation}
              className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold border border-gray-200 dark:border-zinc-700 shadow-md hover:-translate-y-0.5 transition-all">
              <span>✅</span> 발표 완료
            </button>
          </div>
        </>
      )}

      {ptPhase === 'qa' && (
        <>
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
              <button onClick={onToggleRecording}
                className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-base transition-all shadow-lg hover:-translate-y-0.5 ${isRecording ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'}`}>
                {isRecording ? <><span className="w-4 h-4 bg-white rounded-sm"></span> 녹음 종료</> : <><span>🎙️</span> 답변 녹음 시작</>}
              </button>
              <button onClick={onSubmitQAAnswer}
                className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold border border-gray-200 dark:border-zinc-700 shadow-md hover:-translate-y-0.5 transition-all">
                <span>✅</span> 답변 제출
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
