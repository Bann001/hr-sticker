import { useState, useEffect, useRef } from 'react';

interface SavedLogo {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string;
}

interface Props {
  onSelect: (dataUrl: string) => void;
}

const STORAGE_KEY = 'saved-logos';

function loadAll(): SavedLogo[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function SavedLogos({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [logos, setLogos] = useState<SavedLogo[]>([]);
  const [saveName, setSaveName] = useState('');
  const [saveDataUrl, setSaveDataUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<'browse' | 'save'>('browse');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setLogos(loadAll());
  }, [open]);

  function handleDelete(id: string) {
    const next = logos.filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setLogos(next);
  }

  function handleSave() {
    if (!saveName.trim() || !saveDataUrl) return;
    const entry: SavedLogo = {
      id: Date.now().toString(),
      name: saveName.trim(),
      dataUrl: saveDataUrl,
      createdAt: new Date().toISOString(),
    };
    const all = [...loadAll(), entry];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    setSaveName('');
    setSaveDataUrl(null);
    setTab('browse');
    setLogos(all);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSaveDataUrl(dataUrl);
      setSaveName(file.name.replace(/\.[^.]+$/, ''));
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <button style={styles.folderBtn} onClick={() => setOpen(true)} title="Saved logos">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {open && (
        <div style={styles.overlay} onClick={() => setOpen(false)}>
          <div style={styles.panel} onClick={e => e.stopPropagation()}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>Saved Logos</h3>
              <button style={styles.closeBtn} onClick={() => setOpen(false)}>&#x2715;</button>
            </div>

            <div style={styles.tabs}>
              <button style={tab === 'browse' ? styles.tabActive : styles.tab} onClick={() => setTab('browse')}>Browse</button>
              <button style={tab === 'save' ? styles.tabActive : styles.tab} onClick={() => setTab('save')}>Save new</button>
            </div>

            {tab === 'browse' && (
              <div style={styles.grid}>
                {logos.length === 0 && <p style={styles.empty}>No saved logos yet.</p>}
                {logos.map(logo => (
                  <div key={logo.id} style={styles.card}>
                    <img
                      src={logo.dataUrl}
                      alt={logo.name}
                      style={styles.thumb}
                      onClick={() => { onSelect(logo.dataUrl); setOpen(false); }}
                    />
                    <div style={styles.cardBody}>
                      <span style={styles.cardName}>{logo.name}</span>
                      <button style={styles.delBtn} onClick={() => handleDelete(logo.id)}>&#x1F5D1;</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'save' && (
              <div style={styles.saveForm}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  style={{ display: 'none' }}
                />
                <button style={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
                  {saveDataUrl ? 'Change file' : 'Choose image'}
                </button>

                {saveDataUrl && (
                  <img src={saveDataUrl} alt="preview" style={styles.previewImg} />
                )}

                <label style={styles.label}>Name</label>
                <input
                  style={styles.input}
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder="Logo name"
                />

                <button style={styles.saveBtn} onClick={handleSave} disabled={!saveName.trim() || !saveDataUrl}>
                  Save to library
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  folderBtn: {
    background: '#22222e',
    border: '1px solid #2e2e3e',
    borderRadius: 6,
    color: '#999aae',
    cursor: 'pointer',
    padding: '5px 8px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 0,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  panel: {
    background: '#191922',
    border: '1px solid #2e2e3e',
    borderRadius: 10,
    width: 420,
    maxWidth: '90vw',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    padding: 20,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#e4e4ec',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#999aae',
    fontSize: 16,
    cursor: 'pointer',
    padding: '2px 6px',
  },
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 12,
    background: '#14141e',
    borderRadius: 6,
    padding: 3,
  },
  tab: {
    flex: 1,
    padding: '6px 0',
    background: 'transparent',
    border: 'none',
    borderRadius: 4,
    color: '#999aae',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  tabActive: {
    flex: 1,
    padding: '6px 0',
    background: '#2e2e3e',
    border: 'none',
    borderRadius: 4,
    color: '#e4e4ec',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    overflowY: 'auto',
    maxHeight: 300,
  },
  empty: { color: '#666', fontSize: 12, gridColumn: '1 / -1', textAlign: 'center', padding: 20 },
  card: {
    background: '#14141e',
    borderRadius: 6,
    overflow: 'hidden',
    border: '1px solid #2e2e3e',
  },
  thumb: {
    width: '100%',
    height: 80,
    objectFit: 'contain',
    background: '#fff',
    cursor: 'pointer',
    display: 'block',
  },
  cardBody: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 8px',
  },
  cardName: { fontSize: 11, color: '#999aae', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  delBtn: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 12, padding: 0 },
  saveForm: { display: 'flex', flexDirection: 'column', gap: 8 },
  uploadBtn: {
    padding: '8px 0',
    background: '#2a2a38',
    color: '#e4e4ec',
    border: '1px solid #2e2e3e',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 600,
  },
  previewImg: {
    width: '100%',
    height: 100,
    objectFit: 'contain',
    background: '#fff',
    borderRadius: 6,
  },
  label: { fontSize: 11, fontWeight: 600, color: '#999aae', marginTop: 4 },
  input: {
    padding: '7px 10px',
    fontSize: 13,
    borderRadius: 6,
    border: '1px solid #2e2e3e',
    background: '#22222e',
    color: '#e4e4ec',
    fontFamily: 'inherit',
  },
  saveBtn: {
    padding: '8px 0',
    background: '#7c5cfc',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
};
