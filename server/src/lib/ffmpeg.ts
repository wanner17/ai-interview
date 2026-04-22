import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, R2_BUCKET } from './r2';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, readFile, unlink } from 'fs/promises';

if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);

export async function remuxWebm(key: string): Promise<void> {
  const { Body } = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  if (!Body) throw new Error(`R2 object not found: ${key}`);

  const id = Date.now();
  const inputPath = join(tmpdir(), `remux-in-${id}.webm`);
  const outputPath = join(tmpdir(), `remux-out-${id}.webm`);

  const chunks: Buffer[] = [];
  for await (const chunk of Body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  await writeFile(inputPath, Buffer.concat(chunks));

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions('-c copy')
      .save(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err));
  });

  const output = await readFile(outputPath);
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: output,
    ContentType: 'video/webm',
  }));

  await Promise.allSettled([unlink(inputPath), unlink(outputPath)]);
}
