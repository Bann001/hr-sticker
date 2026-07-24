import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DesignElement, ElementType, FontFamily } from '../types';
import { STICKER_W, STICKER_H } from '../types';
import { SavedLogos, saveLogoToLibrary } from './SavedLogos';
import { removeBackground } from '../utils/removeBackground';
import { loadDesigns, saveDesign as saveDesignToSupabase, deleteDesign as deleteDesignFromSupabase, findDesign } from '../lib/designs';
import type { StickerDesign } from '../lib/designs';

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

const ELEMENT_DESCRIPTIONS: Record<ElementType, string> = {
  brand: 'Product or brand name',
  distributor: 'Distributor information',
  volume: 'Volume or quantity',
  bt: 'Batch tracking number',
  logo: 'Company or brand logo',
  custom: 'Custom text element',
};

interface Props {
  onUseDesign: (design: StickerDesign) => void;
  loadDesignId?: string | null;
  onLoadDesignIdConsumed?: () => void;
}

export function StickerDesigner({ onUseDesign, loadDesignId, onLoadDesignIdConsumed }: Props) {
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [designName, setDesignName] = useState('My Design');
  const [savedDesigns, setSavedDesigns] = useState<StickerDesign[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [logoPreview, setLogoPreview] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);

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

  const [zoom, setZoom] = useState(1);
  const [leftOpen, setLeftOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDesigns().then(setSavedDesigns);
  }, []);

  useEffect(() => {
    if (!loadDesignId) return;
    findDesign(loadDesignId).then(d => {
      if (!d) return;
      setElements(d.elements);
      setDesignName(d.name);
      if (d.logo_url) { setLogoDataUrl(d.logo_url); setLogoPreview(d.logo_url); }
      setSelectedId(null);
      setShowLibrary(false);
      onLoadDesignIdConsumed?.();
    });
  }, [loadDesignId, onLoadDesignIdConsumed]);

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
      if (!elements.some(el => el.type === 'logo')) {
        addElement('logo');
      }
    };
    reader.readAsDataURL(file);
  }

  async function saveDesign() {
    if (elements.length === 0) return;
    await saveDesignToSupabase(designName, elements, logoDataUrl);
    setSavedDesigns(await loadDesigns());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function loadDesign(id: string) {
    findDesign(id).then(d => {
      if (!d) return;
      setElements(d.elements);
      setDesignName(d.name);
      if (d.logo_url) { setLogoDataUrl(d.logo_url); setLogoPreview(d.logo_url); }
      setSelectedId(null);
      setShowLibrary(false);
    });
  }

  async function deleteDesign(id: string) {
    await deleteDesignFromSupabase(id);
    setSavedDesigns(await loadDesigns());
  }

  function useDesign() {
    if (elements.length === 0) return;
    saveDesign();
    const design: StickerDesign = {
      id: Date.now().toString(),
      name: designName,
      elements,
      logo_url: logoDataUrl,
      created_at: new Date().toISOString(),
    };
    onUseDesign(design);
  }

  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5];
  const zoomIn = () => setZoom(z => { const i = zoomLevels.indexOf(z); return i < zoomLevels.length - 1 ? zoomLevels[i + 1] : z; });
  const zoomOut = () => setZoom(z => { const i = zoomLevels.indexOf(z); return i > 0 ? zoomLevels[i - 1] : z; });

  return (
    <motion.div
      className="flex flex-col flex-1 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Top Toolbar (64px) */}
      <div className="h-16 min-h-16 bg-bg-sidebar border-b border-border flex items-center gap-3 px-4">
        {/* Left section */}
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-surface transition-all shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="w-px h-6 bg-border" />

        <input
          className="h-9 px-3 text-sm bg-transparent border border-transparent rounded-lg text-text-primary placeholder:text-text-muted/60 hover:border-border focus:border-accent/30 focus:outline-none max-w-[200px] transition-colors"
          value={designName}
          onChange={e => setDesignName(e.target.value)}
          placeholder="Design name"
        />

        <div className="w-px h-6 bg-border" />

        {/* Center - actions */}
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-surface transition-all disabled:opacity-30" disabled title="Undo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-surface transition-all disabled:opacity-30" disabled title="Redo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>

        <div className="flex-1" />

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-bg-surface border border-border rounded-xl h-9">
            <button onClick={zoomOut} className="w-9 h-full flex items-center justify-center text-text-muted hover:text-text-primary rounded-l-xl transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span className="text-xs font-medium text-text-primary min-w-[48px] text-center select-none">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} className="w-9 h-full flex items-center justify-center text-text-muted hover:text-text-primary rounded-r-xl transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setZoom(1)}
            className="h-9 px-3 bg-bg-surface border border-border rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-border transition-all"
          >
            Fit
          </button>

          <button
            onClick={saveDesign}
            className="h-9 px-4 bg-bg-surface border border-border rounded-xl text-xs font-semibold transition-all"
            style={{ borderColor: saved ? '#22c55e' : undefined, color: saved ? '#22c55e' : undefined }}
          >
            {saved ? 'Saved!' : 'Save'}
          </button>

          <button
            onClick={() => { setShowLibrary(!showLibrary); if (!showLibrary) loadDesigns().then(setSavedDesigns); }}
            className="h-9 px-4 bg-bg-surface border border-border rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-border transition-all"
          >
            Library
          </button>

          <button
            onClick={useDesign}
            disabled={elements.length === 0}
            className="h-9 px-5 bg-accent text-selected-text rounded-xl text-xs font-semibold hover:bg-accent-hover transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            Use Design
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        {leftOpen && (
          <div className="w-[280px] min-w-[280px] bg-bg-sidebar border-r border-border flex flex-col overflow-hidden">
            <div className="p-4 pb-2">
              <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Elements</h3>
              <div className="relative mb-3">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  placeholder="Search elements..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-sm bg-bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent/30 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
              {(['brand', 'distributor', 'volume', 'bt', 'custom'] as ElementType[])
                .filter(t => t.includes(searchQuery.toLowerCase()) || ELEMENT_LABELS[t].toLowerCase().includes(searchQuery.toLowerCase()) || ELEMENT_DESCRIPTIONS[t].toLowerCase().includes(searchQuery.toLowerCase()))
                .map(type => {
                const Icon = ELEMENT_ICONS[type];
                return (
                  <motion.button
                    key={type}
                    className="w-full flex items-center gap-3 px-3 py-3 bg-bg-surface border border-border rounded-xl text-left hover:border-accent/30 hover:bg-bg-sidebar transition-all cursor-pointer group"
                    onClick={() => addElement(type)}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                      {Icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary">{ELEMENT_LABELS[type]}</div>
                      <div className="text-xs text-text-muted truncate">{ELEMENT_DESCRIPTIONS[type]}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#727272" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                    </svg>
                  </motion.button>
                );
              })}
              {/* Logo upload */}
              <div className="flex gap-1.5 items-center pt-1">
                <input type="file" accept="image/*" onChange={handleLogoFile} className="hidden" id="designer-logo-upload" />
                <label htmlFor="designer-logo-upload" className="flex-1 flex items-center gap-3 px-3 py-3 bg-bg-surface border border-dashed border-border rounded-xl text-left hover:border-accent/30 hover:bg-bg-sidebar transition-all cursor-pointer group">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">Logo</div>
                    <div className="text-xs text-text-muted truncate">Upload image</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#727272" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                  </svg>
                </label>
                <SavedLogos onSelect={url => { setLogoDataUrl(url); setLogoPreview(url); if (!elements.some(el => el.type === 'logo')) addElement('logo'); }} />
              </div>
            </div>
          </div>
        )}

        {/* Canvas workspace */}
        <div className="flex-1 flex items-center justify-center bg-[#181818] overflow-hidden relative">
          <div
            className="relative"
            style={{
              width: canvasW * zoom,
              height: canvasH * zoom,
            }}
          >
            <div
              ref={canvasRef}
              className="shadow-[0_8px_40px_rgba(0,0,0,0.6)] rounded-xl overflow-hidden"
              style={{
                width: canvasW,
                height: canvasH,
                position: 'relative',
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
            >
              {/* Background */}
              <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width={canvasW} height={canvasH}>
                <defs>
                  <pattern id="checker" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                    <rect width="4" height="4" fill="#f0f0f0" /><rect x="4" y="4" width="4" height="4" fill="#f0f0f0" /><rect x="4" width="4" height="4" fill="#fff" /><rect y="4" width="4" height="4" fill="#fff" />
                  </pattern>
                </defs>
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

          {/* Canvas size badge */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-bg-surface/80 backdrop-blur-sm border border-border rounded-lg text-xs text-text-muted">
            {STICKER_W} × {STICKER_H} mm
          </div>
        </div>

        {/* Right properties panel — always rendered for stable layout */}
          <div className="w-[280px] min-w-[280px] bg-bg-sidebar border-l border-border overflow-y-auto p-4">
            {sel ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Properties</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium capitalize">{sel.type}</span>
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Position</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-text-muted block mb-0.5">X</label>
                      <input className="w-full h-8 px-2.5 text-xs bg-bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/30" type="number" value={Math.round(sel.xMm)} onChange={e => updateElement(sel.id, { xMm: Math.max(0, Math.min(STICKER_W - sel.widthMm, parseFloat(e.target.value) || 0)) })} />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted block mb-0.5">Y</label>
                      <input className="w-full h-8 px-2.5 text-xs bg-bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/30" type="number" value={Math.round(sel.yMm)} onChange={e => updateElement(sel.id, { yMm: Math.max(0, Math.min(STICKER_H - sel.heightMm, parseFloat(e.target.value) || 0)) })} />
                    </div>
                  </div>
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Size</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-text-muted block mb-0.5">W</label>
                      <input className="w-full h-8 px-2.5 text-xs bg-bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/30" type="number" min={5} max={STICKER_W} value={Math.round(sel.widthMm)} onChange={e => { const w = parseFloat(e.target.value); if (w >= 5) updateElement(sel.id, { widthMm: w }); }} />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted block mb-0.5">H</label>
                      <input className="w-full h-8 px-2.5 text-xs bg-bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/30" type="number" min={5} max={STICKER_H} value={Math.round(sel.heightMm)} onChange={e => { const h = parseFloat(e.target.value); if (h >= 5) updateElement(sel.id, { heightMm: h }); }} />
                    </div>
                  </div>
                </div>

                {/* Text content */}
                {sel.type !== 'logo' && (
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Text</h4>
                    <input className="w-full h-8 px-2.5 text-xs bg-bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/30" value={sel.content || ''} onChange={e => updateElement(sel.id, { content: e.target.value })} placeholder={sel.type === 'brand' ? 'Brand Name' : sel.type === 'distributor' ? 'Distributed by: Name' : sel.type === 'volume' ? '500ml' : sel.type === 'bt' ? 'BT: 00000' : 'Custom text'} />
                  </div>
                )}

                {/* Typography */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Typography</h4>
                  <div>
                    <label className="text-[10px] text-text-muted block mb-0.5">Font</label>
                    <select className="w-full h-8 px-2.5 pr-7 text-xs bg-bg-surface border border-border rounded-lg text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-accent/30" value={sel.fontFamily} onChange={e => updateElement(sel.id, { fontFamily: e.target.value as FontFamily })}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23727272' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '12px' }}>
                      {['Carbona', 'Space Grotesk', 'Space Mono'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-text-muted block mb-0.5">Size</label>
                      <input className="w-full h-8 px-2.5 text-xs bg-bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/30" type="number" min={4} max={72} value={sel.fontSize} onChange={e => updateElement(sel.id, { fontSize: parseFloat(e.target.value) || 10 })} />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted block mb-0.5">Color</label>
                      <div className="flex gap-1.5">
                        <input className="w-8 h-8 rounded-lg bg-bg-surface border border-border cursor-pointer" type="color" value={sel.color} onChange={e => updateElement(sel.id, { color: e.target.value })} />
                        <input className="flex-1 h-8 px-2 text-xs bg-bg-surface border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:border-accent/30" type="text" value={sel.color} onChange={e => updateElement(sel.id, { color: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alignment */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Alignment</h4>
                  <div className="flex gap-1 bg-bg-surface border border-border rounded-lg p-0.5">
                    {(['left', 'center', 'right'] as CanvasTextAlign[]).map(a => (
                      <button
                        key={a}
                        onClick={() => updateElement(sel.id, { align: a })}
                        className={`flex-1 h-8 rounded-md text-xs font-medium transition-all ${sel.align === a ? 'bg-accent text-selected-text' : 'text-text-muted hover:text-text-primary'}`}
                      >
                        {a === 'left' ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="17" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="3" y2="18" /></svg> :
                         a === 'center' ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="18" y1="14" x2="6" y2="14" /><line x1="21" y1="18" x2="3" y2="18" /></svg> :
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><line x1="7" y1="10" x2="21" y2="10" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="7" y1="14" x2="21" y2="14" /><line x1="3" y1="18" x2="21" y2="18" /></svg>}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input type="checkbox" id="bold-check" checked={sel.bold} onChange={e => updateElement(sel.id, { bold: e.target.checked })} className="w-4 h-4 rounded accent-accent" />
                    <label htmlFor="bold-check" className="text-xs text-text-secondary font-medium cursor-pointer">Bold</label>
                  </div>
                </div>

                <div className="pt-3 border-t border-border space-y-1.5">
                  <button
                    onClick={() => {
                      const idx = elements.findIndex(e => e.id === sel.id);
                      if (idx > 0) {
                        const arr = [...elements];
                        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                        setElements(arr);
                      }
                    }}
                    className="w-full h-8 px-3 bg-bg-surface border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-border transition-all flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
                    Bring Forward
                  </button>
                  <button
                    onClick={() => {
                      const idx = elements.findIndex(e => e.id === sel.id);
                      if (idx < elements.length - 1) {
                        const arr = [...elements];
                        [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                        setElements(arr);
                      }
                    }}
                    className="w-full h-8 px-3 bg-bg-surface border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-border transition-all flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="5 12 12 5 19 12" /></svg>
                    Send Backward
                  </button>
                </div>

                <div className="pt-3 border-t border-border space-y-1.5">
                  <button
                    onClick={() => {
                      const el = elements.find(e => e.id === sel.id);
                      if (!el) return;
                      const newEl = { ...defaultElement(el.type, elements), id: uid(), xMm: el.xMm + 3, yMm: el.yMm + 3, widthMm: el.widthMm, heightMm: el.heightMm, fontSize: el.fontSize, fontFamily: el.fontFamily, color: el.color, align: el.align, bold: el.bold, content: el.content };
                      setElements(prev => [...prev, newEl]);
                      setSelectedId(newEl.id);
                    }}
                    className="w-full h-8 px-3 bg-bg-surface border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-border transition-all flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    Duplicate
                  </button>
                  <button
                    onClick={() => removeElement(sel.id)}
                    className="w-full h-8 px-3 bg-danger/10 border border-danger/20 rounded-lg text-xs text-danger font-medium hover:bg-danger/20 transition-all flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#727272" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <p className="text-sm text-text-muted">No element selected</p>
                <p className="text-xs text-text-muted/60 mt-1">Click an element on the canvas to edit its properties</p>
              </div>
            )}
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
                      <motion.button className="h-8 px-3 bg-bg-surface text-danger border border-border rounded-lg text-xs hover:bg-border cursor-pointer" onClick={() => deleteDesign(d.id).then(() => loadDesigns().then(setSavedDesigns))} whileHover={{ scale: 1.06 }}>Del</motion.button>
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

const ELEMENT_ICONS: Record<string, React.ReactNode> = {
  brand: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  ),
  distributor: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" />
    </svg>
  ),
  volume: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 3h15" /><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" /><path d="M6 14h12" />
    </svg>
  ),
  bt: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  custom: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
};