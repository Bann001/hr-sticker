import { useState } from 'react';
import type { Product, LayoutConfig, StickerData } from '../types';
import { supabase } from '../supabase';
import { removeBackground } from '../utils/removeBackground';

interface Props {
  product: Product | null;
  layout: LayoutConfig;
  onGenerate: (data: { stickers: StickerData[]; product: Product; logo?: string }) => void;
  disabled: boolean;
}

export function BatchConfig({ product, layout, onGenerate, disabled }: Props) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const [batchCode, setBatchCode] = useState(`${yy}${mm}`);
  const [batchNum, setBatchNum] = useState('01');
  const [startSerial, setStartSerial] = useState(1);
  const [quantity, setQuantity] = useState(22);
  const [generating, setGenerating] = useState(false);

  function generateBT(serial: number): string {
    return `${batchCode}${batchNum}${String(serial).padStart(5, '0')}`;
  }

  function handlePreview() {
    if (!product || quantity < 1) return;
    const stickers: StickerData[] = [];
    for (let i = 0; i < quantity; i++) {
      const serial = startSerial + i;
      stickers.push({ bt_number: generateBT(serial), serial });
    }
    onGenerate({ stickers, product });
  }

  async function handleGenerate() {
    if (!product || quantity < 1) return;
    setGenerating(true);
    const stickers: StickerData[] = [];
    for (let i = 0; i < quantity; i++) {
      const serial = startSerial + i;
      stickers.push({ bt_number: generateBT(serial), serial });
    }

    // Save batch to Supabase
    try {
      await supabase.from('batches').insert({
        product_id: product.id,
        batch_code: batchCode,
        start_serial: startSerial,
        end_serial: startSerial + quantity - 1,
        quantity,
        layout_config: layout,
      });
    } catch { /* non-blocking */ }

    // Load logo if product has one
    let logo: string | undefined;
    if (product.logo_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = async () => {
            const c = document.createElement('canvas');
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            c.getContext('2d')!.drawImage(img, 0, 0);
            logo = await removeBackground(c.toDataURL('image/png'));
            resolve();
          };
          img.onerror = reject;
          img.src = product.logo_url;
        });
      } catch { /* ignore */ }
    }

    onGenerate({ stickers, product, logo });
    setGenerating(false);
  }

  return (
    <div>
      <h3 style={styles.title}>Batch</h3>

      <label style={styles.label}>Batch code (YYMM)</label>
      <input
        style={styles.input}
        value={batchCode}
        onChange={e => setBatchCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
        placeholder="2612"
        maxLength={4}
      />

      <label style={styles.label}>Batch number (2 digits)</label>
      <input
        style={styles.input}
        value={batchNum}
        onChange={e => setBatchNum(e.target.value.replace(/\D/g, '').slice(0, 2))}
        placeholder="01"
        maxLength={2}
      />

      <label style={styles.label}>Start serial</label>
      <input
        style={styles.input}
        type="number"
        min={1}
        value={startSerial}
        onChange={e => setStartSerial(Math.max(1, parseInt(e.target.value) || 1))}
      />

      <label style={styles.label}>Quantity</label>
      <input
        style={styles.input}
        type="number"
        min={1}
        max={10000}
        value={quantity}
        onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button style={styles.previewBtn} onClick={handlePreview} disabled={disabled}>
          Preview
        </button>
        <button style={styles.genBtn} onClick={handleGenerate} disabled={disabled || generating}>
          {generating ? 'Generating...' : 'Generate & Save'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999aae', marginBottom: 8 },
  label: { fontSize: 11, fontWeight: 600, color: '#999aae', marginTop: 4 },
  input: { width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid #2e2e3e', background: '#22222e', color: '#e4e4ec', fontFamily: 'inherit', marginTop: 2 },
  previewBtn: { flex: 1, padding: '9px 0', background: '#2a2a38', color: '#e4e4ec', border: '1px solid #2e2e3e', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  genBtn: { flex: 1, padding: '9px 0', background: '#7c5cfc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
};
