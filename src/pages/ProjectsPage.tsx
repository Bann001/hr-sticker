import { useState } from 'react';
import { StickerDesigner } from '../components/StickerDesigner';
import type { DesignElement } from '../types';

interface Props {
  onUseDesign: (design: { elements: DesignElement[] }) => void;
}

const projectTemplates = [
  { id: 'blank', name: 'Blank Canvas', desc: 'Start from scratch', icon: 'File' },
  { id: 'product', name: 'Product Label', desc: 'Standard product sticker', icon: 'Tag' },
  { id: 'bottle', name: 'Bottle Label', desc: 'Cylindrical container label', icon: 'Beaker' },
  { id: 'badge', name: 'Round Badge', desc: 'Circular badge design', icon: 'Circle' },
];

export function ProjectsPage({ onUseDesign }: Props) {
  const [view, setView] = useState<'templates' | 'designer'>('templates');
  const [template, setTemplate] = useState('blank');

  const handleSelectTemplate = (id: string) => {
    setTemplate(id);
    setView('designer');
  };

  if (view === 'designer') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 bg-bg-sidebar border-b border-border shrink-0">
          <button
            onClick={() => setView('templates')}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Templates
          </button>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-medium text-text-primary">
            {template === 'blank' ? 'New Design' : projectTemplates.find(t => t.id === template)?.name}
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <StickerDesigner onUseDesign={onUseDesign} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Projects</h1>
        <p className="text-sm text-text-secondary mt-1">Start a new sticker design or continue existing work</p>
      </div>

      {/* Templates */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Start with a template</h2>
        <div className="grid grid-cols-4 gap-4">
          {projectTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTemplate(t.id)}
              className="bg-bg-surface border border-border rounded-2xl p-5 text-left hover:border-accent/30 hover:bg-bg-sidebar transition-all duration-150 group"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                <TemplateIcon name={t.icon} />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">{t.name}</h3>
              <p className="text-xs text-text-muted mt-1">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent projects */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Recent</h2>
        <div className="bg-bg-surface border border-border rounded-2xl p-8 flex items-center justify-center">
          <div className="text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#727272" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="text-sm text-text-muted">No recent projects</p>
            <p className="text-xs text-text-muted mt-1">Your saved designs will appear here</p>
          </div>
        </div>
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