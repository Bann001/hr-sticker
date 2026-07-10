import type { LayoutConfig as LayoutConfigType } from '../types';

interface Props {
  layout: LayoutConfigType;
  onChange: (l: LayoutConfigType) => void;
}

const fields: { key: keyof LayoutConfigType; label: string; min: number; max: number; step: number }[] = [
  { key: 'cols', label: 'Columns', min: 1, max: 6, step: 1 },
  { key: 'rows', label: 'Rows', min: 1, max: 20, step: 1 },
  { key: 'sticker_width_mm', label: 'Width (mm)', min: 20, max: 200, step: 0.1 },
  { key: 'sticker_height_mm', label: 'Height (mm)', min: 10, max: 120, step: 0.1 },
  { key: 'margin_top_mm', label: 'Margin top (mm)', min: 0, max: 50, step: 0.5 },
  { key: 'margin_bottom_mm', label: 'Margin bottom (mm)', min: 0, max: 50, step: 0.5 },
  { key: 'margin_left_mm', label: 'Margin left (mm)', min: 0, max: 50, step: 0.5 },
  { key: 'margin_right_mm', label: 'Margin right (mm)', min: 0, max: 50, step: 0.5 },
  { key: 'spacing_h_mm', label: 'H spacing (mm)', min: 0, max: 20, step: 0.1 },
  { key: 'spacing_v_mm', label: 'V spacing (mm)', min: 0, max: 20, step: 0.1 },
];

export function LayoutConfig({ layout, onChange }: Props) {
  function set(key: keyof LayoutConfigType, value: string) {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    onChange({ ...layout, [key]: num });
  }

  return (
    <div>
      <h3 style={styles.title}>Layout</h3>
      <div style={styles.grid}>
        {fields.map(f => (
          <div key={f.key} style={styles.field}>
            <label style={styles.label}>{f.label}</label>
            <input
              style={styles.input}
              type="number"
              min={f.min}
              max={f.max}
              step={f.step}
              value={layout[f.key]}
              onChange={e => set(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999aae', marginBottom: 8 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px' },
  field: { display: 'flex', flexDirection: 'column', gap: 2 },
  label: { fontSize: 10, fontWeight: 600, color: '#999aae' },
  input: { padding: '5px 8px', fontSize: 12, borderRadius: 5, border: '1px solid #2e2e3e', background: '#22222e', color: '#e4e4ec', fontFamily: 'inherit', width: '100%' },
};
