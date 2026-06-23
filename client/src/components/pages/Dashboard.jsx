import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../supabaseClient';
import { isGuestMode, getGuestTransactions } from '../../utils/guestStorage';
import TransactionModal from './TransactionModal.jsx';
import '../styles/Dashboard.css';

const COLORS = ['#E11D48', '#D97706', '#059669', '#1d4ed8', '#8b5cf6', '#0891b2'];
const ICON_MAP = {
  Food: 'restaurant', Transport: 'directions_car', Utilities: 'bolt',
  Entertainment: 'movie', Health: 'favorite', Shopping: 'shopping_bag',
  Salary: 'work', Freelance: 'work', Investment: 'trending_up',
  Gift: 'card_giftcard', Other: 'more_horiz',
};

const generateCategoryData = (transactions) => {
  const map = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category || 'Other';
    if (!map[cat]) map[cat] = { value: 0, color: COLORS[Object.keys(map).length % COLORS.length] };
    map[cat].value += Math.abs(Number(t.amount));
  });
  return Object.entries(map).map(([name, d]) => ({ name, value: parseFloat(d.value.toFixed(2)), fill: d.color }));
};

const calculateMonthlyStats = (tx) => {
  const now = new Date(), cm = now.getMonth(), cy = now.getFullYear();
  const lm = cm === 0 ? 11 : cm - 1, ly = cm === 0 ? cy - 1 : cy;
  const curMonth = tx.filter(t => { const d = new Date(t.date); return d.getMonth() === cm && d.getFullYear() === cy; });
  const lastMonth = tx.filter(t => { const d = new Date(t.date); return d.getMonth() === lm && d.getFullYear() === ly; });
  const curIncome = curMonth.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const curExpense = Math.abs(curMonth.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0));
  const lastIncome = lastMonth.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const lastExpense = Math.abs(lastMonth.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0));
  return {
    currentIncome: curIncome, currentExpense: curExpense,
    incomeChange: lastIncome ? ((curIncome - lastIncome) / lastIncome * 100).toFixed(1) : '0.0',
    expenseChange: lastExpense ? ((curExpense - lastExpense) / lastExpense * 100).toFixed(1) : '0.0',
  };
};

function DoughnutChart({ data, total }) {
  const radius = 70, circumference = 2 * Math.PI * radius;
  let offset = 0;
  const arcs = data.map(d => {
    const segment = (d.value / total) * circumference;
    const dashOffset = circumference - offset;
    offset += segment;
    return { ...d, dashArray: `${segment} ${circumference - segment}`, dashOffset };
  });
  return (
    <div className="doughnut-wrapper">
      <svg viewBox="0 0 160 160" className="doughnut-svg">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--surface-container)" strokeWidth="12" />
        {arcs.map((a, i) => (
          <circle key={i} cx="80" cy="80" r={radius} fill="none" stroke={a.fill} strokeWidth="12"
            strokeDasharray={a.dashArray} strokeDashoffset={a.dashOffset}
            strokeLinecap="round" transform="rotate(-90 80 80)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        ))}
      </svg>
      <div className="doughnut-center">
        <p className="doughnut-center-label">Total</p>
        <p className="doughnut-center-value">{formatCurrency(total)}</p>
      </div>
    </div>
  );
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [transactions, setTransactions] = useState([]);
  const [fabOpen, setFabOpen] = useState(false);

  const fetchData = async () => {
    try {
      if (isGuestMode()) { setTransactions(getGuestTransactions()); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false });
      if (error) throw error;
      setTransactions(data || []);
    } catch (e) { console.error(e.message); }
  };

  useEffect(() => { fetchData(); }, []);

  const categoryData = generateCategoryData(transactions);
  const stats = calculateMonthlyStats(transactions);
  const totalBalance = transactions.reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = categoryData.reduce((s, i) => s + i.value, 0);
  const recentTxs = transactions.slice(0, 5);

  const openModal = (type) => { setModalType(type); setIsModalOpen(true); setFabOpen(false); };

  const fabContent = (
    <>
      <div className={`fab-overlay ${fabOpen ? 'active' : ''}`} onClick={() => setFabOpen(false)} />
      <div className={`fab-menu ${fabOpen ? 'active' : ''}`}>
        <button onClick={() => openModal('income')} className="fab-opt income">
          <span className="material-symbols-outlined">add_circle</span> Tambah Pemasukan
        </button>
        <button onClick={() => openModal('expense')} className="fab-opt expense">
          <span className="material-symbols-outlined">remove_circle</span> Tambah Pengeluaran
        </button>
      </div>
      <button className={`fab ${fabOpen ? 'active' : ''}`} onClick={() => setFabOpen(!fabOpen)}>
        <span className="material-symbols-outlined">{fabOpen ? 'close' : 'add'}</span>
      </button>
    </>
  );

  return (
    <div className="dashboard fade-in">
      {createPortal(fabContent, document.body)}
      <section className="balance-card">
        <div className="balance-top">
          <div>
            <p className="balance-label">Total Saldo</p>
            <h1 className="balance-amount">{formatCurrency(totalBalance)}</h1>
            <p className="balance-note">Saldo Keseluruhan</p>
          </div>
          <div className="balance-icon-wrap">
            <span className="material-symbols-outlined">payments</span>
          </div>
        </div>
      </section>

      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-header">
            <p className="stat-label">Pemasukan</p>
            <span className="material-symbols-outlined stat-icon">trending_up</span>
          </div>
          <h3 className="stat-value">{formatCurrency(stats.currentIncome)}</h3>
          <p className="stat-change positive">{stats.incomeChange}% dari bln lalu</p>
        </div>
        <div className="stat-card expense">
          <div className="stat-header">
            <p className="stat-label">Pengeluaran</p>
            <span className="material-symbols-outlined stat-icon">trending_down</span>
          </div>
          <h3 className="stat-value">{formatCurrency(stats.currentExpense)}</h3>
          <p className="stat-change negative">↑{stats.expenseChange}% dari bln lalu</p>
        </div>
      </div>

      <div className="quick-actions">
        <button onClick={() => openModal('income')} className="qa-btn income">
          <span className="material-symbols-outlined">add_circle</span> Tambah Pemasukan
        </button>
        <button onClick={() => openModal('expense')} className="qa-btn expense">
          <span className="material-symbols-outlined">remove_circle</span> Tambah Pengeluaran
        </button>
      </div>

      <section className="tonal-card">
        <h2 className="section-title">Pengeluaran per Kategori</h2>
        {categoryData.length === 0 ? (
          <p className="empty-text">Belum ada data pengeluaran</p>
        ) : (
          <div className="category-chart">
            <DoughnutChart data={categoryData} total={totalExpense} />
            <div className="category-list">
              {categoryData.map((c, i) => (
                <div key={c.name} className="category-item">
                  <div className="category-left">
                    <span className="cat-dot" style={{ background: c.fill }} />
                    <span className="cat-name">{c.name}</span>
                  </div>
                  <span className="cat-value">{formatCurrency(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="tonal-card">
        <div className="recent-header">
          <h2 className="section-title">Transaksi Terbaru</h2>
          <span className="see-all">Lihat Semua</span>
        </div>
        <div className="recent-list">
          {recentTxs.length === 0 ? (
            <p className="empty-text">Belum ada transaksi</p>
          ) : recentTxs.map(t => {
            const icon = ICON_MAP[t.category] || 'more_horiz';
            return (
              <div key={t.id} className="tx-item">
                <div className={`tx-icon-wrap ${t.type}`}>
                  <span className="material-symbols-outlined filled">{icon}</span>
                </div>
                <div className="tx-info">
                  <p className="tx-title">{t.title || t.description}</p>
                  <p className="tx-date">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <span className={`tx-amount ${t.type}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(t.amount))}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} type={modalType} onSave={fetchData} />
    </div>
  );
}
