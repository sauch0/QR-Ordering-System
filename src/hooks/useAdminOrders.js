import { useState, useEffect, useCallback } from 'react';
import { getAllOpenOrders, subscribeToAllOrders, unsubscribe } from '../services/orderService';

export function useAdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getAllOpenOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Realtime subscription
  useEffect(() => {
    const channel = subscribeToAllOrders(() => refresh());
    return () => unsubscribe(channel);
  }, [refresh]);

  return { orders, loading, error, refresh };
}
