import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AdminOrders from '../components/admin/AdminOrders';
import AdminMenu from '../components/admin/AdminMenu';
import AdminTables from '../components/admin/AdminTables';
import './AdminPage.css'; // reuse styles

export default function GuestPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function initGuest() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email === 'guest@restaurant.com') {
        setUser(session.user);
        setLoading(false);
        return;
      }

      // Auto login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'guest@restaurant.com',
        password: 'guestpassword' // User must create this in Supabase
      });

      if (error) {
        setErrorMsg('Guest login failed. Please ensure guest@restaurant.com exists with password "guestpassword".');
        setLoading(false);
      } else {
        setUser(data.session?.user);
        setLoading(false);
      }
    }

    initGuest();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email === 'guest@restaurant.com') {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/admin/login');
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Logging in as guest...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="loading-screen">
        <div style={{ color: '#ef4444', textAlign: 'center', maxWidth: 400 }}>
          <h3>Guest Access Error</h3>
          <p>{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <span className="admin-brand-icon">🍽️</span>
            <span className="admin-brand-name">QR Ordering</span>
            <span className="admin-brand-badge" style={{ backgroundColor: '#10b981' }}>Guest Mode</span>
          </div>

          <nav className="admin-nav">
            <NavLink to="/guest" end className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`} id="nav-orders">
              📋 Orders
            </NavLink>
            <NavLink to="/guest/menu" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`} id="nav-menu">
              🍽️ Menu
            </NavLink>
            <NavLink to="/guest/tables" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`} id="nav-tables">
              🪑 Tables
            </NavLink>
          </nav>

          <button className="btn btn-ghost btn-sm" onClick={handleLogout} id="logout-btn">
            Exit Guest
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-container">
          <Routes>
            <Route index element={<AdminOrders isGuest={true} />} />
            <Route path="menu" element={<AdminMenu isGuest={true} />} />
            <Route path="tables" element={<AdminTables isGuest={true} />} />
            <Route path="*" element={<Navigate to="/guest" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
