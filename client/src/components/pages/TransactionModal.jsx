import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import { isGuestMode, addGuestTransaction, updateGuestTransaction } from '../../utils/guestStorage';
import '../styles/TransactionModal.css';

export default function TransactionModal({ isOpen, onClose, type = 'expense', transaction, onSave }) {
  const [formData, setFormData] = useState({
    title: '', amount: '', type, category: '',
    date: new Date().toISOString().split('T')[0], description: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({
        title: transaction.title || '', amount: Math.abs(transaction.amount).toString(),
        type: transaction.type, category: transaction.category,
        date: transaction.date, description: transaction.description || '',
      });
    } else {
      setFormData({ title: '', amount: '', type, category: '', date: new Date().toISOString().split('T')[0], description: '' });
    }
    setErrors({});
  }, [transaction, type, isOpen]);

  const categories = {
    expense: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Judul wajib diisi';
    if (!formData.amount || parseFloat(formData.amount) <= 0) errs.amount = 'Nominal harus lebih dari 0';
    if (!formData.category) errs.category = 'Pilih kategori';
    if (!formData.date) errs.date = 'Tanggal wajib diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        amount: formData.type === 'income' ? parseFloat(formData.amount) : -Math.abs(parseFloat(formData.amount)),
        type: formData.type, category: formData.category,
        date: formData.date, description: formData.description,
      };

      if (isGuestMode()) {
        if (transaction) { updateGuestTransaction(transaction.id, payload); toast.success('Transaksi diperbarui'); }
        else { addGuestTransaction(payload); toast.success('Transaksi disimpan'); }
        if (onSave) onSave();
        onClose();
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Sesi berakhir'); return; }

      const dbPayload = { ...payload, user_id: user.id };
      if (transaction) {
        await supabase.from('transactions').update(dbPayload).eq('id', transaction.id);
        toast.success('Transaksi berhasil diperbarui');
      } else {
        await supabase.from('transactions').insert([dbPayload]);
        toast.success('Transaksi berhasil disimpan');
      }
      if (onSave) onSave();
      onClose();
    } catch (err) {
      toast.error('Gagal memproses transaksi');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{transaction ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
            <p className="modal-subtitle">Catat detail keuanganmu dengan rapi</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="type-toggle">
            <button type="button" onClick={() => setFormData(f => ({ ...f, type: 'income', category: '' }))}
              className={`type-btn ${formData.type === 'income' ? 'active inc' : ''}`}>
              <span className="material-symbols-outlined">add_circle</span> Pemasukan
            </button>
            <button type="button" onClick={() => setFormData(f => ({ ...f, type: 'expense', category: '' }))}
              className={`type-btn ${formData.type === 'expense' ? 'active exp' : ''}`}>
              <span className="material-symbols-outlined">remove_circle</span> Pengeluaran
            </button>
          </div>

          <div className="modal-grid">
            <div className="modal-field full">
              <label className="modal-label"><span className="material-symbols-outlined">edit</span> Judul</label>
              <input type="text" className={`modal-input ${errors.title ? 'error' : ''}`} value={formData.title}
                onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} placeholder="Misal: Makan Siang" />
              {errors.title && <span className="modal-err">{errors.title}</span>}
            </div>

            <div className="modal-field">
              <label className="modal-label"><span className="material-symbols-outlined">payments</span> Nominal</label>
              <input type="number" className={`modal-input ${errors.amount ? 'error' : ''}`} value={formData.amount}
                onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
              {errors.amount && <span className="modal-err">{errors.amount}</span>}
            </div>

            <div className="modal-field">
              <label className="modal-label"><span className="material-symbols-outlined">calendar_today</span> Tanggal</label>
              <input type="date" className={`modal-input ${errors.date ? 'error' : ''}`} value={formData.date}
                onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} />
              {errors.date && <span className="modal-err">{errors.date}</span>}
            </div>

            <div className="modal-field full">
              <label className="modal-label"><span className="material-symbols-outlined">category</span> Kategori</label>
              <select className={`modal-input ${errors.category ? 'error' : ''}`} value={formData.category}
                onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}>
                <option value="">-- Pilih Kategori --</option>
                {categories[formData.type]?.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <span className="modal-err">{errors.category}</span>}
            </div>

            <div className="modal-field full">
              <label className="modal-label"><span className="material-symbols-outlined">description</span> Catatan</label>
              <textarea className="modal-input textarea" value={formData.description}
                onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                placeholder="Tambahkan detail..." rows={2} />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn cancel" onClick={onClose} disabled={loading}>Batal</button>
            <button type="submit" className="modal-btn save" disabled={loading}>
              {loading ? 'Menyimpan...' : (transaction ? 'Simpan Perubahan' : 'Catat Transaksi')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
