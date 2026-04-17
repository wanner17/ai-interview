export function StatusBadge({
  ok, okLabel, failLabel, okIcon, failIcon, neutralOnFail = false,
}: {
  ok: boolean;
  okLabel: string;
  failLabel: string;
  okIcon: string;
  failIcon: string;
  neutralOnFail?: boolean;
}) {
  const base = 'backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5';
  const okStyle = 'bg-emerald-500/20 text-emerald-200 border-emerald-400/25';
  const failStyle = neutralOnFail
    ? 'bg-zinc-500/20 text-zinc-300 border-zinc-400/20'
    : 'bg-rose-500/20 text-rose-200 border-rose-400/25';

  return (
    <span className={`${base} ${ok ? okStyle : failStyle}`}>
      {ok ? okIcon : failIcon}
      {ok ? okLabel : failLabel}
    </span>
  );
}
