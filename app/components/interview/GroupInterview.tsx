import { RefObject } from 'react';
import { StatusBadge } from '../StatusBadge';
import { socket } from '../../socket';

interface GroupInterviewProps {
  // 설정 상태
  groupSetupStep: 'setup' | 'waiting' | 'interviewing';
  groupSetupTab: 'list' | 'private' | 'create';
  onSetupTabChange: (tab: 'list' | 'private' | 'create') => void;
  groupMyName: string;
  onMyNameChange: (name: string) => void;
  groupJoinCode: string;
  onJoinCodeChange: (code: string) => void;
  groupJoinPassword: string;
  onJoinPasswordChange: (pw: string) => void;
  groupRoomName: string;
  onRoomNameChange: (name: string) => void;
  groupIsPrivate: boolean;
  onIsPrivateChange: (v: boolean) => void;
  groupRoomPassword: string;
  onRoomPasswordChange: (pw: string) => void;
  groupRoomError: string | null;
  onClearRoomError: () => void;
  roomList: Array<{ code: string; roomName: string; participantCount: number }>;

  // 대기실 상태
  groupRoomCode: string;
  groupParticipants: any[];
  isGroupHost: boolean;
  generatedQuestions: string[] | null;

  // 면접 진행 상태
  groupCurrentQuestion: string;
  groupCurrentAnswererId: string;
  groupAnswererOrder: any[];
  groupQuestionIndex: number;
  groupTotalQuestions: number;
  groupAnswerFeedback: any;
  mySocketId: string;

  // 미디어
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isFaceDetected: boolean;
  isFaceCentered: boolean;
  isLookingAway: boolean;
  isRecording: boolean;
  sttText: string;
  onToggleRecording: () => void;
}

export function GroupInterview({
  groupSetupStep, groupSetupTab, onSetupTabChange,
  groupMyName, onMyNameChange,
  groupJoinCode, onJoinCodeChange,
  groupJoinPassword, onJoinPasswordChange,
  groupRoomName, onRoomNameChange,
  groupIsPrivate, onIsPrivateChange,
  groupRoomPassword, onRoomPasswordChange,
  groupRoomError, onClearRoomError,
  roomList,
  groupRoomCode, groupParticipants, isGroupHost, generatedQuestions,
  groupCurrentQuestion, groupCurrentAnswererId, groupAnswererOrder,
  groupQuestionIndex, groupTotalQuestions, groupAnswerFeedback, mySocketId,
  videoRef, canvasRef,
  isFaceDetected, isFaceCentered, isLookingAway,
  isRecording, sttText, onToggleRecording,
}: GroupInterviewProps) {
  return (
    <div className="flex flex-col gap-5">
      {groupSetupStep === 'setup' && (
        <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
          <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
          <div className="px-8 py-10 flex flex-col gap-6">
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

            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">내 이름</label>
              <input
                type="text" maxLength={12} placeholder="이름을 입력하세요"
                value={groupMyName} onChange={e => onMyNameChange(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-emerald-500 transition-colors text-lg"
              />
            </div>

            <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-2xl p-1">
              {([['list', '📋 공개 방 목록'], ['private', '🔒 비밀 방'], ['create', '🏠 방 만들기']] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => { onSetupTabChange(tab); onClearRoomError(); if (tab === 'list') socket.emit('get_room_list'); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${groupSetupTab === tab ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                  {label}
                </button>
              ))}
            </div>

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
                        onClick={() => { onClearRoomError(); socket.emit('join_group_room', { code: r.code, name: groupMyName }); }}
                        disabled={!groupMyName.trim()}
                        className="flex-shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >참가 →</button>
                    </div>
                  ))
                )}
                <button onClick={() => socket.emit('get_room_list')} className="w-full py-2 text-xs text-zinc-400 hover:text-emerald-500 transition-colors font-semibold">🔄 목록 새로고침</button>
              </div>
            )}

            {groupSetupTab === 'private' && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">방장으로부터 받은 코드와 비밀번호를 입력하세요.</p>
                <input type="text" maxLength={6} placeholder="방 코드 6자리" value={groupJoinCode} onChange={e => onJoinCodeChange(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-bold focus:outline-none focus:border-blue-500 transition-colors text-center tracking-widest text-lg" />
                <input type="password" placeholder="비밀번호" value={groupJoinPassword} onChange={e => onJoinPasswordChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-blue-500 transition-colors" />
                <button onClick={() => { onClearRoomError(); socket.emit('join_group_room', { code: groupJoinCode, name: groupMyName, password: groupJoinPassword }); }}
                  disabled={!groupMyName.trim() || groupJoinCode.length < 6}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed">
                  🔒 비밀 방 입장
                </button>
              </div>
            )}

            {groupSetupTab === 'create' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">방 이름</label>
                  <input type="text" maxLength={20} placeholder={groupMyName ? `${groupMyName}의 방` : '방 이름을 입력하세요'} value={groupRoomName} onChange={e => onRoomNameChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onIsPrivateChange(false)} className={`flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${!groupIsPrivate ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-200 dark:border-white/10 text-zinc-500 hover:border-emerald-400'}`}>🌐 공개 방</button>
                  <button onClick={() => onIsPrivateChange(true)} className={`flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${groupIsPrivate ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 dark:border-white/10 text-zinc-500 hover:border-blue-400'}`}>🔒 비밀 방</button>
                </div>
                {groupIsPrivate && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">비밀번호</label>
                    <input type="password" placeholder="참가자에게 공유할 비밀번호" value={groupRoomPassword} onChange={e => onRoomPasswordChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-blue-500 transition-colors" />
                  </div>
                )}
                <button
                  onClick={() => { onClearRoomError(); socket.emit('create_group_room', { name: groupMyName, roomName: groupRoomName || undefined, isPrivate: groupIsPrivate, password: groupIsPrivate ? groupRoomPassword : undefined }); }}
                  disabled={!groupMyName.trim() || (groupIsPrivate && !groupRoomPassword.trim())}
                  className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed">
                  🏠 방 만들기
                </button>
              </div>
            )}

            {groupRoomError && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-3 rounded-xl">⚠️ {groupRoomError}</p>}
          </div>
        </div>
      )}

      {groupSetupStep === 'waiting' && (
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

            {isGroupHost ? (
              <button onClick={() => socket.emit('start_group_interview', { code: groupRoomCode, customQuestions: generatedQuestions || [] })} disabled={groupParticipants.length < 1}
                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-40">
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
        const currentAnswererName = groupParticipants.find((p: any) => p.socketId === groupCurrentAnswererId)?.name || '?';

        return (
          <>
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

            <div className="bg-white dark:bg-[#111118] rounded-2xl border border-gray-100 dark:border-white/5 px-6 py-4 shadow-md">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">답변 순서</p>
              <div className="flex flex-wrap gap-2">
                {groupAnswererOrder.map((p: any, i: number) => {
                  const isCurrent = p.socketId === groupCurrentAnswererId;
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

            {isMyTurn && !groupAnswerFeedback && (
              <div className="flex gap-3">
                <button onClick={onToggleRecording}
                  className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-base transition-all shadow-lg ${isRecording ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'} hover:-translate-y-0.5`}>
                  {isRecording ? <><span className="w-4 h-4 bg-white rounded-sm"></span> 녹음 종료</> : <><span className="text-lg">🎙️</span> 답변 녹음 시작</>}
                </button>
                <button onClick={() => socket.emit('group_submit_answer', { code: groupRoomCode, answer: sttText, analysis: {} })}
                  className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold border border-gray-200 dark:border-zinc-700 shadow-md hover:-translate-y-0.5 transition-all">
                  <span className="text-lg">✅</span> 답변 제출
                </button>
              </div>
            )}

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
  );
}
