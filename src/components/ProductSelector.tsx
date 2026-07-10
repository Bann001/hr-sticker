import { useState, useEffect, useRef } from 'react';
import type { Product } from '../types';
import { supabase } from '../supabase';
import { removeBackground } from '../utils/removeBackground';
import { SavedLogos } from './SavedLogos';

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
    <div>
      <h3 style={styles.title}>Product</h3>

      {products.length > 0 && (
        <select
          style={styles.select}
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
      )}

      <button style={styles.linkBtn} onClick={() => setEditing(!editing)}>
        {editing ? 'Cancel' : '+ New product'}
      </button>

      {editing && (
        <div style={styles.form}>
          <label style={styles.label}>Name</label>
          <input style={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Vaniva" />

          <label style={styles.label}>Distributor</label>
          <input style={styles.input} value={distributor} onChange={e => setDistributor(e.target.value)} placeholder="Distributor name" />

          <label style={styles.label}>Volume</label>
          <input style={styles.input} value={volume} onChange={e => setVolume(e.target.value)} placeholder="e.g. 500ml" />

          <label style={styles.label}>Logo URL</label>
          <input style={styles.input} value={logoUrl} onChange={e => loadLogo(e.target.value)} placeholder="https://..." />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={styles.label}>Or upload</label>
            <SavedLogos onSelect={url => { onLogoData(url); setLogoUrl(url); }} />
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ color: '#aaa', fontSize: 12 }} />

          <button style={styles.saveBtn} onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save product'}
          </button>
        </div>
      )}

      {product && (
        <div style={styles.activeProduct}>
          <strong>{product.name}</strong> — {product.distributor} {product.volume && `(${product.volume})`}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999aae', marginBottom: 8 },
  select: { width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 6, border: '1px solid #2e2e3e', background: '#22222e', color: '#e4e4ec', fontFamily: 'inherit' },
  linkBtn: { background: 'none', border: 'none', color: '#7c5cfc', cursor: 'pointer', fontSize: 12, padding: '4px 0', fontFamily: 'inherit' },
  form: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 },
  label: { fontSize: 11, fontWeight: 600, color: '#999aae' },
  input: { padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid #2e2e3e', background: '#22222e', color: '#e4e4ec', fontFamily: 'inherit' },
  saveBtn: { padding: '8px 14px', background: '#7c5cfc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4, fontFamily: 'inherit' },
  activeProduct: { fontSize: 12, color: '#22c55e', marginTop: 4 },
};
