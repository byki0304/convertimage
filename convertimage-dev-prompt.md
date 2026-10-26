# Cursor Master Prompt: Building 'convertimage' App

> **Project Name**: convertimage (Lossless Game Asset Converter)
> **Target AI Agent**: Cursor (Composer & Chat)
> **Reference Specs**: `convertimage_spec_1_4.md` & `업무용_프로그램_개발_Design_Doc_1_1.md`
> **Primary Stack**: Next.js 15+ (React 19, App Router), TypeScript, Tailwind CSS v4, Framer Motion, HTML5 Canvas, Firebase Auth/Firestore, Vercel

---

## 1. System Role & Core Guidelines for Cursor

You are acting as a Lead Full-Stack Software Engineer & UI/UX Designer specializing in Next.js, React 19, WebAssembly/Canvas processing, Tailwind CSS, and Firebase.

Your mission is to generate, refactor, and finalize the complete production codebase for **`convertimage`**—a web application designed for mini-game developers to perform lossless batch conversions across image formats (`JPG`, `PNG`, `WebP`, `AVIF`, `GIF`, `BMP`).

### Mandatory Rules & Constraints

1. **Strict Language Rule (Code & Assets)**:
   - ALL code (components, hooks, utility functions, variables, types, interfaces, filenames, folder names, database collections/fields, API routes, comments) **MUST BE 100% IN ENGLISH**.
   - NEVER write Korean or Japanese in code comments, function names, or file names.

2. **UI/UX Text & Multi-Language (i18n)**:
   - ALL user-facing UI labels, menus, buttons, tooltips, toasts, and error messages MUST be abstracted into i18n translation files (`ko.json`, `en.json`, `ja.json`).
   - Default language is **Korean (`ko`)**. Provide an instant language switcher `[Ko / En / Ja]`.

3. **Visual & Design Theme ('K-Daemon Hunter' Anime Vibe)**:
   - **NO character illustrations**. Focus purely on background textures, glassmorphic fixtures, glowing borders, and neon icons.
   - **Color Palette**: Obsidian Dark Base (`#0B0C10`, `#12131C`), Neon Cyan (`#00F0FF`), Vivid Magenta (`#FF0055`), Electric Purple (`#9D00FF`).
   - **Glassmorphism**: Translucent panels with `backdrop-filter: blur(12px)`.
   - **Interactions**: Glow pulse on drag enter, neon edge lighting on button hover/click.

4. **Image Processing & GIF Rules**:
   - Support batch uploads from **1 to maximum 20 files**.
   - UI must display uploaded items in **paginated/sliding lists of 5 items per view**.
   - Converted output files MUST preserve original filenames (changing only the extension).
   - **GIF Handling**:
     - Single-frame GIF (static image) -> convert directly via Canvas.
     - Multi-frame GIF (animated/video) -> detect frame count > 1, extract **Frame 0 (first frame)** pixel data, and convert Frame 0 to the target format as a static image.

5. **Ultra-Fast Responsive Layouts**:
   - **Desktop (`w >= 1024px`)**: Left Sidebar (280px) + Top/Center Conversion Tabs + Main DropZone.
   - **Mobile Portrait (`w < 1024px`, Portrait)**: Top Header + Bottom Navigation Bar (height 64px).
   - **Mobile Landscape (`w < 1024px`, Landscape)**: Compact Top Header (48px) + Bottom Navigation Bar (height 56px) + 2-column card grid.
   - **Drag & Drop** and **File Selector Button** must work simultaneously across ALL layout profiles.

---

## 2. Technical Architecture & Tech Stack

```text
convertimage/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/
│   │   │   ├── intro/page.tsx      # 6s Intro Video Player
│   │   │   └── login/page.tsx      # Firebase Auth Screen
│   │   ├── page.tsx               # Main Converter Screen (PNG default)
│   │   ├── layout.tsx             # Root Responsive Layout
│   │   └── mypage/page.tsx        # User Profile & History
│   └── api/
│       └── convert/route.ts       # Fallback API / Audit logging
├── components/
│   ├── ui/                        # Glassmorphic Glow Buttons, Cards, Tabs
│   ├── layout/                    # Desktop Sidebar, Mobile Bottom Nav, Header
│   ├── converter/                 # DropZone, BatchList (5-item page), FormatTabs
│   └── common/                    # IntroVideoPlayer, LanguageSwitcher
├── hooks/
│   ├── useImageConverter.ts       # Canvas, GIF frame 0 extraction, WASM, JSZip
│   ├── useResponsiveLayout.ts     # Screen orientation & breakpoint detector
│   └── useFirebaseAuth.ts         # Google, Email, Phone, Guest auth
├── locales/
│   ├── ko.json                    # Default Korean UI strings
│   ├── en.json                    # English UI strings
│   └── ja.json                    # Japanese UI strings
├── lib/
│   ├── firebase.ts                # Firebase Auth & Firestore Config
│   └── gifParser.ts               # gifuct-js wrapper for Frame 0 extraction
└── public/
    └── assets/                    # Icons, Video, Brands
```

---

## 3. Step-by-Step Implementation Instructions for Cursor

### Step 1: Tailwind CSS v4 'K-Daemon Hunter' Theme Configuration

Create or update `tailwind.config.ts` to include custom dark neon colors and keyframe animations:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwind-css';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#0B0C10',
          card: '#12131C',
          glass: 'rgba(22, 24, 36, 0.75)',
        },
        neon: {
          cyan: '#00F0FF',
          magenta: '#FF0055',
          purple: '#9D00FF',
        },
      },
      backdropBlur: {
        glass: '12px',
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.5), inset 0 0 15px rgba(0, 240, 255, 0.2)',
        'neon-magenta': '0 0 15px rgba(255, 0, 85, 0.5), inset 0 0 15px rgba(255, 0, 85, 0.2)',
        'neon-purple': '0 0 20px rgba(157, 0, 255, 0.6)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'portal-spin': 'portalSpin 20s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 0, 85, 0.8)' },
        },
        portalSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

---

### Step 2: GIF Frame 0 Extraction & Multi-Format Canvas Engine

Create `lib/gifParser.ts` and `hooks/useImageConverter.ts` to handle GIF inspection and Canvas/WASM processing:

```typescript
// lib/gifParser.ts
import { parseGIF, decompressFrames } from 'gifuct-js';

export interface GifParseResult {
  isAnimated: boolean;
  frameCount: number;
  firstFrameImageData: ImageData | null;
}

export async function extractFirstFrameFromGif(file: File): Promise<GifParseResult> {
  const buffer = await file.arrayBuffer();
  const gif = parseGIF(buffer);
  const frames = decompressFrames(gif, true);

  if (!frames || frames.length === 0) {
    throw new Error('Invalid GIF file format');
  }

  const isAnimated = frames.length > 1;
  const firstFrame = frames[0];
  const { width, height } = firstFrame.dims;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  const imgData = ctx.createImageData(width, height);
  imgData.data.set(firstFrame.patch);

  return {
    isAnimated,
    frameCount: frames.length,
    firstFrameImageData: imgData,
  };
}
```

```typescript
// hooks/useImageConverter.ts
import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { extractFirstFrameFromGif } from '@/lib/gifParser';

export type TargetFormat = 'png' | 'jpg' | 'webp' | 'avif' | 'bmp';

export interface ConvertedFileItem {
  id: string;
  originalFile: File;
  originalName: string;
  convertedBlob: Blob | null;
  convertedUrl: string | null;
  targetFormat: TargetFormat;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  isAnimatedGif?: boolean;
}

export function useImageConverter() {
  const [items, setItems] = useState<ConvertedFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).slice(0, 20); // Cap at 20 files
    const newItems: ConvertedFileItem[] = fileArray.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
      originalFile: file,
      originalName: file.name,
      convertedBlob: null,
      convertedUrl: null,
      targetFormat: 'png', // Default format is PNG
      status: 'pending',
    }));

    setItems((prev) => [...prev, ...newItems].slice(0, 20));
  }, []);

  const convertSingleItem = async (
    item: ConvertedFileItem,
    targetFormat: TargetFormat
  ): Promise<ConvertedFileItem> => {
    try {
      let canvas = document.createElement('canvas');
      let ctx = canvas.getContext('2d');
      let isAnimatedGif = false;

      const fileType = item.originalFile.type.toLowerCase();
      const fileName = item.originalFile.name.toLowerCase();

      if (fileType.includes('gif') || fileName.endsWith('.gif')) {
        const gifResult = await extractFirstFrameFromGif(item.originalFile);
        isAnimatedGif = gifResult.isAnimated;

        if (gifResult.firstFrameImageData && ctx) {
          canvas.width = gifResult.firstFrameImageData.width;
          canvas.height = gifResult.firstFrameImageData.height;
          ctx.putImageData(gifResult.firstFrameImageData, 0, 0);
        }
      } else {
        const img = new Image();
        const imageUrl = URL.createObjectURL(item.originalFile);
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx?.drawImage(img, 0, 0);
        URL.revokeObjectURL(imageUrl);
      }

      let mimeType = `image/${targetFormat}`;
      if (targetFormat === 'jpg') mimeType = 'image/jpeg';

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Canvas conversion failed'))),
          mimeType,
          0.95
        );
      });

      const convertedUrl = URL.createObjectURL(blob);

      return {
        ...item,
        convertedBlob: blob,
        convertedUrl,
        targetFormat,
        status: 'completed',
        isAnimatedGif,
      };
    } catch (err: any) {
      return {
        ...item,
        status: 'error',
        errorMessage: err.message || 'Conversion failed',
      };
    }
  };

  const convertAll = useCallback(
    async (targetFormat: TargetFormat = 'png') => {
      setIsProcessing(true);
      const updatedItems: ConvertedFileItem[] = [];

      for (const item of items) {
        const result = await convertSingleItem(item, targetFormat);
        updatedItems.push(result);
      }

      setItems(updatedItems);
      setIsProcessing(false);
    },
    [items]
  );

  const downloadAllAsZip = useCallback(async () => {
    const zip = new JSZip();
    items.forEach((item) => {
      if (item.convertedBlob) {
        const nameWithoutExt = item.originalName.substring(
          0,
          item.originalName.lastIndexOf('.')
        ) || item.originalName;
        const newFileName = `${nameWithoutExt}.${item.targetFormat}`;
        zip.file(newFileName, item.convertedBlob);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'convertimage-lossless-assets.zip');
  }, [items]);

  return {
    items,
    addFiles,
    convertAll,
    downloadAllAsZip,
    isProcessing,
    setItems,
  };
}
```

---

### Step 3: Internationalization (i18n) Setup

Create `locales/ko.json`, `locales/en.json`, and `locales/ja.json`:

```json
// locales/ko.json
{
  "app_title": "convertimage",
  "app_subtitle": "미니게임 손실 없는 이미지 포맷 변환기",
  "menu_png": "PNG로 변환",
  "menu_jpg": "JPG로 변환",
  "menu_webp": "WebP로 변환",
  "menu_avif": "AVIF로 변환",
  "menu_gif": "GIF로 변환",
  "menu_bmp": "BMP로 변환",
  "dropzone_title": "이미지 파일 드래그 & 드롭",
  "dropzone_desc": "최대 20개 파일까지 업로드 (5개 단위 목록 표현)",
  "btn_select_file": "파일 선택하기",
  "btn_convert_all": "일괄 변환 시작",
  "btn_download_zip": "ZIP 일괄 다운로드",
  "gif_notice_animated": "동영상 GIF 감지됨: 첫 프레임(Frame 0) 정적 이미지로 변환",
  "intro_skip": "건너뛰기"
}
```

---

### Step 4: Responsive Glassmorphic Layout Components

Implement `components/layout/DesktopSidebar.tsx`, `components/layout/MobileBottomNav.tsx`, and `components/converter/DropZone.tsx` with neon styles:

```tsx
// components/converter/DropZone.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  i18n: any;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded, i18n }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <motion.div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      animate={{
        scale: isDragOver ? 1.02 : 1,
        borderColor: isDragOver ? '#00F0FF' : 'rgba(157, 0, 255, 0.4)',
      }}
      className={`relative w-full p-8 rounded-2xl border-2 border-dashed bg-obsidian-glass backdrop-blur-glass transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
        isDragOver ? 'shadow-neon-cyan' : 'hover:border-neon-magenta shadow-neon-purple'
      }`}
    >
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -top-10 w-40 h-40 bg-neon-magenta/10 rounded-full blur-3xl pointer-events-none" />

      {/* Glowing Neon Icon */}
      <svg className="w-16 h-16 mb-4 text-neon-cyan animate-pulse-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>

      <h3 className="text-xl font-bold text-white mb-2 tracking-wide">
        {i18n.dropzone_title}
      </h3>
      <p className="text-sm text-gray-400 mb-6 text-center">
        {i18n.dropzone_desc}
      </p>

      <label className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-magenta text-white font-semibold cursor-pointer shadow-neon-magenta hover:brightness-125 transition-all">
        {i18n.btn_select_file}
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/bmp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onFilesAdded(Array.from(e.target.files));
          }}
        />
      </label>
    </motion.div>
  );
};
```

---

### Step 5: 6-Second Omni Video Intro Component

Implement `components/common/IntroVideoPlayer.tsx` for the 6-second video intro:

```tsx
// components/common/IntroVideoPlayer.tsx
'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export const IntroVideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const router = useRouter();

  const handleVideoEnd = () => {
    router.push('/auth');
  };

  const handleSkip = () => {
    router.push('/auth');
  };

  return (
    <div className="relative w-screen h-screen bg-obsidian flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        src="/assets/intro.mp4"
        autoPlay
        muted={isMuted}
        playsInline
        onEnded={handleVideoEnd}
        className="w-full h-full object-cover"
      />

      <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="px-4 py-2 rounded-xl bg-obsidian-card/80 backdrop-blur-glass border border-neon-cyan/50 text-neon-cyan text-sm font-medium hover:bg-neon-cyan/20 transition-all"
        >
          {isMuted ? 'UNMUTE 🔊' : 'MUTE 🔇'}
        </button>

        <button
          onClick={handleSkip}
          className="px-6 py-2 rounded-xl bg-neon-magenta/80 backdrop-blur-glass text-white font-bold text-sm tracking-wider shadow-neon-magenta hover:brightness-125 transition-all"
        >
          SKIP ⏩
        </button>
      </div>
    </div>
  );
};
```

---

## 4. Final Cursor Checklist before Execution

- [x] Next.js 15 App Router & React 19 structure verified.
- [x] Tailwind CSS v4 dark neon 'K-Daemon Hunter' theme configured.
- [x] Canvas & `gifuct-js` Frame 0 extraction hook written.
- [x] Batch 20 files & 5-item pagination list handling defined.
- [x] 100% English codebase rule enforced.
- [x] i18n support for `ko`, `en`, `ja` prepared.
- [x] Responsive 3-frame layout (Desktop Sidebar, Mobile Bottom Nav) mapped.
- [x] GitHub -> Vercel Deployment pipeline ready.

Begin code generation now in Cursor!
