import { useState } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { useOrder } from '../../context/OrderContext';
import toast from 'react-hot-toast';
import MenuItemCard from './MenuItemCard';
import OrderList from './OrderList';
import './MenuView.css';

export default function MenuView({ onViewBill }) {
  const { items, categories, loading, error } = useMenu({ availableOnly: true });
  const { activeItems, addItem } = useOrder();
  const [activeCategory, setActiveCategory] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);

  const selectedCategory = activeCategory ?? categories[0]?.id;
  const filteredItems = items.filter(item =>
    !selectedCategory || item.category?.id === selectedCategory
  );

  const getQuantity = (itemId) => quantities[itemId] || 1;

  const handleQuantityChange = (itemId, newQuantity) => {
    const quantity = Math.max(1, Math.min(10, parseInt(newQuantity) || 1));
    setQuantities(prev => ({ ...prev, [itemId]: quantity }));
  };

  async function handleAddItem(menuItem) {
    setAddingId(menuItem.id);
    try {
      const quantity = getQuantity(menuItem.id);
      await addItem(menuItem, quantity);
      toast.success(`${quantity}x ${menuItem.name} added!`);
      // Reset quantity after adding
      setQuantities(prev => ({ ...prev, [menuItem.id]: 1 }));
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
        <>
          <div className="menu-grid">
            {filteredItems.map((item, i) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAdd={handleAddItem}
                onView={() => setSelectedItem(item)}
                loading={addingId === item.id}
                style={{ animationDelay: `${i * 40}ms` }}
                quantity={getQuantity(item.id)}
                onQuantityChange={(newQty) => handleQuantityChange(item.id, newQty)}
              />
            ))}
          </div>
        </>
      )}

      {/* Floating bill button - only show when there are items and we're not on the bill tab */}
      {activeItems.length > 0 && (
        <button
          className="floating-bill-btn"
          onClick={onViewBill}
          id="view-bill-btn"
        >
          <span>🛒</span>
          <span>View Orders</span>
          <span className="floating-bill-count">{activeItems.length}</span>
        </button>
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content item-details-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedItem(null)}>×</button>
            {selectedItem.image_url && (
              <img src={selectedItem.image_url} alt={selectedItem.name} className="modal-item-img" />
            )}
            <div className="modal-item-info">
              <h2>{selectedItem.name}</h2>
              <p className="modal-item-price">Rs.{parseFloat(selectedItem.price).toFixed(2)}</p>
              {selectedItem.description && (
                <p className="modal-item-desc">{selectedItem.description}</p>
              )}
              <div className="modal-item-actions">
                <div className="quantity-selector modal-qty">
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(selectedItem.id, getQuantity(selectedItem.id) - 1)}
                    disabled={getQuantity(selectedItem.id) <= 1}
                  >
                    -
                  </button>
                  <span className="quantity-display">{getQuantity(selectedItem.id)}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(selectedItem.id, getQuantity(selectedItem.id) + 1)}
                    disabled={getQuantity(selectedItem.id) >= 10}
                  >
                    +
                  </button>
                </div>
                <button 
                  className="add-to-cart-btn"
                  onClick={() => {
                    handleAddItem(selectedItem);
                    setSelectedItem(null);
                  }}
                  disabled={addingId === selectedItem.id}
                >
                  {addingId === selectedItem.id ? 'Adding...' : 'Add to Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
