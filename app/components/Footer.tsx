export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/40">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white/80">
              AI<span className="text-violet-400">면접</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-5 text-xs text-white/40">
            <a href="#" className="transition-colors hover:text-white/70">이용약관</a>
            <a href="#" className="transition-colors hover:text-white/70">개인정보처리방침</a>
            <a href="#" className="transition-colors hover:text-white/70">문의하기</a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-white/30">
            © 2026 AI면접. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
