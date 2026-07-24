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
    <div>
      <h3 style={styles.title}>Fonts</h3>
      <div style={styles.grid}>
        {fields.map((f, i) => (
          <motion.div
            key={f.key}
            style={styles.field}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
            <label style={styles.label}>{f.label}</label>
            <select
              style={styles.select}
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

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999aae', marginBottom: 8 },
  grid: { display: 'flex', flexDirection: 'column', gap: 6 },
  field: { display: 'flex', flexDirection: 'column', gap: 2 },
  label: { fontSize: 10, fontWeight: 600, color: '#999aae' },
  select: { padding: '5px 8px', fontSize: 12, borderRadius: 5, border: '1px solid #2e2e3e', background: '#22222e', color: '#e4e4ec', fontFamily: 'inherit', width: '100%' },
};
