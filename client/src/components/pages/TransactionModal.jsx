import { useState, useEffect } from 'react';
import { X, DollarSign, FileText, Calendar, Tag } from 'lucide-react';
import { toast } from 'sonner';
import '../styles/TransactionModal.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function TransactionModal({ isOpen, onClose, type = 'expense', transaction, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: type,
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({
        title: transaction.title,
        amount: Math.abs(transaction.amount).toString(),
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        description: transaction.description || '',
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        type: type,
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
  }, [transaction, type, isOpen]);

  const categories = {
    expense: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.date) newErrors.date = 'Date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userId = localStorage.getItem('userId') || 'temp-user-id'; // Ambil dari localStorage atau gunakan temp
      
      const payload = {
        userId,
        title: formData.title,
        description: formData.description,
        amount: transaction?.type === 'income' || formData.type === 'income' ? parseFloat(formData.amount) : -Math.abs(parseFloat(formData.amount)),
        type: formData.type,
        category: formData.category,
        date: formData.date,
      };

      if (transaction) {
        // Update existing transaction
        const response = await fetch(`${API_BASE_URL}/expenses/${transaction._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Gagal mengupdate transaksi');
        toast.success('Transaksi berhasil diupdate!');
      } else {
        // Create new transaction
        const response = await fetch(`${API_BASE_URL}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Gagal menambah transaksi');
        toast.success('Transaksi berhasil ditambah!');
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{transaction ? 'Edit' : 'Add'} Transaction</h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-group">
            <label className="input-label">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`input-field ${errors.title ? 'error' : ''}`}
              placeholder="e.g., Grocery shopping"
            />
            {errors.title && <p className="error-message">{errors.title}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">
              Amount
            </label>
            <div className="amount-input">
              <span className="currency-symbol">Rp</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={`input-field ${errors.amount ? 'error' : ''}`}
              />
            </div>
            {errors.amount && <p className="error-message">{errors.amount}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">Type</label>
            <div className="type-toggle">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                className={`type-btn ${formData.type === 'income' ? 'active income' : ''}`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                className={`type-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
              >
                Expense
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={`input-field ${errors.category ? 'error' : ''}`}
            >
              <option value="">Select a category</option>
              {categories[formData.type].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="error-message">{errors.category}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={`input-field ${errors.date ? 'error' : ''}`}
            />
            {errors.date && <p className="error-message">{errors.date}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="input-field"
              placeholder="Add any notes..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : (transaction ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
