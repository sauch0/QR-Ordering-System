import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function QrRedirect() {
  const { tableId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Set an expiration timestamp (e.g., valid for 4 hours)
    const expiresAt = Date.now() + 4 * 60 * 60 * 1000;
    
    // Store in localStorage so it survives tab closes within the session
    localStorage.setItem(`table_auth_${tableId}`, expiresAt.toString());

    // Redirect to the actual table menu page, replacing history
    // This ensures the /qr/ URL does not end up in the user's browser history
    navigate(`/table/${tableId}`, { replace: true });
  }, [tableId, navigate]);

  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Verifying QR Code...</p>
    </div>
  );
}
