import { RefObject } from 'react';
import { StatusBadge } from '../StatusBadge';
import { socket } from '../../socket';

interface DebateInterviewProps {
  // 설정 상태
  debateSetupStep: 'setup' | 'waiting' | 'debating';
  debateSetupTab: 'list' | 'private' | 'create';
  onSetupTabChange: (tab: 'list' | 'private' | 'create') => void;
  debateMyName: string;
  onMyNameChange: (name: string) => void;
  debateJoinCode: string;
  onJoinCodeChange: (code: string) => void;
  debateJoinPassword: string;
  onJoinPasswordChange: (pw: string) => void;
  debateRoomName: string;
  onRoomNameChange: (name: string) => void;
  debateType: 'pro-con' | 'free';
  onDebateTypeChange: (t: 'pro-con' | 'free') => void;
  debateTotalRounds: number;
  onTotalRoundsChange: (n: number) => void;
  debateCategory: string;
  onCategoryChange: (cat: string) => void;
  debateCustomTopic: string;
  onCustomTopicChange: (t: string) => void;
  debateUseCustom: boolean;
  onToggleCustom: () => void;
  debateTopic: string;
  debateTopicDesc: string;
  debateProLabel: string;
  debateConLabel: string;
  debateIsPrivate: boolean;
  onIsPrivateChange: (v: boolean) => void;
  debateRoomPassword: string;
  onRoomPasswordChange: (pw: string) => void;
  debateIsGenerating: boolean;
  debateTopicError: string | null;
  debateRoomError: string | null;
  onClearRoomError: () => void;
  debateRoomList: any[];
  onGenerateTopic: () => void;

  // 대기실
  debateRoomCode: string;
  debateParticipants: any[];
  debateIsHost: boolean;
  debateTotalRoundsState: number;

  // 토론 진행
  debateCurrentRound: number;
  debateCurrentSpeakerId: string;
  debateRoundOrder: any[];
  debateMySide: string;
  debateSpeechTimeLeft: number;
  debateSpeechFeedback: any;
  debateRoundSummary: string;
  debateShowSummary: boolean;
  mySocketId: string;
  sttText: string;

  // 미디어
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isFaceDetected: boolean;
  isFaceCentered: boolean;
  isLookingAway: boolean;
  isRecording: boolean;
  onToggleRecording: () => void;
  onSubmitSpeech: () => void;
}

export function DebateInterview({
  debateSetupStep, debateSetupTab, onSetupTabChange,
  debateMyName, onMyNameChange,
  debateJoinCode, onJoinCodeChange,
  debateJoinPassword, onJoinPasswordChange,
  debateRoomName, onRoomNameChange,
  debateType, onDebateTypeChange,
  debateTotalRounds, onTotalRoundsChange,
  debateCategory, onCategoryChange,
  debateCustomTopic, onCustomTopicChange,
  debateUseCustom, onToggleCustom,
  debateTopic, debateTopicDesc, debateProLabel, debateConLabel,
  debateIsPrivate, onIsPrivateChange,
  debateRoomPassword, onRoomPasswordChange,
  debateIsGenerating, debateTopicError, debateRoomError, onClearRoomError,
  debateRoomList, onGenerateTopic,
  debateRoomCode, debateParticipants, debateIsHost, debateTotalRoundsState,
  debateCurrentRound, debateCurrentSpeakerId, debateRoundOrder, debateMySide,
  debateSpeechTimeLeft, debateSpeechFeedback, debateRoundSummary, debateShowSummary,
  mySocketId, sttText,
  videoRef, canvasRef, isFaceDetected, isFaceCentered, isLookingAway,
  isRecording, onToggleRecording, onSubmitSpeech,
}: DebateInterviewProps) {
  return (
    <div className="flex flex-col gap-5">
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

            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">내 이름</label>
              <input type="text" maxLength={12} placeholder="이름을 입력하세요" value={debateMyName} onChange={e => onMyNameChange(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-violet-500 transition-colors text-lg" />
            </div>

            <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-2xl p-1">
              {([['list', '📋 공개 방 목록'], ['private', '🔒 비밀 방'], ['create', '🏠 방 만들기']] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => { onSetupTabChange(tab); onClearRoomError(); if (tab === 'list') socket.emit('get_debate_room_list'); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${debateSetupTab === tab ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                  {label}
                </button>
              ))}
            </div>

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
                      <button onClick={() => { onClearRoomError(); socket.emit('join_debate_room', { code: r.code, name: debateMyName }); }} disabled={!debateMyName.trim()}
                        className="flex-shrink-0 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed">
                        참가 →
                      </button>
                    </div>
                  ))
                )}
                <button onClick={() => socket.emit('get_debate_room_list')} className="w-full py-2 text-xs text-zinc-400 hover:text-violet-500 transition-colors font-semibold">🔄 목록 새로고침</button>
              </div>
            )}

            {debateSetupTab === 'private' && (
              <div className="space-y-3">
                <input type="text" maxLength={6} placeholder="방 코드 6자리" value={debateJoinCode} onChange={e => onJoinCodeChange(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-bold focus:outline-none focus:border-violet-500 transition-colors text-center tracking-widest text-lg" />
                <input type="password" placeholder="비밀번호" value={debateJoinPassword} onChange={e => onJoinPasswordChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-violet-500 transition-colors" />
                <button onClick={() => { onClearRoomError(); socket.emit('join_debate_room', { code: debateJoinCode, name: debateMyName, password: debateJoinPassword }); }} disabled={!debateMyName.trim() || debateJoinCode.length < 6}
                  className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed">
                  🔒 비밀 방 입장
                </button>
              </div>
            )}

            {debateSetupTab === 'create' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">방 이름</label>
                  <input type="text" maxLength={20} placeholder={debateMyName ? `${debateMyName}의 토론방` : '방 이름'} value={debateRoomName} onChange={e => onRoomNameChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-violet-500 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">토론 방식</label>
                  <div className="flex gap-2">
                    {([['pro-con', '⚔️ 찬반 토론', '찬성/반대 입장을 배정하여 토론'], ['free', '🗣️ 자유 토론', '입장 제한 없이 자유롭게 의견 공유']] as const).map(([v, label, desc]) => (
                      <button key={v} onClick={() => onDebateTypeChange(v)}
                        className={`flex-1 py-3 px-3 rounded-2xl border-2 text-left transition-all ${debateType === v ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10' : 'border-gray-100 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30'}`}>
                        <p className={`text-sm font-bold ${debateType === v ? 'text-violet-700 dark:text-violet-300' : 'text-zinc-700 dark:text-zinc-300'}`}>{label}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">라운드 수</label>
                  <div className="flex gap-2">
                    {[2, 3, 4].map(n => (
                      <button key={n} onClick={() => onTotalRoundsChange(n)}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${debateTotalRounds === n ? 'border-violet-500 bg-violet-500 text-white' : 'border-gray-200 dark:border-white/10 text-zinc-500 hover:border-violet-400'}`}>
                        {n}라운드
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">토론 주제</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3">
                    {([['social','🧑‍🤝‍🧑','사회/노동'],['tech','💻','IT/기술'],['education','📚','교육'],['economy','💰','경제'],['environment','🌿','환경']] as const).map(([id, icon, label]) => (
                      <button key={id} onClick={() => onCategoryChange(id)}
                        className={`py-2 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center gap-0.5 ${debateCategory === id ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300' : 'border-gray-100 dark:border-white/10 text-zinc-500 hover:border-violet-300 dark:hover:border-violet-500/30'}`}>
                        <span>{icon}</span>{label}
                      </button>
                    ))}
                  </div>
                  <button onClick={onToggleCustom} className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline mb-2 flex items-center gap-1">
                    {debateUseCustom ? '▲ AI 주제 생성으로 돌아가기' : '▼ 직접 주제 입력하기'}
                  </button>
                  {debateUseCustom && (
                    <input type="text" maxLength={60} placeholder="토론 주제를 직접 입력하세요" value={debateCustomTopic} onChange={e => onCustomTopicChange(e.target.value)}
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
                  <button onClick={onGenerateTopic} disabled={debateIsGenerating || (debateUseCustom && !debateCustomTopic.trim())}
                    className="mt-3 w-full py-2.5 text-sm font-bold rounded-xl border-2 border-violet-500 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                    {debateIsGenerating ? <><div className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin"></div> 생성 중...</> : '✨ AI 주제 생성'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => onIsPrivateChange(false)} className={`flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${!debateIsPrivate ? 'border-violet-500 bg-violet-500 text-white' : 'border-gray-200 dark:border-white/10 text-zinc-500 hover:border-violet-400'}`}>🌐 공개 방</button>
                  <button onClick={() => onIsPrivateChange(true)} className={`flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${debateIsPrivate ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 dark:border-white/10 text-zinc-500 hover:border-blue-400'}`}>🔒 비밀 방</button>
                </div>
                {debateIsPrivate && (
                  <input type="password" placeholder="비밀번호" value={debateRoomPassword} onChange={e => onRoomPasswordChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-zinc-800 dark:text-white placeholder-zinc-400 font-semibold focus:outline-none focus:border-blue-500 transition-colors" />
                )}

                {debateRoomError && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-3 rounded-xl">⚠️ {debateRoomError}</p>}

                <button onClick={() => {
                  if (!debateTopic) { onClearRoomError(); return; }
                  onClearRoomError();
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

      {debateSetupStep === 'debating' && (() => {
        const isMyTurn = debateCurrentSpeakerId === mySocketId;
        const currentSpeaker = debateParticipants.find((p: any) => p.socketId === debateCurrentSpeakerId);
        const me = debateParticipants.find((p: any) => p.socketId === mySocketId);
        const mySideLabel = me?.side === 'pro' ? '찬성' : me?.side === 'con' ? '반대' : '자유';
        const mySideColor = me?.side === 'pro' ? 'bg-blue-500' : me?.side === 'con' ? 'bg-rose-500' : 'bg-zinc-500';

        return (
          <>
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

            {debateShowSummary && (
              <div className="bg-violet-50 dark:bg-violet-500/10 rounded-2xl border border-violet-200 dark:border-violet-500/30 px-6 py-5">
                <p className="text-sm font-black text-violet-700 dark:text-violet-300 mb-2">🎙️ AI 사회자 코멘트</p>
                <p className="text-sm text-violet-800 dark:text-violet-200 leading-relaxed">{debateRoundSummary}</p>
                {debateCurrentRound < debateTotalRoundsState && (
                  <p className="text-xs text-violet-500 mt-3 font-semibold">잠시 후 라운드 {debateCurrentRound + 1}이 시작됩니다...</p>
                )}
              </div>
            )}

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

            {isMyTurn && !debateSpeechFeedback && !debateShowSummary && (
              <div className="flex gap-3">
                <button onClick={onToggleRecording}
                  className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-base transition-all shadow-lg hover:-translate-y-0.5 ${isRecording ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/25'}`}>
                  {isRecording ? <><span className="w-4 h-4 bg-white rounded-sm"></span> 녹음 종료</> : <><span>🎙️</span> 발언 녹음 시작</>}
                </button>
                <button onClick={onSubmitSpeech}
                  className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold border border-gray-200 dark:border-zinc-700 shadow-md hover:-translate-y-0.5 transition-all">
                  <span>✅</span> 발언 완료
                </button>
              </div>
            )}

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
  );
}
