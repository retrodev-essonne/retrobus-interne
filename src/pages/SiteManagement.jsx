import React, { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Button, Card, CardBody, CardHeader,
  Heading, Input, Textarea, FormControl, FormLabel, useToast,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, useDisclosure, Badge, IconButton,
  Flex, Spacer, Alert, AlertIcon, Spinner, Center, Container,
  Tabs, TabList, TabPanels, Tab, TabPanel, SimpleGrid, Select,
  Switch, Table, Thead, Tbody, Tr, Th, Td, InputGroup,
  InputLeftElement, Menu, MenuButton, MenuList, MenuItem,
  useColorModeValue, Tooltip, Divider, Stat, StatLabel, StatNumber
} from '@chakra-ui/react';
import { 
  FaEdit, FaTrash, FaPlus, FaUsers, FaKey, FaEye,
  FaUserCheck, FaUserTimes, FaLink, FaUnlink, FaSearch,
  FaGlobe, FaLock, FaUnlock
} from 'react-icons/fa';
import { 
  FiEdit, FiTrash2, FiPlus, FiUsers, FiKey, FiEye, FiShield,
  FiUserCheck, FiUserX, FiLink, FiSearch, FiGlobe, FiLock,
  FiUnlock, FiRefreshCw, FiSettings, FiActivity, FiMail
} from 'react-icons/fi';
import { apiClient } from '../api/config';

// Garde-fou: s'assurer que la réponse est bien du JSON
const ensureJsonResponse = (response) => {
  const ct = (response?.headers?.['content-type'] || '').toLowerCase();
  if (!(ct.includes('application/json') || ct.includes('+json'))) {
    throw new Error("Le serveur a renvoyé une page HTML au lieu de JSON. Vérifiez l'URL de l'API.");
  }
};

// Petits utilitaires pour essayer plusieurs chemins candidats (ex: '/site-users' puis '/api/site-users')
const ENDPOINTS = {
  siteUsers: ['site-users', 'api/site-users', 'users', 'api/v1/site-users', 'v1/site-users'],
  members: ['members', 'api/members', 'api/v1/members', 'v1/members'],
  siteUsersStats: ['site-users/stats', 'api/site-users/stats', 'api/v1/site-users/stats'],
  changelog: ['changelog', 'api/changelog', 'api/v1/changelog', 'v1/changelog']
};
const toUrls = (candidates) =>
  candidates
    .filter(Boolean)
    .map((p) => {
      const s = String(p);
      return s.startsWith('http') ? s : `/${(s || '').replace(/^\/+|\/+$/g, '')}`;
    });
const shouldFallback = (err) => {
  const status = err?.response?.status;
  const isHtml = (err?.response?.headers?.['content-type'] || '').toLowerCase().includes('text/html');
  return status === 404 || isHtml || err?.message?.includes('page HTML');
};

// === nouveau: résolveur de chemins basé sur .env et sur overrides runtime ===
const clean = (s) => (s || '').replace(/^\/+|\/+$/g, '');
const getApiPrefix = () => clean(localStorage.getItem('rbe_api_prefix') || import.meta.env?.VITE_API_PREFIX);
const getUsersPath = () => clean(localStorage.getItem('rbe_api_site_users_path') || import.meta.env?.VITE_API_SITE_USERS_PATH);
const getMembersPath = () => clean(localStorage.getItem('rbe_api_members_path') || import.meta.env?.VITE_API_MEMBERS_PATH);
const getChangelogPath = () => clean(localStorage.getItem('rbe_api_changelog_path') || import.meta.env?.VITE_API_CHANGELOG_PATH);

// Origins (priorité: spécifique ressource > globale > même origine)
const getGlobalOrigin = () =>
  (localStorage.getItem('rbe_api_origin') || import.meta.env?.VITE_API_ORIGIN || '').trim();
const getUsersOrigin = () =>
  (localStorage.getItem('rbe_api_site_users_origin') || import.meta.env?.VITE_API_SITE_USERS_ORIGIN || getGlobalOrigin() || '').trim();
const getMembersOrigin = () =>
  (localStorage.getItem('rbe_api_members_origin') || import.meta.env?.VITE_API_MEMBERS_ORIGIN || getGlobalOrigin() || '').trim();
const getChangelogOrigin = () =>
  (localStorage.getItem('rbe_api_changelog_origin') || import.meta.env?.VITE_API_CHANGELOG_ORIGIN || getGlobalOrigin() || '').trim();

const buildCandidates = (baseCandidates, overridePath, extraSuffix = '', overrideOrigin) => {
  const suffix = clean(extraSuffix);
  const API_PREFIX = getApiPrefix();
  const list = new Set();
  const isHttpOrigin = (o) => /^https?:\/\//i.test(o || '');

  const pushPath = (p) => {
    const parts = [clean(p)];
    if (suffix) parts.push(suffix);
    const rel = parts.filter(Boolean).join('/');
    if (rel) list.add(rel);
    // absolute with explicit origin (only if valid)
    if (overrideOrigin && isHttpOrigin(overrideOrigin)) {
      list.add(`${overrideOrigin.replace(/\/+$/,'')}/${rel}`);
    }
    // absolute with same-origin
    if (typeof window !== 'undefined' && window.location?.origin) {
      list.add(`${window.location.origin}/${rel}`);
    }
  };

  if (overridePath) pushPath(overridePath);
  if (API_PREFIX) baseCandidates.forEach((p) => pushPath(`${API_PREFIX}/${p}`));
  baseCandidates.forEach((p) => pushPath(p));

  return Array.from(list);
};

// === helpers HTTP avec fallback ===
const isAbsoluteUrl = (u) => /^https?:\/\//i.test(u || '');

const fetchJson = async (method, url, data, config) => {
  const headers = { Accept: 'application/json', ...(config?.headers || {}) };
  const init = { method, headers };
  if (data !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(data);
  }
  const resp = await fetch(url, init);
  const resHeaders = { 'content-type': resp.headers.get('content-type') || '' };

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    const err = new Error(`HTTP ${resp.status}`);
    err.response = { status: resp.status, headers: resHeaders, data: text };
    throw err;
  }

  // Build a response-like object compatible with ensureJsonResponse + consumers
  const result = { headers: resHeaders, data: undefined };
  ensureJsonResponse(result);
  result.data = await resp.json().catch(() => undefined);
  return result;
};

const apiGet = async (candidates, config) => {
  const urlsTried = [];
  for (const url of toUrls(candidates)) {
    try {
      urlsTried.push(url);
      const res = isAbsoluteUrl(url)
        ? await fetchJson('GET', url, undefined, config)
        : await apiClient.get(url, config);
      if (!isAbsoluteUrl(url)) ensureJsonResponse(res);
      return res;
    } catch (e) {
      if (!shouldFallback(e)) throw e;
    }
  }
  const error = new Error(`Aucune route API valide. Testé: ${urlsTried.join(', ')}`);
  error.urlsTried = urlsTried;
  throw error;
};
const apiPost = async (candidates, data, config) => {
  const urlsTried = [];
  for (const url of toUrls(candidates)) {
    try {
      urlsTried.push(url);
      const res = isAbsoluteUrl(url)
        ? await fetchJson('POST', url, data, config)
        : await apiClient.post(url, data, config);
      if (!isAbsoluteUrl(url)) ensureJsonResponse(res);
      return res;
    } catch (e) {
      if (!shouldFallback(e)) throw e;
    }
  }
  const error = new Error(`Aucune route API valide. Testé: ${urlsTried.join(', ')}`);
  error.urlsTried = urlsTried;
  throw error;
};
const apiPut = async (candidates, data, config) => {
  const urlsTried = [];
  for (const url of toUrls(candidates)) {
    try {
      urlsTried.push(url);
      const res = isAbsoluteUrl(url)
        ? await fetchJson('PUT', url, data, config)
        : await apiClient.put(url, data, config);
      if (!isAbsoluteUrl(url)) ensureJsonResponse(res);
      return res;
    } catch (e) {
      if (!shouldFallback(e)) throw e;
    }
  }
  const error = new Error(`Aucune route API valide. Testé: ${urlsTried.join(', ')}`);
  error.urlsTried = urlsTried;
  throw error;
};
const apiPatch = async (candidates, data, config) => {
  const urlsTried = [];
  for (const url of toUrls(candidates)) {
    try {
      urlsTried.push(url);
      const res = isAbsoluteUrl(url)
        ? await fetchJson('PATCH', url, data, config)
        : await apiClient.patch(url, data, config);
      if (!isAbsoluteUrl(url)) ensureJsonResponse(res);
      return res;
    } catch (e) {
      if (!shouldFallback(e)) throw e;
    }
  }
  const error = new Error(`Aucune route API valide. Testé: ${urlsTried.join(', ')}`);
  error.urlsTried = urlsTried;
  throw error;
};
const apiDelete = async (candidates, config) => {
  const urlsTried = [];
  for (const url of toUrls(candidates)) {
    try {
      urlsTried.push(url);
      const res = isAbsoluteUrl(url)
        ? await fetchJson('DELETE', url, undefined, config)
        : await apiClient.delete(url, config);
      if (!isAbsoluteUrl(url)) ensureJsonResponse(res);
      return res;
    } catch (e) {
      if (!shouldFallback(e)) throw e;
    }
  }
  const error = new Error(`Aucune route API valide. Testé: ${urlsTried.join(', ')}`);
  error.urlsTried = urlsTried;
  throw error;
};

// === COMPOSANTS GESTION ACCÈS ===
function AccessManagement() {
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState({});

  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose
  } = useDisclosure();

  const {
    isOpen: isLinkOpen,
    onOpen: onLinkOpen,
    onClose: onLinkClose
  } = useDisclosure();

  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  // Chargement des données
  useEffect(() => {
    loadUsers();
    loadMembers();
    loadStats();
  }, []);

  // Unifier sur apiClient + fallbacks
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiGet(
        buildCandidates(ENDPOINTS.siteUsers, getUsersPath(), '', getUsersOrigin())
      );
      const data = response.data;
      setUsers(Array.isArray(data) ? data : (data?.users || []));
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast({
        title: 'Erreur API',
        description: `${error.message}${error.urlsTried ? ` • Testé: ${error.urlsTried.join(', ')}` : ''}`,
        status: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await apiGet(
        buildCandidates(ENDPOINTS.members, getMembersPath(), '', getMembersOrigin()),
        { params: { status: 'ACTIVE' } }
      );
      const data = response.data;
      setMembers(Array.isArray(data) ? data : (data?.members || []));
    } catch (error) {
      console.error('Erreur chargement membres:', error);
      toast({
        title: 'Erreur API',
        description: `${error.message}${error.urlsTried ? ` • Testé: ${error.urlsTried.join(', ')}` : ''}`,
        status: 'error',
        duration: 5000
      });
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiGet(
        buildCandidates(ENDPOINTS.siteUsers, getUsersPath(), 'stats', getUsersOrigin())
      );
      setStats(response.data || {});
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      toast({
        title: 'Erreur API',
        description: `${error.message}${error.urlsTried ? ` • Testé: ${error.urlsTried.join(', ')}` : ''}`,
        status: 'error',
        duration: 5000
      });
    }
  };

  // Callback central pour recharger toute la vue après une action
  const reloadAll = () => {
    loadUsers();
    loadMembers();
    loadStats();
  };

  // Filtrage des utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    const matchesStatus = filterStatus === 'ALL' || 
      (filterStatus === 'ACTIVE' && user.isActive) ||
      (filterStatus === 'INACTIVE' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between">
        <VStack align="start" spacing={1}>
          <Heading size="md">🔐 Gestion des Accès Sites</Heading>
          <Text fontSize="sm" color="gray.600">
            Gestion des comptes d'accès aux sites interne et externe
          </Text>
        </VStack>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onCreateOpen}>
          Créer un accès
        </Button>
      </HStack>

      {/* Statistiques */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Total accès</StatLabel>
              <StatNumber color="blue.500">{stats.totalUsers || 0}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Accès actifs</StatLabel>
              <StatNumber color="green.500">{stats.activeUsers || 0}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Liés aux adhésions</StatLabel>
              <StatNumber color="purple.500">{stats.linkedUsers || 0}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Connexions 24h</StatLabel>
              <StatNumber color="orange.500">{stats.recentLogins || 0}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filtres */}
      <Card bg={cardBg}>
        <CardBody>
          <HStack spacing={4}>
            <InputGroup flex={1}>
              <InputLeftElement>
                <FiSearch />
              </InputLeftElement>
              <Input
                placeholder="Rechercher par nom, email ou identifiant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              maxW="200px"
            >
              <option value="ALL">Tous rôles</option>
              <option value="ADMIN">Administrateur</option>
              <option value="MODERATOR">Modérateur</option>
              <option value="MEMBER">Membre</option>
              <option value="GUEST">Invité</option>
            </Select>
            
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              maxW="150px"
            >
              <option value="ALL">Tous statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </Select>
            
            <Button leftIcon={<FiRefreshCw />} onClick={loadUsers} size="sm">
              Actualiser
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* Liste des utilisateurs */}
      {loading ? (
        <Center py={8}>
          <VStack spacing={4}>
            <Spinner size="lg" />
            <Text>Chargement des accès...</Text>
          </VStack>
        </Center>
      ) : (
        <Card bg={cardBg}>
          <CardBody>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Utilisateur</Th>
                  <Th>Matricule</Th>
                  <Th>Rôle</Th>
                  <Th>Accès</Th>
                  <Th>Adhésion liée</Th>
                  <Th>Statut</Th>
                  <Th>Dernière connexion</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredUsers.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEdit={() => handleEditUser(user)}
                    onToggleStatus={() => handleToggleUserStatus(user)}
                    onLink={() => handleLinkToMember(user)}
                    onViewLogs={() => handleViewUserLogs(user)}
                  />
                ))}
              </Tbody>
            </Table>
            
            {filteredUsers.length === 0 && (
              <Alert status="info" mt={4}>
                <AlertIcon />
                Aucun utilisateur trouvé avec ces critères
              </Alert>
            )}
          </CardBody>
        </Card>
      )}

      {/* Modals */}
      <CreateAccessModal
        isOpen={isCreateOpen}
        onClose={() => { onCreateClose(); setSelectedUser(null); }}
        members={members}
        user={selectedUser}
        onUserSaved={reloadAll}
      />
      
      <LinkMemberModal
        isOpen={isLinkOpen}
        onClose={onLinkClose}
        user={selectedUser}
        members={members}
        onLinked={reloadAll}
      />
    </VStack>
  );

  // Handlers
  function handleEditUser(user) {
    setSelectedUser(user);
    onCreateOpen();
  }

  async function handleToggleUserStatus(user) {
    try {
      await apiPatch(
        buildCandidates(ENDPOINTS.siteUsers, getUsersPath(), `${user.id}`, getUsersOrigin()),
        { isActive: !user.isActive }
      );
      toast({
        title: 'Succès',
        description: `Accès ${!user.isActive ? 'activé' : 'désactivé'}`,
        status: 'success',
        duration: 3000,
      });
      reloadAll();
    } catch (e) {
      console.error(e);
      toast({
        title: 'Erreur',
        description: `${e.message}${e.urlsTried ? ` • Testé: ${e.urlsTried.join(', ')}` : ''}`,
        status: 'error',
        duration: 4000,
      });
    }
  }

  function handleLinkToMember(user) {
    setSelectedUser(user);
    onLinkOpen();
  }

  function handleViewUserLogs(user) {
    toast({
      title: 'Info',
      description: `Affichage des logs pour ${user.username} à venir`,
      status: 'info',
      duration: 3000,
    });
  }
}

// Composant ligne utilisateur
function UserRow({ user, onEdit, onToggleStatus, onLink, onViewLogs }) {
  const getRoleColor = (role) => {
    const colors = {
      'ADMIN': 'red',
      'MODERATOR': 'purple',
      'MEMBER': 'blue',
      'GUEST': 'gray'
    };
    return colors[role] || 'gray';
  };

  return (
    <Tr>
      <Td>
        <VStack align="start" spacing={0}>
          <Text fontWeight="medium" fontSize="sm">
            {user.firstName} {user.lastName}
          </Text>
          <Text fontSize="xs" color="gray.500">{user.email}</Text>
        </VStack>
      </Td>
      <Td>
        <Text fontFamily="mono" fontSize="sm">{user.username}</Text>
      </Td>
      <Td>
        <Badge colorScheme={getRoleColor(user.role)} size="sm">
          {user.role}
        </Badge>
      </Td>
      <Td>
        <VStack align="start" spacing={1}>
          {user.hasInternalAccess && (
            <Badge colorScheme="blue" size="xs">Interne</Badge>
          )}
          {user.hasExternalAccess && (
            <Badge colorScheme="green" size="xs">Externe</Badge>
          )}
        </VStack>
      </Td>
      <Td>
        {user.linkedMember ? (
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" color="green.600">
              {user.linkedMember.firstName} {user.linkedMember.lastName}
            </Text>
            <Text fontSize="xs" color="gray.500">
              #{user.linkedMember.memberNumber}
            </Text>
          </VStack>
        ) : (
          <Button size="xs" variant="outline" onClick={onLink}>
            <FiLink style={{ marginRight: '4px' }} />
            Lier
          </Button>
        )}
      </Td>
      <Td>
        <Badge colorScheme={user.isActive ? 'green' : 'red'} size="sm">
          {user.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      </Td>
      <Td>
        <Text fontSize="xs">
          {user.lastLoginAt ? 
            new Date(user.lastLoginAt).toLocaleDateString('fr-FR') : 
            'Jamais'
          }
        </Text>
      </Td>
      <Td>
        <Menu>
          <MenuButton as={IconButton} icon={<FiSettings />} size="sm" variant="ghost" />
          <MenuList>
            <MenuItem icon={<FiEdit />} onClick={onEdit}>
              Modifier
            </MenuItem>
            <MenuItem icon={<FiActivity />} onClick={onViewLogs}>
              Logs de connexion
            </MenuItem>
            <MenuItem 
              icon={user.isActive ? <FiLock /> : <FiUnlock />}
              onClick={onToggleStatus}
              color={user.isActive ? 'red.500' : 'green.500'}
            >
              {user.isActive ? 'Désactiver' : 'Activer'}
            </MenuItem>
          </MenuList>
        </Menu>
      </Td>
    </Tr>
  );
}

// Modal de création/édition d'accès
function CreateAccessModal({ isOpen, onClose, members, onUserSaved, user }) {
  const isEdit = !!user;
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'MEMBER',
    hasInternalAccess: true,
    hasExternalAccess: false,
    linkedMemberId: '',
    generatePassword: true,
    customPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Prefill on edit
  useEffect(() => {
    if (isEdit) {
      setFormData({
        username: user?.username || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        role: user?.role || 'MEMBER',
        hasInternalAccess: !!user?.hasInternalAccess,
        hasExternalAccess: !!user?.hasExternalAccess,
        linkedMemberId: user?.linkedMember?.id || '',
        // en édition: ne régénère pas de mot de passe par défaut
        generatePassword: false,
        customPassword: ''
      });
    } else {
      setFormData({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        role: 'MEMBER',
        hasInternalAccess: true,
        hasExternalAccess: false,
        linkedMemberId: '',
        generatePassword: true,
        customPassword: ''
      });
    }
  }, [isEdit, user, isOpen]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Construire le payload propre
      const payload = {
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        hasInternalAccess: formData.hasInternalAccess,
        hasExternalAccess: formData.hasExternalAccess,
        linkedMemberId: formData.linkedMemberId || null
      };

      if (!isEdit) {
        // Création: gestion du mot de passe
        payload.generatePassword = !!formData.generatePassword;
        if (!formData.generatePassword && formData.customPassword) {
          payload.customPassword = formData.customPassword;
        }
        const response = await apiPost(
          buildCandidates(ENDPOINTS.siteUsers, getUsersPath(), '', getUsersOrigin()),
          payload
        );
        const data = response.data;
        toast({
          title: 'Accès créé',
          description: data?.temporaryPassword
            ? `Mot de passe temporaire: ${data.temporaryPassword}`
            : "L'utilisateur a été créé avec succès",
          status: 'success',
          duration: data?.temporaryPassword ? 10000 : 5000,
          isClosable: true
        });
      } else {
        // Edition
        if (formData.customPassword?.trim()) {
          payload.password = formData.customPassword.trim();
        }
        await apiPut(
          buildCandidates(ENDPOINTS.siteUsers, getUsersPath(), `${user.id}`, getUsersOrigin()),
          payload
        );
        toast({
          title: 'Accès mis à jour',
          description: "L'utilisateur a été mis à jour avec succès",
          status: 'success',
          duration: 3000
        });
      }

      onUserSaved?.();
      onClose();

      // Reset form après action
      setFormData({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        role: 'MEMBER',
        hasInternalAccess: true,
        hasExternalAccess: false,
        linkedMemberId: '',
        generatePassword: true,
        customPassword: ''
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erreur',
        description: `${error?.response?.data?.message || error.message}${error.urlsTried ? ` • Testé: ${error.urlsTried.join(', ')}` : ''}`,
        status: 'error',
        duration: 6000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isEdit ? '✏️ Modifier un accès aux sites' : '🔐 Créer un accès aux sites'}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <Alert status="info">
              <AlertIcon />
              <Text fontSize="sm">
                {isEdit
                  ? "Mettez à jour le profil d'accès. Le matricule est l'identifiant utilisé sur le site."
                  : "Créez un compte d'accès aux sites. Le matricule est l'identifiant utilisé sur le site."}
              </Text>
            </Alert>

            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Prénom</FormLabel>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Prénom"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Nom</FormLabel>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Nom"
                />
              </FormControl>
            </SimpleGrid>

            <FormControl isRequired>
              <FormLabel>Matricule (identifiant de connexion)</FormLabel>
              <Input
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Ex: w.belaidi"
              />
              <Text fontSize="xs" color="gray.500">
                Format recommandé: première lettre du prénom + point + nom
              </Text>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Rôle</FormLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value="MEMBER">Membre</option>
                <option value="MODERATOR">Modérateur</option>
                <option value="ADMIN">Administrateur</option>
                <option value="GUEST">Invité</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Lier à une adhésion existante (optionnel)</FormLabel>
              <Select
                value={formData.linkedMemberId}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedMemberId: e.target.value }))}
              >
                <option value="">Aucune liaison</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName} - #{member.memberNumber}
                  </option>
                ))}
              </Select>
            </FormControl>

            <Divider />

            <VStack align="start" spacing={3} w="full">
              <Text fontWeight="medium">Autorisations d'accès</Text>
              
              <HStack w="full" justify="space-between">
                <Text fontSize="sm">Accès site interne</Text>
                <Switch
                  isChecked={formData.hasInternalAccess}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasInternalAccess: e.target.checked }))}
                />
              </HStack>
              
              <HStack w="full" justify="space-between">
                <Text fontSize="sm">Accès site externe</Text>
                <Switch
                  isChecked={formData.hasExternalAccess}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasExternalAccess: e.target.checked }))}
                />
              </HStack>
            </VStack>

            {!isEdit && (
              <>
                <Divider />
                <VStack align="start" spacing={3} w="full">
                  <Text fontWeight="medium">Mot de passe</Text>
                  
                  <HStack w="full" justify="space-between">
                    <Text fontSize="sm">Générer automatiquement</Text>
                    <Switch
                      isChecked={formData.generatePassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, generatePassword: e.target.checked }))}
                    />
                  </HStack>
                  
                  {!formData.generatePassword && (
                    <FormControl>
                      <FormLabel>Mot de passe personnalisé</FormLabel>
                      <Input
                        type="password"
                        value={formData.customPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, customPassword: e.target.value }))}
                        placeholder="Minimum 6 caractères"
                      />
                    </FormControl>
                  )}
                </VStack>
              </>
            )}

            {isEdit && (
              <>
                <Divider />
                <VStack align="start" spacing={3} w="full">
                  <Text fontWeight="medium">Changer le mot de passe (optionnel)</Text>
                  <FormControl>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <Input
                      type="password"
                      value={formData.customPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, customPassword: e.target.value }))}
                      placeholder="Laissez vide pour ne pas changer"
                    />
                  </FormControl>
                </VStack>
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Annuler
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isLoading={loading}
            loadingText={isEdit ? 'Enregistrement...' : 'Création...'}
          >
            {isEdit ? 'Enregistrer' : "Créer l'accès"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Modal de liaison avec membre
function LinkMemberModal({ isOpen, onClose, user, members, onLinked }) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleLink = async () => {
    if (!selectedMemberId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un membre",
        status: "error",
        duration: 3000
      });
      return;
    }

    try {
      setLoading(true);
      await apiPost(
        buildCandidates(ENDPOINTS.siteUsers, getUsersPath(), `${user.id}/link-member`, getUsersOrigin()),
        { memberId: selectedMemberId }
      );

      toast({
        title: "Liaison créée",
        description: "L'accès a été lié à l'adhésion avec succès",
        status: "success",
        duration: 3000
      });

      onLinked?.();
      onClose();
      setSelectedMemberId('');
    } catch (error) {
      toast({
        title: "Erreur",
        description: `${error?.response?.data?.message || error.message}${error.urlsTried ? ` • Testé: ${error.urlsTried.join(', ')}` : ''}`,
        status: "error",
        duration: 6000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>🔗 Lier à une adhésion</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <Alert status="info">
              <AlertIcon />
              <Text fontSize="sm">
                Lier l'accès de <strong>{user?.firstName} {user?.lastName}</strong> à une adhésion existante.
              </Text>
            </Alert>

            <FormControl>
              <FormLabel>Sélectionner une adhésion</FormLabel>
              <Select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                placeholder="Choisir un membre..."
              >
                {members
                  .filter(member => !member.hasLinkedAccess) // Seulement les membres sans accès lié
                  .map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} - #{member.memberNumber}
                      {member.email && ` (${member.email})`}
                    </option>
                  ))
                }
              </Select>
              <Text fontSize="xs" color="gray.500" mt={2}>
                Seuls les membres sans accès déjà lié sont affichés
              </Text>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Annuler
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleLink}
            isLoading={loading}
            loadingText="Liaison..."
          >
            Lier à l'adhésion
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// === COMPOSANT PRINCIPAL ===
export default function SiteManagement() {
  const [changelogs, setChangelogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChangelog, setSelectedChangelog] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    version: '',
    date: '',
    changes: ['']
  });
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Charger les changelogs avec gestion d'erreur améliorée
  const fetchChangelogs = async () => {
    try {
      setLoading(true);
      const response = await apiGet(
        buildCandidates(ENDPOINTS.changelog, getChangelogPath(), '', getChangelogOrigin())
      );
      const data = response.data;
      if (data && Array.isArray(data)) {
        setChangelogs(data);
      } else {
        console.warn('Réponse inattendue de l\'API:', data);
        setChangelogs([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des changelogs:', error);
      setChangelogs([]);
      toast({
        title: 'Erreur',
        description: `${error.message}${error.urlsTried ? ` • Testé: ${error.urlsTried.join(', ')}` : ''}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChangelogs();
  }, []);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      title: '',
      version: '',
      date: new Date().toISOString().split('T')[0],
      changes: ['']
    });
    setSelectedChangelog(null);
  };

  // Ouvrir le modal pour créer
  const handleCreate = () => {
    resetForm();
    onOpen();
  };

  // Ouvrir le modal pour éditer avec validation
  const handleEdit = (changelog) => {
    setSelectedChangelog(changelog);
    
    // S'assurer que changes est toujours un tableau
    let changes = [''];
    if (changelog.changes) {
      if (Array.isArray(changelog.changes)) {
        changes = changelog.changes.length > 0 ? changelog.changes : [''];
      } else if (typeof changelog.changes === 'string') {
        try {
          const parsed = JSON.parse(changelog.changes);
          changes = Array.isArray(parsed) ? parsed : [''];
        } catch (e) {
          console.warn('Impossible de parser changes:', changelog.changes);
          changes = [changelog.changes];
        }
      }
    }
    
    setFormData({
      title: changelog.title || '',
      version: changelog.version || '',
      date: changelog.date ? changelog.date.split('T')[0] : new Date().toISOString().split('T')[0],
      changes
    });
    onOpen();
  };

  // Ajouter une nouvelle ligne de changement
  const addChange = () => {
    setFormData(prev => ({
      ...prev,
      changes: [...prev.changes, '']
    }));
  };

  // Supprimer une ligne de changement
  const removeChange = (index) => {
    if (formData.changes.length > 1) {
      setFormData(prev => ({
        ...prev,
        changes: prev.changes.filter((_, i) => i !== index)
      }));
    }
  };

  // Mettre à jour une ligne de changement
  const updateChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      changes: prev.changes.map((change, i) => i === index ? value : change)
    }));
  };

  // Sauvegarder le changelog
  const handleSave = async () => {
    try {
      // Validation
      if (!formData.title.trim() || !formData.version.trim()) {
        toast({
          title: 'Erreur de validation',
          description: 'Le titre et la version sont requis',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const payload = {
        ...formData,
        changes: formData.changes.filter(change => change.trim() !== '')
      };

      if (selectedChangelog) {
        // Mise à jour
        await apiPut(
          buildCandidates(ENDPOINTS.changelog, getChangelogPath(), `${selectedChangelog.id}`, getChangelogOrigin()),
          payload
        );
        toast({
          title: 'Succès',
          description: 'Changelog mis à jour avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Création
        await apiPost(
          buildCandidates(ENDPOINTS.changelog, getChangelogPath(), '', getChangelogOrigin()),
          payload
        );
        toast({
          title: 'Succès',
          description: 'Changelog créé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      fetchChangelogs();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: `${error.message}${error.urlsTried ? ` • Testé: ${error.urlsTried.join(', ')}` : ''}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce changelog ?')) {
      return;
    }

    try {
      await apiDelete(
        buildCandidates(ENDPOINTS.changelog, getChangelogPath(), `${id}`, getChangelogOrigin())
      );
      toast({
        title: 'Succès',
        description: 'Changelog supprimé avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchChangelogs();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: `${error.message}${error.urlsTried ? ` • Testé: ${error.urlsTried.join(', ')}` : ''}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Fonction pour afficher les changements de manière sécurisée
  const renderChanges = (changes) => {
    if (!changes) return null;
    
    let changesList = [];
    if (Array.isArray(changes)) {
      changesList = changes;
    } else if (typeof changes === 'string') {
      try {
        const parsed = JSON.parse(changes);
        changesList = Array.isArray(parsed) ? parsed : [changes];
      } catch {
        changesList = [changes];
      }
    }
    
    return changesList.map((change, index) => (
      <Text key={index} fontSize="sm">
        • {change}
      </Text>
    ));
  };

  if (loading) {
    return (
      <Center minH="400px">
        <VStack>
          <Spinner size="xl" color="var(--rbe-red)" />
          <Text>Chargement des changelogs...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="xl" display="flex" alignItems="center">
          <FiGlobe style={{ marginRight: '12px' }} />
          Gestion du Site Web
        </Heading>
        
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>📝 Changelog & Versions</Tab>
            <Tab>🔐 Accès aux Sites</Tab>
            <Tab>⚙️ Configuration</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Flex mb={6} align="center">
                <Heading size="lg">Gestion du Site</Heading>
                <Spacer />
                <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleCreate}>
                  Nouveau Changelog
                </Button>
              </Flex>

              <VStack spacing={4} align="stretch">
                {changelogs.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    Aucun changelog trouvé. Créez le premier !
                  </Alert>
                ) : (
                  changelogs.map((changelog) => (
                    <Card key={changelog.id}>
                      <CardHeader>
                        <Flex align="center">
                          <VStack align="start" spacing={1}>
                            <Heading size="md">{changelog.title}</Heading>
                            <HStack>
                              <Badge colorScheme="blue">v{changelog.version}</Badge>
                              <Text fontSize="sm" color="gray.600">
                                {changelog.date
                                  ? new Date(changelog.date).toLocaleDateString('fr-FR')
                                  : 'Date inconnue'}
                              </Text>
                            </HStack>
                          </VStack>
                          <Spacer />
                          <HStack>
                            <IconButton
                              icon={<FaEdit />}
                              size="sm"
                              colorScheme="blue"
                              variant="ghost"
                              onClick={() => handleEdit(changelog)}
                              aria-label="Modifier"
                            />
                            <IconButton
                              icon={<FaTrash />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleDelete(changelog.id)}
                              aria-label="Supprimer"
                            />
                          </HStack>
                        </Flex>
                      </CardHeader>
                      <CardBody pt={0}>
                        <VStack align="start" spacing={2}>
                          {renderChanges(changelog.changes)}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))
                )}
              </VStack>
            </TabPanel>

            <TabPanel>
              <AccessManagement />
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Text>Configuration générale du site (à développer)</Text>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Modal placé hors des TabPanels pour éviter les ambiguïtés JSX */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {selectedChangelog ? 'Modifier le changelog' : 'Nouveau changelog'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Titre</FormLabel>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Nouvelle version du site"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Version</FormLabel>
                  <Input
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="Ex: 2.1.0"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Changements</FormLabel>
                  <VStack spacing={2} align="stretch">
                    {formData.changes.map((change, index) => (
                      <HStack key={index}>
                        <Input
                          value={change}
                          onChange={(e) => updateChange(index, e.target.value)}
                          placeholder="Décrivez le changement..."
                        />
                        {formData.changes.length > 1 ? (
                          <IconButton
                            icon={<FaTrash />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => removeChange(index)}
                            aria-label="Supprimer"
                          />
                        ) : null}
                      </HStack>
                    ))}
                    <Button size="sm" variant="ghost" onClick={addChange}>
                      + Ajouter un changement
                    </Button>
                  </VStack>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Annuler
              </Button>
              <Button colorScheme="blue" onClick={handleSave}>
                {selectedChangelog ? 'Mettre à jour' : 'Créer'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
}