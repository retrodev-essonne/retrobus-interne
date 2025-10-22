import api from './config';

export const membersAPI = {
  async getAll() {
    try {
      const res = await api.get('/members');
      return res?.members ? res : { members: [], total: 0, active: 0, validated: 0, pending: 0 };
    } catch (e) {
      console.error('members.getAll:', e);
      return { members: [], total: 0, active: 0, validated: 0, pending: 0 };
    }
  },
  async getStats() {
    try {
      const res = await api.get('/members/stats');
      return res || { total: 0, active: 0, validated: 0, pending: 0, newThisMonth: 0, breakdown: [] };
    } catch (e) {
      console.error('members.getStats:', e);
      return { total: 0, active: 0, validated: 0, pending: 0, newThisMonth: 0, breakdown: [] };
    }
  },
  async getById(id) {
    return api.get(`/members/${id}`);
  },
  async update(id, data) {
    return api.put(`/members/${id}`, data);
  },
  async delete(id) {
    return api.delete(`/members/${id}`);
  }
};
