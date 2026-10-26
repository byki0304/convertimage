import { NextResponse } from 'next/server';

const ALLOWED_FORMATS = new Set(['png', 'jpg', 'webp', 'avif', 'gif', 'bmp']);

interface ConversionAuditPayload {
  uid: string | null;
  toFormat: string;
  count: number;
  failed: number;
  animatedGifCount: number;
}

/** Audit log endpoint. Image bytes never reach the server; conversion happens entirely in the browser. */
export async function POST(request: Request) {
  let payload: ConversionAuditPayload;
  try {
    payload = (await request.json()) as ConversionAuditPayload;
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const count = Number(payload.count);
  if (!ALLOWED_FORMATS.has(payload.toFormat) || !Number.isInteger(count) || count < 1 || count > 20) {
    return NextResponse.json({ ok: false, error: 'INVALID_PAYLOAD' }, { status: 400 });
  }

  console.info(
    JSON.stringify({
      event: 'conversion_completed',
      uid: payload.uid ?? 'guest',
      toFormat: payload.toFormat,
      count,
      failed: Number(payload.failed) || 0,
      animatedGifCount: Number(payload.animatedGifCount) || 0,
      at: new Date().toISOString(),
    })
  );

  return NextResponse.json({ ok: true });
}
