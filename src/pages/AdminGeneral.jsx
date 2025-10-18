import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardBody, CardHeader, Heading, Text, Button,
  Input, Select, VStack, HStack, Badge, useToast, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  useDisclosure, FormControl, FormLabel, Textarea, Flex,
  Icon, SimpleGrid, Alert, AlertIcon, Container, Stat, StatLabel, StatNumber, StatHelpText,
  IconButton, Menu, MenuButton, MenuList, MenuItem, MenuDivider, useColorModeValue, Spinner,
  Divider, Tabs, TabList, TabPanels, Tab, TabPanel, Avatar, Tag, TagLabel
} from '@chakra-ui/react';
import {
  FiUsers, FiCalendar, FiFileText, FiSettings, FiDownload,
  FiEdit3, FiTrash2, FiMoreHorizontal, FiCheck, FiX, FiRefreshCw,
  FiMessageSquare, FiFlag, FiPlus, FiBell, FiMail, FiGlobe, FiSend, FiActivity
} from 'react-icons/fi';
import { useUser } from '../context/UserContext';

// ---------- AdminStats (memoized) ----------
const AdminStats = React.memo(function AdminStats({ data, loading }) {
  const cardBg = useColorModeValue('white', 'gray.800');

  if (loading) {
    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel color="gray.600">Chargement...</StatLabel>
                <StatNumber>
                  <Spinner size="sm" />
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
      <Card bg={cardBg}>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Membres actifs</StatLabel>
            <StatNumber color="blue.500">
              <HStack>
                <Icon as={FiUsers} />
                <Text>{data?.activeMembers ?? 0}</Text>
              </HStack>
            </StatNumber>
            <StatHelpText>Sur {data?.totalMembers ?? 0} inscrits</StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card bg={cardBg}>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Événements planifiés</StatLabel>
            <StatNumber color="green.500">
              <HStack>
                <Icon as={FiCalendar} />
                <Text>{data?.upcomingEvents ?? 0}</Text>
              </HStack>
            </StatNumber>
            <StatHelpText>Ce mois-ci</StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card bg={cardBg}>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Documents en attente</StatLabel>
            <StatNumber color="orange.500">
              <HStack>
                <Icon as={FiFileText} />
                <Text>{data?.pendingDocuments ?? 0}</Text>
              </HStack>
            </StatNumber>
            <StatHelpText>À traiter</StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card bg={cardBg}>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">RétroReports actifs</StatLabel>
            <StatNumber color="purple.500">
              <HStack>
                <Icon as={FiFlag} />
                <Text>{data?.activeReports ?? 0}</Text>
              </HStack>
            </StatNumber>
            <StatHelpText>En cours</StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  );
});

// ---------- RetroReportCard (presentational) ----------
function RetroReportCard({ report, onUpdate, onComment, onStatusChange, onDelete }) {
  const cardBg = useColorModeValue('white', 'gray.800');

  const priorityColors = {
    low: 'green',
    medium: 'yellow',
    high: 'orange',
    critical: 'red'
  };

  const statusColors = {
    open: 'blue',
    in_progress: 'orange',
    resolved: 'green',
    closed: 'gray'
  };

  const priorityLabel = useMemo(() => {
    switch (report.priority) {
      case 'low': return '🟢 Faible';
      case 'medium': return '🟡 Moyen';
      case 'high': return '🟠 Élevé';
      default: return '🔴 Critique';
    }
  }, [report.priority]);

  const statusLabel = useMemo(() => {
    switch (report.status) {
      case 'open': return 'Ouvert';
      case 'in_progress': return 'En cours';
      case 'resolved': return 'Résolu';
      default: return 'Fermé';
    }
  }, [report.status]);

  const createdAt = report.createdAt ? new Date(report.createdAt) : null;

  return (
    <Card bg={cardBg} borderLeftWidth={4} borderLeftColor={`${priorityColors[report.priority]}.500`}>
      <CardHeader pb={3}>
        <Flex justify="space-between" align="start">
          <VStack align="start" spacing={2}>
            <HStack>
              <Badge colorScheme={priorityColors[report.priority]} variant="solid" size="sm">
                {priorityLabel}
              </Badge>
              <Badge colorScheme={statusColors[report.status]} variant="subtle">
                {statusLabel}
              </Badge>
            </HStack>

            <Heading size="sm">#{report.id} - {report.title}</Heading>

            <Text fontSize="xs" color="gray.500">
              Créé par {report.createdBy} {createdAt ? `le ${createdAt.toLocaleDateString('fr-FR')}` : ''}
            </Text>
          </VStack>

          <Menu>
            <MenuButton as={IconButton} icon={<FiMoreHorizontal />} variant="ghost" size="sm" />
            <MenuList>
              <MenuItem icon={<FiEdit3 />} onClick={() => onUpdate(report)}>Modifier</MenuItem>
              <MenuItem icon={<FiMessageSquare />} onClick={() => onComment(report)}>Commenter</MenuItem>

              {report.status === 'open' && (
                <MenuItem icon={<FiActivity />} onClick={() => onStatusChange(report.id, 'in_progress')}>Marquer en cours</MenuItem>
              )}

              {(report.status === 'open' || report.status === 'in_progress') && (
                <MenuItem icon={<FiCheck />} onClick={() => onStatusChange(report.id, 'resolved')}>Marquer comme résolu</MenuItem>
              )}

              {report.status === 'resolved' && (
                <MenuItem icon={<FiX />} onClick={() => onStatusChange(report.id, 'closed')}>Fermer définitivement</MenuItem>
              )}

              {report.status === 'closed' && (
                <MenuItem icon={<FiRefreshCw />} onClick={() => onStatusChange(report.id, 'open')}>Rouvrir</MenuItem>
              )}

              <MenuDivider />
              <MenuItem icon={<FiTrash2 />} onClick={() => onDelete(report.id)} color="red.500">Supprimer</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </CardHeader>

      <CardBody pt={0}>
        <VStack align="start" spacing={3}>
          <Text fontSize="sm">{report.description}</Text>

          {report.category && (
            <Tag size="sm" variant="subtle">
              <TagLabel>{report.category}</TagLabel>
            </Tag>
          )}

          {report.assignedTo && (
            <HStack>
              <Avatar size="xs" name={report.assignedTo} />
              <Text fontSize="xs">Assigné à {report.assignedTo}</Text>
            </HStack>
          )}

          {report.comments && report.comments.length > 0 && (
            <VStack align="start" spacing={2} w="full">
              <Divider />
              <HStack>
                <Icon as={FiMessageSquare} />
                <Text fontSize="xs" fontWeight="bold">{report.comments.length} commentaire(s)</Text>
              </HStack>

              <Box bg="gray.50" p={2} borderRadius="md" w="full">
                <Text fontSize="xs">{report.comments[report.comments.length - 1].message}</Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Par {report.comments[report.comments.length - 1].author} - {new Date(report.comments[report.comments.length - 1].createdAt).toLocaleDateString('fr-FR')}
                </Text>
              </Box>
            </VStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}

// ---------- ChangelogManagement (kept modular) ----------
function ChangelogManagement() {
  const cardBg = useColorModeValue('white', 'gray.800');
  const toast = useToast();

  const [changelogEntries, setChangelogEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEntry, setNewEntry] = useState({ 
    version: '', type: 'feature', title: '', description: '', author: '' 
  });
  
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Charger le changelog depuis l'API
  useEffect(() => {
    loadChangelog();
  }, []);

  const loadChangelog = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/admin/changelog`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChangelogEntries(data.entries || []);
      } else {
        console.error('Erreur chargement changelog:', response.status);
        // Utiliser des données par défaut en cas d'erreur
        setChangelogEntries([
          {
            id: 1,
            version: '2.1.0',
            date: '2025-10-18',
            type: 'feature',
            title: "Système RétroReports",
            description: "Ajout du système de tickets pour le suivi des incidents et améliorations",
            author: 'Équipe Dev'
          },
          {
            id: 2,
            version: '2.0.5',
            date: '2025-10-15',
            type: 'fix',
            title: 'Correction gestion membres',
            description: "Résolution des problèmes de performance sur la page de gestion des membres",
            author: 'W. Belaidi'
          }
        ]);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger le changelog",
        status: "error",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder le changelog vers l'API
  const saveChangelog = async (entries) => {
    try {
      setSaving(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/admin/changelog`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entries })
      });

      if (response.ok) {
        toast({
          title: "Changelog publié",
          description: "Les modifications sont maintenant visibles sur le site externe",
          status: "success",
          duration: 5000
        });
      } else {
        throw new Error(`Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast({
        title: "Erreur de publication",
        description: "Impossible de publier le changelog",
        status: "error",
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.version || !newEntry.title || !newEntry.description) {
      toast({ 
        title: 'Erreur', 
        description: 'Veuillez remplir tous les champs obligatoires', 
        status: 'error', 
        duration: 3000 
      });
      return;
    }

    const entry = {
      id: Date.now(),
      ...newEntry,
      date: new Date().toISOString().split('T')[0],
      author: newEntry.author || 'Administrateur'
    };

    const updatedEntries = [entry, ...changelogEntries];
    setChangelogEntries(updatedEntries);
    setNewEntry({ version: '', type: 'feature', title: '', description: '', author: '' });
    onClose();

    // Sauvegarder automatiquement
    await saveChangelog(updatedEntries);

    toast({ 
      title: 'Succès', 
      description: 'Entrée changelog ajoutée et publiée', 
      status: 'success', 
      duration: 3000 
    });
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
      return;
    }

    const updatedEntries = changelogEntries.filter(entry => entry.id !== entryId);
    setChangelogEntries(updatedEntries);
    
    // Sauvegarder automatiquement
    await saveChangelog(updatedEntries);

    toast({ 
      title: 'Entrée supprimée', 
      description: 'L\'entrée a été supprimée et la modification publiée', 
      status: 'success', 
      duration: 3000 
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(changelogEntries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `changelog-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'feature': return 'green';
      case 'fix': return 'red';
      case 'update': return 'blue';
      case 'security': return 'purple';
      default: return 'gray';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'feature': return '✨';
      case 'fix': return '🐛';
      case 'update': return '🔄';
      case 'security': return '🔒';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <VStack spacing={4}>
        <Spinner size="lg" />
        <Text>Chargement du changelog...</Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <VStack align="start" spacing={1}>
          <Heading size="md">📝 Gestion du Changelog</Heading>
          <Text fontSize="sm" color="gray.600">
            Historique des versions et mises à jour • Publié automatiquement sur le site externe
          </Text>
        </VStack>

        <HStack>
          <Button 
            leftIcon={<FiDownload />} 
            size="sm" 
            variant="outline"
            onClick={handleExport}
          >
            Exporter
          </Button>
          <Button 
            leftIcon={<FiRefreshCw />} 
            size="sm" 
            variant="outline"
            onClick={loadChangelog}
            isLoading={loading}
          >
            Actualiser
          </Button>
          <Button 
            leftIcon={<FiPlus />} 
            colorScheme="blue" 
            onClick={onOpen}
            isDisabled={saving}
          >
            Nouvelle entrée
          </Button>
        </HStack>
      </HStack>

      {/* Indicateur de sauvegarde */}
      {saving && (
        <Alert status="info">
          <AlertIcon />
          <Text fontSize="sm">Publication en cours sur le site externe...</Text>
        </Alert>
      )}

      <VStack spacing={4} align="stretch">
        {changelogEntries.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold" fontSize="sm">Aucune entrée changelog</Text>
              <Text fontSize="xs">Créez votre première entrée pour commencer l'historique</Text>
            </VStack>
          </Alert>
        ) : (
          changelogEntries.map((entry) => (
            <Card 
              key={entry.id} 
              bg={cardBg} 
              borderLeftWidth={4} 
              borderLeftColor={`${getTypeColor(entry.type)}.500`}
            >
              <CardHeader pb={3}>
                <Flex justify="space-between" align="start">
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Badge colorScheme={getTypeColor(entry.type)} variant="solid" size="sm">
                        {getTypeIcon(entry.type)} {entry.type.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">v{entry.version}</Badge>
                      <Text fontSize="xs" color="gray.500">{entry.date}</Text>
                    </HStack>

                    <Heading size="sm">{entry.title}</Heading>
                    <Text fontSize="xs" color="gray.500">Par {entry.author}</Text>
                  </VStack>

                  <Menu>
                    <MenuButton as={IconButton} icon={<FiMoreHorizontal />} variant="ghost" size="sm" />
                    <MenuList>
                      <MenuItem icon={<FiEdit3 />}>Modifier</MenuItem>
                      <MenuItem 
                        icon={<FiTrash2 />} 
                        color="red.500"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        Supprimer
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </CardHeader>

              <CardBody pt={0}>
                <Text fontSize="sm">{entry.description}</Text>
              </CardBody>
            </Card>
          ))
        )}
      </VStack>

      {/* Modal pour nouvelle entrée */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>📝 Nouvelle entrée Changelog</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="info">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold" fontSize="sm">Publication automatique</Text>
                  <Text fontSize="xs">
                    Cette entrée sera automatiquement publiée sur la page changelog du site externe
                  </Text>
                </VStack>
              </Alert>

              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Version</FormLabel>
                  <Input 
                    value={newEntry.version} 
                    onChange={(e) => setNewEntry(prev => ({ ...prev, version: e.target.value }))} 
                    placeholder="Ex: 2.1.1" 
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Type</FormLabel>
                  <Select 
                    value={newEntry.type} 
                    onChange={(e) => setNewEntry(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="feature">✨ Nouvelle fonctionnalité</option>
                    <option value="fix">🐛 Correction de bug</option>
                    <option value="update">🔄 Mise à jour</option>
                    <option value="security">🔒 Sécurité</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel>Titre</FormLabel>
                <Input 
                  value={newEntry.title} 
                  onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))} 
                  placeholder="Titre de la modification" 
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea 
                  value={newEntry.description} 
                  onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))} 
                  placeholder="Description détaillée des changements" 
                  rows={4} 
                />
              </FormControl>

              <FormControl>
                <FormLabel>Auteur</FormLabel>
                <Input 
                  value={newEntry.author} 
                  onChange={(e) => setNewEntry(prev => ({ ...prev, author: e.target.value }))} 
                  placeholder="Nom de l'auteur (optionnel)" 
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Annuler</Button>
            <Button 
              colorScheme="blue" 
              onClick={handleAddEntry} 
              leftIcon={<FiPlus />}
              isLoading={saving}
              loadingText="Publication..."
            >
              Ajouter et publier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

// ---------- AdminGeneral (main) ----------
export default function AdminGeneral() {
  const { user } = useUser();
  const toast = useToast();

  const {
    isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose
  } = useDisclosure();
  const {
    isOpen: isCommentOpen, onOpen: onCommentOpen, onClose: onCommentClose
  } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retroReports, setRetroReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const [reportFormData, setReportFormData] = useState({ title: '', description: '', category: '', priority: 'medium', type: 'bug' });
  const [editFormData, setEditFormData] = useState({ title: '', description: '', category: '', priority: 'medium', type: 'bug' });
  const [commentFormData, setCommentFormData] = useState({ message: '', status: '' });
  const [reportScreenshots, setReportScreenshots] = useState([]); // File[]

  const cardBg = useColorModeValue('white', 'gray.800');
  const gradientBg = useColorModeValue('linear(to-r, green.500, blue.600)', 'linear(to-r, green.600, blue.700)');

  // Load initial data (simulate) - only once
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      if (!mounted) return;

      setAdminData({ activeMembers: 45, totalMembers: 52, upcomingEvents: 3, pendingDocuments: 7, activeReports: 0 });
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Recompute admin stats when retroReports changes
  useEffect(() => {
    setAdminData(prev => {
      if (!prev) return prev; // attend l'init avant de recalculer
      return {
        ...prev,
        activeReports: retroReports.filter(r => r.status === 'open' || r.status === 'in_progress').length
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retroReports]);

  useEffect(() => {
    // Charger les retro reports à l'ouverture
    const fetchReports = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${base}/api/retro-reports`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('load failed');
        const data = await res.json();
        setRetroReports(data.reports || []);
      } catch (e) {
        console.error('Erreur chargement rétroreports:', e);
      }
    };
    fetchReports();
  }, []);

  const handleReportSubmit = async () => {
    if (!reportFormData.title || !reportFormData.description) {
      toast({ title: 'Erreur', description: "Veuillez remplir le titre et la description", status: 'error', duration: 3000, isClosable: true });
      return;
    }
    if (!reportScreenshots || reportScreenshots.length === 0) {
      toast({ title: 'Captures requises', description: "Ajoutez au moins une capture d’écran", status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const fd = new FormData();
      fd.append('title', reportFormData.title);
      fd.append('description', reportFormData.description);
      fd.append('category', reportFormData.category || '');
      fd.append('priority', reportFormData.priority || 'medium');
      fd.append('type', reportFormData.type || 'bug');
      reportScreenshots.forEach(f => fd.append('screenshots', f, f.name));

      const res = await fetch(`${base}/api/retro-reports`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: fd
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({error:'create failed'}));
        throw new Error(err.error || 'create failed');
      }
      const data = await res.json();
      setRetroReports(prev => [data.report, ...prev]);
      setReportFormData({ title: '', description: '', category: '', priority: 'medium', type: 'bug' });
      setReportScreenshots([]);
      onReportClose();
      toast({ title: 'Succès', description: 'RétroReport créé avec succès', status: 'success', duration: 3000, isClosable: true });
    } catch (e) {
      toast({ title: 'Erreur', description: e.message || "Impossible de créer le RétroReport", status: 'error', duration: 3000 });
    }
  };

  const handleCommentSubmit = () => {
    if (!commentFormData.message) {
      toast({ title: 'Erreur', description: 'Veuillez écrire un commentaire', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    const newComment = { id: Date.now(), author: user?.name || 'Administrateur', message: commentFormData.message, createdAt: new Date().toISOString() };

    setRetroReports(prev => prev.map(report => report.id === selectedReport.id ? ({ ...report, comments: [...(report.comments || []), newComment], status: commentFormData.status || report.status }) : report));

    setCommentFormData({ message: '', status: '' });
    onCommentClose();

    toast({ title: 'Succès', description: 'Commentaire ajouté avec succès', status: 'success', duration: 3000, isClosable: true });
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/retro-reports/${reportId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json','Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('status failed');
      const data = await res.json();
      setRetroReports(prev => prev.map(r => r.id === data.report.id ? data.report : r));
      const labels = { open: 'Ouvert', in_progress: 'En cours', resolved: 'Résolu', closed: 'Fermé' };
      toast({ title: 'Statut mis à jour', description: `RétroReport marqué comme ${labels[newStatus]?.toLowerCase() || newStatus}`, status: 'success', duration: 3000 });
    } catch (e) {
      toast({ title: 'Erreur', description: 'Impossible de changer le statut', status: 'error', duration: 3000 });
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce RétroReport ?')) return;
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/retro-reports/${reportId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
      if (!res.ok) throw new Error('delete failed');
      setRetroReports(prev => prev.filter(r => r.id !== reportId));
      toast({ title: 'RétroReport supprimé', description: 'Le ticket a été supprimé avec succès', status: 'success', duration: 3000 });
    } catch (e) {
      toast({ title: 'Erreur', description: 'Suppression impossible', status: 'error', duration: 3000 });
    }
  };

  const handleEditReport = (report) => {
    setSelectedReport(report);
    setEditFormData({ title: report.title, description: report.description, category: report.category || '', priority: report.priority || 'medium', type: report.type || 'bug' });
    onEditOpen();
  };

  const handleEditSubmit = async () => {
    if (!selectedReport?.id || !editFormData.title || !editFormData.description) {
      toast({ title: 'Erreur', description: 'Titre et description requis', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/retro-reports/${selectedReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json','Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description,
          category: editFormData.category || '',
          priority: editFormData.priority || 'medium',
          type: editFormData.type || 'bug'
        })
      });
      if (!res.ok) throw new Error('update failed');
      const data = await res.json();
      setRetroReports(prev => prev.map(r => r.id === data.report.id ? data.report : r));
      onEditClose();
      toast({ title: 'Succès', description: 'RétroReport mis à jour', status: 'success', duration: 3000 });
    } catch (e) {
      toast({ title: 'Erreur', description: 'Mise à jour impossible', status: 'error', duration: 3000 });
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8}>
          <Spinner size="xl" color="green.500" />
          <Text>Chargement des données administratives...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8} fontFamily="Montserrat, sans-serif">
      <Box bgGradient={gradientBg} color="white" p={8} borderRadius="xl" mb={8} textAlign="center">
        <Heading size="xl" mb={4}>⚙️ Gestion Administrative</Heading>
        <Text fontSize="lg" opacity={0.9}>Administration générale, RétroReports et gestion du changelog • MyRBE</Text>
      </Box>

      <AdminStats data={adminData} loading={false} />

      <Tabs variant="enclosed" mb={8}>
        <TabList>
          <Tab>🎫 RétroReports</Tab>
          <Tab>📝 Changelog & Versions</Tab>
          <Tab>🌐 Gestion du Site</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Heading size="md">🎫 RétroReports - Système de tickets</Heading>
                  <Text fontSize="sm" color="gray.600">Signalement et suivi des incidents, bugs et demandes d'amélioration</Text>
                </VStack>
                <Button leftIcon={<FiPlus />} colorScheme="red" onClick={onReportOpen}>Nouveau RétroReport</Button>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                <Card bg={cardBg}>
                  <CardBody>
                    <Stat>
                      <StatLabel fontSize="xs">Ouverts</StatLabel>
                      <StatNumber color="red.500" fontSize="lg">
                        {retroReports.filter(r => r.status === 'open').length}
                      </StatNumber>
                    </Stat>
                  </CardBody>
                </Card>
                <Card bg={cardBg}>
                  <CardBody>
                    <Stat>
                      <StatLabel fontSize="xs">En cours</StatLabel>
                      <StatNumber color="orange.500" fontSize="lg">
                        {retroReports.filter(r => r.status === 'in_progress').length}
                      </StatNumber>
                    </Stat>
                  </CardBody>
                </Card>
                <Card bg={cardBg}>
                  <CardBody>
                    <Stat>
                      <StatLabel fontSize="xs">Résolus</StatLabel>
                      <StatNumber color="green.500" fontSize="lg">
                        {retroReports.filter(r => r.status === 'resolved').length}
                      </StatNumber>
                    </Stat>
                  </CardBody>
                </Card>
                <Card bg={cardBg}>
                  <CardBody>
                    <Stat>
                      <StatLabel fontSize="xs">Total</StatLabel>
                      <StatNumber color="blue.500" fontSize="lg">
                        {retroReports.length}
                      </StatNumber>
                    </Stat>
                  </CardBody>
                </Card>
              </SimpleGrid>

              <VStack spacing={4} align="stretch">
                {retroReports.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold" fontSize="sm">Aucun RétroReport</Text>
                      <Text fontSize="xs">Créez votre premier ticket pour signaler un incident ou demander une amélioration.</Text>
                    </VStack>
                  </Alert>
                ) : (
                  retroReports.map(report => (
                    <RetroReportCard 
                      key={report.id} 
                      report={report} 
                      onUpdate={handleEditReport} 
                      onComment={(r) => { setSelectedReport(r); onCommentOpen(); }} 
                      onStatusChange={handleStatusChange} 
                      onDelete={handleDeleteReport} 
                    />
                  ))
                }
              </VStack>
            </VStack>
          </TabPanel>

          <TabPanel>
            <ChangelogManagement />
          </TabPanel>

          <TabPanel>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Heading size="md">🌐 Gestion du Site Web</Heading>
                  <Text fontSize="sm" color="gray.600">Configuration et maintenance du site web public</Text>
                </VStack>
                <Button leftIcon={<FiGlobe />} colorScheme="blue">Accéder au site</Button>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="sm">📄 Pages et contenu</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Button leftIcon={<FiEdit3 />} size="sm" variant="outline">
                        Modifier la page d'accueil
                      </Button>
                      <Button leftIcon={<FiEdit3 />} size="sm" variant="outline">
                        Gérer les événements
                      </Button>
                      <Button leftIcon={<FiEdit3 />} size="sm" variant="outline">
                        Mettre à jour "À propos"
                      </Button>
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
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal pour créer un RétroReport */}
      <Modal isOpen={isReportOpen} onClose={onReportClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>🎫 Nouveau RétroReport</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="info">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold" fontSize="sm">Système de tickets RétroReports</Text>
                  <Text fontSize="xs">Signalisez les incidents, bugs, demandes d'amélioration ou tout problème nécessitant un suivi.</Text>
                </VStack>
              </Alert>

              <FormControl isRequired>
                <FormLabel>Titre du rapport</FormLabel>
                <Input 
                  value={reportFormData.title} 
                  onChange={(e) => setReportFormData(prev => ({ ...prev, title: e.target.value }))} 
                  placeholder="Ex: Problème de connexion, Page lente..." 
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description détaillée</FormLabel>
                <Textarea 
                  value={reportFormData.description} 
                  onChange={(e) => setReportFormData(prev => ({ ...prev, description: e.target.value }))} 
                  placeholder="Décrivez le problème en détail, les étapes pour le reproduire..." 
                  rows={4} 
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl>
                  <FormLabel>Type</FormLabel>
                  <Select 
                    value={reportFormData.type} 
                    onChange={(e) => setReportFormData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="bug">🐛 Bug</option>
                    <option value="feature">✨ Demande d'amélioration</option>
                    <option value="performance">⚡ Performance</option>
                    <option value="security">🔒 Sécurité</option>
                    <option value="other">📋 Autre</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Priorité</FormLabel>
                  <Select 
                    value={reportFormData.priority} 
                    onChange={(e) => setReportFormData(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="low">🟢 Faible</option>
                    <option value="medium">🟡 Moyen</option>
                    <option value="high">🟠 Élevé</option>
                    <option value="critical">🔴 Critique</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Catégorie</FormLabel>
                <Input 
                  value={reportFormData.category} 
                  onChange={(e) => setReportFormData(prev => ({ ...prev, category: e.target.value }))} 
                  placeholder="Ex: Technique, Interface, Base de données..." 
                />
              </FormControl>

              {/* Ajout du champ pour les captures d'écran */}
              <FormControl isRequired>
                <FormLabel>Captures d’écran (au moins une)</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setReportScreenshots(files);
                  }}
                />
                <Text fontSize="xs" color="gray.500">Formats images, 10 Mo max, jusqu’à 10 fichiers</Text>
                {reportScreenshots?.length > 0 && (
                  <VStack align="start" spacing={1} mt={2}>
                    {reportScreenshots.map((f, i) => (
                      <Text key={i} fontSize="xs" color="gray.600">• {f.name} ({Math.round(f.size/1024)} KB)</Text>
                    ))}
                  </VStack>
                )}
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onReportClose}>Annuler</Button>
            <Button colorScheme="red" onClick={handleReportSubmit} leftIcon={<FiFlag />}>
              Créer le RétroReport
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal pour commenter un RétroReport */}
      <Modal isOpen={isCommentOpen} onClose={onCommentClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>💬 Commenter le RétroReport #{selectedReport?.id}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Commentaire</FormLabel>
                <Textarea 
                  value={commentFormData.message} 
                  onChange={(e) => setCommentFormData(prev => ({ ...prev, message: e.target.value }))} 
                  placeholder="Ajoutez une mise à jour, une solution ou un commentaire..." 
                  rows={4} 
                />
              </FormControl>

              <FormControl>
                <FormLabel>Changer le statut (optionnel)</FormLabel>
                <Select 
                  value={commentFormData.status} 
                  onChange={(e) => setCommentFormData(prev => ({ ...prev, status: e.target.value }))} 
                  placeholder="Garder le statut actuel"
                >
                  <option value="open">Ouvert</option>
                  <option value="in_progress">En cours</option>
                  <option value="resolved">Résolu</option>
                  <option value="closed">Fermé</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCommentClose}>Annuler</Button>
            <Button colorScheme="blue" onClick={handleCommentSubmit} leftIcon={<FiSend />}>
              Ajouter le commentaire
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal pour modifier un RétroReport */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>✏️ Modifier le RétroReport #{selectedReport?.id}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Titre</FormLabel>
                <Input 
                  value={editFormData.title} 
                  onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))} 
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea 
                  value={editFormData.description} 
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))} 
                  rows={4} 
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl>
                  <FormLabel>Type</FormLabel>
                  <Select 
                    value={editFormData.type} 
                    onChange={(e) => setEditFormData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="bug">🐛 Bug</option>
                    <option value="feature">✨ Demande d'amélioration</option>
                    <option value="performance">⚡ Performance</option>
                    <option value="security">🔒 Sécurité</option>
                    <option value="other">📋 Autre</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Priorité</FormLabel>
                  <Select 
                    value={editFormData.priority} 
                    onChange={(e) => setEditFormData(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="low">🟢 Faible</option>
                    <option value="medium">🟡 Moyen</option>
                    <option value="high">🟠 Élevé</option>
                    <option value="critical">🔴 Critique</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Catégorie</FormLabel>
                <Input 
                  value={editFormData.category} 
                  onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))} 
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>Annuler</Button>
            <Button colorScheme="green" onClick={handleEditSubmit} leftIcon={<FiCheck />}>
              Sauvegarder
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}