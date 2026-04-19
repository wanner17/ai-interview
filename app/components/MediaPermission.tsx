interface MediaPermissionProps {
  onRequestMedia: () => void;
  mediaError: string | null;
}

export function MediaPermission({ onRequestMedia, mediaError }: MediaPermissionProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">

      {/* Visual */}
      <div className="relative mb-10">
        <div className="absolute inset-[-28px] rounded-full border-2 border-violet-100 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-[-14px] rounded-full border border-violet-200" />
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 border border-violet-200 flex items-center justify-center shadow-lg shadow-violet-100">
          <svg className="w-12 h-12 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
      </div>

      <h1 className="text-5xl font-black tracking-tight leading-tight mb-4 text-gray-900">
        면접 환경을<br />설정합니다
      </h1>
      <p className="text-gray-400 text-lg max-w-sm leading-relaxed mb-14">
        실시간 안면 분석을 위해<br />카메라와 마이크 권한이 필요합니다
      </p>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full mb-12">
        {[
          {
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
            title: '실시간 분석', desc: '시선·표정·발화를 AI가 실시간으로 추적합니다', iconClass: 'bg-violet-100 text-violet-500', border: 'border-violet-100',
          },
          {
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
            title: '안전한 처리', desc: '수집된 영상은 외부 서버에 저장되지 않습니다', iconClass: 'bg-emerald-100 text-emerald-500', border: 'border-emerald-100',
          },
          {
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
            title: '상세 리포트', desc: '면접 종료 후 AI 피드백을 PDF로 제공합니다', iconClass: 'bg-blue-100 text-blue-500', border: 'border-blue-100',
          },
        ].map(({ icon, title, desc, iconClass, border }) => (
          <div key={title} className={`rounded-2xl border ${border} bg-white p-5 text-left shadow-sm`}>
            <div className={`mb-3 w-9 h-9 rounded-xl flex items-center justify-center ${iconClass}`}>{icon}</div>
            <p className="font-semibold text-gray-700 text-sm mb-1">{title}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {mediaError && (
        <div className="mb-8 w-full max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-left">
          <div className="flex gap-3 items-start">
            <svg className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-rose-600">{mediaError}</p>
          </div>
        </div>
      )}

      <button
        onClick={onRequestMedia}
        className="group flex items-center gap-3 px-10 py-4 rounded-2xl text-white font-bold text-base transition-all hover:-translate-y-0.5 hover:shadow-xl"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 8px 24px rgba(124,58,237,0.25)' }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
        카메라 · 마이크 권한 허용
        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
      <p className="mt-4 text-xs text-gray-400">권한은 언제든지 브라우저 설정에서 변경할 수 있습니다</p>
    </div>
  );
}
