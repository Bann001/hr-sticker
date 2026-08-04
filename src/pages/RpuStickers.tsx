import { useState, useMemo, useCallback, useRef } from 'react';
import { cn } from '../lib/utils';
import { droneLibrary } from '../lib/drones';
import { saveLogoToLibrary } from '../components/SavedLogos';
import { SavedLogos } from '../components/SavedLogos';
import { RpuLayoutCanvas, type CanvasView } from '../components/RpuLayoutCanvas';
import { generateRpuPdf } from '../utils/rpuPdf';
import { saveRun } from '../utils/rpuRuns';
import type { RpuRun } from '../utils/rpuRuns';
import { saveDesign as saveDesignToSupabase, loadDesigns as loadDesignsFromSupabase } from '../lib/designs';
import type { DesignElement } from '../types';
import { LABEL_SIZES, packSheet, packSheetGrid, breakdown, type PlacedSticker, type LabelSize } from '../utils/rpuLayout';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../components/ui/scroll-reveal';

const STORAGE = 'rpu-assets';

interface RpuAsset {
  id: string;
  name: string;
  dataUrl: string;
}

function loadAssets(): RpuAsset[] {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '[]'); } catch { return []; }
}

function saveAsset(asset: RpuAsset) {
  const all = loadAssets();
  if (all.some(a => a.dataUrl === asset.dataUrl)) return;
  all.push(asset);
  while (all.length > 30) all.shift();
  localStorage.setItem(STORAGE, JSON.stringify(all));
}

const MIN_SCALE = 0.2;
const MAX_SCALE = 4;

function IconBtn({ title, onClick, disabled, children, className }: {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none shrink-0',
        className,
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="text-[11px] font-medium text-white/45 uppercase tracking-wider block mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full h-9 px-3 text-[13px] bg-white/[0.06] border border-white/10 rounded-lg text-white placeholder:text-white/30 outline-none focus:border-[#FDB515]/60 focus:ring-1 focus:ring-[#FDB515]/20 transition-all font-mono';

const selectCls =
  'w-full h-9 px-3 pr-8 text-[13px] bg-white/[0.06] border border-white/10 rounded-lg text-white outline-none focus:border-[#FDB515]/60 transition-colors appearance-none cursor-pointer';

function InspectorCard({ title, icon, open, onToggle, children }: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-white/[0.03] transition-colors cursor-pointer">
        <span className="text-[#FDB515] shrink-0">{icon}</span>
        <span className="flex-1 text-left text-[13px] font-semibold text-white">{title}</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={cn('text-white/40 transition-transform duration-200', open && 'rotate-180')}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="px-3.5 pb-3.5 space-y-3">{children}</div>}
    </div>
  );
}

const SIZE_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: 'auto', label: 'Auto — mixed sizes', hint: 'Large + medium + small + vertical, packed to fill the sheet' },
  ...LABEL_SIZES.map(s => ({ value: s.key, label: `${s.label} mm`, hint: s.tier })),
  { value: 'custom', label: 'Custom size…', hint: 'single size' },
];

export function RpuStickersPage() {
  const [droneId, setDroneId] = useState(droneLibrary[0].id);
  const [layoutMode, setLayoutMode] = useState('auto');
  const [customW, setCustomW] = useState(100);
  const [customH, setCustomH] = useState(32);
  const [serialBase, setSerialBase] = useState('RPU-P60-0001');
  const [quantity, setQuantity] = useState(30);
  const [qrEnabled, setQrEnabled] = useState(true);
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [assets, setAssets] = useState<RpuAsset[]>(loadAssets);
  const [downloading, setDownloading] = useState(false);
  const [designName, setDesignName] = useState('RPU-Sticker-Batch');

  const [pages, setPages] = useState<PlacedSticker[][]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<CanvasView>({ scale: 1, tx: 0, ty: 0 });
  const [inspectorOpen, setInspectorOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 1100);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({ meta: true, assets: false, actions: false });

  const toggleCard = useCallback((key: string) => {
    setOpenCards(o => ({ ...o, [key]: !o[key] }));
  }, []);

  const drone = useMemo(() => droneLibrary.find(d => d.id === droneId) ?? droneLibrary[0], [droneId]);

  const sizesForMode = useMemo<LabelSize[]>(() => {
    if (layoutMode === 'auto') return LABEL_SIZES;
    if (layoutMode === 'custom') {
      return [{ key: 'custom', label: `${customW} × ${customH}`, w: customW, h: customH, tier: 'large' }];
    }
    const found = LABEL_SIZES.find(s => s.key === layoutMode);
    return found ? [found] : LABEL_SIZES;
  }, [layoutMode, customW, customH]);

  const currentStickers = (pages[currentPage] ?? []).map(s => ({
    id: s.id,
    xMm: s.xMm,
    yMm: s.yMm,
    wMm: s.size.w,
    hMm: s.size.h,
    serial: s.serial,
    logoUrl: logoDataUrl,
  }));

  const serialize = useCallback((): string[] => {
    const base = serialBase.trim();
    const seqMatch = base.match(/^(.*?)(\d+)$/);
    const list: string[] = [];
    for (let i = 0; i < quantity; i++) {
      let serial = base;
      if (seqMatch && quantity > 1) {
        const prefix = seqMatch[1];
        const num = parseInt(seqMatch[2], 10);
        const width = seqMatch[2].length;
        serial = `${prefix}${String(num + i).padStart(width, '0')}`;
      }
      list.push(serial);
    }
    return list;
  }, [serialBase, quantity]);

  const regenerate = useCallback(() => {
    const serials = serialize();
    if (sizesForMode.length === 1) {
      setPages(packSheetGrid(quantity, sizesForMode[0], serials));
    } else {
      setPages(packSheet(quantity, sizesForMode, serials));
    }
    setCurrentPage(0);
    setSelectedId(null);
  }, [serialize, quantity, sizesForMode]);

  const onMove = useCallback((id: string, xMm: number, yMm: number) => {
    setPages(prev => prev.map((page, pi) =>
      pi === currentPage ? page.map(s => s.id === id ? { ...s, xMm, yMm } : s) : page,
    ));
  }, [currentPage]);

  const onSelect = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  }, []);

  const handleUploadLogo = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const asset: RpuAsset = { id: Date.now().toString(), name: file.name.replace(/\.[^.]+$/, ''), dataUrl };
      saveAsset(asset);
      setAssets(loadAssets());
      saveLogoToLibrary(dataUrl, file.name.replace(/\.[^.]+$/, ''));
      setLogoDataUrl(dataUrl);
    } catch {}
    setUploading(false);
    e.target.value = '';
  }, []);

  const handleSaveDesign = useCallback(async () => {
    if (pages.length === 0) return;
    setSaving(true);
    try {
      const elements: DesignElement[] = [{
        id: 'rpu-meta',
        type: 'custom',
        xMm: 0, yMm: 0, widthMm: 100, heightMm: 30,
        fontSize: 12, fontFamily: 'Space Grotesk', color: '#0f172a',
        align: 'left', bold: false,
        content: JSON.stringify({
          droneId, projectType: 'rpu', layoutMode, qr: qrEnabled,
          pages: pages.map(page => page.map(s => ({ serial: s.serial, w: s.size.w, h: s.size.h, xMm: s.xMm, yMm: s.yMm }))),
          logo: logoDataUrl || '',
        }),
      }];
      await saveDesignToSupabase(designName, elements, logoDataUrl, 'rpu');
      setSavedDesigns(await loadDesignsFromSupabase());
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {}
    setSaving(false);
  }, [pages, droneId, designName, logoDataUrl, layoutMode, qrEnabled]);

  const handleDownload = useCallback(async () => {
    if (pages.length === 0) return;
    setDownloading(true);
    try {
      await new Promise(r => setTimeout(r, 30));
      const run: RpuRun = {
        id: Date.now().toString(),
        brand: drone.brand,
        name: drone.name,
        stickerW: 0,
        stickerH: 0,
        quantity: pages.reduce((a, p) => a + p.length, 0),
        startedAt: new Date().toISOString(),
        serialBase,
      };
      saveRun(run);
      const pdfPages = pages.map(page => page.map(s => ({
        serial: s.serial,
        xMm: s.xMm,
        yMm: s.yMm,
        wMm: s.size.w,
        hMm: s.size.h,
        logoUrl: logoDataUrl,
      })));
      const blob = await generateRpuPdf(drone, pdfPages, { qr: qrEnabled });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rpu-labels-${drone.brand}-${drone.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
    setDownloading(false);
  }, [drone, pages, serialBase, logoDataUrl, qrEnabled]);

  const totalStickers = pages.reduce((a, p) => a + p.length, 0);
  const bd = useMemo(() => breakdown(pages.flat()), [pages]);

  const zoomIn = () => setView(v => ({ ...v, scale: Math.min(MAX_SCALE, +(v.scale * 1.25).toFixed(2)) }));
  const zoomOut = () => setView(v => ({ ...v, scale: Math.max(MIN_SCALE, +(v.scale / 1.25).toFixed(2)) }));
  const resetView = () => setView({ scale: 1, tx: 0, ty: 0 });

  const goPage = useCallback((dir: number) => {
    setCurrentPage(p => Math.max(0, Math.min(pages.length - 1, p + dir)));
  }, [pages.length]);

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#2F3136] overflow-hidden">
      {/* ─── Top Toolbar ─── */}
      <div className="h-12 shrink-0 flex items-center gap-2 px-3 bg-[#26282C] border-b border-white/[0.06]">
        <IconBtn title={inspectorOpen ? 'Hide inspector' : 'Show inspector'} onClick={() => setInspectorOpen(o => !o)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M15 3v18" />
          </svg>
        </IconBtn>
        <div className="w-px h-5 bg-white/10" />

        <input
          value={designName}
          onChange={e => setDesignName(e.target.value)}
          placeholder="Untitled project"
          className="h-8 w-48 px-2.5 text-[13px] font-medium text-white bg-transparent border border-transparent rounded-lg hover:border-white/10 focus:border-[#FDB515]/50 focus:outline-none transition-colors truncate"
        />
        <span className="text-[11px] text-white/30 hidden lg:block">{drone.brand} {drone.name} · mixed A4 label sheet</span>

        <div className="flex-1" />

        <div className="flex items-center gap-0.5 mr-1">
          <IconBtn title="Undo" disabled>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
          </IconBtn>
          <IconBtn title="Redo" disabled>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
          </IconBtn>
        </div>
        <div className="w-px h-5 bg-white/10" />

        <div className="flex items-center bg-white/[0.05] border border-white/10 rounded-lg h-8">
          <button onClick={zoomOut} className="w-7 h-full flex items-center justify-center text-white/50 hover:text-white rounded-l-lg transition-colors" title="Zoom out">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <span className="text-[11px] font-semibold text-white/80 min-w-[44px] text-center select-none tabular-nums">{Math.round(view.scale * 100)}%</span>
          <button onClick={zoomIn} className="w-7 h-full flex items-center justify-center text-white/50 hover:text-white rounded-r-lg transition-colors" title="Zoom in">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>

        <IconBtn title="Reset view" onClick={resetView}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
        </IconBtn>

        <div className="w-px h-5 bg-white/10" />

        <button
          onClick={handleDownload}
          disabled={downloading || pages.length === 0}
          className="h-8 px-3.5 rounded-lg bg-[#FDB515] text-[#111214] text-xs font-semibold flex items-center gap-1.5 hover:brightness-110 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
        >
          {downloading ? (
            <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          )}
          Export
        </button>
      </div>

      {/* ─── Workspace ─── */}
      <div className="flex-1 min-h-0 flex relative">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-accent/[0.02] rounded-full blur-[120px]" />
        </div>

        {/* Canvas */}
        <div className="flex-1 min-w-0 relative flex">
          <RpuLayoutCanvas
            drone={drone}
            stickers={currentStickers}
            onMove={onMove}
            onSelect={onSelect}
            selectedId={selectedId}
            view={view}
            onViewChange={setView}
            logoUrl={logoDataUrl}
          />

          {/* Status pill */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111214]/85 backdrop-blur border border-white/10 text-[11px] text-white/70 shadow-lg z-10">
            <button
              onClick={() => goPage(-1)}
              disabled={currentPage === 0 || pages.length === 0}
              className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white disabled:opacity-20 transition-colors"
              title="Previous page"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span className="font-semibold text-white">
              {totalStickers} label{totalStickers !== 1 ? 's' : ''}
            </span>
            <span className="text-white/40">·</span>
            <span>{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
            {pages.length > 1 && (
              <>
                <span className="text-white/40">·</span>
                <span className="tabular-nums">p.{currentPage + 1}/{pages.length}</span>
              </>
            )}
            {totalStickers < quantity && totalStickers > 0 && (
              <button onClick={regenerate} className="text-[#FDB515] hover:underline ml-1">Regenerate</button>
            )}
            <button
              onClick={() => goPage(1)}
              disabled={currentPage >= pages.length - 1 || pages.length === 0}
              className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white disabled:opacity-20 transition-colors"
              title="Next page"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>

        {/* Floating inspector */}
        {inspectorOpen && (
          <div className="w-[348px] shrink-0 p-3 pl-0 h-full">
            <aside className="h-full flex flex-col rounded-2xl bg-[#111214] border border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden">
              {/* Inspector header */}
              <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#FDB515]/15 flex items-center justify-center">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FDB515" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  </div>
                  <div>
                    <h2 className="text-[13px] font-semibold text-white leading-tight">Label Sheet Inspector</h2>
                    <p className="text-[10px] text-white/40 leading-tight">Mixed-size A4 layout</p>
                  </div>
                </div>
                <IconBtn title="Close inspector" onClick={() => setInspectorOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </IconBtn>
              </div>

              {/* Cards */}
              <ScrollReveal>
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
                  {/* RPU & SN Metadata */}
                  <InspectorCard
                  title="RPU & Serial Number"
                  open={openCards.meta}
                  onToggle={() => toggleCard('meta')}
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>}
                >
                  <Field label="Drone Model">
                    <select
                      value={droneId}
                      onChange={e => setDroneId(e.target.value)}
                      className={selectCls}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-opacity='0.5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                    >
                      {droneLibrary.map(d => (
                        <option key={d.id} value={d.id} className="bg-[#1A1B1E]">{d.brand} {d.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-white/35 mt-1">{drone.dims} · {drone.weight}</p>
                  </Field>

                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Serial">
                      <input type="text" value={serialBase} onChange={e => setSerialBase(e.target.value)} placeholder="RPU-P60-0001" className={inputCls} />
                    </Field>
                    <Field label="Quantity">
                      <input type="number" min={1} max={500} value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))} className={inputCls} />
                    </Field>
                  </div>

                  <Field label="Label sizes">
                    <select
                      value={layoutMode}
                      onChange={e => setLayoutMode(e.target.value)}
                      className={selectCls}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-opacity='0.5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                    >
                      {SIZE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value} className="bg-[#1A1B1E]">{o.label}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-white/35 mt-1">{SIZE_OPTIONS.find(o => o.value === layoutMode)?.hint}</p>
                  </Field>

                  {layoutMode === 'custom' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Width (mm)">
                        <input type="number" min={10} max={200} value={customW} onChange={e => setCustomW(Math.max(10, Math.min(200, parseInt(e.target.value) || 10)))} className={inputCls} />
                      </Field>
                      <Field label="Height (mm)">
                        <input type="number" min={6} max={200} value={customH} onChange={e => setCustomH(Math.max(6, Math.min(200, parseInt(e.target.value) || 6)))} className={inputCls} />
                      </Field>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-medium text-white/45 uppercase tracking-wider">QR code on labels</span>
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" checked={qrEnabled} onChange={e => setQrEnabled(e.target.checked)} className="sr-only peer" />
                      <span className={cn(
                        'w-8 h-[18px] bg-white/[0.08] border border-white/15 rounded-full peer-checked:bg-[#FDB515] peer-checked:border-[#FDB515] transition-colors relative after:content-[""] after:absolute after:top-[1px] after:left-[1px] after:w-[14px] after:h-[14px] after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-[14px]',
                      )} />
                    </label>
                  </div>
                </InspectorCard>

                {/* Assets */}
                <InspectorCard
                  title="Logo & Assets"
                  open={openCards.assets}
                  onToggle={() => toggleCard('assets')}
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>}
                >
                  <input type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" ref={fileInputRef} />
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'flex-1 h-9 px-3 text-xs rounded-lg border border-dashed border-white/20 text-white/60 hover:text-white hover:border-[#FDB515]/50 hover:bg-[#FDB515]/5 transition-colors flex items-center justify-center gap-1.5',
                        uploading && 'opacity-60',
                      )}
                    >
                      {uploading ? (
                        <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      )}
                      Upload Logo
                    </button>
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                      <SavedLogos onSelect={(url) => { setLogoDataUrl(url); }} />
                    </div>
                  </div>
                  {assets.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {assets.map(a => (
                        <img
                          key={a.id}
                          src={a.dataUrl}
                          alt={a.name}
                          title={a.name}
                          className={cn(
                            'w-8 h-8 rounded-md object-cover border cursor-pointer transition-all',
                            logoDataUrl === a.dataUrl ? 'border-[#FDB515] ring-1 ring-[#FDB515]/50' : 'border-white/10 hover:border-white/40',
                          )}
                          onClick={() => { setLogoDataUrl(a.dataUrl); }}
                        />
                      ))}
                    </div>
                  )}
                  {logoDataUrl && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <img src={logoDataUrl} alt="active logo" className="w-8 h-8 rounded-md object-cover border border-[#FDB515]/60" />
                      <span className="text-[11px] text-white/40 truncate">Logo applied to labels</span>
                    </div>
                  )}
                </InspectorCard>

                {/* Actions */}
                <InspectorCard
                  title="Layout & Export"
                  open={openCards.actions}
                  onToggle={() => toggleCard('actions')}
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>}
                >
                  <button
                    onClick={regenerate}
                    className="w-full h-9 px-3 rounded-lg bg-[#FDB515]/15 border border-[#FDB515]/40 text-[#FDB515] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#FDB515]/25 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                    Generate Layout
                  </button>
                  <button
                    onClick={() => { setPages([]); setCurrentPage(0); setSelectedId(null); }}
                    className="w-full h-9 px-3 rounded-lg bg-white/[0.05] border border-white/10 text-white/60 text-xs font-medium flex items-center justify-center gap-1.5 hover:text-white hover:bg-white/[0.09] transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    Clear Sheet
                  </button>
                  <button
                    onClick={handleSaveDesign}
                    disabled={saving || pages.length === 0}
                    className={cn(
                      'w-full h-9 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                      saving || pages.length === 0
                        ? 'bg-white/[0.03] border-white/10 text-white/25 cursor-not-allowed'
                        : saved
                          ? 'bg-[#22c55e]/15 border-[#22c55e]/40 text-[#4ade80]'
                          : 'bg-white/[0.07] border-white/10 text-white hover:bg-white/[0.12]',
                    )}
                  >
                    {saving ? (
                      <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /></svg>
                    )}
                    {saved ? 'Saved' : 'Save Design'}
                  </button>

                  {bd.length > 0 && (
                    <div className="pt-1 border-t border-white/[0.06]">
                      <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Sheet composition</p>
                      <div className="flex flex-wrap gap-1">
                        {bd.map(b => (
                          <span key={b.size.key} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-white/70">
                            {b.count}× <span className="font-mono text-white/50">{b.size.w}×{b.size.h}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  </InspectorCard>
                </div>
              </ScrollReveal>

              {/* Primary CTA */}
              <div className="p-3 border-t border-white/[0.07] shrink-0">
                <button
                  onClick={handleDownload}
                  disabled={downloading || pages.length === 0}
                  className="w-full h-11 rounded-xl bg-[#FDB515] text-[#111214] text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none shadow-[0_4px_20px_rgba(253,181,21,0.35)]"
                >
                  {downloading ? (
                    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  )}
                  Download PDF ({totalStickers} label{totalStickers !== 1 ? 's' : ''})
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
