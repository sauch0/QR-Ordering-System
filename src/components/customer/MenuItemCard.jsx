import './MenuItemCard.css';

export default function MenuItemCard({ item, onAdd, loading, style }) {
  return (
    <div className="menu-item-card animate-fade-in-up" style={style}>
      {item.image_url && (
        <div className="menu-item-img-wrap">
          <img
            src={item.image_url}
            alt={item.name}
            className="menu-item-img"
            loading="lazy"
          />
        </div>
      )}
      <div className="menu-item-body">
        <h3 className="menu-item-name">{item.name}</h3>
        {item.description && (
          <p className="menu-item-desc">{item.description}</p>
        )}
        <div className="menu-item-footer">
          <span className="menu-item-price">Rs.{parseFloat(item.price).toFixed(2)}</span>
          <button
            className={`add-btn ${loading ? 'loading' : ''}`}
            onClick={() => !loading && onAdd(item)}
            disabled={loading}
            id={`add-item-${item.id}`}
            aria-label={`Add ${item.name}`}
          >
            {loading ? '...' : '+'}
          </button>
        </div>
      </div>
    </div>
  );
}
