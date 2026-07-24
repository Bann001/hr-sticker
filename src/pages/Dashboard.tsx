import { cn } from '../lib/utils';

const stats = [
  {
    label: 'Total Stickers Generated',
    value: 0,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    label: 'Active Products',
    value: 0,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    label: 'Batches Created',
    value: 0,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    label: 'Saved Designs',
    value: 0,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    ),
  },
];

const recentActivities = [
  {
    type: 'generate',
    message: 'Generated batch of 50 "Premium Round" stickers',
    time: '2 hours ago',
    color: 'text-accent',
  },
  {
    type: 'design',
    message: 'Saved new design "Summer Collection Logo"',
    time: '4 hours ago',
    color: 'text-success',
  },
  {
    type: 'product',
    message: 'Added new product "Square Label 3x3"',
    time: '1 day ago',
    color: 'text-accent',
  },
  {
    type: 'batch',
    message: 'Completed batch #1024 - 200 stickers printed',
    time: '2 days ago',
    color: 'text-success',
  },
  {
    type: 'draft',
    message: 'Updated draft "Holiday Special v2"',
    time: '3 days ago',
    color: 'text-text-muted',
  },
];

export function DashboardPage() {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-bg-primary">
      <div className="max-w-5xl mx-auto p-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Welcome back to{' '}
            <span className="text-accent">Sticker Lab</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Here's what's happening with your workspace today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-bg-surface border border-border rounded-2xl p-5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -translate-y-8 translate-x-8 transition-transform group-hover:scale-110 duration-300" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-accent mb-1">
                  {stat.value.toLocaleString()}
                </div>
                <div className="text-sm text-text-muted">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Recent Activity
          </h2>
          <div className="bg-bg-surface border border-border rounded-2xl divide-y divide-border">
            {recentActivities.map((activity, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    activity.color === 'text-accent' && 'bg-accent',
                    activity.color === 'text-success' && 'bg-success',
                    activity.color === 'text-text-muted' && 'bg-text-muted',
                  )}
                />
                <p className="flex-1 text-sm text-text-primary">
                  {activity.message}
                </p>
                <span className="text-xs text-text-muted shrink-0">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
