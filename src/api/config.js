// Configuration de base pour les API
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error('API non configurée (VITE_API_URL manquante)');
}

// Headers par défaut
const getDefaultHeaders = (options = {}) => ({
  'Content-Type': 'application/json',
  ...options.headers,
});

// Headers avec authentification JWT
const getAuthHeaders = (token, options = {}) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
  ...options.headers,
});

// Fonction pour parser la réponse de manière sécurisée
const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      console.error('❌ Erreur parsing JSON:', error);
      throw new Error('Réponse JSON invalide du serveur');
    }
  } else {
    // Si ce n'est pas du JSON, récupérer le texte pour débogage
    const text = await response.text();
    console.error('❌ Réponse non-JSON reçue:', text.substring(0, 200) + '...');
    
    if (text.includes('<!DOCTYPE')) {
      throw new Error('Le serveur a renvoyé une page HTML au lieu de JSON. Vérifiez l\'URL de l\'API.');
    } else {
      throw new Error(`Réponse inattendue du serveur (${response.status}): ${text.substring(0, 100)}`);
    }
  }
};

// Instance API client avec support JWT et gestion d'erreur améliorée
export const apiClient = {
  baseURL: API_BASE_URL,
  
  get: async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = token 
      ? getAuthHeaders(token, options)
      : getDefaultHeaders(options);

    console.log(`🔗 GET ${API_BASE_URL}${url}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers,
        ...options,
      });
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('🔒 Token expiré, redirection vers login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        
        // Essayer de récupérer le message d'erreur du serveur
        const errorData = await parseResponse(response);
        const errorMessage = errorData?.error || errorData?.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return await parseResponse(response);
    } catch (error) {
      console.error(`❌ Erreur GET ${url}:`, error.message);
      throw error;
    }
  },
  
  post: async (url, data, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = token 
      ? getAuthHeaders(token, options)
      : getDefaultHeaders(options);

    console.log(`🔗 POST ${API_BASE_URL}${url}`, data);
    
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        ...options,
      });
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('🔒 Token expiré, redirection vers login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        
        // Essayer de récupérer le message d'erreur du serveur
        const errorData = await parseResponse(response);
        const errorMessage = errorData?.error || errorData?.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return await parseResponse(response);
    } catch (error) {
      console.error(`❌ Erreur POST ${url}:`, error.message);
      throw error;
    }
  },
  
  put: async (url, data, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = token 
      ? getAuthHeaders(token, options)
      : getDefaultHeaders(options);

    console.log(`🔗 PUT ${API_BASE_URL}${url}`, data);
    
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        ...options,
      });
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('🔒 Token expiré, redirection vers login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        
        const errorData = await parseResponse(response);
        const errorMessage = errorData?.error || errorData?.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return await parseResponse(response);
    } catch (error) {
      console.error(`❌ Erreur PUT ${url}:`, error.message);
      throw error;
    }
  },

  patch: async (url, data, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = token 
      ? getAuthHeaders(token, options)
      : getDefaultHeaders(options);

    console.log(`🔗 PATCH ${API_BASE_URL}${url}`, data);
    
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
        ...options,
      });
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('🔒 Token expiré, redirection vers login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        
        const errorData = await parseResponse(response);
        const errorMessage = errorData?.error || errorData?.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return await parseResponse(response);
    } catch (error) {
      console.error(`❌ Erreur PATCH ${url}:`, error.message);
      throw error;
    }
  },

  delete: async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = token 
      ? getAuthHeaders(token, options)
      : getDefaultHeaders(options);

    console.log(`🔗 DELETE ${API_BASE_URL}${url}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        headers,
        ...options,
      });
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('🔒 Token expiré, redirection vers login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        
        const errorData = await parseResponse(response);
        const errorMessage = errorData?.error || errorData?.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }
      
      // DELETE peut retourner du contenu ou être vide
      const contentLength = response.headers.get('content-length');
      if (contentLength === '0' || response.status === 204) {
        return { success: true };
      }
      
      return await parseResponse(response);
    } catch (error) {
      console.error(`❌ Erreur DELETE ${url}:`, error.message);
      throw error;
    }
  }
};

export { API_BASE_URL };

