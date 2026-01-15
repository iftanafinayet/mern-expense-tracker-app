import { useState, useEffect } from 'react';
import { Search, PlusCircle, Edit2, Trash2, ShoppingBag, Car, Home, Coffee, Briefcase, Heart, Film, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import TransactionModal from './TransactionModal.jsx';
import '../styles/Transactions.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const categories = ['All', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Salary', 'Freelance'];

  // Fetch transactions dari API
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/expenses`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(Array.isArray(data) ? data : []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data saat component mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || transaction.category?.toLowerCase() === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Math.abs(amount));
  };

  // Delete transaction
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setTransactions(transactions.filter(t => t._id !== id && t.id !== id));
        toast.success('Transaction deleted successfully');
      } else {
        toast.error('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
  };

  // Edit transaction - pass ke modal, lalu handle save di modal
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  // Refresh data setelah modal close (untuk add/update)
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    fetchTransactions(); // Refresh data
  };

  if (loading) {
    return <div className="loading">Loading transactions...</div>;
  }

  return (
    <div className="transactions-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Manage all your transactions</p>
        </div>
        <button onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} className="btn btn-primary">
          <PlusCircle size={20} />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Filters - sama seperti sebelumnya */}
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
                placeholder="Search by title or category..."
                className="input-field"
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="input-label">Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field">
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
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

      {/* Transactions Table - sama seperti sebelumnya, tapi gunakan filteredTransactions */}
      <div className="card table-card">
        <div className="table-container">
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
                  <td colSpan={5} className="empty-state">No transactions found</td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => {
                  const Icon = transaction.icon || ShoppingBag; // Fallback icon
                  return (
                    <tr key={transaction._id || transaction.id}>
                      <td>
                        <div className="table-transaction">
                          <div className={`transaction-icon ${transaction.type}`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <p className="table-title">{transaction.title}</p>
                            {transaction.description && (
                              <p className="table-description">{transaction.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td><span className="category-badge">{transaction.category}</span></td>
                      <td>
                        <div className="date-cell">
                          <Calendar size={16} />
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="text-right">
                        <span className={`table-amount ${transaction.type}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => handleEdit(transaction)} className="action-btn edit">
                            <Edit2 size={16} />
                          </button>
                          {deletingId === (transaction._id || transaction.id) ? (
                            <>
                              <button 
                                onClick={() => handleDelete(transaction._id || transaction.id)} 
                                className="action-btn delete"
                                title="Confirm delete"
                              >
                                ✓
                              </button>
                              <button 
                                onClick={() => setDeletingId(null)} 
                                className="action-btn"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => setDeletingId(transaction._id || transaction.id)} 
                              className="action-btn delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        transaction={editingTransaction}
        onSave={fetchTransactions} // Pass callback untuk refresh setelah save
      />
    </div>
  );
}
