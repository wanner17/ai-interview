'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { GeneralReport } from '@/app/components/results/GeneralReport';
import { PTReport } from '@/app/components/results/PTReport';
import { GroupReport } from '@/app/components/results/GroupReport';
import { DebateReport } from '@/app/components/results/DebateReport';
import { PrivacyVideoPlayer, type BlurMode, type VoicePitch } from '@/app/components/PrivacyVideoPlayer';

type InterviewVideo = {
  id: string;
  title: string;
  description: string | null;
  hashtags: string | null;
  category: string;
  videoUrl: string;
  price: number;
  isListed: boolean;
  blurMode: string;
  voicePitch: string;
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
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function HistoryDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [video, setVideo] = useState<InterviewVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement | null>(null);

  // 재생 프라이버시 설정 (로컬 뷰어용)
  const [blurMode, setBlurMode] = useState<BlurMode>('none');
  const [voicePitch, setVoicePitch] = useState<VoicePitch>('normal');

  // 판매 설정 폼
  const [sellTitle, setSellTitle] = useState('');
  const [sellDesc, setSellDesc] = useState('');
  const [sellHashtags, setSellHashtags] = useState('');
  const [sellPrice, setSellPrice] = useState(0);
  const [sellBlurMode, setSellBlurMode] = useState<BlurMode>('none');
  const [sellVoicePitch, setSellVoicePitch] = useState<VoicePitch>('normal');
  const [isListed, setIsListed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/my-interviews/${params.id}`, { credentials: 'include' });
        if (res.status === 401) { router.replace('/?auth=login'); return; }
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        const v: InterviewVideo = data.video;
        setVideo(v);
        setSellTitle(v.title);
        setSellDesc(v.description ?? '');
        setSellHashtags(v.hashtags ? JSON.parse(v.hashtags).join(', ') : '');
        setSellPrice(v.price);
        setSellBlurMode((v.blurMode as BlurMode) || 'none');
        setSellVoicePitch((v.voicePitch as VoicePitch) || 'normal');
        setIsListed(v.isListed);
      } catch (e) {
        setError(e instanceof Error ? e.message : '불러오기에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, router]);

  const handleSaveSell = async () => {
    if (!video) return;
    setSaving(true); setSaveMsg(null);
    try {
      const hashtags = sellHashtags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch(`/api/my-interviews/${video.id}/sell`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: sellTitle, description: sellDesc, hashtags, price: sellPrice, isListed, blurMode: sellBlurMode, voicePitch: sellVoicePitch }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setVideo(v => v ? { ...v, ...data.video } : v);
      setSaveMsg('저장되었습니다.');
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pw = pdf.internal.pageSize.getWidth(), ph = (canvas.height * pw) / canvas.width;
      let hl = ph, pos = 0;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, pw, ph);
      hl -= pdf.internal.pageSize.getHeight();
      while (hl > 0) { pos -= pdf.internal.pageSize.getHeight(); pdf.addPage(); pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, pw, ph); hl -= pdf.internal.pageSize.getHeight(); }
      pdf.save('interview-report.pdf');
    } catch (e) { console.error('[pdf]', e); }
  };

  const renderFeedback = (v: InterviewVideo) => {
    if (!v.feedbackData) return <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">저장된 AI 피드백 데이터가 없습니다.</div>;
    const cat = v.category;
    if (cat === '개인' || cat === '외국어') return <GeneralReport reportData={v.feedbackData as any[]} reportRef={reportRef} onDownloadPdf={handleDownloadPdf} />;
    if (cat === 'PT') return <PTReport ptResults={v.feedbackData as any[]} />;
    if (cat === '집단') { const fd = v.feedbackData as any; return <GroupReport groupResults={{ results: fd.results, participants: fd.participants }} mySocketId={fd.mySocketId ?? ''} groupRoomCode="" />; }
    if (cat === '토론') { const fd = v.feedbackData as any; return <DebateReport debateResults={fd} mySocketId={fd.mySocketId ?? ''} debateTotalRoundsState={fd.totalRounds ?? 3} />; }
    return <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">지원하지 않는 면접 유형입니다.</div>;
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link href="/history" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          면접 이력
        </Link>
      </div>

      {loading && <div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /></div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>}

      {!loading && !error && video && (
        <div className="flex flex-col gap-8">
          {/* 헤더 */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[video.category] ?? 'bg-gray-100 text-gray-600'}`}>{video.category}면접</span>
              {video.isListed && <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">마켓 판매중</span>}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{video.title}</h1>
            <p className="mt-1 text-sm text-gray-400">{formatDate(video.createdAt)}</p>
          </div>

          {/* 재생 옵션 (로컬 뷰어) */}
          <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-gray-400 whitespace-nowrap">재생 시 얼굴·배경</span>
              <div className="flex gap-1.5">
                {([{ id: 'none', label: '없음', icon: '🎥' }, { id: 'face', label: '얼굴 블러', icon: '🫥' }, { id: 'background', label: '배경 블러', icon: '🌫️' }] as const).map(opt => (
                  <button key={opt.id} onClick={() => setBlurMode(opt.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${blurMode === opt.id ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300'}`}>
                    <span>{opt.icon}</span><span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-gray-400 whitespace-nowrap">재생 시 음성</span>
              <div className="flex gap-1.5">
                {([{ id: 'normal', label: '원본', icon: '🎤' }, { id: 'high', label: '높게', icon: '🔼' }, { id: 'low', label: '낮게', icon: '🔽' }] as const).map(opt => (
                  <button key={opt.id} onClick={() => setVoicePitch(opt.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${voicePitch === opt.id ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300'}`}>
                    <span>{opt.icon}</span><span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 영상 플레이어 */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 shadow-sm">
            <PrivacyVideoPlayer src={video.videoUrl} blurMode={blurMode} voicePitch={voicePitch} />
          </div>

          {/* ── 판매 설정 패널 ── */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-base font-bold text-gray-900">마켓 판매 설정</h2>
                <p className="text-xs text-gray-400 mt-0.5">이 영상을 마켓에 등록하고 다른 사람들에게 판매할 수 있습니다</p>
              </div>
              <button
                onClick={() => setIsListed(v => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${isListed ? 'bg-emerald-500' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isListed ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* 제목 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">제목</label>
                <input
                  value={sellTitle} onChange={e => setSellTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition-colors"
                  placeholder="영상 제목을 입력하세요"
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">설명</label>
                <textarea
                  value={sellDesc} onChange={e => setSellDesc(e.target.value)} rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition-colors resize-none"
                  placeholder="어떤 면접인지, 어떤 점을 참고하면 좋은지 설명해 주세요"
                />
              </div>

              {/* 해시태그 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">해시태그 <span className="font-normal text-gray-400">(쉼표로 구분)</span></label>
                <input
                  value={sellHashtags} onChange={e => setSellHashtags(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition-colors"
                  placeholder="예: 대기업, 직무면접, 압박질문"
                />
                {sellHashtags && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {sellHashtags.split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full font-medium">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* 가격 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">판매 가격</label>
                <div className="flex gap-2">
                  <button onClick={() => setSellPrice(0)} className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${sellPrice === 0 ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300'}`}>
                    무료
                  </button>
                  {[10, 30, 50, 100].map(p => (
                    <button key={p} onClick={() => setSellPrice(p)} className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${sellPrice === p ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300'}`}>
                      {p}T
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3">
                    <input
                      type="number" min={0} value={sellPrice} onChange={e => setSellPrice(Math.max(0, Number(e.target.value)))}
                      className="w-16 text-sm focus:outline-none"
                      placeholder="직접입력"
                    />
                    <span className="text-sm text-gray-400">T</span>
                  </div>
                </div>
                {sellPrice > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">판매 시 수익: <span className="text-emerald-600 font-semibold">{Math.floor(sellPrice * 0.9)}T</span> <span className="text-gray-300">(플랫폼 수수료 10% 제외)</span></p>
                )}
              </div>

              {/* 판매 영상 프라이버시 설정 */}
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 flex flex-col gap-4">
                <p className="text-xs font-bold text-amber-700">구매자에게 보여질 영상 설정</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-600 w-24 shrink-0">얼굴·배경 처리</span>
                  <div className="flex gap-1.5">
                    {([{ id: 'none', label: '없음', icon: '🎥' }, { id: 'face', label: '얼굴 블러', icon: '🫥' }, { id: 'background', label: '배경 블러', icon: '🌫️' }] as const).map(opt => (
                      <button key={opt.id} onClick={() => setSellBlurMode(opt.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${sellBlurMode === opt.id ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300'}`}>
                        <span>{opt.icon}</span><span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-600 w-24 shrink-0">음성 변조</span>
                  <div className="flex gap-1.5">
                    {([{ id: 'normal', label: '원본', icon: '🎤' }, { id: 'high', label: '높게', icon: '🔼' }, { id: 'low', label: '낮게', icon: '🔽' }] as const).map(opt => (
                      <button key={opt.id} onClick={() => setSellVoicePitch(opt.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${sellVoicePitch === opt.id ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300'}`}>
                        <span>{opt.icon}</span><span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleSaveSell} disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}
                >
                  {saving ? '저장 중...' : '설정 저장'}
                </button>
                {saveMsg && <p className={`text-sm ${saveMsg.includes('실패') || saveMsg.includes('오류') ? 'text-rose-500' : 'text-emerald-600'}`}>{saveMsg}</p>}
              </div>
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
