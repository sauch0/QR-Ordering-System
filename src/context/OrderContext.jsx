import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getActiveOrder, getOrCreateActiveOrder, addOrderItem, removeOrderItem, deleteOrderItem,
  updateOrderItemQuantity, markOrderAsPaid, subscribeToTableOrder, unsubscribe,
  getOrderById } from '../services/orderService';

const OrderContext = createContext(null);

export function OrderProvider({ tableId, children }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [localCart, setLocalCart] = useState([]);

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
  }, [tableId, order]);

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
    setLocalCart(prev => {
      const existing = prev.find(i => i.menu_item.id === menuItem.id);
      if (existing) {
        return prev.map(i => i.menu_item.id === menuItem.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, {
        id: `local-${Date.now()}-${Math.random()}`,
        menu_item: menuItem,
        quantity,
        unit_price: menuItem.price,
        status: 'local_cart'
      }];
    });
  }, []);

  const removeItem = useCallback(async (orderItemId) => {
    if (String(orderItemId).startsWith('local-')) {
      setLocalCart(prev => prev.filter(i => i.id !== orderItemId));
      return;
    }
    await removeOrderItem(orderItemId);
    const updated = await getOrderById(order.id);
    setOrder(updated);
  }, [order?.id]);

  const deleteItem = useCallback(async (orderItemId) => {
    if (String(orderItemId).startsWith('local-')) {
      setLocalCart(prev => prev.filter(i => i.id !== orderItemId));
      return;
    }
    await deleteOrderItem(orderItemId);
    const updated = await getOrderById(order.id);
    setOrder(updated);
  }, [order?.id]);

  const updateQuantity = useCallback(async (orderItemId, quantity) => {
    if (String(orderItemId).startsWith('local-')) {
      if (quantity <= 0) {
        setLocalCart(prev => prev.filter(i => i.id !== orderItemId));
      } else {
        setLocalCart(prev => prev.map(i => i.id === orderItemId ? { ...i, quantity } : i));
      }
      return;
    }
    await updateOrderItemQuantity(orderItemId, quantity);
    const updated = await getOrderById(order.id);
    setOrder(updated);
  }, [order?.id]);

  const placeOrder = useCallback(async () => {
    if (localCart.length === 0) return;
    try {
      let currentOrder = order;
      if (!currentOrder) {
        currentOrder = await getOrCreateActiveOrder(tableId);
      }
      for (const item of localCart) {
        await addOrderItem(currentOrder.id, item.menu_item.id, item.quantity, item.unit_price);
      }
      const updated = await getOrderById(currentOrder.id);
      setOrder(updated);
      setLocalCart([]);
      setIsOrderPlaced(true);
    } catch (err) {
      setError(err.message);
    }
  }, [localCart, order, tableId]);

  const payOrder = useCallback(async () => {
    if (!order?.id) return;
    await markOrderAsPaid(order.id);
    const updated = await getOrderById(order.id);
    setOrder(updated);
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('table_scanned_')) {
        sessionStorage.removeItem(key);
      }
    });
  }, [order?.id]);

  const dbActiveItems = order?.order_items?.filter(i => i.status !== 'removed') ?? [];
  const activeItems = [...localCart, ...dbActiveItems];
  const totalAmount = activeItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  return (
    <OrderContext.Provider value={{
      order, loading, error,
      activeItems, totalAmount,
      addItem, removeItem, deleteItem, updateQuantity, payOrder,
      refreshOrder, isOrderPlaced, placeOrder
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
