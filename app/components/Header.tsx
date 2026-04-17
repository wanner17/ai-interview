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
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 transition-transform group-hover:scale-105">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">
            AI<span className="text-violet-400">면접</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/8 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button className="rounded-md px-4 py-1.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/8 hover:text-white">
            로그인
          </button>
          <button className="rounded-md bg-violet-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-violet-500 hover:shadow-violet-500/25 hover:shadow-md">
            회원가입
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/8 hover:text-white"
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

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/80 px-4 py-3 backdrop-blur-xl">
          <nav className="flex flex-col gap-1 mb-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/8 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex gap-2 pt-2 border-t border-white/10">
            <button className="flex-1 rounded-md border border-white/20 py-2 text-sm font-medium text-white/70 transition-colors hover:border-white/40 hover:text-white">
              로그인
            </button>
            <button className="flex-1 rounded-md bg-violet-600 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500">
              회원가입
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
