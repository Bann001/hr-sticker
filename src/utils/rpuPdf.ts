import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { DroneModel } from '../lib/drones';

export interface RpuStickerData {
  serial: string;
  xMm: number;
  yMm: number;
  wMm: number;
  hMm: number;
  logoUrl?: string;
}

const ACCENT: [number, number, number] = [14, 165, 233];
const DARK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const BORDER: [number, number, number] = [208, 213, 221];

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

async function qrDataUrl(text: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(text, { margin: 1, width: 256, errorCorrectionLevel: 'M' });
  } catch {
    return null;
  }
}

function drawLabel(doc: jsPDF, s: RpuStickerData, drone: DroneModel, qrUrl?: string | null, qrEnabled = false) {
  const { xMm: x, yMm: y, wMm: w, hMm: h } = s;
  const r = Math.min(1.6, Math.min(w, h) * 0.12);

  // White body + outline
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, r, r, 'FD');

  const isVertical = h > w;
  const isTiny = w < 34 || h < 12;

  if (isVertical) {
    drawVertical(doc, s, drone);
    return;
  }

  const pad = clamp(h * 0.18, 0.8, 2.2);
  const textLeft = x + pad + Math.min(2.4, w * 0.05);

  // Left accent band
  doc.setFillColor(...ACCENT);
  doc.roundedRect(x, y, Math.min(2.4, w * 0.06), h, r, r, 'F');

  const namePt = clamp(h * 0.3, 6, 16);
  const serialPt = clamp(h * 0.16, 4.5, 9);
  const metaPt = clamp(h * 0.11, 2.6, 5);

  // RPU badge (top-left)
  const bw = Math.min(9, w * 0.28);
  const bh = Math.min(3.2, h * 0.24);
  doc.setFillColor(...ACCENT);
  doc.roundedRect(textLeft - 0.5, y + pad - 0.2, bw, bh, 0.9, 0.9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(clamp(bh * 0.6, 1.2, 2.1));
  doc.text('RPU', textLeft - 0.5 + bw / 2, y + pad + bh / 2 - 0.1, { align: 'center', baseline: 'middle' });

  // Model name
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(namePt);
  doc.text(`${drone.brand} ${drone.name}`, textLeft, y + pad + bh + h * 0.18, { baseline: 'middle' });

  // Serial
  doc.setTextColor(...ACCENT);
  doc.setFont('courier', 'bold');
  doc.setFontSize(serialPt);
  doc.text(s.serial, textLeft, y + pad + bh + h * 0.5, { baseline: 'middle' });

  // QR code (top-right) when enabled and the label is large enough
  const qs = Math.min(h * 0.42, 11);
  const showQr = qrEnabled && qrUrl && w >= 42 && h >= 14;
  if (showQr) {
    doc.addImage(qrUrl!, 'PNG', x + w - qs - pad, y + pad, qs, qs);
  }

  // Logo (top-right, or bottom-right when QR present)
  if (s.logoUrl && !isTiny) {
    const lw = showQr ? Math.min(h * 0.22, 5) : Math.min(h * 0.42, 9);
    const ly = showQr ? y + h - pad - lw : y + pad;
    try {
      doc.addImage(s.logoUrl, 'PNG', x + w - lw - pad, ly, lw, lw);
    } catch {}
  }

  // Bottom metadata (skip on tiny labels)
  if (!isTiny) {
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(metaPt);
    doc.text(`${drone.dims} · ${drone.weight}`, x + w - pad, y + h - 1.1, { align: 'right', baseline: 'alphabetic' });
    doc.setFont('courier', 'normal');
    doc.text('S/N', textLeft, y + h - 1.1, { baseline: 'alphabetic' });
  }
}

function drawVertical(doc: jsPDF, s: RpuStickerData, drone: DroneModel) {
  const { xMm: x, yMm: y, wMm: w, hMm: h } = s;
  const r = Math.min(1.6, Math.min(w, h) * 0.12);
  const pad = clamp(w * 0.18, 0.8, 1.6);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, r, r, 'FD');

  // Accent top bar
  doc.setFillColor(...ACCENT);
  doc.roundedRect(x, y, w, Math.min(2.4, h * 0.05), r, r, 'F');

  const namePt = clamp(w * 0.5, 5, 9);
  const serialPt = clamp(w * 0.42, 4, 7.5);

  // RPU badge
  const bw = Math.min(6, w - pad * 2);
  const bh = Math.min(2.6, h * 0.04);
  doc.setFillColor(...ACCENT);
  doc.roundedRect(x + (w - bw) / 2, y + 3.2, bw, bh, 0.8, 0.8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(clamp(bh * 0.55, 1.1, 1.8));
  doc.text('RPU', x + w / 2, y + 3.2 + bh / 2, { align: 'center', baseline: 'middle' });

  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(namePt);
  doc.text(`${drone.brand} ${drone.name}`, x + w / 2, y + 3.2 + bh + 3, { align: 'center', baseline: 'middle' });

  doc.setTextColor(...ACCENT);
  doc.setFont('courier', 'bold');
  doc.setFontSize(serialPt);
  doc.text(s.serial, x + w / 2, y + 3.2 + bh + 6.5, { align: 'center', baseline: 'middle' });
}

/**
 * Generate a mixed-size A4 label sheet PDF. `pages` is an array of pages, where
 * each page is a list of stickers with absolute mm positions and per-sticker
 * width/height. Text is drawn as vector text for sharp printing.
 */
export async function generateRpuPdf(
  drone: DroneModel,
  pages: RpuStickerData[][],
  opts: { qr?: boolean; filename?: string } = {},
): Promise<Blob> {
  const qrEnabled = opts.qr ?? false;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });

  const qrMap = new Map<string, string | null>();
  if (qrEnabled) {
    const serials = Array.from(new Set(pages.flat().map(s => s.serial)));
    for (const serial of serials) {
      qrMap.set(serial, await qrDataUrl(serial));
    }
  }

  pages.forEach((page, i) => {
    if (i > 0) doc.addPage();
    for (const s of page) {
      drawLabel(doc, s, drone, qrMap.get(s.serial), qrEnabled);
    }
  });

  return doc.output('blob');
}
