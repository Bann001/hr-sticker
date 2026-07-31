import { jsPDF } from 'jspdf';
import type { DroneModel } from '../lib/drones';
import { renderRpuSticker } from './renderRpuSticker';

const PDF_DPI = 300;

export interface RpuStickerData {
  serial: string;
}

export function generateRpuPdf(
  drone: DroneModel,
  stickers: RpuStickerData[],
  filename = 'rpu-stickers.pdf',
): Blob {
  const sw = drone.stickerWidthMm;
  const sh = drone.stickerHeightMm;

  const margin = 9;
  const spacing = 3;
  const cols = Math.max(1, Math.floor((210 - margin * 2 + spacing) / (sw + spacing)));
  const rows = Math.max(1, Math.floor((297 - margin * 2 + spacing) / (sh + spacing)));
  const perPage = cols * rows;
  const totalPages = Math.ceil(stickers.length / perPage);

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });

  let idx = 0;
  for (let pg = 0; pg < totalPages; pg++) {
    if (pg > 0) doc.addPage();

    for (let i = 0; i < perPage && idx < stickers.length; i++, idx++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = margin + col * (sw + spacing);
      const y = margin + row * (sh + spacing);

      const px = Math.ceil(sw * PDF_DPI / 25.4);
      const py = Math.ceil(sh * PDF_DPI / 25.4);
      const offscreen = document.createElement('canvas');
      offscreen.width = px;
      offscreen.height = py;
      const octx = offscreen.getContext('2d')!;

      renderRpuSticker(octx, sw, sh, PDF_DPI, drone, stickers[idx].serial);
      doc.addImage(offscreen.toDataURL('image/png'), 'PNG', x, y, sw, sh);
    }
  }

  return doc.output('blob');
}
