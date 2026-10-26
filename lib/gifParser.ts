import { decompressFrame, parseGIF, type ParsedGif } from 'gifuct-js';

export interface GifInspectResult {
  isAnimated: boolean;
  frameCount: number;
  width: number;
  height: number;
}

export interface GifParseResult extends GifInspectResult {
  firstFrameImageData: ImageData;
}

type GifImageFrame = Extract<ParsedGif['frames'][number], { image: unknown }>;

function getImageFrames(gif: ParsedGif): GifImageFrame[] {
  return gif.frames.filter((frame): frame is GifImageFrame => 'image' in frame);
}

async function parseFile(file: File): Promise<ParsedGif> {
  const buffer = await file.arrayBuffer();
  try {
    return parseGIF(buffer);
  } catch {
    throw new Error('INVALID_GIF_FILE');
  }
}

/** Counts frames without decompressing pixel data, so large animated GIFs stay cheap to inspect. */
export async function inspectGif(file: File): Promise<GifInspectResult> {
  const gif = await parseFile(file);
  const frameCount = getImageFrames(gif).length;
  if (frameCount === 0) throw new Error('INVALID_GIF_FILE');
  return {
    isAnimated: frameCount > 1,
    frameCount,
    width: gif.lsd.width,
    height: gif.lsd.height,
  };
}

/**
 * Decodes only Frame 0. The patch is composited onto a logical-screen-sized
 * buffer because the first frame may be smaller than the GIF canvas.
 */
export async function extractFirstFrameFromGif(file: File): Promise<GifParseResult> {
  const gif = await parseFile(file);
  const imageFrames = getImageFrames(gif);
  if (imageFrames.length === 0) throw new Error('INVALID_GIF_FILE');

  const firstFrame = decompressFrame(imageFrames[0], gif.gct, true);
  const { width: frameWidth, height: frameHeight, left, top } = firstFrame.dims;
  const width = gif.lsd.width || frameWidth;
  const height = gif.lsd.height || frameHeight;

  const firstFrameImageData = new ImageData(width, height);
  const target = firstFrameImageData.data;
  const patch = firstFrame.patch;

  for (let y = 0; y < frameHeight; y++) {
    const destY = y + top;
    if (destY < 0 || destY >= height) continue;
    for (let x = 0; x < frameWidth; x++) {
      const destX = x + left;
      if (destX < 0 || destX >= width) continue;
      const src = (y * frameWidth + x) * 4;
      const dest = (destY * width + destX) * 4;
      target[dest] = patch[src];
      target[dest + 1] = patch[src + 1];
      target[dest + 2] = patch[src + 2];
      target[dest + 3] = patch[src + 3];
    }
  }

  return {
    isAnimated: imageFrames.length > 1,
    frameCount: imageFrames.length,
    width,
    height,
    firstFrameImageData,
  };
}
