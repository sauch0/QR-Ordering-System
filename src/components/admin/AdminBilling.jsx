import { useState } from 'react';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { markOrderAsPaid, removeOrderItem } from '../../services/orderService';
import toast from 'react-hot-toast';
import './AdminOrders.css';

export default function AdminBilling() {
  const { orders, loading, error, refresh } = useAdminOrders();
  const [processingId, setProcessingId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);

  async function handleMarkPaid(orderId) {
    if (!confirm('Mark this table as paid? This will close the order.')) return;
    setProcessingId(orderId);
    try {
      await markOrderAsPaid(orderId);
      toast.success('Order marked as paid!');
      refresh();
    } catch {
      toast.error('Failed to mark as paid');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRemoveItem(orderId, itemId) {
    if (!confirm('Are you sure you want to remove this item from the bill?')) return;
    setRemovingItemId(itemId);
    try {
      await removeOrderItem(orderId, itemId);
      toast.success('Item removed successfully');
      refresh();
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setRemovingItemId(null);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: 300 }}>
        <div className="spinner" />
        <p>Loading billing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h3>Error loading billing</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <div className="admin-section-header">
        <div>
          <h2>Billing</h2>
          <p className="admin-section-sub">{orders.length} active tables awaiting payment</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={refresh}>
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 48 }}>
          <h3>No unpaid tables</h3>
          <p>All active tables have paid their bills.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => {
            const allItems = order.order_items || [];
            const activeItems = allItems.filter(i => i.status !== 'removed');
            const activeCount = activeItems.length;
            const isProcessing = processingId === order.id;

            return (
              <div key={order.id} className="order-card animate-fade-in-up">
                {/* Order Header */}
                <div className="order-card-header">
                  <div className="order-table-info">
                    <div>
                      <h3 className="order-table-name">{order.table?.name}</h3>
                      <h3 className="order-table-name" style={{ fontSize: '12px' }}>
                        Order ID: {order.id.slice(0, 6)}
                      </h3>
                      <p className="order-time">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divider" style={{ margin: '8px 0' }} />

                {/* Order Items */}
                <div className="order-items-list">
                  {activeItems.map((item) => {
                    const isItemRemoving = removingItemId === item.id;
                    return (
                      <div key={item.id} className="order-item-row">
                        <div className="order-item-info">
                          <span className="order-item-qty">×{item.quantity}</span>
                          <span className="order-item-name">
                            {item.menu_item?.name}
                          </span>
                        </div>
                        <div className="order-item-right">
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'var(--text-primary)'
                          }}>
                            Rs.{(item.quantity * item.unit_price).toFixed(2)}
                          </span>
                          <button
                            className="btn-item-delete"
                            onClick={() => handleRemoveItem(order.id, item.id)}
                            disabled={isItemRemoving}
                            title="Remove item"
                          >
                            {isItemRemoving ? '...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="divider" style={{ margin: '8px 0' }} />

                {/* Total */}
                <div className="order-total-row">
                  <span className="order-items-count">{activeCount} active items</span>
                  <span className="order-total">Total: Rs.{parseFloat(order.total_amount || 0).toFixed(2)}</span>
                </div>

                {/* Bottom Order Actions */}
                <div className="order-card-bottom-actions">
                  <button
                    className="btn btn-success btn-md bill-pay-btn"
                    onClick={() => handleMarkPaid(order.id)}
                    disabled={isProcessing}
                    title="Mark entire table as paid"
                  >
                    {isProcessing ? 'Processing...' : 'Mark Paid'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}