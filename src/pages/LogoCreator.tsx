import { useState, useRef, useEffect, useCallback } from 'react';

interface LogoElement {
  id: string;
  type: 'text' | 'shape' | 'image';
  x: number;
  y: number;
  content?: string;
  color: string;
  fontSize?: number;
  fontFamily?: string;
  shape?: 'circle' | 'rect' | 'triangle';
  width: number;
  height: number;
}

let eid = 1;
function uid() { return `le_${eid++}_${Date.now()}`; }

const SHAPES = ['circle', 'rect', 'triangle'] as const;

export function LogoCreator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<LogoElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [color, setColor] = useState('#FFB800');
  const [fontSize, setFontSize] = useState(28);
  const [bgColor, setBgColor] = useState('transparent');
  const [canvasSize, setCanvasSize] = useState(400);

  const sel = elements.find(e => e.id === selectedId) || null;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasSize, canvasSize);
    }

    // Draw grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < canvasSize; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasSize, i);
      ctx.stroke();
    }

    for (const el of elements) {
      ctx.save();
      if (el.type === 'shape') {
        ctx.fillStyle = el.color;
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        if (el.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(cx, cy, el.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (el.shape === 'rect') {
          ctx.fillRect(el.x, el.y, el.width, el.height);
        } else if (el.shape === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(cx, el.y);
          ctx.lineTo(el.x, el.y + el.height);
          ctx.lineTo(el.x + el.width, el.y + el.height);
          ctx.closePath();
          ctx.fill();
        }
      } else if (el.type === 'text') {
        ctx.fillStyle = el.color;
        ctx.font = `${el.fontSize || 28}px ${el.fontFamily || 'Inter'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.content || '', el.x + el.width / 2, el.y + el.height / 2);
      }

      if (el.id === selectedId) {
        ctx.strokeStyle = '#FFB800';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(el.x - 2, el.y - 2, el.width + 4, el.height + 4);
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
  }, [elements, selectedId, canvasSize, bgColor]);

  useEffect(() => { render(); }, [render]);

  const addText = () => {
    if (!textInput.trim()) return;
    const el: LogoElement = {
      id: uid(), type: 'text', x: 80, y: 80,
      content: textInput, color, fontSize, fontFamily: 'Inter',
      width: 240, height: 50,
    };
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
    setTextInput('');
  };

  const addShape = (shape: typeof SHAPES[number]) => {
    const el: LogoElement = {
      id: uid(), type: 'shape', x: 100, y: 100,
      color, shape, width: 80, height: 80,
    };
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
  };

  const updateSelected = (patch: Partial<LogoElement>) => {
    if (!selectedId) return;
    setElements(prev => prev.map(e => e.id === selectedId ? { ...e, ...patch } : e));
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setElements(prev => prev.filter(e => e.id !== selectedId));
    setSelectedId(null);
  };

  const exportLogo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'logo.png';
    a.click();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const found = [...elements].reverse().find(el =>
      mx >= el.x && mx <= el.x + el.width && my >= el.y && my <= el.y + el.height
    );
    setSelectedId(found?.id || null);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left panel - Tools */}
      <aside className="w-[300px] min-w-[300px] bg-bg-sidebar border-r border-border overflow-y-auto p-5 space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Logo Creator</h1>
          <p className="text-xs text-text-muted mt-0.5">Design your brand logo</p>
        </div>

        {/* Add text */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Add Text</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Type text..."
              className="flex-1 h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent/30"
              onKeyDown={e => e.key === 'Enter' && addText()}
            />
            <button
              onClick={addText}
              disabled={!textInput.trim()}
              className="h-10 px-4 bg-accent text-selected-text rounded-xl font-semibold text-sm hover:bg-accent-hover disabled:opacity-40 transition-all shrink-0"
            >
              Add
            </button>
          </div>
        </div>

        {/* Add shapes */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Add Shape</h3>
          <div className="flex gap-2">
            {SHAPES.map(s => (
              <button
                key={s}
                onClick={() => addShape(s)}
                className="flex-1 h-10 bg-bg-surface border border-border rounded-xl text-text-secondary hover:bg-border hover:text-text-primary transition-all capitalize text-sm font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Properties */}
        {sel && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Properties</h3>

            {sel.type === 'text' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">Text</label>
                  <input
                    type="text"
                    value={sel.content || ''}
                    onChange={e => updateSelected({ content: e.target.value })}
                    className="w-full h-9 px-3 text-sm bg-bg-surface border border-border rounded-xl text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">Font Size</label>
                  <input
                    type="number"
                    value={sel.fontSize || 28}
                    onChange={e => updateSelected({ fontSize: parseInt(e.target.value) || 28 })}
                    className="w-full h-9 px-3 text-sm bg-bg-surface border border-border rounded-xl text-text-primary"
                    min={8} max={120}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={sel.color}
                  onChange={e => updateSelected({ color: e.target.value })}
                  className="h-9 w-12 rounded-xl bg-bg-surface border border-border cursor-pointer"
                />
                <span className="text-xs text-text-muted self-center font-mono">{sel.color}</span>
              </div>
            </div>

            <button
              onClick={removeSelected}
              className="w-full h-9 bg-danger/10 text-danger border border-danger/20 rounded-xl text-sm font-medium hover:bg-danger/20 transition-all"
            >
              Delete
            </button>
          </div>
        )}

        {/* Canvas background */}
        <div className="pt-4 border-t border-border space-y-3">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Canvas</h3>
          <div>
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">Background</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={bgColor === 'transparent' ? '#171717' : bgColor}
                onChange={e => setBgColor(e.target.value)}
                className="h-9 w-12 rounded-xl bg-bg-surface border border-border cursor-pointer"
              />
              <button
                onClick={() => setBgColor('transparent')}
                className="h-9 px-3 bg-bg-surface border border-border rounded-xl text-xs text-text-secondary hover:bg-border"
              >
                Transparent
              </button>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">Size: {canvasSize}px</label>
            <input
              type="range"
              min={200}
              max={800}
              step={50}
              value={canvasSize}
              onChange={e => setCanvasSize(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
        </div>

        {/* Export */}
        <button
          onClick={exportLogo}
          disabled={elements.length === 0}
          className="w-full h-11 bg-accent text-selected-text rounded-xl font-semibold text-sm hover:bg-accent-hover disabled:opacity-40 transition-all flex items-center justify-center gap-2 mt-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export PNG
        </button>
      </aside>

      {/* Canvas */}
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-bg-primary to-[#1a1a1a] overflow-auto p-8">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            onClick={handleCanvasClick}
            className="rounded-2xl shadow-[0_4px_32px_rgba(0,0,0,0.5)] cursor-crosshair"
            style={{ background: 'transparent' }}
          />
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="text-xs text-text-muted">
              {elements.length} element{elements.length !== 1 ? 's' : ''}
            </span>
            {sel && (
              <span className="text-xs text-text-muted">
                · {sel.type} selected
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}