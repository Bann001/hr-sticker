import { useState } from 'react';

type TicketStatus = 'completed' | 'pending' | 'failed';

interface Ticket {
  id: string;
  productName: string;
  btNumber: string;
  batchSize: number;
  status: TicketStatus;
  date: string;
}

const mockTickets: Ticket[] = [
  { id: 'TKT-001', productName: 'Premium Round Labels', btNumber: 'BT-2407-001', batchSize: 120, status: 'completed', date: '2026-01-15' },
  { id: 'TKT-002', productName: 'Square Sticker Pack', btNumber: 'BT-2407-002', batchSize: 250, status: 'pending', date: '2026-01-16' },
  { id: 'TKT-003', productName: 'Holographic Badge', btNumber: 'BT-2407-003', batchSize: 80, status: 'failed', date: '2026-01-17' },
  { id: 'TKT-004', productName: 'Kraft Paper Labels', btNumber: 'BT-2407-004', batchSize: 500, status: 'completed', date: '2026-01-18' },
  { id: 'TKT-005', productName: 'Clear Vinyl Stickers', btNumber: 'BT-2407-005', batchSize: 200, status: 'pending', date: '2026-01-19' },
  { id: 'TKT-006', productName: 'Gold Foil Logo', btNumber: 'BT-2407-006', batchSize: 60, status: 'completed', date: '2026-01-20' },
  { id: 'TKT-007', productName: 'Weatherproof Labels', btNumber: 'BT-2407-007', batchSize: 350, status: 'failed', date: '2026-01-21' },
];

const statusBadge: Record<TicketStatus, { label: string; className: string }> = {
  completed: {
    label: 'Completed',
    className: 'bg-success/10 text-success border border-success/20',
  },
  pending: {
    label: 'Pending',
    className: 'bg-accent/10 text-accent border border-accent/20',
  },
  failed: {
    label: 'Failed',
    className: 'bg-danger/10 text-danger border border-danger/20',
  },
};

const filters = ['All', 'Pending', 'Completed', 'Failed'] as const;

export function TicketsPage() {
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const filteredTickets =
    activeFilter === 'All'
      ? mockTickets
      : mockTickets.filter((t) => t.status === activeFilter.toLowerCase());

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Tickets</h1>
        <p className="text-sm text-text-muted mt-1">Manage your sticker batches</p>
      </div>

      <div className="px-6 pb-4 flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={
              activeFilter === f
                ? 'px-4 py-1.5 rounded-full text-xs font-semibold bg-accent text-selected-text transition-colors'
                : 'px-4 py-1.5 rounded-full text-xs font-semibold bg-bg-surface text-text-secondary border border-border hover:bg-bg-sidebar transition-colors'
            }
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
        {filteredTickets.map((ticket, i) => {
          const badge = statusBadge[ticket.status];
          return (
            <div
              key={ticket.id}
              className={
                'flex items-center gap-4 bg-bg-surface border border-border rounded-2xl p-4' +
                (i % 2 === 1 ? ' opacity-80' : '')
              }
            >
              <div className="w-20 shrink-0">
                <span className="text-sm font-semibold text-text-primary">{ticket.id}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{ticket.productName}</p>
              </div>

              <div className="w-28 shrink-0">
                <span className="text-sm text-text-secondary">{ticket.btNumber}</span>
              </div>

              <div className="w-28 shrink-0 text-right">
                <span className="text-sm text-text-primary">{ticket.batchSize} stickers</span>
              </div>

              <div className="w-24 shrink-0 flex justify-end">
                <span className={'px-2.5 py-1 rounded-full text-xs font-semibold ' + badge.className}>
                  {badge.label}
                </span>
              </div>

              <div className="w-24 shrink-0 text-right">
                <span className="text-sm text-text-muted">{ticket.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
