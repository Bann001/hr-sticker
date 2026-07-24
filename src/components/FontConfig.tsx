import { motion } from 'framer-motion';
import type { FontConfig as FontConfigType, FontFamily } from '../types';

interface Props {
  config: FontConfigType;
  onChange: (c: FontConfigType) => void;
}

const families: FontFamily[] = ['Carbona', 'Space Grotesk', 'Space Mono'];

const fields: { key: keyof FontConfigType; label: string }[] = [
  { key: 'brand', label: 'Brand font' },
  { key: 'body', label: 'Body font' },
  { key: 'bt', label: 'BT font' },
];

export function FontConfig({ config, onChange }: Props) {
  function set(key: keyof FontConfigType, value: string) {
    onChange({ ...config, [key]: value as FontFamily });
  }

  return (
    <div className="p-5">
      <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-4">Fonts</h3>
      <div className="space-y-4">
        {fields.map((f, i) => (
          <motion.div
            key={f.key}
            className="flex flex-col gap-1.5"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{f.label}</label>
            <select
              className="h-10 px-3.5 pr-8 text-sm bg-bg-surface border border-border rounded-xl text-text-primary w-full appearance-none cursor-pointer focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23727272' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                backgroundSize: '16px',
              }}
              value={config[f.key]}
              onChange={e => set(f.key, e.target.value)}
            >
              {families.map(fam => (
                <option key={fam} value={fam}>{fam}</option>
              ))}
            </select>
          </motion.div>
        ))}
      </div>
    </div>
  );
}