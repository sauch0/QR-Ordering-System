import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-card animate-fade-in-up">
        <div className="not-found-icon">🔍</div>
        <h1>404</h1>
        <p>This page doesn't exist.</p>
        <Link to="/admin" className="btn btn-primary">
          Go to Admin Panel
        </Link>
      </div>
    </div>
  );
}
