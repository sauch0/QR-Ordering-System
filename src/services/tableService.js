import { supabase } from '../lib/supabase';

// ─── TABLES ───────────────────────────────────────────────────

export async function getTables() {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('is_active', true)
    .order('table_number');
  if (error) throw error;
  return data;
}

export async function getTableById(tableId) {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .single();
  if (error) throw error;
  return data;
}

export async function getTableByNumber(tableNumber) {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('table_number', tableNumber)
    .single();
  if (error) throw error;
  return data;
}

export async function createTable(tableNumber, name) {
  const { data, error } = await supabase
    .from('tables')
    .insert({ table_number: tableNumber, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTable(tableId, updates) {
  const { data, error } = await supabase
    .from('tables')
    .update(updates)
    .eq('id', tableId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTable(tableId) {
  const { error } = await supabase
    .from('tables')
    .delete()
    .eq('id', tableId);
  if (error) throw error;
}
