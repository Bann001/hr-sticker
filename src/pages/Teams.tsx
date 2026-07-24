const members = [
  { name: 'Alice Johnson', initials: 'AJ', role: 'Admin' as const, online: true },
  { name: 'Bob Smith', initials: 'BS', role: 'Editor' as const, online: true },
  { name: 'Carol Davis', initials: 'CD', role: 'Viewer' as const, online: false },
  { name: 'David Lee', initials: 'DL', role: 'Editor' as const, online: true },
  { name: 'Eve Martin', initials: 'EM', role: 'Admin' as const, online: false },
  { name: 'Frank White', initials: 'FW', role: 'Viewer' as const, online: true },
  { name: 'Grace Kim', initials: 'GK', role: 'Editor' as const, online: false },
  { name: 'Henry Brown', initials: 'HB', role: 'Viewer' as const, online: true },
];

const roleBadgeClass = {
  Admin: 'text-accent bg-accent/10',
  Editor: 'text-success bg-success/10',
  Viewer: 'text-text-muted bg-text-muted/10',
};

export function TeamsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Teams</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your team members</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {members.map((m) => (
          <div
            key={m.name}
            className="bg-bg-surface border border-border rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-full bg-accent/15 text-accent text-sm font-semibold flex items-center justify-center shrink-0">
              {m.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">{m.name}</p>
              <span
                className={`inline-block mt-1 text-[11px] font-semibold leading-none px-2 py-1 rounded-full ${roleBadgeClass[m.role]}`}
              >
                {m.role}
              </span>
            </div>
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${m.online ? 'bg-success' : 'bg-text-muted'}`}
              title={m.online ? 'online' : 'offline'}
            />
          </div>
        ))}
      </div>
    </div>
  );
}