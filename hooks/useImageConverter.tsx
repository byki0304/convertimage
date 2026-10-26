'use client';

import { saveAs } from 'file-saver';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useToast } from '@/components/ui/Toast';
import {
  MAX_FILES,
  buildConvertedName,
  decodeToCanvas,
  detectSourceFormat,
  encodeCanvas,
} from '@/lib/canvasEngine';
import { inspectGif } from '@/lib/gifParser';
import { useI18n } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import { useConversionHistory } from './useConversionHistory';
import { useFirebaseAuth } from './useFirebaseAuth';
import type { ConvertedFileItem, HistoryEntry, TargetFormat } from '@/types';

const CONCURRENCY = 3;

interface ConverterContextValue {
  items: ConvertedFileItem[];
  targetFormat: TargetFormat;
  setTargetFormat: (format: TargetFormat) => void;
  isProcessing: boolean;
  progress: { done: number; total: number };
  addFiles: (files: FileList | File[]) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  convertAll: () => Promise<void>;
  downloadItem: (id: string) => void;
  downloadAllAsZip: () => Promise<void>;
}

const ConverterContext = createContext<ConverterContextValue | null>(null);

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function revokeItemUrls(item: ConvertedFileItem) {
  URL.revokeObjectURL(item.previewUrl);
  if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
}

function uniqueZipName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  const dotIndex = name.lastIndexOf('.');
  const base = name.substring(0, dotIndex);
  const ext = name.substring(dotIndex);
  let counter = 1;
  while (used.has(`${base} (${counter})${ext}`)) counter++;
  const unique = `${base} (${counter})${ext}`;
  used.add(unique);
  return unique;
}

export function ConverterProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { preferredFormat, playSfx } = useSettings();
  const { addEntries } = useConversionHistory();
  const { user } = useFirebaseAuth();

  const [items, setItems] = useState<ConvertedFileItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>(preferredFormat);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const itemsRef = useRef<ConvertedFileItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    setTargetFormat(preferredFormat);
  }, [preferredFormat]);

  useEffect(() => () => itemsRef.current.forEach(revokeItemUrls), []);

  const patchItem = useCallback((id: string, patch: Partial<ConvertedFileItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files);
      if (incoming.length === 0) return;

      const accepted: ConvertedFileItem[] = [];
      for (const file of incoming) {
        const sourceFormat = detectSourceFormat(file);
        if (!sourceFormat) {
          showToast(t('msg_unsupported', { name: file.name }), 'error');
          continue;
        }
        accepted.push({
          id: createId(),
          originalFile: file,
          originalName: file.name,
          sourceFormat,
          previewUrl: URL.createObjectURL(file),
          convertedBlob: null,
          convertedUrl: null,
          convertedName: null,
          targetFormat,
          status: 'pending',
        });
      }

      const room = MAX_FILES - itemsRef.current.length;
      if (accepted.length > room) {
        showToast(t('msg_max_limit'), 'error');
        accepted.slice(Math.max(room, 0)).forEach(revokeItemUrls);
      }
      const toAdd = accepted.slice(0, Math.max(room, 0));
      if (toAdd.length === 0) return;

      setItems((prev) => [...prev, ...toAdd]);
      playSfx('drop');

      for (const item of toAdd) {
        if (item.sourceFormat !== 'gif') continue;
        inspectGif(item.originalFile)
          .then((info) =>
            patchItem(item.id, {
              isAnimatedGif: info.isAnimated,
              frameCount: info.frameCount,
              width: info.width,
              height: info.height,
            })
          )
          .catch(() => patchItem(item.id, { status: 'error', errorMessage: 'INVALID_GIF_FILE' }));
      }
    },
    [targetFormat, showToast, t, playSfx, patchItem]
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) revokeItemUrls(target);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    itemsRef.current.forEach(revokeItemUrls);
    setItems([]);
  }, []);

  const convertOne = useCallback(
    async (item: ConvertedFileItem, format: TargetFormat): Promise<HistoryEntry | null> => {
      patchItem(item.id, { status: 'processing', errorMessage: undefined });
      try {
        const decoded = await decodeToCanvas(item.originalFile, item.sourceFormat);
        const blob = await encodeCanvas(decoded.canvas, format);
        const convertedName = buildConvertedName(item.originalName, format);
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
        patchItem(item.id, {
          status: 'completed',
          convertedBlob: blob,
          convertedUrl: URL.createObjectURL(blob),
          convertedName,
          targetFormat: format,
          isAnimatedGif: decoded.isAnimatedGif,
          frameCount: decoded.frameCount,
          width: decoded.canvas.width,
          height: decoded.canvas.height,
        });
        return {
          id: createId(),
          originalName: item.originalName,
          convertedName,
          fromFormat: item.sourceFormat,
          toFormat: format,
          isAnimatedGif: decoded.isAnimatedGif,
          extractedFrame: item.sourceFormat === 'gif' ? 0 : null,
          fileSize: item.originalFile.size,
          convertedSize: blob.size,
          convertedAt: Date.now(),
        };
      } catch (error) {
        patchItem(item.id, {
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'CONVERSION_FAILED',
        });
        return null;
      }
    },
    [patchItem]
  );

  const convertAll = useCallback(async () => {
    if (isProcessing) return;
    const format = targetFormat;
    const queue = itemsRef.current.filter(
      (item) => !(item.status === 'completed' && item.targetFormat === format)
    );
    if (itemsRef.current.length === 0) {
      showToast(t('msg_no_files'), 'info');
      return;
    }
    if (queue.length === 0) {
      showToast(t('msg_success', { count: itemsRef.current.length }), 'success');
      return;
    }

    setIsProcessing(true);
    setProgress({ done: 0, total: queue.length });
    if (format === 'avif') showToast(t('msg_avif_encoder'), 'info');

    const results: HistoryEntry[] = [];
    let failed = 0;
    let cursor = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        const item = queue[cursor++];
        const entry = await convertOne(item, format);
        if (entry) results.push(entry);
        else failed++;
        setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));

    setIsProcessing(false);

    if (failed === 0) {
      showToast(t('msg_success', { count: results.length }), 'success');
      playSfx('success');
    } else {
      showToast(t('msg_partial', { ok: results.length, fail: failed }), 'error');
      playSfx('error');
    }

    addEntries(results).catch((error) => console.error('Failed to save history', error));
    if (results.length > 0) {
      fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid ?? null,
          toFormat: format,
          count: results.length,
          failed,
          animatedGifCount: results.filter((r) => r.isAnimatedGif).length,
        }),
        keepalive: true,
      }).catch(() => undefined);
    }
  }, [isProcessing, targetFormat, showToast, t, convertOne, playSfx, addEntries, user]);

  const downloadItem = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((entry) => entry.id === id);
      if (!item?.convertedBlob || !item.convertedName) return;
      saveAs(item.convertedBlob, item.convertedName);
      playSfx('download');
      showToast(t('msg_downloaded'), 'success');
    },
    [playSfx, showToast, t]
  );

  const downloadAllAsZip = useCallback(async () => {
    const completed = itemsRef.current.filter((item) => item.convertedBlob && item.convertedName);
    if (completed.length === 0) {
      showToast(t('msg_no_files'), 'info');
      return;
    }
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    const usedNames = new Set<string>();
    for (const item of completed) {
      zip.file(uniqueZipName(item.convertedName!, usedNames), item.convertedBlob!);
    }
    const content = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
    saveAs(content, 'convertimage-lossless-assets.zip');
    playSfx('download');
    showToast(t('msg_downloaded'), 'success');
  }, [playSfx, showToast, t]);

  const value = useMemo(
    () => ({
      items,
      targetFormat,
      setTargetFormat,
      isProcessing,
      progress,
      addFiles,
      removeItem,
      clearAll,
      convertAll,
      downloadItem,
      downloadAllAsZip,
    }),
    [items, targetFormat, isProcessing, progress, addFiles, removeItem, clearAll, convertAll, downloadItem, downloadAllAsZip]
  );

  return <ConverterContext.Provider value={value}>{children}</ConverterContext.Provider>;
}

export function useImageConverter(): ConverterContextValue {
  const ctx = useContext(ConverterContext);
  if (!ctx) throw new Error('useImageConverter must be used within ConverterProvider');
  return ctx;
}
