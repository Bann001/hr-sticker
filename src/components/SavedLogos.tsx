import { useState, useEffect } from 'react';

interface SavedLogo {
  id: string;
  name: string;
  dataUrl: string;
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

const MAX_LOGOS = 20;

export function saveLogoToLibrary(dataUrl: string, name: string) {
  let all = loadAll();
  if (all.some(l => l.dataUrl === dataUrl)) return;
  const entry = { id: Date.now().toString(), name, dataUrl };
  all.push(entry);
  while (all.length > MAX_LOGOS) all.shift();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // quota exceeded — drop oldest until it fits
    while (all.length > 0) {
      all.shift();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); break; }
      catch { continue; }
    }
  }
}

export function SavedLogos({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [logos, setLogos] = useState<SavedLogo[]>([]);

  useEffect(() => {
    if (open) setLogos(loadAll());
  }, [open]);

  function handleDelete(id: string) {
    const next = logos.filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setLogos(next);
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

            <div style={styles.grid}>
              {logos.length === 0 && <p style={styles.empty}>No saved logos yet. Upload a logo and save a product to add one.</p>}
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
                    <button style={styles.delBtn} onClick={() => handleDelete(logo.id)} title="Delete">&#x1F5D1;</button>
                  </div>
                </div>
              ))}
            </div>
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
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  panel: {
    background: '#191922', border: '1px solid #2e2e3e', borderRadius: 10,
    width: 420, maxWidth: '90vw', maxHeight: '80vh',
    display: 'flex', flexDirection: 'column', padding: 20, gap: 12,
  },
  panelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { fontSize: 14, fontWeight: 700, color: '#e4e4ec', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#999aae', fontSize: 16, cursor: 'pointer', padding: '2px 6px' },
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
    overflowY: 'auto', maxHeight: 300,
  },
  empty: { color: '#666', fontSize: 12, gridColumn: '1 / -1', textAlign: 'center', padding: 20 },
  card: { background: '#14141e', borderRadius: 6, overflow: 'hidden', border: '1px solid #2e2e3e' },
  thumb: {
    width: '100%', height: 80, objectFit: 'contain',
    background: '#fff', cursor: 'pointer', display: 'block',
  },
  cardBody: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px',
  },
  cardName: { fontSize: 11, color: '#999aae', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  delBtn: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 12, padding: 0 },
};
