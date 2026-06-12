import { useState } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { createMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability } from '../../services/menuService';
import { createCategory, updateCategory, deleteCategory } from '../../services/menuService';
import toast from 'react-hot-toast';
import './AdminMenu.css';

const EMPTY_FORM = {
  name: '', description: '', price: '', categoryId: '', imageUrl: '',
};

const EMPTY_CAT_FORM = {
  name: '', description: '', sortOrder: 0,
};

export default function AdminMenu({ isGuest }) {
  const { items, categories, loading, refresh } = useMenu();

  // Item Modal State
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catForm, setCatForm] = useState(EMPTY_CAT_FORM);
  const [editCategory, setEditCategory] = useState(null);
  const [savingCategory, setSavingCategory] = useState(false);

  const [processingId, setProcessingId] = useState(null);

  // ─── MENU ITEM ACTIONS ─────────────────────────────────────────

  function openAdd() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryId: item.category?.id || '',
      imageUrl: item.image_url || '',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
    setForm(EMPTY_FORM);
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.price) return toast.error('Name and price are required');
    setSaving(true);
    try {
      if (editItem) {
        await updateMenuItem(editItem.id, {
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          categoryId: form.categoryId || null,
          imageUrl: form.imageUrl || null,
        });
        toast.success('Item updated!');
      } else {
        await createMenuItem({
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          categoryId: form.categoryId || null,
          imageUrl: form.imageUrl || null,
        });
        toast.success('Item added!');
      }
      closeForm();
      refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    setProcessingId(item.id);
    try {
      await deleteMenuItem(item.id);
      toast.success('Item deleted');
      refresh();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleToggleAvailability(item) {
    setProcessingId(item.id);
    try {
      await toggleMenuItemAvailability(item.id, !item.is_available);
      toast.success(item.is_available ? 'Item hidden from menu' : 'Item made available');
      refresh();
    } catch {
      toast.error('Failed to update');
    } finally {
      setProcessingId(null);
    }
  }

  // ─── CATEGORY ACTIONS ──────────────────────────────────────────

  function handleCatChange(e) {
    setCatForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleCatSubmit(e) {
    e.preventDefault();
    if (!catForm.name) return toast.error('Category name is required');
    setSavingCategory(true);
    try {
      if (editCategory) {
        await updateCategory(editCategory.id, {
          name: catForm.name,
          description: catForm.description,
          sort_order: parseInt(catForm.sortOrder || 0),
        });
        toast.success('Category updated!');
      } else {
        await createCategory(
          catForm.name,
          catForm.description,
          parseInt(catForm.sortOrder || 0)
        );
        toast.success('Category created!');
      }
      setCatForm(EMPTY_CAT_FORM);
      setEditCategory(null);
      refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to save category');
    } finally {
      setSavingCategory(false);
    }
  }

  function startEditCategory(cat) {
    setEditCategory(cat);
    setCatForm({
      name: cat.name,
      description: cat.description || '',
      sortOrder: cat.sort_order || 0,
    });
  }

  function cancelCatEdit() {
    setEditCategory(null);
    setCatForm(EMPTY_CAT_FORM);
  }

  async function handleCatDelete(cat) {
    if (!confirm(`Delete category "${cat.name}"? Menu items in this category will become uncategorized.`)) return;
    setProcessingId(cat.id);
    try {
      await deleteCategory(cat.id);
      toast.success('Category deleted');
      refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to delete category');
    } finally {
      setProcessingId(null);
    }
  }

  // Group items by category
  const grouped = {};
  for (const item of items) {
    const catName = item.category?.name ?? 'Uncategorized';
    if (!grouped[catName]) grouped[catName] = [];
    grouped[catName].push(item);
  }

  // Also include empty categories so we see them in the UI
  for (const cat of categories) {
    if (!grouped[cat.name]) {
      grouped[cat.name] = [];
    }
  }

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-menu">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h2>Menu & Categories</h2>
          <p className="admin-section-sub">{items.length} items across {categories.length} categories</p>
        </div>
        <div className="admin-header-buttons">
          {!isGuest && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowCategoryModal(true)} id="manage-cats-btn">
                📁 Manage Categories
              </button>
              <button className="btn btn-primary" onClick={openAdd} id="add-item-btn">
                + Add Item
              </button>
            </>
          )}
        </div>
      </div>

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCategoryModal(false)}>
          <div className="modal-card category-modal animate-fade-in-up">
            <div className="modal-header">
              <h3>📁 Manage Categories</h3>
              <button className="modal-close" onClick={() => { setShowCategoryModal(false); cancelCatEdit(); }}>✕</button>
            </div>

            {/* Category Form */}
            <form onSubmit={handleCatSubmit} className="category-form card">
              <h4>{editCategory ? '✏️ Edit Category' : '➕ Add New Category'}</h4>
              <div className="category-form-fields">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    name="name"
                    className="form-input"
                    placeholder="e.g. Desserts"
                    value={catForm.name}
                    onChange={handleCatChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sort Order</label>
                  <input
                    name="sortOrder"
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={catForm.sortOrder}
                    onChange={handleCatChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  name="description"
                  className="form-input"
                  placeholder="e.g. Sweet treats and cakes"
                  value={catForm.description}
                  onChange={handleCatChange}
                />
              </div>
              <div className="category-form-actions">
                {editCategory && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={cancelCatEdit}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn btn-primary btn-sm" disabled={savingCategory}>
                  {savingCategory ? 'Saving...' : (editCategory ? 'Update' : 'Add Category')}
                </button>
              </div>
            </form>

            {/* Categories List */}
            <div className="categories-manager-list">
              <h4>Existing Categories</h4>
              {categories.length === 0 ? (
                <p className="no-categories-text">No categories created yet.</p>
              ) : (
                <div className="categories-table">
                  {categories.map((cat) => (
                    <div key={cat.id} className="category-manager-row">
                      <div className="category-manager-info">
                        <span className="category-manager-sort">Order: {cat.sort_order || 0}</span>
                        <span className="category-manager-name">{cat.name}</span>
                        {cat.description && (
                          <span className="category-manager-desc">— {cat.description}</span>
                        )}
                      </div>
                      <div className="category-manager-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => startEditCategory(cat)}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCatDelete(cat)}
                          disabled={processingId === cat.id}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeForm()}>
          <div className="modal-card animate-fade-in-up">
            <div className="modal-header">
              <h3>{editItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button className="modal-close" onClick={closeForm}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="menu-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    name="name"
                    className="form-input"
                    placeholder="e.g. Grilled Chicken"
                    value={form.name}
                    onChange={handleChange}
                    required
                    id="item-name-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Price *</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="0.00"
                    value={form.price}
                    onChange={handleChange}
                    required
                    id="item-price-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  name="categoryId"
                  className="form-select"
                  value={form.categoryId}
                  onChange={handleChange}
                  id="item-category-select"
                >
                  <option value="">No category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  className="form-input"
                  placeholder="Short description..."
                  rows={2}
                  value={form.description}
                  onChange={handleChange}
                  id="item-desc-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  name="imageUrl"
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={handleChange}
                  id="item-image-input"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} id="save-item-btn">
                  {saving ? 'Saving...' : (editItem ? 'Save Changes' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Items by Category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <h3>No menu items yet</h3>
          <p>Click "Add Item" to create your first menu item.</p>
        </div>
      ) : (
        categories.map(cat => {
          const catItems = grouped[cat.name] || [];
          return (
            <div key={cat.id} className="menu-category-section">
              <h3 className="menu-category-title">
                {cat.name}
                {cat.description && <span className="cat-desc-subtitle">({cat.description})</span>}
              </h3>
              {catItems.length === 0 ? (
                <p className="no-items-in-cat">No items in this category yet.</p>
              ) : (
                <div className="menu-admin-grid">
                  {catItems.map(item => (
                    <div key={item.id} className={`menu-admin-card ${!item.is_available ? 'unavailable' : ''}`}>
                      {item.image_url && (
                        <div className="menu-admin-img-wrap">
                          <img src={item.image_url} alt={item.name} />
                        </div>
                      )}
                      <div className="menu-admin-info">
                        <div className="menu-admin-top">
                          <span className="menu-admin-name">{item.name}</span>
                          <span className="menu-admin-price">Rs.{parseFloat(item.price).toFixed(2)}</span>
                        </div>
                        {item.description && (
                          <p className="menu-admin-desc">{item.description}</p>
                        )}
                        {!isGuest && (
                          <div className="menu-admin-actions">
                            <button
                              className={`btn btn-sm ${item.is_available ? 'btn-ghost' : 'btn-success'}`}
                              onClick={() => handleToggleAvailability(item)}
                              disabled={processingId === item.id}
                              id={`toggle-${item.id}`}
                            >
                              {item.is_available ? '🙈 Hide' : '👁 Show'}
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEdit(item)}
                              id={`edit-${item.id}`}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(item)}
                              disabled={processingId === item.id}
                              id={`delete-${item.id}`}
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Uncategorized Section if any items exist outside categories */}
      {grouped['Uncategorized'] && grouped['Uncategorized'].length > 0 && (
        <div className="menu-category-section">
          <h3 className="menu-category-title">Uncategorized</h3>
          <div className="menu-admin-grid">
            {grouped['Uncategorized'].map(item => (
              <div key={item.id} className={`menu-admin-card ${!item.is_available ? 'unavailable' : ''}`}>
                {item.image_url && (
                  <div className="menu-admin-img-wrap">
                    <img src={item.image_url} alt={item.name} />
                  </div>
                )}
                <div className="menu-admin-info">
                  <div className="menu-admin-top">
                    <span className="menu-admin-name">{item.name}</span>
                    <span className="menu-admin-price">Rs.{parseFloat(item.price).toFixed(2)}</span>
                  </div>
                  {item.description && (
                    <p className="menu-admin-desc">{item.description}</p>
                  )}
                  {!isGuest && (
                    <div className="menu-admin-actions">
                      <button
                        className={`btn btn-sm ${item.is_available ? 'btn-ghost' : 'btn-success'}`}
                        onClick={() => handleToggleAvailability(item)}
                        disabled={processingId === item.id}
                        id={`toggle-${item.id}`}
                      >
                        {item.is_available ? '🙈 Hide' : '👁 Show'}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEdit(item)}
                        id={`edit-${item.id}`}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(item)}
                        disabled={processingId === item.id}
                        id={`delete-${item.id}`}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
