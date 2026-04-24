'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { type AuthUser, fetchCurrentUser } from '../lib/auth';
import { checkInAttendance, fetchAttendanceStatus } from '../lib/attendance';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CalendarCell = {
  key: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isChecked: boolean;
};

function getMonthState(baseDate: Date) {
  return {
    year: baseDate.getFullYear(),
    month: baseDate.getMonth() + 1,
  };
}

function buildCalendar(year: number, month: number, attendanceDays: string[], todayKey: string) {
  const checkedDays = new Set(attendanceDays);
  const firstDay = new Date(year, month - 1, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const previousMonthDays = new Date(year, month - 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let index = startWeekday - 1; index >= 0; index -= 1) {
    const dayNumber = previousMonthDays - index;
    cells.push({
      key: `prev-${year}-${month}-${dayNumber}`,
      dayNumber,
      isCurrentMonth: false,
      isToday: false,
      isChecked: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      key,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: key === todayKey,
      isChecked: checkedDays.has(key),
    });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      key: `next-${year}-${month}-${nextDay}`,
      dayNumber: nextDay,
      isCurrentMonth: false,
      isToday: false,
      isChecked: false,
    });
    nextDay += 1;
  }

  return cells;
}

function formatMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
  }).format(new Date(year, month - 1, 1));
}

export default function AttendancePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [monthState, setMonthState] = useState(() => getMonthState(new Date()));
  const [attendanceDays, setAttendanceDays] = useState<string[]>([]);
  const [todayKey, setTodayKey] = useState('');
  const [todayChecked, setTodayChecked] = useState(false);
  const [balance, setBalance] = useState(0);
  const [checkedCount, setCheckedCount] = useState(0);
  const [rewardAmount, setRewardAmount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const user = await fetchCurrentUser();
        if (!user) {
          router.replace('/?auth=login');
          return;
        }

        const status = await fetchAttendanceStatus(monthState.year, monthState.month);
        if (cancelled) {
          return;
        }

        setCurrentUser(user);
        setAttendanceDays(status.attendanceDays);
        setTodayKey(status.todayKey);
        setTodayChecked(status.todayChecked);
        setBalance(status.balance);
        setCheckedCount(status.checkedCount);
        setRewardAmount(status.rewardAmount);
      } catch (loadError) {
        if (!cancelled) {
          const loadMessage = loadError instanceof Error ? loadError.message : '출석 정보를 불러오지 못했습니다.';
          if (loadMessage.includes('로그인')) {
            router.replace('/?auth=login');
            return;
          }
          setError(loadMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [monthState, router]);

  const calendarCells = buildCalendar(monthState.year, monthState.month, attendanceDays, todayKey);
  const isCurrentMonthView =
    todayKey.startsWith(`${monthState.year}-${String(monthState.month).padStart(2, '0')}`);
  const displayName = currentUser?.nickname || currentUser?.userName || currentUser?.loginId || '회원';

  async function handleCheckIn() {
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const result = await checkInAttendance();
      setTodayChecked(true);
      setBalance(result.balance);
      setAttendanceDays((current) => (current.includes(result.attendanceKey) ? current : [...current, result.attendanceKey]));
      setCheckedCount((count) => count + 1);
      setMessage(null);
      setCurrentUser((user) => (user ? { ...user, tokens: result.balance } : user));
    } catch (checkInError) {
      setError(checkInError instanceof Error ? checkInError.message : '출석체크에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  function moveMonth(offset: number) {
    setMonthState((current) => {
      const nextDate = new Date(current.year, current.month - 1 + offset, 1);
      return getMonthState(nextDate);
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <section className="overflow-hidden rounded-[24px] border border-violet-100/80 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="bg-[linear-gradient(180deg,#faf8ff_0%,#ffffff_100%)] px-5 py-6 sm:px-6">
          <Link href="/mypage" className="text-sm font-medium text-stone-500 transition hover:text-zinc-900">
            ← 마이페이지
          </Link>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="ui-kicker">Attendance</p>
              <h1 className="ui-title mt-2 text-[30px] sm:text-[34px]">출석체크</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard label="현재 사용자" value={displayName} accent="violet" />
              <SummaryCard label="보유 토큰" value={`${balance.toLocaleString()}T`} accent="amber" />
              <SummaryCard label="이번 달 출석" value={`${checkedCount}일`} accent="emerald" />
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-[24px] border border-stone-200 bg-white px-5 py-14 text-center text-sm text-stone-500 shadow-sm">
          출석 정보를 불러오는 중입니다.
        </section>
      ) : error ? (
        <section className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-5 text-sm text-rose-700">
          {error}
        </section>
      ) : (
        <section className="overflow-hidden rounded-[24px] border border-violet-100/80 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="border-b border-violet-100/80 bg-violet-50/35 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="ui-kicker">Monthly Board</p>
                <h2 className="ui-section-title mt-2">{formatMonthLabel(monthState.year, monthState.month)}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveMonth(-1)}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-stone-300 hover:text-zinc-900"
                >
                  이전 달
                </button>
                <button
                  type="button"
                  onClick={() => moveMonth(1)}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-stone-300 hover:text-zinc-900"
                >
                  다음 달
                </button>
              </div>
            </div>

            {message ? (
              <p className="mt-4 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </p>
            ) : null}
          </div>

          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                  {label}
                </div>
              ))}
              {calendarCells.map((cell) => (
                <AttendanceCell
                  key={cell.key}
                  cell={cell}
                  rewardAmount={rewardAmount}
                  submitting={submitting}
                  isCurrentMonthView={isCurrentMonthView}
                  onCheckIn={handleCheckIn}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'violet' | 'amber' | 'emerald';
}) {
  const accentClass =
    accent === 'amber'
      ? 'border-amber-100 bg-amber-50/50'
      : accent === 'emerald'
        ? 'border-emerald-100 bg-emerald-50/40'
        : 'border-violet-100 bg-violet-50/45';

  return (
    <div className={`rounded-[18px] border px-4 py-4 ${accentClass}`}>
      <p className="ui-label">{label}</p>
      <p className="mt-3 text-base font-semibold tracking-[-0.02em] text-zinc-950">{value}</p>
    </div>
  );
}

function AttendanceCell({
  cell,
  rewardAmount,
  submitting,
  isCurrentMonthView,
  onCheckIn,
}: {
  cell: CalendarCell;
  rewardAmount: number;
  submitting: boolean;
  isCurrentMonthView: boolean;
  onCheckIn: () => void;
}) {
  if (!cell.isCurrentMonth) {
    return (
      <div className="min-h-[126px] rounded-[20px] bg-stone-50/70 px-3 py-3 text-stone-300 sm:min-h-[142px]">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
          {cell.dayNumber}
        </span>
      </div>
    );
  }

  const isActionable = cell.isToday && !cell.isChecked;

  return (
    <div
      className={`relative min-h-[126px] overflow-hidden rounded-[20px] border px-3 py-3 sm:min-h-[142px] ${
        cell.isToday
          ? 'border-violet-300 bg-[linear-gradient(180deg,#fbf9ff_0%,#ffffff_100%)] shadow-[0_10px_24px_rgba(124,58,237,0.10)]'
          : 'border-stone-200 bg-white'
      }`}
    >
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between">
          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
              cell.isToday ? 'bg-zinc-900 text-white' : 'bg-stone-100 text-zinc-800'
            }`}
          >
            {cell.dayNumber}
          </span>
          {cell.isToday ? (
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700">
              Today
            </span>
          ) : null}
        </div>

        <div className="mt-auto pt-6">
          {isActionable ? (
            <button
              type="button"
              onClick={onCheckIn}
              disabled={submitting || !isCurrentMonthView}
              className="w-full rounded-[12px] border border-violet-200/80 bg-violet-50 px-3 py-2.5 text-center text-[13px] font-semibold tracking-[-0.02em] text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 hover:text-violet-800 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
            >
              {submitting ? '처리 중...' : '출석하기'}
            </button>
          ) : (
            <div className="h-[44px]" />
          )}
        </div>
      </div>

      {cell.isChecked ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_0%,rgba(255,255,255,0)_58%,rgba(244,63,94,0.04)_100%)]" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rotate-[-17deg] rounded-[18px] border-[3px] border-rose-500/80 px-5 py-2 text-center shadow-[0_0_0_4px_rgba(255,255,255,0.7)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-rose-400/90">Attendance</p>
              <p className="mt-1 text-xl font-black uppercase tracking-[0.16em] text-rose-600/90 sm:text-2xl">IN-Pass</p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
