export const CREATOR_WHITELIST = ["w.belaidi", "admin"];

export function canCreate(matricule) {
  if (!matricule) return false;
  return CREATOR_WHITELIST.includes(String(matricule).toLowerCase());
}

// Roles catalog and helpers
export const ROLES = [
  { code: 'ADMIN', label: 'Administrateur' },
  { code: 'VOLUNTEER', label: 'Bénévole' },
  { code: 'DRIVER', label: 'Conducteur' },
  { code: 'MEMBER', label: 'Membre' },
  // Legacy / bureau (compat)
  { code: 'PRESIDENT', label: 'Président (héritage)' },
  { code: 'VICE_PRESIDENT', label: 'Vice-président (héritage)' },
  { code: 'TRESORIER', label: 'Trésorier (héritage)' },
  { code: 'SECRETAIRE_GENERAL', label: 'Secrétaire général (héritage)' }
];

export function normalizeRole(input) {
  if (!input) return 'MEMBER';
  let raw = String(input).trim().toUpperCase().replace(/[-\s]+/g, '_');
  const map = {
    'ADMINISTRATEUR': 'ADMIN',
    'ADMINISTRATEURS': 'ADMIN',
    'BENEVOLE': 'VOLUNTEER',
    'BÉNÉVOLE': 'VOLUNTEER',
    'BENEVOLES': 'VOLUNTEER',
    'BÉNÉVOLES': 'VOLUNTEER',
    'CONDUCTEUR': 'DRIVER',
    'CONDUCTEURS': 'DRIVER',
    'MEMBRE': 'MEMBER',
    'MEMBRES': 'MEMBER'
  };
  if (map[raw]) raw = map[raw];
  const allowed = new Set(ROLES.map(r => r.code));
  return allowed.has(raw) ? raw : 'MEMBER';
}

export function roleLabel(code) {
  const r = ROLES.find(r => r.code === code);
  return r ? r.label : code;
}
