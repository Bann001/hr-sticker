import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product, LayoutConfig as LayoutConfigType, StickerData, FontConfig as FontConfigType, DesignElement } from './types';
import { DEFAULT_LAYOUT, DEFAULT_FONTS } from './types';
import { ProductSelector } from './components/ProductSelector';
import { BatchConfig } from './components/BatchConfig';
import { LayoutConfig } from './components/LayoutConfig';
import { FontConfig } from './components/FontConfig';
import { Preview } from './components/Preview';
import { StickerDesigner } from './components/StickerDesigner';
import { generatePDF, generatePDFFromDesign } from './utils/pdf';
import { renderDesign } from './utils/renderDesign';

export default function App() {
  const [tab, setTab] = useState<'generator' | 'designer'>('generator');
  const [product, setProduct] = useState<Product | null>(null);
  const [layout, setLayout] = useState<LayoutConfigType>(DEFAULT_LAYOUT);
  const [fonts, setFonts] = useState<FontConfigType>(DEFAULT_FONTS);
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [generated, setGenerated] = useState(false);
  const [designElements, setDesignElements] = useState<DesignElement[] | null>(null);

  const handleGenerate = useCallback(
    (data: { stickers: StickerData[]; product: Product; logo?: string }) => {
      setStickers(data.stickers);
      setProduct(data.product);
      if (data.logo) setLogoDataUrl(data.logo);
      setGenerated(true);
    },
    [],
  );

  const handleUseDesign = useCallback((design: { elements: DesignElement[] }) => {
    setDesignElements(design.elements);
    setTab('generator');
    setGenerated(false);
  }, []);

  const isDesignMode = designElements !== null && designElements.length > 0;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={styles.h1}>Sticker Generator</h1>
          <div style={styles.tabs}>
            <button
              style={tab === 'generator' ? styles.tabActive : styles.tab}
              onClick={() => setTab('generator')}
            >
              Generator
            </button>
            <button
              style={tab === 'designer' ? styles.tabActive : styles.tab}
              onClick={() => setTab('designer')}
            >
              Designer
            </button>
          </div>
        </div>
        <span style={styles.tagline}>Product label batch printer</span>
      </motion.header>

      <AnimatePresence mode="wait">
        {tab === 'generator' ? (
          <motion.div
            key="generator"
            style={styles.layout}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <aside style={styles.sidebar}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
              >
                {isDesignMode && (
                  <div style={{ marginBottom: 8, padding: '6px 10px', background: '#1a2a1a', border: '1px solid #2a4a2a', borderRadius: 6, fontSize: 12, color: '#22c55e' }}>
                    Using custom design —{' '}
                    <button
                      onClick={() => setDesignElements(null)}
                      style={{ background: 'none', border: 'none', color: '#7c5cfc', cursor: 'pointer', fontSize: 12, textDecoration: 'underline', fontFamily: 'inherit', padding: 0 }}
                    >
                      clear
                    </button>
                  </div>
                )}
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
                  key={generated && isDesignMode ? 'design-preview' : generated ? 'preview' : 'empty'}
                  stickers={stickers}
                  product={product}
                  layout={layout}
                  fonts={fonts}
                  logoDataUrl={logoDataUrl}
                  visible={generated}
                  designElements={isDesignMode ? designElements : undefined}
                  generatePDFOverride={isDesignMode ? generatePDFFromDesign : undefined}
                  renderStickerOverride={isDesignMode ? renderDesign : undefined}
                />
              </AnimatePresence>
            </main>
          </motion.div>
        ) : (
          <motion.div
            key="designer"
            style={{ display: 'flex', flex: 1, overflow: 'hidden' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <StickerDesigner onUseDesign={handleUseDesign} />
          </motion.div>
        )}
      </AnimatePresence>
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
  tabs: { display: 'flex', gap: 2, background: '#14141e', borderRadius: 6, padding: 2 },
  tab: { padding: '5px 14px', background: 'transparent', border: 'none', borderRadius: 4, color: '#999aae', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  tabActive: { padding: '5px 14px', background: '#2e2e3e', border: 'none', borderRadius: 4, color: '#e4e4ec', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
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
