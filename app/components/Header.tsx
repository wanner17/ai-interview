'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type AuthUser, fetchCurrentUser, logout } from '../lib/auth';

const navItems = [
  { label: '면접 시작', href: '/' },
  { label: '면접 유형', href: '#types' },
  { label: '이용 가이드', href: '#guide' },
];

const authNavItems = [
  { label: '면접 이력', href: '/history' },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setCurrentUser(user);
          setIsAuthenticated(Boolean(user));
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setMenuOpen(false);
      router.replace('/');
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const displayName = currentUser?.nickname || currentUser?.userName || currentUser?.loginId || null;

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
              <Image src="/logo.png" alt="인핏 로고" width={32} height={32} className="h-8 w-8 brightness-0 invert" />
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
          {isAuthenticated && authNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-lg px-3.5 py-1.5 text-sm text-gray-500 transition-all hover:text-violet-700 hover:bg-violet-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 rounded-full border border-violet-100 bg-white/80 px-3 py-1.5 text-sm text-gray-700 shadow-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
                  {(displayName ?? '?').slice(0, 1).toUpperCase()}
                </span>
                <div className="leading-tight">
                  <p className="font-semibold text-gray-800">{displayName}</p>
                  <p className="text-[11px] text-gray-500">@{currentUser?.loginId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-1.5 text-sm font-medium text-rose-700 transition-all hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/?auth=login"
                className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-600 transition-all hover:bg-violet-50 hover:text-violet-700"
              >
                로그인
              </Link>
              <Link
                href="/?auth=signup"
                className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700 transition-all hover:border-violet-300 hover:bg-violet-100"
              >
                회원가입
              </Link>
            </>
          )}
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
            {isAuthenticated && authNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-gray-500 transition-colors hover:bg-violet-50 hover:text-violet-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex gap-2 pt-3 border-t border-violet-100">
            {isAuthenticated ? (
              <div className="flex w-full flex-col gap-2">
                <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-3 text-sm">
                  <p className="font-semibold text-gray-800">{displayName}</p>
                  <p className="text-xs text-gray-500">@{currentUser?.loginId}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 rounded-lg border border-rose-200 bg-rose-50 py-2 text-center text-sm font-medium text-rose-700 transition-colors hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/?auth=login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-gray-600 transition-colors hover:border-violet-200 hover:text-violet-700"
                >
                  로그인
                </Link>
                <Link
                  href="/?auth=signup"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 rounded-lg border border-violet-200 bg-violet-50 py-2 text-center text-sm font-medium text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-100"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
