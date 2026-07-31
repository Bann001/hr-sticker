import { useCallback, useEffect, useRef, useState } from 'react';
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

function computeScale(containerEl: HTMLElement | null) {
  if (!containerEl) return 1;
  const maxW = containerEl.clientWidth - 16;
  const maxH = Math.min(containerEl.clientHeight - 16, 520);
  const fromW = Math.min(maxW, 480);
  const fromH = fromW * (A4_H / A4_W);
  return fromH > maxH ? Math.min(maxW / A4_W, maxH / A4_H) : fromW / A4_W;
}

function Marker({ slot, drone, scale, isSelected, onPointerDown }: {
  slot: StickerSlot;
  drone: DroneModel;
  scale: number;
  isSelected: boolean;
  onPointerDown: (e: React.PointerEvent, slot: StickerSlot) => void;
}) {
  return (
    <div
      onPointerDown={(e) => onPointerDown(e, slot)}
      className={cn(
        'absolute z-10 cursor-move select-none rounded shadow',
        isSelected ? 'ring-2 ring-accent ring-offset-1' : 'hover:shadow-md',
      )}
      style={{
        left: slot.xMm * scale,
        top: slot.yMm * scale,
        width: drone.stickerWidthMm * scale,
        height: drone.stickerHeightMm * scale,
      }}
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
}

export const RpuLayoutCanvas = ({ drone, stickers, onMove, onSelect, selectedId }: RpuLayoutCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<number>(1);
  const [scale, setScale] = useState(1);
  const dragIdRef = useRef<string | null>(null);
  const dragOffRef = useRef({ dx: 0, dy: 0 });
  const rafRef = useRef<number>(0);
  const pendingPosRef = useRef<{ id: string; xMm: number; yMm: number } | null>(null);

  useEffect(() => {
    setScale(computeScale(containerRef.current));
    scaleRef.current = scale;
  }, []);

  const onMarkerPointerDown = useCallback((e: React.PointerEvent, slot: StickerSlot) => {
    const sheetEl = sheetRef.current;
    if (!sheetEl) return;
    e.preventDefault();
    e.stopPropagation();
    const sheetRect = sheetEl.getBoundingClientRect();
    const markerEl = e.currentTarget as HTMLElement;
    const markerRect = markerEl.getBoundingClientRect();
    const s = scaleRef.current;
    dragOffRef.current = {
      dx: (e.clientX - sheetRect.left - markerRect.left) / s - slot.xMm,
      dy: (e.clientY - sheetRect.top - markerRect.top) / s - slot.yMm,
    };
    dragIdRef.current = slot.id;
    onSelect?.(slot.id);
  }, [onSelect]);

  const tick = useCallback(() => {
    if (pendingPosRef.current && dragIdRef.current) {
      const pos = pendingPosRef.current;
      onMove(pos.id, pos.xMm, pos.yMm);
      pendingPosRef.current = null;
    }
    rafRef.current = 0;
  }, [onMove]);

  const scheduleMove = useCallback((id: string, xMm: number, yMm: number) => {
    pendingPosRef.current = { id, xMm, yMm };
    if (rafRef.current === 0) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragIdRef.current || !sheetRef.current) return;
      const sheetRect = sheetRef.current.getBoundingClientRect();
      const s = scaleRef.current;
      const mx = e.clientX - sheetRect.left;
      const my = e.clientY - sheetRect.top;
      const xMm = Math.max(0, Math.min(A4_W - drone.stickerWidthMm, mx / s + dragOffRef.current.dx));
      const yMm = Math.max(0, Math.min(A4_H - drone.stickerHeightMm, my / s + dragOffRef.current.dy));
      scheduleMove(dragIdRef.current!, xMm, yMm);
    }
    function onUp() {
      dragIdRef.current = null;
    }
    if (dragIdRef.current) {
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    }
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drone, scheduleMove]);

  return (
    <div className="flex-1 bg-bg-primary rounded-xl border border-border p-4 flex items-center justify-center overflow-hidden"
      ref={containerRef}
      onPointerLeave={() => { dragIdRef.current = null; }}
      style={{ minHeight: '300px', touchAction: 'none', position: 'relative' }}
    >
      <div ref={sheetRef} className="a4-sheet relative rounded-sm shadow-lg border border-gray-200"
        style={{ width: drone.stickerWidthMm * scale, height: drone.stickerHeightMm * scale, background: '#fafafa', position: 'relative', maxWidth: '100%' }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <span className="text-[9px] text-gray-400 font-mono tracking-wider">A4 &nbsp; 210×297 mm</span>
        </div>
        {stickers.map(slot => (
          <Marker
            key={slot.id}
            slot={slot}
            drone={drone}
            scale={scale}
            isSelected={selectedId === slot.id}
            onPointerDown={onMarkerPointerDown}
          />
        ))}
      </div>
    </div>
  );
};