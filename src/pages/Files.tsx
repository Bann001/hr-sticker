import { useState, useEffect } from 'react'
import { cn } from '../lib/utils'
import { loadDesigns } from '../lib/designs'
import { supabase } from '../supabase'

type FileCategory = 'all' | 'logos' | 'designs' | 'batches'

interface FileItem {
  id: string
  name: string
  kind: 'logo' | 'design' | 'batch'
  subtitle: string
  size: string
  modified: string
  preview?: string
}

interface SavedLogo {
  id: string
  name: string
  dataUrl: string
}

interface BatchRow {
  id: string
  batch_code: string
  start_serial: number
  end_serial: number
  quantity: number
  status: string
  created_at: string
  products: { name: string } | null
}

const LOGO_STORAGE_KEY = 'saved-logos'

function loadLogos(): SavedLogo[] {
  try { return JSON.parse(localStorage.getItem(LOGO_STORAGE_KEY) || '[]') } catch { return [] }
}

const tabs: { id: FileCategory; label: string }[] = [
  { id: 'all', label: 'All Files' },
  { id: 'logos', label: 'Logos' },
  { id: 'designs', label: 'Designs' },
  { id: 'batches', label: 'Batches' },
]

function FileIcon({ kind }: { kind: FileItem['kind'] }) {
  const s = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (kind) {
    case 'logo':
      return <svg {...s} className="text-accent"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
    case 'design':
      return <svg {...s} className="text-success"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
    case 'batch':
      return <svg {...s} className="text-blue-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
  }
}

function gradientClass(kind: FileItem['kind']) {
  switch (kind) {
    case 'logo': return 'bg-gradient-to-br from-accent/20 to-accent/5'
    case 'design': return 'bg-gradient-to-br from-success/20 to-success/5'
    case 'batch': return 'bg-gradient-to-br from-blue-500/20 to-blue-500/5'
  }
}

export function FilesPage() {
  const [activeTab, setActiveTab] = useState<FileCategory>('all')
  const [items, setItems] = useState<FileItem[]>([])

  useEffect(() => {
    async function load() {
      const logos = loadLogos().map(l => ({
        id: l.id,
        name: l.name,
        kind: 'logo' as const,
        subtitle: 'Logo',
        size: `${Math.round((l.dataUrl.length * 3) / 4 / 1024)} KB`,
        modified: new Date(parseInt(l.id)).toLocaleDateString(),
        preview: l.dataUrl,
      }))

      const designs = (await loadDesigns()).map(d => ({
        id: d.id,
        name: d.name,
        kind: 'design' as const,
        subtitle: `${d.elements.length} elements`,
        size: `${Math.round(JSON.stringify(d.elements).length / 1024)} KB`,
        modified: new Date(d.created_at).toLocaleDateString(),
      }))

      const { data: batches } = await supabase
        .from('batches')
        .select('id, batch_code, start_serial, end_serial, quantity, status, created_at, products(name)')
        .order('created_at', { ascending: false })

      const batchItems = (batches as unknown as BatchRow[] || []).map((b, i) => ({
        id: b.id,
        name: `BCH-${String(i + 1).padStart(3, '0')}`,
        kind: 'batch' as const,
        subtitle: `${b.products?.name || 'Unknown'} · ${b.quantity} stickers`,
        size: `${b.quantity} stickers`,
        modified: new Date(b.created_at).toLocaleDateString(),
      }))

      setItems([...logos, ...designs, ...batchItems])
    }
    load()
  }, [])

  const filtered = activeTab === 'all' ? items : items.filter(f => `${f.kind}s` === activeTab)

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">My Files</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your logos, designs, and batches</p>
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-bg-surface border border-border rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
              activeTab === tab.id
                ? 'bg-accent text-selected-text'
                : 'text-text-muted hover:text-text-primary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 overflow-y-auto flex-1 content-start">
        {filtered.length === 0 && (
          <div className="col-span-3 flex items-center justify-center py-16">
            <div className="text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#727272" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="text-sm text-text-muted">No {activeTab === 'all' ? 'files' : activeTab} yet</p>
            </div>
          </div>
        )}
        {filtered.map(file => (
          <div
            key={file.id}
            className="bg-bg-surface border border-border rounded-2xl p-4 hover:border-accent/30 transition-colors"
          >
            {file.preview ? (
              <div className={cn('h-24 rounded-xl flex items-center justify-center mb-3 overflow-hidden', gradientClass(file.kind))}>
                <img src={file.preview} alt={file.name} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className={cn('h-24 rounded-xl flex items-center justify-center mb-3', gradientClass(file.kind))}>
                <FileIcon kind={file.kind} />
              </div>
            )}
            <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
            <p className="text-xs text-text-muted mt-1">{file.subtitle}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
              <span className="text-xs text-text-muted">{file.size}</span>
              <span className="text-xs text-text-muted">{file.modified}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}