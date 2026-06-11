import { useState } from 'react';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { markOrderAsPaid, removeOrderItem, deleteOrder, updateOrderItemStatus } from '../../services/orderService';
import toast from 'react-hot-toast';
import './AdminOrders.css';

const STATUS_COLORS = {
  pending: 'badge-pending',
  preparing: 'badge-preparing',
  served: 'badge-served',
  removed: 'badge-removed',
};

const STATUS_NEXT = {
  pending: 'preparing',
  preparing: 'served',
  served: null,
};

export default function AdminOrders() {
  const { orders, loading, error, refresh } = useAdminOrders();
  const [processingId, setProcessingId] = useState(null);

  async function handleMarkPaid(orderId) {
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

  async function handleRemoveItem(itemId) {
    setProcessingId(itemId);
    try {
      await removeOrderItem(itemId);
      toast.success('Item removed from order');
      refresh();
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDeleteOrder(orderId) {
    if (!confirm('Delete this entire order? This cannot be undone.')) return;
    setProcessingId(orderId);
    try {
      await deleteOrder(orderId);
      toast.success('Order deleted');
      refresh();
    } catch {
      toast.error('Failed to delete order');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleAdvanceStatus(item) {
    const next = STATUS_NEXT[item.status];
    if (!next) return;
    setProcessingId(item.id);
    try {
      await updateOrderItemStatus(item.id, next);
      toast.success(`Marked as ${next}`);
      refresh();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: 300 }}>
        <div className="spinner" />
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h3>Error loading orders</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <div className="admin-section-header">
        <div>
          <h2>Live Orders</h2>
          <p className="admin-section-sub">{orders.length} active table{orders.length !== 1 ? 's' : ''} ordering</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={refresh} id="refresh-orders-btn">
          🔄 Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 48 }}>
          <div className="empty-state-icon">🎉</div>
          <h3>No active orders</h3>
          <p>All clear! Orders will appear here in real-time.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => {
            const activeItems = order.order_items?.filter(i => i.status !== 'removed') ?? [];
            const isProcessing = processingId === order.id;

            return (
              <div key={order.id} className="order-card animate-fade-in-up">
                {/* Order Header */}
                <div className="order-card-header">
                  <div className="order-table-info">
                    <span className="order-table-icon">🪑</span>
                    <div>
                      <h3 className="order-table-name">{order.table?.name}</h3>
                      <p className="order-time">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="order-card-actions">
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteOrder(order.id)}
                      disabled={isProcessing}
                      id={`delete-order-${order.id}`}
                      title="Delete order"
                    >
                      🗑️
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleMarkPaid(order.id)}
                      disabled={isProcessing}
                      id={`pay-order-${order.id}`}
                    >
                      {isProcessing ? '...' : '✅ Paid'}
                    </button>
                  </div>
                </div>

                <div className="divider" style={{ margin: '8px 0' }} />

                {/* Order Items */}
                <div className="order-items-list">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className={`order-item-row ${item.status === 'removed' ? 'removed' : ''}`}>
                      <div className="order-item-info">
                        <span className="order-item-qty">×{item.quantity}</span>
                        <span className="order-item-name">{item.menu_item?.name}</span>
                      </div>
                      <div className="order-item-right">
                        <span className={`badge ${STATUS_COLORS[item.status]}`}>{item.status}</span>
                        {item.status !== 'removed' && (
                          <>
                            {STATUS_NEXT[item.status] && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleAdvanceStatus(item)}
                                disabled={processingId === item.id}
                                id={`advance-${item.id}`}
                                title={`Mark as ${STATUS_NEXT[item.status]}`}
                              >
                                ▶
                              </button>
                            )}
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={processingId === item.id}
                              id={`remove-item-${item.id}`}
                              title="Remove item (can't prepare)"
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="divider" style={{ margin: '8px 0' }} />

                {/* Total */}
                <div className="order-total-row">
                  <span className="order-items-count">{activeItems.length} item{activeItems.length !== 1 ? 's' : ''}</span>
                  <span className="order-total">Rs.{parseFloat(order.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
