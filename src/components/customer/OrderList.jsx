import { useState } from 'react';
import { useOrder } from '../../context/OrderContext';
import './OrderList.css';

import toast from 'react-hot-toast';

const STATUS_LABEL = {
  pending: '⏳ Pending',
  preparing: '👨‍🍳 Preparing',
  served: '✅ Served',
  removed: '❌ Removed',
};

export default function OrderList({ onOrderPlaced }) {
  const { activeItems, removeItem, deleteItem, updateQuantity, placeOrder } = useOrder();
  const [isPlacing, setIsPlacing] = useState(false);

  const handleRemoveItem = (itemId) => {
    const item = activeItems.find(i => i.id === itemId);
    if (item && item.quantity === 1) {
      deleteItem(itemId);
    } else {
      updateQuantity(itemId, item.quantity - 1);
    }
  };

  const handleAddItem = (itemId) => {
    const item = activeItems.find(i => i.id === itemId);
    if (item) {
      const newQuantity = Math.min(10, item.quantity + 1);
      updateQuantity(itemId, newQuantity);
    }
  };

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    try {
      await placeOrder();
      toast.success('Order placed successfully!');
      if (onOrderPlaced) onOrderPlaced();
    } catch (err) {
      toast.error('Failed to place order');
    } finally {
      setIsPlacing(false);
    }
  };

  const getTotalAmount = () => {
    return activeItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  };

  if (activeItems.length === 0) {
    return (
      <div className="order-list-empty" style={{ paddingTop: '60px' }}>
        <div className="empty-state-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add items from the menu to get started</p>
      </div>
    );
  }

  const cartItems = activeItems.filter(i => i.status === 'local_cart');
  const placedItems = activeItems.filter(i => i.status !== 'local_cart' && i.status !== 'removed');

  return (
    <div className="order-list animate-fade-in">
      
      {cartItems.length > 0 && (
        <div className="order-section">
          <h2>Cart (Not Placed Yet)</h2>
          <div className="order-items">
            {cartItems.map((item) => (
              <div key={item.id} className="order-item">
                {item.menu_item?.image_url && (
                  <img 
                    src={item.menu_item.image_url} 
                    alt={item.menu_item.name} 
                    className="order-item-img" 
                  />
                )}
                <div className="order-item-content">
                  <div className="order-item-info">
                    <h3 className="order-item-name">{item.menu_item?.name ?? 'Item'}</h3>
                    <p className="order-item-price">Rs.{item.unit_price.toFixed(2)}</p>
                  </div>
                  <div className="order-item-controls">
                    <button
                      className="quantity-btn"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => handleAddItem(item.id)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    <button
                      className="remove-btn"
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="place-order-btn"
            onClick={handlePlaceOrder}
            disabled={isPlacing}
            style={{ marginTop: '16px' }}
          >
            {isPlacing ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      )}

      {placedItems.length > 0 && (
        <div className="order-section" style={{ marginTop: '32px' }}>
          <h2>Placed Orders</h2>
          <div className="order-items">
            {placedItems.map((item) => {
              const subtotal = item.unit_price * item.quantity;
              return (
                <div key={item.id} className="order-item placed-item">
                  {item.menu_item?.image_url && (
                    <img 
                      src={item.menu_item.image_url} 
                      alt={item.menu_item.name} 
                      className="order-item-img" 
                    />
                  )}
                  <div className="order-item-content">
                    <div className="order-item-info">
                      <h3 className="order-item-name">{item.menu_item?.name ?? 'Item'}</h3>
                      <span className={`badge badge-${item.status}`} style={{ display: 'inline-block', marginTop: '4px', fontSize: '12px', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </div>
                    <div className="order-item-right" style={{ textAlign: 'right' }}>
                      <span className="bill-item-qty" style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)' }}>×{item.quantity}</span>
                      <span className="bill-item-price" style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Rs.{subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="order-summary" style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="order-total" style={{ fontSize: '18px', fontWeight: 'bold' }}>
          <span>Total: </span>
          <span style={{ color: 'var(--accent)' }}>Rs.{getTotalAmount().toFixed(2)}</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Pay at the counter.</p>
      </div>
    </div>
  );
}