import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getActiveOrder, getOrCreateActiveOrder, addOrderItem, removeOrderItem, deleteOrderItem,
  updateOrderItemQuantity, markOrderAsPaid, subscribeToTableOrder, unsubscribe,
  getOrderById } from '../services/orderService';

const OrderContext = createContext(null);

export function OrderProvider({ tableId, children }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshOrder = useCallback(async () => {
    if (!tableId) return;
    try {
      const freshOrder = order?.id
        ? await getOrderById(order.id)
        : await getActiveOrder(tableId);
      setOrder(freshOrder);
    } catch (err) {
      setError(err.message);
    }
  }, [tableId, order?.id]);

  // Initial load: Only check for existing open order (don't auto-create)
  useEffect(() => {
    if (!tableId) return;
    setLoading(true);
    getActiveOrder(tableId)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tableId]);

  // Realtime subscription
  useEffect(() => {
    if (!order?.id) return;
    const channel = subscribeToTableOrder(order.id, () => {
      getOrderById(order.id)
        .then((updated) => {
          setOrder(updated);
          // If the order was marked paid by the admin, expire the customer's session
          if (updated && updated.status === 'paid') {
            Object.keys(sessionStorage).forEach(key => {
              if (key.startsWith('table_scanned_')) {
                sessionStorage.removeItem(key);
              }
            });
          }
        })
        .catch(console.error);
    });
    return () => unsubscribe(channel);
  }, [order?.id]);

  const addItem = useCallback(async (menuItem, quantity = 1) => {
    try {
      let currentOrder = order;
      if (!currentOrder) {
        // Create the active order row in the database on demand when the first item is added
        currentOrder = await getOrCreateActiveOrder(tableId);
        setOrder(currentOrder);
      }
      await addOrderItem(currentOrder.id, menuItem.id, quantity, menuItem.price);
      const updated = await getOrderById(currentOrder.id);
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    }
  }, [order, tableId]);

  const removeItem = useCallback(async (orderItemId) => {
    await removeOrderItem(orderItemId);
    const updated = await getOrderById(order.id);
    setOrder(updated);
  }, [order?.id]);

  const deleteItem = useCallback(async (orderItemId) => {
    await deleteOrderItem(orderItemId);
    const updated = await getOrderById(order.id);
    setOrder(updated);
  }, [order?.id]);

  const updateQuantity = useCallback(async (orderItemId, quantity) => {
    await updateOrderItemQuantity(orderItemId, quantity);
    const updated = await getOrderById(order.id);
    setOrder(updated);
  }, [order?.id]);

  const payOrder = useCallback(async () => {
    if (!order?.id) return;
    await markOrderAsPaid(order.id);
    // Order marked paid — refresh
    const updated = await getOrderById(order.id);
    setOrder(updated);
    // Expire session
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('table_scanned_')) {
        sessionStorage.removeItem(key);
      }
    });
  }, [order?.id]);

  const activeItems = order?.order_items?.filter(i => i.status !== 'removed') ?? [];
  const totalAmount = activeItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  return (
    <OrderContext.Provider value={{
      order, loading, error,
      activeItems, totalAmount,
      addItem, removeItem, deleteItem, updateQuantity, payOrder,
      refreshOrder,
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used within OrderProvider');
  return ctx;
}
