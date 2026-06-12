import { useState, useEffect } from 'react';
import { getTables, createTable, deleteTable, updateTable } from '../../services/tableService';
import toast from 'react-hot-toast';
import './AdminTables.css';

export default function AdminTables({ isGuest }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [adding, setAdding] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  async function loadTables() {
    try {
      const data = await getTables();
      setTables(data);
    } catch (err) {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTables(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newTableNumber) return toast.error('Table number required');
    setAdding(true);
    try {
      const name = newTableName || `Table ${newTableNumber}`;
      await createTable(parseInt(newTableNumber), name);
      setNewTableNumber('');
      setNewTableName('');
      toast.success('Table added!');
      loadTables();
    } catch (err) {
      toast.error(err.message || 'Failed to add table');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(table) {
    if (!confirm(`Delete ${table.name}? All orders for this table will be removed.`)) return;
    setProcessingId(table.id);
    try {
      await deleteTable(table.id);
      toast.success('Table deleted');
      loadTables();
    } catch {
      toast.error('Failed to delete table');
    } finally {
      setProcessingId(null);
    }
  }

  // Generate QR URL
  function getQrUrl(table) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/table/${table.table_number}?scan=true`;
  }

  function copyQrLink(table) {
    navigator.clipboard.writeText(getQrUrl(table))
      .then(() => toast.success('Link copied!'))
      .catch(() => toast.error('Failed to copy'));
  }

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-tables">
      <div className="admin-section-header">
        <div>
          <h2>Tables</h2>
          <p className="admin-section-sub">{tables.length} tables configured</p>
        </div>
      </div>

      {/* Add Table Form */}
      {!isGuest && (
        <div className="card add-table-form">
          <h3 className="add-table-title">Add New Table</h3>
          <form onSubmit={handleAdd} className="add-table-row">
            <div className="form-group" style={{ flex: '0 0 100px' }}>
              <label className="form-label">Table #</label>
              <input
                type="number"
                min="1"
                className="form-input"
                placeholder="e.g. 7"
                value={newTableNumber}
                onChange={e => setNewTableNumber(e.target.value)}
                id="new-table-number"
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Name (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Window Seat"
                value={newTableName}
                onChange={e => setNewTableName(e.target.value)}
                id="new-table-name"
              />
            </div>
            <div className="form-group" style={{ alignSelf: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={adding} id="add-table-btn">
                {adding ? 'Adding...' : '+ Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tables List */}
      <div className="tables-list">
        {tables.map(table => (
          <div key={table.id} className="table-admin-card">
            <div className="table-admin-info">
              <div className="table-number-badge">#{table.table_number}</div>
              <div>
                <h3 className="table-admin-name">{table.name}</h3>
                <p className="table-admin-url">{getQrUrl(table)}</p>
              </div>
            </div>
            <div className="table-admin-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => copyQrLink(table)}
                id={`copy-link-${table.id}`}
                title="Copy QR link"
              >
                🔗 Copy Link
              </button>
              {!isGuest && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(table)}
                  disabled={processingId === table.id}
                  id={`delete-table-${table.id}`}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}

        {tables.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🪑</div>
            <h3>No tables yet</h3>
            <p>Add tables above to generate QR codes for customers.</p>
          </div>
        )}
      </div>

      {/* QR Code Info */}
      <div className="qr-info-box">
        <h3>📱 How QR Codes Work</h3>
        <ol>
          <li>Each table gets a unique URL: <code>/table/:number</code></li>
          <li>Generate a QR code from that URL using any QR generator</li>
          <li>Place the QR code on the physical table</li>
          <li>Customers scan → order food → see their bill in real-time</li>
        </ol>
      </div>
    </div>
  );
}
