const stats = [
  { label: 'Total Stickers', value: '24,582' },
  { label: 'This Month', value: '1,340' },
  { label: 'Average per Batch', value: '186' },
  { label: 'Active Products', value: '12' },
];

const recentBatches = [
  { product: 'Vitamin C Serum', batch: '2407', stickers: 220, date: '2024-07-15' },
  { product: 'Retinol Cream', batch: '2407', stickers: 195, date: '2024-07-14' },
  { product: 'Hyaluronic Acid', batch: '2406', stickers: 210, date: '2024-07-12' },
  { product: 'Niacinamide 10%', batch: '2406', stickers: 180, date: '2024-07-10' },
  { product: 'SPF 50 Sunscreen', batch: '2405', stickers: 250, date: '2024-07-08' },
];

export function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">Sticker generation insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-bg-surface border border-border rounded-2xl p-5"
          >
            <p className="text-3xl font-bold text-accent">{s.value}</p>
            <p className="text-sm text-text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-bg-surface border border-border rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Recent Batches</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border">
                <th className="pb-3 pr-4">Product</th>
                <th className="pb-3 pr-4">Batch</th>
                <th className="pb-3 pr-4">Stickers</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentBatches.map((b) => (
                <tr key={b.batch + b.product} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 text-text-primary">{b.product}</td>
                  <td className="py-3 pr-4 text-text-secondary">{b.batch}</td>
                  <td className="py-3 pr-4 text-text-primary">{b.stickers}</td>
                  <td className="py-3 text-text-muted">{b.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}