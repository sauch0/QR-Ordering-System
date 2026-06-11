import { supabase } from '../lib/supabase';

// Cache to deduplicate concurrent active order requests for the same table
const activeOrderRequests = {};

/**
 * Fetch the active (open) order for a specific table without creating one.
 */
export async function getActiveOrder(tableId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        menu_item:menu_items(id, name, price, image_url)
      )
    `)
    .eq('table_id', tableId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Get the active (open) order for a specific table.
 * Creates one if none exists.
 */
export async function getOrCreateActiveOrder(tableId) {
  if (activeOrderRequests[tableId]) {
    return activeOrderRequests[tableId];
  }

  const promise = (async () => {
    // Check if there's already an open order for this table
    const { data: existing, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          menu_item:menu_items(id, name, price, image_url)
        )
      `)
      .eq('table_id', tableId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (existing) return existing;

    // Create a new order
    const { data: newOrder, error: createError } = await supabase
      .from('orders')
      .insert({ table_id: tableId, status: 'open' })
      .select(`
        *,
        order_items(
          *,
          menu_item:menu_items(id, name, price, image_url)
        )
      `)
      .single();

    if (createError) {
      // If code is 23505 (unique constraint violation), another request created it first. Fetch and return that.
      if (createError.code === '23505') {
        const { data: retryData, error: retryError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items(
              *,
              menu_item:menu_items(id, name, price, image_url)
            )
          `)
          .eq('table_id', tableId)
          .eq('status', 'open')
          .single();
        if (retryError) throw retryError;
        return retryData;
      }
      throw createError;
    }
    return newOrder;
  })();

  activeOrderRequests[tableId] = promise;
  try {
    return await promise;
  } finally {
    delete activeOrderRequests[tableId];
  }
}

/**
 * Get a specific order with all its items.
 */
export async function getOrderById(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(id, table_number, name),
      order_items(
        *,
        menu_item:menu_items(id, name, price, image_url)
      )
    `)
    .eq('id', orderId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Get all open orders (for admin dashboard).
 */
export async function getAllOpenOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(id, table_number, name),
      order_items(
        *,
        menu_item:menu_items(id, name, price, image_url)
      )
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Get all orders (open + paid) for admin history.
 */
export async function getAllOrders({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(id, table_number, name),
      order_items(
        *,
        menu_item:menu_items(id, name, price, image_url)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ─── ORDER MUTATIONS ───────────────────────────────────────────

/**
 * Add an item to an order.
 */
export async function addOrderItem(orderId, menuItemId, quantity = 1, unitPrice, notes = '') {
  // Check if item already exists in order with same status
  const { data: existing } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .eq('menu_item_id', menuItemId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    // Increment quantity instead of adding duplicate
    const { data, error } = await supabase
      .from('order_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
      .select(`*, menu_item:menu_items(id, name, price, image_url)`)
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('order_items')
    .insert({
      order_id: orderId,
      menu_item_id: menuItemId,
      quantity,
      unit_price: unitPrice,
      notes,
      status: 'pending',
    })
    .select(`*, menu_item:menu_items(id, name, price, image_url)`)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update an order item's quantity.
 */
export async function updateOrderItemQuantity(orderItemId, quantity) {
  if (quantity <= 0) {
    return removeOrderItem(orderItemId);
  }
  const { data, error } = await supabase
    .from('order_items')
    .update({ quantity })
    .eq('id', orderItemId)
    .select(`*, menu_item:menu_items(id, name, price, image_url)`)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Remove (soft-delete) an order item — marks as 'removed'.
 * Admin can do this when food can't be prepared.
 */
export async function removeOrderItem(orderItemId) {
  const { data, error } = await supabase
    .from('order_items')
    .update({ status: 'removed' })
    .eq('id', orderItemId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Hard-delete an order item (used when customer removes before submission).
 */
export async function deleteOrderItem(orderItemId) {
  const { error } = await supabase
    .from('order_items')
    .delete()
    .eq('id', orderItemId);
  if (error) throw error;
}

/**
 * Update order item status (admin: pending → preparing → served).
 */
export async function updateOrderItemStatus(orderItemId, status) {
  const { data, error } = await supabase
    .from('order_items')
    .update({ status })
    .eq('id', orderItemId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Mark an entire order as paid.
 */
export async function markOrderAsPaid(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete an entire order (admin only - emergency).
 */
export async function deleteOrder(orderId) {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);
  if (error) throw error;
}

// ─── REALTIME SUBSCRIPTIONS ────────────────────────────────────

/**
 * Subscribe to order changes for a specific table.
 * Used on customer-facing pages.
 */
export function subscribeToTableOrder(orderId, onUpdate) {
  const channel = supabase
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_items',
        filter: `order_id=eq.${orderId}`,
      },
      onUpdate
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      },
      onUpdate
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to ALL orders (for admin dashboard).
 */
export function subscribeToAllOrders(onUpdate) {
  const channel = supabase
    .channel('all-orders')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      onUpdate
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'order_items' },
      onUpdate
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a realtime channel.
 */
export function unsubscribe(channel) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}
