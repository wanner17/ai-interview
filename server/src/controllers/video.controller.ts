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
const BLUR_MODES = ['none', 'face', 'background', 'both'] as const;
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
  clipStart: number | null;
  clipEnd: number | null;
  sellerId: string;
  feedbackData: Prisma.JsonValue | null;
  viewCount: number;
  createdAt: Date | string;
  sellerUserId?: string;
  sellerNickname?: string;
  avgRating?: number | null;
  reviewCount?: number;
  purchaseCount?: number;
};

type PurchaseRow = {
  id: string;
  userId: string;
  videoId: string;
  pricePaid: number;
  platformFee: number;
  blurMode: string | null;
  voicePitch: string | null;
  clipStart: number | null;
  clipEnd: number | null;
  createdAt: Date | string;
  videoTitle: string;
  videoCategory: string;
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
    clipStart: row.clipStart != null ? Number(row.clipStart) : null,
    clipEnd: row.clipEnd != null ? Number(row.clipEnd) : null,
    sellerId: row.sellerId,
    feedbackData: row.feedbackData,
    viewCount: Number(row.viewCount ?? 0),
    createdAt: row.createdAt,
    ...(row.avgRating !== undefined ? { avgRating: row.avgRating != null ? Math.round(Number(row.avgRating) * 10) / 10 : null } : {}),
    ...(row.reviewCount !== undefined ? { reviewCount: Number(row.reviewCount ?? 0) } : {}),
    ...(row.purchaseCount !== undefined ? { purchaseCount: Number(row.purchaseCount ?? 0) } : {}),
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
        v.clip_start AS clipStart,
        v.clip_end AS clipEnd,
        v.sellerId AS sellerId,
        v.feedback_data AS feedbackData,
        v.view_count AS viewCount,
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
    const { title, description, hashtags, price, isListed, blurMode, voicePitch, clipStart, clipEnd } = req.body as {
      title?: string; description?: string; hashtags?: string[];
      price?: number; isListed?: boolean;
      blurMode?: string; voicePitch?: string;
      clipStart?: number | null; clipEnd?: number | null;
    };

    const existing = await this.findOwnedVideo(id, session.userId);
    if (!existing) return res.status(404).json({ ok: false, error: '영상을 찾을 수 없습니다.' });

    // clip 유효성 검사
    let newClipStart: number | null = existing.clipStart;
    let newClipEnd: number | null = existing.clipEnd;
    if (clipStart !== undefined) newClipStart = clipStart != null ? Math.max(0, Number(clipStart)) : null;
    if (clipEnd !== undefined) newClipEnd = clipEnd != null ? Math.max(0, Number(clipEnd)) : null;
    if (newClipStart != null && newClipEnd != null && newClipEnd <= newClipStart) {
      return res.status(400).json({ ok: false, error: '종료 시간은 시작 시간보다 커야 합니다.' });
    }

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
          },
          clip_start = ${newClipStart},
          clip_end = ${newClipEnd}
        WHERE id = ${id} AND sellerId = ${session.userId}
      `,
    );

    const video = await this.findOwnedVideo(id, session.userId);
    return res.json({ ok: true, video });
  };

  // 마켓 목록 (isListed=true인 영상)
  marketList = async (req: Request, res: Response) => {
    const { category, q, sortBy, limit } = req.query as {
      category?: string;
      q?: string;
      sortBy?: string;
      limit?: string;
    };
    const likeQuery = q ? `%${q}%` : null;

    const orderBy =
      sortBy === 'popular'
        ? Prisma.raw('purchaseCount DESC, v.createdAt DESC')
        : sortBy === 'rating'
        ? Prisma.raw('avgRating DESC, reviewCount DESC, v.createdAt DESC')
        : Prisma.raw('v.createdAt DESC');

    const limitNum = limit && /^\d+$/.test(limit) ? parseInt(limit, 10) : null;
    const limitSql = limitNum ? Prisma.raw(`LIMIT ${limitNum}`) : Prisma.raw('');

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
        v.clip_start AS clipStart,
        v.clip_end AS clipEnd,
        v.sellerId AS sellerId,
        v.feedback_data AS feedbackData,
        v.view_count AS viewCount,
        v.createdAt,
        u.user_id AS sellerUserId,
        u.nickname AS sellerNickname,
        AVG(r.rating) AS avgRating,
        COUNT(r.id) AS reviewCount,
        (SELECT COUNT(*) FROM Purchase p WHERE p.videoId = v.id) AS purchaseCount
      FROM Video v
      JOIN User u ON u.user_id = v.sellerId
      LEFT JOIN VideoReview r ON r.video_id = v.id
      WHERE v.is_listed = true
        AND (${category ?? null} IS NULL OR v.category = ${category ?? null})
        AND (
          ${likeQuery} IS NULL
          OR v.title LIKE ${likeQuery}
          OR v.description LIKE ${likeQuery}
          OR v.hashtags LIKE ${likeQuery}
        )
      GROUP BY v.id, u.user_id
      ORDER BY ${orderBy}
      ${limitSql}
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
        v.clip_start AS clipStart,
        v.clip_end AS clipEnd,
        v.sellerId AS sellerId,
        v.feedback_data AS feedbackData,
        v.view_count AS viewCount,
        v.createdAt,
        u.user_id AS sellerUserId,
        u.nickname AS sellerNickname,
        AVG(r.rating) AS avgRating,
        COUNT(r.id) AS reviewCount
      FROM Video v
      JOIN User u ON u.user_id = v.sellerId
      LEFT JOIN VideoReview r ON r.video_id = v.id
      WHERE v.id = ${id} AND v.is_listed = true
      GROUP BY v.id, u.user_id
      LIMIT 1
    `);
    const video = rows[0] ? normalizeVideo(rows[0]) : null;
    if (!video) return res.status(404).json({ ok: false, error: '영상을 찾을 수 없습니다.' });

    const isSeller = session?.userId === video.sellerId;
    const purchase = session
      ? await prisma.$queryRaw<{ blurMode: string; voicePitch: string; clipStart: number | null; clipEnd: number | null }[]>(Prisma.sql`
          SELECT blur_mode AS blurMode, voice_pitch AS voicePitch, clip_start AS clipStart, clip_end AS clipEnd
          FROM Purchase
          WHERE userId = ${session.userId} AND videoId = ${id}
          LIMIT 1
        `).then(rows => rows[0] ?? null)
      : null;
    const hasPurchased = !!purchase;
    const canWatch = isSeller || hasPurchased || video.price === 0;

    const { videoUrl, ...rest } = video;
    return res.json({
      ok: true,
      video: canWatch ? video : rest,
      canWatch,
      hasPurchased,
      isSeller,
      ...(hasPurchased && purchase
        ? {
            purchasedBlurMode: purchase.blurMode,
            purchasedVoicePitch: purchase.voicePitch,
            purchasedClipStart: purchase.clipStart != null ? Number(purchase.clipStart) : null,
            purchasedClipEnd: purchase.clipEnd != null ? Number(purchase.clipEnd) : null,
          }
        : {}),
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
        v.clip_start AS clipStart,
        v.clip_end AS clipEnd,
        v.sellerId AS sellerId,
        v.feedback_data AS feedbackData,
        v.view_count AS viewCount,
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
          INSERT INTO Purchase (id, userId, videoId, price_paid, platform_fee, blur_mode, voice_pitch, clip_start, clip_end, createdAt)
          VALUES (${randomUUID()}, ${session.userId}, ${id}, 0, 0, ${video.blurMode}, ${video.voicePitch}, ${video.clipStart ?? null}, ${video.clipEnd ?? null}, NOW())
        `,
      );
      return res.json({ ok: true });
    }

    // 유료 영상: token 우선, 부족분은 cash 차감
    const buyer = await prisma.user.findUnique({ where: { userId: session.userId } });
    if (!buyer || buyer.cash + buyer.tokens < price) {
      return res.status(400).json({ ok: false, error: '캐시와 토큰이 부족합니다.' });
    }

    const tokenAmountUsed = Math.min(buyer.tokens, price);
    const cashAmountUsed = price - tokenAmountUsed;

    await prisma.$transaction(async (tx) => {
      const seller = await tx.user.findUnique({ where: { userId: video.sellerId } });
      if (!seller) {
        throw new Error('판매자를 찾을 수 없습니다.');
      }

      const updatedBuyer = await tx.user.update({
        where: { userId: session.userId },
        data: {
          tokens: { decrement: tokenAmountUsed },
          cash: { decrement: cashAmountUsed },
        },
      });

      const updatedSeller = await tx.user.update({
        where: { userId: video.sellerId },
        data: {
          cash: { increment: sellerIncome },
        },
      });

      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO Purchase (
            id, userId, videoId, price_paid, platform_fee, cash_amount_used, token_amount_used,
            blur_mode, voice_pitch, clip_start, clip_end, createdAt
          )
          VALUES (
            ${randomUUID()}, ${session.userId}, ${id}, ${price}, ${platformFee}, ${cashAmountUsed}, ${tokenAmountUsed},
            ${video.blurMode}, ${video.voicePitch}, ${video.clipStart ?? null}, ${video.clipEnd ?? null}, NOW()
          )
        `,
      );

      if (tokenAmountUsed > 0) {
        await tx.tokenTransaction.create({
          data: {
            userId: session.userId,
            transactionType: 'video_purchase',
            amount: -tokenAmountUsed,
            balanceAfter: updatedBuyer.tokens,
            description: `영상 구매 토큰 사용: ${video.title}`,
          },
        });
      }

      if (cashAmountUsed > 0) {
        await tx.cashTransaction.create({
          data: {
            userId: session.userId,
            transactionType: 'video_purchase',
            amount: -cashAmountUsed,
            balanceAfter: updatedBuyer.cash,
            description: `영상 구매 캐시 사용: ${video.title}`,
          },
        });
      }

      await tx.cashTransaction.create({
        data: {
          userId: video.sellerId,
          transactionType: 'video_sale',
          amount: sellerIncome,
          balanceAfter: updatedSeller.cash,
          description: `영상 판매: ${video.title} (수수료 ${platformFee}C 제외)`,
        },
      });
    });

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
        p.blur_mode AS blurMode,
        p.voice_pitch AS voicePitch,
        p.clip_start AS clipStart,
        p.clip_end AS clipEnd,
        p.createdAt,
        v.title AS videoTitle,
        v.category AS videoCategory,
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
          blurMode: purchase.blurMode ?? 'none',
          voicePitch: purchase.voicePitch ?? 'normal',
          clipStart: purchase.clipStart != null ? Number(purchase.clipStart) : null,
          clipEnd: purchase.clipEnd != null ? Number(purchase.clipEnd) : null,
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
        v.clip_start AS clipStart,
        v.clip_end AS clipEnd,
        v.sellerId AS sellerId,
        v.feedback_data AS feedbackData,
        v.view_count AS viewCount,
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

  incrementView = async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.$executeRaw(Prisma.sql`UPDATE Video SET view_count = view_count + 1 WHERE id = ${id} AND is_listed = true`);
    return res.json({ ok: true });
  };

  getReviews = async (req: Request, res: Response) => {
    const { id } = req.params;
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);

    type ReviewRow = {
      id: string;
      userId: string;
      nickname: string;
      rating: number;
      body: string;
      createdAt: Date | string;
    };

    const rows = await prisma.$queryRaw<ReviewRow[]>(Prisma.sql`
      SELECT r.id, r.user_id AS userId, u.nickname, r.rating, r.body, r.created_at AS createdAt
      FROM VideoReview r
      JOIN User u ON u.user_id = r.user_id
      WHERE r.video_id = ${id}
      ORDER BY r.created_at DESC
    `);

    const avgRow = await prisma.$queryRaw<{ avg: number | null }[]>(Prisma.sql`
      SELECT AVG(rating) AS avg FROM VideoReview WHERE video_id = ${id}
    `);
    const avgRating = avgRow[0]?.avg != null ? Math.round(Number(avgRow[0].avg) * 10) / 10 : null;

    const myReview = session
      ? rows.find(r => r.userId === session.userId) ?? null
      : null;

    return res.json({
      ok: true,
      reviews: rows.map(r => ({ ...r, rating: Number(r.rating) })),
      avgRating,
      myReview: myReview ? { ...myReview, rating: Number(myReview.rating) } : null,
    });
  };

  createReview = async (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
    if (!session) return res.status(401).json({ ok: false, error: '로그인이 필요합니다.' });

    const { id } = req.params;
    const { rating, body } = req.body as { rating: number; body: string };

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ ok: false, error: '별점은 1~5 사이여야 합니다.' });
    }
    if (!body || body.trim().length === 0) {
      return res.status(400).json({ ok: false, error: '댓글 내용을 입력해주세요.' });
    }
    if (body.trim().length > 500) {
      return res.status(400).json({ ok: false, error: '댓글은 500자 이내로 입력해주세요.' });
    }

    const hasPurchase = await prisma.$queryRaw<{ cnt: number }[]>(Prisma.sql`
      SELECT COUNT(*) AS cnt FROM Purchase WHERE userId = ${session.userId} AND videoId = ${id}
    `).then(rows => Number(rows[0]?.cnt ?? 0) > 0);

    if (!hasPurchase) {
      return res.status(403).json({ ok: false, error: '구매한 영상에만 리뷰를 작성할 수 있습니다.' });
    }

    const reviewId = randomUUID();
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO VideoReview (id, video_id, user_id, rating, body, created_at, updated_at)
      VALUES (${reviewId}, ${id}, ${session.userId}, ${Number(rating)}, ${body.trim()}, NOW(), NOW())
      ON DUPLICATE KEY UPDATE rating = ${Number(rating)}, body = ${body.trim()}, updated_at = NOW()
    `);

    return res.json({ ok: true });
  };

  deleteReview = async (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
    if (!session) return res.status(401).json({ ok: false, error: '로그인이 필요합니다.' });

    const { id, reviewId } = req.params;
    const deleted = await prisma.$executeRaw(Prisma.sql`
      DELETE FROM VideoReview WHERE id = ${reviewId} AND video_id = ${id} AND user_id = ${session.userId}
    `);

    if (!deleted) return res.status(404).json({ ok: false, error: '리뷰를 찾을 수 없습니다.' });
    return res.json({ ok: true });
  };
}

export const videoController = new VideoController();
