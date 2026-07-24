import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
      <motion.button
        className="text-text-secondary hover:text-text-primary text-xs font-medium p-1.5 inline-flex items-center justify-center leading-none"
        onClick={() => setOpen(true)}
        title="Saved logos"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-bg-surface border border-border rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-text-primary">Saved Logos</h3>
                <motion.button
                  className="text-text-muted hover:text-text-primary transition-colors"
                  onClick={() => setOpen(false)}
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  &#x2715;
                </motion.button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {logos.length === 0 && (
                  <p className="col-span-2 text-center text-sm text-text-muted py-8">No saved logos yet. Upload a logo and save a product to add one.</p>
                )}
                {logos.map((logo, i) => (
                  <motion.div
                    key={logo.id}
                    className="flex items-center justify-between p-3 bg-bg-primary border border-border rounded-xl gap-3"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                    layout
                  >
                    <motion.img
                      src={logo.dataUrl}
                      alt={logo.name}
                      className="w-12 h-12 rounded-lg object-cover bg-bg-surface cursor-pointer shrink-0"
                      onClick={() => { onSelect(logo.dataUrl); setOpen(false); }}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    />
                    <span className="flex-1 min-w-0 text-sm font-medium text-text-primary truncate">{logo.name}</span>
                    <motion.button
                      className="text-danger/70 hover:text-danger text-xs font-medium shrink-0"
                      onClick={() => handleDelete(logo.id)}
                      title="Delete"
                      whileHover={{ scale: 1.3, color: '#ef4444' }}
                      transition={{ duration: 0.15 }}
                    >
                      &#x1F5D1;
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}