/**
 * Système de permissions granulaire basé sur les rôles
 * Chaque rôle peut avoir des permissions pour: Accès (access), Vue (view), et Modification (edit)
 */

// ============================================================================
// RESSOURCES ET PERMISSIONS
// ============================================================================

export const RESOURCES = {
  // Gestion du site
  SITE_MANAGEMENT: 'site:management',
  SITE_USERS: 'site:users',
  SITE_CONFIG: 'site:config',
  SITE_CONTENT: 'site:content',
  
  // Véhicules
  VEHICLES: 'vehicles:list',
  VEHICLE_VIEW: 'vehicles:view',
  VEHICLE_CREATE: 'vehicles:create',
  VEHICLE_EDIT: 'vehicles:edit',
  VEHICLE_DELETE: 'vehicles:delete',
  
  // Événements
  EVENTS: 'events:list',
  EVENT_VIEW: 'events:view',
  EVENT_CREATE: 'events:create',
  EVENT_EDIT: 'events:edit',
  EVENT_DELETE: 'events:delete',
  
  // Finances
  FINANCE: 'finance:access',
  FINANCE_VIEW: 'finance:view',
  FINANCE_EDIT: 'finance:edit',
  
  // Membres
  MEMBERS: 'members:list',
  MEMBER_VIEW: 'members:view',
  MEMBER_EDIT: 'members:edit',
  MEMBER_DELETE: 'members:delete',
  
  // Stocks
  STOCK: 'stock:access',
  STOCK_VIEW: 'stock:view',
  STOCK_EDIT: 'stock:edit',
  
  // Communications
  NEWSLETTER: 'newsletter:access',
  RETROMAIL: 'retromail:access',
  
  // RétroPlanning (Calendrier et Événements)
  RETROPLANNING: 'retroplanning:access',
  RETROPLANNING_VIEW: 'retroplanning:view',
  RETROPLANNING_CREATE: 'retroplanning:create',
  RETROPLANNING_RESPOND: 'retroplanning:respond',
  
  // RétroSupport (Support technique)
  RETROSUPPORT: 'retrosupport:access',
  RETROSUPPORT_VIEW: 'retrosupport:view',
  RETROSUPPORT_CREATE: 'retrosupport:create',
  
  // MyRBE (Dashboard personnel)
  MYRBE: 'myrbe:access',
  MYRBE_VIEW: 'myrbe:view',
  
  // Administration
  ADMIN_PANEL: 'admin:panel',
  ADMIN_LOGS: 'admin:logs',
  ADMIN_SETTINGS: 'admin:settings'
};

export const PERMISSION_TYPES = {
  ACCESS: 'access',    // Peut accéder à la ressource
  VIEW: 'view',        // Peut voir les détails
  EDIT: 'edit'         // Peut modifier/créer
};

// ============================================================================
// DÉFINITION DES RÔLES ET LEURS PERMISSIONS
// ============================================================================

export const ROLE_PERMISSIONS = {
  // Administrateur: accès complet
  ADMIN: {
    label: 'Administrateur',
    color: 'red',
    permissions: {
      [RESOURCES.SITE_MANAGEMENT]: ['access', 'view', 'edit'],
      [RESOURCES.SITE_USERS]: ['access', 'view', 'edit'],
      [RESOURCES.SITE_CONFIG]: ['access', 'view', 'edit'],
      [RESOURCES.SITE_CONTENT]: ['access', 'view', 'edit'],
      
      [RESOURCES.VEHICLES]: ['access', 'view', 'edit'],
      [RESOURCES.VEHICLE_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.VEHICLE_CREATE]: ['access', 'view', 'edit'],
      [RESOURCES.VEHICLE_EDIT]: ['access', 'view', 'edit'],
      [RESOURCES.VEHICLE_DELETE]: ['access', 'view', 'edit'],
      
      [RESOURCES.EVENTS]: ['access', 'view', 'edit'],
      [RESOURCES.EVENT_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.EVENT_CREATE]: ['access', 'view', 'edit'],
      [RESOURCES.EVENT_EDIT]: ['access', 'view', 'edit'],
      [RESOURCES.EVENT_DELETE]: ['access', 'view', 'edit'],
      
      [RESOURCES.FINANCE]: ['access', 'view', 'edit'],
      [RESOURCES.FINANCE_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.FINANCE_EDIT]: ['access', 'view', 'edit'],
      
      [RESOURCES.MEMBERS]: ['access', 'view', 'edit'],
      [RESOURCES.MEMBER_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.MEMBER_EDIT]: ['access', 'view', 'edit'],
      [RESOURCES.MEMBER_DELETE]: ['access', 'view', 'edit'],
      
      [RESOURCES.STOCK]: ['access', 'view', 'edit'],
      [RESOURCES.STOCK_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.STOCK_EDIT]: ['access', 'view', 'edit'],
      
      [RESOURCES.NEWSLETTER]: ['access', 'view', 'edit'],
      [RESOURCES.RETROMAIL]: ['access', 'view', 'edit'],
      
      [RESOURCES.RETROPLANNING]: ['access', 'view', 'edit'],
      [RESOURCES.RETROPLANNING_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.RETROPLANNING_CREATE]: ['access', 'view', 'edit'],
      [RESOURCES.RETROPLANNING_RESPOND]: ['access', 'view', 'edit'],
      
      [RESOURCES.RETROSUPPORT]: ['access', 'view', 'edit'],
      [RESOURCES.RETROSUPPORT_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.RETROSUPPORT_CREATE]: ['access', 'view', 'edit'],
      
      [RESOURCES.MYRBE]: ['access', 'view', 'edit'],
      [RESOURCES.MYRBE_VIEW]: ['access', 'view', 'edit'],
      
      [RESOURCES.ADMIN_PANEL]: ['access', 'view', 'edit'],
      [RESOURCES.ADMIN_LOGS]: ['access', 'view', 'edit'],
      [RESOURCES.ADMIN_SETTINGS]: ['access', 'view', 'edit']
    }
  },

  // Président: gestion complète du site
  PRESIDENT: {
    label: 'Président',
    color: 'red',
    permissions: {
      [RESOURCES.SITE_MANAGEMENT]: ['access', 'view', 'edit'],
      [RESOURCES.SITE_USERS]: ['access', 'view', 'edit'],
      [RESOURCES.SITE_CONFIG]: ['access', 'view', 'edit'],
      [RESOURCES.SITE_CONTENT]: ['access', 'view', 'edit'],
      
      [RESOURCES.VEHICLES]: ['access', 'view', 'edit'],
      [RESOURCES.VEHICLE_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.VEHICLE_CREATE]: ['access', 'view', 'edit'],
      [RESOURCES.VEHICLE_EDIT]: ['access', 'view', 'edit'],
      [RESOURCES.VEHICLE_DELETE]: ['access', 'view'],
      
      [RESOURCES.EVENTS]: ['access', 'view', 'edit'],
      [RESOURCES.EVENT_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.EVENT_CREATE]: ['access', 'view', 'edit'],
      [RESOURCES.EVENT_EDIT]: ['access', 'view', 'edit'],
      [RESOURCES.EVENT_DELETE]: ['access', 'view'],
      
      [RESOURCES.FINANCE]: ['access', 'view'],
      [RESOURCES.FINANCE_VIEW]: ['access', 'view'],
      
      [RESOURCES.MEMBERS]: ['access', 'view', 'edit'],
      [RESOURCES.MEMBER_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.MEMBER_EDIT]: ['access', 'view', 'edit'],
      
      [RESOURCES.STOCK]: ['access', 'view', 'edit'],
      [RESOURCES.STOCK_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.STOCK_EDIT]: ['access', 'view', 'edit'],
      
      [RESOURCES.NEWSLETTER]: ['access', 'view', 'edit'],
      [RESOURCES.RETROMAIL]: ['access', 'view'],
      
      [RESOURCES.RETROPLANNING]: ['access', 'view', 'edit'],
      [RESOURCES.RETROPLANNING_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.RETROPLANNING_CREATE]: ['access', 'view', 'edit'],
      [RESOURCES.RETROPLANNING_RESPOND]: ['access', 'view', 'edit'],
      
      [RESOURCES.RETROSUPPORT]: ['access', 'view', 'edit'],
      [RESOURCES.RETROSUPPORT_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.RETROSUPPORT_CREATE]: ['access', 'view', 'edit'],
      
      [RESOURCES.MYRBE]: ['access', 'view', 'edit'],
      [RESOURCES.MYRBE_VIEW]: ['access', 'view', 'edit'],
      
      [RESOURCES.ADMIN_LOGS]: ['access', 'view']
    }
  },

  // Vice-président: similaire au président mais sans certains accès
  VICE_PRESIDENT: {
    label: 'Vice-Président',
    color: 'pink',
    permissions: {
      [RESOURCES.SITE_MANAGEMENT]: ['access', 'view'],
      [RESOURCES.SITE_USERS]: ['access', 'view'],
      [RESOURCES.SITE_CONFIG]: ['access', 'view'],
      [RESOURCES.SITE_CONTENT]: ['access', 'view', 'edit'],
      
      [RESOURCES.VEHICLES]: ['access', 'view', 'edit'],
      [RESOURCES.VEHICLE_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.VEHICLE_CREATE]: ['access', 'view', 'edit'],
      [RESOURCES.VEHICLE_EDIT]: ['access', 'view', 'edit'],
      
      [RESOURCES.EVENTS]: ['access', 'view', 'edit'],
      [RESOURCES.EVENT_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.EVENT_CREATE]: ['access', 'view', 'edit'],
      [RESOURCES.EVENT_EDIT]: ['access', 'view', 'edit'],
      
      [RESOURCES.MEMBERS]: ['access', 'view'],
      [RESOURCES.MEMBER_VIEW]: ['access', 'view'],
      
      [RESOURCES.STOCK]: ['access', 'view'],
      [RESOURCES.STOCK_VIEW]: ['access', 'view'],
      
      [RESOURCES.NEWSLETTER]: ['access', 'view', 'edit'],
      [RESOURCES.RETROMAIL]: ['access', 'view']
    }
  },

  // Trésorier: accès finances
  TRESORIER: {
    label: 'Trésorier',
    color: 'green',
    permissions: {
      [RESOURCES.SITE_MANAGEMENT]: ['access', 'view'],
      [RESOURCES.SITE_USERS]: ['access', 'view'],
      [RESOURCES.SITE_CONFIG]: ['access', 'view'],
      
      [RESOURCES.VEHICLES]: ['access', 'view'],
      [RESOURCES.VEHICLE_VIEW]: ['access', 'view'],
      
      [RESOURCES.EVENTS]: ['access', 'view'],
      [RESOURCES.EVENT_VIEW]: ['access', 'view'],
      
      [RESOURCES.FINANCE]: ['access', 'view', 'edit'],
      [RESOURCES.FINANCE_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.FINANCE_EDIT]: ['access', 'view', 'edit'],
      
      [RESOURCES.MEMBERS]: ['access', 'view'],
      [RESOURCES.MEMBER_VIEW]: ['access', 'view'],
      
      [RESOURCES.STOCK]: ['access', 'view'],
      [RESOURCES.STOCK_VIEW]: ['access', 'view']
    }
  },

  // Secrétaire général: gestion des communications
  SECRETAIRE_GENERAL: {
    label: 'Secrétaire Général',
    color: 'purple',
    permissions: {
      [RESOURCES.SITE_MANAGEMENT]: ['access', 'view'],
      [RESOURCES.SITE_CONTENT]: ['access', 'view', 'edit'],
      
      [RESOURCES.VEHICLES]: ['access', 'view'],
      [RESOURCES.VEHICLE_VIEW]: ['access', 'view'],
      
      [RESOURCES.EVENTS]: ['access', 'view', 'edit'],
      [RESOURCES.EVENT_VIEW]: ['access', 'view', 'edit'],
      [RESOURCES.EVENT_CREATE]: ['access', 'view', 'edit'],
      [RESOURCES.EVENT_EDIT]: ['access', 'view', 'edit'],
      
      [RESOURCES.MEMBERS]: ['access', 'view'],
      [RESOURCES.MEMBER_VIEW]: ['access', 'view'],
      
      [RESOURCES.NEWSLETTER]: ['access', 'view', 'edit'],
      [RESOURCES.RETROMAIL]: ['access', 'view', 'edit']
    }
  },

  // Bénévole: accès limité, peut voir et contribuer
  VOLUNTEER: {
    label: 'Bénévole',
    color: 'orange',
    permissions: {
      [RESOURCES.VEHICLES]: ['access', 'view'],
      [RESOURCES.VEHICLE_VIEW]: ['access', 'view'],
      [RESOURCES.VEHICLE_CREATE]: ['access', 'view'],
      [RESOURCES.VEHICLE_EDIT]: ['access', 'view'],
      
      [RESOURCES.EVENTS]: ['access', 'view'],
      [RESOURCES.EVENT_VIEW]: ['access', 'view'],
      [RESOURCES.EVENT_CREATE]: ['access', 'view'],
      
      [RESOURCES.MEMBERS]: ['access', 'view'],
      [RESOURCES.MEMBER_VIEW]: ['access', 'view'],
      
      [RESOURCES.STOCK]: ['access', 'view'],
      [RESOURCES.STOCK_VIEW]: ['access', 'view'],
      
      [RESOURCES.NEWSLETTER]: ['access', 'view']
    }
  },

  // Conducteur: accès minimal, voir véhicules et événements
  DRIVER: {
    label: 'Conducteur',
    color: 'cyan',
    permissions: {
      [RESOURCES.VEHICLES]: ['access', 'view'],
      [RESOURCES.VEHICLE_VIEW]: ['access', 'view'],
      
      [RESOURCES.EVENTS]: ['access', 'view'],
      [RESOURCES.EVENT_VIEW]: ['access', 'view']
    }
  },

  // Prestataire: accès limité - UNIQUEMENT RétroPlanning, RétroSupport (pas d'accès à MyRBE entier, mais à ses sous-sections)
  PRESTATAIRE: {
    label: 'Prestataire',
    color: 'yellow',
    permissions: {
      [RESOURCES.RETROPLANNING]: ['access', 'view', 'edit'],
      [RESOURCES.RETROPLANNING_VIEW]: ['access', 'view'],
      [RESOURCES.RETROPLANNING_CREATE]: ['access', 'view', 'edit'],
      [RESOURCES.RETROPLANNING_RESPOND]: ['access', 'view', 'edit'],
      
      [RESOURCES.RETROSUPPORT]: ['access', 'view', 'edit'],
      [RESOURCES.RETROSUPPORT_VIEW]: ['access', 'view'],
      [RESOURCES.RETROSUPPORT_CREATE]: ['access', 'view', 'edit']
    }
  },

  // Membre: accès très limité
  MEMBER: {
    label: 'Membre',
    color: 'blue',
    permissions: {
      [RESOURCES.VEHICLES]: ['access', 'view'],
      [RESOURCES.VEHICLE_VIEW]: ['access', 'view'],
      
      [RESOURCES.EVENTS]: ['access', 'view'],
      [RESOURCES.EVENT_VIEW]: ['access', 'view'],
      
      [RESOURCES.NEWSLETTER]: ['access', 'view']
    }
  }
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Vérifie si un utilisateur a une permission spécifique
 * Prend en compte les permissions individuelles D'ABORD, puis les permissions du rôle
 * @param {string} role - Code du rôle
 * @param {string} resource - Ressource à vérifier
 * @param {string} permissionType - Type de permission ('access', 'view', 'edit')
 * @param {object} customPermissions - Permissions individuelles (optionnel)
 * @returns {boolean}
 */
export function hasPermission(role, resource, permissionType = 'access', customPermissions = null) {
  // D'abord vérifier les permissions individuelles si elles existent
  if (customPermissions && customPermissions[resource] !== undefined) {
    return !!customPermissions[resource];
  }
  
  // Fallback aux permissions du rôle
  const roleConfig = ROLE_PERMISSIONS[role];
  if (!roleConfig) return false;
  
  const resourcePermissions = roleConfig.permissions[resource];
  if (!resourcePermissions) return false;
  
  return resourcePermissions.includes(permissionType);
}

/**
 * Vérifie si un rôle peut accéder à une ressource
 * Optionnellement prend en compte les permissions individuelles
 */
export function canAccess(role, resource, customPermissions = null) {
  return hasPermission(role, resource, 'access', customPermissions);
}

/**
 * Vérifie si un rôle peut voir une ressource
 * Optionnellement prend en compte les permissions individuelles
 */
export function canView(role, resource, customPermissions = null) {
  return hasPermission(role, resource, 'view', customPermissions) || hasPermission(role, resource, 'edit', customPermissions);
}

/**
 * Vérifie si un rôle peut modifier une ressource
 * Optionnellement prend en compte les permissions individuelles
 */
export function canEdit(role, resource, customPermissions = null) {
  return hasPermission(role, resource, 'edit', customPermissions);
}

/**
 * Obtient toutes les permissions d'un rôle
 */
export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role]?.permissions || {};
}

/**
 * Obtient le label d'un rôle
 */
export function getRoleLabel(role) {
  return ROLE_PERMISSIONS[role]?.label || role;
}

/**
 * Obtient la couleur d'un rôle
 */
export function getRoleColor(role) {
  return ROLE_PERMISSIONS[role]?.color || 'gray';
}

/**
 * Obtient tous les rôles disponibles
 */
export function getAllRoles() {
  return Object.keys(ROLE_PERMISSIONS).map(code => ({
    code,
    label: ROLE_PERMISSIONS[code].label,
    color: ROLE_PERMISSIONS[code].color
  }));
}

/**
 * Filtre les ressources en fonction des permissions d'un rôle
 */
export function getAccessibleResources(role) {
  const permissions = getRolePermissions(role);
  return Object.keys(permissions).filter(resource => permissions[resource].includes('access'));
}

/**
 * Compare deux rôles pour voir lequel a plus de permissions
 * @returns {number} -1 si role1 < role2, 0 si égal, 1 si role1 > role2
 */
export function compareRoles(role1, role2) {
  const hierarchy = ['MEMBER', 'PRESTATAIRE', 'DRIVER', 'VOLUNTEER', 'SECRETAIRE_GENERAL', 'TRESORIER', 'VICE_PRESIDENT', 'PRESIDENT', 'ADMIN'];
  const idx1 = hierarchy.indexOf(role1);
  const idx2 = hierarchy.indexOf(role2);
  
  if (idx1 < idx2) return -1;
  if (idx1 > idx2) return 1;
  return 0;
}

export default {
  RESOURCES,
  PERMISSION_TYPES,
  ROLE_PERMISSIONS,
  hasPermission,
  canAccess,
  canView,
  canEdit,
  getRolePermissions,
  getRoleLabel,
  getRoleColor,
  getAllRoles,
  getAccessibleResources,
  compareRoles
};
