import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import type { DroneModel } from '../lib/drones';

interface StickerSlot {
  id: string;
  xMm: number;
  yMm: number;
  serial: string;
  logoUrl?: string;
}

export interface CanvasView {
  scale: number;
  tx: number;
  ty: number;
}

interface RpuLayoutCanvasProps {
  drone: DroneModel;
  stickers: StickerSlot[];
  onMove: (id: string, xMm: number, yMm: number) => void;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  view: CanvasView;
  onViewChange: (view: CanvasView) => void;
  logoUrl?: string;
}

const A4_W = 210;
const A4_H = 297;
const MIN_SCALE = 0.2;
const MAX_SCALE = 4;
const PAD = 48;

function computeBaseScale(containerEl: HTMLElement | null) {
  if (!containerEl) return 1;
  const maxW = containerEl.clientWidth - PAD * 2;
  const maxH = containerEl.clientHeight - PAD * 2;
  if (maxW <= 0 || maxH <= 0) return 1;
  return Math.max(0.1, Math.min(maxW / A4_W, maxH / A4_H));
}

function Marker({ slot, drone, scale, isSelected, onPointerDown, logoUrl }: {
  slot: StickerSlot;
  drone: DroneModel;
  scale: number;
  isSelected: boolean;
  onPointerDown: (e: React.PointerEvent, slot: StickerSlot) => void;
  logoUrl?: string;
}) {
  const src = slot.logoUrl || logoUrl;
  return (
    <div
      onPointerDown={(e) => onPointerDown(e, slot)}
      className="absolute z-10 cursor-move select-none"
      style={{
        left: slot.xMm * scale,
        top: slot.yMm * scale,
        width: drone.stickerWidthMm * scale,
        height: drone.stickerHeightMm * scale,
      }}
    >
      <div
        className={cn(
          'w-full h-full rounded-[10px] bg-white overflow-hidden',
          isSelected ? 'ring-[3px] ring-[#FDB515]' : 'border border-black/10',
        )}
        style={{ boxShadow: '0 3px 8px rgba(0,0,0,0.4), 0 12px 28px rgba(0,0,0,0.28)' }}
      >
        <div className="w-full h-full flex flex-col items-center justify-center px-[4%]">
          {src && (
            <img src={src} alt="logo" className="max-h-[26%] max-w-[60%] mb-[2%] object-contain pointer-events-none" draggable={false} />
          )}
          <span className="text-[8px] font-bold tracking-wider text-[#0284c7] bg-[#0284c7]/10 rounded px-1 py-px leading-none mb-[2%]">
            RPU
          </span>
          <span className="text-[9px] font-semibold text-neutral-900 leading-tight text-center truncate w-full">
            {drone.brand} {drone.name}
          </span>
          <span className="text-[8px] font-mono text-neutral-500 leading-tight text-center truncate w-full">
            {slot.serial}
          </span>
        </div>
        {isSelected && (
          <>
            {(['nw', 'ne', 'sw', 'se'] as const).map(h => (
              <span
                key={h}
                className="absolute w-2.5 h-2.5 bg-[#FDB515] rounded-[3px] border border-white"
                style={{
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  ...(h.includes('n') ? { top: -5 } : { bottom: -5 }),
                  ...(h.includes('w') ? { left: -5 } : { right: -5 }),
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export const RpuLayoutCanvas = ({ drone, stickers, onMove, onSelect, selectedId, view, onViewChange, logoUrl }: RpuLayoutCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const baseScaleRef = useRef(1);
  const [baseScale, setBaseScale] = useState(1);
  const viewRef = useRef(view);
  viewRef.current = view;
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;

  const dragIdRef = useRef<string | null>(null);
  const dragOffRef = useRef({ dx: 0, dy: 0 });
  const rafRef = useRef<number>(0);
  const pendingPosRef = useRef<{ id: string; xMm: number; yMm: number } | null>(null);
  const dimsRef = useRef({ w: drone.stickerWidthMm, h: drone.stickerHeightMm });
  dimsRef.current = { w: drone.stickerWidthMm, h: drone.stickerHeightMm };
  const panRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  useEffect(() => {
    const update = () => {
      const s = computeBaseScale(containerRef.current);
      baseScaleRef.current = s;
      setBaseScale(s);
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const v = viewRef.current;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const ns = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
      const wx = (mx - v.tx) / v.scale;
      const wy = (my - v.ty) / v.scale;
      onViewChangeRef.current({ scale: ns, tx: mx - wx * ns, ty: my - wy * ns });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onContainerPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.button !== 0) return;
    const v = viewRef.current;
    panRef.current = { x: e.clientX, y: e.clientY, tx: v.tx, ty: v.ty };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onContainerPointerMove = useCallback((e: React.PointerEvent) => {
    if (!panRef.current) return;
    onViewChangeRef.current({
      ...viewRef.current,
      tx: panRef.current.tx + (e.clientX - panRef.current.x),
      ty: panRef.current.ty + (e.clientY - panRef.current.y),
    });
  }, []);

  const onContainerPointerUp = useCallback(() => {
    panRef.current = null;
  }, []);

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

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragIdRef.current || !sheetRef.current) return;
    const sheetRect = sheetRef.current.getBoundingClientRect();
    const s = baseScaleRef.current * viewRef.current.scale;
    const { w, h } = dimsRef.current;
    const mx = e.clientX - sheetRect.left;
    const my = e.clientY - sheetRect.top;
    const xMm = Math.max(0, Math.min(A4_W - w, mx / s + dragOffRef.current.dx));
    const yMm = Math.max(0, Math.min(A4_H - h, my / s + dragOffRef.current.dy));
    scheduleMove(dragIdRef.current!, xMm, yMm);
  }, [scheduleMove]);

  const handlePointerUp = useCallback(() => {
    dragIdRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerMove]);

  const onMarkerPointerDown = useCallback((e: React.PointerEvent, slot: StickerSlot) => {
    const sheetEl = sheetRef.current;
    if (!sheetEl) return;
    e.preventDefault();
    e.stopPropagation();
    const sheetRect = sheetEl.getBoundingClientRect();
    const markerEl = e.currentTarget as HTMLElement;
    const markerRect = markerEl.getBoundingClientRect();
    const s = baseScaleRef.current * viewRef.current.scale;
    dragOffRef.current = {
      dx: (e.clientX - sheetRect.left - markerRect.left) / s - slot.xMm,
      dy: (e.clientY - sheetRect.top - markerRect.top) / s - slot.yMm,
    };
    dragIdRef.current = slot.id;
    onSelect?.(slot.id);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [onSelect, handlePointerMove, handlePointerUp]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      style={{
        background: '#424247',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        touchAction: 'none',
        cursor: 'grab',
      }}
      onPointerDown={onContainerPointerDown}
      onPointerMove={onContainerPointerMove}
      onPointerUp={onContainerPointerUp}
      onPointerCancel={onContainerPointerUp}
    >
      <div
        className="absolute"
        style={{
          left: view.tx,
          top: view.ty,
          transform: `scale(${view.scale})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        <div
          ref={sheetRef}
          className="relative rounded-[14px]"
          style={{ width: A4_W * baseScale, height: A4_H * baseScale, background: '#fafafa', boxShadow: '0 6px 16px rgba(0,0,0,0.45), 0 24px 64px rgba(0,0,0,0.5)' }}
        >
          <div className="absolute -top-7 left-0 text-[11px] font-medium text-white/50 tracking-wide pointer-events-none">
            A4 · 210 × 297 mm
          </div>
          {stickers.map(slot => (
            <Marker
              key={slot.id}
              slot={slot}
              drone={drone}
              scale={baseScale}
              isSelected={selectedId === slot.id}
              onPointerDown={onMarkerPointerDown}
              logoUrl={logoUrl}
            />
          ))}
          {stickers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-[13px] font-medium text-neutral-400">Empty sheet</div>
                <div className="text-[11px] text-neutral-400/70 mt-1">Click Grid Layout or drag to add stickers</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
