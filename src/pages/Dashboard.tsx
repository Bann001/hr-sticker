import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { supabase } from '../supabase';
import { loadRuns } from '../utils/rpuRuns';

interface DashboardStats {
  designs: number;
  batches: number;
  products: number;
  totalStickers: number;
  rpuRuns: number;
}

interface Activity {
  type: 'design' | 'batch' | 'rpu';
  message: string;
  time: string;
  created_at: string;
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ designs: 0, batches: 0, products: 0, totalStickers: 0, rpuRuns: 0 });
  const [recent, setRecent] = useState<Activity[]>([]);

  useEffect(() => {
    async function load() {
      const [designsRes, batchesRes, productsRes] = await Promise.all([
        supabase.from('designs').select('id', { count: 'exact', head: true }),
        supabase.from('batches').select('id, quantity, created_at', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
      ]);

      const totalStickers = (batchesRes.data || []).reduce((sum, b) => sum + (b.quantity || 0), 0);

      const rpuRuns = loadRuns();

      setStats({
        designs: designsRes.count || 0,
        batches: batchesRes.count || 0,
        products: productsRes.count || 0,
        totalStickers,
        rpuRuns: rpuRuns.length,
      });

      // Recent activity
      const activities: Activity[] = [];

      if (batchesRes.data) {
        for (const b of batchesRes.data.slice(0, 5)) {
          const btEnd = b.created_at || new Date().toISOString();
          activities.push({
            type: 'batch',
            message: `Generated batch of ${b.quantity} stickers`,
            time: timeAgo(btEnd),
            created_at: btEnd,
          });
        }
      }

      const { data: recentDesigns } = await supabase
        .from('designs')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentDesigns) {
        for (const d of recentDesigns) {
          activities.push({
            type: 'design',
            message: `Saved design "${d.name}"`,
            time: timeAgo(d.created_at),
            created_at: d.created_at,
          });
        }
      }

      for (const r of rpuRuns.slice(0, 5)) {
        activities.push({
          type: 'rpu',
          message: `Printed ${r.quantity}× ${r.brand} ${r.name} stickers`,
          time: timeAgo(r.startedAt),
          created_at: r.startedAt,
        });
      }

      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecent(activities.slice(0, 10));
    }
    load();
  }, []);

  const statCards = [
    {
      label: 'Total Stickers Generated',
      value: stats.totalStickers,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
    },
    {
      label: 'Active Products',
      value: stats.products,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      label: 'Batches Created',
      value: stats.batches,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      label: 'RPU Runs',
      value: stats.rpuRuns,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-bg-primary">
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Welcome back to{' '}
            <span className="text-accent">Sticker Lab</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Here's what's happening with your workspace today.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-bg-surface border border-border rounded-2xl p-5 relative overflow-hidden group">
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

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h2>
          <div className="bg-bg-surface border border-border rounded-2xl divide-y divide-border">
            {recent.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-text-muted">No activity yet</div>
            ) : (
              recent.map((activity, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    activity.type === 'batch' ? 'bg-accent' :
                    activity.type === 'rpu' ? 'bg-sky-500' : 'bg-success',
                  )} />
                  <p className="flex-1 text-sm text-text-primary">{activity.message}</p>
                  <span className="text-xs text-text-muted shrink-0">{activity.time}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}