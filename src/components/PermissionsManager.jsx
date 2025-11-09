/**
 * PermissionsManager.jsx - Gestion des rôles et permissions utilisateurs
 * 
 * Interface simple et opérationnelle pour:
 * - Voir tous les utilisateurs
 * - Changer leur rôle principal
 * - Ajouter/éditer permissions temporaires ou permanentes
 * - Visualiser les permissions actives et expirées
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  useToast,
  Spinner,
  VStack,
  HStack,
  Text,
  Select,
  FormControl,
  FormLabel,
  Input,
  Checkbox,
  CheckboxGroup,
  Divider,
  IconButton,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, AddIcon } from '@chakra-ui/icons';
import { apiClient } from '../api/config';

export default function PermissionsManager() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isAddPermOpen, onOpen: onAddPermOpen, onClose: onAddPermClose } = useDisclosure();

  // État
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [resources, setResources] = useState({});
  const [roles, setRoles] = useState({});

  // Formulaire
  const [formRole, setFormRole] = useState('MEMBER');
  const [permForm, setPermForm] = useState({
    resource: '',
    actions: [],
    expiresAt: '',
    reason: ''
  });
  const [editingPerm, setEditingPerm] = useState(null);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Charger les ressources et rôles
      const res = await apiClient.get('/api/permissions/resources');
      if (res && res.resources) {
        setResources(res.resources);
        setRoles(res.roleDefaults || {});
      }

      // Charger les utilisateurs
      const usersRes = await apiClient.get('/api/admin/users');
      if (usersRes && usersRes.users) {
        setUsers(usersRes.users);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ouvrir modal pour voir/éditer user
  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setFormRole(user.role);
    onOpen();
  };

  // Changer rôle
  const handleChangeRole = async () => {
    if (!selectedUser || formRole === selectedUser.role) return;

    try {
      await apiClient.put(`/api/admin/users/${selectedUser.id}/role`, {
        role: formRole
      });

      setUsers(users.map(u =>
        u.id === selectedUser.id ? { ...u, role: formRole } : u
      ));

      setSelectedUser({ ...selectedUser, role: formRole });

      toast({
        title: 'Succès',
        description: `Rôle changé en ${formRole}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Erreur changement rôle:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de changer le rôle',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Ouvrir form pour ajouter permission
  const handleAddPermission = () => {
    setEditingPerm(null);
    setPermForm({
      resource: '',
      actions: [],
      expiresAt: '',
      reason: ''
    });
    onAddPermOpen();
  };

  // Ouvrir form pour éditer permission
  const handleEditPermission = (perm) => {
    setEditingPerm(perm);
    setPermForm({
      resource: perm.resource,
      actions: perm.actions ? JSON.parse(perm.actions) : [],
      expiresAt: perm.expiresAt ? new Date(perm.expiresAt).toISOString().split('T')[0] : '',
      reason: perm.reason || ''
    });
    onAddPermOpen();
  };

  // Sauvegarder permission
  const handleSavePermission = async () => {
    if (!permForm.resource || permForm.actions.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Ressource et actions requises',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      const data = {
        resource: permForm.resource,
        actions: permForm.actions,
        reason: permForm.reason
      };

      if (permForm.expiresAt) {
        data.expiresAt = new Date(permForm.expiresAt).toISOString();
      }

      if (editingPerm) {
        // Éditer
        await apiClient.put(
          `/api/admin/users/${selectedUser.id}/permissions/${editingPerm.id}`,
          data
        );
        toast({ title: 'Succès', description: 'Permission mise à jour', status: 'success' });
      } else {
        // Ajouter
        await apiClient.post(
          `/api/admin/users/${selectedUser.id}/permissions`,
          data
        );
        toast({ title: 'Succès', description: 'Permission ajoutée', status: 'success' });
      }

      // Recharger les permissions du user
      const res = await apiClient.get(`/api/admin/users/${selectedUser.id}/permissions`);
      setSelectedUser(prev => ({
        ...prev,
        ...res.user,
        permissions: res.permissions
      }));

      onAddPermClose();
    } catch (error) {
      console.error('Erreur sauvegarde permission:', error);
      toast({
        title: 'Erreur',
        description: error.response?.data?.error || 'Erreur lors de la sauvegarde',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Supprimer permission
  const handleDeletePermission = async (permId) => {
    if (!window.confirm('Êtes-vous sûr?')) return;

    try {
      await apiClient.delete(
        `/api/admin/users/${selectedUser.id}/permissions/${permId}`
      );

      // Recharger les permissions
      const res = await apiClient.get(`/api/admin/users/${selectedUser.id}/permissions`);
      setSelectedUser(prev => ({
        ...prev,
        ...res.user,
        permissions: res.permissions
      }));

      toast({
        title: 'Succès',
        description: 'Permission supprimée',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Badges
  const getRoleBadge = (role) => {
    const colors = {
      ADMIN: 'red',
      MANAGER: 'orange',
      OPERATOR: 'blue',
      MEMBER: 'green',
      CLIENT: 'purple',
      GUEST: 'gray'
    };
    return <Badge colorScheme={colors[role] || 'gray'}>{role}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <Spinner />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card width="100%">
      <CardHeader>
        <Heading size="lg">⚙️ Gestion des Rôles & Permissions</Heading>
      </CardHeader>

      <Divider />

      <CardBody>
        {/* Vue d'ensemble rôles */}
        <Alert status="info" mb={6} borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Rôles disponibles:</Text>
            <Text fontSize="sm">
              ADMIN (accès total) • MANAGER (gestion+finance) • OPERATOR (RétroBus) •
              MEMBER (basique) • CLIENT (RétroDemande) • GUEST (lecture seule)
            </Text>
          </Box>
        </Alert>

        {/* Tableau utilisateurs */}
        <Box overflowX="auto">
          <Table size="sm" variant="striped">
            <Thead>
              <Tr>
                <Th>Nom</Th>
                <Th>Email</Th>
                <Th>Rôle</Th>
                <Th>Permissions</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td fontWeight="medium">
                    {user.firstName} {user.lastName}
                  </Td>
                  <Td fontSize="sm">{user.email}</Td>
                  <Td>{getRoleBadge(user.role)}</Td>
                  <Td>
                    {user.permissions?.length > 0 ? (
                      <Badge colorScheme="blue">{user.permissions.length} custom</Badge>
                    ) : (
                      <Text fontSize="xs" color="gray.500">-</Text>
                    )}
                  </Td>
                  <Td>
                    <Badge colorScheme={user.isActive ? 'green' : 'red'}>
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      onClick={() => handleSelectUser(user)}
                    >
                      Gérer
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </CardBody>

      {/* MODAL DÉTAILS USER */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Gestion: {selectedUser?.firstName} {selectedUser?.lastName}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedUser && (
              <VStack spacing={6} align="stretch">
                {/* Rôle principal */}
                <Box p={4} bg="gray.50" borderRadius="md">
                  <HStack spacing={4} align="end">
                    <FormControl>
                      <FormLabel>Rôle principal</FormLabel>
                      <Select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value)}
                      >
                        {Object.keys(roles).map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      colorScheme="blue"
                      onClick={handleChangeRole}
                      isDisabled={formRole === selectedUser.role}
                    >
                      Sauvegarder
                    </Button>
                  </HStack>
                </Box>

                {/* Permissions personnalisées */}
                <Box>
                  <HStack justify="space-between" mb={3}>
                    <Heading size="sm">Permissions personnalisées</Heading>
                    <Button
                      size="sm"
                      colorScheme="green"
                      leftIcon={<AddIcon />}
                      onClick={handleAddPermission}
                    >
                      Ajouter
                    </Button>
                  </HStack>

                  {/* Permanentes */}
                  {selectedUser.permissions?.permanent?.length > 0 && (
                    <Box mb={4}>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>
                        Permanentes:
                      </Text>
                      <Stack spacing={2}>
                        {selectedUser.permissions.permanent.map((perm) => (
                          <HStack
                            key={perm.id}
                            p={3}
                            bg="green.50"
                            borderRadius="md"
                            justify="space-between"
                          >
                            <Box>
                              <Text fontWeight="bold">{perm.resource}</Text>
                              <Text fontSize="sm">
                                {JSON.parse(perm.actions).join(', ')}
                              </Text>
                            </Box>
                            <HStack spacing={1}>
                              <IconButton
                                icon={<EditIcon />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditPermission(perm)}
                              />
                              <IconButton
                                icon={<DeleteIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDeletePermission(perm.id)}
                              />
                            </HStack>
                          </HStack>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Temporaires */}
                  {selectedUser.permissions?.temporary?.length > 0 && (
                    <Box mb={4}>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>
                        Temporaires (actives):
                      </Text>
                      <Stack spacing={2}>
                        {selectedUser.permissions.temporary.map((perm) => (
                          <HStack
                            key={perm.id}
                            p={3}
                            bg="yellow.50"
                            borderRadius="md"
                            justify="space-between"
                          >
                            <Box>
                              <Text fontWeight="bold">{perm.resource}</Text>
                              <Text fontSize="sm">
                                {JSON.parse(perm.actions).join(', ')}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                Expire: {new Date(perm.expiresAt).toLocaleDateString()}
                              </Text>
                            </Box>
                            <HStack spacing={1}>
                              <IconButton
                                icon={<EditIcon />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditPermission(perm)}
                              />
                              <IconButton
                                icon={<DeleteIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDeletePermission(perm.id)}
                              />
                            </HStack>
                          </HStack>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Expirées */}
                  {selectedUser.permissions?.expired?.length > 0 && (
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>
                        Expirées:
                      </Text>
                      <Stack spacing={2}>
                        {selectedUser.permissions.expired.map((perm) => (
                          <HStack
                            key={perm.id}
                            p={3}
                            bg="gray.100"
                            borderRadius="md"
                            justify="space-between"
                            opacity={0.6}
                          >
                            <Box>
                              <Text fontWeight="bold">{perm.resource}</Text>
                              <Text fontSize="sm">
                                {JSON.parse(perm.actions).join(', ')}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                Expiré: {new Date(perm.expiresAt).toLocaleDateString()}
                              </Text>
                            </Box>
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeletePermission(perm.id)}
                            />
                          </HStack>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {(!selectedUser.permissions ||
                    (selectedUser.permissions.permanent.length === 0 &&
                      selectedUser.permissions.temporary.length === 0)) && (
                    <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                      Aucune permission personnalisée
                    </Text>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* MODAL AJOUTER/ÉDITER PERMISSION */}
      <Modal isOpen={isAddPermOpen} onClose={onAddPermClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingPerm ? 'Éditer permission' : 'Ajouter permission'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Ressource</FormLabel>
                <Select
                  value={permForm.resource}
                  onChange={(e) => setPermForm({ ...permForm, resource: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {Object.entries(resources).map(([key, value]) => (
                    <option key={key} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Actions</FormLabel>
                <CheckboxGroup
                  value={permForm.actions}
                  onChange={(values) =>
                    setPermForm({ ...permForm, actions: values })
                  }
                >
                  <Stack>
                    <Checkbox value="READ">READ (Lecture)</Checkbox>
                    <Checkbox value="CREATE">CREATE (Création)</Checkbox>
                    <Checkbox value="UPDATE">UPDATE (Modification)</Checkbox>
                    <Checkbox value="DELETE">DELETE (Suppression)</Checkbox>
                    <Checkbox value="APPROVE">APPROVE (Approbation)</Checkbox>
                  </Stack>
                </CheckboxGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Date d'expiration (optionnel)</FormLabel>
                <Input
                  type="date"
                  value={permForm.expiresAt}
                  onChange={(e) =>
                    setPermForm({ ...permForm, expiresAt: e.target.value })
                  }
                />
                <Text fontSize="xs" color="gray.600" mt={1}>
                  Laissez vide pour une permission permanente
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Raison (optionnel)</FormLabel>
                <Input
                  placeholder="Ex: Accès temporaire pour projet X"
                  value={permForm.reason}
                  onChange={(e) =>
                    setPermForm({ ...permForm, reason: e.target.value })
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outline" onClick={onAddPermClose}>
                Annuler
              </Button>
              <Button colorScheme="blue" onClick={handleSavePermission}>
                {editingPerm ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}
