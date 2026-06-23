import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import { isGuestMode, getGuestTransactions, deleteGuestTransaction } from '../../utils/guestStorage';
import TransactionModal from './TransactionModal.jsx';
import '../styles/Transactions.css';

const ICON_MAP = {
  Food: 'restaurant', Transport: 'directions_car', Utilities: 'bolt',
  Entertainment: 'movie', Health: 'favorite', Shopping: 'shopping_bag',
  Salary: 'payments', Freelance: 'work', Investment: 'trending_up',
  Gift: 'card_giftcard', Other: 'more_horiz',
};

const ALL_CATEGORIES = ['All', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      if (isGuestMode()) { setTransactions(getGuestTransactions()); return; }
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (error) throw error;
      setTransactions(data || []);
    } catch (e) {
      console.error(e.message);
      toast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const filtered = transactions.filter(t => {
    const text = (t.title || t.description || '').toLowerCase();
    const cat = (t.category || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return text.includes(q) && cat.includes(q)
      && (typeFilter === 'all' || t.type === typeFilter)
      && (categoryFilter === 'all' || cat === categoryFilter.toLowerCase());
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.abs(amount));
  };

  const handleDelete = async (id) => {
    try {
      if (isGuestMode()) { deleteGuestTransaction(id); setTransactions(prev => prev.filter(t => t.id !== id)); toast.success('Dihapus'); return; }
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transaksi berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (tx) => { setEditingTransaction(tx); setIsModalOpen(true); };
  const handleModalClose = () => { setIsModalOpen(false); setEditingTransaction(null); fetchTransactions(); };

  return (
    <div className="tx-page fade-in">
      {createPortal(
        <button className="tx-fab" onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}>
          <span className="material-symbols-outlined">add</span>
        </button>,
        document.body
      )}
      <div className="tx-header">
        <h1 className="tx-title">Riwayat Transaksi</h1>
        <p className="tx-subtitle">Pantau dan kelola arus kasmu</p>
      </div>

      <section className="filter-section">
        <div className="search-wrap">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            className="search-input"
            placeholder="Cari judul atau kategori..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-row">
          <div className="filter-grp">
            <label className="filter-label">Tipe</label>
            <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">Semua Tipe</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
          <div className="filter-grp">
            <label className="filter-label">Kategori</label>
            <select className="filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              {ALL_CATEGORIES.map(c => <option key={c} value={c.toLowerCase()}>{c === 'All' ? 'Semua' : c}</option>)}
            </select>
          </div>
        </div>
      </section>

      <div className="tx-list">
        <div className="tx-list-header">
          <span className="tx-list-title">Transaksi Terbaru</span>
        </div>

        {loading ? (
          <div className="tx-empty">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="tx-empty">{searchQuery ? 'Tidak ada yang cocok' : 'Belum ada transaksi'}</div>
        ) : filtered.map(t => {
          const icon = ICON_MAP[t.category] || 'more_horiz';
          return (
            <div key={t.id} className="tx-card" onClick={() => handleEdit(t)}>
              <div className="tx-card-left">
                <div className={`tx-card-icon ${t.type}`}>
                  <span className="material-symbols-outlined filled">{icon}</span>
                </div>
                <div className="tx-card-info">
                  <h4 className="tx-card-title">{t.title || t.description || 'Tanpa Judul'}</h4>
                  <p className="tx-card-meta">
                    {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' • '}{t.category}
                  </p>
                </div>
              </div>
              <div className="tx-card-right">
                <span className={`tx-card-amount ${t.type}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
                {deletingId === t.id ? (
                  <div className="tx-card-actions">
                    <button className="tx-action confirm" onClick={e => { e.stopPropagation(); handleDelete(t.id); }}>✓</button>
                    <button className="tx-action cancel" onClick={e => { e.stopPropagation(); setDeletingId(null); }}>✕</button>
                  </div>
                ) : (
                  <button className="tx-action delete" onClick={e => { e.stopPropagation(); setDeletingId(t.id); }}>
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TransactionModal isOpen={isModalOpen} onClose={handleModalClose} transaction={editingTransaction} onSave={fetchTransactions} />
    </div>
  );
}
