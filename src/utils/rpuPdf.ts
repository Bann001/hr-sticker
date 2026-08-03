import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { DroneModel } from '../lib/drones';
import { renderRpuSticker } from './renderRpuSticker';

export interface RpuStickerData {
  serial: string;
  xMm: number;
  yMm: number;
  wMm: number;
  hMm: number;
  logoUrl?: string;
}

const PDF_DPI = 300;

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Generate a mixed-size A4 label sheet PDF. Each sticker is rendered
 * via the canvas pipeline (renderRpuSticker at 300 DPI → PNG) and
 * embedded at its packed position — the same technique used by the
 * Create-page A4 export so the printed result matches the on-screen
 * design exactly.
 */
export async function generateRpuPdf(
  drone: DroneModel,
  pages: RpuStickerData[][],
  opts: { qr?: boolean; filename?: string } = {},
): Promise<Blob> {
  const qrEnabled = opts.qr ?? false;

  const serials = Array.from(new Set(pages.flat().map(s => s.serial)));
  const qrUrls = new Map<string, string | null>();
  if (qrEnabled) {
    for (const serial of serials) {
      qrUrls.set(serial, await QRCode.toDataURL(serial, { margin: 1, width: 256, errorCorrectionLevel: 'M' }).catch(() => null));
    }
  }

  const qrImgs = new Map<string, HTMLImageElement | null>();
  for (const [serial, url] of qrUrls) {
    qrImgs.set(serial, url ? await loadImg(url) : null);
  }

  const logoUrls = Array.from(new Set(pages.flat().map(s => s.logoUrl).filter(Boolean) as string[]));
  const logoImgs = new Map<string, HTMLImageElement | null>();
  for (const url of logoUrls) {
    logoImgs.set(url, await loadImg(url));
  }

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });

  pages.forEach((page, i) => {
    if (i > 0) doc.addPage();
    for (const s of page) {
      const px = Math.max(1, Math.ceil(s.wMm * PDF_DPI / 25.4));
      const py = Math.max(1, Math.ceil(s.hMm * PDF_DPI / 25.4));
      const offscreen = document.createElement('canvas');
      offscreen.width = px;
      offscreen.height = py;
      const octx = offscreen.getContext('2d')!;
      renderRpuSticker(octx, s.wMm, s.hMm, PDF_DPI, drone, s.serial, {
        logo: s.logoUrl ? logoImgs.get(s.logoUrl) ?? null : null,
        qr: qrImgs.get(s.serial) ?? null,
      });
      const dataUrl = offscreen.toDataURL('image/png');
      doc.addImage(dataUrl, 'PNG', s.xMm, s.yMm, s.wMm, s.hMm);
    }
  });

  return doc.output('blob');
}