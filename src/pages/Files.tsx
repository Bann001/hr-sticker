import { useState } from 'react'
import { cn } from '../lib/utils'

type FileCategory = 'all' | 'logos' | 'designs' | 'templates'
type FileKind = 'logo' | 'design' | 'template'

interface FileItem {
  id: string
  name: string
  kind: FileKind
  type: string
  size: string
  modified: string
}

const files: FileItem[] = [
  { id: '1', name: 'Company Logo.ai', kind: 'logo', type: 'AI Vector', size: '2.4 MB', modified: 'May 14, 2026' },
  { id: '2', name: 'Brand Kit.pdf', kind: 'logo', type: 'PDF Document', size: '4.1 MB', modified: 'May 12, 2026' },
  { id: '3', name: 'Product Sticker.pxd', kind: 'design', type: 'Design File', size: '1.8 MB', modified: 'Jun 2, 2026' },
  { id: '4', name: 'Round Badge.psd', kind: 'design', type: 'Photoshop', size: '3.5 MB', modified: 'May 28, 2026' },
  { id: '5', name: 'Shipping Label.svg', kind: 'template', type: 'SVG Template', size: '0.6 MB', modified: 'Jun 5, 2026' },
  { id: '6', name: 'Holiday Pack.pdf', kind: 'template', type: 'PDF Template', size: '5.2 MB', modified: 'Jun 1, 2026' },
  { id: '7', name: 'Icon Set.png', kind: 'logo', type: 'PNG Image', size: '1.2 MB', modified: 'May 20, 2026' },
  { id: '8', name: 'Bumper Sticker.dxf', kind: 'design', type: 'DXF Cut', size: '0.9 MB', modified: 'Jun 3, 2026' },
]

const tabs: { id: FileCategory; label: string }[] = [
  { id: 'all', label: 'All Files' },
  { id: 'logos', label: 'Logos' },
  { id: 'designs', label: 'Designs' },
  { id: 'templates', label: 'Templates' },
]

function FileIcon({ kind }: { kind: FileKind }) {
  const s = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (kind) {
    case 'logo':
      return (
        <svg {...s} className="text-accent">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      )
    case 'design':
      return (
        <svg {...s} className="text-success">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )
    case 'template':
      return (
        <svg {...s} className="text-blue-500">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      )
  }
}

function gradientClass(kind: FileKind) {
  switch (kind) {
    case 'logo': return 'bg-gradient-to-br from-accent/20 to-accent/5'
    case 'design': return 'bg-gradient-to-br from-success/20 to-success/5'
    case 'template': return 'bg-gradient-to-br from-blue-500/20 to-blue-500/5'
  }
}

export function FilesPage() {
  const [activeTab, setActiveTab] = useState<FileCategory>('all')

  const filtered = activeTab === 'all' ? files : files.filter(f => `${f.kind}s` === activeTab)

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">My Files</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your logos, designs, and templates</p>
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
        {filtered.map(file => (
          <div
            key={file.id}
            className="bg-bg-surface border border-border rounded-2xl p-4 hover:border-accent/30 transition-colors"
          >
            <div className={cn('h-24 rounded-xl flex items-center justify-center mb-3', gradientClass(file.kind))}>
              <FileIcon kind={file.kind} />
            </div>
            <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
            <p className="text-xs text-text-muted mt-1">{file.type}</p>
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