import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import CustomerPage from './pages/CustomerPage';
import AdminPage from './pages/AdminPage';
import AdminLogin from './pages/AdminLogin';
import StaffPage from './pages/StaffPage';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Customer routes */}
        <Route path="/table/:tableNumber" element={<CustomerPage />} />

        {/* Admin routes */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="/staff/*" element={<StaffPage />} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
