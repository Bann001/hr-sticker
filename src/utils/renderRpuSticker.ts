import type { DroneModel } from '../lib/drones';

const ACCENT = '#0ea5e9';
const DARK = '#0f172a';
const MUTED = '#64748b';

export function renderRpuSticker(
  ctx: CanvasRenderingContext2D,
  wMm: number,
  hMm: number,
  dpi: number,
  drone: DroneModel,
  serial: string,
  logoDataUrl?: string,
) {
  const pmm = dpi / 25.4;
  const ppt = dpi / 72;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, wMm * pmm, hMm * pmm);

  ctx.strokeStyle = '#d0d5dd';
  ctx.lineWidth = 0.2 * ppt;
  ctx.strokeRect(0, 0, wMm * pmm, hMm * pmm);

  // Left accent band
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, 2.5 * pmm, hMm * pmm);

  const pad = 5;
  const textLeft = pad + 1.5;

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

  // Drone model name
  ctx.fillStyle = DARK;
  const nameFont = clamp(hMm * 0.34, 7, 14);
  ctx.font = `bold ${nameFont * ppt}px 'Space Grotesk', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${drone.brand} ${drone.name}`, textLeft * pmm, (hMm / 2 - hMm * 0.16) * pmm);

  // Serial number
  ctx.fillStyle = ACCENT;
  const serialFont = clamp(hMm * 0.2, 4.5, 9);
  ctx.font = `bold ${serialFont * ppt}px 'Space Mono', monospace`;
  ctx.fillText(serial, textLeft * pmm, (hMm / 2 + hMm * 0.16) * pmm);

  // Dimensions + weight (bottom)
  ctx.fillStyle = MUTED;
  const metaFont = clamp(hMm * 0.13, 2.6, 5);
  ctx.font = `${metaFont * ppt}px 'Space Grotesk', sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(
    `${drone.dims}  ·  ${drone.weight}`,
    (wMm - 2) * pmm,
    (hMm - 1.6) * pmm,
  );

  // Center bottom serial echo (right side)
  ctx.fillStyle = MUTED;
  ctx.font = `${metaFont * ppt}px 'Space Mono', monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('S/N', textLeft * pmm, (hMm - 1.6) * pmm);

  // Logo if present
  if (logoDataUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoDataUrl;
      const logoW = Math.min(hMm * 0.35, badgeW);
      const logoH = logoW;
      ctx.drawImage(
        img,
        (wMm - badgeW - 1) * pmm,
        1 * pmm,
        logoW * pmm,
        logoH * pmm,
      );
    } catch {}
  }
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
