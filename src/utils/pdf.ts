import { jsPDF } from 'jspdf';
import type { LayoutConfig, StickerData, Product } from '../types';

const MM_PER_IN = 25.4;

function pt(mm: number): number {
  return mm * 72 / MM_PER_IN;
}

// ─── Layout constants ───────────────────────────────────────
const PAD = 3;
const LOGO_W = 18;
const LOGO_H = 18;
const LOGO_TEXT_GAP = 2.5;
const HEADER_BARCODE_GAP = 5.5;
const BC_HEIGHT = 4.5;
const BC_WIDTH_RATIO = 0.5;

// ─── CODE128B encoder ───────────────────────────────────────
const B_PATTERNS = [
  '11011001100','11001101100','11001100110','10010011000','10010001100','10001001100','10011001000','10011000100','10001100100','11001001000',
  '11001000100','11000100100','10110011100','10011011100','10011001110','10111001100','10011101100','10011100110','11001110010','11001011100',
  '11001001110','11011100100','11001110100','11101101110','11101001100','11100101100','11100100110','11101100100','11100110100','11100110010',
  '11011011000','11011000110','11000110110','10100011000','10001011000','10001000110','10110001000','10001101000','10001100010','11010001000',
  '11000101000','11000100010','10110111000','10110001110','10001101110','10111011000','10111000110','10001110110','11101110110','11010001110',
  '11000101110','11011101000','11011100010','11011101110','11101011000','11101000110','11100010110','11101101000','11101100010','11100011010',
  '11101111010','11001000010','11110001010','10100110000','10100001100','10010110000','10010000110','10000101100','10000100110','10110010000',
  '10110000100','10011010000','10011000010','10000110100','10000110010','11000010010','11001010000','11110111010','11000010100','10001111010',
  '10100111100','10010111100','10010011110','10111100100','10011110100','10011110010','11110100100','11110010100','11110010010','11011011110',
  '11011110110','11110110110','10101111000','10100011110','10001011110','10111101000','10111100010','11110101000','11110100010','10111011110',
  '10111101110','11101011110','11110101110','11010000100','11010010000','11010011100','1100011101011',
];

function code128B(text: string): string {
  const val = (c: string) => { const v = c.charCodeAt(0); return v >= 32 && v <= 126 ? v - 32 : 0; };
  const codes = [104];
  for (let i = 0; i < text.length; i++) codes.push(val(text[i]));
  let sum = codes[0];
  for (let i = 1; i < codes.length; i++) sum += codes[i] * i;
  codes.push(sum % 103);
  codes.push(106);
  return codes.map(c => B_PATTERNS[c]).join('');
}

// ─── Barcode bars ───────────────────────────────────────────
function drawBarcode(
  doc: jsPDF,
  xMm: number, yMm: number,
  wMm: number, hMm: number,
  text: string,
) {
  const pat = code128B(text);
  if (!pat.length) return;
  const mw = pt(wMm) / pat.length;
  for (let i = 0; i < pat.length; i++) {
    if (pat[i] === '1') {
      doc.rect(pt(xMm) + i * mw, pt(yMm), Math.max(mw, 0.01), pt(hMm), 'F');
    }
  }
}

// ─── Get image dimensions synchronously from a data URL ────
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

// ─── Logo with object-fit: contain ─────────────────────────
function drawLogo(
  doc: jsPDF,
  xMm: number, yMm: number,
  cw: number, ch: number,
  dataUrl: string,
) {
  try {
    const { w, h } = getImgSize(dataUrl);
    const scale = Math.min(cw / w, ch / h);
    const dw = w * scale;
    const dh = h * scale;
    const dx = xMm + (cw - dw) / 2;
    const dy = yMm + (ch - dh) / 2;
    doc.addImage(dataUrl, 'PNG', pt(dx), pt(dy), pt(dw), pt(dh));
  } catch {
    /* skip */
  }
}

// ─── Header text (distributor / name / volume) ─────────────
function drawHeaderText(
  doc: jsPDF,
  xMm: number, yMm: number,
  maxW: number,
  product: Product,
) {
  const lineH = 2.8;

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(30, 30, 30);
  doc.text(product.distributor, pt(xMm), pt(yMm));

  doc.setFontSize(5);
  doc.setTextColor(80, 80, 80);
  doc.text(product.name, pt(xMm), pt(yMm + lineH));

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(120, 120, 120);
  doc.text(product.volume, pt(xMm), pt(yMm + lineH * 2));
}

// ─── Draw one sticker (flexbox-like layout) ────────────────
function drawSticker(
  doc: jsPDF,
  xMm: number, yMm: number,
  wMm: number, hMm: number,
  data: StickerData,
  product: Product,
  logoDataUrl?: string,
) {
  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(pt(xMm), pt(yMm), pt(wMm), pt(hMm), 'F');

  // Border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.rect(pt(xMm), pt(yMm), pt(wMm), pt(hMm), 'S');

  // ── Layout within padding ──
  const logoX = xMm + PAD;
  const logoY = yMm + PAD;
  const textX = logoX + LOGO_W + LOGO_TEXT_GAP;
  const textY = logoY + 1.2;
  const textMaxW = wMm - PAD - textX + xMm - PAD;
  const textBottom = textY + 2.8 * 2 + 1;
  const bcTop = textBottom + HEADER_BARCODE_GAP;
  const bcW = wMm * BC_WIDTH_RATIO;
  const bcX = xMm + (wMm - bcW) / 2;

  // ── Logo ──
  if (logoDataUrl) {
    drawLogo(doc, logoX, logoY, LOGO_W, LOGO_H, logoDataUrl);
  }

  // ── Text ──
  drawHeaderText(doc, textX, textY, textMaxW, product);

  // ── Barcode ──
  doc.setFillColor(0, 0, 0);
  drawBarcode(doc, bcX, bcTop, bcW, BC_HEIGHT, data.bt_number);

  // ── Batch number ──
  doc.setFont('Courier', 'bold');
  doc.setFontSize(4.8);
  doc.setTextColor(30, 30, 30);
  doc.text(data.bt_number, pt(xMm + wMm / 2), pt(bcTop + BC_HEIGHT + 2.5), { align: 'center' });
}

// ─── Load image and return data URL ─────────────────────────
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

// ─── Generate complete PDF ──────────────────────────────────
export interface GenerateOptions {
  product: Product;
  layout: LayoutConfig;
  stickers: StickerData[];
  logoDataUrl?: string;
  filename?: string;
}

export function generatePDF(opts: GenerateOptions): Blob {
  const { product, layout, stickers, logoDataUrl } = opts;

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
        logoDataUrl,
      );
    }
  }

  return doc.output('blob');
}

// ─── Draw a single sticker on canvas (for preview) ─────────
export function drawStickerPreview(
  ctx: CanvasRenderingContext2D,
  xMm: number, yMm: number, wMm: number, hMm: number,
  data: StickerData,
  product: Product,
  logoDataUrl?: string,
) {
  const s = 72 / MM_PER_IN;

  // Background
  ctx.fillStyle = '#fff';
  ctx.fillRect(xMm * s, yMm * s, wMm * s, hMm * s);

  // Border
  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = 0.3;
  ctx.strokeRect(xMm * s, yMm * s, wMm * s, hMm * s);

  // ── Layout ──
  const logoX = xMm + PAD;
  const logoY = yMm + PAD;
  const textX = logoX + LOGO_W + LOGO_TEXT_GAP;
  const textY = logoY + 1.2;
  const textMaxW = wMm - PAD - (textX - xMm) - PAD;
  const textBottom = textY + 2.8 * 2 + 1;
  const bcTop = textBottom + HEADER_BARCODE_GAP;
  const bcW = wMm * BC_WIDTH_RATIO;
  const bcX = xMm + (wMm - bcW) / 2;
  const bcH = BC_HEIGHT;

  // ── Logo ──
  if (logoDataUrl) {
    try {
      const img = new Image();
      img.src = logoDataUrl;
      const iw = img.naturalWidth || 1;
      const ih = img.naturalHeight || 1;
      const scale = Math.min(LOGO_W / iw, LOGO_H / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = logoX + (LOGO_W - dw) / 2;
      const dy = logoY + (LOGO_H - dh) / 2;
      ctx.drawImage(img, dx * s, dy * s, dw * s, dh * s);
    } catch {}
  }

  // ── Text ──
  const lh = 2.8 * s;

  ctx.fillStyle = '#1e1e1e';
  ctx.font = `bold ${6 * s}px Helvetica`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(product.distributor, textX * s, textY * s);

  ctx.fillStyle = '#555';
  ctx.font = `bold ${5 * s}px Helvetica`;
  ctx.fillText(product.name, textX * s, (textY + 2.8) * s);

  ctx.fillStyle = '#888';
  ctx.font = `${4.5 * s}px Helvetica`;
  ctx.fillText(product.volume, textX * s, (textY + 5.6) * s);

  // ── Barcode bars (simplified for preview) ──
  ctx.fillStyle = '#000';
  const simplify = data.bt_number.split('').map(c => c.charCodeAt(0) % 2);
  const barW = (bcW * s) / simplify.length;
  simplify.forEach((b, i) => {
    if (b === 0) ctx.fillRect(bcX * s + i * barW, bcTop * s, Math.max(barW * 0.6, 0.5), bcH * s);
  });

  // ── Batch number ──
  ctx.fillStyle = '#1e1e1e';
  ctx.font = `bold ${4.8 * s}px Courier`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(data.bt_number, (xMm + wMm / 2) * s, (bcTop + bcH + 2.5) * s);
}
