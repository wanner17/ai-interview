import type { Request, Response } from 'express';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '../lib/r2';
import { prisma } from '../lib/prisma';
import { parseCookies } from '../lib/http';
import { SESSION_COOKIE_NAME, verifySessionToken } from '../lib/session';

const ALLOWED_CONTENT_TYPES = ['video/webm', 'video/mp4', 'video/quicktime'];

const PRESIGN_EXPIRES_IN = 900; // 15분

class VideoController {
  presignUpload = async (req: Request, res: Response) => {
    const { contentType = 'video/webm' } = req.body as { contentType?: string };

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({ ok: false, error: '지원하지 않는 파일 형식입니다.' });
    }

    const ext = contentType.split('/')[1];
    const key = `interviews/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: PRESIGN_EXPIRES_IN });

    return res.json({ ok: true, presignedUrl, key });
  };

  create = async (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
    if (!session) {
      return res.status(401).json({ ok: false, error: '로그인이 필요합니다.' });
    }

    const { key, title, category, price, feedbackData } = req.body as {
      key: string;
      title: string;
      category: string;
      price: number;
      feedbackData?: any;
    };

    if (!key || !title || !category || price == null) {
      return res.status(400).json({ ok: false, error: '필수 항목을 입력해주세요.' });
    }

    const videoUrl = `${R2_PUBLIC_URL}/${key}`;

    const video = await prisma.video.create({
      data: {
        title,
        category,
        videoUrl,
        price: Number(price),
        sellerId: session.userId,
        feedbackData: feedbackData ?? undefined,
      },
    });

    return res.status(201).json({ ok: true, video });
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
    if (!session) {
      return res.status(401).json({ ok: false, error: '로그인이 필요합니다.' });
    }

    const videos = await prisma.video.findMany({
      where: { sellerId: session.userId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ ok: true, videos });
  };

  getOne = async (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
    if (!session) {
      return res.status(401).json({ ok: false, error: '로그인이 필요합니다.' });
    }

    const { id } = req.params;
    const video = await prisma.video.findFirst({
      where: { id, sellerId: session.userId },
    });

    if (!video) {
      return res.status(404).json({ ok: false, error: '영상을 찾을 수 없습니다.' });
    }

    return res.json({ ok: true, video });
  };
}

export const videoController = new VideoController();
