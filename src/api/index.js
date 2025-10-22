// Export de toutes les API clients
export { apiClient, API_BASE_URL } from './config.js';
export { AuthAPI } from './auth.js';
export { eventsAPI } from './events.js';
export { vehiculesAPI } from './vehicles.js';
export { membersAPI } from './members.js';
export { documentsAPI } from './documents.js';
export { newsletterAPI } from './newsletter.js';
export { myRBEAPI } from './myrbe.js';
export { flashAPI } from './flash.js';
export { stocksAPI } from './stocks.js';
export { FinanceAPI } from './finance.js';

// Import des API pour l'export par défaut
import { apiClient, API_BASE_URL } from './config.js';
import { AuthAPI } from './auth.js';
import { FinanceAPI } from './finance.js';

// Commente/supprime temporairement les APIs manquantes
// import { eventsAPI } from './events.js';
// import { vehiculesAPI } from './vehicles.js';
// import { membersAPI } from './members.js';
// import { documentsAPI } from './documents.js';
// import { newsletterAPI } from './newsletter.js';
// import { myRBEAPI } from './myrbe.js';
// import { flashAPI } from './flash.js';
// import { stocksAPI } from './stocks.js';

// ✅ Alias simple compatible avec l'existant
export const api = {
  get: (url, options) => apiClient.get(url, options),
  post: (url, data, options) => apiClient.post(url, data, options),
  put: (url, data, options) => apiClient.put(url, data, options),
  delete: (url, options) => apiClient.delete(url, options),
};

// Export par défaut de toutes les API
export default {
  auth: AuthAPI,           // ✅ majuscule
  finance: FinanceAPI,
};

// ✅ Helpers (optionnel)
export const login = (credentials) => AuthAPI.login(credentials);
export const logout = () => AuthAPI.logout();
export const getMe = () => AuthAPI.me();