import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/auth';

export const navItems: Array<{ id: string; label: string; icon: string; selected?: boolean; version?: string; badge?: string }> = [
  { id: 'home', label: 'Home', icon: 'LayoutDashboard' },
  { id: 'create', label: 'Create', icon: 'PenTool' },
  { id: 'projects', label: 'Projects', icon: 'FolderKanban' },
  { id: 'tickets', label: 'Tickets', icon: 'Ticket', badge: '79' },
  { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', selected: true },
  { id: 'rpu-stickers', label: 'RPU Sticker', icon: 'Drone' },
  { id: 'chat', label: 'Chat', icon: 'MessageSquare' },
  { id: 'chat-buddy', label: 'Chat Buddy', icon: 'Bot', version: '3.0' },
  { id: 'files', label: 'My Files', icon: 'FileText' },
  { id: 'teams', label: 'Teams', icon: 'Users' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
];

export function NavSidebar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const { profile, isAdmin, pageSettings, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = navItems.filter(item => {
    if (isAdmin) return true;
    const setting = pageSettings.find(p => p.page_id === item.id);
    return setting?.visible ?? true;
  });

  const adminItem: { id: string; label: string; icon: string; version?: string; badge?: string } = { id: 'admin', label: 'Admin', icon: 'Shield' };

  const allItems = isAdmin ? [...visibleItems, adminItem] : visibleItems;

  return (
    <aside
      className={cn(
        'bg-bg-sidebar flex flex-col h-full rounded-r-[20px] border-r border-border overflow-hidden transition-[width] duration-200 ease-out',
        collapsed ? 'w-[68px] min-w-[68px]' : 'w-[232px] min-w-[232px]',
      )}
    >
      {/* Logo area */}
      <div className={cn('pt-6 pb-5', collapsed ? 'px-0 flex justify-center' : 'px-5')}>
        <div className={cn('flex items-center', collapsed ? 'flex-col gap-1' : 'gap-3')}>
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-text-primary tracking-tight truncate">Sticker Lab</span>
              <span className="text-[11px] text-text-muted">Workspace</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 py-2 space-y-1 overflow-y-auto', collapsed ? 'px-3' : 'px-3')}>
        {allItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 ease-out relative',
                collapsed ? 'h-10 justify-center px-0' : 'h-9 px-3',
                isActive
                  ? collapsed
                    ? 'bg-accent text-selected-text'
                    : 'bg-accent text-selected-text shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface',
              )}
            >
              <NavIcon name={item.icon} className={cn('w-[18px] h-[18px] shrink-0', collapsed ? '' : '')} />
              {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className={cn(
                  'text-[11px] font-semibold px-2 py-0.5 rounded-full leading-none',
                  isActive ? 'bg-selected-text/15 text-selected-text' : 'bg-accent/15 text-accent',
                )}>
                  {item.badge}
                </span>
              )}
              {!collapsed && item.version && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-success/15 text-success leading-none">
                  v{item.version}
                </span>
              )}
              {collapsed && isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-selected-text rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom area - User info + Logout */}
      <div className={cn('py-3 border-t border-border', collapsed ? 'px-3' : 'px-3')}>
        <div className={cn('flex items-center', collapsed ? 'flex-col gap-2' : 'gap-2 px-2 py-1.5')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/40 to-accent/10 flex items-center justify-center text-xs font-bold text-accent shrink-0">
            {profile?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">{profile?.email || 'User'}</div>
                <div className="text-[11px] text-text-muted">{profile?.role === 'admin' ? 'Admin' : 'User'}</div>
              </div>
              <button
                onClick={signOut}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/5 transition-all"
                title="Sign out"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className={cn(
              'flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-surface rounded-lg transition-all',
              collapsed ? 'w-8 h-8' : 'w-full h-8 gap-2',
            )}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {collapsed
                ? <><polyline points="9 18 15 12 9 6" /></>
                : <><polyline points="15 18 9 12 15 6" /></>}
            </svg>
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavIcon({ name, className }: { name: string; className?: string }) {
  const s = { className, width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' as const, stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'LayoutDashboard':
      return <svg {...s}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case 'FolderKanban':
      return <svg {...s}><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /><line x1="12" y1="10" x2="12" y2="16" /><line x1="8" y1="12" x2="8" y2="16" /><line x1="16" y1="12" x2="16" y2="16" /></svg>;
    case 'Ticket':
      return <svg {...s}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M9 12h6" /></svg>;
    case 'CheckSquare':
      return <svg {...s}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
    case 'MessageSquare':
      return <svg {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case 'Bot':
      return <svg {...s}><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>;
    case 'FileText':
      return <svg {...s}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
    case 'PenTool':
      return <svg {...s}><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" /></svg>;
    case 'Users':
      return <svg {...s}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'BarChart':
      return <svg {...s}><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>;
    case 'Settings':
      return <svg {...s}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
    case 'Shield':
      return <svg {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    case 'Drone':
      return <svg {...s}><circle cx="5" cy="5" r="1.5" /><circle cx="19" cy="5" r="1.5" /><circle cx="5" cy="19" r="1.5" /><circle cx="19" cy="19" r="1.5" /><path d="M6 6l3.5 3.5M18 6l-3.5 3.5M6 18l3.5-3.5M18 18l-3.5-3.5" /><circle cx="12" cy="12" r="2.5" /><path d="M12 9.5V7M12 17v-2.5M9.5 12H7M17 12h-2.5" /></svg>;
    default:
      return <svg {...s}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
  }
}
