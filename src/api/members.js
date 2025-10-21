import { apiClient, API_BASE_URL } from './config.js';

export const membersAPI = {
  baseURL: API_BASE_URL,
  
  async getAll() {
    try {
      console.log('🔍 Tentative de chargement des membres...');
      console.log('📡 URL de base:', API_BASE_URL);
      
      // Essayer plusieurs endpoints possibles
      const possibleEndpoints = [
        '/api/members',      // Standard REST API
        '/api/site-users',   // Utilisateurs du site
        '/members',          // Endpoint direct
        '/api/users'         // Alternative
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

  async create(memberData) {
    try {
      console.log('👤 Création membre:', memberData);
      
      // Essayer plusieurs endpoints pour la création
      const possibleEndpoints = [
        '/api/members',
        '/api/members/create',
        '/api/site-users',
        '/members'
      ];
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔗 Test création avec endpoint: ${endpoint}`);
          const response = await apiClient.post(endpoint, memberData);
          console.log(`✅ Membre créé avec succès via ${endpoint}:`, response);
          return response;
        } catch (error) {
          console.log(`❌ Échec création via ${endpoint}:`, error.message);
          // Si c'est la dernière tentative, on relance l'erreur
          if (endpoint === possibleEndpoints[possibleEndpoints.length - 1]) {
            throw error;
          }
          continue;
        }
      }
    } catch (error) {
      console.error('❌ Erreur création membre:', error);
      throw error;
    }
  },

  async createWithLogin(memberData) {
    try {
      console.log('👤 Création membre avec login:', memberData);
      
      // Essayer plusieurs endpoints pour la création avec login
      const possibleEndpoints = [
        '/api/members/create-with-login',
        '/api/members/create',
        '/api/site-users/create-with-login',
        '/api/members'
      ];
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔗 Test création avec login via endpoint: ${endpoint}`);
          const response = await apiClient.post(endpoint, memberData);
          console.log(`✅ Membre avec login créé via ${endpoint}:`, response);
          return response;
        } catch (error) {
          console.log(`❌ Échec création avec login via ${endpoint}:`, error.message);
          // Si c'est la dernière tentative, on relance l'erreur
          if (endpoint === possibleEndpoints[possibleEndpoints.length - 1]) {
            throw error;
          }
          continue;
        }
      }
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

  // Fonction de test de connectivité améliorée
  async testConnectivity() {
    try {
      console.log('🔍 Test de connectivité de l\'API...');
      
      // Tester plusieurs endpoints de santé
      const healthEndpoints = [
        '/api/health',
        '/health',
        '/ping',
        '/api/ping',
        '/api/status'
      ];
      
      for (const endpoint of healthEndpoints) {
        try {
          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            console.log(`✅ API accessible via ${endpoint}`);
            return true;
          }
        } catch (error) {
          console.log(`❌ Endpoint ${endpoint} non accessible:`, error.message);
          continue;
        }
      }
      
      console.log('⚠️ Aucun endpoint de santé accessible');
      return false;
    } catch (error) {
      console.error('❌ Test de connectivité échoué:', error);
      return false;
    }
  }
};
