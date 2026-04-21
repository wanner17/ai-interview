'use client';

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: '실시간 안면 분석',
    desc: 'MediaPipe로 시선·표정·발화를 프레임 단위로 추적합니다',
    iconClass: 'bg-violet-100 text-violet-600',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: 'AI 맞춤 질문',
    desc: '이력서를 업로드하면 경력·기술스택에 맞는 질문을 자동 생성합니다',
    iconClass: 'bg-blue-100 text-blue-600',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: 'PDF 피드백 리포트',
    desc: '면접 종료 후 시선·발화 점수와 AI 코멘트를 리포트로 제공합니다',
    iconClass: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: '실시간 멀티플레이',
    desc: '집단·토론 면접을 최대 8명이 함께 소켓 기반으로 진행합니다',
    iconClass: 'bg-amber-100 text-amber-600',
  },
];

const types = [
  { icon: '🧑‍💼', label: '개인 면접', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
  { icon: '🌏', label: '외국어', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100' },
  { icon: '📊', label: 'PT 면접', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  { icon: '👥', label: '집단 면접', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  { icon: '⚖️', label: '토론 면접', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
];

interface Props {
  onStart: () => void;
}

export function LandingPage({ onStart }: Props) {
  return (
    <div className="flex flex-col items-center px-4 pb-24">

      {/* Hero */}
      <section className="w-full max-w-4xl text-center pt-20 pb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-600 text-xs font-semibold mb-8">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500" />
          </span>
          AI 기반 실시간 면접 시뮬레이터
        </div>

        <h1 className="text-6xl sm:text-7xl font-black tracking-tight leading-[1.05] mb-6 text-gray-900">
          면접,{' '}
          <span style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI와 함께
          </span>
          <br />준비하세요
        </h1>

        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed mb-10">
          카메라 하나로 실전과 동일한 면접 환경을 경험하세요.<br />
          시선·표정·발화를 실시간 분석해 즉각적인 피드백을 드립니다.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onStart}
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-base transition-all hover:-translate-y-0.5 hover:shadow-xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 8px 24px rgba(124,58,237,0.25)' }}
          >
            지금 시작하기
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </section>

      {/* 면접 유형 칩 */}
      <section className="w-full max-w-4xl mb-16">
        <div className="flex flex-wrap justify-center gap-2">
          {types.map((t) => (
            <div key={t.label} className={`flex items-center gap-2 px-4 py-2 rounded-full border ${t.bg} ${t.border}`}>
              <span className="text-base">{t.icon}</span>
              <span className={`text-sm font-semibold ${t.text}`}>{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="w-full max-w-4xl mb-16">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest text-center mb-8">주요 기능</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ icon, title, desc, iconClass }) => (
            <div
              key={title}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-violet-100 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconClass}`}>
                {icon}
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-1.5">{title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 하단 CTA */}
      <section className="w-full max-w-xl">
        <div className="rounded-3xl border border-violet-100 bg-white p-10 shadow-sm text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-3">지금 바로 시작하세요</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            회원가입 시 <span className="font-semibold text-violet-600">10 토큰</span>을 무료로 드립니다.<br />카메라와 마이크만 준비해주세요.
          </p>
          <button
            onClick={onStart}
            className="group w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold text-base transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 8px 24px rgba(124,58,237,0.2)' }}
          >
            면접 시작하기
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </section>
    </div>
  );
}
