import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber, Card, CardBody,
  Tabs, TabList, TabPanels, Tab, TabPanel, useToast, Spinner, HStack, VStack,
  Badge, Tag, TagLabel, TagLeftIcon, Button, Divider, Table, Thead, Tbody, Tr, Th, Td,
  Icon, Progress, Alert, AlertIcon, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, Slider, SliderTrack, SliderFilledTrack, SliderThumb, FormLabel
} from "@chakra-ui/react";
import { FiClock, FiAlertTriangle, FiTool, FiFileText, FiInfo, FiEdit, FiSliders } from "react-icons/fi";
import { apiClient } from "../api/config";
import CaracteristiquesEditor from '../components/vehicle/CaracteristiquesEditor.jsx';
import { useNavigate } from "react-router-dom";

function EtatBadge({ etat }) {
  const colorMap = {
    disponible: "green",
    en_panne: "red",
    maintenance: "orange",
    Service: "green",
    Préservé: "blue",
    "A VENIR": "gray",
    Restauration: "orange",
  };
  return <Badge colorScheme={colorMap[etat] || "purple"}>{etat || "—"}</Badge>;
}

// Fonction utilitaire pour mettre à jour les caractéristiques d'un véhicule
async function updateVehicleCaracs(parc, caracs, toast) {
  try {
    await apiClient.put(`/vehicles/${encodeURIComponent(parc)}`, {
      caracteristiques: JSON.stringify(caracs)
    });
    toast({ status: 'success', title: 'Caractéristiques mises à jour' });
  } catch (e) {
    toast({ status: 'error', title: 'Erreur lors de la mise à jour', description: e.message });
  }
}

export default function RetroBus() {
  const toast = useToast();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusByParc, setStatusByParc] = useState({}); // { [parc]: { active: bool, startedAt, conducteur } }
  const [reportsData, setReportsData] = useState({}); // { [parc]: Report[] }
  const [usagesData, setUsagesData] = useState({}); // { [parc]: Usage[] }
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingUsages, setLoadingUsages] = useState(false);
  // Modal édition technique
  const [editTechOpen, setEditTechOpen] = useState(false);
  const [editTechVehicle, setEditTechVehicle] = useState(null);
  const [editTechCaracs, setEditTechCaracs] = useState([]);
  const [editTechGasoil, setEditTechGasoil] = useState(0);
  const [editTechSaving, setEditTechSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const list = await apiClient.get('/vehicles');
        if (!mounted) return;
        setVehicles(Array.isArray(list) ? list : (list?.vehicles || []));
      } catch (e) {
        toast({ status: 'error', title: "Chargement des véhicules", description: e.message || 'Impossible de charger la liste' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [toast]);

  // Charger l'état de pointage (actif) pour chaque véhicule — lazy/background
  useEffect(() => {
    if (!vehicles || vehicles.length === 0) return;
    let cancelled = false;
    const loadStatuses = async () => {
      // limiter à 24 en premier rendu pour éviter l'explosion de requêtes
      const slice = vehicles.slice(0, 24);
      await Promise.all(
        slice.map(async (v) => {
          const parc = v.parc || v.id || v.slug;
          if (!parc) return;
          try {
            const usages = await apiClient.get(`/vehicles/${encodeURIComponent(parc)}/usages`);
            if (cancelled) return;
            const active = Array.isArray(usages) ? usages.find(u => !u.endedAt) : null;
            setStatusByParc(prev => ({
              ...prev,
              [parc]: active ? { active: true, startedAt: active.startedAt, conducteur: active.conducteur } : { active: false }
            }));
          } catch {
            // silencieux: on laisse le statut vide
          }
        })
      );
    };
    loadStatuses();
    return () => { cancelled = true; };
  }, [vehicles]);

  // Charger les rapports pour tous les véhicules
  const loadAllReports = async () => {
    if (!vehicles || vehicles.length === 0) return;
    setLoadingReports(true);
    try {
      const reportsMap = {};
      await Promise.all(
        vehicles.map(async (v) => {
          const parc = v.parc || v.id || v.slug;
          if (!parc) return;
          try {
            const reports = await apiClient.get(`/vehicles/${encodeURIComponent(parc)}/reports`);
            reportsMap[parc] = Array.isArray(reports) ? reports : [];
          } catch (e) {
            reportsMap[parc] = [];
          }
        })
      );
      setReportsData(reportsMap);
    } catch (error) {
      console.error('Erreur chargement rapports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  // Charger l'historique des usages pour tous les véhicules
  const loadAllUsages = async () => {
    if (!vehicles || vehicles.length === 0) return;
    setLoadingUsages(true);
    try {
      const usagesMap = {};
      await Promise.all(
        vehicles.map(async (v) => {
          const parc = v.parc || v.id || v.slug;
          if (!parc) return;
          try {
            const usages = await apiClient.get(`/vehicles/${encodeURIComponent(parc)}/usages`);
            usagesMap[parc] = Array.isArray(usages) ? usages : [];
          } catch (e) {
            usagesMap[parc] = [];
          }
        })
      );
      setUsagesData(usagesMap);
    } catch (error) {
      console.error('Erreur chargement usages:', error);
    } finally {
      setLoadingUsages(false);
    }
  };

  const vehicleCards = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return null;
    return (
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4} mt={4}>
        {vehicles.map((v) => {
          const parc = v.parc || v.id || v.slug;
          const status = statusByParc[parc] || {};
          // Parser les caractéristiques si elles existent
          let carac = [];
          let gasoil = 0;
          try {
            if (v.caracteristiques) {
              carac = JSON.parse(v.caracteristiques);
              const found = carac.find(c => c.label === 'Niveau gasoil');
              if (found) gasoil = Number(found.value) || 0;
            }
          } catch (e) {
            console.warn('Erreur parsing caractéristiques:', e);
          }
          const hasCarac = Array.isArray(carac) && carac.length > 0;
          return (
            <Card key={parc} variant="outline" _hover={{ shadow: 'md' }}>
              <CardBody>
                <VStack align="start" spacing={3}>
                  <HStack justify="space-between" w="full">
                    <VStack align="start" spacing={0}>
                      <Heading size="md">{parc}</Heading>
                      <Text fontSize="sm" color="gray.600">{[v.marque, v.modele].filter(Boolean).join(' ') || v.titre || 'Véhicule'}</Text>
                    </VStack>
                    <EtatBadge etat={v.etat || v.statut} />
                  </HStack>
                  {/* Indicateur informations techniques */}
                  {hasCarac ? (
                    <HStack w="full">
                      <Icon as={FiInfo} color="green.500" />
                      <Text fontSize="sm" color="green.600">{carac.length} info(s) technique(s)</Text>
                    </HStack>
                  ) : (
                    <HStack w="full">
                      <Icon as={FiAlertTriangle} color="orange.500" />
                      <Text fontSize="sm" color="orange.600">Aucune info technique</Text>
                    </HStack>
                  )}
                  {/* Curseur gasoil */}
                  <HStack w="full" spacing={2}>
                    <Icon as={FiSliders} color="blue.500" />
                    <Text fontSize="sm" color="blue.600">Gasoil: {gasoil}%</Text>
                    <Button size="xs" variant="outline" onClick={() => {
                      setEditTechVehicle(v);
                      setEditTechCaracs(carac);
                      setEditTechGasoil(gasoil);
                      setEditTechOpen(true);
                    }}>Infos techniques</Button>
                  </HStack>
                  <HStack spacing={2} flexWrap="wrap">
                    {status.active ? (
                      <Tag colorScheme="purple" size="sm">
                        <TagLeftIcon as={FiClock} />
                        <TagLabel>Pointage en cours</TagLabel>
                      </Tag>
                    ) : (
                      <Tag size="sm" colorScheme="gray" variant="subtle">
                        <TagLabel>Disponible</TagLabel>
                      </Tag>
                    )}
                    {(v.etat === 'en_panne' || v.statut === 'en_panne') && (
                      <Tag colorScheme="red" size="sm">
                        <TagLeftIcon as={FiAlertTriangle} />
                        <TagLabel>Panne</TagLabel>
                      </Tag>
                    )}
                  </HStack>
                  <Divider />
                  <HStack w="full" spacing={2}>
                    <Button 
                      size="sm" 
                      leftIcon={<FiEdit />}
                      onClick={() => navigate(`/dashboard/vehicules/${encodeURIComponent(parc)}`)}
                      flex={1}
                    >
                      Éditer
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => navigate(`/mobile/v/${encodeURIComponent(parc)}`)}
                      flex={1}
                    >
                      Pointage
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          );
        })}
      </SimpleGrid>
    );
  }, [vehicles, navigate, statusByParc]);

  return (
    <Box p={6}>
      <Heading size="lg">RétroBus</Heading>
      <Text mt={2} opacity={0.85}>Gestion des véhicules, historique, entretien, situation et pointages.</Text>

      <Tabs mt={6} variant="enclosed">
        {/* Modal édition technique véhicule */}
        <Modal isOpen={editTechOpen} onClose={() => setEditTechOpen(false)} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Informations techniques : {editTechVehicle?.parc}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                <FormLabel>Niveau actuel du gasoil (%)</FormLabel>
                <Slider min={0} max={100} step={1} value={editTechGasoil} onChange={setEditTechGasoil}>
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <Text fontSize="sm">{editTechGasoil}%</Text>
                <CaracteristiquesEditor value={editTechCaracs} onChange={setEditTechCaracs} />
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} onClick={() => setEditTechOpen(false)} variant="ghost">Annuler</Button>
              <Button colorScheme="blue" isLoading={editTechSaving} onClick={async () => {
                setEditTechSaving(true);
                // Mettre à jour ou ajouter le niveau de gasoil dans les caracs
                let nextCaracs = Array.isArray(editTechCaracs) ? [...editTechCaracs] : [];
                const idx = nextCaracs.findIndex(c => c.label === 'Niveau gasoil');
                if (idx >= 0) {
                  nextCaracs[idx].value = String(editTechGasoil);
                } else {
                  nextCaracs.push({ label: 'Niveau gasoil', value: String(editTechGasoil) });
                }
                await updateVehicleCaracs(editTechVehicle.parc, nextCaracs, toast);
                setEditTechSaving(false);
                setEditTechOpen(false);
                // Recharger la liste des véhicules
                setLoading(true);
                const list = await apiClient.get('/vehicles');
                setVehicles(Array.isArray(list) ? list : (list?.vehicles || []));
              }}>Enregistrer</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <TabList overflowX="auto">
          <Tab>Véhicules</Tab>
          <Tab>Historique</Tab>
          <Tab>Entretien</Tab>
          <Tab>Situation administrative</Tab>
          <Tab>Pointages</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            {loading ? (
              <HStack spacing={3} pt={6}>
                <Spinner />
                <Text>Chargement des véhicules…</Text>
              </HStack>
            ) : (
              <>
                <Alert status="info" mb={4}>
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="600">💡 Astuce - Informations techniques</Text>
                    <Text fontSize="sm">
                      Cliquez sur "Infos techniques" pour éditer les caractéristiques et le niveau de gasoil de chaque véhicule.
                    </Text>
                  </VStack>
                </Alert>
                {vehicleCards || <Text mt={4}>Aucun véhicule pour le moment.</Text>}
              </>
            )}
          </TabPanel>

          <TabPanel>
            <VStack align="start" spacing={4} py={2}>
              <HStack justify="space-between" w="full">
                <HStack>
                  <FiFileText />
                  <Heading size="sm">Historique des usages</Heading>
                </HStack>
                <Button size="sm" onClick={loadAllUsages} isLoading={loadingUsages}>
                  Charger
                </Button>
              </HStack>
              
              {loadingUsages ? (
                <HStack spacing={3}>
                  <Spinner size="sm" />
                  <Text>Chargement de l'historique...</Text>
                </HStack>
              ) : Object.keys(usagesData).length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  Cliquez sur "Charger" pour afficher l'historique des usages
                </Alert>
              ) : (
                <VStack align="stretch" w="full" spacing={4}>
                  {vehicles.map((v) => {
                    const parc = v.parc || v.id || v.slug;
                    const usages = usagesData[parc] || [];
                    const completedUsages = usages.filter(u => u.endedAt);
                    
                    if (completedUsages.length === 0) return null;
                    
                    return (
                      <Card key={parc} variant="outline">
                        <CardBody>
                          <Heading size="sm" mb={3}>{parc} - {completedUsages.length} usage(s)</Heading>
                          <Table size="sm" variant="simple">
                            <Thead>
                              <Tr>
                                <Th>Début</Th>
                                <Th>Fin</Th>
                                <Th>Conducteur</Th>
                                <Th>Note</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {completedUsages.slice(0, 5).map((usage) => (
                                <Tr key={usage.id}>
                                  <Td>{new Date(usage.startedAt).toLocaleDateString('fr-FR')}</Td>
                                  <Td>{usage.endedAt ? new Date(usage.endedAt).toLocaleDateString('fr-FR') : '-'}</Td>
                                  <Td>{usage.conducteur || '-'}</Td>
                                  <Td fontSize="sm" color="gray.600">{usage.note || '-'}</Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                          {completedUsages.length > 5 && (
                            <Text mt={2} fontSize="sm" color="gray.500">
                              ... et {completedUsages.length - 5} autres usage(s)
                            </Text>
                          )}
                        </CardBody>
                      </Card>
                    );
                  })}
                </VStack>
              )}
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack align="start" spacing={4} py={2}>
              <HStack justify="space-between" w="full">
                <HStack>
                  <FiTool />
                  <Heading size="sm">Rapports d'entretien</Heading>
                </HStack>
                <Button size="sm" onClick={loadAllReports} isLoading={loadingReports}>
                  Charger
                </Button>
              </HStack>
              
              {loadingReports ? (
                <HStack spacing={3}>
                  <Spinner size="sm" />
                  <Text>Chargement des rapports...</Text>
                </HStack>
              ) : Object.keys(reportsData).length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  Cliquez sur "Charger" pour afficher les rapports d'entretien
                </Alert>
              ) : (
                <VStack align="stretch" w="full" spacing={4}>
                  {vehicles.map((v) => {
                    const parc = v.parc || v.id || v.slug;
                    const reports = reportsData[parc] || [];
                    
                    if (reports.length === 0) return null;
                    
                    return (
                      <Card key={parc} variant="outline">
                        <CardBody>
                          <Heading size="sm" mb={3}>{parc} - {reports.length} rapport(s)</Heading>
                          <VStack align="stretch" spacing={2}>
                            {reports.slice(0, 5).map((report) => (
                              <Box key={report.id} p={3} bg="gray.50" borderRadius="md">
                                <Text fontWeight="600" fontSize="sm">
                                  {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                                </Text>
                                <Text fontSize="sm" color="gray.700" mt={1}>
                                  {report.description || 'Aucune description'}
                                </Text>
                              </Box>
                            ))}
                          </VStack>
                          {reports.length > 5 && (
                            <Text mt={2} fontSize="sm" color="gray.500">
                              ... et {reports.length - 5} autre(s) rapport(s)
                            </Text>
                          )}
                        </CardBody>
                      </Card>
                    );
                  })}
                </VStack>
              )}
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack align="start" spacing={3} py={2}>
              <HStack>
                <FiAlertTriangle />
                <Heading size="sm">Situation administrative</Heading>
              </HStack>
              <Alert status="warning">
                <AlertIcon />
                Cette section sera développée prochainement pour gérer : documents, assurances, contrôle technique, conformité.
              </Alert>
              <Text opacity={0.8}>
                En attendant, vous pouvez ajouter ces informations dans les notes de chaque véhicule via la page d'édition.
              </Text>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack align="start" spacing={4} py={2}>
              <HStack>
                <FiClock />
                <Heading size="sm">Pointages actifs</Heading>
              </HStack>
              
              {vehicles.filter(v => {
                const parc = v.parc || v.id || v.slug;
                return statusByParc[parc]?.active;
              }).length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  Aucun pointage en cours actuellement
                </Alert>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} w="full">
                  {vehicles.map((v) => {
                    const parc = v.parc || v.id || v.slug;
                    const status = statusByParc[parc];
                    
                    if (!status?.active) return null;
                    
                    const duration = status.startedAt 
                      ? Math.floor((Date.now() - new Date(status.startedAt).getTime()) / (1000 * 60))
                      : 0;
                    
                    return (
                      <Card key={parc} variant="outline" borderColor="purple.300">
                        <CardBody>
                          <VStack align="start" spacing={2}>
                            <Heading size="sm">{parc}</Heading>
                            <HStack>
                              <Icon as={FiClock} color="purple.500" />
                              <Text fontSize="sm">
                                En cours depuis {duration} min
                              </Text>
                            </HStack>
                            {status.conducteur && (
                              <Text fontSize="sm" color="gray.600">
                                Conducteur: {status.conducteur}
                              </Text>
                            )}
                            <Button 
                              size="sm" 
                              colorScheme="purple"
                              onClick={() => navigate(`/mobile/v/${encodeURIComponent(parc)}`)}
                            >
                              Voir le pointage
                            </Button>
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
