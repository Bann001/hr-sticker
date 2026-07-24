import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Product, LayoutConfig, StickerData } from '../types';
import { supabase } from '../supabase';
import { removeBackground } from '../utils/removeBackground';

interface Props {
  product: Product | null;
  layout: LayoutConfig;
  onGenerate: (data: { stickers: StickerData[]; product: Product; logo?: string }) => void;
  disabled: boolean;
  designMode?: boolean;
}

const fieldProps = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3 },
};

export function BatchConfig({ product, layout, onGenerate, disabled, designMode }: Props) {
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
    if (quantity < 1) return;
    if (!product && !designMode) return;
    const dummyProduct = product || { id: '', name: '', distributor: '', volume: '', logo_url: '' } as Product;
    const stickers: StickerData[] = [];
    for (let i = 0; i < quantity; i++) {
      const serial = startSerial + i;
      stickers.push({ bt_number: generateBT(serial), serial });
    }
    onGenerate({ stickers, product: dummyProduct });
  }

  async function handleGenerate() {
    if (quantity < 1) return;
    if (!product && !designMode) return;
    setGenerating(true);
    const dummyProduct = product || { id: '', name: '', distributor: '', volume: '', logo_url: '' } as Product;
    const stickers: StickerData[] = [];
    for (let i = 0; i < quantity; i++) {
      const serial = startSerial + i;
      stickers.push({ bt_number: generateBT(serial), serial });
    }
    if (product || designMode) {
      try {
        await supabase.from('batches').insert({
          product_id: product?.id || null,
          batch_code: batchCode,
          start_serial: startSerial,
          end_serial: startSerial + quantity - 1,
          quantity,
          status: 'completed',
          layout_config: layout,
        });
      } catch { /* non-blocking */ }
    }

    let logo: string | undefined;
    if (dummyProduct.logo_url) {
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
          img.src = dummyProduct.logo_url;
        });
      } catch { /* ignore */ }
    }

    onGenerate({ stickers, product: dummyProduct, logo });
    setGenerating(false);
  }

  return (
    <div className="p-5 space-y-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">Batch</h3>

      {designMode ? (
        <>
          <motion.div {...fieldProps} transition={{ delay: 0.05 }}>
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Starting number</label>
            <input
              className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary w-full focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 placeholder:text-text-muted/60"
              type="number"
              min={1}
              value={startSerial}
              onChange={e => setStartSerial(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </motion.div>

          <motion.div {...fieldProps} transition={{ delay: 0.1 }}>
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Quantity</label>
            <input
              className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary w-full focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 placeholder:text-text-muted/60"
              type="number"
              min={1}
              max={10000}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </motion.div>

          <motion.div {...fieldProps} transition={{ delay: 0.15 }}>
            <div className="bg-bg-surface border border-border rounded-xl px-3.5 py-2.5">
              <span className="text-xs text-text-muted">BT range: </span>
              <span className="text-xs text-text-primary font-mono">{generateBT(startSerial)} – {generateBT(startSerial + quantity - 1)}</span>
            </div>
          </motion.div>
        </>
      ) : (
        <>
          <motion.div {...fieldProps} transition={{ delay: 0.05 }}>
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Batch code (YYMM)</label>
            <input
              className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary w-full focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 placeholder:text-text-muted/60"
              value={batchCode}
              onChange={e => setBatchCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="2612"
              maxLength={4}
            />
          </motion.div>

          <motion.div {...fieldProps} transition={{ delay: 0.1 }}>
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Batch number (2 digits)</label>
            <input
              className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary w-full focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 placeholder:text-text-muted/60"
              value={batchNum}
              onChange={e => setBatchNum(e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="01"
              maxLength={2}
            />
          </motion.div>

          <motion.div {...fieldProps} transition={{ delay: 0.15 }}>
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Start serial</label>
            <input
              className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary w-full focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 placeholder:text-text-muted/60"
              type="number"
              min={1}
              value={startSerial}
              onChange={e => setStartSerial(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </motion.div>

          <motion.div {...fieldProps} transition={{ delay: 0.2 }}>
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Quantity</label>
            <input
              className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary w-full focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 placeholder:text-text-muted/60"
              type="number"
              min={1}
              max={10000}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </motion.div>
        </>
      )}

      <div className="flex gap-2 mt-2">
        <motion.button
          className="flex-1 bg-bg-surface border border-border rounded-xl text-text-primary font-semibold text-sm h-10 hover:bg-bg-sidebar transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
          onClick={handlePreview}
          disabled={!product && !designMode}
          whileHover={!product && !designMode ? {} : { scale: 1.03 }}
          whileTap={!product && !designMode ? {} : { scale: 0.97 }}
        >
          Preview
        </motion.button>
        <motion.button
          className="flex-1 bg-accent text-selected-text hover:bg-accent-hover rounded-xl font-semibold px-5 py-2.5 text-sm transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
          onClick={handleGenerate}
          disabled={(!product && !designMode) || generating}
          whileHover={(!product && !designMode) || generating ? {} : { scale: 1.03 }}
          whileTap={(!product && !designMode) || generating ? {} : { scale: 0.97 }}
        >
          {generating ? 'Generating...' : 'Generate & Save'}
        </motion.button>
      </div>
    </div>
  );
}