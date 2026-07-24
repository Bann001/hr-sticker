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

export type FontFamily = 'Carbona' | 'Space Grotesk' | 'Space Mono';

export interface FontConfig {
  brand: FontFamily;
  body: FontFamily;
  bt: FontFamily;
}

export const DEFAULT_FONTS: FontConfig = {
  brand: 'Carbona',
  body: 'Space Grotesk',
  bt: 'Space Mono',
};

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

export type ElementType = 'brand' | 'distributor' | 'volume' | 'bt' | 'logo' | 'custom';

export interface DesignElement {
  id: string;
  type: ElementType;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  fontSize: number;
  fontFamily: FontFamily;
  color: string;
  align: CanvasTextAlign;
  bold: boolean;
  content?: string;
}

export interface StickerDesign {
  id: string;
  name: string;
  stickerWidthMm: number;
  stickerHeightMm: number;
  elements: DesignElement[];
  createdAt: string;
}

export const STICKER_W = 95;
export const STICKER_H = 26;
