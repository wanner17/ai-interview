'use client';

import Image from 'next/image';

type AuthView = 'login' | 'signup';

type AuthPanelProps = {
  view: AuthView;
  identifier: string;
  loginId: string;
  email: string;
  password: string;
  nickname: string;
  userName: string;
  isSubmitting: boolean;
  authError: string | null;
  authMessage: string | null;
  onViewChange: (view: AuthView) => void;
  onIdentifierChange: (value: string) => void;
  onLoginIdChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNicknameChange: (value: string) => void;
  onUserNameChange: (value: string) => void;
  onSubmit: () => void;
};

export function AuthPanel({
  view,
  identifier,
  loginId,
  email,
  password,
  nickname,
  userName,
  isSubmitting,
  authError,
  authMessage,
  onViewChange,
  onIdentifierChange,
  onLoginIdChange,
  onEmailChange,
  onPasswordChange,
  onNicknameChange,
  onUserNameChange,
  onSubmit,
}: AuthPanelProps) {
  const mode = view;

  return (
    <div className="min-h-screen bg-[#F0F4FF] dark:bg-[#0A0A0F] px-4 py-10 text-zinc-900 dark:text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl shadow-lg shadow-blue-600/30">
              <Image src="/logo.png" alt="인패스 로고" width={40} height={40} className="h-12 w-12 brightness-0 invert" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">나에게 딱맞는 인터뷰</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">회원가입 또는 로그인 후 면접을 시작할 수 있습니다.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onViewChange(mode === 'login' ? 'signup' : 'login')}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {mode === 'login' ? '회원가입으로' : '로그인으로'}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#123A8F] via-[#1E4FD6] to-[#0D8BD7] p-8 text-white shadow-2xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-blue-100">Interview Flow</p>
            <h2 className="mb-4 text-4xl font-black leading-tight">계정으로 면접 기록을 누적하고 질문별 점수를 관리합니다.</h2>
            <p className="max-w-xl text-sm leading-7 text-blue-50/90">
              회원 기준으로 면접 회차, 질문별 답변, AI 평가 점수, 이후 등급과 순위를 연결하려면 먼저 인증 세션이 있어야 합니다.
              지금 단계에서는 이메일 기반 회원가입과 로그인을 먼저 붙입니다.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <FeatureCard title="회원 세션" description="로그인 상태 유지 후 면접 데이터 연결" />
              <FeatureCard title="기록 누적" description="면접 회차별 결과 저장 기반 마련" />
              <FeatureCard title="점수 확장" description="문항 점수와 등급 시스템 연결 준비" />
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-[#111118]">
            <div className="mb-6 flex rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => onViewChange('login')}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  mode === 'login' ? 'bg-white text-zinc-900 shadow dark:bg-zinc-800 dark:text-white' : 'text-zinc-500'
                }`}
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => onViewChange('signup')}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  mode === 'signup' ? 'bg-white text-zinc-900 shadow dark:bg-zinc-800 dark:text-white' : 'text-zinc-500'
                }`}
              >
                회원가입
              </button>
            </div>

            <div className="space-y-4">
              {mode === 'login' && (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">아이디 또는 이메일</span>
                  <input
                    value={identifier}
                    onChange={(event) => onIdentifierChange(event.target.value)}
                    placeholder="login_id 또는 email"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
              )}

              {mode === 'signup' && (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">아이디</span>
                    <input
                      value={loginId}
                      onChange={(event) => onLoginIdChange(event.target.value)}
                      placeholder="사용할 로그인 아이디"
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">닉네임</span>
                    <input
                      value={nickname}
                      onChange={(event) => onNicknameChange(event.target.value)}
                      placeholder="사용할 닉네임"
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">이름</span>
                    <input
                      value={userName}
                      onChange={(event) => onUserNameChange(event.target.value)}
                      placeholder="실명 또는 표시 이름"
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </label>
                </>
              )}

              {mode === 'signup' && (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">이메일</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => onEmailChange(event.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">비밀번호</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="8자 이상 비밀번호"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>

              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
              </button>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              {authMessage && (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {authMessage}
                </p>
              )}
              {authError && (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                  {authError}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <p className="mb-1 text-sm font-black">{title}</p>
      <p className="text-xs leading-6 text-blue-50/80">{description}</p>
    </div>
  );
}
