import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, VStack, HStack, Heading, Text, Table, Thead, Tbody, Tr, Th, Td,
  Badge, IconButton, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, FormControl, FormLabel, Input, Textarea, Select,
  useDisclosure, useToast, Spinner, Center, Alert, AlertIcon, Tabs, TabList,
  Tab, TabPanels, TabPanel, Card, CardBody, CardHeader, SimpleGrid, Divider,
  InputGroup, InputLeftElement, useColorModeValue, Switch, Checkbox
} from '@chakra-ui/react';
import {
  FiPlus, FiTrash2, FiCalendar, FiRefreshCw, FiSearch, FiChevronLeft, FiChevronRight,
  FiEye, FiCheck, FiArrowRight
} from 'react-icons/fi';
import PageLayout from '../components/Layout/PageLayout';
import { useUser } from '../context/UserContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Helpers
const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

const formatDate = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
};

const formatDateTime = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString('fr-FR', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  } catch {
    return '';
  }
};

const getEventTypeColor = (type) => {
  const map = {
    CAMPAIGN: 'purple',
    TOURNEE: 'orange',
    MAINTENANCE: 'red',
    EVENEMENT: 'green',
    LIVRAISON: 'blue',
    COTISATION: 'yellow',
  };
  return map[type] || 'gray';
};

const getEventTypeLabel = (type) => {
  const map = {
    CAMPAIGN: '📧 Campagne',
    TOURNEE: '🚌 Tournée',
    MAINTENANCE: '🔧 Maintenance',
    EVENEMENT: '👥 Événement',
    LIVRAISON: '📦 Livraison',
    COTISATION: '💰 Cotisation',
  };
  return map[type] || type;
};

// Main Component
export default function RetroPlanning() {
  const { token } = useUser();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [events, setEvents] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [formStep, setFormStep] = useState(0);

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();

  // Form complete
  const [formData, setFormData] = useState({
    title: '',
    type: 'TOURNEE',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    vehicleId: '',
    driverId: '',
    assignmentNotes: '',
    isShared: false,
    memberIds: [],
    shareMessage: '',
  });

  // Fetch
  useEffect(() => {
    if (token) fetchAllData();
  }, [token]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [evRes, camRes, assignRes, vehRes, drvRes, memRes] = await Promise.all([
        fetch(`${API_BASE}/api/planning/events`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/newsletter/campaigns`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/api/planning/assignments`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/api/vehicles`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/api/drivers`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/api/members`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ ok: false })),
      ]);

      if (evRes.ok) {
        const data = await evRes.json();
        setEvents(Array.isArray(data) ? data : data.events || []);
      }
      if (camRes.ok) {
        const data = await camRes.json();
        setCampaigns(Array.isArray(data) ? data : []);
      }
      if (assignRes.ok) {
        const data = await assignRes.json();
        setAssignments(Array.isArray(data) ? data : []);
      }
      if (vehRes.ok) {
        const data = await vehRes.json();
        setVehicles(Array.isArray(data) ? data : []);
      }
      if (drvRes.ok) {
        const data = await drvRes.json();
        setDrivers(Array.isArray(data) ? data : []);
      }
      if (memRes.ok) {
        const data = await memRes.json();
        setMembers(Array.isArray(data) ? data : data.members || []);
      }
    } catch (e) {
      console.error('Fetch error:', e);
      toast({ status: 'warning', title: 'Données partielles', duration: 3000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    let result = [...events, ...campaigns.map(c => ({
      id: c.id,
      title: c.title,
      type: 'CAMPAIGN',
      date: c.scheduledAt || c.createdAt,
      description: c.subject,
    }))];

    if (filterType !== 'ALL') result = result.filter(e => e.type === filterType);
    if (searchTerm) result = result.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return result.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events, campaigns, filterType, searchTerm]);

  // Calendar
  const calendarDays = useMemo(() => {
    const firstDay = getFirstDayOfMonth(currentDate);
    const daysInMonth = getDaysInMonth(currentDate);
    const daysInPrevMonth = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, daysInPrevMonth - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i) });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false, date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i) });
    }
    return days;
  }, [currentDate]);

  const getEventsForDate = (date) => {
    return filteredEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getAssignmentForEvent = (eventId) => assignments.find(a => a.eventId === eventId);
  const getVehicleName = (vehicleId) => {
    const v = vehicles.find(v => v.id === vehicleId || v._id === vehicleId);
    return v ? (v.immatriculation || v.name || 'Inconnu') : '—';
  };
  const getDriverName = (driverId) => {
    const d = drivers.find(d => d.id === driverId || d._id === driverId || d.matricule === driverId);
    return d ? (d.prenom ? `${d.prenom} ${d.nom || ''}`.trim() : d.name || 'Inconnu') : '—';
  };
  const getMemberName = (memberId) => {
    const m = members.find(m => m.id === memberId || m._id === memberId);
    return m ? `${m.prenom} ${m.nom || ''}`.trim() : 'Inconnu';
  };

  // Save
  const handleSaveEvent = async () => {
    if (!formData.title || !formData.date) {
      toast({ status: 'error', title: 'Erreur', description: 'Remplissez le titre et la date' });
      return;
    }

    try {
      const eventPayload = {
        title: formData.title,
        type: formData.type,
        description: formData.description,
        date: new Date(formData.date).toISOString(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        isShared: formData.isShared,
      };

      const evRes = await fetch(`${API_BASE}/api/planning/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(eventPayload),
      });

      if (!evRes.ok) throw new Error('Event creation failed');
      const event = await evRes.json();

      if (formData.vehicleId && formData.driverId) {
        await fetch(`${API_BASE}/api/planning/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ eventId: event.id, vehicleId: formData.vehicleId, driverId: formData.driverId, notes: formData.assignmentNotes }),
        });
      }

      if (formData.isShared && formData.memberIds.length > 0) {
        await fetch(`${API_BASE}/api/planning/share-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ eventId: event.id, memberIds: formData.memberIds, message: formData.shareMessage }),
        });
      }

      toast({ status: 'success', title: 'Événement créé !', duration: 3000, isClosable: true });
      setFormData({ title: '', type: 'TOURNEE', description: '', date: '', startTime: '', endTime: '', vehicleId: '', driverId: '', assignmentNotes: '', isShared: false, memberIds: [], shareMessage: '' });
      setFormStep(0);
      onCreateClose();
      await fetchAllData();
    } catch (e) {
      toast({ status: 'error', title: 'Erreur', description: e.message });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Êtes-vous sûr ?')) return;
    try {
      await fetch(`${API_BASE}/api/planning/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      toast({ status: 'success', title: 'Événement supprimé' });
      await fetchAllData();
    } catch (e) {
      toast({ status: 'error', title: 'Erreur', description: e.message });
    }
  };

  if (loading) return <Center p={6}><Spinner size="xl" /></Center>;

  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <PageLayout 
      title="📅 RétroPlanning" 
      subtitle="Calendrier centralisé : événements, affectations, présences"
      headerVariant="card"
      bgGradient="linear(to-r, orange.500, red.600)"
      titleSize="xl"
      titleWeight="700"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/home" },
        { label: "MyRBE", href: "/dashboard/myrbe" },
        { label: "RétroPlanning", href: "/dashboard/retroplanning" }
      ]}
    >
      <Box>
        <VStack spacing={6} align="stretch">
          {/* Quick Actions */}
          <HStack spacing={3} mb={4}>
            <Button 
              leftIcon={<FiPlus />} 
              colorScheme="orange" 
              size="lg"
              onClick={onCreateOpen}
              fontWeight="700"
            >
              + Nouvel événement
            </Button>
            <Button 
              leftIcon={<FiRefreshCw />} 
              variant="outline"
              onClick={fetchAllData}
            >
              Actualiser
            </Button>
          </HStack>

          {/* Filters */}
          <Card bg={cardBg} borderRadius="lg">
            <CardBody>
              <HStack spacing={4} wrap="wrap">
                <InputGroup maxW="300px">
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray.300" />
                  </InputLeftElement>
                  <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </InputGroup>
                <Select maxW="200px" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="ALL">Tous les types</option>
                  <option value="CAMPAIGN">📧 Campagnes</option>
                  <option value="TOURNEE">🚌 Tournées</option>
                  <option value="MAINTENANCE">🔧 Maintenance</option>
                  <option value="EVENEMENT">👥 Événements</option>
                  <option value="LIVRAISON">📦 Livraisons</option>
                  <option value="COTISATION">💰 Cotisations</option>
                </Select>
              </HStack>
            </CardBody>
          </Card>

          {/* Tabs */}
          <Tabs colorScheme="orange" variant="enclosed" onChange={(i) => setViewMode(['month', 'list'][i])}>
            <TabList>
              <Tab>📅 Calendrier</Tab>
              <Tab>📋 Liste</Tab>
            </TabList>

            <TabPanels>
              {/* Month view */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" align="center">
                    <IconButton icon={<FiChevronLeft />} onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} variant="ghost" />
                    <Heading size="md" textAlign="center" flex="1" textTransform="capitalize">{monthName}</Heading>
                    <IconButton icon={<FiChevronRight />} onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} variant="ghost" />
                  </HStack>

                  <Box overflowX="auto">
                    <Table variant="simple" size="sm" borderWidth="1px" borderRadius="md">
                      <Thead bg={cardBg}>
                        <Tr>
                          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                            <Th key={day} textAlign="center" py={3}>{day}</Th>
                          ))}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIdx) => (
                          <Tr key={weekIdx}>
                            {calendarDays.slice(weekIdx * 7, (weekIdx + 1) * 7).map((dayObj, dayIdx) => {
                              const dayEvents = getEventsForDate(dayObj.date);
                              return (
                                <Td key={dayIdx} p={2} borderWidth="1px" minH="120px" bg={!dayObj.isCurrentMonth ? 'gray.50' : 'white'} verticalAlign="top">
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="bold" color={!dayObj.isCurrentMonth ? 'gray.400' : 'black'} fontSize="sm">{dayObj.day}</Text>
                                    {dayEvents.slice(0, 2).map((event, i) => (
                                      <Box key={i} w="100%" p={1} bg={`${getEventTypeColor(event.type)}.100`} borderRadius="sm" fontSize="xs" cursor="pointer" onClick={() => { setSelectedEvent(event); onDetailOpen(); }} _hover={{ bg: `${getEventTypeColor(event.type)}.200` }}>
                                        <Text isTruncated>{event.title}</Text>
                                      </Box>
                                    ))}
                                    {dayEvents.length > 2 && <Text fontSize="xs" color="gray.500">+{dayEvents.length - 2}</Text>}
                                  </VStack>
                                </Td>
                              );
                            })}
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </VStack>
              </TabPanel>

              {/* List view */}
              <TabPanel>
                <VStack spacing={3} align="stretch">
                  {filteredEvents.length === 0 ? (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      Aucun événement
                    </Alert>
                  ) : (
                    filteredEvents.map((event) => {
                      const assignment = getAssignmentForEvent(event.id);
                      return (
                        <Card key={event.id} bg={cardBg} borderLeft="4px" borderLeftColor={`${getEventTypeColor(event.type)}.500`}>
                          <CardBody>
                            <HStack justify="space-between" mb={2}>
                              <HStack spacing={2}>
                                <Badge colorScheme={getEventTypeColor(event.type)}>{getEventTypeLabel(event.type)}</Badge>
                                <Heading size="sm">{event.title}</Heading>
                              </HStack>
                              <HStack>
                                <IconButton icon={<FiEye />} size="sm" variant="ghost" onClick={() => { setSelectedEvent(event); onDetailOpen(); }} />
                                <IconButton icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => handleDeleteEvent(event.id)} />
                              </HStack>
                            </HStack>

                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} mb={2}>
                              <Box>
                                <Text fontSize="xs" color="gray.500">Date</Text>
                                <Text fontWeight="500">{formatDate(event.date)}</Text>
                              </Box>
                              <Box>
                                <Text fontSize="xs" color="gray.500">Véhicule / Chauffeur</Text>
                                <Text fontWeight="500">{assignment ? `${getVehicleName(assignment.vehicleId)} - ${getDriverName(assignment.driverId)}` : '—'}</Text>
                              </Box>
                            </SimpleGrid>

                            {event.isShared && (
                              <Box mb={2} p={2} bg="purple.50" borderRadius="md">
                                <HStack mb={1}>
                                  <Badge colorScheme="purple" size="sm">🔓 Partagé</Badge>
                                  <Text fontSize="xs" color="gray.600">{event.attendees ? Object.values(event.attendees).filter(a => a.confirmed).length : 0} confirmés</Text>
                                </HStack>
                              </Box>
                            )}

                            {event.description && <Text fontSize="sm" color="gray.600">{event.description}</Text>}
                          </CardBody>
                        </Card>
                      );
                    })
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>

        {/* Modal: Create Event - Formulaire complet en 4 étapes */}
        <Modal isOpen={isCreateOpen} onClose={() => { onCreateClose(); setFormStep(0); }} size="2xl">
          <ModalOverlay />
          <ModalContent bg={cardBg}>
            <ModalHeader borderBottomWidth="1px">
              <VStack align="start" spacing={1}>
                <Heading size="md">✨ Nouvel événement</Heading>
                <Text fontSize="xs" color="gray.500">Étape {formStep + 1} sur 4</Text>
              </VStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
              {formStep === 0 && (
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Titre</FormLabel>
                    <Input placeholder="Ex: Tournée février" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Type d'événement</FormLabel>
                    <Select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                      <option value="CAMPAIGN">📧 Campagne</option>
                      <option value="TOURNEE">🚌 Tournée</option>
                      <option value="MAINTENANCE">🔧 Maintenance</option>
                      <option value="EVENEMENT">👥 Événement</option>
                      <option value="LIVRAISON">📦 Livraison</option>
                      <option value="COTISATION">💰 Cotisation</option>
                    </Select>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Date</FormLabel>
                    <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                  </FormControl>
                  <HStack spacing={2} w="100%">
                    <FormControl>
                      <FormLabel>Heure début</FormLabel>
                      <Input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Heure fin</FormLabel>
                      <Input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                    </FormControl>
                  </HStack>
                  <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Textarea placeholder="Notes..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                  </FormControl>
                </VStack>
              )}

              {formStep === 1 && (
                <VStack spacing={4}>
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">Affectez optionnellement un bus et un chauffeur</Text>
                  </Alert>
                  <FormControl>
                    <FormLabel>🚌 Véhicule (Bus)</FormLabel>
                    <Select placeholder="Aucun" value={formData.vehicleId} onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}>
                      {vehicles.map(v => (
                        <option key={v.id || v._id} value={v.id || v._id}>{v.immatriculation} - {v.marque}</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>👤 Chauffeur</FormLabel>
                    <Select placeholder="Aucun" value={formData.driverId} onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}>
                      {drivers.map(d => (
                        <option key={d.id || d._id} value={d.id || d._id}>{d.prenom} {d.nom || ''}</option>
                      ))}
                    </Select>
                  </FormControl>
                  {formData.vehicleId && formData.driverId && (
                    <FormControl>
                      <FormLabel>Notes d'affectation</FormLabel>
                      <Textarea placeholder="Conditions particulières..." value={formData.assignmentNotes} onChange={(e) => setFormData({ ...formData, assignmentNotes: e.target.value })} rows={2} />
                    </FormControl>
                  )}
                </VStack>
              )}

              {formStep === 2 && (
                <VStack spacing={4}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb={0}>🔓 Partager avec les membres ?</FormLabel>
                    <Switch ml={3} isChecked={formData.isShared} onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })} />
                  </FormControl>

                  {formData.isShared && (
                    <>
                      <Alert status="success" borderRadius="md">
                        <AlertIcon />
                        <Text fontSize="sm">Les membres recevront un email pour confirmer leur présence</Text>
                      </Alert>

                      <FormControl isRequired>
                        <FormLabel>📧 Sélectionner les membres</FormLabel>
                        <Box borderWidth="1px" borderRadius="md" p={3} maxH="300px" overflowY="auto">
                          <VStack align="start" spacing={2}>
                            {members.length === 0 ? (
                              <Text color="gray.500" fontSize="sm">Aucun membre</Text>
                            ) : (
                              members.map(member => (
                                <HStack key={member.id || member._id} w="100%">
                                  <Checkbox isChecked={formData.memberIds.includes(member.id || member._id)} onChange={(e) => {
                                    const mId = member.id || member._id;
                                    setFormData({
                                      ...formData,
                                      memberIds: e.target.checked ? [...formData.memberIds, mId] : formData.memberIds.filter(id => id !== mId)
                                    });
                                  }} />
                                  <Box flex="1">
                                    <Text fontWeight="500" fontSize="sm">{member.prenom} {member.nom || ''}</Text>
                                    <Text fontSize="xs" color="gray.500">{member.email}</Text>
                                  </Box>
                                </HStack>
                              ))
                            )}
                          </VStack>
                        </Box>
                      </FormControl>

                      <FormControl>
                        <FormLabel>💌 Message personnalisé (optionnel)</FormLabel>
                        <Textarea placeholder="Msg optionnel..." value={formData.shareMessage} onChange={(e) => setFormData({ ...formData, shareMessage: e.target.value })} rows={2} />
                      </FormControl>
                    </>
                  )}
                </VStack>
              )}

              {formStep === 3 && (
                <VStack spacing={4} align="stretch">
                  <Heading size="sm">✅ Résumé</Heading>
                  <Divider />
                  <Box>
                    <Text fontSize="xs" color="gray.500" mb={1}>Événement</Text>
                    <HStack spacing={2}>
                      <Badge colorScheme={getEventTypeColor(formData.type)}>{getEventTypeLabel(formData.type)}</Badge>
                      <Text fontWeight="700">{formData.title}</Text>
                    </HStack>
                  </Box>
                  <SimpleGrid columns={2} gap={3}>
                    <Box>
                      <Text fontSize="xs" color="gray.500">Date</Text>
                      <Text fontWeight="500">{formatDate(formData.date)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">Horaires</Text>
                      <Text fontWeight="500">{formData.startTime || '—'} à {formData.endTime || '—'}</Text>
                    </Box>
                  </SimpleGrid>
                  {formData.vehicleId && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={2}>Affectation</Text>
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Text fontSize="sm">🚌</Text>
                            <Text fontWeight="500">{getVehicleName(formData.vehicleId)}</Text>
                          </HStack>
                          <HStack>
                            <Text fontSize="sm">👤</Text>
                            <Text fontWeight="500">{getDriverName(formData.driverId)}</Text>
                          </HStack>
                        </VStack>
                      </Box>
                    </>
                  )}
                  {formData.isShared && formData.memberIds.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={2}>📧 Invitations ({formData.memberIds.length})</Text>
                        <VStack align="start" spacing={1} fontSize="sm">
                          {formData.memberIds.slice(0, 3).map(mId => (
                            <Text key={mId}>• {getMemberName(mId)}</Text>
                          ))}
                          {formData.memberIds.length > 3 && <Text color="gray.500">+{formData.memberIds.length - 3} autres</Text>}
                        </VStack>
                      </Box>
                    </>
                  )}
                </VStack>
              )}
            </ModalBody>

            <ModalFooter borderTopWidth="1px">
              <HStack spacing={2}>
                <Button variant="ghost" onClick={() => { if (formStep > 0) setFormStep(formStep - 1); else onCreateClose(); }}>
                  {formStep === 0 ? 'Annuler' : '← Précédent'}
                </Button>
                {formStep < 3 && (
                  <Button colorScheme="orange" onClick={() => setFormStep(formStep + 1)} isDisabled={formStep === 0 && (!formData.title || !formData.date)} rightIcon={<FiArrowRight />}>
                    Suivant
                  </Button>
                )}
                {formStep === 3 && (
                  <Button colorScheme="green" onClick={handleSaveEvent} leftIcon={<FiCheck />}>
                    Créer l'événement
                  </Button>
                )}
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal: Event Details */}
        {selectedEvent && (
          <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
            <ModalOverlay />
            <ModalContent bg={cardBg}>
              <ModalHeader>
                <HStack spacing={2}>
                  <Badge colorScheme={getEventTypeColor(selectedEvent.type)}>{getEventTypeLabel(selectedEvent.type)}</Badge>
                  <Heading size="md">{selectedEvent.title}</Heading>
                </HStack>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={3} align="stretch">
                  <Box>
                    <Text fontSize="xs" color="gray.500" fontWeight="600">Date & Horaires</Text>
                    <Text fontWeight="500">{formatDateTime(selectedEvent.date)}</Text>
                  </Box>
                  {selectedEvent.description && (
                    <Box>
                      <Text fontSize="xs" color="gray.500" fontWeight="600">Description</Text>
                      <Text>{selectedEvent.description}</Text>
                    </Box>
                  )}
                  {(() => {
                    const assignment = getAssignmentForEvent(selectedEvent.id);
                    if (!assignment) return null;
                    return (
                      <>
                        <Divider />
                        <Heading size="sm">Affectation</Heading>
                        <SimpleGrid columns={2} gap={3}>
                          <Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="600">Véhicule</Text>
                            <Text fontWeight="500">{getVehicleName(assignment.vehicleId)}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="600">Chauffeur</Text>
                            <Text fontWeight="500">{getDriverName(assignment.driverId)}</Text>
                          </Box>
                        </SimpleGrid>
                        {assignment.notes && (
                          <Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="600">Notes</Text>
                            <Text>{assignment.notes}</Text>
                          </Box>
                        )}
                      </>
                    );
                  })()}
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button onClick={onDetailClose}>Fermer</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </Box>
    </PageLayout>
  );
}
