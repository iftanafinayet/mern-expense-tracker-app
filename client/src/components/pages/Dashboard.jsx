import { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Car, Home, Coffee, Briefcase, Heart, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { supabase } from '../../supabaseClient';
import { isGuestMode, getGuestTransactions } from '../../utils/guestStorage';
import TransactionModal from './TransactionModal.jsx';
import '../styles/Dashboard.css';

const iconMap = {
  'Food': ShoppingBag,
  'Transport': Car,
  'Utilities': Home,
  'Entertainment': Coffee,
  'Salary': Briefcase,
  'Freelance': Briefcase,
  'Investment': TrendingUp,
  'Gift': Heart,
  'Health': Heart,
  'Shopping': ShoppingBag,
  'Other': ShoppingBag,
};

const generateCategoryData = (transactions) => {
  const categoryMap = {};
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#6b7280', '#06b6d4'];

  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const category = t.category || 'Other';
      if (!categoryMap[category]) {
        categoryMap[category] = {
          value: 0,
          color: colors[Object.keys(categoryMap).length % colors.length]
        };
      }
      categoryMap[category].value += Math.abs(t.amount);
    });

  return Object.entries(categoryMap).map(([name, data]) => ({
    name,
    value: parseFloat(data.value.toFixed(2)),
    fill: data.color,
  }));
};

const calculateMonthlyStats = (transactions) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const lastMonth = lastMonthDate.getMonth();
  const lastMonthYear = lastMonthDate.getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const lastMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  });

  const currentIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const currentExpense = Math.abs(currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0));
  const lastIncome = lastMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const lastExpense = Math.abs(lastMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0));

  const incomeChange = lastIncome === 0 ? 0 : ((currentIncome - lastIncome) / lastIncome) * 100;
  const expenseChange = lastExpense === 0 ? 0 : ((currentExpense - lastExpense) / lastExpense) * 100;

  return { currentIncome, currentExpense, incomeChange: incomeChange.toFixed(1), expenseChange: expenseChange.toFixed(1) };
};

const generateBarChartData = (transactions) => {
  const monthlyMap = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

  sorted.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { name: monthKey, Pemasukan: 0, Pengeluaran: 0 };
    }

    const amt = Math.abs(Number(t.amount));
    if (t.type === 'income') monthlyMap[monthKey].Pemasukan += amt;
    else monthlyMap[monthKey].Pengeluaran += amt;
  });

  return Object.values(monthlyMap).slice(-6);
};

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [transactions, setTransactions] = useState([]);
  const [fabOpen, setFabOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      if (isGuestMode()) {
        setTransactions(getGuestTransactions());
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const categoryData = generateCategoryData(transactions);
  const barData = generateBarChartData(transactions);
  const monthlyStats = calculateMonthlyStats(transactions);
  const totalBalance = transactions.reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpenseThisMonth = categoryData.reduce((sum, item) => sum + item.value, 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);
  };

  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
    setFabOpen(false);
  };

  return (
    <div className="dashboard fade-in">
      <div className="summary-cards">
        <div className="summary-card balance-card">
          <div className="summary-header"><p>Total Balance</p><DollarSign size={32} /></div>
          <h2 className="summary-amount">{formatCurrency(totalBalance)}</h2>
          <p className="summary-label">Saldo Keseluruhan</p>
        </div>

        <div className="summary-card income-card">
          <div className="summary-header"><p>Pemasukan (Bulan Ini)</p><TrendingUp size={32} /></div>
          <h2 className="summary-amount">{formatCurrency(monthlyStats.currentIncome)}</h2>
          <p className="summary-change income">{monthlyStats.incomeChange}% dari bln lalu</p>
        </div>

        <div className="summary-card expense-card">
          <div className="summary-header"><p>Pengeluaran (Bulan Ini)</p><TrendingDown size={32} /></div>
          <h2 className="summary-amount">{formatCurrency(monthlyStats.currentExpense)}</h2>
          <p className="summary-change expense">↑{monthlyStats.expenseChange}% dari bln lalu</p>
        </div>
      </div>

      <div className="quick-actions">
        <button onClick={() => openModal('income')} className="btn btn-income action-btn">
          <PlusCircle size={24} /> <span>Add Income</span>
        </button>
        <button onClick={() => openModal('expense')} className="btn btn-expense action-btn">
          <PlusCircle size={24} /> <span>Add Expense</span>
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '380px', maxHeight: '380px' }}>
          <h3 className="card-title">Recent Transactions</h3>
          <div className="transactions-list" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {transactions.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No transactions yet</p>
            ) : (
              transactions.map((t) => {
                const Icon = iconMap[t.category] || ShoppingBag;
                return (
                  <div key={t.id} className="transaction-item" style={{ marginBottom: '0' }}>
                    <div className="transaction-left">
                      <div className={`transaction-icon ${t.type}`}><Icon size={24} /></div>
                      <div className="transaction-info">
                        <p className="transaction-title">{t.title || t.description}</p>
                        <p className="transaction-date">
                          {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="transaction-right">
                      <p className={`transaction-amount ${t.type}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(t.amount))}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '380px', maxHeight: '380px' }}>
          <h3 className="card-title">Expense by Category</h3>
          {categoryData.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#999' }}>No expense data</p></div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
              <div style={{ position: 'relative', width: '100%', height: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" cornerRadius={6}>
                      {categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>Total</p>
                  <p style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#333' }}>{formatCurrency(totalExpenseThisMonth)}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '0 20px' }}>
                {categoryData.slice(0, 5).map((cat) => (
                  <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cat.fill }} />
                      <span style={{ color: '#555', fontSize: '13px' }}>{cat.name}</span>
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '13px' }}>{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Tren Keuangan (6 Bulan Terakhir)</h3>
        <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
          <ResponsiveContainer>
            <BarChart data={barData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
              <YAxis hide={true} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} formatter={(v) => formatCurrency(v)} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Pemasukan" fill="#10b981" radius={[10, 10, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[10, 10, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} type={modalType} onSave={fetchDashboardData} />

      <div className={`fab-overlay ${fabOpen ? 'active' : ''}`} onClick={() => setFabOpen(false)} />
      <div className={`fab-menu ${fabOpen ? 'active' : ''}`}>
        <button onClick={() => openModal('income')} className="fab-option income">
          <TrendingUp size={20} />
          <span>Add Income</span>
        </button>
        <button onClick={() => openModal('expense')} className="fab-option expense">
          <TrendingDown size={20} />
          <span>Add Expense</span>
        </button>
      </div>
      <button
        className={`fab ${fabOpen ? 'active' : ''}`}
        onClick={() => setFabOpen(!fabOpen)}
        aria-label="Add transaction"
      >
        {fabOpen ? <X size={28} /> : <PlusCircle size={28} />}
      </button>
    </div>
  );
}
