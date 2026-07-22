import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { LayoutConfig, StickerData, Product, FontConfig, DesignElement } from '../types';
import { renderSticker } from '../utils/renderSticker';
import type { GenerateOptions, DesignGenerateOptions } from '../utils/pdf';

interface Props {
  stickers: StickerData[];
  product: Product | null;
  layout: LayoutConfig;
  fonts: FontConfig;
  logoDataUrl?: string;
  visible: boolean;
  designElements?: DesignElement[];
  generatePDFOverride?: (opts: DesignGenerateOptions) => Blob;
  renderStickerOverride?: (
    ctx: CanvasRenderingContext2D,
    xMm: number, yMm: number,
    wMm: number, hMm: number,
    dpi: number,
    elements: DesignElement[],
    product: Product,
    btNumber: string,
    logoDataUrl?: string,
  ) => void;
}

const PREVIEW_DPI = 72;

export function Preview({
  stickers, product, layout, fonts, logoDataUrl, visible,
  designElements, generatePDFOverride, renderStickerOverride,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [downloading, setDownloading] = useState(false);

  const perPage = layout.cols * layout.rows;
  const totalPages = Math.ceil(stickers.length / perPage);

  const pageStickers = stickers.slice(page * perPage, (page + 1) * perPage);

  const isDesignMode = designElements !== undefined && designElements.length > 0;

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

      if (isDesignMode && renderStickerOverride) {
        renderStickerOverride(
          ctx, x, y,
          layout.sticker_width_mm, layout.sticker_height_mm,
          PREVIEW_DPI,
          designElements!,
          product,
          pageStickers[i].bt_number,
          logoDataUrl,
        );
      } else {
        renderSticker(ctx, x, y, layout.sticker_width_mm, layout.sticker_height_mm, PREVIEW_DPI, pageStickers[i], product, fonts, logoDataUrl);
      }
    }

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
  }, [stickers, product, layout, fonts, logoDataUrl, visible, page, zoom, isDesignMode, designElements, renderStickerOverride]);

  const handleDownload = useCallback(async () => {
    if (!product) return;
    setDownloading(true);
    try {
      let logo = logoDataUrl;
      if (!logo && product.logo_url) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            img.onload = () => {
              const c = document.createElement('canvas');
              c.width = img.naturalWidth;
              c.height = img.naturalHeight;
              c.getContext('2d')!.drawImage(img, 0, 0);
              logo = c.toDataURL('image/png');
              resolve(null);
            };
            img.onerror = reject;
            img.src = product.logo_url;
          });
        } catch {}
      }

      if (isDesignMode && generatePDFOverride && designElements) {
        const blob = generatePDFOverride({
          product,
          layout,
          stickers,
          elements: designElements,
          logoDataUrl: logo,
          filename: `stickers-${stickers[0]?.bt_number || 'batch'}.pdf`,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stickers-${stickers[0]?.bt_number || 'batch'}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const { generatePDF } = await import('../utils/pdf');
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
      }
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
    setDownloading(false);
  }, [product, layout, stickers, fonts, logoDataUrl, isDesignMode, designElements, generatePDFOverride]);

  if (!visible || !product) {
    return (
      <motion.div
        style={styles.empty}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          Select a product, configure batch settings, and click <strong>Preview</strong> to begin.
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div
      style={styles.container}
      key={`${page}-${stickers.length}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div style={styles.toolbar}>
        <motion.span
          style={{ color: '#999aae', fontSize: 13 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Page {page + 1} / {totalPages} &middot; {stickers.length} stickers
          {isDesignMode && <span style={{ color: '#7c5cfc', marginLeft: 6 }}>(custom design)</span>}
        </motion.span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <motion.button
            style={styles.navBtn}
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            whileHover={page !== 0 ? { scale: 1.06 } : {}}
            whileTap={page !== 0 ? { scale: 0.94 } : {}}
          >
            &larr;
          </motion.button>
          <span style={{ color: '#999aae', fontSize: 12, minWidth: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <motion.button
            style={styles.navBtn}
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            whileHover={page < totalPages - 1 ? { scale: 1.06 } : {}}
            whileTap={page < totalPages - 1 ? { scale: 0.94 } : {}}
          >
            &rarr;
          </motion.button>
          <motion.button style={styles.navBtn} onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>&minus;</motion.button>
          <motion.button style={styles.navBtn} onClick={() => setZoom(1)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>&#x25CB;</motion.button>
          <motion.button style={styles.navBtn} onClick={() => setZoom(z => Math.min(4, z + 0.25))} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>+</motion.button>
          <motion.button
            style={styles.dlBtn}
            onClick={handleDownload}
            disabled={downloading}
            whileHover={downloading ? {} : { scale: 1.04 }}
            whileTap={downloading ? {} : { scale: 0.96 }}
          >
            {downloading ? 'Generating...' : 'Download PDF'}
          </motion.button>
        </div>
      </div>
      <motion.div
        style={styles.canvasWrap}
        key={page}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <canvas ref={canvasRef} style={styles.canvas} />
      </motion.div>
    </motion.div>
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
