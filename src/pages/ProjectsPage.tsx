import { useState, useEffect } from 'react';
import { loadDesigns, deleteDesign as deleteDesignFromSupabase } from '../lib/designs';
import type { StickerDesign } from '../lib/designs';

const projectTemplates = [
  { id: 'blank', name: 'Blank Canvas', desc: 'Start from scratch', icon: 'File' },
  { id: 'product', name: 'Product Label', desc: 'Standard product sticker', icon: 'Tag' },
  { id: 'bottle', name: 'Bottle Label', desc: 'Cylindrical container label', icon: 'Beaker' },
  { id: 'badge', name: 'Round Badge', desc: 'Circular badge design', icon: 'Circle' },
];

export function ProjectsPage({ onNavigate }: { onNavigate?: (tab: string, designId?: string) => void }) {
  const [saved, setSaved] = useState<StickerDesign[]>([]);

  useEffect(() => {
    loadDesigns().then(setSaved);
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDesignFromSupabase(id);
    setSaved(await loadDesigns());
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Projects</h1>
        <p className="text-sm text-text-secondary mt-1">Browse templates and manage your sticker projects</p>
      </div>

      {/* Templates */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Templates</h2>
        <div className="grid grid-cols-4 gap-4">
          {projectTemplates.map((t) => (
            <div
              key={t.id}
              className="bg-bg-surface border border-border rounded-2xl p-5 hover:border-accent/30 hover:bg-bg-sidebar transition-all duration-150 group cursor-default"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                <TemplateIcon name={t.icon} />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">{t.name}</h3>
              <p className="text-xs text-text-muted mt-1">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Saved projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary">Saved Projects</h2>
          <span className="text-xs text-text-muted">Click <span className="text-accent font-medium">Create</span> in the sidebar to start a new design</span>
        </div>

        {saved.length === 0 ? (
          <div className="bg-bg-surface border border-border rounded-2xl p-8 flex items-center justify-center">
            <div className="text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#727272" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="text-sm text-text-muted">No saved projects yet</p>
              <p className="text-xs text-text-muted mt-1">Your saved designs will appear here</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {saved.map(d => (
              <div key={d.id} className="bg-bg-surface border border-border rounded-2xl p-5 hover:border-accent/30 hover:bg-bg-sidebar transition-all duration-150 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <span className="text-[11px] text-text-muted">{d.elements.length} elements</span>
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">{d.name}</h3>
                <p className="text-[11px] text-text-muted mb-4">{new Date(d.created_at).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigate?.('create', d.id)}
                    className="flex-1 h-8 bg-accent text-selected-text rounded-lg text-xs font-semibold hover:bg-accent-hover transition-all"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="h-8 px-3 bg-bg-surface text-danger border border-border rounded-lg text-xs hover:bg-border transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateIcon({ name }: { name: string }) {
  const s = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: '#FFB800', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'File':
      return <svg {...s}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>;
    case 'Tag':
      return <svg {...s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>;
    case 'Beaker':
      return <svg {...s}><path d="M4.5 3h15" /><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" /><path d="M6 14h12" /></svg>;
    case 'Circle':
      return <svg {...s}><circle cx="12" cy="12" r="10" /></svg>;
    default:
      return <svg {...s}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>;
  }
}