import Link from 'next/link';

const steps = [
  {
    step: 1,
    title: '회원가입 & 로그인',
    desc: '이메일로 가입하면 바로 시작할 수 있습니다. 소셜 로그인은 지원하지 않습니다.',
    icon: '👤',
  },
  {
    step: 2,
    title: '면접 유형 선택',
    desc: '개인, 외국어, PT, 집단, 토론 중 원하는 면접 유형을 선택합니다.',
    icon: '🗂️',
  },
  {
    step: 3,
    title: '이력서 업로드 (선택)',
    desc: '이력서를 업로드하면 AI가 내용을 분석해 맞춤 질문을 생성합니다. 없이도 진행 가능합니다.',
    icon: '📄',
  },
  {
    step: 4,
    title: '카메라 · 마이크 권한 허용',
    desc: '브라우저의 카메라와 마이크 접근 권한을 허용해야 면접이 진행됩니다.',
    icon: '📷',
  },
  {
    step: 5,
    title: '면접 진행',
    desc: 'AI 면접관이 질문하면 답변합니다. 녹화 중에는 우측 상단에 REC 표시가 나타납니다.',
    icon: '🎤',
  },
  {
    step: 6,
    title: '피드백 리포트 확인',
    desc: '면접 종료 후 항목별 점수, 분석, 개선 포인트가 담긴 리포트를 확인합니다.',
    icon: '📊',
  },
];

const faqs = [
  {
    q: '면접은 무료인가요?',
    a: '기본 개인 면접은 무료 토큰으로 체험할 수 있습니다. 추가 이용 시 토큰을 충전해 사용합니다. 충전 페이지에서 플랜별 가격을 확인하세요.',
  },
  {
    q: '어떤 브라우저를 사용해야 하나요?',
    a: '최신 버전의 Chrome 또는 Edge를 권장합니다. Safari는 일부 기능이 제한될 수 있으며, Internet Explorer는 지원하지 않습니다.',
  },
  {
    q: '카메라가 없어도 이용할 수 있나요?',
    a: '마이크는 필수이며, 카메라는 권장 사항입니다. 카메라가 없어도 음성 기반 면접은 진행할 수 있지만 영상 저장은 불가합니다.',
  },
  {
    q: '이력서는 어떤 형식으로 업로드하나요?',
    a: 'PDF 형식의 이력서를 업로드할 수 있습니다. 파일 크기는 최대 10MB까지 지원합니다.',
  },
  {
    q: '집단 면접에서 방은 어떻게 만드나요?',
    a: '면접 유형에서 집단 면접을 선택하면 방 생성 옵션이 나타납니다. 방을 만들면 코드가 생성되고, 다른 참가자는 해당 코드를 입력해 입장합니다.',
  },
  {
    q: '면접 영상은 저장되나요?',
    a: '면접 유형 선택 시 "영상 저장" 옵션을 켜면 면접 이력에 영상이 저장됩니다. 저장된 영상은 면접 마켓에 판매할 수도 있습니다.',
  },
  {
    q: '피드백은 어디서 확인하나요?',
    a: '면접이 끝나면 자동으로 피드백 리포트 페이지로 이동합니다. 이후에는 메뉴의 "면접 이력"에서 다시 확인할 수 있습니다.',
  },
  {
    q: '면접 마켓이란 무엇인가요?',
    a: '실제 합격자들이 업로드한 면접 영상을 구매해 전략을 참고할 수 있는 공간입니다. 내 영상을 판매해 토큰을 얻을 수도 있습니다.',
  },
];

const tips = [
  { icon: '💡', title: '조용한 환경', desc: '주변 소음이 적은 곳에서 진행하면 AI 음성 인식 정확도가 높아집니다.' },
  { icon: '💡', title: '눈높이 카메라', desc: '카메라를 눈높이에 맞추면 자연스러운 아이컨택 효과를 줄 수 있습니다.' },
  { icon: '💡', title: '적당한 조명', desc: '얼굴 앞쪽에 빛이 오도록 설정하면 영상 품질이 향상됩니다.' },
  { icon: '💡', title: 'STAR 답변법', desc: '상황(Situation), 과제(Task), 행동(Action), 결과(Result) 순서로 답변하면 구조적 점수가 높아집니다.' },
  { icon: '💡', title: '실제처럼 연습', desc: '정장을 입고 진행하면 실전 긴장감을 시뮬레이션하는 데 도움이 됩니다.' },
  { icon: '💡', title: '리포트 반복 확인', desc: '여러 번 면접 후 리포트를 비교하면 개선 추이를 파악할 수 있습니다.' },
];

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* 헤더 */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-3">이용 가이드</h1>
        <p className="text-gray-400 text-lg">인핏을 처음 사용하시는 분도 쉽게 따라할 수 있어요</p>
      </div>

      {/* 시작 전 요구사항 */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 mb-12">
        <h2 className="font-black text-gray-800 text-base mb-3">⚠️ 시작 전 확인사항</h2>
        <ul className="flex flex-col gap-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span className="text-amber-500">✓</span> Chrome 또는 Edge 최신 버전 권장
          </li>
          <li className="flex items-center gap-2">
            <span className="text-amber-500">✓</span> 마이크 사용 가능한 환경 필수 (카메라 권장)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-amber-500">✓</span> 안정적인 인터넷 연결 (집단·토론 면접 시 특히 중요)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-amber-500">✓</span> 이력서 PDF 파일 준비 (선택 사항)
          </li>
        </ul>
      </div>

      {/* 이용 순서 */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-gray-900 mb-6">이용 순서</h2>
        <div className="flex flex-col gap-3">
          {steps.map((s, i) => (
            <div key={s.step} className="flex gap-4 items-start">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-black text-sm">
                  {s.step}
                </div>
                {i < steps.length - 1 && <div className="w-px flex-1 min-h-6 bg-violet-100 mt-1" />}
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 flex-1 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{s.icon}</span>
                  <p className="font-bold text-gray-800 text-sm">{s.title}</p>
                </div>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 잘 되는 면접 팁 */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-gray-900 mb-6">면접 잘 되는 팁</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tips.map((tip, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{tip.icon}</span>
                <p className="font-bold text-gray-800 text-sm">{tip.title}</p>
              </div>
              <p className="text-sm text-gray-500">{tip.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-gray-900 mb-6">자주 묻는 질문</h2>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5">
              <p className="font-bold text-gray-800 text-sm mb-2">Q. {faq.q}</p>
              <p className="text-sm text-gray-500 leading-relaxed">A. {faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-8 text-center">
        <h3 className="text-xl font-black text-gray-900 mb-2">준비됐나요?</h3>
        <p className="text-gray-500 text-sm mb-6">지금 바로 AI 면접을 시작해 합격을 앞당겨 보세요</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/interview-types"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300 bg-white px-6 py-3 text-sm font-bold text-violet-700 transition-all hover:bg-violet-50"
          >
            면접 유형 알아보기
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)', boxShadow: '0 8px 24px rgba(124,58,237,0.2)' }}
          >
            면접 시작하기 →
          </Link>
        </div>
      </div>
    </main>
  );
}
