import { useState, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { droneLibrary, type DroneModel } from '../lib/drones';
import { saveLogoToLibrary } from '../components/SavedLogos';
import { SavedLogos } from '../components/SavedLogos';
import { RpuLayoutCanvas } from '../components/RpuLayoutCanvas';
import { generateRpuPdf } from '../utils/rpuPdf';
import { saveRun, loadRuns } from '../utils/rpuRuns';
import type { RpuRun } from '../utils/rpuRuns';

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

function deleteAsset(id: string) {
  const next = loadAssets().filter(a => a.id !== id);
  localStorage.setItem(STORAGE, JSON.stringify(next));
}

interface StickerSlot {
  id: string;
  xMm: number;
  yMm: number;
  serial: string;
  logoUrl?: string;
}

export function RpuStickersPage() {
  const [droneId, setDroneId] = useState(droneLibrary[0].id);
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [customW, setCustomW] = useState(100);
  const [customH, setCustomH] = useState(32);
  const [serialBase, setSerialBase] = useState('RPU-P60-0001');
  const [quantity, setQuantity] = useState(15);
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [assets, setAssets] = useState<RpuAsset[]>(loadAssets);

  const [positions, setPositions] = useState<StickerSlot[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const drone = useMemo(() => droneLibrary.find(d => d.id === droneId) ?? droneLibrary[0], [droneId]);

  const stickerW = useCustomSize ? customW : drone.stickerWidthMm;
  const stickerH = useCustomSize ? customH : drone.stickerHeightMm;

  const effectiveDrone = useMemo(() => ({
    ...drone,
    stickerWidthMm: stickerW,
    stickerHeightMm: stickerH,
    name: drone.name + (useCustomSize ? ' (custom)' : ''),
  }), [drone, stickerW, stickerH, useCustomSize]);

  const slots = useMemo<StickerSlot[]>(() => {
    const list: StickerSlot[] = [];
    const base = serialBase.trim();
    const seqMatch = base.match(/^(.*?)(\d+)$/);
    for (let i = 0; i < quantity; i++) {
      let serial = base;
      if (seqMatch && quantity > 1) {
        const prefix = seqMatch[1];
        const num = parseInt(seqMatch[2], 10);
        const width = seqMatch[2].length;
        serial = `${prefix}${String(num + i).padStart(width, '0')}`;
      }
      list.push({ id: `s-${i}`, xMm: 0, yMm: 0, serial, logoUrl: logoDataUrl });
    }
    return list;
  }, [serialBase, quantity, logoDataUrl]);

  const onMove = useCallback((id: string, xMm: number, yMm: number) => {
    setPositions(prev => prev.map(s => s.id === id ? { ...s, xMm, yMm } : s));
  }, []);

  const onSelect = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  }, []);

  const addToSheet = useCallback(() => {
    const pad = 8;
    const gap = 4;
    const availableW = 210 - pad * 2;
    const perRow = Math.max(1, Math.floor(availableW / (stickerW + gap)));
    const next: StickerSlot[] = [];
    let idx = 0;
    while (idx < slots.length) {
      for (let col = 0; col < perRow && idx < slots.length; col++, idx++) {
        const row = Math.floor(idx / perRow);
        const xMm = pad + col * (stickerW + gap);
        const yMm = pad + row * (stickerH + gap);
        if (yMm + stickerH > 297) break;
        next.push({ ...slots[idx], xMm, yMm });
      }
    }
    setPositions(next);
  }, [slots, stickerW, stickerH]);

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

  const handleDownload = useCallback(async () => {
    if (positions.length === 0) return;
    setDownloading(true);
    try {
      await new Promise(r => setTimeout(r, 30));
      const run: RpuRun = {
        id: Date.now().toString(),
        brand: effectiveDrone.brand,
        name: effectiveDrone.name,
        stickerW,
        stickerH,
        quantity: positions.length,
        startedAt: new Date().toISOString(),
        serialBase,
      };
      saveRun(run);
      const blob = generateRpuPdf(effectiveDrone, positions.map(s => ({ serial: s.serial, xMm: s.xMm, yMm: s.yMm, logoUrl: s.logoUrl })));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rpu-stickers-${effectiveDrone.brand}-${effectiveDrone.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
    setDownloading(false);
  }, [effectiveDrone, positions, stickerW, stickerH, serialBase]);

  const hasPositions = positions.some(s => s.xMm > 0 || s.yMm > 0);
  const totalPages = stickerW > 0 && stickerH > 0
    ? Math.ceil(positions.length / (Math.floor((210 - 16) / (stickerW + 4)) * Math.floor((297 - 16) / (stickerH + 4))))
    : 0;

  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-bg-primary">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            RPU <span className="text-accent">Sticker Generator</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">Drag stickers on the A4 sheet to arrange them, then download the PDF.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
          {/* Config panel */}
          <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-160px)]">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1.5">Drone Model</label>
              <select value={droneId} onChange={e => setDroneId(e.target.value)}
                className="h-10 px-3 text-sm bg-bg-primary border border-border rounded-xl text-text-primary w-full outline-none focus:border-accent transition-colors appearance-none">
                {droneLibrary.map(d => (
                  <option key={d.id} value={d.id}>{d.brand} {d.name}</option>
                ))}
              </select>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-text-muted">{drone.dims} · {drone.weight} · Preset {drone.stickerWidthMm}×{drone.stickerHeightMm}mm</p>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={useCustomSize} onChange={e => setUseCustomSize(e.target.checked)} className="sr-only peer" />
                  <span className={cn(
                    'w-9 h-5 bg-bg-primary border border-border rounded-full peer-checked:bg-accent peer-checked:border-accent transition-colors relative after:content-[""] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-text-primary after:rounded-full after:transition-all peer-checked:after:translate-x-4',
                  )} />
                  <span className="text-[10px] text-text-muted ml-1">Custom</span>
                </label>
              </div>
              {useCustomSize && (
                <div className="flex gap-2 mt-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-text-muted block mb-0.5">Width (mm)</label>
                    <input type="number" min={20} max={200} value={customW} onChange={e => setCustomW(Math.max(20, Math.min(200, parseInt(e.target.value) || 20)))}
                      className="h-8 px-2 text-sm bg-bg-primary border border-border rounded-lg text-text-primary w-full outline-none focus:border-accent font-mono" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-text-muted block mb-0.5">Height (mm)</label>
                    <input type="number" min={10} max={200} value={customH} onChange={e => setCustomH(Math.max(10, Math.min(200, parseInt(e.target.value) || 10)))}
                      className="h-8 px-2 text-sm bg-bg-primary border border-border rounded-lg text-text-primary w-full outline-none focus:border-accent font-mono" />
                  </div>
                </div>
              )}
              <p className="text-[11px] text-accent mt-1">Active sticker size: {stickerW}×{stickerH} mm</p>
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1.5">Serial Number</label>
              <input type="text" value={serialBase} onChange={e => setSerialBase(e.target.value)}
                placeholder="RPU-P60-0001"
                className="h-10 px-3 text-sm bg-bg-primary border border-border rounded-xl text-text-primary w-full outline-none focus:border-accent transition-colors font-mono" />
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1.5">Quantity</label>
              <input type="number" min={1} max={200} value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
                className="h-10 px-3 text-sm bg-bg-primary border border-border rounded-xl text-text-primary w-full outline-none focus:border-accent transition-colors" />
            </div>

            {/* Logo / Asset */}
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1.5">Logo / Asset</label>
              <div className="flex gap-2">
                <input type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" ref={fileInputRef} />
                <button onClick={() => fileInputRef.current?.click()}
                  className={cn('flex-1 h-9 px-3 text-xs bg-bg-primary border border-dashed border-border rounded-xl text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors flex items-center justify-center gap-1.5', uploading && 'opacity-60')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload
                </button>
                <SavedLogos onSelect={(url) => { setLogoDataUrl(url); setSelectedLogoId(url); }} />
              </div>
              {assets.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {assets.map(a => (
                    <motion.img key={a.id} src={a.dataUrl} alt={a.name}
                      className={cn('w-8 h-8 rounded-lg object-cover border cursor-pointer', logoDataUrl === a.dataUrl ? 'border-accent ring-2 ring-accent/30' : 'border-border hover:border-accent/40')}
                      onClick={() => { setLogoDataUrl(a.dataUrl); setSelectedLogoId(a.dataUrl); }}
                      whileHover={{ scale: 1.1 }}
                      title={a.name}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Layout actions */}
            <div className="flex gap-2">
              <button onClick={addToSheet}
                className="flex-1 h-9 px-3 text-xs bg-bg-primary border border-border rounded-xl text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors flex items-center justify-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                Grid Layout
              </button>
              <button onClick={() => { setPositions([]); setSelectedId(null); }}
                className="flex-1 h-9 px-3 text-xs bg-bg-primary border border-border rounded-xl text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors flex items-center justify-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Clear
              </button>
            </div>

            <button onClick={handleDownload} disabled={downloading || positions.length === 0}
              className={cn('w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all',
                downloading || positions.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-accent text-selected-text hover:opacity-90')}>
              {downloading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download PDF ({positions.length} sticker{positions.length !== 1 ? 's' : ''})
                </>
              )}
            </button>
          </div>

          {/* Layout canvas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Page Layout</h2>
                <p className="text-xs text-text-muted">Drag sticker markers to arrange them on the A4 sheet</p>
              </div>
              <div className="flex items-center gap-3">
                {totalPages > 0 && (
                  <span className="text-[11px] text-text-muted">{positions.length} stickers · ~{totalPages} page{totalPages > 1 ? 's' : ''}</span>
                )}
                {!hasPositions && positions.length > 0 && (
                  <button onClick={addToSheet} className="text-xs text-accent hover:underline">Add all to sheet</button>
                )}
              </div>
            </div>
            <RpuLayoutCanvas drone={effectiveDrone} stickers={positions} onMove={onMove} onSelect={onSelect} selectedId={selectedId} />
          </div>
        </div>
      </div>
    </div>
  );
}