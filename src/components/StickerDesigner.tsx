import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DesignElement, ElementType, FontFamily } from '../types';
import { STICKER_W, STICKER_H } from '../types';
import { SavedLogos, saveLogoToLibrary } from './SavedLogos';
import { removeBackground } from '../utils/removeBackground';

const STORAGE_KEY = 'sticker-designs';

interface StickerDesign {
  id: string;
  name: string;
  elements: DesignElement[];
  createdAt: string;
}

let _id = 1;
function uid() { return `el_${_id++}_${Date.now()}`; }

function defaultElement(type: ElementType, existing: DesignElement[]): DesignElement {
  const base: Partial<DesignElement> = {
    id: uid(),
    type,
    fontFamily: 'Space Grotesk',
    color: '#1e1e1e',
    align: 'left',
    bold: false,
    fontSize: 9,
  };
  switch (type) {
    case 'brand':
      return { ...base, xMm: 10, yMm: 3, widthMm: 70, heightMm: 8, fontSize: 16, bold: true, content: 'Brand Name' } as DesignElement;
    case 'distributor':
      return { ...base, xMm: 10, yMm: 1.5, widthMm: 75, heightMm: 4, fontSize: 4.5, align: 'center', content: 'Distributed by: Example' } as DesignElement;
    case 'volume':
      return { ...base, xMm: 3, yMm: 20, widthMm: 30, heightMm: 4, fontSize: 4.5, color: '#888', content: '500ml' } as DesignElement;
    case 'bt':
      return { ...base, xMm: 50, yMm: 20, widthMm: 42, heightMm: 4, fontSize: 4.8, bold: true, content: 'BT: 26120100001' } as DesignElement;
    case 'logo':
      return { ...base, xMm: 3, yMm: 4, widthMm: 18, heightMm: 18, fontSize: 10, content: '' } as DesignElement;
    case 'custom':
      return { ...base, xMm: 10, yMm: 10, widthMm: 40, heightMm: 6, fontSize: 10, bold: true, content: 'Custom text' } as DesignElement;
    default:
      return { ...base, xMm: 10, yMm: 10, widthMm: 40, heightMm: 6, fontSize: 10, content: '' } as DesignElement;
  }
}

const ELEMENT_LABELS: Record<ElementType, string> = {
  brand: 'Brand Name',
  distributor: 'Distributor',
  volume: 'Volume',
  bt: 'BT Number',
  logo: 'Logo',
  custom: 'Custom Text',
};

interface Props {
  onUseDesign: (design: StickerDesign) => void;
}

export function StickerDesigner({ onUseDesign }: Props) {
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [designName, setDesignName] = useState('My Design');
  const [savedDesigns, setSavedDesigns] = useState<StickerDesign[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [logoPreview, setLogoPreview] = useState<string | undefined>();

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    type: 'move' | 'resize';
    elId: string;
    startMX: number;
    startMY: number;
    startEl: DesignElement;
    handle?: string;
  } | null>(null);

  // scale
  const canvasW = 720;
  const scale = canvasW / STICKER_W;
  const canvasH = STICKER_H * scale;

  const sel = elements.find(e => e.id === selectedId) || null;

  useEffect(() => {
    setSavedDesigns(loadDesigns());
  }, []);

  function addElement(type: ElementType) {
    const el = defaultElement(type, elements);
    if (type === 'logo' && logoDataUrl) {
      setElements(prev => [...prev, el]);
      setSelectedId(el.id);
    } else if (type !== 'logo') {
      setElements(prev => [...prev, el]);
      setSelectedId(el.id);
    }
  }

  function updateElement(id: string, patch: Partial<DesignElement>) {
    setElements(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }

  function removeElement(id: string) {
    setElements(prev => prev.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  // Drag handling
  function handleMouseDown(e: React.MouseEvent, elId: string, handle?: string) {
    e.preventDefault();
    const el = elements.find(x => x.id === elId);
    if (!el) return;
    const startEl = { ...el };
    dragRef.current = {
      type: handle ? 'resize' : 'move',
      elId,
      startMX: e.clientX,
      startMY: e.clientY,
      startEl,
      handle,
    };
    setSelectedId(elId);

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = (ev.clientX - dragRef.current.startMX) / scale;
      const dy = (ev.clientY - dragRef.current.startMY) / scale;
      const s = dragRef.current.startEl;

      if (dragRef.current.type === 'move') {
        updateElement(elId, {
          xMm: Math.max(0, Math.min(STICKER_W - s.widthMm, s.xMm + dx)),
          yMm: Math.max(0, Math.min(STICKER_H - s.heightMm, s.yMm + dy)),
        });
      } else if (dragRef.current.type === 'resize') {
        let { widthMm, heightMm, xMm, yMm } = s;
        const h = dragRef.current.handle!;
        if (h.includes('e')) widthMm = Math.max(5, Math.min(STICKER_W - xMm, s.widthMm + dx));
        if (h.includes('w')) { widthMm = Math.max(5, Math.min(s.widthMm - dx, STICKER_W - (s.xMm + dx))); xMm = Math.max(0, s.xMm + dx); }
        if (h.includes('s')) heightMm = Math.max(5, Math.min(STICKER_H - yMm, s.heightMm + dy));
        if (h.includes('n')) { heightMm = Math.max(5, Math.min(s.heightMm - dy, STICKER_H - (s.yMm + dy))); yMm = Math.max(0, s.yMm + dy); }
        updateElement(elId, { widthMm, heightMm, xMm, yMm });
      }
    };

    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const cleaned = await removeBackground(dataUrl);
      setLogoDataUrl(cleaned);
      setLogoPreview(cleaned);
      saveLogoToLibrary(cleaned, file.name.replace(/\.[^.]+$/, ''));
      // if no logo element exists, add one
      if (!elements.some(el => el.type === 'logo')) {
        addElement('logo');
      }
    };
    reader.readAsDataURL(file);
  }

  // Save / Load
  function saveDesign() {
    if (elements.length === 0) return;
    const all = loadDesigns();
    const existing = all.findIndex(d => d.name === designName);
    const design: StickerDesign = {
      id: existing >= 0 ? all[existing].id : Date.now().toString(),
      name: designName,
      elements,
      createdAt: new Date().toISOString(),
    };
    if (existing >= 0) all[existing] = design;
    else all.push(design);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    setSavedDesigns(all);
  }

  function loadDesign(id: string) {
    const all = loadDesigns();
    const d = all.find(x => x.id === id);
    if (!d) return;
    setElements(d.elements);
    setDesignName(d.name);
    setSelectedId(null);
    setShowLibrary(false);
  }

  function deleteDesign(id: string) {
    const all = loadDesigns().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    setSavedDesigns(all);
  }

  function useDesign() {
    const all = loadDesigns();
    const d = all.find(x => x.name === designName);
    if (d) onUseDesign(d);
  }

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <input
          style={styles.nameInput}
          value={designName}
          onChange={e => setDesignName(e.target.value)}
          placeholder="Design name"
        />
        <motion.button style={styles.btn} onClick={saveDesign} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>Save</motion.button>
        <motion.button style={styles.btn} onClick={() => { setShowLibrary(!showLibrary); if (!showLibrary) setSavedDesigns(loadDesigns()); }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          Library ({savedDesigns.length})
        </motion.button>
        <motion.button style={{ ...styles.btn, background: '#16a34a', color: '#fff' }} onClick={useDesign} disabled={elements.length === 0} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          Use Design
        </motion.button>
      </div>

      <div style={styles.body}>
        {/* Palette */}
        <div style={styles.palette}>
          <h4 style={styles.paletteTitle}>Elements</h4>
          {(['brand', 'distributor', 'volume', 'bt', 'custom'] as ElementType[]).map(type => (
            <motion.button
              key={type}
              style={styles.paletteBtn}
              onClick={() => addElement(type)}
              whileHover={{ scale: 1.04, x: 2 }}
              whileTap={{ scale: 0.96 }}
            >
              + {ELEMENT_LABELS[type]}
            </motion.button>
          ))}
          <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoFile}
              style={{ display: 'none' }}
              id="designer-logo-upload"
            />
            <label htmlFor="designer-logo-upload" style={styles.paletteBtn as any}>+ Logo</label>
            <SavedLogos onSelect={url => { setLogoDataUrl(url); setLogoPreview(url); if (!elements.some(el => el.type === 'logo')) addElement('logo'); }} />
          </div>

          {sel && (
            <div style={styles.properties}>
                <h4 style={{ ...styles.paletteTitle, marginTop: 12 }}>Properties</h4>

                {sel.type !== 'logo' && (
                  <>
                    <label style={styles.propLabel}>Preview text</label>
                    <input style={styles.propInput} value={sel.content || ''} onChange={e => updateElement(sel.id, { content: e.target.value })} placeholder={sel.type === 'brand' ? 'Brand Name' : sel.type === 'distributor' ? 'Distributed by: Name' : sel.type === 'volume' ? '500ml' : sel.type === 'bt' ? 'BT: 00000' : 'Custom text'} />
                  </>
                )}

                <label style={styles.propLabel}>Font</label>
                <select style={styles.propSelect} value={sel.fontFamily} onChange={e => updateElement(sel.id, { fontFamily: e.target.value as FontFamily })}>
                  {['Carbona', 'Space Grotesk', 'Space Mono'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>

                <label style={styles.propLabel}>Font Size</label>
                <input style={styles.propInput} type="number" min={4} max={72} value={sel.fontSize} onChange={e => updateElement(sel.id, { fontSize: parseFloat(e.target.value) || 10 })} />

                <label style={styles.propLabel}>Width</label>
                <input style={styles.propInput} type="number" min={5} max={STICKER_W} value={Math.round(sel.widthMm)} onChange={e => { const w = parseFloat(e.target.value); if (w >= 5) updateElement(sel.id, { widthMm: w }); }} />

                <label style={styles.propLabel}>Height</label>
                <input style={styles.propInput} type="number" min={5} max={STICKER_H} value={Math.round(sel.heightMm)} onChange={e => { const h = parseFloat(e.target.value); if (h >= 5) updateElement(sel.id, { heightMm: h }); }} />

                <label style={styles.propLabel}>Color</label>
                <input style={styles.propInput} type="color" value={sel.color} onChange={e => updateElement(sel.id, { color: e.target.value })} />

                <label style={styles.propLabel}>Align</label>
                <select style={styles.propSelect} value={sel.align} onChange={e => updateElement(sel.id, { align: e.target.value as CanvasTextAlign })}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>

                <label style={{ ...styles.propLabel, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={sel.bold} onChange={e => updateElement(sel.id, { bold: e.target.checked })} />
                  Bold
                </label>

                <motion.button
                  style={{ ...styles.paletteBtn, marginTop: 8, background: '#3a1a1a', color: '#ef4444', border: '1px solid #5a2a2a' }}
                  onClick={() => removeElement(sel.id)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Delete
                </motion.button>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div style={styles.canvasArea}>
          <div
            ref={canvasRef}
            style={{
              ...styles.canvas,
              width: canvasW,
              height: canvasH,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background */}
            <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width={canvasW} height={canvasH}>
              <rect width={canvasW} height={canvasH} fill="#fff" rx={2} />
              <rect width={canvasW} height={canvasH} fill="none" stroke="#d0d0d0" strokeWidth={1} rx={2} />
            </svg>

            {elements.map(el => (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: el.xMm * scale,
                  top: el.yMm * scale,
                  width: el.widthMm * scale,
                  height: el.heightMm * scale,
                  cursor: dragRef.current?.elId === el.id ? 'grabbing' : 'grab',
                  border: selectedId === el.id ? '2px solid #7c5cfc' : 'none',
                  borderRadius: 3,
                  background: selectedId === el.id ? 'rgba(124,92,252,0.08)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start',
                  padding: '0 2px',
                  overflow: 'hidden',
                  userSelect: 'none',
                }}
                onMouseDown={e => handleMouseDown(e, el.id)}
              >
                {el.type === 'logo' ? (
                  logoDataUrl ? (
                    <img src={logoDataUrl} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} draggable={false} />
                  ) : (
                    <span style={{ fontSize: 9, color: '#ccc' }}>Logo</span>
                  )
                ) : (
                  <span
                    style={{
                      fontFamily: el.fontFamily,
                      fontSize: el.fontSize * scale / 2.8,
                      fontWeight: el.bold ? 'bold' : 'normal',
                      color: el.color,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
                      textAlign: el.align,
                      lineHeight: 1.1,
                    }}
                  >
                    {el.content || 'Text'}
                  </span>
                )}

                {/* Resize handles */}
                {selectedId === el.id && (
                  <>
                    {['nw', 'ne', 'sw', 'se'].map(h => (
                      <div
                        key={h}
                        style={{
                          position: 'absolute',
                          width: 12, height: 12,
                          background: '#7c5cfc',
                          border: '2px solid #fff',
                          borderRadius: 2,
                          cursor: h + '-resize',
                          ...(h.includes('n') ? { top: -6 } : { bottom: -6 }),
                          ...(h.includes('w') ? { left: -6 } : { right: -6 }),
                          zIndex: 10,
                          boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                        }}
                        onMouseDown={e => { e.stopPropagation(); handleMouseDown(e, el.id, h); }}
                      />
                    ))}
                  </>
                )}
              </div>
            ))}

            {elements.length === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 13, pointerEvents: 'none' }}>
                Add elements from the left panel
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Library modal */}
      <AnimatePresence>
        {showLibrary && (
          <motion.div style={styles.overlay} onClick={() => setShowLibrary(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div style={styles.modal} onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: '#e4e4ec', fontSize: 14 }}>Saved Designs</h3>
                <motion.button style={{ background: 'none', border: 'none', color: '#999aae', fontSize: 16, cursor: 'pointer' }} onClick={() => setShowLibrary(false)} whileHover={{ rotate: 90 }}>&#x2715;</motion.button>
              </div>
              {savedDesigns.length === 0 && <p style={{ color: '#666', fontSize: 12 }}>No saved designs yet.</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {savedDesigns.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#14141e', borderRadius: 6, padding: '8px 10px', border: '1px solid #2e2e3e' }}>
                    <div>
                      <span style={{ color: '#e4e4ec', fontSize: 13 }}>{d.name}</span>
                      <span style={{ color: '#666', fontSize: 11, marginLeft: 8 }}>{d.elements.length} elements</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <motion.button style={styles.smallBtn} onClick={() => loadDesign(d.id)} whileHover={{ scale: 1.06 }}>Load</motion.button>
                      <motion.button style={{ ...styles.smallBtn, color: '#ef4444' }} onClick={() => deleteDesign(d.id)} whileHover={{ scale: 1.06 }}>Del</motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export type { StickerDesign };
export { loadDesigns };

function loadDesigns(): StickerDesign[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  toolbar: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#191922', borderBottom: '1px solid #2e2e3e', flexShrink: 0 },
  nameInput: { flex: 1, padding: '6px 10px', fontSize: 13, borderRadius: 5, border: '1px solid #2e2e3e', background: '#22222e', color: '#e4e4ec', fontFamily: 'inherit', maxWidth: 240 },
  btn: { padding: '6px 14px', background: '#2a2a38', color: '#e4e4ec', border: '1px solid #2e2e3e', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  palette: { width: 200, minWidth: 200, padding: 12, background: '#191922', borderRight: '1px solid #2e2e3e', overflowY: 'auto' },
  paletteTitle: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999aae', margin: '0 0 6px 0' },
  paletteBtn: { display: 'block', width: '100%', padding: '6px 10px', background: '#22222e', color: '#e4e4ec', border: '1px solid #2e2e3e', borderRadius: 5, fontSize: 12, cursor: 'pointer', textAlign: 'left', marginBottom: 4, fontFamily: 'inherit' },
  properties: { overflow: 'hidden' },
  propLabel: { fontSize: 10, fontWeight: 600, color: '#999aae', marginTop: 4, marginBottom: 1 },
  propInput: { width: '100%', padding: '4px 6px', fontSize: 12, borderRadius: 4, border: '1px solid #2e2e3e', background: '#22222e', color: '#e4e4ec', fontFamily: 'inherit', marginBottom: 2 },
  propSelect: { width: '100%', padding: '4px 6px', fontSize: 12, borderRadius: 4, border: '1px solid #2e2e3e', background: '#22222e', color: '#e4e4ec', fontFamily: 'inherit', marginBottom: 2 },
  canvasArea: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(ellipse at center, #14141e 0%, #0a0a0f 100%)', overflow: 'auto', padding: 20 },
  canvas: { boxShadow: '0 4px 24px rgba(0,0,0,0.5)', borderRadius: 4, flexShrink: 0 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#191922', border: '1px solid #2e2e3e', borderRadius: 10, width: 400, maxWidth: '90vw', maxHeight: '80vh', padding: 20, overflowY: 'auto' },
  smallBtn: { background: '#2a2a38', color: '#e4e4ec', border: '1px solid #2e2e3e', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
};
