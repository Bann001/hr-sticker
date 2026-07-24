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
    if (elements.length === 0) return;
    const design: StickerDesign = {
      id: Date.now().toString(),
      name: designName,
      elements,
      createdAt: new Date().toISOString(),
    };
    saveDesign();
    onUseDesign(design);
  }

  return (
    <motion.div
      className="flex flex-col flex-1 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-bg-sidebar border-b border-border shrink-0">
        <input
          className="flex-1 h-9 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 max-w-[200px]"
          value={designName}
          onChange={e => setDesignName(e.target.value)}
          placeholder="Design name"
        />
        <motion.button className="h-9 px-4 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer bg-accent text-selected-text hover:bg-accent-hover border-none" onClick={saveDesign} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>Save</motion.button>
        <motion.button className="h-9 px-4 bg-bg-surface text-text-secondary border border-border rounded-xl text-xs font-semibold hover:bg-border hover:text-text-primary transition-all duration-150 cursor-pointer" onClick={() => { setShowLibrary(!showLibrary); if (!showLibrary) setSavedDesigns(loadDesigns()); }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          Library ({savedDesigns.length})
        </motion.button>
        <motion.button className="h-9 px-4 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer bg-success text-white hover:opacity-90 border-none disabled:opacity-50 disabled:cursor-not-allowed" onClick={useDesign} disabled={elements.length === 0} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          Use Design
        </motion.button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Palette */}
        <div className="w-[220px] min-w-[220px] bg-bg-sidebar border-r border-border overflow-y-auto p-4">
          <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Elements</h4>
          {(['brand', 'distributor', 'volume', 'bt', 'custom'] as ElementType[]).map(type => (
            <motion.button
              key={type}
              className="w-full text-left px-3 py-2.5 bg-bg-surface text-text-secondary border border-border rounded-xl text-sm hover:bg-border hover:text-text-primary transition-all duration-150 cursor-pointer mb-1.5 font-medium"
              onClick={() => addElement(type)}
              whileHover={{ scale: 1.04, x: 2 }}
              whileTap={{ scale: 0.96 }}
            >
              + {ELEMENT_LABELS[type]}
            </motion.button>
          ))}
          <div className="mt-1.5 flex gap-1.5 items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoFile}
              className="hidden"
              id="designer-logo-upload"
            />
            <label htmlFor="designer-logo-upload" className="w-full text-left px-3 py-2.5 bg-bg-surface text-text-secondary border border-border rounded-xl text-sm hover:bg-border hover:text-text-primary transition-all duration-150 cursor-pointer mb-1.5 font-medium">+ Logo</label>
            <SavedLogos onSelect={url => { setLogoDataUrl(url); setLogoPreview(url); if (!elements.some(el => el.type === 'logo')) addElement('logo'); }} />
          </div>

          {sel && (
            <div className="space-y-3 overflow-hidden">
                <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3 mt-3">Properties</h4>

                {sel.type !== 'logo' && (
                  <>
                    <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Preview text</label>
                    <input className="w-full h-9 px-3 text-sm bg-bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent/30" value={sel.content || ''} onChange={e => updateElement(sel.id, { content: e.target.value })} placeholder={sel.type === 'brand' ? 'Brand Name' : sel.type === 'distributor' ? 'Distributed by: Name' : sel.type === 'volume' ? '500ml' : sel.type === 'bt' ? 'BT: 00000' : 'Custom text'} />
                  </>
                )}

                <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Font</label>
                <select className="w-full h-9 px-3 pr-8 text-sm bg-bg-surface border border-border rounded-xl text-text-primary appearance-none cursor-pointer" value={sel.fontFamily} onChange={e => updateElement(sel.id, { fontFamily: e.target.value as FontFamily })}>
                  {['Carbona', 'Space Grotesk', 'Space Mono'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>

                <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Font Size</label>
                <input className="w-full h-9 px-3 text-sm bg-bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent/30" type="number" min={4} max={72} value={sel.fontSize} onChange={e => updateElement(sel.id, { fontSize: parseFloat(e.target.value) || 10 })} />

                <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Width</label>
                <input className="w-full h-9 px-3 text-sm bg-bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent/30" type="number" min={5} max={STICKER_W} value={Math.round(sel.widthMm)} onChange={e => { const w = parseFloat(e.target.value); if (w >= 5) updateElement(sel.id, { widthMm: w }); }} />

                <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Height</label>
                <input className="w-full h-9 px-3 text-sm bg-bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent/30" type="number" min={5} max={STICKER_H} value={Math.round(sel.heightMm)} onChange={e => { const h = parseFloat(e.target.value); if (h >= 5) updateElement(sel.id, { heightMm: h }); }} />

                <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Color</label>
                <input className="w-full h-9 px-3 text-sm bg-bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent/30" type="color" value={sel.color} onChange={e => updateElement(sel.id, { color: e.target.value })} />

                <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Align</label>
                <select className="w-full h-9 px-3 pr-8 text-sm bg-bg-surface border border-border rounded-xl text-text-primary appearance-none cursor-pointer" value={sel.align} onChange={e => updateElement(sel.id, { align: e.target.value as CanvasTextAlign })}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>

                <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={sel.bold} onChange={e => updateElement(sel.id, { bold: e.target.checked })} />
                  Bold
                </label>

                <motion.button
                  className="w-full text-left px-3 py-2.5 text-sm rounded-xl mb-1.5 font-medium transition-all duration-150 cursor-pointer mt-2 bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20"
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
        <div className="flex-1 flex justify-center items-center bg-gradient-to-br from-bg-primary to-[#1a1a1a] overflow-auto p-6">
          <div
            ref={canvasRef}
            className="shadow-[0_4px_32px_rgba(0,0,0,0.5)] rounded-xl shrink-0"
            style={{
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
                    {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(h => {
                      const isMid = h.length === 1;
                      return (
                        <div
                          key={h}
                          style={{
                            position: 'absolute',
                            width: isMid ? 8 : 12,
                            height: isMid ? 8 : 12,
                            background: '#7c5cfc',
                            border: '2px solid #fff',
                            borderRadius: isMid ? '50%' : 2,
                            cursor: h + '-resize',
                            ...(h.includes('n') ? { top: -6 } : h.includes('s') ? { bottom: -6 } : { top: '50%', marginTop: -6 }),
                            ...(h.includes('w') ? { left: -6 } : h.includes('e') ? { right: -6 } : { left: '50%', marginLeft: -6 }),
                            zIndex: 10,
                            boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                          }}
                          onMouseDown={e => { e.stopPropagation(); handleMouseDown(e, el.id, h); }}
                        />
                      );
                    })}
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
          <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowLibrary(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-bg-surface border border-border rounded-2xl p-6 w-[420px] max-w-[90vw] max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="m-0 text-text-primary text-sm">Saved Designs</h3>
                <motion.button className="bg-transparent border-none text-text-muted text-base cursor-pointer" onClick={() => setShowLibrary(false)} whileHover={{ rotate: 90 }}>&#x2715;</motion.button>
              </div>
              {savedDesigns.length === 0 && <p className="text-text-muted text-xs">No saved designs yet.</p>}
              <div className="flex flex-col gap-1.5">
                {savedDesigns.map(d => (
                  <div key={d.id} className="flex items-center justify-between bg-bg-surface rounded-xl p-2.5 border border-border">
                    <div>
                      <span className="text-text-primary text-sm">{d.name}</span>
                      <span className="text-text-muted text-xs ml-2">{d.elements.length} elements</span>
                    </div>
                    <div className="flex gap-1">
                      <motion.button className="h-8 px-3 bg-bg-surface text-text-secondary border border-border rounded-lg text-xs hover:bg-border hover:text-text-primary cursor-pointer" onClick={() => loadDesign(d.id)} whileHover={{ scale: 1.06 }}>Load</motion.button>
                      <motion.button className="h-8 px-3 bg-bg-surface text-danger border border-border rounded-lg text-xs hover:bg-border cursor-pointer" onClick={() => deleteDesign(d.id)} whileHover={{ scale: 1.06 }}>Del</motion.button>
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
