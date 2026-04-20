import { createClient, type Session } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

export type AuthSession = Session;

export type InterviewReportItem = {
  question: string;
  answer: string;
  focusScore: number;
  answerScore: number;
  analysis: {
    totalFrames: number;
    lookAwayFrames: number;
    mouthOpenFrames: number;
  };
  feedback?: {
    good?: string;
    bad?: string;
  };
};

type SaveInterviewReportInput = {
  reportData: InterviewReportItem[];
};

export async function saveInterviewReport({
  reportData,
}: SaveInterviewReportInput): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) {
    return { ok: false, error: 'Supabase 환경 변수가 없습니다.' };
  }

  const averageScore =
    reportData.length > 0
      ? Math.round(
          reportData.reduce((total, item) => total + (item.answerScore || 0), 0) / reportData.length,
        )
      : 0;

  const { error } = await supabase.from('interview_results').insert({
      average_score: averageScore,
      question_count: reportData.length,
      report_data: reportData,
  });

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return { ok: true };
}

export async function signUpWithEmail({
  email,
  password,
  nickname,
}: {
  email: string;
  password: string;
  nickname: string;
}) {
  if (!supabase) {
    return { ok: false as const, error: 'Supabase 환경 변수가 없습니다.' };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname,
      },
    },
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

export async function signInWithEmail({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  if (!supabase) {
    return { ok: false as const, error: 'Supabase 환경 변수가 없습니다.' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

export async function signOut() {
  if (!supabase) {
    return { ok: false as const, error: 'Supabase 환경 변수가 없습니다.' };
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}
