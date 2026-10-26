export type Locale = 'ko' | 'en' | 'ja';

export const LOCALES: Locale[] = ['ko', 'en', 'ja'];

export type TargetFormat = 'png' | 'jpg' | 'webp' | 'avif' | 'gif' | 'bmp';

export const TARGET_FORMATS: TargetFormat[] = ['png', 'jpg', 'webp', 'avif', 'gif', 'bmp'];

export type SourceFormat = TargetFormat;

export type ConversionStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface ConvertedFileItem {
  id: string;
  originalFile: File;
  originalName: string;
  sourceFormat: SourceFormat;
  previewUrl: string;
  convertedBlob: Blob | null;
  convertedUrl: string | null;
  convertedName: string | null;
  targetFormat: TargetFormat;
  status: ConversionStatus;
  errorMessage?: string;
  isAnimatedGif?: boolean;
  frameCount?: number;
  width?: number;
  height?: number;
}

export interface HistoryEntry {
  id: string;
  originalName: string;
  convertedName: string;
  fromFormat: SourceFormat;
  toFormat: TargetFormat;
  isAnimatedGif: boolean;
  extractedFrame: number | null;
  fileSize: number;
  convertedSize: number;
  convertedAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  preferredLanguage: Locale;
  preferredFormat: TargetFormat;
  totalConversions?: number;
}
