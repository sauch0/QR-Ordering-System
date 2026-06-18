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
        <h3>Your order list is empty</h3>
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
          <h2>Your Orders (Not Placed Yet)</h2>
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
                      −
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
                      className="remove-item-btn"
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                    >
                      Remove
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
          >
            {isPlacing ? 'Placing Order...' : `Place Order · Rs.${cartItems.reduce((s, i) => s + i.unit_price * i.quantity, 0).toFixed(2)}`}
          </button>
        </div>
      )}

      {placedItems.length > 0 && (
        <div className="order-section placed-orders-section">
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
                      <span className={`order-status-badge status-${item.status}`}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </div>
                    <div className="order-item-pricing">
                      <span className="order-item-qty-label">×{item.quantity}</span>
                      <span className="order-item-subtotal">Rs.{subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="order-summary-bar">
        <div className="order-total-display">
          <span>Total</span>
          <span className="order-total-amount">Rs.{getTotalAmount().toFixed(2)}</span>
        </div>
        <p className="order-pay-note">Pay at the counter.</p>
      </div>
    </div>
  );
}