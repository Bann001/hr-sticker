export interface Product {
  id: string;
  name: string;
  distributor: string;
  volume: string;
  logo_url: string;
  created_at?: string;
}

export interface Batch {
  id: string;
  product_id: string;
  batch_code: string; // YYMM
  start_serial: number;
  end_serial: number;
  quantity: number;
  created_at?: string;
}

export interface LayoutConfig {
  cols: number;
  rows: number;
  sticker_width_mm: number;
  sticker_height_mm: number;
  margin_top_mm: number;
  margin_bottom_mm: number;
  margin_left_mm: number;
  margin_right_mm: number;
  spacing_h_mm: number;
  spacing_v_mm: number;
}

export interface StickerData {
  bt_number: string;
  serial: number;
}

export const DEFAULT_LAYOUT: LayoutConfig = {
  cols: 2,
  rows: 11,
  sticker_width_mm: 95,
  sticker_height_mm: 26,
  margin_top_mm: 5,
  margin_bottom_mm: 5,
  margin_left_mm: 9,
  margin_right_mm: 9,
  spacing_h_mm: 2,
  spacing_v_mm: 0.3,
};
