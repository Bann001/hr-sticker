import type { StickerData, Product, FontConfig } from '../types';

const PAD = 3;
const LOGO_SIZE = 18;
const FONT_TOP = 4.5;
const FONT_BRAND = 16;
const FONT_VOLUME = 4.5;
const FONT_BT = 4.8;

export function renderSticker(
  ctx: CanvasRenderingContext2D,
  xMm: number, yMm: number,
  wMm: number, hMm: number,
  dpi: number,
  data: StickerData,
  product: Product,
  fonts: FontConfig,
  logoDataUrl?: string,
) {
  const pmm = dpi / 25.4;
  const ppt = dpi / 72;

  // Background
  ctx.fillStyle = '#fff';
  ctx.fillRect(xMm * pmm, yMm * pmm, wMm * pmm, hMm * pmm);

  // Border
  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = 0.2 * ppt;
  ctx.strokeRect(xMm * pmm, yMm * pmm, wMm * pmm, hMm * pmm);

  // Layout (mm from sticker top-left)
  const topY = PAD + 2;
  const midY = hMm / 2;
  const bottomY = hMm - PAD - 0.5;
  const logoCx = wMm / 2 - 10;
  const brandX = wMm / 2 + 2;
  const brandY = midY + 1;

  // "Distributed by:"
  ctx.fillStyle = '#666';
  ctx.font = `${FONT_TOP * ppt}px ${fonts.body}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(
    `Distributed by: ${product.distributor}`,
    (xMm + wMm / 2) * pmm,
    (yMm + topY) * pmm,
  );

  // Logo
  if (logoDataUrl) {
    try {
      const img = new Image();
      img.src = logoDataUrl;
      const iw = img.naturalWidth || 1;
      const ih = img.naturalHeight || 1;
      const scale = Math.min(LOGO_SIZE / iw, LOGO_SIZE / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.drawImage(
        img,
        (xMm + logoCx - dw / 2) * pmm,
        (yMm + midY - dh / 2) * pmm,
        dw * pmm,
        dh * pmm,
      );
    } catch {}
  }

  // Brand name
  ctx.fillStyle = '#1e1e1e';
  ctx.font = `bold ${FONT_BRAND * ppt}px ${fonts.brand}`;
  ctx.textAlign = 'left';
  ctx.fillText(
    product.name,
    (xMm + brandX) * pmm,
    (yMm + brandY) * pmm,
  );

  // Volume (bottom-left)
  ctx.fillStyle = '#888';
  ctx.font = `${FONT_VOLUME * ppt}px ${fonts.body}`;
  ctx.textAlign = 'left';
  ctx.fillText(
    product.volume,
    (xMm + PAD) * pmm,
    (yMm + bottomY) * pmm,
  );

  // Batch number (bottom-right)
  ctx.fillStyle = '#1e1e1e';
  ctx.font = `bold ${FONT_BT * ppt}px ${fonts.bt}`;
  ctx.textAlign = 'right';
  ctx.fillText(
    `BT: ${data.bt_number}`,
    (xMm + wMm - PAD) * pmm,
    (yMm + bottomY) * pmm,
  );
}
