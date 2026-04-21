import Link from 'next/link';

const types = [
  {
    id: 'individual',
    icon: '🧑‍💼',
    label: '개인 면접',
    sub: '1:1 AI 면접관',
    desc: '이력서 기반 심층 질문 + 압박 꼬리 질문',
    color: { badge: 'bg-blue-100 text-blue-700', border: 'border-blue-200', accent: 'bg-blue-500', light: 'bg-blue-50' },
    details: [
      '이력서를 업로드하면 AI가 직무·경험 기반 맞춤 질문을 생성합니다.',
      '답변 후 압박성 꼬리 질문으로 심층 역량을 검증합니다.',
      '말하기 속도, 발음 명확도, 답변 구조를 실시간으로 분석합니다.',
      '면접 종료 후 항목별 피드백 리포트를 제공합니다.',
    ],
    tags: ['이력서 분석', '꼬리 질문', '피드백 리포트'],
    time: '15~30분',
    difficulty: '★★★☆☆',
    participants: '1명',
  },
  {
    id: 'foreign',
    icon: '🌏',
    label: '외국어 면접',
    sub: '영어 · 일본어 · 중국어',
    desc: '외국어 면접 유창성 분석',
    color: { badge: 'bg-violet-100 text-violet-700', border: 'border-violet-200', accent: 'bg-violet-500', light: 'bg-violet-50' },
    details: [
      '영어, 일본어, 중국어 중 원하는 언어로 진행합니다.',
      'AI 면접관이 해당 언어로 질문하고 답변을 분석합니다.',
      '발음, 억양, 어휘 다양성, 문법 정확도를 종합 평가합니다.',
      '글로벌 기업 취업 준비에 최적화된 문항이 제공됩니다.',
    ],
    tags: ['영어', '일본어', '중국어', '유창성 분석'],
    time: '15~30분',
    difficulty: '★★★★☆',
    participants: '1명',
  },
  {
    id: 'pt',
    icon: '📊',
    label: 'PT 면접',
    sub: 'Presentation',
    desc: 'AI 주제 생성 + 5분 발표 + Q&A 2문항',
    color: { badge: 'bg-amber-100 text-amber-700', border: 'border-amber-200', accent: 'bg-amber-500', light: 'bg-amber-50' },
    details: [
      'AI가 직무·산업에 맞는 발표 주제를 실시간으로 생성합니다.',
      '5분간 자유롭게 발표하고 AI가 발표를 분석합니다.',
      '발표 후 AI 면접관이 2개의 심층 Q&A 질문을 합니다.',
      '논리 구성력, 핵심 전달력, 자신감 지표를 상세 리포트로 확인합니다.',
    ],
    tags: ['발표 준비', 'AI 주제 생성', 'Q&A'],
    time: '20~40분',
    difficulty: '★★★★☆',
    participants: '1명',
  },
  {
    id: 'group',
    icon: '👥',
    label: '집단 면접',
    sub: '최대 8명 동시 참여',
    desc: '방 코드로 입장, 공통 질문 순번 배정',
    color: { badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200', accent: 'bg-emerald-500', light: 'bg-emerald-50' },
    details: [
      '방 코드를 공유해 최대 8명이 동시에 같은 면접에 참여합니다.',
      '공통 질문을 순서대로 돌아가며 답변합니다.',
      '다른 참가자의 답변을 실시간으로 듣고 비교 분석합니다.',
      '참가자별 개인 피드백과 상대 비교 데이터를 제공합니다.',
    ],
    tags: ['실시간 멀티플레이', '방 코드 입장', '비교 분석'],
    time: '30~60분',
    difficulty: '★★★★★',
    participants: '2~8명',
  },
  {
    id: 'discussion',
    icon: '⚖️',
    label: '토론 면접',
    sub: '찬반 · 자유 토론',
    desc: 'AI 사회자 + 라운드별 발언 분석',
    color: { badge: 'bg-rose-100 text-rose-700', border: 'border-rose-200', accent: 'bg-rose-500', light: 'bg-rose-50' },
    details: [
      '찬반 토론 또는 자유 토론 방식을 선택할 수 있습니다.',
      'AI 사회자가 진행을 맡아 발언 시간과 순서를 조율합니다.',
      '라운드마다 논리성, 근거 제시력, 설득력을 분석합니다.',
      '최종 종합 리포트로 토론 강점과 개선점을 확인합니다.',
    ],
    tags: ['AI 사회자', '찬반·자유 토론', '라운드 분석'],
    time: '30~60분',
    difficulty: '★★★★★',
    participants: '2~8명',
  },
];

const comparisons = [
  { label: '면접 유형', individual: '개인', foreign: '외국어', pt: 'PT', group: '집단', discussion: '토론' },
  { label: '참여 인원', individual: '1명', foreign: '1명', pt: '1명', group: '2~8명', discussion: '2~8명' },
  { label: '예상 시간', individual: '15~30분', foreign: '15~30분', pt: '20~40분', group: '30~60분', discussion: '30~60분' },
  { label: '난이도', individual: '★★★', foreign: '★★★★', pt: '★★★★', group: '★★★★★', discussion: '★★★★★' },
  { label: '이력서 분석', individual: 'O', foreign: 'O', pt: '△', group: 'O', discussion: 'X' },
  { label: '실시간 멀티', individual: 'X', foreign: 'X', pt: 'X', group: 'O', discussion: 'O' },
];

export default function InterviewTypesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* 헤더 */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-3">면접 유형</h1>
        <p className="text-gray-400 text-lg">목적에 맞는 면접 유형을 선택하고 AI와 함께 실전처럼 연습하세요</p>
      </div>

      {/* 유형 카드 */}
      <div className="flex flex-col gap-6 mb-16">
        {types.map((type) => (
          <div key={type.id} className={`rounded-2xl border ${type.color.border} bg-white overflow-hidden`}>
            <div className="flex flex-col md:flex-row">
              {/* 왼쪽 아이콘 영역 */}
              <div className={`${type.color.light} flex flex-col items-center justify-center p-8 md:w-48 md:flex-shrink-0`}>
                <span className="text-5xl mb-3">{type.icon}</span>
                <p className="font-black text-gray-800 text-base text-center">{type.label}</p>
                <p className="text-xs text-gray-500 text-center mt-1">{type.sub}</p>
              </div>

              {/* 오른쪽 내용 영역 */}
              <div className="flex-1 p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {type.tags.map((tag) => (
                    <span key={tag} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${type.color.badge}`}>
                      {tag}
                    </span>
                  ))}
                </div>

                <ul className="flex flex-col gap-2 mb-5">
                  {type.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-full ${type.color.accent} flex items-center justify-center text-white text-xs font-bold`}>
                        {i + 1}
                      </span>
                      {detail}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-4 text-xs text-gray-500 border-t border-gray-100 pt-4">
                  <span>⏱ 예상 시간: <strong className="text-gray-700">{type.time}</strong></span>
                  <span>👤 참여 인원: <strong className="text-gray-700">{type.participants}</strong></span>
                  <span>📈 난이도: <strong className="text-gray-700">{type.difficulty}</strong></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 비교표 */}
      <div className="mb-16">
        <h2 className="text-2xl font-black text-gray-900 mb-6">유형별 비교</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0 rounded-2xl overflow-hidden border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-bold text-gray-600 border-b border-gray-200 border-r border-gray-200">항목</th>
                {['개인', '외국어', 'PT', '집단', '토론'].map((h) => (
                  <th key={h} className="px-4 py-3 text-center font-bold text-gray-600 border-b border-gray-200 border-r border-gray-200 last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3 font-semibold text-gray-700 border-b border-gray-100 border-r border-gray-200">{row.label}</td>
                  {[row.individual, row.foreign, row.pt, row.group, row.discussion].map((val, j) => (
                    <td key={j} className="px-4 py-3 text-center text-gray-600 border-b border-gray-100 border-r border-gray-200 last:border-r-0">
                      {val === 'O' ? <span className="text-emerald-500 font-bold">O</span>
                        : val === 'X' ? <span className="text-rose-400 font-bold">X</span>
                        : val === '△' ? <span className="text-amber-500 font-bold">△</span>
                        : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-8 text-center">
        <h3 className="text-xl font-black text-gray-900 mb-2">지금 바로 시작해보세요</h3>
        <p className="text-gray-500 text-sm mb-6">AI와 함께하는 실전 면접 연습으로 합격을 앞당기세요</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)', boxShadow: '0 8px 24px rgba(124,58,237,0.2)' }}
        >
          면접 시작하기 →
        </Link>
      </div>
    </main>
  );
}
