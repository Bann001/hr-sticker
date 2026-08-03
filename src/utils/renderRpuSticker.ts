import type { DroneModel } from '../lib/drones';

const ACCENT = '#0ea5e9';
const DARK = '#0f172a';
const MUTED = '#64748b';

export interface RpuRenderOptions {
  logo?: HTMLImageElement | null;
  qr?: HTMLImageElement | null;
}

/**
 * Render an RPU sticker at the given DPI, matching the Create-page pipeline
 * (canvas -> PNG at 300 DPI -> placed on an A4 sheet). Vertical labels
 * (h > w) are rotated 90° so content reads top-to-bottom along the long edge.
 */
export function renderRpuSticker(
  ctx: CanvasRenderingContext2D,
  wMm: number,
  hMm: number,
  dpi: number,
  drone: DroneModel,
  serial: string,
  opts: RpuRenderOptions = {},
) {
  const pmm = dpi / 25.4;
  const ppt = dpi / 72;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, wMm * pmm, hMm * pmm);

  const vertical = hMm > wMm;
  if (vertical) {
    // Map content space (long x short) to device (short x long) so the drawn
    // layout reads top-to-bottom along the label's long edge.
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.scale(-1, 1);
    drawBody(ctx, hMm, wMm, pmm, ppt, drone, serial, { ...opts, qr: undefined });
    ctx.restore();
  } else {
    drawBody(ctx, wMm, hMm, pmm, ppt, drone, serial, opts);
  }
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  wMm: number,
  hMm: number,
  pmm: number,
  ppt: number,
  drone: DroneModel,
  serial: string,
  opts: RpuRenderOptions,
) {
  const { logo, qr } = opts;

  ctx.strokeStyle = '#d0d5dd';
  ctx.lineWidth = 0.2 * ppt;
  ctx.strokeRect(0, 0, wMm * pmm, hMm * pmm);

  // Left accent band
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, 2.5 * pmm, hMm * pmm);

  const pad = 5;
  const textLeft = pad + 1.5;

  const isTiny = wMm < 34 || hMm < 12;
  if (isTiny) {
    // Minimal layout: serial only, centered, fitted to the label
    fitFont(ctx, serial, "'Space Mono', monospace", 'bold', 5, (wMm - pad * 2) * pmm, 1.6);
    ctx.fillStyle = DARK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(serial, (wMm / 2) * pmm, (hMm / 2) * pmm);
    return;
  }

  // RPU badge (top-left)
  const badgeW = 9;
  const badgeH = 3.4;
  ctx.fillStyle = ACCENT;
  roundRect(ctx, (textLeft - 0.5) * pmm, 1.2 * pmm, badgeW * pmm, badgeH * pmm, 1 * pmm);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${1.9 * ppt}px 'Space Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RPU', (textLeft - 0.5 + badgeW / 2) * pmm, (1.2 + badgeH / 2 + 0.15) * pmm);

  const nameText = `${drone.brand} ${drone.name}`;

  // Drone model name
  ctx.fillStyle = DARK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const nameFont = clamp(hMm * 0.34, 7, 14);
  fitFont(ctx, nameText, "'Space Grotesk', sans-serif", 'bold', nameFont, (wMm - textLeft - 2) * pmm);
  ctx.fillText(nameText, textLeft * pmm, (hMm / 2 - hMm * 0.16) * pmm);

  // Serial number
  ctx.fillStyle = ACCENT;
  const serialFont = clamp(hMm * 0.2, 4.5, 9);
  fitFont(ctx, serial, "'Space Mono', monospace", 'bold', serialFont, (wMm - textLeft - 2) * pmm);
  ctx.fillText(serial, textLeft * pmm, (hMm / 2 + hMm * 0.16) * pmm);

  // QR code (top-right) when enabled and the label is large enough
  const qs = Math.min(hMm * 0.42, 11);
  const showQr = qr && wMm >= 42 && hMm >= 14;
  if (showQr) {
    ctx.drawImage(qr!, (wMm - qs - pad) * pmm, pad * pmm, qs * pmm, qs * pmm);
  }

  // Logo (top-right, or bottom-right when QR present)
  if (logo) {
    const lw = showQr ? Math.min(hMm * 0.22, 5) : Math.min(hMm * 0.42, 9);
    const ly = showQr ? hMm - pad - lw : pad;
    ctx.drawImage(logo, (wMm - lw - pad) * pmm, ly * pmm, lw * pmm, lw * pmm);
  }

  // Dimensions + weight (bottom right)
  ctx.fillStyle = MUTED;
  const metaFont = clamp(hMm * 0.13, 2.6, 5);
  const metaText = `${drone.dims}  ·  ${drone.weight}`;
  fitFont(ctx, metaText, "'Space Grotesk', sans-serif", 'normal', metaFont, (wMm - textLeft - 2) * pmm);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(metaText, (wMm - 2) * pmm, (hMm - 1.6) * pmm);

  // Serial echo (bottom left)
  ctx.fillStyle = MUTED;
  fitFont(ctx, 'S/N', "'Space Mono', monospace", 'normal', metaFont, (textLeft + 8) * pmm);
  ctx.textAlign = 'left';
  ctx.fillText('S/N', textLeft * pmm, (hMm - 1.6) * pmm);
}

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  style: string,
  startPt: number,
  maxWidthPx: number,
  minPt = 1.4,
): number {
  let pt = Math.max(minPt, startPt);
  ctx.font = `${style} ${pt}px ${family}`;
  while (pt > minPt && ctx.measureText(text).width > maxWidthPx) {
    pt = Math.max(minPt, pt - 0.25);
    ctx.font = `${style} ${pt}px ${family}`;
  }
  return pt;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}
