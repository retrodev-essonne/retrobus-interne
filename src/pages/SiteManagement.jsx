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
  useColorModeValue, Tooltip, Divider, Stat, StatLabel, StatNumber, Image as ChakraImage
} from '@chakra-ui/react';
import { 
  FaEdit, FaTrash, FaPlus, FaUsers, FaKey, FaEye,
  FaUserCheck, FaUserTimes, FaLink, FaUnlink, FaSearch,
  FaGlobe, FaLock, FaUnlock
} from 'react-icons/fa';
import { 
  FiEdit, FiTrash2, FiPlus, FiUsers, FiKey, FiEye, FiShield,
  FiUserCheck, FiUserX, FiLink, FiSearch, FiGlobe, FiLock,
  FiUnlock, FiRefreshCw, FiSettings, FiActivity, FiMail, FiBell,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { apiClient } from '../api/config';
import { API_BASE_URL } from '../api/config';
import { displayNameFromUser, formatMemberLabel } from '../lib/names';
import EmailTemplateManager from '../components/EmailTemplateManager';

// Garde-fou: s'assurer que la réponse est bien du JSON
const ensureJsonResponse = (response) => {
  const ct = (response?.headers?.['content-type'] || '').toLowerCase();
  if (!(ct.includes('application/json') || ct.includes('+json'))) {
    throw new Error("Le serveur a renvoyé une page HTML au lieu de JSON. Vérifiez l'URL de l'API.");
  }
};

// Petits utilitaires pour essayer plusieurs chemins candidats (ex: '/site-users' puis '/api/site-users')
const ENDPOINTS = {
  // Priorité sur /api/* puis fallback sur variantes historiques
  siteUsers: [
    'api/site-users',
    'api/users',
    'site-users',
    'users',
    // Fallback statique si aucune API n'est disponible
    'data/site-users.json'
  ],
  members: ['api/members', 'members', 'api/v1/members', 'v1/members'],
  siteUsersStats: ['api/site-users/stats', 'api/users/stats', 'site-users/stats', 'users/stats'],
  // Ajout de variantes fréquentes côté back
  changelog: [
    'api/changelog',
    'api/site/changelog',
    'api/website/changelog',
    'changelog',
    'site/changelog',
    'website/changelog',
    'api/changelogs',
    'changelogs',
    // Fallback statique servi par l'app interne (placer le fichier dans public/data/changelog.json)
    'data/changelog.json'
  ],
  retroNews: [
    'api/retro-news',
    'api/news',
    'retro-news',
    'news',
    // Fallback statique
    'data/retro-news.json'
  ],
  siteConfig: [
    'api/site-config',
    'site-config'
  ]
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
  return status === 404 || status === 405 || isHtml || err?.message?.includes('page HTML');
};

// === nouveau: résolveur de chemins basé sur .env et sur overrides runtime ===
const clean = (s) => (s || '').replace(/^\/+|\/+$/g, '');
const getApiPrefix = () => clean(localStorage.getItem('rbe_api_prefix') || import.meta.env?.VITE_API_PREFIX);
const getUsersPath = () => clean(localStorage.getItem('rbe_api_site_users_path') || import.meta.env?.VITE_API_SITE_USERS_PATH);
const getMembersPath = () => clean(localStorage.getItem('rbe_api_members_path') || import.meta.env?.VITE_API_MEMBERS_PATH);
const getChangelogPath = () => clean(localStorage.getItem('rbe_api_changelog_path') || import.meta.env?.VITE_API_CHANGELOG_PATH);
const getSiteConfigPath = () => clean(localStorage.getItem('rbe_api_site_config_path') || import.meta.env?.VITE_API_SITE_CONFIG_PATH);

// Origins (priorité: spécifique ressource > globale > même origine)
const getGlobalOrigin = () => {
  const baseEnv = (import.meta.env?.VITE_API_ORIGIN || '').trim();
  const baseFromConfig = (/^https?:\/\//i.test(API_BASE_URL || '') ? API_BASE_URL : '').trim();
  return (localStorage.getItem('rbe_api_origin') || baseEnv || baseFromConfig || '').replace(/\/+$/,'');
};
const getUsersOrigin = () =>
  (localStorage.getItem('rbe_api_site_users_origin') || import.meta.env?.VITE_API_SITE_USERS_ORIGIN || getGlobalOrigin() || '').trim();
const getMembersOrigin = () =>
  (localStorage.getItem('rbe_api_members_origin') || import.meta.env?.VITE_API_MEMBERS_ORIGIN || getGlobalOrigin() || '').trim();
const getChangelogOrigin = () =>
  (localStorage.getItem('rbe_api_changelog_origin') || import.meta.env?.VITE_API_CHANGELOG_ORIGIN || getGlobalOrigin() || '').trim();
const getSiteConfigOrigin = () =>
  (localStorage.getItem('rbe_api_site_config_origin') || import.meta.env?.VITE_API_SITE_CONFIG_ORIGIN || getGlobalOrigin() || '').trim();

const buildCandidates = (baseCandidates, overridePath, extraSuffix = '', overrideOrigin) => {
  const suffix = clean(extraSuffix);
  const API_PREFIX = getApiPrefix();
  const list = new Set();
  const isHttpOrigin = (o) => /^https?:\/\//i.test(o || '');
  const sameOrigin = (typeof window !== 'undefined' && window.location?.origin)
    ? window.location.origin.replace(/\/+$/,'')
    : '';
  // Évite d'appeler le serveur Vite (localhost:5173) qui ne sert pas l’API → 404 HTML
  const skipSameOrigin = !!sameOrigin && /localhost:5173$/i.test(sameOrigin);

  const pushEntries = (relPath) => {
    const parts = [clean(relPath)];
    if (suffix) parts.push(suffix);
    const rel = parts.filter(Boolean).join('/');
    if (!rel) return;

    // Priorité aux URLs relatives pour passer via apiClient (JWT, interceptors)
    list.add(rel);
    // Ensuite, absolue avec origin explicite (fallback)
    if (overrideOrigin && isHttpOrigin(overrideOrigin)) {
      list.add(`${overrideOrigin.replace(/\/+$/,'')}/${rel}`);
    }
    // Enfin, absolue même-origine (éviter en dev Vite)
    if (!skipSameOrigin && sameOrigin) {
      list.add(`${sameOrigin}/${rel}`);
    }
  };

  const pushPrefixedIfNeeded = (p) => {
    if (!API_PREFIX) return;
    const cleaned = clean(p);
    // Évite double préfixe (/api/api/..., /v1/v1/..., /api/v1/ déjà fournis)
    if (cleaned.startsWith(`${API_PREFIX}/`)) return;
    pushEntries(`${API_PREFIX}/${cleaned}`);
  };

  if (overridePath) pushEntries(overridePath);
  // Priorité: variantes préfixées d'abord, puis chemins bruts
  baseCandidates.forEach((p) => pushPrefixedIfNeeded(p));
  baseCandidates.forEach((p) => pushEntries(p));

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
  const [retroNews, setRetroNews] = useState([]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

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
    loadRetroNews();
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
      // Fallback: calculer des stats locales à partir de la liste d'utilisateurs si dispo
      if (Array.isArray(users) && users.length > 0) {
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.isActive).length;
        const linkedUsers = users.filter(u => !!u.linkedMember).length;
        const since = Date.now() - 24 * 60 * 60 * 1000;
        const recentLogins = users.filter(u => u.lastLoginAt && new Date(u.lastLoginAt).getTime() >= since).length;
        setStats({ totalUsers, activeUsers, linkedUsers, recentLogins });
        // Optionnel: information non bloquante au lieu d'une erreur
        toast({
          title: 'Stats calculées localement',
          description: 'Endpoint /site-users/stats indisponible, valeurs estimées à partir des utilisateurs chargés.',
          status: 'info',
          duration: 4000
        });
      } else {
        toast({
          title: 'Erreur API',
          description: `${error.message}${error.urlsTried ? ` • Testé: ${error.urlsTried.join(', ')}` : ''}`,
          status: 'error',
          duration: 5000
        });
      }
    }
  };

  const loadRetroNews = async () => {
    try {
      const response = await apiGet(
        buildCandidates(ENDPOINTS.retroNews, '', '', getGlobalOrigin())
      );
      const newsData = response.data || [];
      setRetroNews(Array.isArray(newsData) ? newsData : []);
    } catch (error) {
      console.error('Erreur chargement RétroNews:', error);
      // En cas d'erreur, on laisse le tableau vide (pas de toast pour ne pas polluer)
      setRetroNews([]);
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
      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
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

      {/* Carrousel RétroNews */}
      {retroNews.length > 0 && (
        <Card bg={cardBg}>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="sm">📰 RétroNews</Heading>
              <HStack spacing={2}>
                <IconButton
                  icon={<FiChevronLeft />}
                  size="sm"
                  onClick={() => setCurrentNewsIndex((prev) => 
                    prev === 0 ? retroNews.length - 1 : prev - 1
                  )}
                  aria-label="News précédente"
                  isDisabled={retroNews.length <= 1}
                />
                <Text fontSize="xs" color="gray.500">
                  {currentNewsIndex + 1} / {retroNews.length}
                </Text>
                <IconButton
                  icon={<FiChevronRight />}
                  size="sm"
                  onClick={() => setCurrentNewsIndex((prev) => 
                    (prev + 1) % retroNews.length
                  )}
                  aria-label="News suivante"
                  isDisabled={retroNews.length <= 1}
                />
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack align="start" spacing={2}>
              <Heading size="md">{retroNews[currentNewsIndex]?.title || 'Sans titre'}</Heading>
              {retroNews[currentNewsIndex]?.date && (
                <Text fontSize="sm" color="gray.500">
                  {new Date(retroNews[currentNewsIndex].date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              )}
              <Text>{retroNews[currentNewsIndex]?.content || ''}</Text>
              {retroNews[currentNewsIndex]?.imageUrl && (
                <ChakraImage
                  src={retroNews[currentNewsIndex].imageUrl}
                  alt={retroNews[currentNewsIndex]?.title}
                  maxH="200px"
                  objectFit="cover"
                  borderRadius="md"
                />
              )}
            </VStack>
          </CardBody>
        </Card>
      )}

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
              maxW="220px"
            >
              <option value="ALL">Tous rôles</option>
              <option value="PRESIDENT">Président</option>
              <option value="VICE_PRESIDENT">Vice-Président</option>
              <option value="TRESORIER">Trésorier</option>
              <option value="SECRETAIRE_GENERAL">Secrétaire Général</option>
              <option value="MEMBER">Membre</option>
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
                    onDelete={() => handleDeleteUser(user)}
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

  async function handleDeleteUser(user) {
    if (!window.confirm(`Supprimer définitivement l'accès de ${displayNameFromUser(user)} (${user.username}) ?`)) {
      return;
    }
    try {
      await apiDelete(
        buildCandidates(ENDPOINTS.siteUsers, getUsersPath(), `${user.id}`, getUsersOrigin())
      );
      toast({
        title: 'Accès supprimé',
        description: `L\'utilisateur ${user.username} a été supprimé`,
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
}

// Composant ligne utilisateur
function UserRow({ user, onEdit, onToggleStatus, onLink, onViewLogs, onDelete }) {
  const ROLE_LABELS = {
    PRESIDENT: 'Président',
    VICE_PRESIDENT: 'Vice-Président',
    TRESORIER: 'Trésorier',
    SECRETAIRE_GENERAL: 'Secrétaire Général',
    MEMBER: 'Membre'
  };

  const getRoleColor = (role) => {
    const colors = {
      PRESIDENT: 'red',
      VICE_PRESIDENT: 'pink',
      TRESORIER: 'green',
      SECRETAIRE_GENERAL: 'purple',
      MEMBER: 'blue'
    };
    return colors[role] || 'gray';
  };

  return (
    <Tr>
      <Td>
        <VStack align="start" spacing={0}>
          <Text fontWeight="medium" fontSize="sm">
            {displayNameFromUser(user)}
          </Text>
          <Text fontSize="xs" color="gray.500">{user.email}</Text>
        </VStack>
      </Td>
      <Td>
        <Text fontFamily="mono" fontSize="sm">{user.username}</Text>
      </Td>
      <Td>
        <Badge colorScheme={getRoleColor(user.role)} size="sm">
          {ROLE_LABELS[user.role] || user.role}
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
              {formatMemberLabel(user.linkedMember)}
            </Text>
            {user.linkedMember.memberNumber && (
              <Text fontSize="xs" color="gray.500">
                #{user.linkedMember.memberNumber}
              </Text>
            )}
          </VStack>
        ) : (
          <Button size="xs" variant="outline" onClick={onLink}>
            <FiLink style={{ marginRight: '4px' }} />
            Fusionner
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
            <MenuItem icon={<FiTrash2 />} onClick={onDelete} color="red.600">
              Supprimer
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
                <option value="PRESIDENT">Président</option>
                <option value="VICE_PRESIDENT">Vice-Président</option>
                <option value="TRESORIER">Trésorier</option>
                <option value="SECRETAIRE_GENERAL">Secrétaire Général</option>
                <option value="MEMBER">Membre</option>
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
                    {formatMemberLabel(member)}
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
  const [availableMembers, setAvailableMembers] = useState(members || []);
  const toast = useToast();

  useEffect(() => {
    // Charge/rafraîchit la liste des adhérents à l'ouverture pour éviter un jeu de données obsolète
    const fetchMembers = async () => {
      try {
        const response = await apiGet(
          buildCandidates(ENDPOINTS.members, getMembersPath(), '', getMembersOrigin())
        );
        const data = response.data;
        const list = Array.isArray(data) ? data : (data?.members || []);
        setAvailableMembers(list);
      } catch (e) {
        console.warn('Chargement membres (fusion) échoué, utilisation des props existantes');
        setAvailableMembers(members || []);
      }
    };
    if (isOpen) fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
        description: "Accès lié à l'adhésion. L'utilisateur verra la page Mon Adhésion après actualisation ou reconnexion.",
        status: "success",
        duration: 5000
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
        <ModalHeader>🔗 Fusionner avec une adhésion</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <Alert status="info">
              <AlertIcon />
              <Text fontSize="sm">
                Fusionner l'accès de <strong>{displayNameFromUser(user)}</strong> avec une adhésion existante.
              </Text>
            </Alert>

            <FormControl>
              <FormLabel>Sélectionner une adhésion</FormLabel>
              <Select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                placeholder="Choisir un membre..."
              >
                {(availableMembers || [])
                  .filter(member => !member.hasLinkedAccess) // Seulement les membres sans accès lié
                  .map(member => (
                    <option key={member.id} value={member.id}>
                      {formatMemberLabel(member)}{member.email ? ` (${member.email})` : ''}
                    </option>
                  ))
                }
              </Select>
              <Text fontSize="xs" color="gray.500" mt={2}>
                Seuls les membres sans accès déjà lié sont affichés
              </Text>
            </FormControl>
            <HStack w="full" justify="flex-end">
              <Button size="sm" variant="outline" onClick={async ()=>{
                try {
                  const response = await apiGet(
                    buildCandidates(ENDPOINTS.members, getMembersPath(), '', getMembersOrigin())
                  );
                  const data = response.data;
                  setAvailableMembers(Array.isArray(data) ? data : (data?.members || []));
                  toast({ title:'Liste mise à jour', status:'success', duration:2000 });
                } catch (e) {
                  toast({ title:'Erreur rafraîchissement', description:e.message, status:'error', duration:3000 });
                }
              }}>Actualiser</Button>
            </HStack>
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
            loadingText="Fusion..."
          >
            Fusionner
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Petit panneau de configuration pour régler origin/prefix/paths & tester les endpoints
function ApiConfigPanel({ onChanged }) {
  const [origin, setOrigin] = useState(localStorage.getItem('rbe_api_origin') || '');
  const [prefix, setPrefix] = useState(localStorage.getItem('rbe_api_prefix') || (import.meta.env?.VITE_API_PREFIX || ''));
  const [usersPath, setUsersPath] = useState(localStorage.getItem('rbe_api_site_users_path') || (import.meta.env?.VITE_API_SITE_USERS_PATH || ''));
  const [membersPath, setMembersPath] = useState(localStorage.getItem('rbe_api_members_path') || (import.meta.env?.VITE_API_MEMBERS_PATH || ''));
  const [changelogPath, setChangelogPath] = useState(localStorage.getItem('rbe_api_changelog_path') || (import.meta.env?.VITE_API_CHANGELOG_PATH || ''));
  const [siteConfigPath, setSiteConfigPath] = useState(localStorage.getItem('rbe_api_site_config_path') || (import.meta.env?.VITE_API_SITE_CONFIG_PATH || ''));
  const [vehiclesPath, setVehiclesPath] = useState(localStorage.getItem('rbe_api_vehicles_path') || (import.meta.env?.VITE_API_VEHICLES_PATH || ''));
  const toast = useToast();

  const save = () => {
    const setOrRemove = (k, v) => (v && v.trim()) ? localStorage.setItem(k, v.trim()) : localStorage.removeItem(k);
    setOrRemove('rbe_api_origin', origin);
    setOrRemove('rbe_api_prefix', prefix);
    setOrRemove('rbe_api_site_users_path', usersPath);
    setOrRemove('rbe_api_members_path', membersPath);
    setOrRemove('rbe_api_changelog_path', changelogPath);
    setOrRemove('rbe_api_site_config_path', siteConfigPath);
    setOrRemove('rbe_api_vehicles_path', vehiclesPath);
    toast({ title: 'Configuration enregistrée', status: 'success', duration: 2000 });
    onChanged?.();
  };

  const resetAll = () => {
    ['rbe_api_origin','rbe_api_prefix','rbe_api_site_users_path','rbe_api_members_path','rbe_api_changelog_path','rbe_api_site_config_path','rbe_api_vehicles_path'].forEach(k => localStorage.removeItem(k));
    setOrigin(''); setPrefix(''); setUsersPath(''); setMembersPath(''); setChangelogPath(''); setSiteConfigPath(''); setVehiclesPath('');
    toast({ title: 'Configuration réinitialisée', status: 'info', duration: 2000 });
    onChanged?.();
  };

  const applyRecommended = () => {
    const recommendedOrigin = (import.meta.env?.VITE_API_ORIGIN || 'https://attractive-kindness-rbe-serveurs.up.railway.app').replace(/\/+$/,'');
    setOrigin(recommendedOrigin);
    setPrefix('api');
    setUsersPath('api/site-users');
    setMembersPath('api/members');
    setChangelogPath('api/changelog');
    setSiteConfigPath('api/site-config');
    setVehiclesPath('api/vehicles');
    toast({ title: 'Recommandé appliqué', description: 'Origine Railway + préfixe /api et chemins configurés.', status: 'success', duration: 2500 });
  };

  const runTest = async (label, candidates) => {
    try {
      const res = await apiGet(candidates);
      toast({
        title: `${label}: OK`,
        description: `Type: ${res.headers?.['content-type'] || 'inconnu'}`,
        status: 'success',
        duration: 3000
      });
    } catch (e) {
      toast({
        title: `${label}: KO`,
        description: `${e.message}${e.urlsTried ? ` • Testé: ${e.urlsTried.join(', ')}` : ''}`,
        status: 'error',
        duration: 6000
      });
    }
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Alert status="info">
        <AlertIcon />
        Ajustez l’origin/prefix/paths pour pointer vers vos routes réelles (Railway, prod, etc.). Utilisez “Tester” pour valider.
      </Alert>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl>
          <FormLabel>API Origin (global)</FormLabel>
          <Input placeholder="https://votre-api.exemple.com" value={origin} onChange={(e) => setOrigin(e.target.value)} />
          <Text fontSize="xs" color="gray.500">Ex: https://attractive-kindness-rbe-serveurs.up.railway.app</Text>
        </FormControl>
        <FormControl>
          <FormLabel>API Prefix</FormLabel>
          <Input placeholder="ex: api" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
          <Text fontSize="xs" color="gray.500">Laissez vide si vos routes ne sont pas sous /api</Text>
        </FormControl>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <FormControl>
          <FormLabel>Chemin Site Users</FormLabel>
          <Input placeholder="ex: api/site-users" value={usersPath} onChange={(e) => setUsersPath(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Chemin Members</FormLabel>
          <Input placeholder="ex: api/members" value={membersPath} onChange={(e) => setMembersPath(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Chemin Changelog</FormLabel>
          <Input placeholder="ex: api/changelog" value={changelogPath} onChange={(e) => setChangelogPath(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Chemin Site Config</FormLabel>
          <Input placeholder="ex: api/site-config" value={siteConfigPath} onChange={(e) => setSiteConfigPath(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Chemin Vehicles</FormLabel>
          <Input placeholder="ex: api/vehicles" value={vehiclesPath} onChange={(e) => setVehiclesPath(e.target.value)} />
        </FormControl>
      </SimpleGrid>

      <HStack>
        <Button colorScheme="blue" onClick={save}>Enregistrer</Button>
        <Button variant="outline" onClick={resetAll}>Réinitialiser</Button>
        <Button variant="ghost" onClick={applyRecommended}>Utiliser config recommandée</Button>
      </HStack>

      <Divider />

      <VStack align="stretch" spacing={3}>
        <Text fontWeight="medium">Tests rapides</Text>
        <HStack wrap="wrap" spacing={2}>
          <Button size="sm" onClick={() => runTest('Changelog', buildCandidates(ENDPOINTS.changelog, getChangelogPath(), '', getChangelogOrigin()))}>
            Tester Changelog
          </Button>
          <Button size="sm" onClick={() => runTest('Site Users', buildCandidates(ENDPOINTS.siteUsers, getUsersPath(), '', getUsersOrigin()))}>
            Tester Site Users
          </Button>
          <Button size="sm" onClick={() => runTest('Site Users Stats', buildCandidates(ENDPOINTS.siteUsers, getUsersPath(), 'stats', getUsersOrigin()))}>
            Tester Stats
          </Button>
          <Button size="sm" onClick={() => runTest('Members', buildCandidates(ENDPOINTS.members, getMembersPath(), '', getMembersOrigin()))}>
            Tester Members
          </Button>
          <Button size="sm" onClick={() => runTest('Site Config', buildCandidates(ENDPOINTS.siteConfig, getSiteConfigPath(), '', getSiteConfigOrigin()))}>
            Tester Site Config
          </Button>
          <Button size="sm" onClick={() => runTest('Vehicles', buildCandidates(['api/vehicles','vehicles','api/v1/vehicles','v1/vehicles','vehicules'], (localStorage.getItem('rbe_api_vehicles_path')||'api/vehicles'), '', getGlobalOrigin()))}>
            Tester Vehicles
          </Button>
        </HStack>
        <Text fontSize="xs" color="gray.500">
          Astuce: si votre back expose /flashes/all, il est probable que vos autres routes soient sous /api/... également.
        </Text>
      </VStack>
    </VStack>
  );
}

// === COMPOSANT PRINCIPAL ===
export default function SiteManagement() {
  const cardBg = useColorModeValue('white', 'gray.800');
  const [changelogs, setChangelogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChangelog, setSelectedChangelog] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    version: '',
    date: '',
    entryType: 'update',
    changes: [{ tag: 'update', text: '' }]
  });
  // Nouveau: configuration HelloAsso (navbar externe)
  const [helloAssoLink, setHelloAssoLink] = useState(
    localStorage.getItem('rbe_site_helloasso_url') || 'https://www.helloasso.com/associations/retrobus-essonne'
  );
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isHeaderOpen,
    onOpen: onOpenHeaderConfig,
    onClose: onCloseHeaderConfig
  } = useDisclosure();
  const {
    isOpen: isTemplatesOpen,
    onOpen: onOpenTemplates,
    onClose: onCloseTemplates
  } = useDisclosure();
  const toast = useToast();

  // Charger les changelogs avec gestion d'erreur améliorée
  const fetchChangelogs = async () => {
    try {
      setLoading(true);
      const response = await apiGet(
        buildCandidates(ENDPOINTS.changelog, getChangelogPath(), '', getChangelogOrigin())
      );
      const data = response.data;
      if (Array.isArray(data)) {
        setChangelogs(data);
      } else if (data && Array.isArray(data.entries)) {
        setChangelogs(data.entries);
      } else if (data && Array.isArray(data.items)) {
        setChangelogs(data.items);
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

  // --- Header config state & lifecycle ---
  const [headerConfig, setHeaderConfig] = useState({
    headerBgFocalX: 50,
    headerBgFocalY: 50,
    headerBgSize: 'cover',
    logoWidth: 44
  });

  const loadSiteConfig = async () => {
    try {
      const res = await apiGet(
        buildCandidates(ENDPOINTS.siteConfig, getSiteConfigPath(), '', getSiteConfigOrigin())
      );
      const data = res?.data || {};
      setHeaderConfig(prev => ({
        ...prev,
        headerBgFocalX: Number.isFinite(data.headerBgFocalX) ? data.headerBgFocalX : prev.headerBgFocalX,
        headerBgFocalY: Number.isFinite(data.headerBgFocalY) ? data.headerBgFocalY : prev.headerBgFocalY,
        headerBgSize: data.headerBgSize || prev.headerBgSize,
        logoWidth: Number.isFinite(data.logoWidth) ? data.logoWidth : prev.logoWidth
      }));
    } catch (e) {
      console.warn('Chargement site-config (header) échoué:', e?.message || e);
    }
  };

  useEffect(() => {
    if (isHeaderOpen) loadSiteConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHeaderOpen]);

  const saveHeaderConfig = async () => {
    try {
      // Sauvegarder uniquement la config (focal, size, logo width)
      const payload = {
        headerBgFocalX: headerConfig.headerBgFocalX,
        headerBgFocalY: headerConfig.headerBgFocalY,
        headerBgSize: headerConfig.headerBgSize,
        logoWidth: headerConfig.logoWidth
      };
      await apiPut(
        buildCandidates(ENDPOINTS.siteConfig, getSiteConfigPath(), '', getSiteConfigOrigin()),
        payload
      );
      toast({ title: 'Configuration du header mise à jour', status: 'success', duration: 2500 });
      onCloseHeaderConfig();
    } catch (e) {
      toast({ title: 'Erreur sauvegarde Header', description: `${e.message}${e.urlsTried ? ` • Testé: ${e.urlsTried.join(', ')}` : ''}`, status: 'error', duration: 6000 });
    }
  };

  // --- Gestion sauvegarde HelloAsso ---
  const saveHelloAsso = async () => {
    try {
      if (!helloAssoLink || !/^https?:\/\//i.test(helloAssoLink)) {
        toast({ title: 'Lien invalide', description: 'Fournissez une URL complète commençant par http(s)://', status: 'error', duration: 3000 });
        return;
      }
      // Mémoriser en local également
      localStorage.setItem('rbe_site_helloasso_url', helloAssoLink);

      // Publier vers l'API publique (Railway) si disponible
      const candidates = buildCandidates(ENDPOINTS.siteConfig, getSiteConfigPath(), '', getSiteConfigOrigin());
      const res = await apiPut(candidates, { helloAssoUrl: helloAssoLink });
      toast({ title: 'Lien mis à jour', description: 'Le bouton "Soutenir" utilisera le nouveau lien.', status: 'success', duration: 3000 });
      return res;
    } catch (e) {
      console.error('Erreur sauvegarde HelloAsso:', e);
      toast({ title: 'Erreur', description: `${e.message}${e.urlsTried ? ` • Testé: ${e.urlsTried.join(', ')}` : ''}`, status: 'error', duration: 6000 });
    }
  };

  const testHelloAsso = async () => {
    try {
      const candidates = buildCandidates(ENDPOINTS.siteConfig, getSiteConfigPath(), '', getSiteConfigOrigin());
      const res = await apiGet(candidates);
      const data = res?.data || {};
      toast({ title: 'Config détectée', description: `helloAssoUrl=${data.helloAssoUrl || 'non défini'}`, status: 'success', duration: 3000 });
    } catch (e) {
      toast({ title: 'Config indisponible', description: `${e.message}${e.urlsTried ? ` • Testé: ${e.urlsTried.join(', ')}` : ''}`, status: 'warning', duration: 5000 });
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      title: '',
      version: '',
      date: new Date().toISOString().split('T')[0],
      entryType: 'update',
      changes: [{ tag: 'update', text: '' }]
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
    let changes = [{ tag: 'update', text: '' }];
    if (changelog.changes) {
      if (Array.isArray(changelog.changes)) {
        if (changelog.changes.length > 0) {
          // Supporte soit tableau d'objets, soit tableau de chaînes
          changes = changelog.changes.map((c) => (
            typeof c === 'string'
              ? { tag: 'update', text: c.replace(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*)/u, '').trim() }
              : { tag: c.tag || 'update', text: c.text || '' }
          ));
        }
      } else if (typeof changelog.changes === 'string') {
        try {
          const parsed = JSON.parse(changelog.changes);
          changes = Array.isArray(parsed)
            ? parsed.map((c) => (typeof c === 'string' ? { tag: 'update', text: c } : c))
            : [{ tag: 'update', text: String(changelog.changes) }];
        } catch (e) {
          console.warn('Impossible de parser changes:', changelog.changes);
          changes = [{ tag: 'update', text: changelog.changes }];
        }
      }
    } else if (changelog.description && typeof changelog.description === 'string') {
      // Découper la description multi-lignes en items
      changes = changelog.description.split(/\n|\r\n/).map(line => ({ tag: 'update', text: line.replace(/^•\s*/, '') }));
    }
    
    setFormData({
      title: changelog.title || '',
      version: changelog.version || '',
      date: changelog.date ? changelog.date.split('T')[0] : new Date().toISOString().split('T')[0],
      entryType: changelog.type || 'update',
      changes
    });
    onOpen();
  };

  // Ajouter une nouvelle ligne de changement
  const addChange = () => {
    setFormData(prev => ({
      ...prev,
      changes: [...prev.changes, { tag: 'update', text: '' }]
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
      changes: prev.changes.map((change, i) => i === index ? { ...change, text: value } : change)
    }));
  };

  const updateChangeTag = (index, tag) => {
    setFormData(prev => ({
      ...prev,
      changes: prev.changes.map((change, i) => i === index ? { ...change, tag } : change)
    }));
  };

  const TAGS = [
    { key: 'feature', label: 'Fonctionnalité', emoji: '✨' },
    { key: 'fix', label: 'Correction', emoji: '🐛' },
    { key: 'update', label: 'Mise à jour', emoji: '🔄' },
    { key: 'security', label: 'Sécurité', emoji: '🔒' },
    { key: 'perf', label: 'Performance', emoji: '🚀' },
    { key: 'ui', label: 'Interface', emoji: '🎨' },
    { key: 'content', label: 'Contenu', emoji: '📝' },
    { key: 'deps', label: 'Dépendances', emoji: '📦' },
    { key: 'docs', label: 'Documentation', emoji: '📚' }
  ];
  const getEmojiForTag = (tag) => (TAGS.find(t => t.key === tag)?.emoji || '•');

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

      // Préparer la description et la compatibilité
      const normalizedChanges = (formData.changes || []).filter(c => c && String(c.text || '').trim() !== '');
      const changesText = normalizedChanges.map(c => `${getEmojiForTag(c.tag)} ${c.text.trim()}`);
      const description = changesText.join('\n');

      const payload = {
        title: formData.title.trim(),
        version: formData.version.trim(),
        date: formData.date,
        type: formData.entryType || 'update',
        // champs riches
        changes: normalizedChanges,
        // compatibilité externe
        changesText,
        description
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

      // Synchroniser la version du site dans la configuration publique
      try {
        if (formData.version?.trim()) {
          await apiPut(
            buildCandidates(ENDPOINTS.siteConfig, getSiteConfigPath(), '', getSiteConfigOrigin()),
            { siteVersion: formData.version.trim() }
          );
          toast({ title: 'Version du site mise à jour', description: `v${formData.version.trim()}`, status: 'success', duration: 2500 });
        }
      } catch (e) {
        console.warn('MàJ siteVersion échouée:', e);
        toast({ title: 'Version non synchronisée', description: 'Impossible de mettre à jour la version du site.', status: 'warning', duration: 3500 });
      }
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
                          {Array.isArray(changelog.changes) && changelog.changes.length > 0 ? (
                            changelog.changes.map((c, i) => (
                              <Text key={i} fontSize="sm">
                                {typeof c === 'string' ? c : `${getEmojiForTag(c.tag)} ${c.text}`}
                              </Text>
                            ))
                          ) : (
                            renderChanges(changelog.changesText || changelog.description || [])
                          )}
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
              {/* Outils de gestion du site web (déplacés depuis Gestion Administrative) */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="sm">📄 Pages et contenu</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Button leftIcon={<FiEdit />} size="sm" variant="outline" onClick={onOpenHeaderConfig}>
                        Modifier le Header
                      </Button>
                      <Button leftIcon={<FiEdit />} size="sm" variant="outline">
                        Gérer les événements
                      </Button>
                      <Button leftIcon={<FiEdit />} size="sm" variant="outline">
                        Mettre à jour "À propos"
                      </Button>

                      <Divider my={2} />
                      <Heading size="xs">Bouton "Soutenir l'association" (Navbar externe)</Heading>
                      <Text fontSize="xs" color="gray.600">
                        Configure le lien HelloAsso utilisé sur la navbar du site public.
                      </Text>
                      <HStack>
                        <Input
                          value={helloAssoLink}
                          onChange={(e) => setHelloAssoLink(e.target.value)}
                          placeholder="https://www.helloasso.com/associations/retrobus-essonne"
                        />
                        <Button size="sm" colorScheme="blue" onClick={saveHelloAsso}>Enregistrer</Button>
                        <Button size="sm" variant="outline" onClick={testHelloAsso}>Tester</Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="sm">⚙️ Configuration</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Button leftIcon={<FiBell />} size="sm" variant="outline">
                        Notifications Flash
                      </Button>
                      <Button leftIcon={<FiMail />} size="sm" variant="outline">
                        Configuration Newsletter
                      </Button>
                      <Button leftIcon={<FiSettings />} size="sm" variant="outline">
                        Paramètres généraux
                      </Button>
                      <Divider my={2} />
                      <Button 
                        leftIcon={<FiMail />} 
                        size="sm" 
                        variant="outline"
                        colorScheme="purple"
                        onClick={onOpenTemplates}
                      >
                        📧 Gérer les templates d'email
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Modal Templates d'Email */}
        <Modal isOpen={isTemplatesOpen} onClose={onCloseTemplates} size="4xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>📧 Gestion des Templates d'Email</ModalHeader>
            <ModalCloseButton />
            <ModalBody maxH="80vh" overflowY="auto">
              <EmailTemplateManager token={localStorage.getItem('token')} />
            </ModalBody>
          </ModalContent>
        </Modal>
        <Modal isOpen={isHeaderOpen} onClose={onCloseHeaderConfig} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>🎛️ Modifier le Header</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6} align="stretch">
                <Card>
                  <CardHeader>
                    <Heading size="sm">Image de fond</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack align="stretch" spacing={3}>
                      <Alert status="info" fontSize="sm">
                        <AlertIcon />
                        Pour modifier l'image : éditez manuellement <strong>externe/public/assets/header.jpg</strong>
                      </Alert>
                      <HStack>
                        <FormControl maxW="220px">
                          <FormLabel>Taille d'affichage</FormLabel>
                          <Select
                            value={headerConfig.headerBgSize}
                            onChange={(e) => setHeaderConfig(prev => ({ ...prev, headerBgSize: e.target.value }))}
                          >
                            <option value="cover">Cover (remplit tout)</option>
                            <option value="contain">Contain (contient tout)</option>
                          </Select>
                        </FormControl>
                      </HStack>

                      <Box>
                        <Text fontSize="sm" color="gray.600" mb={2}>Point focal (cliquez/glissez pour ajuster)</Text>
                        <Box
                          position="relative"
                          borderRadius="md"
                          overflow="hidden"
                          border="1px solid"
                          borderColor="gray.200"
                          w="100%"
                          h="180px"
                          style={{
                            backgroundImage: `url(/assets/header.jpg?t=${Date.now()})`,
                            backgroundSize: headerConfig.headerBgSize || 'cover',
                            backgroundPosition: `${headerConfig.headerBgFocalX}% ${headerConfig.headerBgFocalY}%`
                          }}
                          onMouseDown={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                            setHeaderConfig(prev => ({ ...prev, headerBgFocalX: Math.round(x), headerBgFocalY: Math.round(y) }));
                          }}
                          onMouseMove={(e) => {
                            if (e.buttons !== 1) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                            setHeaderConfig(prev => ({ ...prev, headerBgFocalX: Math.round(Math.max(0, Math.min(100, x))), headerBgFocalY: Math.round(Math.max(0, Math.min(100, y))) }));
                          }}
                        >
                          <Box
                            position="absolute"
                            left={`calc(${headerConfig.headerBgFocalX}% - 6px)`}
                            top={`calc(${headerConfig.headerBgFocalY}% - 6px)`}
                            w="12px"
                            h="12px"
                            borderRadius="full"
                            bg="var(--rbe-red)"
                            border="2px solid white"
                            boxShadow="sm"
                            pointerEvents="none"
                          />
                        </Box>
                        <HStack mt={2} fontSize="xs" color="gray.500">
                          <Text>Position: {headerConfig.headerBgFocalX}% , {headerConfig.headerBgFocalY}%</Text>
                        </HStack>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Heading size="sm">Logo</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack align="stretch" spacing={3}>
                      <Alert status="info" fontSize="sm">
                        <AlertIcon />
                        Pour modifier le logo : éditez manuellement les fichiers dans <strong>externe/src/assets/</strong>
                      </Alert>
                      <HStack>
                        <FormControl maxW="240px">
                          <FormLabel>Hauteur du logo (px)</FormLabel>
                          <Input
                            type="number"
                            min={24}
                            max={240}
                            value={headerConfig.logoWidth}
                            onChange={(e) => setHeaderConfig(prev => ({ ...prev, logoWidth: parseInt(e.target.value || '44', 10) }))}
                          />
                        </FormControl>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCloseHeaderConfig}>Annuler</Button>
              <Button colorScheme="blue" onClick={saveHeaderConfig}>Enregistrer</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal de création/édition de Changelog */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{selectedChangelog ? '✏️ Modifier un changelog' : '🆕 Nouveau changelog'}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Titre</FormLabel>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Améliorations sur la page d'accueil"
                  />
                </FormControl>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Version</FormLabel>
                    <Input
                      value={formData.version}
                      onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="Ex: 1.3.0"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Type de publication</FormLabel>
                  <Select
                    value={formData.entryType}
                    onChange={(e) => setFormData(prev => ({ ...prev, entryType: e.target.value }))}
                  >
                    <option value="feature">Fonctionnalité ✨</option>
                    <option value="fix">Correction 🐛</option>
                    <option value="update">Mise à jour 🔄</option>
                    <option value="security">Sécurité 🔒</option>
                  </Select>
                </FormControl>

                <VStack align="stretch" spacing={2}>
                  <FormLabel>Changements</FormLabel>
                  {formData.changes.map((change, idx) => (
                    <HStack key={idx} align="start">
                      <Select
                        maxW="180px"
                        value={change.tag}
                        onChange={(e) => updateChangeTag(idx, e.target.value)}
                      >
                        {TAGS.map(t => (
                          <option key={t.key} value={t.key}>{t.emoji} {t.label}</option>
                        ))}
                      </Select>
                      <Input
                        value={change.text}
                        onChange={(e) => updateChange(idx, e.target.value)}
                        placeholder={`• Entrée ${idx + 1}`}
                      />
                      <IconButton
                        aria-label="Supprimer"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => removeChange(idx)}
                      />
                    </HStack>
                  ))}
                  <Button leftIcon={<FiPlus />} onClick={addChange} size="sm" alignSelf="flex-start">
                    Ajouter une ligne
                  </Button>
                </VStack>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>Annuler</Button>
              <Button colorScheme="blue" onClick={handleSave}>
                {selectedChangelog ? 'Enregistrer' : 'Créer'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
}