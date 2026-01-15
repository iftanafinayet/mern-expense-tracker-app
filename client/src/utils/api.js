const API_BASE_URL = 'http://localhost:5000/api';

// Auth API calls
export const authAPI = {
  register: async (username, email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  getUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/auth/user/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  updateUser: async (userId, data) => {
    const response = await fetch(`${API_BASE_URL}/auth/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Logout failed');
    return response.json();
  },
};

// Transactions API calls
export const transactionAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/expenses`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },

  getByMonth: async (month, year) => {
    const response = await fetch(`${API_BASE_URL}/expenses/${month}/${year}`);
    if (!response.ok) throw new Error('Failed to fetch monthly transactions');
    return response.json();
  },

  create: async (transactionData) => {
    const response = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData),
    });
    if (!response.ok) throw new Error('Failed to create transaction');
    return response.json();
  },

  update: async (transactionId, transactionData) => {
    const response = await fetch(`${API_BASE_URL}/expenses/${transactionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData),
    });
    if (!response.ok) throw new Error('Failed to update transaction');
    return response.json();
  },

  delete: async (transactionId) => {
    const response = await fetch(`${API_BASE_URL}/expenses/${transactionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete transaction');
    return response.json();
  },

  download: async () => {
    const response = await fetch(`${API_BASE_URL}/expenses/download`);
    if (!response.ok) throw new Error('Failed to download transactions');
    return response.json();
  },
};

// Income API calls
export const incomeAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/income`);
    if (!response.ok) throw new Error('Failed to fetch income');
    return response.json();
  },

  create: async (incomeData) => {
    const response = await fetch(`${API_BASE_URL}/income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incomeData),
    });
    if (!response.ok) throw new Error('Failed to create income');
    return response.json();
  },
};

// Dashboard API calls
export const dashboardAPI = {
  getSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/summary`);
    if (!response.ok) throw new Error('Failed to fetch summary');
    return response.json();
  },

  getRecentTransactions: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/recent-transaction`);
    if (!response.ok) throw new Error('Failed to fetch recent transactions');
    return response.json();
  },

  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },
};
