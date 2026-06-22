import { useState, useEffect } from 'react';
import { Search, PlusCircle, Edit2, Trash2, ShoppingBag, Calendar, TrendingUp, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import { isGuestMode, getGuestTransactions, deleteGuestTransaction } from '../../utils/guestStorage';
import TransactionModal from './TransactionModal.jsx';
import '../styles/Transactions.css';

const iconMap = {
  'Food': ShoppingBag,
  'Transport': ShoppingBag,
  'Utilities': ShoppingBag,
  'Entertainment': ShoppingBag,
  'Health': ShoppingBag,
  'Shopping': ShoppingBag,
  'Salary': TrendingUp,
  'Freelance': TrendingUp,
  'Investment': TrendingUp,
  'Gift': ShoppingBag,
  'Other': ShoppingBag,
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['All', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      if (isGuestMode()) {
        setTransactions(getGuestTransactions());
        return;
      }

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

  const filteredTransactions = transactions.filter((transaction) => {
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
      if (isGuestMode()) {
        deleteGuestTransaction(id);
        setTransactions(transactions.filter(t => t.id !== id));
        toast.success('Transaksi berhasil dihapus');
        return;
      }

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

  const hasActiveFilters = typeFilter !== 'all' || categoryFilter !== 'all' || searchQuery;

  return (
    <div className="transactions-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions History</h1>
          <p className="page-subtitle">Pantau dan kelola arus kasmu</p>
        </div>
        <button onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} className="btn btn-primary desktop-add-btn">
          <PlusCircle size={20} />
          <span>Add Transaction</span>
        </button>
      </div>

      <div className="search-bar-mobile">
        <div className="input-wrapper">
          <Search className="input-icon" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi..."
            className="input-field"
          />
        </div>
        <button
          className={`filter-toggle-btn ${hasActiveFilters ? 'has-filters' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
        </button>
      </div>

      <div className={`filters-panel ${showFilters ? 'active' : ''}`}>
        <div className="filters-header">
          <span>Filters</span>
          <button onClick={() => { setTypeFilter('all'); setCategoryFilter('all'); }} className="clear-filters-btn">Clear</button>
        </div>
        <div className="filters-row">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field filter-select">
            <option value="all">Semua Tipe</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field filter-select">
            {categories.map(cat => (
              <option key={cat} value={cat.toLowerCase()}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card filters-card desktop-filters">
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
            <>
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

              <div className="mobile-transactions-list">
                {filteredTransactions.length === 0 ? (
                  <div className="empty-state-mobile">
                    {searchQuery ? "Tidak ada transaksi yang cocok" : "Belum ada riwayat transaksi"}
                  </div>
                ) : (
                  filteredTransactions.map((t) => {
                    const Icon = iconMap[t.category] || ShoppingBag;
                    return (
                      <div key={t.id} className={`mobile-transaction-card ${t.type}`}>
                        <div className="mtc-top">
                          <div className="mtc-left">
                            <div className={`mtc-icon ${t.type}`}>
                              <Icon size={22} />
                            </div>
                            <div className="mtc-info">
                              <p className="mtc-title">{t.title || t.description || "Tanpa Judul"}</p>
                              <p className="mtc-category">{t.category}</p>
                            </div>
                          </div>
                          <div className="mtc-amount">
                            <span className={`mtc-value ${t.type}`}>
                              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                            </span>
                          </div>
                        </div>
                        <div className="mtc-bottom">
                          <div className="mtc-date">
                            <Calendar size={14} />
                            {new Date(t.date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="mtc-actions">
                            <button onClick={() => handleEdit(t)} className="mtc-action edit">
                              <Edit2 size={16} />
                            </button>
                            {deletingId === t.id ? (
                              <>
                                <button onClick={() => handleDelete(t.id)} className="mtc-action confirm">✓</button>
                                <button onClick={() => setDeletingId(null)} className="mtc-action cancel">✕</button>
                              </>
                            ) : (
                              <button onClick={() => setDeletingId(t.id)} className="mtc-action delete">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <button onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} className="btn btn-primary mobile-add-btn">
        <PlusCircle size={20} />
        <span>Add Transaction</span>
      </button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        transaction={editingTransaction}
        onSave={fetchTransactions}
      />
    </div>
  );
}
