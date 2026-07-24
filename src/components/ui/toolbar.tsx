import { Button } from './button';

const filters = [
  { id: 'all', label: 'All', count: 79 },
  { id: 'pending', label: 'Pending', count: 24 },
  { id: 'review', label: 'In Review', count: 12 },
  { id: 'incomplete', label: 'Incomplete', count: 8 },
  { id: 'completed', label: 'Completed', count: 27 },
];

const projects = ['All Projects', 'Sticker Batch', 'Label Design', 'Production'];

export function TopToolbar({
  activeFilter,
  onFilterChange,
  activeProject,
  onProjectChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onCreateTask,
  searchQuery,
  onSearchChange,
}: {
  activeFilter: string;
  onFilterChange: (f: string) => void;
  activeProject: string;
  onProjectChange: (p: string) => void;
  sortBy: string;
  onSortChange: (s: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (v: 'grid' | 'list') => void;
  onCreateTask: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  return (
    <header className="h-[72px] min-h-[72px] bg-bg-sidebar border-b border-border flex items-center gap-3 px-5">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-10 pl-10 pr-4 text-sm bg-bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-all duration-150"
        />
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={`h-8 px-3 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === f.id
                ? 'bg-accent text-selected-text'
                : 'text-text-secondary hover:text-text-primary bg-transparent hover:bg-bg-surface'
            }`}
          >
            {f.label}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
              activeFilter === f.id ? 'bg-selected-text/15' : 'bg-border/50'
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Project selector */}
        <div className="relative">
          <select
            value={activeProject}
            onChange={(e) => onProjectChange(e.target.value)}
            className="h-10 px-3.5 pr-8 text-sm bg-bg-surface border border-border rounded-xl text-text-primary appearance-none cursor-pointer hover:border-accent/30 transition-colors duration-150 focus:outline-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23727272' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              backgroundSize: '16px',
            }}
          >
            {projects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
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
            <option value="name">Name</option>
          </select>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-bg-surface border border-border rounded-xl p-0.5">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
              viewMode === 'grid' ? 'bg-accent text-selected-text' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
              viewMode === 'list' ? 'bg-accent text-selected-text' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>

        {/* Create Task button */}
        <Button variant="primary" onClick={onCreateTask} className="gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Task
        </Button>
      </div>
    </header>
  );
}