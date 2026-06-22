import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Type, Calendar, Tag, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import { isGuestMode, addGuestTransaction, updateGuestTransaction } from '../../utils/guestStorage';
import '../styles/TransactionModal.css';

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
        title: transaction.title || '',
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
    setErrors({});
  }, [transaction, type, isOpen]);

  const categories = {
    expense: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Judul wajib diisi';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Nominal harus lebih dari 0';
    if (!formData.category) newErrors.category = 'Pilih kategori';
    if (!formData.date) newErrors.date = 'Tanggal wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        amount: formData.type === 'income' ? parseFloat(formData.amount) : -Math.abs(parseFloat(formData.amount)),
        type: formData.type,
        category: formData.category,
        date: formData.date,
        description: formData.description,
      };

      if (isGuestMode()) {
        if (transaction) {
          updateGuestTransaction(transaction.id, payload);
          toast.success('Transaksi berhasil diperbarui');
        } else {
          addGuestTransaction(payload);
          toast.success('Transaksi berhasil disimpan');
        }
        if (onSave) onSave();
        onClose();
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Sesi berakhir, silakan login kembali.');
        return;
      }

      const dbPayload = { ...payload, user_id: user.id };

      if (transaction) {
        const { error } = await supabase
          .from('transactions')
          .update(dbPayload)
          .eq('id', transaction.id);

        if (error) throw error;
        toast.success('Transaksi berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert([dbPayload]);

        if (error) throw error;
        toast.success('Transaksi berhasil disimpan');
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error('Supabase Error:', error.message);
      toast.error('Gagal memproses transaksi');
    } finally {
      setLoading(false);
    }
  };

  // Jika modal tidak terbuka, jangan render apapun
  if (!isOpen) return null;

  // 2. Gunakan createPortal untuk merender modal di luar hierarki DOM Dashboard
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{transaction ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
            <p className="modal-subtitle">Catat detail keuanganmu dengan rapi</p>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="type-toggle-container">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
              className={`type-option ${formData.type === 'income' ? 'active-income' : ''}`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
              className={`type-option ${formData.type === 'expense' ? 'active-expense' : ''}`}
            >
              Pengeluaran
            </button>
          </div>

          <div className="form-grid">
            <div className="input-group full-width">
              <label className="input-label"><Type size={16} /> Judul / Nama Transaksi</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`input-field ${errors.title ? 'is-invalid' : ''}`}
                placeholder="Misal: Makan Siang, Gaji Bulanan..."
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            <div className="input-group">
              <label className="input-label"><DollarSign size={16} /> Nominal (Rp)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={`input-field ${errors.amount ? 'is-invalid' : ''}`}
                placeholder="0"
              />
              {errors.amount && <span className="error-text">{errors.amount}</span>}
            </div>

            <div className="input-group">
              <label className="input-label"><Calendar size={16} /> Tanggal</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`input-field ${errors.date ? 'is-invalid' : ''}`}
              />
              {errors.date && <span className="error-text">{errors.date}</span>}
            </div>

            <div className="input-group full-width">
              <label className="input-label"><Tag size={16} /> Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`input-field ${errors.category ? 'is-invalid' : ''}`}
              >
                <option value="">-- Pilih Kategori --</option>
                {categories[formData.type].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <span className="error-text">{errors.category}</span>}
            </div>

            <div className="input-group full-width">
              <label className="input-label"><FileText size={16} /> Catatan Tambahan (Opsional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field textarea-field"
                placeholder="Tambahkan detail jika diperlukan..."
                rows={2}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel" disabled={loading}>Batal</button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Menyimpan...' : (transaction ? 'Simpan Perubahan' : 'Catat Transaksi')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body // 3. Target portal ke body aplikasi
  );
}