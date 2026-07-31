import { useCallback, useLayoutEffect, useRef, useState } from 'react';
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

function pixelToMmScaler(containerEl: HTMLElement | null) {
  if (!containerEl) return { scale: 1 };
  const maxW = containerEl.clientWidth - 16;
  const maxH = Math.min(containerEl.clientHeight - 16, 520);
  const fromW = Math.min(maxW, 480);
  const fromH = fromW * (A4_H / A4_W);
  const scale = fromH > maxH ? Math.min(maxW / A4_W, maxH / A4_H) : fromW / A4_W;
  return { scale };
}

export function RpuLayoutCanvas({ drone, stickers, onMove, onSelect, selectedId }: RpuLayoutCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const scaleSetRef = useRef(false);
  const dragIdRef = useRef<string | null>(null);
  const dragOffsetMmRef = useRef({ dx: 0, dy: 0 });

  useLayoutEffect(() => {
    if (scaleSetRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const { scale: s } = pixelToMmScaler(el);
    scaleSetRef.current = true;
    setScale(s);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent, slot: StickerSlot) => {
    const sheetEl = sheetRef.current;
    if (!sheetEl) return;
    const sheetRect = sheetEl.getBoundingClientRect();
    const el = e.currentTarget as HTMLElement;
    const box = el.getBoundingClientRect();
    const mx = e.clientX - box.left;
    const my = e.clientY - box.top;
    dragOffsetMmRef.current = {
      dx: mx / scale - slot.xMm,
      dy: my / scale - slot.yMm,
    };
    dragIdRef.current = slot.id;
    onSelect?.(slot.id);
    e.preventDefault();
    e.stopPropagation();
  }, [onSelect, scale]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const id = dragIdRef.current;
    if (!id || !sheetRef.current) return;
    const sheetRect = sheetRef.current.getBoundingClientRect();
    const mx = e.clientX - sheetRect.left;
    const my = e.clientY - sheetRect.top;
    const xMm = Math.max(0, Math.min(A4_W - drone.stickerWidthMm, mx / scale - dragOffsetMmRef.current.dx));
    const yMm = Math.max(0, Math.min(A4_H - drone.stickerHeightMm, my / scale - dragOffsetMmRef.current.dy));
    onMove(id, xMm, yMm);
  }, [drone, onMove, scale]);

  const onPointerUp = useCallback(() => {
    dragIdRef.current = null;
    dragOffsetMmRef.current = { dx: 0, dy: 0 };
  }, []);

  return (
    <div className="flex-1 bg-bg-primary rounded-xl border border-border p-4 flex items-center justify-center overflow-hidden"
      ref={containerRef}
      onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
      style={{ minHeight: '300px', touchAction: 'none', position: 'relative' }}
    >
      <div ref={sheetRef} className="a4-sheet relative rounded-sm shadow-lg border border-gray-200"
        style={{ width: A4_W * scale, height: A4_H * scale, background: '#fafafa', position: 'relative' }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <span className="text-[9px] text-gray-400 font-mono tracking-wider">A4 &nbsp; 210×297 mm</span>
        </div>
        {stickers.map(slot => {
          const l = slot.xMm * scale;
          const t = slot.yMm * scale;
          const w = drone.stickerWidthMm * scale;
          const h = drone.stickerHeightMm * scale;
          const isSelected = selectedId === slot.id;
          const isDrag = dragIdRef.current === slot.id;
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
                style={{ borderColor: isSelected ? '#0ea5e9' : '#d0d5dd', borderWidth: 1 }}>
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