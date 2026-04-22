import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '../lib/r2';
import { remuxWebm } from '../lib/ffmpeg';
import { prisma } from '../lib/prisma';
import { parseCookies } from '../lib/http';
import { SESSION_COOKIE_NAME, verifySessionToken } from '../lib/session';

const ALLOWED_CONTENT_TYPES = ['video/webm', 'video/mp4', 'video/quicktime'];
const PRESIGN_EXPIRES_IN = 900;
const PLATFORM_FEE_RATE = 0.1;
const BLUR_MODES = ['none', 'face', 'background'] as const;
const VOICE_PITCHES = ['normal', 'high', 'low'] as const;

type VideoRow = {
  id: string;
  title: string;
  description: string | null;
  hashtags: string | null;
  category: string;
  videoUrl: string;
  price: number;
  isListed: boolean | number;
  blurMode: string | null;
  voicePitch: string | null;
  sellerId: string;
  feedbackData: Prisma.JsonValue | null;
  createdAt: Date | string;
  sellerUserId?: string;
  sellerNickname?: string;
};

type PurchaseRow = {
  id: string;
  userId: string;
  videoId: string;
  pricePaid: number;
  platformFee: number;
  createdAt: Date | string;
  videoTitle: string;
  videoCategory: string;
  videoBlurMode: string | null;
  videoVoicePitch: string | null;
  sellerNickname: string;
};

function normalizeVideo(row: VideoRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    hashtags: row.hashtags,
    category: row.category,
    videoUrl: row.videoUrl,
    price: Number(row.price ?? 0),
    isListed: Boolean(row.isListed),
    blurMode: row.blurMode ?? 'none',
    voicePitch: row.voicePitch ?? 'normal',
    sellerId: row.sellerId,
    feedbackData: row.feedbackData,
    createdAt: row.createdAt,
    ...(row.sellerUserId && row.sellerNickname
      ? {
          seller: {
            userId: row.sellerUserId,
            nickname: row.sellerNickname,
          },
        }
      : {}),
  };
}

class VideoController {
  private async findOwnedVideo(id: string, userId: string) {
    const rows = await prisma.$queryRaw<VideoRow[]>(Prisma.sql`
      SELECT
        v.id,
        v.title,
        v.description,
        v.hashtags,
        v.category,
        v.videoUrl AS videoUrl,
        v.price,
        v.is_listed AS isListed,
        v.blur_mode AS blurMode,
        v.voice_pitch AS voicePitch,
        v.sellerId AS sellerId,
        v.feedback_data AS feedbackData,
        v.createdAt
      FROM Video v
      WHERE v.id = ${id} AND v.sellerId = ${userId}
      LIMIT 1
    `);

    return rows[0] ? normalizeVideo(rows[0]) : null;
  }

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

    if (key.endsWith('.webm')) {
      remuxWebm(key).catch(e => console.error('[remux]', e));
    }

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

    const existing = await this.findOwnedVideo(id, session.userId);
    if (!existing) return res.status(404).json({ ok: false, error: '영상을 찾을 수 없습니다.' });

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE Video
        SET
          title = ${title !== undefined ? title : existing.title},
          description = ${description !== undefined ? description : existing.description},
          hashtags = ${
            hashtags !== undefined
              ? JSON.stringify(hashtags)
              : existing.hashtags
          },
          price = ${price !== undefined ? Math.max(0, Number(price)) : existing.price},
          is_listed = ${isListed !== undefined ? isListed : existing.isListed},
          blur_mode = ${
            blurMode !== undefined && BLUR_MODES.includes(blurMode as (typeof BLUR_MODES)[number])
              ? blurMode
              : existing.blurMode
          },
          voice_pitch = ${
            voicePitch !== undefined && VOICE_PITCHES.includes(voicePitch as (typeof VOICE_PITCHES)[number])
              ? voicePitch
              : existing.voicePitch
          }
        WHERE id = ${id} AND sellerId = ${session.userId}
      `,
    );

    const video = await this.findOwnedVideo(id, session.userId);
    return res.json({ ok: true, video });
  };

  // 마켓 목록 (isListed=true인 영상)
  marketList = async (req: Request, res: Response) => {
    const { category, q } = req.query as { category?: string; q?: string };
    const likeQuery = q ? `%${q}%` : null;
    const rows = await prisma.$queryRaw<VideoRow[]>(Prisma.sql`
      SELECT
        v.id,
        v.title,
        v.description,
        v.hashtags,
        v.category,
        v.videoUrl AS videoUrl,
        v.price,
        v.is_listed AS isListed,
        v.blur_mode AS blurMode,
        v.voice_pitch AS voicePitch,
        v.sellerId AS sellerId,
        v.feedback_data AS feedbackData,
        v.createdAt,
        u.user_id AS sellerUserId,
        u.nickname AS sellerNickname
      FROM Video v
      JOIN User u ON u.user_id = v.sellerId
      WHERE v.is_listed = true
        AND (${category ?? null} IS NULL OR v.category = ${category ?? null})
        AND (
          ${likeQuery} IS NULL
          OR v.title LIKE ${likeQuery}
          OR v.description LIKE ${likeQuery}
          OR v.hashtags LIKE ${likeQuery}
        )
      ORDER BY v.createdAt DESC
    `);

    const safe = rows.map((row) => {
      const { videoUrl: _videoUrl, ...rest } = normalizeVideo(row);
      return rest;
    });
    return res.json({ ok: true, videos: safe });
  };

  // 마켓 상세 (구매 여부에 따라 videoUrl 포함/제외)
  marketGet = async (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);

    const { id } = req.params;
    const rows = await prisma.$queryRaw<VideoRow[]>(Prisma.sql`
      SELECT
        v.id,
        v.title,
        v.description,
        v.hashtags,
        v.category,
        v.videoUrl AS videoUrl,
        v.price,
        v.is_listed AS isListed,
        v.blur_mode AS blurMode,
        v.voice_pitch AS voicePitch,
        v.sellerId AS sellerId,
        v.feedback_data AS feedbackData,
        v.createdAt,
        u.user_id AS sellerUserId,
        u.nickname AS sellerNickname
      FROM Video v
      JOIN User u ON u.user_id = v.sellerId
      WHERE v.id = ${id} AND v.is_listed = true
      LIMIT 1
    `);
    const video = rows[0] ? normalizeVideo(rows[0]) : null;
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
    const marketRows = await prisma.$queryRaw<VideoRow[]>(Prisma.sql`
      SELECT
        v.id,
        v.title,
        v.description,
        v.hashtags,
        v.category,
        v.videoUrl AS videoUrl,
        v.price,
        v.is_listed AS isListed,
        v.blur_mode AS blurMode,
        v.voice_pitch AS voicePitch,
        v.sellerId AS sellerId,
        v.feedback_data AS feedbackData,
        v.createdAt
      FROM Video v
      WHERE v.id = ${id} AND v.is_listed = true
      LIMIT 1
    `);
    const video = marketRows[0] ? normalizeVideo(marketRows[0]) : null;
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
      await prisma.$executeRaw(
        Prisma.sql`
          INSERT INTO Purchase (id, userId, videoId, price_paid, platform_fee, createdAt)
          VALUES (${randomUUID()}, ${session.userId}, ${id}, 0, 0, NOW())
        `,
      );
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
      prisma.$executeRaw(
        Prisma.sql`
          INSERT INTO Purchase (id, userId, videoId, price_paid, platform_fee, createdAt)
          VALUES (${randomUUID()}, ${session.userId}, ${id}, ${price}, ${platformFee}, NOW())
        `,
      ),
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

    const purchases = await prisma.$queryRaw<PurchaseRow[]>(Prisma.sql`
      SELECT
        p.id,
        p.userId AS userId,
        p.videoId AS videoId,
        p.price_paid AS pricePaid,
        p.platform_fee AS platformFee,
        p.createdAt,
        v.title AS videoTitle,
        v.category AS videoCategory,
        v.blur_mode AS videoBlurMode,
        v.voice_pitch AS videoVoicePitch,
        u.nickname AS sellerNickname
      FROM Purchase p
      JOIN Video v ON v.id = p.videoId
      JOIN User u ON u.user_id = v.sellerId
      WHERE p.userId = ${session.userId}
      ORDER BY p.createdAt DESC
    `);

    return res.json({
      ok: true,
      purchases: purchases.map((purchase) => ({
        id: purchase.id,
        pricePaid: Number(purchase.pricePaid ?? 0),
        createdAt: purchase.createdAt,
        video: {
          id: purchase.videoId,
          title: purchase.videoTitle,
          category: purchase.videoCategory,
          blurMode: purchase.videoBlurMode ?? 'none',
          voicePitch: purchase.videoVoicePitch ?? 'normal',
          seller: { nickname: purchase.sellerNickname },
        },
      })),
    });
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
    const rows = await prisma.$queryRaw<VideoRow[]>(Prisma.sql`
      SELECT
        v.id,
        v.title,
        v.description,
        v.hashtags,
        v.category,
        v.videoUrl AS videoUrl,
        v.price,
        v.is_listed AS isListed,
        v.blur_mode AS blurMode,
        v.voice_pitch AS voicePitch,
        v.sellerId AS sellerId,
        v.feedback_data AS feedbackData,
        v.createdAt
      FROM Video v
      WHERE v.sellerId = ${session.userId}
      ORDER BY v.createdAt DESC
    `);
    return res.json({ ok: true, videos: rows.map(normalizeVideo) });
  };

  getOne = async (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
    if (!session) return res.status(401).json({ ok: false, error: '로그인이 필요합니다.' });
    const { id } = req.params;
    const video = await this.findOwnedVideo(id, session.userId);
    if (!video) return res.status(404).json({ ok: false, error: '영상을 찾을 수 없습니다.' });
    return res.json({ ok: true, video });
  };
}

export const videoController = new VideoController();
