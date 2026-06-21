import { useState, useEffect, useCallback } from 'react';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { getTodaysPaidOrders } from '../../services/orderService';
import { removeOrderItem, updateOrderItemStatus } from '../../services/orderService';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

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

export default function AdminDashboard() {
  const { orders, loading, error, refresh } = useAdminOrders();
  const [processingId, setProcessingId] = useState(null);
  const [todayStats, setTodayStats] = useState({ sales: 0, paidCount: 0 });

  // Fetch today's sales stats
  const fetchTodayStats = useCallback(async () => {
    try {
      const paidOrders = await getTodaysPaidOrders();
      const totalSales = paidOrders.reduce(
        (sum, o) => sum + parseFloat(o.total_amount || 0),
        0
      );
      setTodayStats({ sales: totalSales, paidCount: paidOrders.length });
    } catch {
      // Silently fail — stats are non-critical
    }
  }, []);

  useEffect(() => {
    fetchTodayStats();
  }, [fetchTodayStats]);

  // Re-fetch stats when orders change (e.g. an order gets paid)
  useEffect(() => {
    fetchTodayStats();
  }, [orders, fetchTodayStats]);

  // ── Live order actions ──────────────────────────────────────
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

  // ── Compute live items ──────────────────────────────────────
  const liveItems = [];
  orders.forEach((order) => {
    const activeItems =
      order.order_items?.filter(
        (i) => i.status !== 'removed' && i.status !== 'served'
      ) ?? [];
    activeItems.forEach((item) => {
      liveItems.push({
        ...item,
        order_id: order.id,
        table_name: order.table?.name,
        item_created_at: item.created_at || order.created_at,
      });
    });
  });
  liveItems.sort(
    (a, b) => new Date(a.item_created_at) - new Date(b.item_created_at)
  );

  const pendingCount = liveItems.filter((i) => i.status === 'pending').length;
  const preparingCount = liveItems.filter(
    (i) => i.status === 'preparing'
  ).length;

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: 300 }}>
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h3>Error loading dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard" id="admin-dashboard">
      {/* ── Stats Cards ──────────────────────────────────────── */}
      <div className="dashboard-stats">
        <div className="stat-card" id="stat-active-orders">
          <div className="stat-icon stat-icon-orders">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{orders.length}</span>
            <span className="stat-label">Active Orders</span>
          </div>
        </div>

        <div className="stat-card" id="stat-pending">
          <div className="stat-icon stat-icon-pending">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>

        <div className="stat-card" id="stat-preparing">
          <div className="stat-icon stat-icon-preparing">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{preparingCount}</span>
            <span className="stat-label">Preparing</span>
          </div>
        </div>

        <div className="stat-card stat-card-highlight" id="stat-sales">
          <div className="stat-icon stat-icon-sales">
            <span style={{ fontSize: '18px', fontWeight: '800' }}>Rs.</span>
          </div>
          <div className="stat-content">
            <span className="stat-value">Rs.{todayStats.sales.toFixed(0)}</span>
            <span className="stat-label">Today's Sales ({todayStats.paidCount} orders)</span>
          </div>
        </div>
      </div>

      {/* ── Live Orders ──────────────────────────────────────── */}
      <div className="dashboard-live-section">
        <div className="admin-section-header">
          <div>
            <h2>Live Orders</h2>
            <p className="admin-section-sub">
              {liveItems.length} items to prepare
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={refresh}
            id="refresh-dashboard-btn"
          >
            Refresh
          </button>
        </div>

        {liveItems.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 32 }}>
            <div className="empty-state-icon">🎉</div>
            <h3>All clear!</h3>
            <p>No items need attention right now.</p>
          </div>
        ) : (
          <div className="dashboard-orders-list">
            {liveItems.map((item) => {
              const isProcessing =
                processingId === item.id ||
                processingId === item.order_id;
              return (
                <div
                  key={item.id}
                  className="live-order-card animate-fade-in-up"
                >
                  <div className="live-order-top">
                    <span className="live-order-table">{item.table_name}</span>
                    <span className="live-order-time">
                      {new Date(item.item_created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="live-order-item-name">
                    {item.quantity}× {item.menu_item?.name}
                  </div>
                  {item.notes && (
                    <div className="live-order-notes">Note: {item.notes}</div>
                  )}
                  <div className="live-order-bottom">
                    <span className={`badge ${STATUS_COLORS[item.status]}`}>
                      {item.status}
                    </span>
                    <div className="live-order-actions">
                      {STATUS_NEXT[item.status] && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleAdvanceStatus(item)}
                          disabled={isProcessing}
                        >
                          {STATUS_NEXT[item.status].charAt(0).toUpperCase() +
                            STATUS_NEXT[item.status].slice(1)}
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isProcessing}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
