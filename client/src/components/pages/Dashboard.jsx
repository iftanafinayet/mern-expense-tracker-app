import { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Car, Home, Coffee, Briefcase, Heart } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { toast } from 'sonner';
import TransactionModal from './TransactionModal.jsx';
import '../styles/Dashboard.css';

const API_BASE_URL = 'http://localhost:5000/api';

// Icon mapping untuk kategori
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

// Fungsi untuk generate kategori data dari transactions
const generateCategoryData = (transactions) => {
  const categoryMap = {};
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#f97316', '#06b6d4'];
  
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const category = t.category || 'Other';
      if (!categoryMap[category]) {
        categoryMap[category] = { value: 0, color: colors[Object.keys(categoryMap).length % colors.length] };
      }
      categoryMap[category].value += Math.abs(t.amount);
    });
  
  return Object.entries(categoryMap).map(([name, data]) => ({
    name,
    value: parseFloat(data.value.toFixed(2)),
    fill: data.color,
  }));
};

// Fungsi untuk calculate monthly stats
const calculateMonthlyStats = (transactions) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  const lastMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  });
  
  // Current month
  const currentIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const currentExpense = Math.abs(currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0));
  
  // Last month
  const lastIncome = lastMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const lastExpense = Math.abs(lastMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0));
  
  // Calculate percentage change
  const incomeChange = lastIncome === 0 ? 0 : ((currentIncome - lastIncome) / lastIncome) * 100;
  const expenseChange = lastExpense === 0 ? 0 : ((currentExpense - lastExpense) / lastExpense) * 100;
  
  return {
    currentIncome,
    currentExpense,
    incomeChange: incomeChange.toFixed(1),
    expenseChange: expenseChange.toFixed(1),
  };
};

// Fungsi untuk generate monthly trend dari transactions
const generateMonthlyTrend = (transactions) => {
  const monthlyMap = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  transactions.forEach(t => {
    const date = new Date(t.date);
    const monthKey = monthNames[date.getMonth()] + ' ' + date.getFullYear();
    
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { income: 0, expense: 0, month: monthNames[date.getMonth()] };
    }
    
    if (t.type === 'income') {
      monthlyMap[monthKey].income += t.amount;
    } else {
      monthlyMap[monthKey].expense += Math.abs(t.amount);
    }
  });
  
  return Object.values(monthlyMap).slice(-6).map(item => ({
    month: item.month,
    income: parseFloat(item.income.toFixed(2)),
    expense: parseFloat(item.expense.toFixed(2)),
  }));
};

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch transactions dari API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/expenses`);
        if (response.ok) {
          const data = await response.json();
          setTransactions(data && Array.isArray(data) ? data : []);
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Generate data dinamis
  const categoryData = generateCategoryData(transactions);
  const monthlyTrend = generateMonthlyTrend(transactions);
  const monthlyStats = calculateMonthlyStats(transactions);

  const totalIncome = monthlyStats.currentIncome;
  const totalExpense = monthlyStats.currentExpense;
  const balance = totalIncome - totalExpense;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return (
    <div className="dashboard">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card balance-card">
          <div className="summary-header">
            <p>Total Balance</p>
            <DollarSign size={32} />
          </div>
          <h2 className="summary-amount">{formatCurrency(balance)}</h2>
          <p className="summary-label">Current month</p>
        </div>

        <div className="summary-card income-card">
          <div className="summary-header">
            <p>Total Income</p>
            <TrendingUp size={32} />
          </div>
          <h2 className="summary-amount">{formatCurrency(totalIncome)}</h2>
          <p className="summary-change income">
            {monthlyStats.incomeChange >= 0 ? '+' : ''}{monthlyStats.incomeChange}% from last month
          </p>
        </div>

        <div className="summary-card expense-card">
          <div className="summary-header">
            <p>Total Expense</p>
            <TrendingDown size={32} />
          </div>
          <h2 className="summary-amount">{formatCurrency(totalExpense)}</h2>
          <p className="summary-change expense">
            {monthlyStats.expenseChange >= 0 ? '+' : ''}{monthlyStats.expenseChange}% from last month
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button onClick={() => { setModalType('income'); setIsModalOpen(true); }} className="btn btn-income action-btn">
          <PlusCircle size={24} />
          <span>Add Income</span>
        </button>
        <button onClick={() => { setModalType('expense'); setIsModalOpen(true); }} className="btn btn-expense action-btn">
          <PlusCircle size={24} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Transactions */}
        <div className="card">
          <h3 className="card-title">Recent Transactions</h3>
          <div className="transactions-list">
            {transactions.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No transactions yet</p>
            ) : (
              transactions.slice(0, 5).map((transaction) => {
                const Icon = iconMap[transaction.category] || ShoppingBag;
                return (
                  <div key={transaction._id || transaction.id} className="transaction-item">
                    <div className="transaction-left">
                      <div className={`transaction-icon ${transaction.type}`}>
                        <Icon size={24} />
                      </div>
                      <div className="transaction-info">
                        <p className="transaction-title">{transaction.title}</p>
                        <p className="transaction-date">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="transaction-right">
                      <p className={`transaction-amount ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="transaction-category">{transaction.category}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Category Chart */}
        <div className="card">
          <h3 className="card-title">Expense by Category</h3>
          {categoryData.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', padding: '50px 20px' }}>No expense data available</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend-grid">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: cat.fill }} />
                    <span>{cat.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="card">
        <h3 className="card-title">Monthly Trend</h3>
        {monthlyTrend.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '50px 20px' }}>No trend data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} name="Expense" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        type={modalType}
        onSave={() => {
          // Refresh transactions setelah save
          const fetchRefresh = async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/expenses`);
              if (response.ok) {
                const data = await response.json();
                setTransactions(Array.isArray(data) ? data : []);
              }
            } catch (error) {
              console.error('Error refreshing data:', error);
            }
          };
          fetchRefresh();
        }}
      />
    </div>
  );
}
