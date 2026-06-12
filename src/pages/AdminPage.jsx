import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AdminOrders from '../components/admin/AdminOrders';
import AdminMenu from '../components/admin/AdminMenu';
import AdminTables from '../components/admin/AdminTables';
import './AdminPage.css';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) navigate('/admin/login', { replace: true });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate('/admin/login', { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/admin/login');
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;

  if (user.email === import.meta.env.VITE_STAFF_EMAIL) {
    return <Navigate to="/staff" replace />;
  }

  return (
    <div className="admin-page">
      {/* Sidebar / Top nav */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <span className="admin-brand-icon">🍽️</span>
            <span className="admin-brand-name">QR Ordering</span>
            <span className="admin-brand-badge">Admin</span>
          </div>

          <nav className="admin-nav">
            <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`} id="nav-orders">
              📋 Orders
            </NavLink>
            <NavLink to="/admin/menu" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`} id="nav-menu">
              🍽️ Menu
            </NavLink>
            <NavLink to="/admin/tables" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`} id="nav-tables">
              🪑 Tables
            </NavLink>
          </nav>

          <button className="btn btn-ghost btn-sm" onClick={handleLogout} id="logout-btn">
            Sign Out
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-container">
          <Routes>
            <Route index element={<AdminOrders />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="tables" element={<AdminTables />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
