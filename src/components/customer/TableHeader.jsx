import { useState } from 'react';
import { callWaiter } from '../../services/tableService';
import toast from 'react-hot-toast';
import './TableHeader.css';

export default function TableHeader({ table }) {
  const [calling, setCalling] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  async function handleCallWaiter() {
    if (cooldown) return;
    setCalling(true);
    try {
      await callWaiter(table.id);
      toast.success('Waiter has been notified! 🔔', { duration: 4000 });
      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000); // 30s cooldown
    } catch {
      toast.error('Could not call waiter. Try again.');
    } finally {
      setCalling(false);
    }
  }

  return (
    <div className="table-header">
      <div className="table-header-inner">
        <div className="table-info">
          <div>
            <h2 className="table-name">{table.name}</h2>
            <p className="table-sub">Welcome! Browse our menu below</p>
          </div>
        </div>
        <div className="table-header-right">
          <button
            className={`call-waiter-btn ${cooldown ? 'cooldown' : ''}`}
            onClick={handleCallWaiter}
            disabled={calling || cooldown}
            id="call-waiter-btn"
          >
            {calling ? (
              <span>⏳ Calling...</span>
            ) : cooldown ? (
              <span>✅ Waiter called</span>
            ) : (
              <span>🔔 Call Waiter</span>
            )}
          </button>
          <div className="restaurant-badge">
            <span>🍽️</span>
            <span>QR Ordering</span>
          </div>
        </div>
      </div>
    </div>
  );
}
