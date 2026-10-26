import type { SourceFormat, TargetFormat } from '@/types';
import { extractFirstFrameFromGif } from './gifParser';

export const MAX_FILES = 20;
export const PAGE_SIZE = 5;

const EXTENSION_TO_FORMAT: Record<string, SourceFormat> = {
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpg',
  jfif: 'jpg',
  webp: 'webp',
  avif: 'avif',
  gif: 'gif',
  bmp: 'bmp',
  dib: 'bmp',
};

const MIME_TO_FORMAT: Record<string, SourceFormat> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/x-bmp': 'bmp',
  'image/x-ms-bmp': 'bmp',
};

export const FORMAT_MIME: Record<TargetFormat, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  bmp: 'image/bmp',
};

export const ACCEPT_ATTRIBUTE =
  'image/png,image/jpeg,image/webp,image/avif,image/gif,image/bmp,.png,.jpg,.jpeg,.webp,.avif,.gif,.bmp';

export function detectSourceFormat(file: File): SourceFormat | null {
  const byMime = MIME_TO_FORMAT[file.type.toLowerCase()];
  if (byMime) return byMime;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TO_FORMAT[ext] ?? null;
}

/** Keeps the original base name and swaps only the extension. */
export function buildConvertedName(originalName: string, format: TargetFormat): string {
  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName;
  return `${baseName}.${format}`;
}

export interface DecodedImage {
  canvas: HTMLCanvasElement;
  isAnimatedGif: boolean;
  frameCount: number;
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function get2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('CANVAS_CONTEXT_UNAVAILABLE');
  return ctx;
}

async function loadImageElement(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('IMAGE_DECODE_FAILED'));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function decodeToCanvas(file: File, sourceFormat: SourceFormat): Promise<DecodedImage> {
  if (sourceFormat === 'gif') {
    const gif = await extractFirstFrameFromGif(file);
    const canvas = createCanvas(gif.width, gif.height);
    get2dContext(canvas).putImageData(gif.firstFrameImageData, 0, 0);
    return { canvas, isAnimatedGif: gif.isAnimated, frameCount: gif.frameCount };
  }

  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await createImageBitmap(file, {
      premultiplyAlpha: 'none',
      colorSpaceConversion: 'none',
    });
  } catch {
    source = await loadImageElement(file);
  }

  const width = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const height = 'naturalHeight' in source ? source.naturalHeight : source.height;
  if (!width || !height) throw new Error('IMAGE_DECODE_FAILED');

  const canvas = createCanvas(width, height);
  get2dContext(canvas).drawImage(source, 0, 0);
  if ('close' in source) source.close();
  return { canvas, isAnimatedGif: false, frameCount: 1 };
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('CANVAS_ENCODE_FAILED'))),
      mime,
      quality
    );
  });
}

function getImageData(canvas: HTMLCanvasElement): ImageData {
  return get2dContext(canvas).getImageData(0, 0, canvas.width, canvas.height);
}

/** JPEG has no alpha channel, so transparent pixels are flattened onto white instead of black. */
async function encodeJpg(canvas: HTMLCanvasElement): Promise<Blob> {
  const flat = createCanvas(canvas.width, canvas.height);
  const ctx = get2dContext(flat);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, flat.width, flat.height);
  ctx.drawImage(canvas, 0, 0);
  return canvasToBlob(flat, 'image/jpeg', 1);
}

/** Chromium switches to lossless WebP when quality is exactly 1. */
async function encodeWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await canvasToBlob(canvas, 'image/webp', 1);
  if (blob.type !== 'image/webp') throw new Error('WEBP_ENCODE_UNSUPPORTED');
  return blob;
}

async function encodeAvif(canvas: HTMLCanvasElement): Promise<Blob> {
  const native = await canvasToBlob(canvas, 'image/avif', 1).catch(() => null);
  if (native && native.type === 'image/avif') return native;

  const { default: encode } = await import('@jsquash/avif/encode');
  const buffer = await encode(getImageData(canvas), { lossless: true, speed: 6 });
  return new Blob([buffer], { type: 'image/avif' });
}

/** 32-bit BGRA bitmap with a BITMAPV4HEADER so the alpha channel survives. */
function encodeBmp(canvas: HTMLCanvasElement): Blob {
  const { width, height, data } = getImageData(canvas);
  const fileHeaderSize = 14;
  const infoHeaderSize = 108;
  const pixelOffset = fileHeaderSize + infoHeaderSize;
  const pixelBytes = width * height * 4;
  const buffer = new ArrayBuffer(pixelOffset + pixelBytes);
  const view = new DataView(buffer);

  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, buffer.byteLength, true);
  view.setUint32(10, pixelOffset, true);

  view.setUint32(14, infoHeaderSize, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 32, true);
  view.setUint32(30, 3, true);
  view.setUint32(34, pixelBytes, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(54, 0x00ff0000, true);
  view.setUint32(58, 0x0000ff00, true);
  view.setUint32(62, 0x000000ff, true);
  view.setUint32(66, 0xff000000, true);
  view.setUint32(70, 0x73524742, true);

  const pixels = new Uint8Array(buffer, pixelOffset);
  let offset = 0;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      pixels[offset++] = data[src + 2];
      pixels[offset++] = data[src + 1];
      pixels[offset++] = data[src];
      pixels[offset++] = data[src + 3];
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Builds an exact palette when the image has at most 256 colors and binary alpha
 * (typical pixel-art sprites), which keeps the GIF output pixel-identical.
 */
function buildExactPalette(data: Uint8ClampedArray): { palette: number[][]; index: Uint8Array; transparentIndex: number } | null {
  const colorToIndex = new Map<number, number>();
  const palette: number[][] = [];
  const index = new Uint8Array(data.length / 4);
  let transparentIndex = -1;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const alpha = data[i + 3];
    if (alpha !== 0 && alpha !== 255) return null;

    const key = alpha === 0 ? -1 : (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    let paletteIndex = colorToIndex.get(key);
    if (paletteIndex === undefined) {
      if (palette.length >= 256) return null;
      paletteIndex = palette.length;
      palette.push(alpha === 0 ? [0, 0, 0] : [data[i], data[i + 1], data[i + 2]]);
      colorToIndex.set(key, paletteIndex);
      if (alpha === 0) transparentIndex = paletteIndex;
    }
    index[p] = paletteIndex;
  }

  return { palette, index, transparentIndex };
}

async function encodeGif(canvas: HTMLCanvasElement): Promise<Blob> {
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
  const { width, height, data } = getImageData(canvas);
  const encoder = GIFEncoder();

  const exact = buildExactPalette(data);
  if (exact) {
    encoder.writeFrame(exact.index, width, height, {
      palette: exact.palette,
      transparent: exact.transparentIndex >= 0,
      transparentIndex: Math.max(exact.transparentIndex, 0),
    });
  } else {
    const palette = quantize(data, 256, { format: 'rgba4444', oneBitAlpha: true });
    const index = applyPalette(data, palette, 'rgba4444');
    const transparentIndex = palette.findIndex((color) => color.length > 3 && color[3] === 0);
    encoder.writeFrame(index, width, height, {
      palette,
      transparent: transparentIndex >= 0,
      transparentIndex: Math.max(transparentIndex, 0),
    });
  }

  encoder.finish();
  return new Blob([encoder.bytes()], { type: 'image/gif' });
}

export async function encodeCanvas(canvas: HTMLCanvasElement, format: TargetFormat): Promise<Blob> {
  switch (format) {
    case 'png':
      return canvasToBlob(canvas, 'image/png');
    case 'jpg':
      return encodeJpg(canvas);
    case 'webp':
      return encodeWebp(canvas);
    case 'avif':
      return encodeAvif(canvas);
    case 'bmp':
      return encodeBmp(canvas);
    case 'gif':
      return encodeGif(canvas);
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
