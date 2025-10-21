import { apiClient, API_BASE_URL } from './config.js';

export const membersAPI = {
  baseURL: API_BASE_URL,
  
  async getAll() {
    try {
      console.log('🔍 Tentative de chargement des membres...');
      console.log('📡 URL de base:', API_BASE_URL);
      
      // Essayer plusieurs endpoints possibles
      const possibleEndpoints = [
        '/api/members',  // Standard REST API
        '/members',      // Endpoint direct
        '/api/site-users', // Utilisateurs du site
        '/api/users'     // Alternative
      ];
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔗 Test endpoint: ${API_BASE_URL}${endpoint}`);
          const response = await apiClient.get(endpoint);
          console.log(`✅ Succès avec endpoint: ${endpoint}`, response);
          return response;
        } catch (error) {
          console.log(`❌ Échec endpoint ${endpoint}:`, error.message);
          continue;
        }
      }
      
      // Si aucun endpoint ne fonctionne, retourner des données par défaut
      console.warn('🚨 Aucun endpoint membres fonctionnel, utilisation de données par défaut');
      return {
        members: [],
        total: 0,
        message: 'Endpoint non disponible'
      };
      
    } catch (error) {
      console.error('❌ Erreur générale membersAPI.getAll:', error);
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

  async createWithLogin(memberData) {
    try {
      const response = await apiClient.post('/api/members/create-with-login', memberData);
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

  // Fonction de test de connectivité
  async testConnectivity() {
    try {
      console.log('🔍 Test de connectivité de l\'API...');
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API accessible:', data);
        return true;
      } else {
        console.log('⚠️ API répond avec erreur:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ API inaccessible:', error);
      return false;
    }
  }
};
