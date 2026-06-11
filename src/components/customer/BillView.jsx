import { useOrder } from '../../context/OrderContext';
import './BillView.css';

const STATUS_LABEL = {
  pending: '⏳ Pending',
  preparing: '👨‍🍳 Preparing',
  served: '✅ Served',
  removed: '❌ Removed',
};

export default function BillView() {
  const { order, activeItems, totalAmount, loading } = useOrder();

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: 300 }}>
        <div className="spinner" />
        <p>Loading bill...</p>
      </div>
    );
  }

  if (order?.status === 'paid') {
    return (
      <div className="bill-paid-screen animate-fade-in">
        <div className="bill-paid-icon">✅</div>
        <h2>Bill Paid!</h2>
        <p>Thank you for dining with us. Come again soon!</p>
      </div>
    );
  }

  if (!activeItems.length) {
    return (
      <div className="empty-state" style={{ paddingTop: 60 }}>
        <div className="empty-state-icon">🛒</div>
        <h3>Your bill is empty</h3>
        <p>Add items from the menu to get started</p>
      </div>
    );
  }

  return (
    <div className="bill-view animate-fade-in">
      <div className="bill-header">
        <h2>Your Order</h2>
        <span className="badge badge-open">Open</span>
      </div>

      <div className="bill-items">
        {activeItems.map((item) => (
          <BillItem key={item.id} item={item} />
        ))}
      </div>

      <div className="bill-summary">
        <div className="divider" />
        <div className="bill-total-row">
          <span className="bill-total-label">Total</span>
          <span className="bill-total-amount">Rs.{totalAmount.toFixed(2)}</span>
        </div>

        <div className="bill-footer-note">
          <span>💳</span>
          <span>Please pay at the counter. The admin will mark your bill as paid.</span>
        </div>
      </div>
    </div>
  );
}

function BillItem({ item }) {
  const subtotal = item.unit_price * item.quantity;

  return (
    <div className={`bill-item ${item.status === 'removed' ? 'removed' : ''}`}>
      <div className="bill-item-info">
        <p className="bill-item-name">{item.menu_item?.name ?? 'Item'}</p>
        <span className={`badge badge-${item.status}`}>{STATUS_LABEL[item.status]}</span>
      </div>
      <div className="bill-item-right">
        <span className="bill-item-qty">×{item.quantity}</span>
        <span className="bill-item-price">Rs.{subtotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
