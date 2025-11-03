import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  useDisclosure,
  useToast,
  Checkbox,
  CheckboxGroup,
} from '@chakra-ui/react';
import PageLayout from '../components/Layout/PageLayout';
import { apiCall } from '../apiClient';

const PLANNING_TYPES = [
  { value: 'tournee', label: 'Tournée', color: 'orange' },
  { value: 'campagne', label: 'Campagne', color: 'purple' },
  { value: 'maintenance', label: 'Maintenance', color: 'red' },
  { value: 'evenement', label: 'Événement', color: 'green' },
  { value: 'livraison', label: 'Livraison', color: 'cyan' },
  { value: 'cotisation', label: 'Cotisation', color: 'yellow' },
];

export default function RetroPlanning() {
  const toast = useToast();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'tournee',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    vehicleId: '',
    driverId: '',
    members: [],
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await apiCall('/planning/events', { method: 'GET' });
      setEvents(response || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les événements', status: 'error', duration: 3 });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMembersChange = (selected) => {
    setFormData(prev => ({ ...prev, members: selected }));
  };

  const handleCreateEvent = async () => {
    if (!formData.title || !formData.startDate) {
      toast({ title: 'Erreur', description: 'Veuillez remplir les champs requis', status: 'error', duration: 3 });
      return;
    }

    try {
      const newEvent = await apiCall('/planning/events', {
        method: 'POST',
        body: {
          ...formData,
          startDate: new Date(`${formData.startDate}T${formData.startTime || '08:00'}`),
          endDate: formData.endDate ? new Date(`${formData.endDate}T${formData.endTime || '17:00'}`) : null,
        },
      });

      setEvents(prev => [...prev, newEvent]);
      toast({ title: 'Succès', description: 'Événement créé avec succès', status: 'success', duration: 3 });

      setFormData({
        title: '',
        description: '',
        type: 'tournee',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        location: '',
        vehicleId: '',
        driverId: '',
        members: [],
      });
      onCreateClose();
      loadEvents();
    } catch (error) {
      console.error('Erreur création:', error);
      toast({ title: 'Erreur', description: 'Impossible de créer l\'événement', status: 'error', duration: 3 });
    }
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    onDetailOpen();
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await apiCall(`/planning/events/${eventId}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(e => e.id !== eventId));
      toast({ title: 'Succès', description: 'Événement supprimé', status: 'success', duration: 3 });
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer l\'événement', status: 'error', duration: 3 });
    }
  };

  const getTypeColor = (type) => {
    const typeObj = PLANNING_TYPES.find(t => t.value === type);
    return typeObj?.color || 'gray';
  };

  const getTypeLabel = (type) => {
    const typeObj = PLANNING_TYPES.find(t => t.value === type);
    return typeObj?.label || type;
  };

  return (
    <PageLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading as="h1" size="lg">RétroPlanning</Heading>
            <Button colorScheme="blue" onClick={onCreateOpen}>Ajouter un événement</Button>
          </Flex>

          {events.length === 0 ? (
            <Card>
              <CardBody>
                <Text textAlign="center" color="gray.500">Aucun événement prévu pour le moment</Text>
              </CardBody>
            </Card>
          ) : (
            <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4}>
              {events.map(event => (
                <Card key={event.id} cursor="pointer" onClick={() => handleViewEvent(event)} _hover={{ shadow: 'md' }}>
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <Heading size="md">{event.title}</Heading>
                      <Text fontSize="sm" color={`${getTypeColor(event.type)}.600`}>{getTypeLabel(event.type)}</Text>
                      <Text fontSize="sm">{event.description}</Text>
                      <HStack spacing={4} mt={2}>
                        <Button size="sm" colorScheme="red" onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(event.id);
                        }}>Supprimer</Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          )}
        </VStack>

        {/* Modal Création */}
        <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Créer un nouvel événement</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Titre</FormLabel>
                  <Input name="title" value={formData.title} onChange={handleInputChange} placeholder="Titre de l'événement" />
                </FormControl>

                <FormControl>
                  <FormLabel>Type</FormLabel>
                  <Select name="type" value={formData.type} onChange={handleInputChange}>
                    {PLANNING_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Input name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" as="textarea" h="100px" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Date début</FormLabel>
                  <Input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} />
                </FormControl>

                <FormControl>
                  <FormLabel>Heure début</FormLabel>
                  <Input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} />
                </FormControl>

                <FormControl>
                  <FormLabel>Véhicule</FormLabel>
                  <Select name="vehicleId" value={formData.vehicleId} onChange={handleInputChange}>
                    <option value="">-- Sélectionner un véhicule --</option>
                    <option value="bus1">Bus 1</option>
                    <option value="bus2">Bus 2</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Chauffeur</FormLabel>
                  <Select name="driverId" value={formData.driverId} onChange={handleInputChange}>
                    <option value="">-- Sélectionner un chauffeur --</option>
                    <option value="driver1">Chauffeur 1</option>
                    <option value="driver2">Chauffeur 2</option>
                  </Select>
                </FormControl>

                <HStack justify="flex-end" w="full" pt={4}>
                  <Button variant="ghost" onClick={onCreateClose}>Annuler</Button>
                  <Button colorScheme="blue" onClick={handleCreateEvent}>Créer</Button>
                </HStack>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Modal Détails */}
        <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{selectedEvent?.title}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedEvent && (
                <VStack spacing={4} align="start">
                  <Box>
                    <Text fontWeight="bold">Type:</Text>
                    <Text>{getTypeLabel(selectedEvent.type)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Description:</Text>
                    <Text>{selectedEvent.description}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Date:</Text>
                    <Text>{new Date(selectedEvent.startDate).toLocaleDateString('fr-FR')}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Véhicule:</Text>
                    <Text>{selectedEvent.vehicleId || 'Non spécifié'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Chauffeur:</Text>
                    <Text>{selectedEvent.driverId || 'Non spécifié'}</Text>
                  </Box>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </PageLayout>
  );
}
