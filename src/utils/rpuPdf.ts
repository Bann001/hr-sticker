import { jsPDF } from 'jspdf';
import type { DroneModel } from '../lib/drones';
import { renderRpuSticker } from './renderRpuSticker';

const PDF_DPI = 300;

export interface RpuStickerData {
  serial: string;
  xMm?: number;
  yMm?: number;
  logoUrl?: string;
}

function autoLayout(n: number, sw: number, sh: number) {
  const margin = 9;
  const gap = 3;
  const cols = Math.max(1, Math.floor((210 - margin * 2 + gap) / (sw + gap)));
  const rows = Math.max(1, Math.floor((297 - margin * 2 + gap) / (sh + gap)));
  const perPage = cols * rows;
  const totalPages = Math.ceil(n / perPage);
  const positions: Array<{ x: number; y: number }> = [];
  for (let p = 0; p < totalPages; p++) {
    for (let i = 0; i < perPage; i++) {
      const idx = p * perPage + i;
      if (idx >= n) break;
      const row = Math.floor(i / cols);
      const col = i % cols;
      positions.push({
        x: margin + col * (sw + gap),
        y: margin + row * (sh + gap),
      });
    }
  }
  return positions;
}

export function generateRpuPdf(
  drone: DroneModel,
  stickers: RpuStickerData[],
  filename = 'rpu-stickers.pdf',
): Blob {
  const sw = drone.stickerWidthMm;
  const sh = drone.stickerHeightMm;

  const positions = stickers.every(s => s.xMm !== undefined && s.yMm !== undefined)
    ? stickers.map(s => ({ x: s.xMm!, y: s.yMm! }))
    : autoLayout(stickers.length, sw, sh);

  const perPage = 999;
  const totalPages = Math.ceil(stickers.length / perPage);

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });

  let idx = 0;
  for (let pg = 0; pg < totalPages; pg++) {
    if (pg > 0) doc.addPage();

    const pagePositions = positions.slice(pg * perPage, (pg + 1) * perPage);
    for (let i = 0; i < pagePositions.length && idx < stickers.length; i++, idx++) {
      const px = Math.ceil(sw * PDF_DPI / 25.4);
      const py = Math.ceil(sh * PDF_DPI / 25.4);
      const offscreen = document.createElement('canvas');
      offscreen.width = px;
      offscreen.height = py;
      const octx = offscreen.getContext('2d')!;

      renderRpuSticker(octx, sw, sh, PDF_DPI, drone, stickers[idx].serial, stickers[idx].logoUrl);
      doc.addImage(offscreen.toDataURL('image/png'), 'PNG', positions[idx].x, positions[idx].y, sw, sh);
    }
  }

  return doc.output('blob');
}