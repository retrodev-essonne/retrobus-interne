/**
 * Hook pour vérifier les permissions de gestion des véhicules
 * Centralise la logique d'autorisation pour les opérations sur les véhicules
 */

import { useUser } from '../context/UserContext';
import { RESOURCES, ROLE_PERMISSIONS, PERMISSION_TYPES } from '../lib/permissions';

export function useVehiclePermissions() {
  const { matricule, roles = [] } = useUser();

  // Récupérer le premier rôle (rôle principal)
  const userRole = roles?.[0] || null;

  /**
   * Vérifie si l'utilisateur peut créer un véhicule
   * @returns {boolean}
   */
  const canCreateVehicle = () => {
    if (!userRole || !matricule) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[userRole]?.permissions;
    if (!rolePermissions) return false;

    const permissions = rolePermissions[RESOURCES.VEHICLE_CREATE] || [];
    return permissions.includes(PERMISSION_TYPES.EDIT) || 
           permissions.includes('edit');
  };

  /**
   * Vérifie si l'utilisateur peut voir les véhicules
   * @returns {boolean}
   */
  const canViewVehicles = () => {
    if (!userRole || !matricule) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[userRole]?.permissions;
    if (!rolePermissions) return false;

    const permissions = rolePermissions[RESOURCES.VEHICLES] || [];
    return permissions.includes(PERMISSION_TYPES.VIEW) || 
           permissions.includes('view') ||
           permissions.includes(PERMISSION_TYPES.EDIT) ||
           permissions.includes('edit');
  };

  /**
   * Vérifie si l'utilisateur peut éditer un véhicule
   * @returns {boolean}
   */
  const canEditVehicle = () => {
    if (!userRole || !matricule) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[userRole]?.permissions;
    if (!rolePermissions) return false;

    const permissions = rolePermissions[RESOURCES.VEHICLE_EDIT] || [];
    return permissions.includes(PERMISSION_TYPES.EDIT) || 
           permissions.includes('edit');
  };

  /**
   * Vérifie si l'utilisateur peut supprimer un véhicule
   * @returns {boolean}
   */
  const canDeleteVehicle = () => {
    if (!userRole || !matricule) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[userRole]?.permissions;
    if (!rolePermissions) return false;

    const permissions = rolePermissions[RESOURCES.VEHICLE_DELETE] || [];
    return permissions.includes(PERMISSION_TYPES.EDIT) || 
           permissions.includes('edit');
  };

  /**
   * Obtient un message d'erreur explicite si l'accès est refusé
   * @param {'create'|'view'|'edit'|'delete'} action
   * @returns {string}
   */
  const getAccessDeniedMessage = (action = 'create') => {
    const messages = {
      create: `Vous n'êtes pas autorisé à ajouter des véhicules. Rôle: ${userRole || 'inconnu'}`,
      view: `Vous n'êtes pas autorisé à consulter les véhicules. Rôle: ${userRole || 'inconnu'}`,
      edit: `Vous n'êtes pas autorisé à modifier les véhicules. Rôle: ${userRole || 'inconnu'}`,
      delete: `Vous n'êtes pas autorisé à supprimer les véhicules. Rôle: ${userRole || 'inconnu'}`
    };
    return messages[action] || messages.create;
  };

  return {
    canCreateVehicle,
    canViewVehicles,
    canEditVehicle,
    canDeleteVehicle,
    getAccessDeniedMessage,
    currentRole: userRole,
    currentMatricule: matricule
  };
}
