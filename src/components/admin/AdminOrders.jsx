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

  const allItems = [];
  orders.forEach((order) => {
    // Only show items that need kitchen attention (pending or preparing)
    const activeItems = order.order_items?.filter(i => i.status !== 'removed' && i.status !== 'served') ?? [];
    activeItems.forEach((item) => {
      allItems.push({
        ...item,
        order_id: order.id,
        table_name: order.table?.name,
        total_amount: order.total_amount,
        item_created_at: item.created_at || order.created_at
      });
    });
  });

  // Sort items FIFO (oldest first)
  allItems.sort((a, b) => new Date(a.item_created_at) - new Date(b.item_created_at));

  return (
    <div className="admin-orders">
      <div className="admin-section-header">
        <div>
          <h2>Live Orders</h2>
          <p className="admin-section-sub">{allItems.length} items to prepare</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={refresh} id="refresh-orders-btn">
          Refresh
        </button>
      </div>

      {allItems.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 48 }}>
          <div className="empty-state-icon">🎉</div>
          <h3>No active orders</h3>
          <p>All clear! Orders will appear here in real-time.</p>
        </div>
      ) : (
        <div className="orders-list">
          {allItems.map((item) => {
            const isProcessing = processingId === item.id || processingId === item.order_id;
            return (
              <div key={item.id} className="order-item-card animate-fade-in-up" style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className="badge" style={{ background: '#000', color: '#fff' }}>
                      {item.table_name}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(item.item_created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>
                    {item.quantity}x {item.menu_item?.name}
                  </div>
                  {item.notes && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Note: {item.notes}</div>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`badge ${STATUS_COLORS[item.status]}`}>{item.status}</span>
                  
                  {STATUS_NEXT[item.status] && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAdvanceStatus(item)}
                      disabled={isProcessing}
                      title={`Mark as ${STATUS_NEXT[item.status]}`}
                    >
                      {STATUS_NEXT[item.status].charAt(0).toUpperCase() + STATUS_NEXT[item.status].slice(1)}
                    </button>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={isProcessing}
                    title="Remove item"
                  >
                    Remove
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
