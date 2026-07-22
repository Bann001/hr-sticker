import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product, LayoutConfig as LayoutConfigType, StickerData, FontConfig as FontConfigType } from './types';
import { DEFAULT_LAYOUT, DEFAULT_FONTS } from './types';
import { ProductSelector } from './components/ProductSelector';
import { BatchConfig } from './components/BatchConfig';
import { LayoutConfig } from './components/LayoutConfig';
import { FontConfig } from './components/FontConfig';
import { Preview } from './components/Preview';

export default function App() {
  const [product, setProduct] = useState<Product | null>(null);
  const [layout, setLayout] = useState<LayoutConfigType>(DEFAULT_LAYOUT);
  const [fonts, setFonts] = useState<FontConfigType>(DEFAULT_FONTS);
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [generated, setGenerated] = useState(false);

  const handleGenerate = useCallback(
    (data: { stickers: StickerData[]; product: Product; logo?: string }) => {
      setStickers(data.stickers);
      setProduct(data.product);
      if (data.logo) setLogoDataUrl(data.logo);
      setGenerated(true);
    },
    [],
  );

  return (
    <motion.div
      style={styles.wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.header
        style={styles.header}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
      >
        <h1 style={styles.h1}>Sticker Generator</h1>
        <span style={styles.tagline}>Product label batch printer</span>
      </motion.header>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
          >
            <ProductSelector
              product={product}
              onProductChange={setProduct}
              onLogoData={setLogoDataUrl}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.25 }}
          >
            <BatchConfig
              product={product}
              layout={layout}
              onGenerate={handleGenerate}
              disabled={!product}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.35 }}
          >
            <FontConfig config={fonts} onChange={setFonts} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.45 }}
          >
            <LayoutConfig layout={layout} onChange={setLayout} />
          </motion.div>
        </aside>

        <main style={styles.main}>
          <AnimatePresence mode="wait">
            <Preview
              key={generated ? 'preview' : 'empty'}
              stickers={stickers}
              product={product}
              layout={layout}
              fonts={fonts}
              logoDataUrl={logoDataUrl}
              visible={generated}
            />
          </AnimatePresence>
        </main>
      </div>
    </motion.div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#0f0f13',
    color: '#e4e4ec',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    background: '#191922',
    borderBottom: '1px solid #2e2e3e',
    flexShrink: 0,
  },
  h1: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '-0.5px',
    background: 'linear-gradient(135deg, #fff 30%, #7c5cfc)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  tagline: { fontSize: 12, color: '#999aae' },
  layout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: 340,
    minWidth: 340,
    background: '#191922',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    overflowY: 'auto',
    borderRight: '1px solid #2e2e3e',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
};
