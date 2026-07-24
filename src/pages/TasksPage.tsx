import { useState } from 'react';
import type { Product, LayoutConfig as LayoutConfigType, StickerData, FontConfig as FontConfigType, DesignElement } from '../types';
import { ProductSelector } from '../components/ProductSelector';
import { BatchConfig } from '../components/BatchConfig';
import { LayoutConfig } from '../components/LayoutConfig';
import { FontConfig } from '../components/FontConfig';
import { Preview } from '../components/Preview';
import { generatePDF, generatePDFFromDesign } from '../utils/pdf';
import { renderDesign } from '../utils/renderDesign';
import { Card, CardContent } from '../components/ui/card';

interface Props {
  product: Product | null;
  layout: LayoutConfigType;
  fonts: FontConfigType;
  stickers: StickerData[];
  logoDataUrl?: string;
  generated: boolean;
  designElements: DesignElement[] | null;
  isDesignMode: boolean;
  onProductChange: (p: Product | null) => void;
  onLayoutChange: (l: LayoutConfigType) => void;
  onFontsChange: (f: FontConfigType) => void;
  onLogoData: (url?: string) => void;
  onGenerate: (data: { stickers: StickerData[]; product: Product; logo?: string }) => void;
  onClearDesign: () => void;
}

const mockBatches = [
  { id: 'BCH-001', product: 'Premium Honey 250ml', stickers: 120, btRange: '26120100001–26120100120', status: 'completed', date: '2026-07-20' },
  { id: 'BCH-002', product: 'Organic Olive Oil 500ml', stickers: 84, btRange: '26120100121–26120100204', status: 'completed', date: '2026-07-18' },
  { id: 'BCH-003', product: 'Spiced Rum 700ml', stickers: 200, btRange: '26120100205–26120100404', status: 'pending', date: '2026-07-22' },
  { id: 'BCH-004', product: 'Cold Brew Coffee 330ml', stickers: 60, btRange: '26120100405–26120100464', status: 'failed', date: '2026-07-15' },
  { id: 'BCH-005', product: 'Craft Beer IPA 440ml', stickers: 150, btRange: '26120100465–26120100614', status: 'completed', date: '2026-07-10' },
];

export function TasksPage({
  product, layout, fonts, stickers, logoDataUrl, generated, designElements, isDesignMode,
  onProductChange, onLayoutChange, onFontsChange, onLogoData, onGenerate, onClearDesign,
}: Props) {
  const [mode, setMode] = useState<'list' | 'generate'>('list');

  if (mode === 'generate') {
    return (
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-[340px] min-w-[340px] bg-bg-sidebar border-r border-border overflow-y-auto p-5 space-y-5">
          <button
            onClick={() => setMode('list')}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back to tasks
          </button>

          {isDesignMode && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-success/10 border border-success/20 rounded-xl text-sm text-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span className="flex-1 text-sm">Using custom design</span>
              <button onClick={onClearDesign} className="text-xs font-medium text-text-muted hover:text-text-primary underline transition-colors">
                clear
              </button>
            </div>
          )}
          <Card><CardContent className="p-0">
            <ProductSelector product={product} onProductChange={onProductChange} onLogoData={onLogoData} />
          </CardContent></Card>
          <Card><CardContent className="p-0">
            <BatchConfig product={product} layout={layout} onGenerate={onGenerate} disabled={!product} />
          </CardContent></Card>
          <Card><CardContent className="p-0">
            <FontConfig config={fonts} onChange={onFontsChange} />
          </CardContent></Card>
          <Card><CardContent className="p-0">
            <LayoutConfig layout={layout} onChange={onLayoutChange} />
          </CardContent></Card>
        </aside>
        <main className="flex-1 min-w-0 overflow-hidden">
          <Preview
            key={generated && isDesignMode ? 'design-preview' : generated ? 'preview' : 'empty'}
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Tasks</h1>
          <p className="text-sm text-text-secondary mt-1">Manage your sticker generation batches</p>
        </div>
        <button
          onClick={() => setMode('generate')}
          className="h-10 px-5 bg-accent text-selected-text rounded-xl font-semibold text-sm hover:bg-accent-hover transition-all duration-150 flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Batch
        </button>
      </div>

      {generated && stickers.length > 0 && (
        <div className="bg-success/10 border border-success/20 rounded-2xl p-4">
          <p className="text-sm text-success font-medium">
            Latest batch generated: {stickers.length} stickers ({stickers[0]?.bt_number} – {stickers[stickers.length - 1]?.bt_number})
          </p>
        </div>
      )}

      {/* Batch list */}
      <div className="space-y-3">
        {mockBatches.map((batch, i) => (
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
                <span className="text-sm font-semibold text-text-primary">{batch.id}</span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  batch.status === 'completed' ? 'bg-success/10 text-success border border-success/20' :
                  batch.status === 'pending' ? 'bg-accent/10 text-accent border border-accent/20' :
                  'bg-danger/10 text-danger border border-danger/20'
                }`}>
                  {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-text-secondary mt-0.5">{batch.product}</p>
              <p className="text-xs text-text-muted mt-0.5">{batch.stickers} stickers · BT: {batch.btRange}</p>
            </div>
            <div className="text-xs text-text-muted text-right shrink-0">
              <div>{batch.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}