import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Spinner,
  VStack,
  HStack,
  Text,
  Divider,
  Alert,
  AlertIcon,
  Grid,
  Center
} from '@chakra-ui/react';
import { apiClient } from '../api/config';
import { ROLE_PERMISSIONS, getAllRoles } from '../lib/permissions';

/**
 * PermissionsManager - Gestion des rôles et permissions
 * Affiche les rôles disponibles du système et essaie de charger les utilisateurs
 */
export default function PermissionsManager() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const rolesInfo = getAllRoles();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      let loadedUsers = [];

      // Essai 1: /api/admin/users
      try {
        const usersRes = await apiClient.get('/api/admin/users');
        if (usersRes?.users && Array.isArray(usersRes.users)) {
          loadedUsers = usersRes.users;
          console.log('✅ Users loaded from /api/admin/users');
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        console.warn('⚠️ Trying fallback endpoints...');

        // Essai 2: /api/site-users
        try {
          const siteUsersRes = await apiClient.get('/api/site-users');
          const siteUsers = Array.isArray(siteUsersRes?.users) ? siteUsersRes.users : (Array.isArray(siteUsersRes) ? siteUsersRes : []);
          if (siteUsers.length > 0) {
            loadedUsers = siteUsers;
            console.log('✅ Users loaded from /api/site-users');
          } else {
            throw new Error('No users');
          }
        } catch (err2) {
          // Essai 3: /api/members
          try {
            const membersRes = await apiClient.get('/api/members');
            const members = Array.isArray(membersRes?.members) ? membersRes.members : (Array.isArray(membersRes) ? membersRes : []);
            
            if (members.length > 0) {
              loadedUsers = members.map(m => ({
                id: m.id || m.memberNumber,
                email: m.email,
                firstName: m.firstName || m.prenom || 'N/A',
                lastName: m.lastName || m.nom || 'N/A',
                role: m.role || 'MEMBER',
                isActive: m.isActive !== false,
                isMember: true
              }));
              console.log('✅ Members loaded from /api/members');
            }
          } catch (err3) {
            console.warn('⚠️ No user data available');
          }
        }
      }

      setUsers(loadedUsers);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <Card>
        <CardBody>
          <Center py={12}>
            <VStack spacing={4}>
              <Spinner size="lg" color="blue.500" />
              <Text color="gray.600">Chargement des données...</Text>
            </VStack>
          </Center>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack spacing={8} align="stretch">
      {/* Section Rôles Disponibles */}
      <Card>
        <CardHeader>
          <Heading size="lg">📋 Rôles Disponibles</Heading>
        </CardHeader>
        <Divider />
        <CardBody>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Rôles définis dans le système centralisé de permissions.
          </Text>
          <Grid templateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap={4}>
            {rolesInfo.map(role => (
              <Box 
                key={role.code} 
                p={4} 
                border="1px" 
                borderColor="gray.200" 
                borderRadius="md" 
                bg="gray.50"
                _hover={{ shadow: 'md' }}
                transition="all 0.2s"
              >
                <HStack mb={3}>
                  <Badge colorScheme={role.color || 'gray'} fontSize="md">
                    {role.code}
                  </Badge>
                </HStack>
                <Text fontWeight="bold" fontSize="sm">{role.label}</Text>
                <Text fontSize="xs" color="gray.600" mt={2}>
                  {ROLE_PERMISSIONS[role.code]?.permissions 
                    ? `${Object.keys(ROLE_PERMISSIONS[role.code].permissions).length} permissions`
                    : 'Aucune permission'
                  }
                </Text>
              </Box>
            ))}
          </Grid>
        </CardBody>
      </Card>

      {/* Section Utilisateurs */}
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="lg">👥 Utilisateurs</Heading>
            {users.length > 0 && <Badge colorScheme="blue">{users.length}</Badge>}
          </HStack>
        </CardHeader>
        <Divider />
        <CardBody>
          {users.length === 0 ? (
            <Alert
              status="info"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              height="150px"
              borderRadius="md"
            >
              <AlertIcon boxSize="40px" mr={0} />
              <Heading mt={4} size="md">Aucun utilisateur chargé</Heading>
              <Text mt={2} fontSize="sm">
                Les données utilisateurs ne sont pas disponibles en ce moment.
              </Text>
            </Alert>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="striped">
                <Thead bg="gray.100">
                  <Tr>
                    <Th>Nom</Th>
                    <Th>Email</Th>
                    <Th>Type</Th>
                    <Th>Rôle</Th>
                    <Th>Statut</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {users.map((user) => (
                    <Tr key={user.id || user.email}>
                      <Td fontWeight="medium">
                        {user.firstName} {user.lastName}
                      </Td>
                      <Td fontSize="sm">{user.email}</Td>
                      <Td>
                        <Badge colorScheme={user.isMember ? 'cyan' : 'gray'}>
                          {user.isMember ? 'Adhérent' : 'Site'}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme="purple">{user.role || 'MEMBER'}</Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={user.isActive !== false ? 'green' : 'red'}>
                          {user.isActive !== false ? 'Actif' : 'Inactif'}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Info */}
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold" fontSize="sm">💡 Système de Rôles Centralisé</Text>
          <Text fontSize="xs" color="gray.700" mt={1}>
            Les rôles sont gérés via <code>src/lib/permissions.js</code>. 
            Toutes les vérifications de permissions utilisent ce système unifié.
          </Text>
        </Box>
      </Alert>
    </VStack>
  );
}
