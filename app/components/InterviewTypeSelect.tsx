interface InterviewTypeSelectProps {
  interviewType: string | null;
  onSelectType: (type: string) => void;
  foreignLanguage: string;
  onSelectLanguage: (lang: string) => void;
  onConfirm: () => void;
}

const types = [
  { id: 'individual', icon: '🧑‍💼', label: '개인 면접', sub: '1:1 AI 면접관', desc: '이력서 기반 심층 질문 + 압박 꼬리 질문', selectedBg: 'bg-blue-50', selectedBorder: 'border-blue-300', checkBg: 'bg-blue-500', subColor: 'text-blue-500' },
  { id: 'foreign',    icon: '🌏', label: '외국어 면접', sub: 'English · 日本語 · 中文', desc: '영어·일본어·중국어 면접 유창성 분석', selectedBg: 'bg-violet-50', selectedBorder: 'border-violet-300', checkBg: 'bg-violet-500', subColor: 'text-violet-500' },
  { id: 'pt',         icon: '📊', label: 'PT 면접', sub: 'Presentation', desc: 'AI 주제 생성 + 5분 발표 + Q&A 2문항', selectedBg: 'bg-amber-50', selectedBorder: 'border-amber-300', checkBg: 'bg-amber-500', subColor: 'text-amber-500' },
  { id: 'group',      icon: '👥', label: '집단 면접', sub: '최대 8명 동시 참여', desc: '방 코드로 입장, 공통 질문 순번 배정', selectedBg: 'bg-emerald-50', selectedBorder: 'border-emerald-300', checkBg: 'bg-emerald-500', subColor: 'text-emerald-500' },
  { id: 'discussion', icon: '⚖️', label: '토론 면접', sub: '찬반 · 자유 토론', desc: 'AI 사회자 + 라운드별 발언 분석', selectedBg: 'bg-rose-50', selectedBorder: 'border-rose-300', checkBg: 'bg-rose-500', subColor: 'text-rose-500' },
];

const languages = [
  { code: 'en-US', flag: '🇺🇸', label: 'English' },
  { code: 'ja-JP', flag: '🇯🇵', label: '日本語' },
  { code: 'zh-CN', flag: '🇨🇳', label: '中文' },
];

export function InterviewTypeSelect({ interviewType, onSelectType, foreignLanguage, onSelectLanguage, onConfirm }: InterviewTypeSelectProps) {
  return (
    <div className="flex flex-col gap-8 py-8">
      <div className="text-center">
        <h2 className="text-4xl font-black tracking-tight mb-3 text-gray-900">어떤 면접을 준비하시나요?</h2>
        <p className="text-gray-400">유형을 선택하면 맞춤 면접 환경이 구성됩니다</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {types.map((type) => {
          const isSelected = interviewType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => onSelectType(type.id)}
              className={`group relative rounded-2xl border-2 p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-md
                ${isSelected ? `${type.selectedBg} ${type.selectedBorder} shadow-md` : 'bg-white border-gray-100 hover:border-gray-200'}
              `}
            >
              {isSelected && (
                <div className={`absolute top-4 right-4 w-6 h-6 rounded-full ${type.checkBg} flex items-center justify-center`}>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              )}
              <div className="text-3xl mb-3">{type.icon}</div>
              <p className="font-black text-gray-800 text-sm mb-0.5">{type.label}</p>
              <p className={`text-xs font-semibold mb-2 ${isSelected ? type.subColor : 'text-gray-400'}`}>{type.sub}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{type.desc}</p>
            </button>
          );
        })}
      </div>

      {interviewType === 'foreign' && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-3">면접 언어 선택</p>
          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => onSelectLanguage(lang.code)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all
                  ${foreignLanguage === lang.code ? 'bg-violet-600 border-violet-600 text-white shadow-sm' : 'border-violet-200 bg-white text-violet-500 hover:border-violet-300'}
                `}
              >
                <span>{lang.flag}</span><span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => interviewType && onConfirm()}
        disabled={!interviewType}
        className={`w-full py-4 rounded-2xl font-bold text-base transition-all
          ${interviewType
            ? 'text-white hover:-translate-y-0.5 hover:shadow-lg'
            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }
        `}
        style={interviewType ? { background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 8px 24px rgba(124,58,237,0.2)' } : {}}
      >
        {interviewType ? `${types.find(t => t.id === interviewType)?.label} 시작하기 →` : '유형을 선택해주세요'}
      </button>
    </div>
  );
}
