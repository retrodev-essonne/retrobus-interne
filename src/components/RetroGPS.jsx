import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Button, VStack, HStack, Box, Heading, Text, Badge,
  Select, Spinner, Center, useDisclosure, Icon, Divider, SimpleGrid, Stat,
  StatLabel, StatNumber, Checkbox, FormControl, FormLabel, RangeSlider,
  RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb
} from '@chakra-ui/react';
import { FiMapPin, FiTruck, FiClock, FiGauge, FiNavigation } from 'react-icons/fi';

/**
 * RetroGPS - Composant de suivi GPS avec modale interactive
 * Affiche les positions des véhicules et les trajets en considérant les gabarits
 * 
 * Features:
 * - Carte interactive (placeholder Leaflet-ready)
 * - Position des véhicules avec gabarit visuel
 * - Historique de trajet par véhicule
 * - Filtres par type de gabarit
 */
export default function RetroGPS() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const mapContainerRef = useRef(null);
  
  // État
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [speedRange, setSpeedRange] = useState([0, 100]);
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [showGabarits, setShowGabarits] = useState(true);

  // Mock data - À remplacer par une vraie API
  const mockVehicles = [
    {
      id: 1,
      parc: 'RT-001',
      type: 'Autobus',
      modele: 'Irisbus',
      position: { lat: 48.8566, lng: 2.3522 }, // Paris
      speed: 45,
      heading: 90,
      gabarit: { length: 12.5, width: 2.5, height: 3.8, capacity: 50 },
      lastUpdate: new Date(),
      status: 'EN_ROUTE',
      trajectory: [
        { lat: 48.8566, lng: 2.3522 },
        { lat: 48.8570, lng: 2.3530 },
        { lat: 48.8575, lng: 2.3545 },
      ]
    },
    {
      id: 2,
      parc: 'RT-002',
      type: 'Minibus',
      modele: 'Minibus',
      position: { lat: 48.8700, lng: 2.3600 },
      speed: 30,
      heading: 180,
      gabarit: { length: 8.5, width: 2.2, height: 3.2, capacity: 30 },
      lastUpdate: new Date(),
      status: 'PAUSED',
      trajectory: []
    },
    {
      id: 3,
      parc: 'RT-003',
      type: 'Autobus',
      modele: 'Sprinter',
      position: { lat: 48.8450, lng: 2.3400 },
      speed: 55,
      heading: 45,
      gabarit: { length: 10.5, width: 2.3, height: 3.5, capacity: 35 },
      lastUpdate: new Date(),
      status: 'EN_ROUTE',
      trajectory: []
    }
  ];

  // Charger les véhicules au montage
  useEffect(() => {
    // TODO: Remplacer par un vrai fetch API
    // const fetchVehicles = async () => {
    //   try {
    //     const res = await fetch(`${API_BASE}/vehicles/gps`, {
    //       headers: { 'Authorization': `Bearer ${token}` }
    //     });
    //     const data = await res.json();
    //     setVehicles(data);
    //   } catch (err) {
    //     console.error('Erreur chargement GPS:', err);
    //   }
    // };
    // fetchVehicles();

    // Mock data pour démo
    setVehicles(mockVehicles);
  }, []);

  // Initialiser Leaflet quand la modale s'ouvre
  useEffect(() => {
    if (isOpen && mapContainerRef.current) {
      // TODO: Initialiser la carte Leaflet ici
      // import L from 'leaflet';
      // const map = L.map(mapContainerRef.current).setView([48.8566, 2.3522], 12);
      // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    }
  }, [isOpen]);

  // Filtrer les véhicules selon sélection
  const filteredVehicles = selectedVehicles.length > 0 
    ? vehicles.filter(v => selectedVehicles.includes(v.id))
    : vehicles;

  const getStatusColor = (status) => {
    const map = {
      'EN_ROUTE': 'green',
      'PAUSED': 'orange',
      'STOPPED': 'red',
      'MAINTENANCE': 'gray'
    };
    return map[status] || 'blue';
  };

  const getStatusLabel = (status) => {
    const map = {
      'EN_ROUTE': '🚗 En route',
      'PAUSED': '⏸️ Pause',
      'STOPPED': '🛑 Arrêté',
      'MAINTENANCE': '🔧 Maintenance'
    };
    return map[status] || status;
  };

  // Calculer les dimensions du gabarit pour l'affichage
  const getGabaritScale = (length) => {
    // Petite échelle pour affichage: 1px par 0.1m
    return Math.max(20, Math.min(60, length * 5));
  };

  return (
    <>
      <Button
        onClick={onOpen}
        leftIcon={<FiMapPin />}
        colorScheme="purple"
        size="md"
        w="100%"
      >
        🗺️ Ouvrir RétroGPS
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" display="flex" flexDirection="column">
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={FiMapPin} color="purple.500" boxSize={6} />
              <Box>
                <Heading size="lg">RétroGPS - Suivi en temps réel</Heading>
                <Text fontSize="sm" color="gray.500">
                  Localisation et traçage des véhicules RétroBus
                </Text>
              </Box>
            </HStack>
          </ModalHeader>

          <ModalCloseButton />

          <ModalBody overflow="auto" flex={1} pb={4}>
            <VStack spacing={6} align="stretch">
              {/* Carte interactive - Placeholder */}
              <Box
                ref={mapContainerRef}
                borderRadius="lg"
                borderWidth={2}
                borderColor="gray.300"
                bg="gray.100"
                height="400px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="relative"
              >
                <VStack spacing={3} textAlign="center" color="gray.500">
                  <Icon as={FiMapPin} boxSize={12} />
                  <Heading size="md">Carte interactive Leaflet</Heading>
                  <Text fontSize="sm">
                    Affichage des {filteredVehicles.length} véhicule(s) sélectionné(s)
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    • Zoom/Pan avec la souris<br/>
                    • Clic sur marqueur pour détails<br/>
                    • Lignes = trajets historiques
                  </Text>
                </VStack>
              </Box>

              <Divider />

              {/* Filtres et contrôles */}
              <VStack spacing={4} align="stretch">
                <Heading size="md">⚙️ Filtres et options</Heading>

                {/* Sélection des véhicules */}
                <FormControl>
                  <FormLabel>Véhicules à afficher</FormLabel>
                  <HStack spacing={2} flexWrap="wrap">
                    {vehicles.map(v => (
                      <Checkbox
                        key={v.id}
                        isChecked={selectedVehicles.includes(v.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVehicles([...selectedVehicles, v.id]);
                          } else {
                            setSelectedVehicles(selectedVehicles.filter(id => id !== v.id));
                          }
                        }}
                      >
                        {v.parc} ({v.type})
                      </Checkbox>
                    ))}
                  </HStack>
                </FormControl>

                {/* Options d'affichage */}
                <HStack spacing={4}>
                  <Checkbox
                    isChecked={showTrajectory}
                    onChange={(e) => setShowTrajectory(e.target.checked)}
                  >
                    Afficher trajets historiques
                  </Checkbox>
                  <Checkbox
                    isChecked={showGabarits}
                    onChange={(e) => setShowGabarits(e.target.checked)}
                  >
                    Considérer gabarits des bus
                  </Checkbox>
                </HStack>

                {/* Filtre de vitesse */}
                <FormControl>
                  <FormLabel>Filtrer par vitesse (km/h): {speedRange[0]} - {speedRange[1]}</FormLabel>
                  <RangeSlider
                    min={0}
                    max={100}
                    step={5}
                    value={speedRange}
                    onChange={setSpeedRange}
                  >
                    <RangeSliderTrack>
                      <RangeSliderFilledTrack />
                    </RangeSliderTrack>
                    <RangeSliderThumb index={0} />
                    <RangeSliderThumb index={1} />
                  </RangeSlider>
                </FormControl>
              </VStack>

              <Divider />

              {/* Liste des véhicules avec gabarits */}
              <VStack spacing={3} align="stretch">
                <Heading size="md">📍 Véhicules sur la carte</Heading>
                
                {filteredVehicles.length === 0 ? (
                  <Center p={6} bg="gray.50" borderRadius="md">
                    <Text color="gray.500">Aucun véhicule sélectionné</Text>
                  </Center>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    {filteredVehicles.map(vehicle => (
                      <Box
                        key={vehicle.id}
                        p={4}
                        borderRadius="lg"
                        borderWidth={2}
                        borderColor={getStatusColor(vehicle.status) + '.300'}
                        bg={getStatusColor(vehicle.status) + '.50'}
                      >
                        <VStack align="start" spacing={2}>
                          {/* En-tête avec gabarit visuel */}
                          <HStack justify="space-between" w="100%">
                            <HStack>
                              <Box
                                w={getGabaritScale(vehicle.gabarit.length) + 'px'}
                                h="30px"
                                bg={getStatusColor(vehicle.status)}
                                borderRadius="md"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                color="white"
                                fontSize="xs"
                                fontWeight="bold"
                              >
                                {vehicle.parc}
                              </Box>
                              <Box>
                                <Text fontWeight="bold">{vehicle.parc}</Text>
                                <Text fontSize="sm" color="gray.600">
                                  {vehicle.type} {vehicle.modele}
                                </Text>
                              </Box>
                            </HStack>
                            <Badge colorScheme={getStatusColor(vehicle.status)}>
                              {getStatusLabel(vehicle.status)}
                            </Badge>
                          </HStack>

                          {/* Informations de position et vitesse */}
                          <SimpleGrid columns={2} w="100%" fontSize="sm" gap={2}>
                            <Stat>
                              <StatLabel>Position</StatLabel>
                              <StatNumber fontSize="xs">
                                {vehicle.position.lat.toFixed(4)}, {vehicle.position.lng.toFixed(4)}
                              </StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Vitesse</StatLabel>
                              <StatNumber fontSize="xs" color={getStatusColor(vehicle.status)}>
                                {vehicle.speed} km/h
                              </StatNumber>
                            </Stat>
                          </SimpleGrid>

                          {/* Caractéristiques du gabarit */}
                          <Box w="100%" fontSize="xs" p={2} bg="white" borderRadius="md">
                            <Text fontWeight="bold" mb={1}>📐 Gabarit:</Text>
                            <Text>
                              L: {vehicle.gabarit.length}m | 
                              l: {vehicle.gabarit.width}m | 
                              H: {vehicle.gabarit.height}m
                            </Text>
                            <Text>👥 Capacité: {vehicle.gabarit.capacity} places</Text>
                          </Box>

                          {/* Historique trajet */}
                          {vehicle.trajectory.length > 0 && (
                            <Box w="100%" fontSize="xs" p={2} bg="white" borderRadius="md">
                              <Text fontWeight="bold">🛤️ Trajet ({vehicle.trajectory.length} points)</Text>
                            </Box>
                          )}
                        </VStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}
              </VStack>

              {/* Légende gabarits */}
              {showGabarits && (
                <Box p={4} bg="blue.50" borderRadius="lg" borderLeft="4px solid" borderColor="blue.500">
                  <Heading size="sm" mb={2}>💡 Légende des gabarits</Heading>
                  <VStack align="start" fontSize="sm" spacing={1}>
                    <Text>• Les barres représentent la longueur relative du véhicule</Text>
                    <Text>• Couleur = statut (vert=route, orange=pause, rouge=arrêt)</Text>
                    <Text>• Les trajets tiennent compte des dimensions pour les trajets routiers</Text>
                    <Text>• Passages serrés = alerte si gabarit trop grand</Text>
                  </VStack>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Text fontSize="xs" color="gray.500">
                ⏱️ Mise à jour: {new Date().toLocaleTimeString('fr-FR')}
              </Text>
              <Button colorScheme="gray" variant="outline" onClick={onClose}>
                Fermer
              </Button>
              <Button colorScheme="purple" onClick={() => {
                // Rafraîchir les données
                setVehicles(mockVehicles);
              }}>
                🔄 Rafraîchir
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
