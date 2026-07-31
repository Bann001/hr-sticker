import { useCallback, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import type { DroneModel } from '../lib/drones';

interface StickerSlot {
  id: string;
  xMm: number;
  yMm: number;
  serial: string;
}

interface RpuLayoutCanvasProps {
  drone: DroneModel;
  stickers: StickerSlot[];
  onMove: (id: string, xMm: number, yMm: number) => void;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}

const A4_W = 210;
const A4_H = 297;

export function RpuLayoutCanvas({ drone, stickers, onMove, onSelect, selectedId }: RpuLayoutCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const [dragId, setDragId] = useState<string | null>(null);
  const dragOffset = useRef({ dxPx: 0, dyPx: 0 });
  const dragStartMm = useRef({ x: 0, y: 0 });

  const updateScale = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const maxW = el.clientWidth - 16;
    const maxH = Math.min(el.clientHeight - 16, 520);
    const fromW = Math.min(maxW, 480);
    const fromH = fromW * (A4_H / A4_W);
    if (fromH > maxH) {
      const scaleByH = maxH / fromH;
      scaleRef.current = Math.min(maxW / A4_W, maxH / A4_H);
    } else {
      scaleRef.current = fromW / A4_W;
    }
  }, []);

  const posToPixel = (mm: number) => mm * scaleRef.current;
  const pixelToMm = (px: number) => px / scaleRef.current;

  const onPointerDown = useCallback((e: React.PointerEvent, slot: StickerSlot) => {
    const el = e.currentTarget as HTMLElement;
    const box = el.getBoundingClientRect();
    const mx = e.clientX - box.left;
    const my = e.clientY - box.top;
    dragOffset.current = { dxPx: mx, dyPx: my };
    dragStartMm.current = { x: slot.xMm, y: slot.yMm };
    setDragId(slot.id);
    onSelect?.(slot.id);
    e.preventDefault();
  }, [onSelect]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragId) return;
    const el = containerRef.current;
    if (!el) return;
    const sheetRect = el.querySelector('.a4-sheet')?.getBoundingClientRect();
    if (!sheetRect) return;
    const mx = e.clientX - sheetRect.left - dragOffset.current.dxPx;
    const my = e.clientY - sheetRect.top - dragOffset.current.dyPx;
    let xMm = pixelToMm(mx);
    let yMm = pixelToMm(my);
    xMm = Math.max(0, Math.min(A4_W - drone.stickerWidthMm, xMm));
    yMm = Math.max(0, Math.min(A4_H - drone.stickerHeightMm, yMm));
    onMove(dragId, xMm, yMm);
  }, [dragId, drone, pixelToMm]);

  const onPointerUp = useCallback(() => {
    setDragId(null);
  }, []);

  updateScale();

  const sheetW = A4_W * scaleRef.current;
  const sheetH = A4_H * scaleRef.current;

  return (
    <div className="flex-1 bg-bg-primary rounded-xl border border-border p-4 flex items-center justify-center overflow-hidden"
      ref={containerRef}
      onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
      style={{ minHeight: '300px', touchAction: 'none', position: 'relative' }}
    >
      <div className="a4-sheet relative rounded-sm shadow-lg border border-gray-200" style={{ width: sheetW, height: sheetH, background: '#fafafa' }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <span className="text-[9px] text-gray-400 font-mono tracking-wider">A4 &nbsp; 210×297 mm</span>
        </div>
        {stickers.map(slot => {
          const l = posToPixel(slot.xMm);
          const t = posToPixel(slot.yMm);
          const w = posToPixel(drone.stickerWidthMm);
          const h = posToPixel(drone.stickerHeightMm);
          const isSelected = selectedId === slot.id;
          const isDrag = dragId === slot.id;
          return (
            <div key={slot.id}
              onPointerDown={(e) => onPointerDown(e, slot)}
              className={cn(
                'absolute z-10 cursor-move select-none rounded shadow transition-shadow',
                isDrag ? 'shadow-xl opacity-90' : 'hover:shadow-md',
                isSelected ? 'ring-2 ring-accent ring-offset-1' : '',
              )}
              style={{ left: l, top: t, width: w, height: h }}
            >
              <div className="w-full h-full bg-white rounded flex flex-col items-center justify-center p-1 overflow-hidden border"
                style={{ borderColor: isSelected ? '#0ea5e9' : '#d0d5dd', borderWidth: 1 }}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[7px] font-bold text-sky-600 bg-sky-50 rounded px-1 py-px leading-none">RPU</span>
                </div>
                <span className="text-[9px] font-semibold text-gray-800 leading-tight text-center truncate w-full">{drone.brand} {drone.name}</span>
                <span className="text-[7px] font-mono text-sky-500 leading-tight text-center truncate w-full">{slot.serial}</span>
              </div>
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent rounded-full flex items-center justify-center shadow text-white text-[8px]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
