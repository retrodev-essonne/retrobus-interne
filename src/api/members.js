import { apiClient, API_BASE_URL } from './config.js';

export const membersAPI = {
  baseURL: API_BASE_URL,
  
  async getAll() {
    try {
      console.log('🔍 Chargement des membres...');
      
      // Maintenant on utilise le bon endpoint
      const response = await apiClient.get('/api/members');
      console.log('✅ Membres chargés:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Erreur chargement membres:', error);
      throw new Error(`Impossible de charger les membres: ${error.message}`);
    }
  },

  async getById(id) {
    try {
      const response = await apiClient.get(`/api/members/${id}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur getById:', error);
      throw error;
    }
  },

  async create(memberData) {
    try {
      console.log('👤 Création membre:', memberData);
      const response = await apiClient.post('/api/members', memberData);
      console.log('✅ Membre créé:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur création membre:', error);
      throw error;
    }
  },

  async createWithLogin(memberData) {
    try {
      console.log('👤 Création membre avec login:', memberData);
      const response = await apiClient.post('/api/members/create-with-login', memberData);
      console.log('✅ Membre avec login créé:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur createWithLogin:', error);
      throw error;
    }
  },

  async update(id, updates) {
    try {
      const response = await apiClient.patch(`/api/members/${id}`, updates);
      return response;
    } catch (error) {
      console.error('❌ Erreur update:', error);
      throw error;
    }
  },

  async resetPassword(id) {
    try {
      const response = await apiClient.post(`/api/members/${id}/reset-password`);
      return response;
    } catch (error) {
      console.error('❌ Erreur resetPassword:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      await apiClient.delete(`/api/members/${id}`);
    } catch (error) {
      console.error('❌ Erreur delete:', error);
      throw error;
    }
  },

  async testConnectivity() {
    try {
      console.log('🔍 Test de connectivité API...');
      const response = await apiClient.get('/health');
      console.log('✅ API accessible:', response);
      return true;
    } catch (error) {
      console.error('❌ API inaccessible:', error);
      return false;
    }
  }
};
