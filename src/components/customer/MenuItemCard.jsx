import './MenuItemCard.css';

export default function MenuItemCard({ item, onAdd, onView, loading, style, quantity = 1, onQuantityChange }) {
  return (
    <div 
      className="menu-item-card animate-fade-in-up" 
      style={style}
      onClick={onView}
      role="button"
      tabIndex={0}
    >
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
          <div className="menu-item-actions" onClick={e => e.stopPropagation()}>
            {onQuantityChange && (
              <div className="card-qty-selector">
                <button
                  className="card-qty-btn"
                  onClick={() => onQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="card-qty-display">{quantity}</span>
                <button
                  className="card-qty-btn"
                  onClick={() => onQuantityChange(quantity + 1)}
                  disabled={quantity >= 10}
                >
                  +
                </button>
              </div>
            )}
            <button
              className={`add-btn ${loading ? 'loading' : ''}`}
              onClick={() => {
                if (!loading) onAdd(item);
              }}
              disabled={loading}
              id={`add-item-${item.id}`}
              aria-label={`Add ${item.name}`}
            >
              {loading ? '...' : '+'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
