export type LabelTier = 'large' | 'medium' | 'small' | 'vertical';

export interface LabelSize {
  key: string;
  label: string;
  w: number;
  h: number;
  tier: LabelTier;
}

export const LABEL_SIZES: LabelSize[] = [
  { key: 'large-70x35', label: '70 × 35', w: 70, h: 35, tier: 'large' },
  { key: 'large-60x30', label: '60 × 30', w: 60, h: 30, tier: 'large' },
  { key: 'large-50x25', label: '50 × 25', w: 50, h: 25, tier: 'large' },
  { key: 'medium-45x20', label: '45 × 20', w: 45, h: 20, tier: 'medium' },
  { key: 'medium-40x15', label: '40 × 15', w: 40, h: 15, tier: 'medium' },
  { key: 'medium-35x15', label: '35 × 15', w: 35, h: 15, tier: 'medium' },
  { key: 'small-30x12', label: '30 × 12', w: 30, h: 12, tier: 'small' },
  { key: 'small-25x10', label: '25 × 10', w: 25, h: 10, tier: 'small' },
  { key: 'small-20x8', label: '20 × 8', w: 20, h: 8, tier: 'small' },
  { key: 'vertical-70x15', label: '15 × 70', w: 15, h: 70, tier: 'vertical' },
  { key: 'vertical-50x10', label: '10 × 50', w: 10, h: 50, tier: 'vertical' },
];

export const TIER_ORDER: LabelTier[] = ['large', 'vertical', 'medium', 'small'];

export const PAGE_W = 210;
export const PAGE_H = 297;
export const MARGIN = 9;
export const GAP = 2.5;
const MIN_CELL = 8;

export interface PlacedSticker {
  id: string;
  size: LabelSize;
  xMm: number;
  yMm: number;
  serial: string;
}

interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function fits(rect: FreeRect, w: number, h: number) {
  return rect.w >= w && rect.h >= h;
}

function prune(rect: FreeRect) {
  return rect.w >= MIN_CELL && rect.h >= MIN_CELL;
}

function addRect(list: FreeRect[], rect: FreeRect) {
  if (prune(rect)) list.push(rect);
}

/**
 * Hybrid packing. The sheet is split into:
 *  - a main area (large → medium → small tiers, guillotine packed)
 *  - a right-edge column reserved for tall vertical labels
 * so the sheet fills with large stickers at the top, vertical labels down the
 * right edge, then medium/small stickers filling the leftover space. Always
 * places at a free-rectangle origin and splits into right/bottom remainders to
 * guarantee no overlaps and uniform spacing.
 */
export function packPage(sizes: LabelSize[], budget: number, serials: string[], startIdx: number): PlacedSticker[] {
  const printW = PAGE_W - MARGIN * 2;
  const printH = PAGE_H - MARGIN * 2;
  const verticals = sizes.filter(s => s.tier === 'vertical');
  const colW = verticals.length > 0 ? Math.max(...verticals.map(s => s.w)) + GAP : 0;
  const mainW = printW - colW;

  const freeRects: FreeRect[] = [
    { x: MARGIN, y: MARGIN, w: mainW, h: printH },
  ];
  const placed: PlacedSticker[] = [];
  let serialIdx = 0;
  const nextSerial = () => (startIdx + serialIdx < serials.length ? serials[startIdx + serialIdx++] : '');

  function packTier(tier: LabelTier) {
    const tierSizes = sizes.filter(s => s.tier === tier).sort((a, b) => b.w * b.h - a.w * a.h);
    for (const size of tierSizes) {
      while (placed.length < budget) {
        const rect = findSpot(size, freeRects);
        if (!rect) break;

        placed.push({
          id: `s-${startIdx + placed.length}`,
          size,
          xMm: rect.x,
          yMm: rect.y,
          serial: nextSerial(),
        });

        const right: FreeRect = { x: rect.x + size.w + GAP, y: rect.y, w: rect.w - size.w - GAP, h: size.h };
        const bottom: FreeRect = { x: rect.x, y: rect.y + size.h + GAP, w: rect.w, h: rect.h - size.h - GAP };

        const i = freeRects.indexOf(rect);
        freeRects.splice(i, 1);
        addRect(freeRects, right);
        addRect(freeRects, bottom);
      }
    }
  }

  function packColumn() {
    if (colW === 0) return;
    const vSizes = verticals.slice().sort((a, b) => b.h - a.h);
    let y = MARGIN;
    for (const size of vSizes) {
      while (placed.length < budget && y + size.h <= MARGIN + printH) {
        placed.push({
          id: `s-${startIdx + placed.length}`,
          size,
          xMm: MARGIN + mainW,
          yMm: y,
          serial: nextSerial(),
        });
        y += size.h + GAP;
      }
    }
  }

  packTier('large');
  packColumn();
  packTier('medium');
  packTier('small');

  return placed;
}

function findSpot(size: LabelSize, freeRects: FreeRect[]): FreeRect | null {
  let best: FreeRect | null = null;
  for (const r of freeRects) {
    if (!fits(r, size.w, size.h)) continue;
    if (!best) { best = r; continue; }
    if (r.y < best.y || (r.y === best.y && r.x < best.x)) best = r;
  }
  return best;
}

/** Pack `count` stickers across one or more A4 pages. */
export function packSheet(count: number, sizes: LabelSize[], serials: string[]): PlacedSticker[][] {
  const pages: PlacedSticker[][] = [];
  let placed = 0;
  while (placed < count) {
    const page = packPage(sizes, count - placed, serials, placed);
    if (page.length === 0) break;
    pages.push(page);
    placed += page.length;
  }
  return pages;
}

export interface SizeBreakdown {
  size: LabelSize;
  count: number;
}

export function breakdown(placed: PlacedSticker[]): SizeBreakdown[] {
  const map = new Map<string, SizeBreakdown>();
  for (const s of placed) {
    const entry = map.get(s.size.key) ?? { size: s.size, count: 0 };
    entry.count++;
    map.set(s.size.key, entry);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
