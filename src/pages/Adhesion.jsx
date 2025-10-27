import React, { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Card, CardHeader, CardBody, Badge,
  Heading, SimpleGrid, Button, Center, Alert, AlertIcon,
  Divider, Progress, useToast, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalFooter, FormControl, FormLabel,
  Input, useDisclosure, Textarea, Switch, Spinner, Select,
  Tabs, TabList, TabPanels, Tab, TabPanel,
  Table, Thead, Tbody, Tr, Th, Td, IconButton
} from '@chakra-ui/react';
import { 
  FiUser, FiCreditCard, FiCalendar, FiMail, FiPhone, 
  FiMapPin, FiKey, FiEdit, FiDownload, FiSave, FiX, FiPlus 
} from 'react-icons/fi';
import { useUser } from '../context/UserContext';
// NOTE: Profil adhérent est géré côté serveur (créé depuis l'admin MyRBE)

// Use relative URLs by default so Vite dev proxy can route calls; fall back to env when provided
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const MEMBERSHIP_STATUS_CONFIG = {
  PENDING: { label: 'En attente', color: 'yellow', progress: 25 },
  ACTIVE: { label: 'Actif', color: 'green', progress: 100 },
  EXPIRED: { label: 'Expiré', color: 'red', progress: 0 },
  SUSPENDED: { label: 'Suspendu', color: 'orange', progress: 50 }
};

const MEMBERSHIP_TYPES = {
  STANDARD: 'Adhésion Standard',
  FAMILY: 'Adhésion Famille',
  STUDENT: 'Adhésion Étudiant',
  HONORARY: 'Membre d\'Honneur',
  BIENFAITEUR: 'Bienfaiteur'
};

const PAYMENT_METHODS = {
  CASH: 'Espèces',
  CHECK: 'Chèque',
  BANK_TRANSFER: 'Virement',
  CARD: 'Carte bancaire',
  PAYPAL: 'PayPal',
  HELLOASSO: 'HelloAsso'
};

export default function MyMembership() {
  const { user } = useUser();
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState(null);
  const [apiBase, setApiBase] = useState(null); // null => relative, string => absolute base
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  // Le profil ne se crée pas côté utilisateur: pas de mode création
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const { isOpen: isPasswordModalOpen, onOpen: onPasswordModalOpen, onClose: onPasswordModalClose } = useDisclosure();
  const { isOpen: isTerminateOpen, onOpen: onTerminateOpen, onClose: onTerminateClose } = useDisclosure();
  const [terminateForm, setTerminateForm] = useState({ reason: '', notes: '', pv: null, resignation: null });
  const toast = useToast();

  // Plus de détection de profil admin local: tout vient de l'API

  useEffect(() => {
    fetchMemberData();
  }, []);

  useEffect(() => {
    if (memberData && memberData.id) {
      fetchDocuments();
    } else {
      setDocuments([]);
    }
  }, [memberData?.id]);

  // Chargement du profil adhérent depuis l'API uniquement
  const fetchMemberData = async () => {
    try {
      setLoading(true);
      setLastError(null);

      const candidates = [];
      if (API_BASE_URL) candidates.push(API_BASE_URL);
      // Always try same-origin as fallback
      candidates.push('');

      let found = null;
      let lastStatus = null;
      for (const base of candidates) {
        try {
          const resp = await fetch(`${base}/api/members/me`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          lastStatus = resp.status;
          if (resp.ok) {
            const info = await resp.json();
            setMemberData({ ...info, isAdminAccount: false });
            setEditData(info);
            setApiBase(base || null);
            found = base;
            break;
          }
        } catch (e) {
          // network/CORS error
          lastStatus = 'network-error';
          continue;
        }
      }

      if (!found) {
        setMemberData(null);
        setLastError(lastStatus);
      }
    } catch (error) {
      console.error('Erreur chargement membre:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les informations d'adhésion",
        status: "error",
        duration: 5000
      });
      setMemberData(null);
      setLastError('exception');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditMode(true);
    setEditData({ ...memberData });
  };

  // Plus de création locale de profil côté utilisateur

  const handleSaveProfile = async () => {
    try {
      if (!editData.firstName || !editData.lastName) {
        throw new Error('Prénom et nom requis');
      }
      // Sauvegarde via API uniquement
      const response = await fetch(`${API_BASE_URL}/api/members/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editData)
      });

      if (!response.ok) {
        const error = await response.json().catch(()=>({}));
        throw new Error(error.error || 'Erreur de sauvegarde');
      }

      const updatedData = await response.json();
      setMemberData(updatedData);
      setEditMode(false);
      toast({ status: 'success', title: 'Profil mis à jour', description: 'Vos informations ont été sauvegardées', duration: 3000 });
      
    } catch (error) {
      toast({
        status: 'error',
        title: 'Erreur',
        description: error.message,
        duration: 5000
      });
    }
  };

  const fetchDocuments = async () => {
    try {
      setDocsLoading(true);
      const bases = [apiBase ?? '', API_BASE_URL || ''];
      let ok = false;
      for (const b of bases) {
        try {
          const resp = await fetch(`${b}/api/members/me/documents`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (resp.ok) {
            const data = await resp.json();
            setDocuments(data?.documents || []);
            ok = true;
            break;
          }
        } catch {}
      }
      if (!ok) throw new Error('Chargement des documents impossible');
    } catch (e) {
      console.error('Docs error', e);
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const bases = [apiBase ?? '', API_BASE_URL || ''];
      let resp = null;
      for (const b of bases) {
        try {
          const r = await fetch(`${b}/api/documents/${doc.id}/download`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (r.ok) { resp = r; break; }
        } catch {}
      }
      if (!resp) throw new Error('Téléchargement impossible');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || 'document';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ status: 'error', title: 'Erreur', description: e.message });
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditData({ ...memberData });
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        status: 'error',
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
        duration: 3000
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        status: 'error',
        title: 'Erreur',
        description: 'Le mot de passe doit faire au moins 6 caractères',
        duration: 3000
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/members/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur de changement de mot de passe');
      }

      toast({
        status: 'success',
        title: 'Mot de passe modifié',
        description: 'Votre mot de passe a été mis à jour avec succès',
        duration: 3000
      });

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onPasswordModalClose();
      
    } catch (error) {
      toast({
        status: 'error',
        title: 'Erreur',
        description: error.message,
        duration: 5000
      });
    }
  };

  if (loading) {
    return (
      <Center h="400px">
        <Spinner size="xl" />
      </Center>
    );
  }

  // Helpers dates et échéances
  const formatDate = (d) => {
    try {
      const dt = typeof d === 'string' ? new Date(d) : d;
      return dt ? dt.toLocaleDateString('fr-FR') : '-';
    } catch {
      return '-';
    }
  };
  const addYears = (date, years) => {
    const d = new Date(date.getTime());
    d.setFullYear(d.getFullYear() + years);
    return d;
  };
  const daysBetween = (a, b) => Math.ceil((b.getTime() - a.getTime()) / (1000*60*60*24));

  const startDate = memberData?.membershipStartDate ? new Date(memberData.membershipStartDate) : null;
  const endDate = memberData?.membershipEndDate ? new Date(memberData.membershipEndDate) : null;
  const computedRenewal = startDate ? addYears(startDate, 1) : null;
  const effectiveExpiry = endDate || computedRenewal;
  const today = new Date();
  const isExpired = effectiveExpiry ? effectiveExpiry < today : false;
  const daysLeft = effectiveExpiry ? daysBetween(today, effectiveExpiry) : null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'PENDING': return 'orange';
      case 'EXPIRED': return 'red';
      case 'SUSPENDED': return 'gray';
      default: return 'gray';
    }
  };

  const statusConfig = MEMBERSHIP_STATUS_CONFIG[memberData?.membershipStatus] || 
    { label: memberData?.membershipStatus || 'Non défini', color: 'gray', progress: 0 };

  return (
    <Box p={6} maxW="4xl" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="lg" display="flex" alignItems="center">
            <FiUser style={{ marginRight: '8px' }} />
            Mon Adhésion
          </Heading>
          {editMode ? (
            <HStack>
              <Button leftIcon={<FiSave />} colorScheme="green" onClick={handleSaveProfile}>
                Sauvegarder
              </Button>
              <Button leftIcon={<FiX />} variant="outline" onClick={handleCancelEdit}>
                Annuler
              </Button>
            </HStack>
          ) : (
            <Button leftIcon={<FiEdit />} onClick={handleEditProfile}>
              Modifier
            </Button>
          )}
        </HStack>

        {/* Si le profil n'existe pas côté serveur */}
        {!memberData && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Profil adhérent introuvable</Text>
              <Text fontSize="sm">
                {lastError === 401 ? (
                  'Vous n’êtes pas autorisé. Veuillez vous reconnecter.'
                ) : lastError === 404 ? (
                  'Votre profil n’est pas encore lié. Merci de contacter un administrateur pour l’associer depuis la Gestion des Adhérents.'
                ) : lastError === 500 ? (
                  'Erreur serveur lors de la récupération du profil.'
                ) : lastError === 'network-error' ? (
                  'Impossible de joindre l’API. Réseau ou CORS ? Essayez à nouveau.'
                ) : (
                  'Votre profil n\'est pas encore lié. Merci de contacter un administrateur pour l\'associer depuis la Gestion des Adhérents.'
                )}
              </Text>
              <HStack mt={3}>
                <Button size="sm" onClick={fetchMemberData}>Réessayer</Button>
              </HStack>
            </Box>
          </Alert>
        )}

        {memberData && (
          <>
            {/* Plus de mode profil local admin */}
            {/* Onglets d'information */}
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab>Informations personnelles</Tab>
                <Tab>Informations Adhérent</Tab>
                <Tab>Documents d'adhésions</Tab>
              </TabList>
              <TabPanels>
                {/* Tab 1: Informations personnelles */}
                <TabPanel px={0}>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Informations personnelles</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        {editMode ? (
                          <>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              <FormControl isRequired>
                                <FormLabel>Prénom</FormLabel>
                                <Input
                                  value={editData.firstName || ''}
                                  onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                                />
                              </FormControl>
                              <FormControl isRequired>
                                <FormLabel>Nom</FormLabel>
                                <Input
                                  value={editData.lastName || ''}
                                  onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                                />
                              </FormControl>
                              <FormControl>
                                <FormLabel>Email</FormLabel>
                                <Input
                                  type="email"
                                  value={editData.email || ''}
                                  onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                                />
                              </FormControl>
                              <FormControl>
                                <FormLabel>Téléphone</FormLabel>
                                <Input
                                  value={editData.phone || ''}
                                  onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                                />
                              </FormControl>
                            </SimpleGrid>

                            <FormControl>
                              <FormLabel>Adresse</FormLabel>
                              <Input
                                value={editData.address || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                              />
                            </FormControl>

                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              <FormControl>
                                <FormLabel>Code postal</FormLabel>
                                <Input
                                  value={editData.postalCode || ''}
                                  onChange={(e) => setEditData(prev => ({ ...prev, postalCode: e.target.value }))}
                                />
                              </FormControl>
                              <FormControl>
                                <FormLabel>Ville</FormLabel>
                                <Input
                                  value={editData.city || ''}
                                  onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                                />
                              </FormControl>
                            </SimpleGrid>

                            <FormControl>
                              <FormLabel>Date de naissance</FormLabel>
                              <Input
                                type="date"
                                value={editData.birthDate ? editData.birthDate.split('T')[0] : ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, birthDate: e.target.value }))}
                              />
                            </FormControl>
                          </>
                        ) : (
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Box>
                              <HStack mb={4}>
                                <FiUser />
                                <Box>
                                  <Text fontSize="sm" color="gray.600">Nom complet</Text>
                                  <Text fontWeight="bold">{memberData.firstName} {memberData.lastName}</Text>
                                </Box>
                              </HStack>
                              {memberData.email && (
                                <HStack mb={4}>
                                  <FiMail />
                                  <Box>
                                    <Text fontSize="sm" color="gray.600">Email</Text>
                                    <Text fontWeight="bold">{memberData.email}</Text>
                                  </Box>
                                </HStack>
                              )}
                              {memberData.phone && (
                                <HStack mb={4}>
                                  <FiPhone />
                                  <Box>
                                    <Text fontSize="sm" color="gray.600">Téléphone</Text>
                                    <Text fontWeight="bold">{memberData.phone}</Text>
                                  </Box>
                                </HStack>
                              )}
                            </Box>
                            <Box>
                              {(memberData.address || memberData.city) && (
                                <HStack mb={4}>
                                  <FiMapPin />
                                  <Box>
                                    <Text fontSize="sm" color="gray.600">Adresse</Text>
                                    <Text fontWeight="bold">
                                      {memberData.address && `${memberData.address}, `}
                                      {memberData.postalCode} {memberData.city}
                                    </Text>
                                  </Box>
                                </HStack>
                              )}
                              {memberData.birthDate && (
                                <HStack mb={4}>
                                  <FiCalendar />
                                  <Box>
                                    <Text fontSize="sm" color="gray.600">Date de naissance</Text>
                                    <Text fontWeight="bold">{new Date(memberData.birthDate).toLocaleDateString('fr-FR')}</Text>
                                  </Box>
                                </HStack>
                              )}
                            </Box>
                          </SimpleGrid>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>

                {/* Tab 2: Infos Adhérent */}
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Card>
                      <CardHeader>
                        <Heading size="md">Statut de l'Adhésion</Heading>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 4, md: 6 }}>
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={2}>Statut actuel</Text>
                            <Badge colorScheme={getStatusColor(memberData.membershipStatus)} fontSize="md" p={2}>
                              {statusConfig.label}
                            </Badge>
                            <Progress value={statusConfig.progress} colorScheme={getStatusColor(memberData.membershipStatus)} mt={2} size="sm" />
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={2}>Type d'adhésion</Text>
                            <Text fontWeight="bold">{MEMBERSHIP_TYPES[memberData.membershipType] || memberData.membershipType}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={2}>Matricule</Text>
                            <Text fontWeight="bold" color="blue.600">{memberData.matricule}</Text>
                            <Text fontSize="xs" color="gray.500">Utilisé pour se connecter au site</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={2}>Numéro d'adhérent</Text>
                            <Text fontWeight="bold" color="purple.600">{memberData.memberNumber}</Text>
                            <Text fontSize="xs" color="gray.500">Numéro unique d'adhésion</Text>
                          </Box>
                        </SimpleGrid>

                        {/* Validité & Renouvellement */}
                        <Divider my={4} />
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 4, md: 6 }}>
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={1}>Début d'adhésion</Text>
                            <Text fontWeight="bold">{startDate ? formatDate(startDate) : '-'}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={1}>Expiration prévue</Text>
                            <Text fontWeight="bold" color={isExpired ? 'red.600' : 'gray.800'}>
                              {effectiveExpiry ? formatDate(effectiveExpiry) : '-'}
                            </Text>
                            {effectiveExpiry && (
                              <Text fontSize="xs" color={isExpired ? 'red.500' : 'gray.500'}>
                                {isExpired ? 'Adhésion expirée' : `${daysLeft} jour(s) restant(s)`}
                              </Text>
                            )}
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={1}>Dernier paiement</Text>
                            <Text fontWeight="bold">{startDate ? formatDate(startDate) : '-'}</Text>
                            {memberData?.paymentAmount && (
                              <Text fontSize="xs" color="gray.600">{memberData.paymentAmount}€ ({PAYMENT_METHODS[memberData.paymentMethod] || memberData.paymentMethod})</Text>
                            )}
                          </Box>
                        </SimpleGrid>
                        {/* Message incitatif si proche de l'échéance */}
                        {!isExpired && daysLeft !== null && daysLeft <= 60 && (
                          <Alert status="warning" mt={4} borderRadius="md">
                            <AlertIcon />
                            Votre adhésion arrive à échéance dans {daysLeft} jour(s). Pensez à la renouveler.
                          </Alert>
                        )}
                        {/* Message si expirée */}
                        {isExpired && (
                          <Alert status="error" mt={4} borderRadius="md">
                            <AlertIcon />
                            Votre adhésion est expirée. Veuillez procéder au renouvellement.
                          </Alert>
                        )}
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <Heading size="md">Détails d'adhésion</Heading>
                      </CardHeader>
                      <CardBody>
                        {editMode ? (
                          <VStack spacing={4} align="stretch">
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              <FormControl>
                                <FormLabel>Type d'adhésion</FormLabel>
                                <Select
                                  value={editData.membershipType || 'STANDARD'}
                                  onChange={(e) => setEditData(prev => ({ ...prev, membershipType: e.target.value }))}
                                >
                                  {Object.entries(MEMBERSHIP_TYPES).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                  ))}
                                </Select>
                              </FormControl>
                              <FormControl>
                                <FormLabel>Montant cotisation (€)</FormLabel>
                                <Input
                                  type="number"
                                  value={editData.paymentAmount || ''}
                                  onChange={(e) => setEditData(prev => ({ ...prev, paymentAmount: e.target.value }))}
                                />
                              </FormControl>
                            </SimpleGrid>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              <FormControl>
                                <FormLabel>Mode de paiement</FormLabel>
                                <Select
                                  value={editData.paymentMethod || 'CASH'}
                                  onChange={(e) => setEditData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                >
                                  {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                  ))}
                                </Select>
                              </FormControl>
                              <FormControl display="flex" alignItems="center">
                                <FormLabel htmlFor="newsletter" mb="0">Newsletter</FormLabel>
                                <Switch
                                  id="newsletter"
                                  isChecked={editData.newsletter}
                                  onChange={(e) => setEditData(prev => ({ ...prev, newsletter: e.target.checked }))}
                                />
                              </FormControl>
                            </SimpleGrid>
                            <FormControl>
                              <FormLabel>Notes</FormLabel>
                              <Textarea
                                value={editData.notes || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Notes personnelles..."
                              />
                            </FormControl>
                          </VStack>
                        ) : (
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 6 }}>
                            <Box>
                              {memberData.paymentAmount && (
                                <HStack mb={4}>
                                  <FiCreditCard />
                                  <Box>
                                    <Text fontSize="sm" color="gray.600">Cotisation</Text>
                                    <Text fontWeight="bold">{memberData.paymentAmount}€ ({PAYMENT_METHODS[memberData.paymentMethod] || memberData.paymentMethod})</Text>
                                  </Box>
                                </HStack>
                              )}
                              <HStack mb={4}>
                                <FiUser />
                                <Box>
                                  <Text fontSize="sm" color="gray.600">Type</Text>
                                  <Text fontWeight="bold">{MEMBERSHIP_TYPES[memberData.membershipType] || memberData.membershipType}</Text>
                                </Box>
                              </HStack>
                              {startDate && (
                                <HStack mb={4}>
                                  <FiCalendar />
                                  <Box>
                                    <Text fontSize="sm" color="gray.600">Début d'adhésion</Text>
                                    <Text fontWeight="bold">{formatDate(startDate)}</Text>
                                  </Box>
                                </HStack>
                              )}
                            </Box>
                            <Box>
                              <HStack mb={4}>
                                <FiKey />
                                <Box>
                                  <Text fontSize="sm" color="gray.600">Matricule</Text>
                                  <Text fontWeight="bold" color="blue.600">{memberData.matricule}</Text>
                                </Box>
                              </HStack>
                              <HStack mb={4}>
                                <FiKey />
                                <Box>
                                  <Text fontSize="sm" color="gray.600">Numéro d'adhérent</Text>
                                  <Text fontWeight="bold" color="purple.600">{memberData.memberNumber}</Text>
                                </Box>
                              </HStack>
                              {effectiveExpiry && (
                                <HStack mb={4}>
                                  <FiCalendar />
                                  <Box>
                                    <Text fontSize="sm" color="gray.600">Expiration prévue</Text>
                                    <Text fontWeight="bold" color={isExpired ? 'red.600' : 'gray.800'}>{formatDate(effectiveExpiry)}</Text>
                                  </Box>
                                </HStack>
                              )}
                            </Box>
                          </SimpleGrid>
                        )}
                      </CardBody>
                    </Card>
                  </VStack>
                </TabPanel>

                {/* Tab 3: Documents d'adhésions */}
                <TabPanel px={0}>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Documents d'adhésions</Heading>
                    </CardHeader>
                    <CardBody>
                      {docsLoading ? (
                        <Center><Spinner /></Center>
                      ) : documents.length === 0 ? (
                        <Text color="gray.600">Aucun document pour le moment.</Text>
                      ) : (
                        <Table size="sm">
                          <Thead>
                            <Tr>
                              <Th>Fichier</Th>
                              <Th>Type</Th>
                              <Th>Ajouté le</Th>
                              <Th>Expiration</Th>
                              <Th>Statut</Th>
                              <Th></Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {documents.map((d) => (
                              <Tr key={d.id}>
                                <Td>{d.fileName}</Td>
                                <Td>{d.documentType || '-'}</Td>
                                <Td>{d.uploadedAt ? new Date(d.uploadedAt).toLocaleString('fr-FR') : '-'}</Td>
                                <Td>{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString('fr-FR') : '-'}</Td>
                                <Td><Badge>{d.status || 'PENDING'}</Badge></Td>
                                <Td textAlign="right">
                                  <Button size="sm" leftIcon={<FiDownload />} onClick={() => handleDownload(d)}>Télécharger</Button>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </CardBody>
                  </Card>
                </TabPanel>
              </TabPanels>
            </Tabs>

            {/* Actions */}
            {!editMode && (
              <Card>
                <CardHeader>
                  <Heading size="md">Actions</Heading>
                </CardHeader>
                <CardBody>
                  <HStack spacing={4} wrap="wrap">
                    <Button leftIcon={<FiKey />} onClick={onPasswordModalOpen}>
                      Changer le mot de passe
                    </Button>
                    <Button leftIcon={<FiDownload />} variant="outline">
                      Télécharger ma carte d'adhérent
                    </Button>
                    {(() => {
                      const roles = (user?.roles || []).map(r => String(r).toUpperCase());
                      const hasBureauRole = roles.some(r => ['PRESIDENT','VICE_PRESIDENT','TRESORIER','SECRETAIRE_GENERAL'].includes(r));
                      return hasBureauRole;
                    })() && (
                      <Button colorScheme="red" variant="outline" onClick={onTerminateOpen}>
                        Supprimer l'adhésion
                      </Button>
                    )}
                  </HStack>
                </CardBody>
              </Card>
            )}

            {/* Notes si présentes */}
            {memberData.notes && !editMode && (
              <Card>
                <CardHeader>
                  <Heading size="md">Notes</Heading>
                </CardHeader>
                <CardBody>
                  <Text>{memberData.notes}</Text>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </VStack>

      {/* Modal de changement de mot de passe */}
      <Modal isOpen={isPasswordModalOpen} onClose={onPasswordModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Changer le mot de passe</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Mot de passe actuel</FormLabel>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({...prev, currentPassword: e.target.value}))}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Nouveau mot de passe</FormLabel>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPasswordModalClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={handlePasswordChange}>
              Modifier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal suppression/fin d'adhésion */}
      <Modal isOpen={isTerminateOpen} onClose={onTerminateClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Supprimer l'adhésion</ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                Cette action met fin à l'adhésion. L'accès site associé sera désactivé.
              </Alert>
              <FormControl isRequired>
                <FormLabel>Motif</FormLabel>
                <Select value={terminateForm.reason} onChange={(e)=>setTerminateForm(p=>({...p, reason:e.target.value}))}>
                  <option value="">Choisir un motif...</option>
                  <option value="FIN">Fin d'adhésion</option>
                  <option value="NON_RECONDUITE">Non reconduite</option>
                  <option value="EXCLUSION">Exclusion votée (joindre le PV)</option>
                  <option value="DEMISSION">Démission (joindre PV et lettre de démission)</option>
                  <option value="INFORMATIQUE">INFORMATIQUE</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Notes (optionnel)</FormLabel>
                <Textarea value={terminateForm.notes} onChange={(e)=>setTerminateForm(p=>({...p, notes:e.target.value}))} />
              </FormControl>
              {terminateForm.reason === 'EXCLUSION' || terminateForm.reason === 'DEMISSION' ? (
                <FormControl isRequired>
                  <FormLabel>Procès-verbal (PDF/Image)</FormLabel>
                  <Input type="file" accept="application/pdf,image/*" onChange={(e)=>setTerminateForm(p=>({...p, pv: e.target.files?.[0]||null}))} />
                </FormControl>
              ) : null}
              {terminateForm.reason === 'DEMISSION' ? (
                <FormControl isRequired>
                  <FormLabel>Lettre de démission (PDF/Image)</FormLabel>
                  <Input type="file" accept="application/pdf,image/*" onChange={(e)=>setTerminateForm(p=>({...p, resignation: e.target.files?.[0]||null}))} />
                </FormControl>
              ) : null}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button variant="ghost" onClick={onTerminateClose}>Annuler</Button>
              <Button colorScheme="red" onClick={async()=>{
                try {
                  if (!terminateForm.reason) { toast({title:'Motif requis', status:'error'}); return; }
                  if (terminateForm.reason==='EXCLUSION' && !terminateForm.pv) { toast({title:'PV obligatoire', status:'error'}); return; }
                  if (terminateForm.reason==='DEMISSION' && (!terminateForm.pv || !terminateForm.resignation)) { toast({title:'PV et lettre requis', status:'error'}); return; }
                  const fd = new FormData();
                  fd.append('reason', terminateForm.reason);
                  if (terminateForm.notes) fd.append('notes', terminateForm.notes);
                  if (terminateForm.pv) fd.append('pv', terminateForm.pv);
                  if (terminateForm.resignation) fd.append('resignation', terminateForm.resignation);
                  const resp = await fetch(`${API_BASE_URL}/api/members/${memberData?.id}/terminate`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                    body: fd
                  });
                  const data = await resp.json();
                  if (!resp.ok) throw new Error(data?.error || 'Erreur de suppression');
                  toast({ title:'Adhésion supprimée', status:'success', duration:3000 });
                  onTerminateClose();
                  // recharger les données adhérent
                  fetchMemberData();
                } catch (e) {
                  toast({ title:'Erreur', description: e.message, status:'error' });
                }
              }}>Confirmer</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
