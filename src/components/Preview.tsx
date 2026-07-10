import { useRef, useEffect, useState, useCallback } from 'react';
import type { LayoutConfig, StickerData, Product, FontConfig } from '../types';
import { generatePDF, loadImage, renderSticker } from '../utils/pdf';

interface Props {
  stickers: StickerData[];
  product: Product | null;
  layout: LayoutConfig;
  fonts: FontConfig;
  logoDataUrl?: string;
  visible: boolean;
}

const PREVIEW_DPI = 72;

export function Preview({ stickers, product, layout, fonts, logoDataUrl, visible }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [downloading, setDownloading] = useState(false);

  const perPage = layout.cols * layout.rows;
  const totalPages = Math.ceil(stickers.length / perPage);

  const pageStickers = stickers.slice(page * perPage, (page + 1) * perPage);

  useEffect(() => {
    if (!visible || !canvasRef.current || !product) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const pmm = PREVIEW_DPI / 25.4;
    const pw = 210 * pmm * zoom;
    const ph = 297 * pmm * zoom;

    canvas.width = pw;
    canvas.height = ph;
    ctx.clearRect(0, 0, pw, ph);

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, pw, ph);

    ctx.scale(zoom, zoom);

    for (let i = 0; i < pageStickers.length; i++) {
      const row = Math.floor(i / layout.cols);
      const col = i % layout.cols;
      const x = layout.margin_left_mm + col * (layout.sticker_width_mm + layout.spacing_h_mm);
      const y = layout.margin_top_mm + row * (layout.sticker_height_mm + layout.spacing_v_mm);

      renderSticker(ctx, x, y, layout.sticker_width_mm, layout.sticker_height_mm, PREVIEW_DPI, pageStickers[i], product, fonts, logoDataUrl);
    }

    // Cut guides
    ctx.setLineDash([1.5 * pmm / (72 / 25.4), 2 * pmm / (72 / 25.4)]);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 0.15;
    for (let col = 1; col < layout.cols; col++) {
      const gx = layout.margin_left_mm + col * (layout.sticker_width_mm + layout.spacing_h_mm) - layout.spacing_h_mm / 2;
      ctx.beginPath();
      ctx.moveTo(gx * pmm, layout.margin_top_mm * pmm);
      ctx.lineTo(gx * pmm, (layout.margin_top_mm + layout.rows * (layout.sticker_height_mm + layout.spacing_v_mm) - layout.spacing_v_mm) * pmm);
      ctx.stroke();
    }
    for (let row = 1; row < layout.rows; row++) {
      const gy = layout.margin_top_mm + row * (layout.sticker_height_mm + layout.spacing_v_mm) - layout.spacing_v_mm / 2;
      ctx.beginPath();
      ctx.moveTo(layout.margin_left_mm * pmm, gy * pmm);
      ctx.lineTo((layout.margin_left_mm + layout.cols * (layout.sticker_width_mm + layout.spacing_h_mm) - layout.spacing_h_mm) * pmm, gy * pmm);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [stickers, product, layout, fonts, logoDataUrl, visible, page, zoom]);

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
        fonts,
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
  }, [product, layout, stickers, fonts, logoDataUrl]);

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
