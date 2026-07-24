import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../types';
import { supabase } from '../supabase';
import { removeBackground } from '../utils/removeBackground';
import { SavedLogos, saveLogoToLibrary } from './SavedLogos';

interface Props {
  product: Product | null;
  onProductChange: (p: Product | null) => void;
  onLogoData: (url: string | undefined) => void;
}

export function ProductSelector({ product, onProductChange, onLogoData }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [distributor, setDistributor] = useState('');
  const [volume, setVolume] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('products').select('*').order('name').then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  async function loadLogo(url: string) {
    setLogoUrl(url);
    if (!url) { onLogoData(undefined); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d')!.drawImage(img, 0, 0);
      const cleaned = await removeBackground(c.toDataURL('image/png'));
      onLogoData(cleaned);
    };
    img.src = url;
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const cleaned = await removeBackground(dataUrl);
      onLogoData(cleaned);
      setLogoUrl(cleaned);
      saveLogoToLibrary(cleaned, file.name.replace(/\.[^.]+$/, ''));
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!name || !distributor) return;
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .insert({ name, distributor, volume, logo_url: logoUrl })
      .select()
      .single();

    if (data) {
      setProducts(prev => [...prev, data]);
      onProductChange(data);
      setEditing(false);
    }
    setLoading(false);
  }

  return (
    <div className="p-5 space-y-4">
      <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Product</h3>

      <AnimatePresence mode="wait">
        {!editing && products.length > 0 && (
          <motion.div
            key="select"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <select
              className="w-full h-10 px-3.5 pr-8 text-sm bg-bg-surface border border-border rounded-xl text-text-primary appearance-none cursor-pointer focus:outline-none"
              value={product?.id || ''}
              onChange={e => {
                const p = products.find(x => x.id === e.target.value);
                onProductChange(p || null);
                if (p) {
                  setName(p.name);
                  setDistributor(p.distributor);
                  setVolume(p.volume);
                  loadLogo(p.logo_url);
                }
              }}
            >
              <option value="">— Select product —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="text-text-secondary hover:text-text-primary text-xs font-medium bg-transparent border-none cursor-pointer"
        onClick={() => setEditing(!editing)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
      >
        {editing ? 'Cancel' : '+ New product'}
      </motion.button>

      <AnimatePresence>
        {editing && (
          <motion.div
            key="form"
            className="flex flex-col gap-3 overflow-hidden"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Name</label>
            <input className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Vaniva" />

            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Distributor</label>
            <input className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10" value={distributor} onChange={e => setDistributor(e.target.value)} placeholder="Distributor name" />

            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Volume</label>
            <input className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10" value={volume} onChange={e => setVolume(e.target.value)} placeholder="e.g. 500ml" />

            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Logo URL</label>
            <input className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10" value={logoUrl} onChange={e => loadLogo(e.target.value)} placeholder="https://..." />

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Or upload</label>
              <SavedLogos onSelect={url => { onLogoData(url); setLogoUrl(url); }} />
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="text-xs text-text-muted" />

            <motion.button
              className="bg-accent text-selected-text hover:bg-accent-hover rounded-xl font-medium px-4 py-2.5 text-sm"
              onClick={handleSave}
              disabled={loading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {loading ? 'Saving...' : 'Save product'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {product && (
          <motion.div
            key="active"
            className="text-xs text-accent"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
          >
            <strong>{product.name}</strong> — {product.distributor} {product.volume && `(${product.volume})`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
