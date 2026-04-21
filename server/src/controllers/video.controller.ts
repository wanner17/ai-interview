import type { Request, Response } from 'express';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '../lib/r2';
import { prisma } from '../lib/prisma';
import { parseCookies } from '../lib/http';
import { SESSION_COOKIE_NAME, verifySessionToken } from '../lib/session';

const ALLOWED_CONTENT_TYPES = ['video/webm', 'video/mp4', 'video/quicktime'];
const PRESIGN_EXPIRES_IN = 900;
const PLATFORM_FEE_RATE = 0.1;

class VideoController {
  presignUpload = async (req: Request, res: Response) => {
    const { contentType = 'video/webm' } = req.body as { contentType?: string };
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({ ok: false, error: '지원하지 않는 파일 형식입니다.' });
    }
    const ext = contentType.split('/')[1];
    const key = `interviews/${randomUUID()}.${ext}`;
    const command = new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType });
    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: PRESIGN_EXPIRES_IN });
    return res.json({ ok: true, presignedUrl, key });
  };

  create = async (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
    if (!session) return res.status(401).json({ ok: false, error: '로그인이 필요합니다.' });

    const { key, title, category, price, feedbackData } = req.body as {
      key: string; title: string; category: string; price: number; feedbackData?: any;
    };
    if (!key || !title || !category || price == null) {
      return res.status(400).json({ ok: false, error: '필수 항목을 입력해주세요.' });
    }

    const videoUrl = `${R2_PUBLIC_URL}/${key}`;
    const video = await prisma.video.create({
      data: { title, category, videoUrl, price: Number(price), sellerId: session.userId, feedbackData: feedbackData ?? undefined },
    });
    return res.status(201).json({ ok: true, video });
  };

  // 영상 판매 정보 수정 (본인 영상만)
  update = async (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
    if (!session) return res.status(401).json({ ok: false, error: '로그인이 필요합니다.' });

    const { id } = req.params;
    const { title, description, hashtags, price, isListed, blurMode, voicePitch } = req.body as {
      title?: string; description?: string; hashtags?: string[];
      price?: number; isListed?: boolean;
      blurMode?: string; voicePitch?: string;
    };

    const existing = await prisma.video.findFirst({ where: { id, sellerId: session.userId } });
    if (!existing) return res.status(404).json({ ok: false, error: '영상을 찾을 수 없습니다.' });

    const BLUR_MODES = ['none', 'face', 'background'];
    const VOICE_PITCHES = ['normal', 'high', 'low'];

    const video = await prisma.video.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(hashtags !== undefined && { hashtags: JSON.stringify(hashtags) }),
        ...(price !== undefined && { price: Math.max(0, Number(price)) }),
        ...(isListed !== undefined && { isListed }),
        ...(blurMode !== undefined && BLUR_MODES.includes(blurMode) && { blurMode }),
        ...(voicePitch !== undefined && VOICE_PITCHES.includes(voicePitch) && { voicePitch }),
      },
    });
    return res.json({ ok: true, video });
  };

  // 마켓 목록 (isListed=true인 영상)
  marketList = async (req: Request, res: Response) => {
    const { category, q } = req.query as { category?: string; q?: string };
    const videos = await prisma.video.findMany({
      where: {
        isListed: true,
        ...(category && { category }),
        ...(q && {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { hashtags: { contains: q } },
          ],
        }),
      },
      include: { seller: { select: { userId: true, nickname: true } } },
      orderBy: { createdAt: 'desc' },
    });
    // videoUrl 제외하여 반환 (구매 전 접근 차단)
    const safe = videos.map(({ videoUrl: _, ...v }) => v);
    return res.json({ ok: true, videos: safe });
  };

  // 마켓 상세 (구매 여부에 따라 videoUrl 포함/제외)
  marketGet = async (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);

    const { id } = req.params;
    const video = await prisma.video.findFirst({
      where: { id, isListed: true },
      include: { seller: { select: { userId: true, nickname: true } } },
    });
    if (!video) return res.status(404).json({ ok: false, error: '영상을 찾을 수 없습니다.' });

    const isSeller = session?.userId === video.sellerId;
    const hasPurchased = session
      ? !!(await prisma.purchase.findFirst({ where: { userId: session.userId, videoId: id } }))
      : false;
    const canWatch = isSeller || hasPurchased || video.price === 0;

    const { videoUrl, ...rest } = video;
    return res.json({
      ok: true,
      video: canWatch ? video : rest,
      canWatch,
      hasPurchased,
      isSeller,
    });
  };

  // 영상 구매
  purchase = async (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
    if (!session) return res.status(401).json({ ok: false, error: '로그인이 필요합니다.' });

    const { id } = req.params;
    const video = await prisma.video.findFirst({ where: { id, isListed: true } });
    if (!video) return res.status(404).json({ ok: false, error: '영상을 찾을 수 없습니다.' });
    if (video.sellerId === session.userId) {
      return res.status(400).json({ ok: false, error: '본인 영상은 구매할 수 없습니다.' });
    }

    const already = await prisma.purchase.findFirst({ where: { userId: session.userId, videoId: id } });
    if (already) return res.status(400).json({ ok: false, error: '이미 구매한 영상입니다.' });

    const price = video.price;
    const platformFee = Math.floor(price * PLATFORM_FEE_RATE);
    const sellerIncome = price - platformFee;

    // 무료 영상: 토큰 차감 없이 Purchase 생성
    if (price === 0) {
      await prisma.purchase.create({
        data: { userId: session.userId, videoId: id, pricePaid: 0, platformFee: 0 },
      });
      return res.json({ ok: true });
    }

    // 유료 영상: 트랜잭션으로 토큰 이동
    const buyer = await prisma.user.findUnique({ where: { userId: session.userId } });
    if (!buyer || buyer.tokens < price) {
      return res.status(400).json({ ok: false, error: '토큰이 부족합니다.' });
    }

    await prisma.$transaction([
      // 구매자 토큰 차감
      prisma.user.update({ where: { userId: session.userId }, data: { tokens: { decrement: price } } }),
      // 판매자 토큰 지급 (90%)
      prisma.user.update({ where: { userId: video.sellerId }, data: { tokens: { increment: sellerIncome } } }),
      // Purchase 기록
      prisma.purchase.create({
        data: { userId: session.userId, videoId: id, pricePaid: price, platformFee },
      }),
      // 구매자 토큰 트랜잭션
      prisma.tokenTransaction.create({
        data: {
          userId: session.userId,
          transactionType: 'video_purchase',
          amount: -price,
          balanceAfter: buyer.tokens - price,
          description: `영상 구매: ${video.title}`,
        },
      }),
      // 판매자 토큰 트랜잭션
      prisma.tokenTransaction.create({
        data: {
          userId: video.sellerId,
          transactionType: 'video_sale',
          amount: sellerIncome,
          balanceAfter: 0, // 정확한 잔액은 별도 조회 필요
          description: `영상 판매: ${video.title} (수수료 ${platformFee}T 제외)`,
        },
      }),
    ]);

    return res.json({ ok: true });
  };

  // 내가 구매한 영상 목록
  myPurchases = async (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
    if (!session) return res.status(401).json({ ok: false, error: '로그인이 필요합니다.' });

    const purchases = await prisma.purchase.findMany({
      where: { userId: session.userId },
      include: {
        video: {
          include: { seller: { select: { userId: true, nickname: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ ok: true, purchases });
  };

  list = async (_req: Request, res: Response) => {
    const videos = await prisma.video.findMany({
      include: { seller: { select: { userId: true, nickname: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ ok: true, videos });
  };

  myList = async (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
    if (!session) return res.status(401).json({ ok: false, error: '로그인이 필요합니다.' });
    const videos = await prisma.video.findMany({
      where: { sellerId: session.userId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ ok: true, videos });
  };

  getOne = async (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
    if (!session) return res.status(401).json({ ok: false, error: '로그인이 필요합니다.' });
    const { id } = req.params;
    const video = await prisma.video.findFirst({ where: { id, sellerId: session.userId } });
    if (!video) return res.status(404).json({ ok: false, error: '영상을 찾을 수 없습니다.' });
    return res.json({ ok: true, video });
  };
}

export const videoController = new VideoController();
