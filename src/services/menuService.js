import { supabase } from '../lib/supabase';

// ─── CATEGORIES ───────────────────────────────────────────────

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function createCategory(name, description = '', sortOrder = 0) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, description, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(categoryId, updates) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(categoryId) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);
  if (error) throw error;
}

// ─── MENU ITEMS ───────────────────────────────────────────────

export async function getMenuItems({ availableOnly = false } = {}) {
  let query = supabase
    .from('menu_items')
    .select(`
      *,
      category:categories(id, name, sort_order)
    `)
    .order('name');

  if (availableOnly) {
    query = query.eq('is_available', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getMenuItemById(itemId) {
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      category:categories(id, name)
    `)
    .eq('id', itemId)
    .single();
  if (error) throw error;
  return data;
}

export async function createMenuItem({ categoryId, name, description, price, imageUrl }) {
  const { data, error } = await supabase
    .from('menu_items')
    .insert({
      category_id: categoryId,
      name,
      description,
      price,
      image_url: imageUrl,
    })
    .select(`
      *,
      category:categories(id, name)
    `)
    .single();
  if (error) throw error;
  return data;
}

export async function updateMenuItem(itemId, updates) {
  // Map camelCase to snake_case
  const dbUpdates = {};
  if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
  if (updates.isAvailable !== undefined) dbUpdates.is_available = updates.isAvailable;

  const { data, error } = await supabase
    .from('menu_items')
    .update(dbUpdates)
    .eq('id', itemId)
    .select(`
      *,
      category:categories(id, name)
    `)
    .single();
  if (error) throw error;
  return data;
}

export async function toggleMenuItemAvailability(itemId, isAvailable) {
  return updateMenuItem(itemId, { isAvailable });
}

export async function deleteMenuItem(itemId) {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', itemId);
  if (error) throw error;
}
