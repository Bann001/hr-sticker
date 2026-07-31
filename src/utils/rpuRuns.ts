export interface RpuRun {
  id: string;
  brand: string;
  name: string;
  stickerW: number;
  stickerH: number;
  quantity: number;
  startedAt: string;
  serialBase: string;
}

const KEY = 'rpu-runs';

export function loadRuns(): RpuRun[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function saveRun(run: RpuRun) {
  const all = loadRuns();
  all.unshift(run);
  while (all.length > 50) all.pop();
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteRun(id: string) {
  const next = loadRuns().filter(r => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
}
