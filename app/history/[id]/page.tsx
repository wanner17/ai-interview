'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { GeneralReport } from '@/app/components/results/GeneralReport';
import { PTReport } from '@/app/components/results/PTReport';
import { GroupReport } from '@/app/components/results/GroupReport';
import { DebateReport } from '@/app/components/results/DebateReport';

type InterviewVideo = {
  id: string;
  title: string;
  category: string;
  videoUrl: string;
  createdAt: string;
  feedbackData: any;
};

const CATEGORY_COLORS: Record<string, string> = {
  개인: 'bg-violet-100 text-violet-700',
  집단: 'bg-blue-100 text-blue-700',
  PT: 'bg-amber-100 text-amber-700',
  토론: 'bg-green-100 text-green-700',
  외국어: 'bg-rose-100 text-rose-700',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [video, setVideo] = useState<InterviewVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/my-interviews/${params.id}`, { credentials: 'include' });
        if (res.status === 401) {
          router.replace('/?auth=login');
          return;
        }
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        setVideo(data.video);
      } catch (e) {
        setError(e instanceof Error ? e.message : '불러오기에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, router]);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) {
        position -= pdf.internal.pageSize.getHeight();
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      pdf.save('interview-report.pdf');
    } catch (e) {
      console.error('[pdf]', e);
    }
  };

  const renderFeedback = (v: InterviewVideo) => {
    if (!v.feedbackData) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
          저장된 AI 피드백 데이터가 없습니다.
        </div>
      );
    }

    const cat = v.category;

    if (cat === '개인' || cat === '외국어') {
      return (
        <GeneralReport
          reportData={v.feedbackData as any[]}
          reportRef={reportRef}
          onDownloadPdf={handleDownloadPdf}
        />
      );
    }

    if (cat === 'PT') {
      return <PTReport ptResults={v.feedbackData as any[]} />;
    }

    if (cat === '집단') {
      const fd = v.feedbackData as any;
      return (
        <GroupReport
          groupResults={{ results: fd.results, participants: fd.participants }}
          mySocketId={fd.mySocketId ?? ''}
          groupRoomCode=""
        />
      );
    }

    if (cat === '토론') {
      const fd = v.feedbackData as any;
      return (
        <DebateReport
          debateResults={fd}
          mySocketId={fd.mySocketId ?? ''}
          debateTotalRoundsState={fd.totalRounds ?? 3}
        />
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
        지원하지 않는 면접 유형입니다.
      </div>
    );
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/history"
          className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          면접 이력
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && video && (
        <div className="flex flex-col gap-8">
          {/* 헤더 */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[video.category] ?? 'bg-gray-100 text-gray-600'}`}>
                  {video.category}면접
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{video.title}</h1>
              <p className="mt-1 text-sm text-gray-400">{formatDate(video.createdAt)}</p>
            </div>
          </div>

          {/* 영상 */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 shadow-sm">
            <div className="aspect-video">
              <video
                src={video.videoUrl}
                controls
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          {/* AI 피드백 */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-gray-900">AI 피드백</h2>
            {renderFeedback(video)}
          </div>
        </div>
      )}
    </main>
  );
}
