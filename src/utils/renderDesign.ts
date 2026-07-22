import type { DesignElement, Product } from '../types';

export function renderDesign(
  ctx: CanvasRenderingContext2D,
  xMm: number, yMm: number,
  wMm: number, hMm: number,
  dpi: number,
  elements: DesignElement[],
  product: Product,
  btNumber: string,
  logoDataUrl?: string,
) {
  const pmm = dpi / 25.4;
  const ppt = dpi / 72;

  ctx.fillStyle = '#fff';
  ctx.fillRect(xMm * pmm, yMm * pmm, wMm * pmm, hMm * pmm);

  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = 0.2 * ppt;
  ctx.strokeRect(xMm * pmm, yMm * pmm, wMm * pmm, hMm * pmm);

  for (const el of elements) {
    const ex = (xMm + el.xMm) * pmm;
    const ey = (yMm + el.yMm) * pmm;
    const ew = el.widthMm * pmm;
    const eh = el.heightMm * pmm;

    if (el.type === 'logo') {
      const src = logoDataUrl || product.logo_url;
      if (src) {
        const img = new Image();
        img.src = src;
        try {
          const iw = img.naturalWidth || 1;
          const ih = img.naturalHeight || 1;
          const scale = Math.min(ew / iw, eh / ih);
          const dw = iw * scale;
          const dh = ih * scale;
          ctx.drawImage(img, ex + (ew - dw) / 2, ey + (eh - dh) / 2, dw, dh);
        } catch {}
      }
      continue;
    }

    let text = el.content || '';
    if (!text) {
      switch (el.type) {
        case 'brand':    text = product.name; break;
        case 'distributor': text = `Distributed by: ${product.distributor}`; break;
        case 'volume':   text = product.volume; break;
        case 'bt':       text = `BT: ${btNumber}`; break;
      }
    }

    if (!text) continue;

    ctx.fillStyle = el.color;
    ctx.font = `${el.bold ? 'bold ' : ''}${el.fontSize * ppt}px ${el.fontFamily}`;
    ctx.textAlign = el.align;
    ctx.textBaseline = 'middle';

    let tx = ex;
    if (el.align === 'center') tx = ex + ew / 2;
    else if (el.align === 'right') tx = ex + ew;

    ctx.fillText(text, tx, ey + eh / 2);
  }
}
