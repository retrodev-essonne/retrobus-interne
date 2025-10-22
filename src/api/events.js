import api from './config';

export const eventsAPI = {
  async getAll() {
    try {
      const res = await api.get('/events');
      return Array.isArray(res) ? res : (res.events || []);
    } catch (e) {
      console.error('events.getAll:', e);
      return [];
    }
  },
  
  // Récupérer un événement par ID
  getById: async (id) => {
    return api.get(`/events/${id}`);
  },
  
  // Créer un nouvel événement
  create: async (eventData) => {
    return api.post('/events', eventData);
  },
  
  // Mettre à jour un événement
  update: async (id, eventData) => {
    return api.put(`/events/${id}`, eventData);
  },
  
  // Supprimer un événement
  delete: async (id) => {
    return api.delete(`/events/${id}`);
  },
  
  // Publier/dépublier un événement
  publish: async (id, status) => {
    return api.put(`/events/${id}`, { status });
  }
};