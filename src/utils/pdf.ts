import { jsPDF } from 'jspdf';
import type { LayoutConfig, StickerData, Product, FontConfig } from '../types';
import { renderSticker } from './renderSticker';

const PDF_DPI = 300;

export function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export interface GenerateOptions {
  product: Product;
  layout: LayoutConfig;
  stickers: StickerData[];
  fonts: FontConfig;
  logoDataUrl?: string;
  filename?: string;
}

export function generatePDF(opts: GenerateOptions): Blob {
  const { product, layout, stickers, fonts, logoDataUrl } = opts;

  const perPage = layout.cols * layout.rows;
  const totalPages = Math.ceil(stickers.length / perPage);

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  let stickerIndex = 0;

  for (let pg = 0; pg < totalPages; pg++) {
    if (pg > 0) doc.addPage();

    for (let i = 0; i < perPage && stickerIndex < stickers.length; i++, stickerIndex++) {
      const row = Math.floor(i / layout.cols);
      const col = i % layout.cols;

      const x = layout.margin_left_mm + col * (layout.sticker_width_mm + layout.spacing_h_mm);
      const y = layout.margin_top_mm + row * (layout.sticker_height_mm + layout.spacing_v_mm);

      const sw = layout.sticker_width_mm;
      const sh = layout.sticker_height_mm;

      // Render sticker to offscreen canvas at PDF_DPI
      const px = Math.ceil(sw * PDF_DPI / 25.4);
      const py = Math.ceil(sh * PDF_DPI / 25.4);
      const offscreen = document.createElement('canvas');
      offscreen.width = px;
      offscreen.height = py;
      const octx = offscreen.getContext('2d')!;

      renderSticker(octx, 0, 0, sw, sh, PDF_DPI, stickers[stickerIndex], product, fonts, logoDataUrl);

      const dataUrl = offscreen.toDataURL('image/png');
      doc.addImage(dataUrl, 'PNG', x, y, sw, sh);
    }
  }

  return doc.output('blob');
}

export { renderSticker };
