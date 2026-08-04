import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { loadRuns } from '../utils/rpuRuns';
import { breakdown, type LabelSize } from '../utils/rpuLayout';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../components/ui/scroll-reveal';

interface BatchRow {
  id: string;
  batch_code: string;
  start_serial: number;
  end_serial: number;
  quantity: number;
  status: string;
  created_at: string;
  products: { name: string } | null;
}

interface AnalyticsStats {
  totalStickers: number;
  totalBatches: number;
  totalProducts: number;
  totalDesigns: number;
  totalRpuRuns: number;
  totalRpuStickers: number;
  thisMonthStickers: number;
  thisMonthBatches: number;
  avgPerBatch: number;
}

interface MonthData {
  month: string;
  stickers: number;
  batches: number;
}

export function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalStickers: 0, totalBatches: 0, totalProducts: 0,
    totalDesigns: 0, totalRpuRuns: 0, totalRpuStickers: 0,
    thisMonthStickers: 0, thisMonthBatches: 0, avgPerBatch: 0,
  });
  const [monthData, setMonthData] = useState<MonthData[]>([]);
  const [sizeBreakdown, setSizeBreakdown] = useState<{ label: string; count: number; w: number; h: number }[]>([]);
  const [rpuRuns, setRpuRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [batchesRes, productsRes, designsRes] = await Promise.all([
        supabase.from('batches').select('id, batch_code, start_serial, end_serial, quantity, status, created_at, products(name)'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('designs').select('id', { count: 'exact', head: true }),
      ]);

      const batches = (batchesRes.data || []) as unknown as BatchRow[];
      const totalStickers = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
      const totalBatches = batches.length;
      const totalProducts = productsRes.count || 0;
      const totalDesigns = designsRes.count || 0;

      const runs = loadRuns();
      const totalRpuRuns = runs.length;
      const totalRpuStickers = runs.reduce((sum, r) => sum + r.quantity, 0);

      // This month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const thisMonthBatches = batches.filter(b => b.created_at >= monthStart).length;
      const thisMonthStickers = batches
        .filter(b => b.created_at >= monthStart)
        .reduce((sum, b) => sum + (b.quantity || 0), 0);
      const avgPerBatch = totalBatches > 0 ? Math.round(totalStickers / totalBatches) : 0;

      setStats({
        totalStickers, totalBatches, totalProducts, totalDesigns,
        totalRpuRuns, totalRpuStickers, thisMonthStickers, thisMonthBatches, avgPerBatch,
      });

      // Month-over-month data (last 6 months)
      const months: MonthData[] = [];
      for (let i = 5; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextM = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const label = m.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const mBatches = batches.filter(b => b.created_at >= m.toISOString() && b.created_at < nextM.toISOString());
        months.push({
          month: label,
          stickers: mBatches.reduce((s, b) => s + (b.quantity || 0), 0),
          batches: mBatches.length,
        });
      }
      setMonthData(months);

      // Size breakdown from RPU runs
      const allSizes: LabelSize[] = [];
      for (const run of runs) {
        // Try to extract sizes from run metadata
        const sizes = breakdown([]);
        // Use the sticker dimensions from runs if available
      }
      // Get size breakdown from RPU runs' stored layout data
      const sizeMap = new Map<string, { count: number; w: number; h: number }>();
      for (const run of runs) {
        const key = `${run.stickerW}x${run.stickerH}`;
        const existing = sizeMap.get(key);
        if (existing) {
          existing.count += run.quantity;
        } else {
          sizeMap.set(key, { count: run.quantity, w: run.stickerW, h: run.stickerH });
        }
      }
      setSizeBreakdown(Array.from(sizeMap.values()).map((s, i) => ({
        label: `${s.w} × ${s.h}`,
        count: s.count,
        w: s.w,
        h: s.h,
      })).sort((a, b) => b.count - a.count));

      setRpuRuns(runs.slice(0, 10));
      setLoading(false);
    }
    load();
  }, []);

  const maxMonthStickers = useMemo(() => Math.max(1, ...monthData.map(m => m.stickers)), [monthData]);
  const maxSizeCount = useMemo(() => Math.max(1, ...sizeBreakdown.map(s => s.count)), [sizeBreakdown]);

  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-bg-primary relative">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sky-500/[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="max-w-5xl mx-auto p-8 relative z-10">
        <ScrollReveal>
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Analytics</h1>
            </div>
            <p className="text-sm text-text-muted ml-[52px]">Real-time insights from your sticker production.</p>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <ScrollReveal>
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                <StaggerItem>
                  <StatCard label="Total Stickers" value={stats.totalStickers.toLocaleString()} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>} accent />
                </StaggerItem>
                <StaggerItem>
                  <StatCard label="This Month" value={stats.thisMonthStickers.toLocaleString()} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>} />
                </StaggerItem>
                <StaggerItem>
                  <StatCard label="Batches" value={stats.totalBatches.toLocaleString()} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>} />
                </StaggerItem>
                <StaggerItem>
                  <StatCard label="Avg per Batch" value={stats.avgPerBatch.toLocaleString()} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>} />
                </StaggerItem>
                <StaggerItem>
                  <StatCard label="Products" value={stats.totalProducts.toLocaleString()} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>} />
                </StaggerItem>
                <StaggerItem>
                  <StatCard label="RPU Runs" value={stats.totalRpuRuns.toLocaleString()} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>} accent />
                </StaggerItem>
              </StaggerContainer>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              <ScrollReveal>
                <div className="bg-bg-surface border border-border rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-text-primary mb-4">Monthly Stickers</h2>
                  <div className="flex items-end gap-2 h-48">
                    {monthData.map((m) => (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-accent/20 rounded-t-md transition-all duration-500" style={{ height: `${Math.max(4, (m.stickers / maxMonthStickers) * 100)}%` }} />
                        <span className="text-[10px] text-text-muted">{m.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <div className="bg-bg-surface border border-border rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-text-primary mb-4">RPU Sticker Sizes</h2>
                  {sizeBreakdown.length === 0 ? (
                    <p className="text-sm text-text-muted text-center py-8">No RPU runs recorded yet</p>
                  ) : (
                    <div className="space-y-3">
                      {sizeBreakdown.map((s) => (
                        <div key={`${s.w}x${s.h}`} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-text-primary font-medium">{s.w} × {s.h}mm</span>
                              <span className="text-text-muted">{s.count.toLocaleString()}</span>
                            </div>
                            <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                              <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${(s.count / maxSizeCount) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal>
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Recent RPU Runs</h2>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {rpuRuns.length === 0 ? (
                  <div className="bg-bg-surface border border-border rounded-2xl p-8 text-center">
                    <p className="text-sm text-text-muted">No RPU runs yet</p>
                  </div>
                ) : (
                  <StaggerContainer staggerDelay={0.05}>
                    {rpuRuns.map((run) => (
                      <StaggerItem key={run.id}>
                        <div className="bg-bg-surface border border-border rounded-2xl p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors mb-3">
                          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{run.brand} {run.name}</p>
                            <p className="text-xs text-text-muted mt-0.5">{run.quantity} stickers · {run.serialBase}</p>
                          </div>
                          <span className="text-xs text-text-muted shrink-0">{new Date(run.startedAt).toLocaleDateString()}</span>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                )}
              </section>
            </ScrollReveal>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-20 h-20 bg-accent/5 rounded-full -translate-y-6 translate-x-6 transition-transform group-hover:scale-110 duration-500" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="relative">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${accent ? 'bg-accent/10 text-accent' : 'bg-white/5 text-text-secondary'}`}>
          {icon}
        </div>
        <div className={`text-2xl font-bold mb-1 ${accent ? 'text-accent' : 'text-text-primary'}`}>{value}</div>
        <div className="text-xs text-text-muted">{label}</div>
      </div>
    </div>
  );
}