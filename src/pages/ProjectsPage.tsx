import { useState, useEffect, useMemo } from 'react';
import { loadDesigns, findDesign, deleteDesign as deleteDesignFromSupabase } from '../lib/designs';
import type { StickerDesign } from '../lib/designs';
import type { DesignElement } from '../types';

const projectTemplates = [
  { id: 'blank', name: 'Blank Canvas', desc: 'Start from scratch', icon: 'File' },
  { id: 'product', name: 'Product Label', desc: 'Standard product sticker', icon: 'Tag' },
  { id: 'bottle', name: 'Bottle Label', desc: 'Cylindrical container label', icon: 'Beaker' },
  { id: 'badge', name: 'Round Badge', desc: 'Circular badge design', icon: 'Circle' },
];

const statusFilters = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'review', label: 'In Review' },
  { id: 'incomplete', label: 'Incomplete' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived', label: 'Archived' },
];

const projectTypes = ['All Projects', 'Sticker Batch', 'Label Design', 'Production'];

export function ProjectsPage({ onNavigate, onUseDesign }: {
  onNavigate?: (tab: string, designId?: string) => void;
  onUseDesign?: (design: { elements: DesignElement[] }) => void;
}) {
  const [saved, setSaved] = useState<StickerDesign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeProjectType, setActiveProjectType] = useState('All Projects');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    loadDesigns().then(setSaved);
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDesignFromSupabase(id);
    setSaved(await loadDesigns());
  };

  const handleUse = async (id: string) => {
    const d = await findDesign(id);
    if (d) onUseDesign?.(d);
  };

  const filtered = useMemo(() => {
    let list = saved;
    if (statusFilter !== 'all') {
      list = list.filter(d => {
        if (statusFilter === 'completed') return d.elements.length > 0;
        if (statusFilter === 'incomplete') return d.elements.length === 0;
        return false;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q));
    }
    if (sortBy === 'oldest') return [...list].reverse();
    if (sortBy === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [saved, statusFilter, searchQuery, sortBy]);

  const statusCounts: Record<string, number> = useMemo(() => ({
    all: saved.length,
    pending: 0,
    review: 0,
    incomplete: saved.filter(d => d.elements.length === 0).length,
    completed: saved.filter(d => d.elements.length > 0).length,
    archived: 0,
  }), [saved]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Projects</h1>
        <p className="text-sm text-text-secondary mt-1">Manage all sticker production projects</p>
      </div>

      {/* Toolbar */}
      <header className="h-[72px] min-h-[72px] bg-bg-sidebar border-y border-border flex items-center gap-4 px-6">
        <div className="relative" style={{ width: '280px' }}>
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input type="text" placeholder="Search projects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-all duration-150" />
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {statusFilters.map(f => (
            <button key={f.id} onClick={() => setStatusFilter(f.id)}
              className={`h-8 px-3 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 ${statusFilter === f.id ? 'bg-accent text-selected-text' : 'text-text-secondary hover:text-text-primary bg-transparent hover:bg-bg-surface'}`}>
              {f.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${statusFilter === f.id ? 'bg-selected-text/15' : 'bg-border/50'}`}>{statusCounts[f.id] || 0}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0" />

        <div className="relative flex-shrink-0">
          <select value={activeProjectType} onChange={e => setActiveProjectType(e.target.value)}
            className="h-10 px-3.5 pr-8 text-sm bg-bg-surface border border-border rounded-xl text-text-primary appearance-none cursor-pointer hover:border-accent/30 transition-colors duration-150 focus:outline-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23727272' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px' }}>
            {projectTypes.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="relative flex-shrink-0">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="h-10 px-3.5 pr-8 text-sm bg-bg-surface border border-border rounded-xl text-text-primary appearance-none cursor-pointer hover:border-accent/30 transition-colors duration-150 focus:outline-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23727272' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px' }}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
          </select>
        </div>

        <div className="flex items-center bg-bg-surface border border-border rounded-xl p-0.5 flex-shrink-0">
          <button onClick={() => setViewMode('grid')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${viewMode === 'grid' ? 'bg-accent text-selected-text' : 'text-text-muted hover:text-text-primary'}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button onClick={() => setViewMode('list')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${viewMode === 'list' ? 'bg-accent text-selected-text' : 'text-text-muted hover:text-text-primary'}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>

        <button onClick={() => onNavigate?.('create')}
          className="inline-flex items-center justify-center font-medium transition-all duration-150 ease-out cursor-pointer bg-accent text-selected-text hover:bg-accent-hover shadow-sm h-10 px-4 text-sm rounded-xl gap-1.5 flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Project
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {/* Templates strip */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {projectTemplates.map(t => (
            <button key={t.id} onClick={() => onNavigate?.('create')}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-bg-surface border border-border rounded-xl hover:border-accent/30 hover:bg-bg-sidebar transition-all duration-150 whitespace-nowrap shrink-0 group">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <TemplateIcon name={t.icon} />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-text-primary">{t.name}</div>
                <div className="text-[11px] text-text-muted">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Project list */}
        {filtered.length === 0 ? (
          <div className="bg-bg-surface border border-border rounded-2xl p-8 flex items-center justify-center">
            <div className="text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#727272" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="text-sm text-text-muted">{saved.length === 0 ? 'No saved projects yet' : 'No projects match your filter'}</p>
              <p className="text-xs text-text-muted mt-1">{saved.length === 0 ? 'Click New Project to start designing' : 'Try changing the filter or search query'}</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((d, i) => (
              <ProjectCard key={d.id} design={d} index={i} viewMode="grid" onNavigate={onNavigate} onUse={handleUse} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((d, i) => (
              <ProjectCard key={d.id} design={d} index={i} viewMode="list" onNavigate={onNavigate} onUse={handleUse} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ design, index, viewMode, onNavigate, onUse, onDelete }: {
  design: StickerDesign;
  index: number;
  viewMode: 'grid' | 'list';
  onNavigate?: (tab: string, designId?: string) => void;
  onUse: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);

  if (viewMode === 'list') {
    return (
      <div
        className="group bg-bg-surface border border-border rounded-2xl transition-all duration-150 cursor-pointer hover:border-accent/20"
        style={{ height: '80px' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onNavigate?.('create', design.id)}
      >
        <div className="flex items-center gap-4 px-5 h-full">
          <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-text-primary w-20 shrink-0">PRJ-{String(index + 1).padStart(3, '0')}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-text-primary truncate font-medium">{design.name}</div>
          </div>
          <div className="text-sm text-text-muted shrink-0 w-24">{design.elements.length} elements</div>
          <div className="shrink-0">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-success/10 text-success border border-success/20">Completed</span>
          </div>
          <div className="text-xs text-text-muted shrink-0 w-20 text-right">{new Date(design.created_at).toLocaleDateString()}</div>
          <div className={`flex items-center gap-1 transition-opacity duration-150 ${hover ? 'opacity-100' : 'opacity-0'}`}>
            <button onClick={e => { e.stopPropagation(); onNavigate?.('create', design.id); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-sidebar transition-all" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </button>
            <button onClick={e => { e.stopPropagation(); onUse(design.id); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-sidebar transition-all" title="Print">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(design.id); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/5 transition-all" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </button>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#727272" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="9 18 15 12 9 6" /></svg>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-bg-surface border border-border rounded-2xl p-5 hover:border-accent/20 transition-all duration-150 cursor-pointer" onClick={() => onNavigate?.('create', design.id)}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <span className="text-[11px] text-text-muted">{design.elements.length} elements</span>
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">{design.name}</h3>
      <p className="text-[11px] text-text-muted mb-4">{new Date(design.created_at).toLocaleDateString()}</p>
      <div className="flex gap-2">
        <button onClick={e => { e.stopPropagation(); onNavigate?.('create', design.id); }}
          className="flex-1 h-8 bg-bg-surface text-text-secondary border border-border rounded-lg text-xs hover:bg-border hover:text-text-primary transition-all">Edit</button>
        <button onClick={e => { e.stopPropagation(); onUse(design.id); }}
          className="flex-1 h-8 bg-accent text-selected-text rounded-lg text-xs font-semibold hover:bg-accent-hover transition-all">Print</button>
        <button onClick={e => { e.stopPropagation(); onDelete(design.id); }}
          className="h-8 px-3 bg-bg-surface text-danger border border-border rounded-lg text-xs hover:bg-border transition-all">Delete</button>
      </div>
    </div>
  );
}

function TemplateIcon({ name }: { name: string }) {
  const s = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: '#FFB800', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'File': return <svg {...s}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>;
    case 'Tag': return <svg {...s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>;
    case 'Beaker': return <svg {...s}><path d="M4.5 3h15" /><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" /><path d="M6 14h12" /></svg>;
    case 'Circle': return <svg {...s}><circle cx="12" cy="12" r="10" /></svg>;
    default: return <svg {...s}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>;
  }
}