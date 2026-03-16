import { useState, useEffect } from 'react';
import { Search, PlusCircle, Edit2, Trash2, ShoppingBag, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import TransactionModal from './TransactionModal.jsx';
import '../styles/Transactions.css';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Pastikan kategori sinkron dengan modal
  const categories = ['All', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error.message);
      toast.error('Gagal mengambil data transaksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // FIXED: Logika Filter yang lebih akurat
  const filteredTransactions = transactions.filter((transaction) => {
    // Gunakan title (atau description jika title kosong)
    const titleText = (transaction.title || transaction.description || '').toLowerCase();
    const categoryText = (transaction.category || '').toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch = titleText.includes(searchLower) || categoryText.includes(searchLower);
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || categoryText === categoryFilter.toLowerCase();

    return matchesSearch && matchesType && matchesCategory;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(transactions.filter(t => t.id !== id));
      toast.success('Transaksi berhasil dihapus');
    } catch (error) {
      toast.error('Gagal menghapus transaksi');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    fetchTransactions();
  };

  return (
    <div className="transactions-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions History</h1>
          <p className="page-subtitle">Pantau dan kelola arus kasmu</p>
        </div>
        <button onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} className="btn btn-primary">
          <PlusCircle size={20} />
          <span>Add Transaction</span>
        </button>
      </div>

      <div className="card filters-card">
        <div className="filters-grid">
          <div className="filter-group search-group">
            <label className="input-label">Search</label>
            <div className="input-wrapper">
              <Search className="input-icon" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul atau kategori..."
                className="input-field"
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="input-label">Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field">
              <option value="all">Semua Tipe</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="input-label">Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field">
              {categories.map(cat => (
                <option key={cat} value={cat.toLowerCase()}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-container">
          {loading ? (
            <div className="loading-state">Memuat data transaksi...</div>
          ) : (
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      {searchQuery ? "Tidak ada transaksi yang cocok" : "Belum ada riwayat transaksi"}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="table-transaction">
                          <div className={`transaction-icon ${t.type}`}>
                            <ShoppingBag size={20} />
                          </div>
                          <div>
                            {/* FIXED: Mengambil dari t.title sesuai skema Supabase kamu */}
                            <p className="table-title">{t.title || t.description || "Tanpa Judul"}</p>
                            <p className="table-type-label">{t.type}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="category-badge">{t.category}</span></td>
                      <td>
                        <div className="date-cell">
                          <Calendar size={16} />
                          {new Date(t.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="text-right">
                        <span className={`table-amount ${t.type}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => handleEdit(t)} className="action-btn edit" title="Edit">
                            <Edit2 size={16} />
                          </button>

                          {deletingId === t.id ? (
                            <div className="confirm-delete-actions">
                              <button onClick={() => handleDelete(t.id)} className="action-btn confirm" title="Ya, Hapus">✓</button>
                              <button onClick={() => setDeletingId(null)} className="action-btn cancel" title="Batal">✕</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeletingId(t.id)} className="action-btn delete" title="Hapus">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        transaction={editingTransaction}
        onSave={fetchTransactions}
      />
    </div>
  );
}