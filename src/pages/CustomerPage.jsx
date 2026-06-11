import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { OrderProvider } from '../context/OrderContext';
import { getTableByNumber } from '../services/tableService';
import MenuView from '../components/customer/MenuView';
import OrderList from '../components/customer/OrderList';
import TableHeader from '../components/customer/TableHeader';
import './CustomerPage.css';

export default function CustomerPage() {
  const { tableNumber } = useParams();
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [isScanned, setIsScanned] = useState(false);

  useEffect(() => {
    // 1. Check scan validation
    const params = new URLSearchParams(window.location.search);
    const hasScanParam = params.get('scan') === 'true';
    const hasSessionScan = sessionStorage.getItem(`table_scanned_${tableNumber}`) === 'true';

    if (hasScanParam) {
      sessionStorage.setItem(`table_scanned_${tableNumber}`, 'true');
      setIsScanned(true);
      // Clean query parameters from URL bar
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (hasSessionScan) {
      setIsScanned(true);
    } else {
      setIsScanned(false);
    }
  }, [tableNumber]);

  useEffect(() => {
    if (!isScanned) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getTableByNumber(parseInt(tableNumber))
      .then(setTable)
      .catch(() => setError('Table not found. Please scan the correct QR code.'))
      .finally(() => setLoading(false));
  }, [tableNumber, isScanned]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading your table...</p>
      </div>
    );
  }

  // If the user did not scan the physical QR code (no scan query param or session storage flag)
  if (!isScanned) {
    return (
      <div className="loading-screen customer-page">
        <div className="customer-bg-gradient" />
        <div className="empty-state animate-fade-in-up">
          <div className="empty-state-icon" style={{ fontSize: '64px', marginBottom: '8px' }}>📱</div>
          <h3 style={{ fontSize: '20px', fontWeight: '800' }}>QR Scan Required</h3>
          <p style={{ maxWidth: '280px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Please scan the physical QR code located on your table to view the menu and place orders.
          </p>
        </div>
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="loading-screen">
        <div className="empty-state">
          <div className="empty-state-icon">🚫</div>
          <h3>Table Not Found</h3>
          <p>{error || 'Please scan the correct QR code.'}</p>
        </div>
      </div>
    );
  }

  return (
    <OrderProvider tableId={table.id}>
      <div className="page-container customer-page">
        {/* Background gradient */}
        <div className="customer-bg-gradient" />

        <TableHeader table={table} />

        {/* Tab Navigation */}
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
            id="tab-menu"
          >
            🍽️ Menu
          </button>
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            id="tab-orders"
          >
            🛒 My Orders
          </button>
        </div>

        {/* Content */}
        <div className="customer-content">
          {activeTab === 'menu' ? (
            <MenuView onViewBill={() => setActiveTab('orders')} />
          ) : (
            <OrderList />
          )}
        </div>
      </div>
    </OrderProvider>
  );
}
