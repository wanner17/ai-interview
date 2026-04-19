'use client';

import { useState } from 'react';

const navItems = [
  { label: '면접 시작', href: '/' },
  { label: '면접 유형', href: '#types' },
  { label: '이용 가이드', href: '#guide' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-violet-100" />

      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-violet-400/30 blur-md transition-all group-hover:blur-lg" />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-200 transition-transform group-hover:scale-105">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              인핏
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">AI Interview</span>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-lg px-3.5 py-1.5 text-sm text-gray-500 transition-all hover:text-violet-700 hover:bg-violet-50"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button disabled title="준비 중" className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-300 cursor-not-allowed select-none">
            로그인
          </button>
          <button disabled title="준비 중" className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-300 cursor-not-allowed select-none">
            회원가입
            <span className="text-[10px] rounded bg-violet-100 text-violet-400 px-1.5 py-0.5 leading-none font-semibold tracking-wide">SOON</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-violet-50 hover:text-violet-600"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="메뉴 열기"
        >
          {menuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="relative md:hidden border-t border-violet-100 bg-white/90 px-4 py-4 backdrop-blur-xl">
          <nav className="flex flex-col gap-0.5 mb-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-gray-500 transition-colors hover:bg-violet-50 hover:text-violet-700"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex gap-2 pt-3 border-t border-violet-100">
            <button disabled className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-300 cursor-not-allowed">
              로그인
            </button>
            <button disabled className="flex-1 rounded-lg bg-violet-50 border border-violet-200 py-2 text-sm font-medium text-violet-300 cursor-not-allowed">
              회원가입
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
