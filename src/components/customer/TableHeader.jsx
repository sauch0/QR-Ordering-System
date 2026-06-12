import './TableHeader.css';

export default function TableHeader({ table }) {
  return (
    <div className="table-header">
      <div className="table-header-inner">
        <div className="table-info">
          <div>
            <h2 className="table-name">{table.name}</h2>
            <p className="table-sub">Welcome! Browse our menu below</p>
          </div>
        </div>
        <div className="restaurant-badge">
          <span>🍽️</span>
          <span>QR Ordering System</span>
        </div>
      </div>
    </div>
  );
}
