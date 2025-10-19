import { apiClient } from './config.js';

const MOCK = import.meta.env.VITE_FINANCE_MOCK === 'true';

const is404 = (err) => {
  const msg = err?.message || '';
  return /status:\s*404/i.test(msg);
};

const delay = (ms = 250) => new Promise(res => setTimeout(res, ms));

// In-memory mock store (dev only)
let mockStore = {
  bankBalance: 0,
  transactions: [],
  scheduled: [],
  categories: [
    { id: 'adhesions', name: 'Adhésions', type: 'recette' },
    { id: 'evenements', name: 'Événements', type: 'recette' },
    { id: 'carburant', name: 'Carburant', type: 'depense' },
    { id: 'maintenance', name: 'Maintenance', type: 'depense' },
    { id: 'assurance', name: 'Assurance', type: 'depense' },
    { id: 'materiel', name: 'Matériel', type: 'depense' },
    { id: 'frais_admin', name: 'Frais administratifs', type: 'depense' },
    { id: 'autres', name: 'Autres', type: 'both' }
  ]
};

const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`);

// API pour la gestion financière
export const financeAPI = {
  // Statistiques
  getStats: async () => {
    if (MOCK) {
      await delay();
      const revenue = mockStore.transactions.filter(t => t.type === 'recette').reduce((s, t) => s + (t.amount || 0), 0);
      const expenses = mockStore.transactions.filter(t => t.type === 'depense').reduce((s, t) => s + (t.amount || 0), 0);
      return {
        monthlyRevenue: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(revenue),
        monthlyExpenses: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(expenses),
        currentBalance: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(mockStore.bankBalance),
        membershipRevenue: '0,00 €',
        activeMembers: 0,
        revenueGrowth: 0
      };
    }
    try {
      const response = await apiClient.get('/finance/stats');
      return response.data;
    } catch (error) {
      if (is404(error)) {
        console.warn('Finance API: stats endpoint missing (404) – using defaults');
        return {
          monthlyRevenue: '0,00 €',
          monthlyExpenses: '0,00 €',
          currentBalance: '0,00 €',
          membershipRevenue: '0,00 €',
          activeMembers: 0,
          revenueGrowth: 0,
        };
      }
      console.error('Erreur récupération stats finance:', error);
      throw error;
    }
  },

  // Solde bancaire
  getBankBalance: async () => {
    if (MOCK) {
      await delay();
      return { balance: mockStore.bankBalance };
    }
    try {
      const response = await apiClient.get('/finance/bank-balance');
      return response.data;
    } catch (error) {
      if (is404(error)) {
        console.warn('Finance API: bank-balance endpoint missing (404) – using balance: 0');
        return { balance: 0 };
      }
      console.error('Erreur récupération solde bancaire:', error);
      throw error;
    }
  },

  setBankBalance: async (balance) => {
    if (MOCK) {
      await delay();
      mockStore.bankBalance = Number(balance || 0);
      return {
        balance: mockStore.bankBalance,
        formatted: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(mockStore.bankBalance)
      };
    }
    try {
      const response = await apiClient.post('/finance/bank-balance', { balance });
      return response.data;
    } catch (error) {
      if (is404(error)) {
        console.warn('Finance API: set bank-balance missing – simulating');
        return {
          balance,
          formatted: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(balance || 0))
        };
      }
      console.error('Erreur mise à jour solde bancaire:', error);
      throw error;
    }
  },

  // Opérations programmées
  getScheduledExpenses: async () => {
    if (MOCK) {
      await delay();
      return { operations: mockStore.scheduled };
    }
    try {
      const response = await apiClient.get('/finance/scheduled-expenses');
      return response.data;
    } catch (error) {
      if (is404(error)) {
        console.warn('Finance API: scheduled-expenses endpoint missing (404) – using empty list');
        return { operations: [] };
      }
      console.error('Erreur récupération dépenses programmées:', error);
      throw error;
    }
  },

  createScheduledExpense: async (expenseData) => {
    if (MOCK) {
      await delay();
      const created = { id: uid(), ...expenseData };
      mockStore.scheduled.push(created);
      return created;
    }
    try {
      const response = await apiClient.post('/finance/scheduled-expenses', expenseData);
      return response.data;
    } catch (error) {
      if (is404(error)) {
        console.warn('Finance API: create scheduled-expense missing (404) – simulating');
        return { id: uid(), ...expenseData };
      }
      console.error('Erreur création dépense programmée:', error);
      throw error;
    }
  },

  updateScheduledExpense: async (id, data) => {
    if (MOCK) {
      await delay();
      mockStore.scheduled = mockStore.scheduled.map(op => op.id === id ? { ...op, ...data } : op);
      return mockStore.scheduled.find(op => op.id === id);
    }
    try {
      const response = await apiClient.put(`/finance/scheduled-expenses/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur mise à jour dépense programmée:', error);
      throw error;
    }
  },

  deleteScheduledExpense: async (id) => {
    if (MOCK) {
      await delay();
      mockStore.scheduled = mockStore.scheduled.filter(op => op.id !== id);
      return { ok: true };
    }
    try {
      const response = await apiClient.delete(`/finance/scheduled-expenses/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur suppression dépense programmée:', error);
      throw error;
    }
  },

  executeScheduledExpense: async (id) => {
    if (MOCK) {
      await delay();
      const op = mockStore.scheduled.find(x => x.id === id);
      if (!op) return { ok: false };
      const tx = {
        id: uid(),
        type: op.type,
        amount: op.amount,
        description: op.description,
        category: op.category,
        date: new Date().toISOString().split('T')[0]
      };
      mockStore.transactions.unshift(tx);
      // Si non récurrente, on la retire
      if (!op.recurring || op.recurring === 'none') {
        mockStore.scheduled = mockStore.scheduled.filter(x => x.id !== id);
      }
      return { ok: true, transaction: tx };
    }
    try {
      const response = await apiClient.post(`/finance/scheduled-expenses/${id}/execute`);
      return response.data;
    } catch (error) {
      console.error('Erreur exécution dépense programmée:', error);
      throw error;
    }
  },

  // Transactions
  getTransactions: async (filters = {}) => {
    if (MOCK) {
      await delay();
      const page = Number(filters.page || 1);
      const limit = Number(filters.limit || 20);
      const start = (page - 1) * limit;
      const slice = mockStore.transactions.slice(start, start + limit);
      return { transactions: slice, total: mockStore.transactions.length };
    }
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value);
        }
      });
      const response = await apiClient.get(`/finance/transactions?${params}`);
      return response.data;
    } catch (error) {
      if (is404(error)) {
        console.warn('Finance API: transactions endpoint missing (404) – using empty list');
        return { transactions: [], total: 0 };
      }
      console.error('Erreur récupération transactions:', error);
      throw error;
    }
  },

  createTransaction: async (transactionData) => {
    if (MOCK) {
      await delay();
      const created = { id: uid(), ...transactionData };
      mockStore.transactions.unshift(created);
      // Ajuster solde mock
      mockStore.bankBalance += (transactionData.type === 'recette' ? 1 : -1) * (Number(transactionData.amount || 0));
      return created;
    }
    try {
      const response = await apiClient.post('/finance/transactions', transactionData);
      return response.data;
    } catch (error) {
      if (is404(error)) {
        console.warn('Finance API: create transaction missing – simulating');
        return { id: uid(), ...transactionData };
      }
      console.error('Erreur création transaction:', error);
      throw error;
    }
  },

  updateTransaction: async (id, data) => {
    if (MOCK) {
      await delay();
      mockStore.transactions = mockStore.transactions.map(tx => tx.id === id ? { ...tx, ...data } : tx);
      return mockStore.transactions.find(tx => tx.id === id);
    }
    try {
      const response = await apiClient.put(`/finance/transactions/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur mise à jour transaction:', error);
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    if (MOCK) {
      await delay();
      mockStore.transactions = mockStore.transactions.filter(tx => tx.id !== id);
      return { ok: true };
    }
    try {
      const response = await apiClient.delete(`/finance/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur suppression transaction:', error);
      throw error;
    }
  },

  // Adhésions
  syncMemberships: async () => {
    if (MOCK) {
      await delay(600);
      return { synchronized: 0, ok: true };
    }
    try {
      const response = await apiClient.post('/finance/sync/memberships');
      return response.data;
    } catch (error) {
      if (is404(error)) {
        console.warn('Finance API: sync memberships missing – simulating');
        return { synchronized: 0, ok: true };
      }
      console.error('Erreur sync adhésions:', error);
      throw error;
    }
  },

  // Catégories
  getCategories: async () => {
    if (MOCK) {
      await delay();
      return { categories: mockStore.categories };
    }
    try {
      const response = await apiClient.get('/finance/categories');
      return response.data;
    } catch (error) {
      console.warn('Finance API: categories endpoint missing or error – using defaults', error);
      return { categories: mockStore.categories };
    }
  },

  // Breakdown par catégorie
  getCategoryBreakdown: async (period = 'month') => {
    if (MOCK) {
      await delay();
      return { period, breakdown: [], total: 0 };
    }
    try {
      const response = await apiClient.get('/finance/category-breakdown', { params: { period } });
      return response.data;
    } catch (error) {
      if (is404(error)) {
        console.warn('Finance API: category-breakdown endpoint missing (404) – using empty breakdown');
        return { period, breakdown: [], total: 0 };
      }
      console.error('Erreur breakdown catégories:', error);
      throw error;
    }
  },

  // Export
  exportData: async (format = 'csv', filters = {}) => {
    if (MOCK) {
      await delay();
      const csvContent = 'Date,Type,Description,Montant\n2024-01-15,Recette,Adhésion Test,60.00\n';
      return new Blob([csvContent], { type: 'text/csv' });
    }
    try {
      const response = await apiClient.get('/finance/export', { 
        params: { format, ...filters },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.warn('Finance API: export fallback to simulated CSV');
      const csvContent = 'Date,Type,Description,Montant\n2024-01-15,Recette,Adhésion Test,60.00\n';
      return new Blob([csvContent], { type: 'text/csv' });
    }
  }
};