import { useState, useEffect, useCallback } from 'react';
import { getMenuItems, getCategories } from '../services/menuService';

export function useMenu({ availableOnly = false } = {}) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [itemsData, categoriesData] = await Promise.all([
        getMenuItems({ availableOnly }),
        getCategories(),
      ]);
      setItems(itemsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message);
    }
  }, [availableOnly]);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  return { items, categories, loading, error, refresh };
}

