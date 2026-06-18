import { useState } from 'react';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { markOrderAsPaid } from '../../services/orderService';
import toast from 'react-hot-toast';
import './AdminOrders.css';

export default function AdminBilling() {
  const { orders, loading, error, refresh } = useAdminOrders();
  const [processingId, setProcessingId] = useState(null);

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
          <div className="empty-state-icon">🎉</div>
          <h3>No unpaid tables</h3>
          <p>All active tables have paid their bills.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => {
            const allItems = order.order_items || [];
            const activeCount = allItems.filter(i => i.status !== 'removed').length;
            const isProcessing = processingId === order.id;

            return (
              <div key={order.id} className="order-card animate-fade-in-up">
                {/* Order Header */}
                <div className="order-card-header">
                  <div className="order-table-info">
                    {/* <span className="order-table-icon">🪑</span> */}
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
                  <div className="order-card-actions">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleMarkPaid(order.id)}
                      disabled={isProcessing}
                      title="Mark entire table as paid"
                    >
                      {isProcessing ? 'Processing...' : 'Mark Paid'}
                    </button>
                  </div>
                </div>

                <div className="divider" style={{ margin: '8px 0' }} />

                {/* Order Items */}
                <div className="order-items-list">
                  {allItems.map((item) => {
                    const isRemoved = item.status === 'removed';
                    return (
                      <div key={item.id} className={`order-item-row ${isRemoved ? 'removed' : ''}`}>
                        <div className="order-item-info">
                          <span className="order-item-qty">×{item.quantity}</span>
                          <span className="order-item-name" style={isRemoved ? { textDecoration: 'line-through', color: 'var(--text-muted)' } : {}}>
                            {item.menu_item?.name}
                          </span>
                          {isRemoved && (
                            <span className="badge badge-removed" style={{ marginLeft: '6px', padding: '2px 4px', fontSize: '10px' }}>Removed</span>
                          )}
                        </div>
                        <div className="order-item-right">
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: isRemoved ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: isRemoved ? 'line-through' : 'none'
                          }}>
                            Rs.{(item.quantity * item.unit_price).toFixed(2)}
                          </span>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
