import { jsPDF } from 'jspdf';
import type { LayoutConfig, StickerData, Product, FontConfig } from '../types';

const MM_PER_IN = 25.4;

function pt(mm: number): number {
  return mm * 72 / MM_PER_IN;
}

const PAD = 3;
const LOGO_SIZE = 12;

function getImgSize(dataUrl: string): { w: number; h: number } {
  try {
    const c = document.createElement('canvas');
    const img = new Image();
    img.src = dataUrl;
    c.width = img.naturalWidth || 1;
    c.height = img.naturalHeight || 1;
    return { w: c.width, h: c.height };
  } catch {
    return { w: 1, h: 1 };
  }
}

function drawLogo(
  doc: jsPDF,
  cx: number, cy: number,
  size: number,
  dataUrl: string,
) {
  try {
    const { w, h } = getImgSize(dataUrl);
    const scale = Math.min(size / w, size / h);
    const dw = w * scale;
    const dh = h * scale;
    const dx = cx - dw / 2;
    const dy = cy - dh / 2;
    doc.addImage(dataUrl, 'PNG', pt(dx), pt(dy), pt(dw), pt(dh));
  } catch {}
}

function drawSticker(
  doc: jsPDF,
  xMm: number, yMm: number,
  wMm: number, hMm: number,
  data: StickerData,
  product: Product,
  fonts: FontConfig,
  logoDataUrl?: string,
) {
  doc.setFillColor(255, 255, 255);
  doc.rect(pt(xMm), pt(yMm), pt(wMm), pt(hMm), 'F');

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.rect(pt(xMm), pt(yMm), pt(wMm), pt(hMm), 'S');

  const topY = yMm + PAD + 2;
  const midY = yMm + hMm / 2;
  const bottomY = yMm + hMm - PAD - 0.5;
  const logoCx = xMm + wMm / 2 - 10;
  const brandX = xMm + wMm / 2 + 2;
  const brandY = midY + 1;

  doc.setFont(fonts.body, 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Distributed by: ${product.distributor}`, pt(xMm + wMm / 2), pt(topY), { align: 'center' });

  if (logoDataUrl) {
    drawLogo(doc, logoCx, midY, LOGO_SIZE, logoDataUrl);
  }

  doc.setFont(fonts.brand, 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(30, 30, 30);
  doc.text(product.name, pt(brandX), pt(brandY));

  doc.setFont(fonts.body, 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(120, 120, 120);
  doc.text(product.volume, pt(xMm + PAD), pt(bottomY));

  doc.setFont(fonts.bt, 'bold');
  doc.setFontSize(4.8);
  doc.setTextColor(30, 30, 30);
  doc.text(`BT: ${String(data.serial).padStart(5, '0')}`, pt(xMm + wMm - PAD), pt(bottomY), { align: 'right' });
}

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

      drawSticker(
        doc, x, y,
        layout.sticker_width_mm, layout.sticker_height_mm,
        stickers[stickerIndex],
        product,
        fonts,
        logoDataUrl,
      );
    }
  }

  return doc.output('blob');
}

export function drawStickerPreview(
  ctx: CanvasRenderingContext2D,
  xMm: number, yMm: number, wMm: number, hMm: number,
  data: StickerData,
  product: Product,
  fonts: FontConfig,
  logoDataUrl?: string,
) {
  const s = 72 / MM_PER_IN;

  ctx.fillStyle = '#fff';
  ctx.fillRect(xMm * s, yMm * s, wMm * s, hMm * s);

  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = 0.3;
  ctx.strokeRect(xMm * s, yMm * s, wMm * s, hMm * s);

  const topY = yMm + PAD + 2;
  const midY = yMm + hMm / 2;
  const bottomY = yMm + hMm - PAD - 0.5;
  const logoCx = xMm + wMm / 2 - 10;
  const brandX = xMm + wMm / 2 + 2;
  const brandY = midY + 1;

  ctx.fillStyle = '#666';
  ctx.font = `${4.5 * s}px ${fonts.body}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`Distributed by: ${product.distributor}`, (xMm + wMm / 2) * s, topY * s);

  if (logoDataUrl) {
    try {
      const img = new Image();
      img.src = logoDataUrl;
      const iw = img.naturalWidth || 1;
      const ih = img.naturalHeight || 1;
      const scale = Math.min(LOGO_SIZE / iw, LOGO_SIZE / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = logoCx - dw / 2;
      const dy = midY - dh / 2;
      ctx.drawImage(img, dx * s, dy * s, dw * s, dh * s);
    } catch {}
  }

  ctx.fillStyle = '#1e1e1e';
  ctx.font = `bold ${5.5 * s}px ${fonts.brand}`;
  ctx.textAlign = 'left';
  ctx.fillText(product.name, brandX * s, brandY * s);

  ctx.fillStyle = '#888';
  ctx.font = `${4.5 * s}px ${fonts.body}`;
  ctx.textAlign = 'left';
  ctx.fillText(product.volume, (xMm + PAD) * s, bottomY * s);

  ctx.fillStyle = '#1e1e1e';
  ctx.font = `bold ${4.8 * s}px ${fonts.bt}`;
  ctx.textAlign = 'right';
  ctx.fillText(`BT: ${String(data.serial).padStart(5, '0')}`, (xMm + wMm - PAD) * s, bottomY * s);
}
