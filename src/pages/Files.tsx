import { useState, useEffect, type FormEvent } from 'react'
import { cn } from '../lib/utils'
import { loadDesigns, saveDesign as saveDesignToSupabase, deleteDesign as deleteDesignFromSupabase } from '../lib/designs'
import { supabase } from '../supabase'
import { motion, AnimatePresence } from 'framer-motion'

type FileCategory = 'all' | 'logos' | 'designs' | 'batches' | 'folders'

interface FileItem {
  id: string
  name: string
  kind: 'logo' | 'design' | 'batch' | 'rpu-design'
  subtitle: string
  size: string
  modified: string
  preview?: string
  projectType?: string
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

interface Folder {
  id: string
  name: string
  items: FileItem[]
  createdAt: string
}

const LOGO_STORAGE_KEY = 'saved-logos'
const FOLDERS_STORAGE_KEY = 'rpu-folders'

function loadLogos(): SavedLogo[] {
  try { return JSON.parse(localStorage.getItem(LOGO_STORAGE_KEY) || '[]') } catch { return [] }
}

function loadFolders(): Folder[] {
  try { return JSON.parse(localStorage.getItem(FOLDERS_STORAGE_KEY) || '[]') } catch { return [] }
}

function saveFolders(folders: Folder[]) {
  localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders))
}

const tabs: { id: FileCategory; label: string }[] = [
  { id: 'all', label: 'All Files' },
  { id: 'logos', label: 'Logos' },
  { id: 'folders', label: 'Folders' },
  { id: 'designs', label: 'Designs' },
  { id: 'batches', label: 'Batches' },
]

function FileIcon({ kind }: { kind: FileItem['kind'] }) {
  const s = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (kind) {
    case 'logo':
      return <svg {...s} className="text-accent"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
    case 'design':
    case 'rpu-design':
      return <svg {...s} className="text-success"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
    case 'batch':
      return <svg {...s} className="text-blue-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
    default:
      return <svg {...s}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
  }
}

function gradientClass(kind: FileItem['kind']) {
  switch (kind) {
    case 'logo': return 'bg-gradient-to-br from-accent/20 to-accent/5'
    case 'design': return 'bg-gradient-to-br from-success/20 to-success/5'
    case 'rpu-design': return 'bg-gradient-to-br from-sky-500/20 to-sky-500/5'
    case 'batch': return 'bg-gradient-to-br from-blue-500/20 to-blue-500/5'
    default: return 'bg-gradient-to-br from-gray-200 to-gray-50'
  }
}

export function FilesPage() {
  const [activeTab, setActiveTab] = useState<FileCategory>('all')
  const [items, setItems] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [designs, setDesigns] = useState<FileItem[]>([])
  const [rpuDesigns, setRpuDesigns] = useState<FileItem[]>([])

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

      const allDesigns = await loadDesigns()
      const designItems: FileItem[] = allDesigns.map(d => ({
        id: d.id,
        name: d.name,
        kind: d.project_type === 'rpu' ? 'rpu-design' : 'design',
        subtitle: `${d.elements.length} elements · ${d.project_type || 'create'}`,
        size: `${Math.round(JSON.stringify(d.elements).length / 1024)} KB`,
        modified: new Date(d.created_at).toLocaleDateString(),
        preview: d.logo_url || undefined,
        projectType: d.project_type,
      }))

      setDesigns(designItems.filter(f => f.projectType !== 'rpu'))
      setRpuDesigns(designItems.filter(f => f.projectType === 'rpu'))

      const { data: batches } = await supabase
        .from('batches')
        .select('id, batch_code, start_serial, end_serial, quantity, status, created_at, products(name)')
        .order('created_at', { ascending: false })

      const batchItems: FileItem[] = (batches as unknown as BatchRow[] || []).map((b, i) => ({
        id: b.id,
        name: `BCH-${String(i + 1).padStart(3, '0')}`,
        kind: 'batch',
        subtitle: `${b.products?.name || 'Unknown'} · ${b.quantity} stickers`,
        size: `${b.quantity} stickers`,
        modified: new Date(b.created_at).toLocaleDateString(),
      }))

      setItems([...logos, ...designItems, ...batchItems])
    }
    load()
  }, [])

  useEffect(() => {
    setFolders(loadFolders())
  }, [])

  const filtered = activeTab === 'all' ? items : items.filter(f => `${f.kind}s` === activeTab)

  const handleCreateFolder = (e: FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    const folder: Folder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      items: [],
      createdAt: new Date().toISOString(),
    }
    const next = [...folders, folder]
    setFolders(next)
    saveFolders(next)
    setNewFolderName('')
    setShowNewFolder(false)
  }

  const handleDeleteFolder = (id: string) => {
    const next = folders.filter(f => f.id !== id)
    setFolders(next)
    saveFolders(next)
  }

  const handleAddToFolder = (item: FileItem, folderId: string) => {
    const next = folders.map(f => f.id === folderId ? { ...f, items: [...f.items, item] } : f)
    setFolders(next)
    saveFolders(next)
  }

  const handleRemoveFromFolder = (folderId: string, itemId: string) => {
    const next = folders.map(f => f.id === folderId ? { ...f, items: f.items.filter(i => i.id !== itemId) } : f)
    setFolders(next)
    saveFolders(next)
  }

  const handleDeleteDesign = async (id: string) => {
    await deleteDesignFromSupabase(id)
    setDesigns(designs.filter(d => d.id !== id))
    setRpuDesigns(rpuDesigns.filter(d => d.id !== id))
    setItems(items.filter(i => i.id !== id))
  }

  const activeFolder = activeFolderId ? folders.find(f => f.id === activeFolderId) : null

  const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  return (
    <motion.div
      className="flex-1 flex flex-col overflow-hidden p-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">My Files</h1>
        <p className="text-sm text-text-secondary mt-1">Manage logos, designs, folders, and batches</p>
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-bg-surface border border-border rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setActiveFolderId(null); }}
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

      {/* Folders tab */}
      {activeTab === 'folders' && (
        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Folder list */}
          <div className="w-72 shrink-0 bg-bg-surface border border-border rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-primary">Folders</h2>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewFolder(!showNewFolder)}
                className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-sm hover:bg-accent/20 transition-colors">
                +
              </motion.button>
            </div>

            <AnimatePresence>
              {showNewFolder && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateFolder}
                  className="mb-3 overflow-hidden"
                >
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="Folder name..."
                    className="h-9 px-3 text-sm bg-bg-primary border border-border rounded-xl text-text-primary w-full outline-none focus:border-accent transition-colors"
                    autoFocus
                  />
                </motion.form>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto space-y-2">
              {folders.length === 0 && (
                <p className="text-xs text-text-muted text-center py-8">No folders yet. Create one to organize your assets.</p>
              )}
              {folders.map(folder => (
                <motion.div
                  key={folder.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className={cn(
                    'p-3 rounded-xl border cursor-pointer transition-colors',
                    activeFolderId === folder.id
                      ? 'bg-accent/10 border-accent/30'
                      : 'bg-bg-primary border-border hover:border-accent/30',
                  )}
                  onClick={() => setActiveFolderId(folder.id)}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary truncate flex-1">{folder.name}</span>
                    <span className="text-[10px] text-text-muted shrink-0 ml-2">{folder.items.length}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Folder contents */}
          <div className="flex-1 bg-bg-surface border border-border rounded-2xl p-5 overflow-y-auto">
            {activeFolder ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-text-primary">{activeFolder.name}</h2>
                  <button onClick={() => handleDeleteFolder(activeFolder.id)}
                    className="text-xs text-danger/70 hover:text-danger">Delete folder</button>
                </div>
                {activeFolder.items.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-8">This folder is empty. Import assets or designs above.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {activeFolder.items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-bg-primary rounded-xl border border-border hover:border-accent/30 transition-colors"
                      >
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', gradientClass(item.kind))}>
                          {item.preview ? (
                            <img src={item.preview} alt="" className="w-full h-full object-contain rounded-lg" />
                          ) : (
                            <FileIcon kind={item.kind} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                          <p className="text-[11px] text-text-muted">{item.subtitle}</p>
                        </div>
                        <button onClick={() => handleRemoveFromFolder(activeFolder.id, item.id)}
                          className="text-text-muted hover:text-danger text-xs shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-text-muted">Select a folder to view its contents</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Designs tab */}
      {activeTab === 'designs' && (
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Create Designs */}
          <section>
            <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              Create Designs
            </h2>
            {designs.length === 0 ? (
              <p className="text-sm text-text-muted py-8 text-center">No create designs yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {designs.map(d => (
                  <motion.div key={d.id} layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-surface border border-border rounded-2xl p-4 hover:border-accent/30 transition-colors"
                  >
                    {d.preview ? (
                      <div className="h-24 rounded-xl flex items-center justify-center mb-3 overflow-hidden bg-gradient-to-br from-success/20 to-success/5">
                        <img src={d.preview} alt="" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="h-24 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br from-success/20 to-success/5">
                        <FileIcon kind={d.kind} />
                      </div>
                    )}
                    <p className="text-sm font-medium text-text-primary truncate">{d.name}</p>
                    <p className="text-xs text-text-muted mt-1">{d.subtitle}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                      <span className="text-xs text-text-muted">{d.modified}</span>
                      <button onClick={() => handleDeleteDesign(d.id)}
                        className="text-xs text-danger/60 hover:text-danger">Delete</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* RPU Designs */}
          <section>
            <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              RPU Sticker Designs
            </h2>
            {rpuDesigns.length === 0 ? (
              <p className="text-sm text-text-muted py-8 text-center">No RPU designs yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {rpuDesigns.map(d => (
                  <motion.div key={d.id} layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-surface border border-border rounded-2xl p-4 hover:border-sky-500/30 transition-colors"
                  >
                    {d.preview ? (
                      <div className="h-24 rounded-xl flex items-center justify-center mb-3 overflow-hidden bg-gradient-to-br from-sky-500/20 to-sky-500/5">
                        <img src={d.preview} alt="" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="h-24 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br from-sky-500/20 to-sky-500/5">
                        <FileIcon kind={d.kind} />
                      </div>
                    )}
                    <p className="text-sm font-medium text-text-primary truncate">{d.name}</p>
                    <p className="text-xs text-text-muted mt-1">{d.subtitle}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                      <span className="text-xs text-text-muted">{d.modified}</span>
                      <button onClick={() => handleDeleteDesign(d.id)}
                        className="text-xs text-danger/60 hover:text-danger">Delete</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* All other tabs */}
      {activeTab !== 'folders' && activeTab !== 'designs' && (
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
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
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
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}