export interface DroneModel {
  id: string;
  brand: string;
  name: string;
  dims: string;
  weight: string;
  stickerWidthMm: number;
  stickerHeightMm: number;
}

export const droneLibrary: DroneModel[] = [
  {
    id: 'xag-p60',
    brand: 'XAG',
    name: 'P60',
    dims: '1428×1487×649 mm',
    weight: '38.34 kg',
    stickerWidthMm: 100,
    stickerHeightMm: 32,
  },
  {
    id: 'xag-p100',
    brand: 'XAG',
    name: 'P100 Pro',
    dims: '2585×2730×762 mm',
    weight: '68.30 kg',
    stickerWidthMm: 110,
    stickerHeightMm: 34,
  },
  {
    id: 'xag-p150',
    brand: 'XAG',
    name: 'P150',
    dims: '3068×3096×742 mm',
    weight: '69.70 kg',
    stickerWidthMm: 115,
    stickerHeightMm: 35,
  },
  {
    id: 'dji-t25',
    brand: 'DJI',
    name: 'Agras T25',
    dims: '1250×1420×480 mm',
    weight: '25.50 kg',
    stickerWidthMm: 80,
    stickerHeightMm: 28,
  },
  {
    id: 'dji-t40',
    brand: 'DJI',
    name: 'Agras T40',
    dims: '1626×2060×650 mm',
    weight: '45.60 kg',
    stickerWidthMm: 95,
    stickerHeightMm: 30,
  },
  {
    id: 'dji-t50',
    brand: 'DJI',
    name: 'Agras T50',
    dims: '1780×1780×730 mm',
    weight: '50.00 kg',
    stickerWidthMm: 95,
    stickerHeightMm: 30,
  },
  {
    id: 'dji-t100',
    brand: 'DJI',
    name: 'Agras T100',
    dims: '1850×1750×740 mm',
    weight: '59.00 kg',
    stickerWidthMm: 100,
    stickerHeightMm: 32,
  },
];

export function findDrone(id: string): DroneModel {
  return droneLibrary.find(d => d.id === id) ?? droneLibrary[0];
}
