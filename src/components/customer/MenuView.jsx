import { useState } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { useOrder } from '../../context/OrderContext';
import toast from 'react-hot-toast';
import MenuItemCard from './MenuItemCard';
import './MenuView.css';

export default function MenuView({ onViewBill }) {
  const { items, categories, loading, error } = useMenu({ availableOnly: true });
  const { addItem, activeItems } = useOrder();
  const [activeCategory, setActiveCategory] = useState(null);
  const [addingId, setAddingId] = useState(null);

  const selectedCategory = activeCategory ?? categories[0]?.id;
  const filteredItems = items.filter(item =>
    !selectedCategory || item.category?.id === selectedCategory
  );

  async function handleAddItem(menuItem) {
    setAddingId(menuItem.id);
    try {
      await addItem(menuItem, 1);
      toast.success(`${menuItem.name} added!`);
    } catch {
      toast.error('Failed to add item');
    } finally {
      setAddingId(null);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: 300 }}>
        <div className="spinner" />
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h3>Could not load menu</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="menu-view">
      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="category-scroll">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
              id={`cat-${cat.id}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <h3>No items available</h3>
          <p>Check back soon!</p>
        </div>
      ) : (
        <div className="menu-grid">
          {filteredItems.map((item, i) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onAdd={handleAddItem}
              loading={addingId === item.id}
              style={{ animationDelay: `${i * 40}ms` }}
            />
          ))}
        </div>
      )}

      {/* Floating bill button */}
      {activeItems.length > 0 && (
        <button
          className="floating-bill-btn"
          onClick={onViewBill}
          id="view-bill-btn"
        >
          <span>🧾</span>
          <span>View Bill</span>
          <span className="floating-bill-count">{activeItems.length}</span>
        </button>
      )}
    </div>
  );
}
