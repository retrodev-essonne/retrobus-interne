import api from './config';

export const vehiculesAPI = {
  async getAll() {
    try {
      const res = await api.get('/vehicles');
      return Array.isArray(res) ? res : (res.vehicles || []);
    } catch (e) {
      console.error('vehicles.getAll:', e);
      return [];
    }
  }
};