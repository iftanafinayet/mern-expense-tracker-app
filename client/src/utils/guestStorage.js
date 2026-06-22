const GUEST_KEY = 'dompetgua_guest';
const GUEST_USER_KEY = 'dompetgua_guest_user';

export const isGuestMode = () => {
  return localStorage.getItem(GUEST_KEY) === 'true';
};

export const enableGuestMode = () => {
  localStorage.setItem(GUEST_KEY, 'true');
  const guestUser = {
    id: 'guest-' + Date.now(),
    email: 'guest@dompetgua.local',
    is_anonymous: true,
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestUser));
  return guestUser;
};

export const disableGuestMode = () => {
  localStorage.removeItem(GUEST_KEY);
  localStorage.removeItem(GUEST_USER_KEY);
};

export const getGuestUser = () => {
  try {
    const data = localStorage.getItem(GUEST_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const TRANSACTIONS_KEY = 'dompetgua_guest_transactions';

export const getGuestTransactions = () => {
  try {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveGuestTransactions = (transactions) => {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

export const addGuestTransaction = (transaction) => {
  const transactions = getGuestTransactions();
  const newTx = {
    ...transaction,
    id: 'guest-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString(),
  };
  transactions.unshift(newTx);
  saveGuestTransactions(transactions);
  return newTx;
};

export const updateGuestTransaction = (id, updates) => {
  let transactions = getGuestTransactions();
  transactions = transactions.map(t => t.id === id ? { ...t, ...updates } : t);
  saveGuestTransactions(transactions);
};

export const deleteGuestTransaction = (id) => {
  let transactions = getGuestTransactions();
  transactions = transactions.filter(t => t.id !== id);
  saveGuestTransactions(transactions);
};
