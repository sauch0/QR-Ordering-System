import { useState, useEffect } from 'react';
import { getPaidOrders } from '../../services/orderService';
import './AdminOrders.css';

export default function AdminPaidOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadOrders() {
    try {
      const data = await getPaidOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: 300 }}>
        <div className="spinner" />
        <p>Loading paid orders...</p>
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
          <h2>Paid Orders</h2>
          <p className="admin-section-sub">History of completed and paid orders</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadOrders}>
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 48 }}>
          <div className="empty-state-icon">📝</div>
          <h3>No paid orders yet</h3>
          <p>Orders marked as paid will appear here.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => {
            const allItems = order.order_items || [];
            const activeCount = allItems.filter(i => i.status !== 'removed').length;
            return (
              <div key={order.id} className="order-card animate-fade-in-up">
                <div className="order-card-header">
                  <div className="order-table-info">
                    <div>
                      <h3 className="order-table-name">
                        Order ID: {order.id.slice(0, 6)}
                      </h3>
                      <p className="order-time">
                        Ordered: {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="order-time" style={{ color: 'var(--success)', fontWeight: 600 }}>
                        Paid: {new Date(order.paid_at).toLocaleDateString()} {new Date(order.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="order-card-actions">
                    <span className="badge badge-paid">Paid</span>
                  </div>
                </div>

                <div className="divider" style={{ margin: '8px 0' }} />

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
                        </div>
                        {/* <div className="order-item-right">
                          <span className={`badge ${isRemoved ? 'badge-removed' : 'badge-served'}`}>{item.status}</span>
                        </div> */}
                      </div>
                    );
                  })}
                </div>

                <div className="divider" style={{ margin: '8px 0' }} />

                <div className="order-total-row">
                  {/* <span className="order-items-count">{activeCount} active items</span> */}
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
