export function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure your workspace</p>
      </div>

      {/* General */}
      <section className="bg-bg-surface border border-border rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-text-primary mb-4">General</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              defaultValue="My Workspace"
              className="h-10 px-3.5 text-sm bg-bg-primary border border-border rounded-xl text-text-primary w-full outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1.5">
              Language
            </label>
            <select className="h-10 px-3.5 text-sm bg-bg-primary border border-border rounded-xl text-text-primary w-full outline-none focus:border-accent transition-colors appearance-none">
              <option>English</option>
              <option>French</option>
              <option>Spanish</option>
            </select>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-bg-surface border border-border rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Notifications</h2>
        <div>
          {[
            { label: 'Email notifications', desc: 'Receive updates via email' },
            { label: 'Batch completion', desc: 'Get notified when a batch is generated' },
            { label: 'Weekly report', desc: 'Receive a weekly summary of activity' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
            >
              <div>
                <p className="text-sm text-text-primary">{item.label}</p>
                <p className="text-xs text-text-muted">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <span className="w-9 h-5 bg-bg-primary border border-border rounded-full peer-checked:bg-accent peer-checked:border-accent transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-text-primary after:rounded-full after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Export */}
      <section className="bg-bg-surface border border-border rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Export</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1.5">
              Default Format
            </label>
            <select className="h-10 px-3.5 text-sm bg-bg-primary border border-border rounded-xl text-text-primary w-full outline-none focus:border-accent transition-colors appearance-none">
              <option>PDF</option>
              <option>PNG</option>
              <option>SVG</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1.5">
              DPI
            </label>
            <select className="h-10 px-3.5 text-sm bg-bg-primary border border-border rounded-xl text-text-primary w-full outline-none focus:border-accent transition-colors appearance-none">
              <option>300 DPI</option>
              <option>150 DPI</option>
              <option>72 DPI</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}