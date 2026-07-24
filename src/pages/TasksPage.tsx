import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product, LayoutConfig as LayoutConfigType, StickerData, FontConfig as FontConfigType, DesignElement } from '../types';
import { supabase } from '../supabase';
import { loadDesigns, findDesign } from '../lib/designs';
import type { StickerDesign } from '../lib/designs';
import { BatchConfig } from '../components/BatchConfig';
import { Preview } from '../components/Preview';
import { generatePDFFromDesign } from '../utils/pdf';
import { renderDesign } from '../utils/renderDesign';
import { Card, CardContent } from '../components/ui/card';

interface BatchRow {
  id: string;
  batch_code: string;
  start_serial: number;
  end_serial: number;
  quantity: number;
  status: string;
  created_at: string;
  products: { name: string } | null;
}

interface Props {
  product: Product | null;
  layout: LayoutConfigType;
  fonts: FontConfigType;
  stickers: StickerData[];
  logoDataUrl?: string;
  generated: boolean;
  designElements: DesignElement[] | null;
  startInGenerate?: boolean;
  onStartInGenerateConsumed?: () => void;
  onProductChange: (p: Product | null) => void;
  onLayoutChange: (l: LayoutConfigType) => void;
  onFontsChange: (f: FontConfigType) => void;
  onLogoData: (url?: string) => void;
  onGenerate: (data: { stickers: StickerData[]; product: Product; logo?: string }) => void;
  onClearDesign: () => void;
  onUseDesign?: (design: { elements: DesignElement[]; logo_url?: string }) => void;
}

export function TasksPage({
  product, layout, fonts, stickers, logoDataUrl, generated, designElements,
  startInGenerate, onStartInGenerateConsumed,
  onProductChange, onLayoutChange, onFontsChange, onLogoData, onGenerate, onClearDesign, onUseDesign,
}: Props) {
  const [mode, setMode] = useState<'list' | 'generate'>('list');
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [showDesignPicker, setShowDesignPicker] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<StickerDesign[]>([]);
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const fetchBatches = useCallback(async () => {
    const { data } = await supabase
      .from('batches')
      .select('id, batch_code, start_serial, end_serial, quantity, status, created_at, products(name)')
      .order('created_at', { ascending: false });
    if (data) setBatches(data as unknown as BatchRow[]);
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    if (generated) setMode('generate');
  }, [generated]);

  useEffect(() => {
    if (startInGenerate) {
      setMode('generate');
      onStartInGenerateConsumed?.();
    }
  }, [startInGenerate, onStartInGenerateConsumed]);

  useEffect(() => {
    if (designElements && designElements.length > 0 && !currentDesignId) {
      setCurrentDesignId('loaded');
    }
  }, [designElements, currentDesignId]);

  const filteredBatches = useMemo(() => {
    let list = batches;
    if (statusFilter !== 'all') {
      list = list.filter(b => b.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b =>
        b.batch_code.toLowerCase().includes(q) ||
        (b.products?.name || '').toLowerCase().includes(q) ||
        String(b.quantity).includes(q)
      );
    }
    if (sortBy === 'oldest') {
      return [...list].reverse();
    }
    return list;
  }, [batches, statusFilter, searchQuery, sortBy]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: batches.length };
    for (const b of batches) {
      counts[b.status] = (counts[b.status] || 0) + 1;
    }
    return counts;
  }, [batches]);

  const handleNewBatch = () => {
    loadDesigns().then(d => { setSavedDesigns(d); setShowDesignPicker(true); });
  };

  const handleSelectDesign = async (designId: string) => {
    const d = await findDesign(designId);
    if (d) {
      setCurrentDesignId(designId);
      onUseDesign?.(d);
      setShowDesignPicker(false);
    }
  };

  const handleClear = () => {
    onClearDesign();
    setCurrentDesignId(null);
    setMode('list');
  };

  if (mode === 'generate') {
    return (
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-[340px] min-w-[340px] bg-bg-sidebar border-r border-border overflow-y-auto p-5 space-y-5">
          <button
            onClick={() => { setMode('list'); fetchBatches(); }}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back to tasks
          </button>

          {currentDesignId && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-success/10 border border-success/20 rounded-xl text-sm text-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span className="flex-1 text-sm">Printing custom design</span>
              <button onClick={handleClear} className="text-xs font-medium text-text-muted hover:text-text-primary underline transition-colors">
                clear
              </button>
            </div>
          )}

          <Card><CardContent className="p-0">
            <BatchConfig product={product} layout={layout} onGenerate={onGenerate} />
          </CardContent></Card>
        </aside>
        <main className="flex-1 min-w-0 overflow-hidden">
          <Preview
            key={generated ? 'design-preview' : 'empty'}
            stickers={stickers}
            product={product}
            layout={layout}
            fonts={fonts}
            logoDataUrl={logoDataUrl}
            visible={generated}
            designElements={designElements ?? undefined}
            generatePDFOverride={designElements ? generatePDFFromDesign : undefined}
            renderStickerOverride={designElements ? renderDesign : undefined}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-[72px] min-h-[72px] bg-bg-sidebar border-b border-border flex items-center gap-3 px-5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full h-10 pl-10 pr-4 text-sm bg-bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-all duration-150"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5">
          {['all', 'pending', 'in_review', 'incomplete', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`h-8 px-3 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === status ? 'bg-accent text-selected-text' : 'text-text-secondary hover:text-text-primary bg-transparent hover:bg-bg-surface'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                statusFilter === status ? 'bg-selected-text/15' : 'bg-border/50'
              }`}>
                {statusCounts[status] || 0}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="h-10 px-3.5 pr-8 text-sm bg-bg-surface border border-border rounded-xl text-text-primary appearance-none cursor-pointer hover:border-accent/30 transition-colors duration-150 focus:outline-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23727272' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              backgroundSize: '16px',
            }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-bg-surface border border-border rounded-xl p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
              viewMode === 'grid' ? 'bg-accent text-selected-text' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
              viewMode === 'list' ? 'bg-accent text-selected-text' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>

        {/* New Batch button */}
        <button
          onClick={handleNewBatch}
          className="inline-flex items-center justify-center font-medium transition-all duration-150 ease-out cursor-pointer bg-accent text-selected-text hover:bg-accent-hover shadow-sm h-10 px-4 text-sm rounded-xl gap-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Task
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Design picker modal */}
        {showDesignPicker && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowDesignPicker(false)}>
            <div className="bg-bg-sidebar border border-border rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-text-primary">Select a Design</h2>
                <button onClick={() => setShowDesignPicker(false)} className="text-text-muted hover:text-text-primary text-lg">&times;</button>
              </div>
              {savedDesigns.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-text-muted">No saved designs yet. Create one in the Create page first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {savedDesigns.map(d => (
                    <div key={d.id} className="bg-bg-surface border border-border rounded-xl p-4 hover:border-accent/30 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-text-primary truncate">{d.name}</p>
                      <p className="text-xs text-text-muted mt-0.5">{d.elements.length} elements</p>
                      <button
                        onClick={() => handleSelectDesign(d.id)}
                        className="mt-3 w-full h-8 bg-accent text-selected-text rounded-lg text-xs font-semibold hover:bg-accent-hover transition-all"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {currentDesignId && (
                <div className="mt-3 pt-3 border-t border-border">
                  <button
                    onClick={() => { setShowDesignPicker(false); setMode('generate'); }}
                    className="w-full h-10 bg-bg-surface border border-border text-text-primary rounded-xl text-sm font-semibold hover:bg-bg-sidebar transition-all"
                  >
                    Continue with current design
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {generated && stickers.length > 0 && (
          <div className="bg-success/10 border border-success/20 rounded-2xl p-4">
            <p className="text-sm text-success font-medium">
              Latest batch generated: {stickers.length} stickers ({stickers[0]?.bt_number} – {stickers[stickers.length - 1]?.bt_number})
            </p>
          </div>
        )}

        {/* Batch list */}
        <div className="space-y-3">
          {filteredBatches.length === 0 && (
            <div className="bg-bg-surface border border-border rounded-2xl p-8 flex items-center justify-center">
              <div className="text-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#727272" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                <p className="text-sm text-text-muted">{batches.length === 0 ? 'No batches yet' : 'No batches match your filter'}</p>
                <p className="text-xs text-text-muted mt-1">
                  {batches.length === 0 ? 'Click New Batch to generate your first sticker batch' : 'Try changing the filter or search query'}
                </p>
              </div>
            </div>
          )}
          {filteredBatches.map((batch) => (
            <div
              key={batch.id}
              className="bg-bg-surface border border-border rounded-2xl p-5 flex items-center gap-5 hover:border-accent/20 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                batch.status === 'completed' ? 'bg-success/10' :
                batch.status === 'pending' ? 'bg-accent/10' : 'bg-danger/10'
              }`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={
                  batch.status === 'completed' ? '#34D399' :
                  batch.status === 'pending' ? '#FFB800' : '#F44336'
                } strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {batch.status === 'completed' ? <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></> :
                   batch.status === 'pending' ? <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> :
                   <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>}
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-text-primary">BCH-{String(filteredBatches.indexOf(batch) + 1).padStart(3, '0')}</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    batch.status === 'completed' ? 'bg-success/10 text-success border border-success/20' :
                    batch.status === 'pending' ? 'bg-accent/10 text-accent border border-accent/20' :
                    'bg-danger/10 text-danger border border-danger/20'
                  }`}>
                    {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-0.5">{batch.products?.name || 'Custom design'}</p>
                <p className="text-xs text-text-muted mt-0.5">{batch.quantity} stickers · BT: {batch.batch_code}{String(batch.start_serial).padStart(5, '0')}–{batch.batch_code}{String(batch.end_serial).padStart(5, '0')}</p>
              </div>
              <div className="text-xs text-text-muted text-right shrink-0">
                <div>{new Date(batch.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}