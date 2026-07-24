import { supabase } from '../supabase';
import type { DesignElement } from '../types';

export interface StickerDesign {
  id: string;
  name: string;
  elements: DesignElement[];
  created_at: string;
}

export async function loadDesigns(): Promise<StickerDesign[]> {
  const { data, error } = await supabase.from('designs').select('*').order('created_at', { ascending: false });
  if (error) console.error('Supabase load error:', error);
  return (data as StickerDesign[]) || [];
}

export async function saveDesign(name: string, elements: DesignElement[]): Promise<void> {
  if (elements.length === 0) return;
  const existing = await supabase.from('designs').select('id').eq('name', name).maybeSingle();
  if (existing.error) console.error('Supabase check error:', existing.error);
  if (existing.data) {
    const { error } = await supabase.from('designs').update({ name, elements, created_at: new Date().toISOString() }).eq('id', existing.data.id);
    if (error) console.error('Supabase update error:', error);
  } else {
    const id = Date.now().toString();
    const { error } = await supabase.from('designs').insert({ id, name, elements });
    if (error) console.error('Supabase insert error:', error);
  }
}

export async function findDesign(id: string): Promise<StickerDesign | null> {
  const { data, error } = await supabase.from('designs').select('*').eq('id', id).maybeSingle();
  if (error) console.error('Supabase find error:', error);
  return data as StickerDesign | null;
}

export async function deleteDesign(id: string): Promise<void> {
  const { error } = await supabase.from('designs').delete().eq('id', id);
  if (error) console.error('Supabase delete error:', error);
}