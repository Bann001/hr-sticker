import { useRef, useEffect, useState, useCallback } from 'react';
import type { LayoutConfig, StickerData, Product } from '../types';
import { generatePDF, loadImage } from '../utils/pdf';

interface Props {
  stickers: StickerData[];
  product: Product | null;
  layout: LayoutConfig;
  logoDataUrl?: string;
  visible: boolean;
}

export function Preview({ stickers, product, layout, logoDataUrl, visible }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [downloading, setDownloading] = useState(false);

  const perPage = layout.cols * layout.rows;
  const totalPages = Math.ceil(stickers.length / perPage);

  const pageStickers = stickers.slice(page * perPage, (page + 1) * perPage);

  // Draw preview
  useEffect(() => {
    if (!visible || !canvasRef.current || !product) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const scale = 72 / 25.4;
    const pw = 210 * scale * zoom;
    const ph = 297 * scale * zoom;

    canvas.width = pw;
    canvas.height = ph;
    ctx.clearRect(0, 0, pw, ph);

    // Page background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, pw, ph);

    ctx.scale(zoom, zoom);

    // Draw stickers
    for (let i = 0; i < pageStickers.length; i++) {
      const row = Math.floor(i / layout.cols);
      const col = i % layout.cols;
      const x = layout.margin_left_mm + col * (layout.sticker_width_mm + layout.spacing_h_mm);
      const y = layout.margin_top_mm + row * (layout.sticker_height_mm + layout.spacing_v_mm);

      drawStickerPreview(ctx, x, y, layout.sticker_width_mm, layout.sticker_height_mm, pageStickers[i], product, logoDataUrl);
    }

    // Cut guides
    ctx.setLineDash([1.5 * scale / 72 * 25.4, 2 * scale / 72 * 25.4]);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 0.15;
    for (let col = 1; col < layout.cols; col++) {
      const gx = layout.margin_left_mm + col * (layout.sticker_width_mm + layout.spacing_h_mm) - layout.spacing_h_mm / 2;
      ctx.beginPath();
      ctx.moveTo(gx * scale, layout.margin_top_mm * scale);
      ctx.lineTo(gx * scale, (layout.margin_top_mm + layout.rows * (layout.sticker_height_mm + layout.spacing_v_mm) - layout.spacing_v_mm) * scale);
      ctx.stroke();
    }
    for (let row = 1; row < layout.rows; row++) {
      const gy = layout.margin_top_mm + row * (layout.sticker_height_mm + layout.spacing_v_mm) - layout.spacing_v_mm / 2;
      ctx.beginPath();
      ctx.moveTo(layout.margin_left_mm * scale, gy * scale);
      ctx.lineTo((layout.margin_left_mm + layout.cols * (layout.sticker_width_mm + layout.spacing_h_mm) - layout.spacing_h_mm) * scale, gy * scale);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [stickers, product, layout, logoDataUrl, visible, page, zoom]);

  function drawStickerPreview(
    ctx: CanvasRenderingContext2D,
    xMm: number, yMm: number, wMm: number, hMm: number,
    data: StickerData,
    prod: Product,
    logo?: string,
  ) {
    const s = 72 / 25.4;

    ctx.fillStyle = '#fff';
    ctx.fillRect(xMm * s, yMm * s, wMm * s, hMm * s);

    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 0.3;
    ctx.strokeRect(xMm * s, yMm * s, wMm * s, hMm * s);

    // Logo
    if (logo) {
      try {
        const img = new Image();
        img.src = logo;
        ctx.drawImage(img, (xMm + 1.5) * s, (yMm + 1.5) * s, 6 * s, 6 * s);
      } catch {}
    }

    const lx = (xMm + (logo ? 8.5 : 1.5)) * s;

    ctx.fillStyle = '#1e1e1e';
    ctx.font = `bold ${6 * s}px Helvetica`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(prod.distributor, lx, (yMm + 2.5) * s);

    ctx.fillStyle = '#555';
    ctx.font = `bold ${5 * s}px Helvetica`;
    ctx.fillText(prod.name, lx, (yMm + 5) * s);

    ctx.fillStyle = '#888';
    ctx.font = `${4.5 * s}px Helvetica`;
    ctx.fillText(prod.volume, lx, (yMm + 7.5) * s);

    // Barcode bars (simplified for preview)
    const bcW = wMm * 0.45 * s;
    const bcH = 7 * s;
    const bcX = (xMm + (wMm - wMm * 0.45) / 2) * s;
    const bcY = (yMm + 8.5) * s;

    ctx.fillStyle = '#000';
    const simplify = data.bt_number.split('').map(c => c.charCodeAt(0) % 2);
    const barW = bcW / simplify.length;
    simplify.forEach((b, i) => {
      if (b === 0) ctx.fillRect(bcX + i * barW, bcY, Math.max(barW * 0.6, 0.5), bcH);
    });

    ctx.fillStyle = '#1e1e1e';
    ctx.font = `bold ${4.8 * s}px Courier`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(data.bt_number, (xMm + wMm / 2) * s, bcY + bcH + 0.6 * s);
  }

  const handleDownload = useCallback(async () => {
    if (!product) return;
    setDownloading(true);
    try {
      let logo = logoDataUrl;
      if (!logo && product.logo_url) {
        try { logo = await loadImage(product.logo_url); } catch {}
      }
      const blob = generatePDF({
        product,
        layout,
        stickers,
        logoDataUrl: logo,
        filename: `stickers-${stickers[0]?.bt_number || 'batch'}.pdf`,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stickers-${stickers[0]?.bt_number || 'batch'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
    setDownloading(false);
  }, [product, layout, stickers, logoDataUrl]);

  if (!visible || !product) {
    return (
      <div style={styles.empty}>
        <p>Select a product, configure batch settings, and click <strong>Preview</strong> to begin.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <span style={{ color: '#999aae', fontSize: 13 }}>
          Page {page + 1} / {totalPages} &middot; {stickers.length} stickers
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button style={styles.navBtn} disabled={page === 0} onClick={() => setPage(p => p - 1)}>&larr;</button>
          <span style={{ color: '#999aae', fontSize: 12, minWidth: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button style={styles.navBtn} disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>&rarr;</button>
          <button style={styles.navBtn} onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}>&minus;</button>
          <button style={styles.navBtn} onClick={() => setZoom(1)}>&#x25CB;</button>
          <button style={styles.navBtn} onClick={() => setZoom(z => Math.min(4, z + 0.25))}>+</button>
          <button style={styles.dlBtn} onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>
      <div style={styles.canvasWrap}>
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: 14 },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', background: '#191922', borderBottom: '1px solid #2e2e3e', flexShrink: 0, flexWrap: 'wrap', gap: 8 },
  navBtn: { background: '#22222e', color: '#e4e4ec', border: '1px solid #2e2e3e', padding: '5px 10px', borderRadius: 5, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' },
  dlBtn: { background: '#16a34a', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  canvasWrap: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'auto', padding: 20, background: 'radial-gradient(ellipse at center, #14141e 0%, #0a0a0f 100%)' },
  canvas: { boxShadow: '0 4px 24px rgba(0,0,0,0.5)', borderRadius: 4, maxWidth: '100%' },
};
