import { useEffect, useState, useRef, useCallback } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AdminOrders from '../components/admin/AdminOrders';
import AdminMenu from '../components/admin/AdminMenu';
import AdminTables from '../components/admin/AdminTables';
import AdminBilling from '../components/admin/AdminBilling';
import AdminPaidOrders from '../components/admin/AdminPaidOrders';
import toast from 'react-hot-toast';
import './AdminPage.css';

const STAFF_EMAIL = import.meta.env.VITE_STAFF_EMAIL;

export default function StaffPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const channelRef = useRef(null);
  const navigate = useNavigate();

  // ── Fetch unresolved waiter calls ────────────────────────────
  const fetchWaiterCalls = useCallback(async () => {
    const { data, error } = await supabase
      .from('waiter_calls')
      .select('*, table:tables(name, table_number)')
      .eq('resolved', false)
      .order('created_at', { ascending: true });

    if (!error) {
      setWaiterCalls(data ?? []);
    }
  }, []);

  // ── Dismiss a waiter call ────────────────────────────────────
  async function dismissCall(callId) {
    await supabase
      .from('waiter_calls')
      .update({ resolved: true })
      .eq('id', callId);

    setWaiterCalls(prev => prev.filter(c => c.id !== callId));
  }

  // ── Authentication Check ─────────────────────────────────────
  useEffect(() => {
    async function initStaff() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.email === STAFF_EMAIL) {
        setUser(session.user);
      } else {
        setUser(null);
      }

      setLoading(false);
    }

    initStaff();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email === STAFF_EMAIL) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Realtime waiter-calls listener ───────────────────────────
  useEffect(() => {
    if (!user) return;

    fetchWaiterCalls();

    channelRef.current = supabase
      .channel('staff-waiter-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'waiter_calls',
        },
        async payload => {
          const { data: table } = await supabase
            .from('tables')
            .select('name, table_number')
            .eq('id', payload.new.table_id)
            .single();

          const callWithTable = {
            ...payload.new,
            table,
          };

          setWaiterCalls(prev => [...prev, callWithTable]);

          toast(`🔔 Waiter requested at ${table?.name ?? 'a table'}!`, {
            duration: 6000,
            style: {
              background: '#000000',
              color: '#ffffff',
              fontWeight: '700',
              borderRadius: '12px',
            },
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'waiter_calls',
          filter: 'resolved=eq.true',
        },
        payload => {
          setWaiterCalls(prev =>
            prev.filter(call => call.id !== payload.new.id)
          );
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, fetchWaiterCalls]);

  // ── Sign Out ─────────────────────────────────────────────────
  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  }

  // ── Loading Screen ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: '#64748b' }}>
          Checking staff access...
        </p>
      </div>
    );
  }

  // ── Protect Route ────────────────────────────────────────────
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <span className="admin-brand-icon">🍽️</span>
            <span className="admin-brand-name">QR Ordering</span>

            <span
              className="admin-brand-badge"
              style={{
                backgroundColor: '#28c014',
                border: 'none',
                color: '#fff',
              }}
            >
              Staff
            </span>
          </div>

          <nav className="admin-nav">
            <NavLink
              to="/staff"
              end
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? 'active' : ''}`
              }
              id="nav-orders"
            >
              Orders
            </NavLink>

            <NavLink
              to="/staff/menu"
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? 'active' : ''}`
              }
              id="nav-menu"
            >
              Menu
            </NavLink>

            <NavLink
              to="/staff/tables"
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? 'active' : ''}`
              }
              id="nav-tables"
            >
              Tables
            </NavLink>

            <NavLink
              to="/staff/billing"
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? 'active' : ''}`
              }
              id="nav-billing"
            >
              Billing
            </NavLink>

            <NavLink
              to="/staff/paid"
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? 'active' : ''}`
              }
              id="nav-paid"
            >
              Paid
            </NavLink>
          </nav>

          <button
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
            id="logout-btn"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Waiter Call Alerts */}
      {waiterCalls.length > 0 && (
        <div className="waiter-call-bar">
          {waiterCalls.map(call => (
            <div key={call.id} className="waiter-call-item">
              <span className="waiter-call-bell">🔔</span>

              <span className="waiter-call-text">
                <strong>{call.table?.name ?? 'A table'}</strong> is calling for
                a waiter
              </span>

              <button
                className="waiter-call-dismiss"
                onClick={() => dismissCall(call.id)}
                title="Mark as handled"
              >
                ✓ Done
              </button>
            </div>
          ))}
        </div>
      )}

      <main className="admin-main">
        <div className="admin-container">
          <Routes>
            <Route index element={<AdminOrders isGuest={true} />} />
            <Route path="menu" element={<AdminMenu isGuest={true} />} />
            <Route path="tables" element={<AdminTables isGuest={true} />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="paid" element={<AdminPaidOrders />} />
            <Route path="*" element={<Navigate to="/staff" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}