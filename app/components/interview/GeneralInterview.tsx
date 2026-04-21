import { RefObject } from 'react';
import { StatusBadge } from '../StatusBadge';
import { socket } from '../../socket';
import type { AuthUser } from '../../lib/auth';

interface GeneralInterviewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isFaceDetected: boolean;
  isFaceCentered: boolean;
  isMouthOpen: boolean;
  isLookingAway: boolean;
  isRecording: boolean;
  sttText: string;
  currentQuestion: string | null;
  isInterviewFinished: boolean;
  isCurrentFollowup: boolean;
  generatedQuestions: string[] | null;
  interviewType: string | null;
  foreignLanguage: string;
  currentUser: AuthUser | null | undefined;
  interviewTokenError: string | null;
  onClearTokenError: () => void;
  onToggleRecording: () => void;
  onSubmitAnswer: () => void;
}

export function GeneralInterview({
  videoRef, canvasRef,
  isFaceDetected, isFaceCentered, isMouthOpen, isLookingAway,
  isRecording, sttText,
  currentQuestion, isInterviewFinished, isCurrentFollowup,
  generatedQuestions, interviewType, foreignLanguage,
  currentUser, interviewTokenError, onClearTokenError,
  onToggleRecording, onSubmitAnswer,
}: GeneralInterviewProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* 토큰 에러 토스트 */}
      {interviewTokenError && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">{interviewTokenError}</p>
          <button onClick={onClearTokenError} className="text-rose-400 hover:text-rose-600 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      {/* 질문 카드 */}
      <div className="bg-white dark:bg-[#111118] rounded-3xl shadow-xl shadow-blue-900/5 dark:shadow-black/30 border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <div className="px-8 py-10 flex flex-col items-center justify-center min-h-[140px] text-center">
          {!currentQuestion ? (
            <div className="flex flex-col items-center gap-3">
              {currentUser && (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  보유 토큰: <span className="font-bold text-amber-600">{currentUser.tokens}</span>토큰 (면접 1회 = 3토큰 차감)
                </p>
              )}
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
            </div>
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
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80" />

        {isFaceDetected && (
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <StatusBadge ok={isFaceCentered} okLabel="위치 안정적" failLabel="위치 이탈" okIcon="🎯" failIcon="⚠️" />
            <StatusBadge ok={!isLookingAway} okLabel="시선 집중" failLabel="모니터 응시 요망" okIcon="👀" failIcon="⚠️" />
            <StatusBadge ok={isMouthOpen} okLabel="발화 감지됨" failLabel="답변 대기 중" okIcon="🗣️" failIcon="🤐" neutralOnFail />
          </div>
        )}

        {!isFaceDetected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900/95 border border-white/10 text-white px-8 py-6 rounded-2xl flex flex-col items-center gap-3 shadow-2xl">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              <p className="text-base font-semibold text-white/80">얼굴을 화면 중앙에 맞춰주세요</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-5 inset-x-5 flex justify-center">
          <div className="bg-black/70 backdrop-blur-md text-white px-6 py-4 rounded-2xl max-w-3xl w-full text-center min-h-[60px] flex items-center justify-center border border-white/10 shadow-2xl">
            {sttText ? (
              <p className="text-base md:text-lg leading-relaxed font-medium">{sttText}</p>
            ) : (
              <p className="text-white/35 text-sm">답변을 녹음하면 자막이 여기에 표시됩니다...</p>
            )}
          </div>
        </div>

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
            onClick={onToggleRecording}
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
            onClick={onSubmitAnswer}
            className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold text-base transition-all border border-gray-200 dark:border-zinc-700 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <span className="text-lg">⏭️</span> 제출 후 다음 질문
          </button>
        </div>
      )}
    </div>
  );
}
