import { useState, useCallback } from 'react';
import type { Product, LayoutConfig, StickerData } from './types';
import { DEFAULT_LAYOUT } from './types';
import { ProductSelector } from './components/ProductSelector';
import { BatchConfig } from './components/BatchConfig';
import { LayoutConfig } from './components/LayoutConfig';
import { Preview } from './components/Preview';

export default function App() {
  const [product, setProduct] = useState<Product | null>(null);
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
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
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <h1 style={styles.h1}>Sticker Generator</h1>
        <span style={styles.tagline}>Product label batch printer</span>
      </header>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <ProductSelector
            product={product}
            onProductChange={setProduct}
            onLogoData={setLogoDataUrl}
          />

          <BatchConfig
            product={product}
            layout={layout}
            onGenerate={handleGenerate}
            disabled={!product}
          />

          <LayoutConfig layout={layout} onChange={setLayout} />
        </aside>

        <main style={styles.main}>
          <Preview
            stickers={stickers}
            product={product}
            layout={layout}
            logoDataUrl={logoDataUrl}
            visible={generated}
          />
        </main>
      </div>
    </div>
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
