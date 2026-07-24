import { motion } from 'framer-motion';
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
      <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">Layout</h3>
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5">
        {fields.map((f, i) => (
          <motion.div
            key={f.key}
            className="flex flex-col gap-0.5"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.3 }}
          >
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{f.label}</label>
            <input
              className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 w-full"
              type="number"
              min={f.min}
              max={f.max}
              step={f.step}
              value={layout[f.key]}
              onChange={e => set(f.key, e.target.value)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
