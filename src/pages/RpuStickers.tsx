import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { droneLibrary, type DroneModel } from '../lib/drones';
import { renderRpuSticker } from '../utils/renderRpuSticker';
import { generateRpuPdf } from '../utils/rpuPdf';

const PREVIEW_SCALE = 2;

export function RpuStickersPage() {
  const [droneId, setDroneId] = useState(droneLibrary[0].id);
  const [serial, setSerial] = useState('RPU-P60-0001');
  const [quantity, setQuantity] = useState(10);
  const [downloading, setDownloading] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const drone = useMemo(
    () => droneLibrary.find(d => d.id === droneId) ?? droneLibrary[0],
    [droneId],
  );

  useEffect(() => {
    if (droneId !== 'xag-p60') {
      setSerial(prev => {
        const match = prev.match(/^RPU-[A-Z0-9]+-(\d{4})$/);
        if (match) {
          const code = droneId.split('-').map(p => p.charAt(0)).join('').toUpperCase();
          return `RPU-${code}-${match[1]}`;
        }
        return prev;
      });
    }
  }, [droneId]);

  const stickerData = useMemo(() => {
    const list: Array<{ serial: string }> = [];
    const base = serial.trim();
    const seqMatch = base.match(/^(.*?)(\d+)$/);
    for (let i = 0; i < quantity; i++) {
      let s = base;
      if (seqMatch && quantity > 1) {
        const prefix = seqMatch[1];
        const num = parseInt(seqMatch[2], 10);
        const width = seqMatch[2].length;
        s = `${prefix}${String(num + i).padStart(width, '0')}`;
      }
      list.push({ serial: s });
    }
    return list;
  }, [serial, quantity]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const dpi = 144;
    canvas.width = Math.ceil(drone.stickerWidthMm * dpi / 25.4);
    canvas.height = Math.ceil(drone.stickerHeightMm * dpi / 25.4);
    const ctx = canvas.getContext('2d')!;
    renderRpuSticker(ctx, drone.stickerWidthMm, drone.stickerHeightMm, dpi, drone, stickerData[0].serial);
  }, [drone, stickerData]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await new Promise(r => setTimeout(r, 50));
      const blob = generateRpuPdf(drone, stickerData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rpu-stickers-${drone.brand}-${drone.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('RPU PDF generation failed:', err);
    }
    setDownloading(false);
  }, [drone, stickerData]);

  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-bg-primary">
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            RPU <span className="text-accent">Sticker Generator</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Generate identification stickers for your drones. Each drone model uses its own sticker size.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Config panel */}
          <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-5">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1.5">
                Drone Model
              </label>
              <select
                value={droneId}
                onChange={e => setDroneId(e.target.value)}
                className="h-11 px-3.5 text-sm bg-bg-primary border border-border rounded-xl text-text-primary w-full outline-none focus:border-accent transition-colors appearance-none"
              >
                {droneLibrary.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.brand} {d.name} — {d.stickerWidthMm}×{d.stickerHeightMm} mm sticker
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-2">
                {drone.dims} · {drone.weight} · sticker {drone.stickerWidthMm}×{drone.stickerHeightMm} mm
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1.5">
                Serial Number
              </label>
              <input
                type="text"
                value={serial}
                onChange={e => setSerial(e.target.value)}
                placeholder="RPU-P60-0001"
                className="h-11 px-3.5 text-sm bg-bg-primary border border-border rounded-xl text-text-primary w-full outline-none focus:border-accent transition-colors font-mono"
              />
              <p className="text-xs text-text-muted mt-2">
                Sequential serials auto-increment from the trailing number when quantity &gt; 1.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                className="h-11 px-3.5 text-sm bg-bg-primary border border-border rounded-xl text-text-primary w-full outline-none focus:border-accent transition-colors"
              />
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading || stickerData.length === 0}
              className={cn(
                'w-full h-12 rounded-xl bg-accent text-selected-text text-sm font-semibold flex items-center justify-center gap-2 transition-all',
                downloading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90',
              )}
            >
              {downloading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF ({stickerData.length} stickers)
                </>
              )}
            </button>
          </div>

          {/* Preview panel */}
          <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-1">Live Preview</h2>
              <p className="text-xs text-text-muted">
                First sticker of {stickerData.length} · actual sticker size {drone.stickerWidthMm}×{drone.stickerHeightMm} mm
              </p>
            </div>

            <div className="bg-bg-primary rounded-xl p-6 flex items-center justify-center overflow-x-auto">
              <canvas
                ref={previewCanvasRef}
                style={{
                  width: drone.stickerWidthMm * PREVIEW_SCALE,
                  height: drone.stickerHeightMm * PREVIEW_SCALE,
                  maxWidth: '100%',
                  imageRendering: 'auto',
                }}
                className="rounded shadow-sm"
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">Serial list</h3>
              <div className="bg-bg-primary rounded-xl p-3 max-h-40 overflow-y-auto font-mono text-xs text-text-secondary">
                {stickerData.slice(0, 50).map((s, i) => (
                  <div key={i} className="py-0.5">
                    {i + 1}. {s.serial}
                  </div>
                ))}
                {stickerData.length > 50 && (
                  <div className="py-0.5 text-text-muted">… and {stickerData.length - 50} more</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
