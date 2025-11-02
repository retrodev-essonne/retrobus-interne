import { useUser } from '../context/UserContext';
import {
  hasPermission,
  canAccess,
  canView,
  canEdit,
  getRolePermissions
} from '../lib/permissions';

/**
 * Hook pour utiliser les permissions dans les composants
 * Utilise le rôle de l'utilisateur actuellement connecté
 */
export function usePermissions() {
  const { role } = useUser();

  return {
    role,
    hasPermission: (resource, permissionType = 'access') => 
      hasPermission(role, resource, permissionType),
    canAccess: (resource) => 
      canAccess(role, resource),
    canView: (resource) => 
      canView(role, resource),
    canEdit: (resource) => 
      canEdit(role, resource),
    permissions: getRolePermissions(role)
  };
}

/**
 * Hook pour afficher/masquer un composant en fonction des permissions
 */
export function usePermissionCheck(resource, permissionType = 'access') {
  const perms = usePermissions();
  return perms.hasPermission(resource, permissionType);
}

/**
 * Hook pour vérifier l'accès à plusieurs ressources
 */
export function useMultiPermissionCheck(resources) {
  const perms = usePermissions();
  return Object.fromEntries(
    resources.map(resource => [
      resource,
      perms.hasPermission(resource)
    ])
  );
}

export default usePermissions;
