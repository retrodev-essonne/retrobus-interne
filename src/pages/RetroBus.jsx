import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber, Card, CardBody,
  Tabs, TabList, TabPanels, Tab, TabPanel, useToast, Spinner, HStack, VStack,
  Badge, Tag, TagLabel, TagLeftIcon, Button
} from "@chakra-ui/react";
import { FiClock, FiAlertTriangle, FiTool, FiFileText } from "react-icons/fi";
import { apiClient } from "../api/config";
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

export default function RetroBus() {
  const toast = useToast();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusByParc, setStatusByParc] = useState({}); // { [parc]: { active: bool, startedAt, conducteur } }

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

  const vehicleCards = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return null;
    return (
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4} mt={4}>
        {vehicles.map((v) => {
          const parc = v.parc || v.id || v.slug;
          const status = statusByParc[parc] || {};
          return (
            <Card key={parc} variant="outline" _hover={{ shadow: 'md' }}>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <HStack justify="space-between" w="full">
                    <Heading size="md">{parc}</Heading>
                    <EtatBadge etat={v.etat || v.statut} />
                  </HStack>
                  <Text opacity={0.85}>{[v.marque, v.modele].filter(Boolean).join(' ') || v.titre || 'Véhicule'}</Text>
                  <HStack spacing={2} mt={2} flexWrap="wrap">
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
                  <HStack pt={3}>
                    <Button size="sm" onClick={() => navigate(`/dashboard/vehicules/${encodeURIComponent(parc)}`)}>Ouvrir</Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/mobile/v/${encodeURIComponent(parc)}`)}>Pointage mobile</Button>
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
              vehicleCards || <Text mt={4}>Aucun véhicule pour le moment.</Text>
            )}
          </TabPanel>

          <TabPanel>
            <VStack align="start" spacing={3} py={2}>
              <HStack>
                <FiFileText />
                <Heading size="sm">Historique</Heading>
              </HStack>
              <Text opacity={0.8}>À venir: intégration des rapports et événements de chaque véhicule.</Text>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack align="start" spacing={3} py={2}>
              <HStack>
                <FiTool />
                <Heading size="sm">Entretien</Heading>
              </HStack>
              <Text opacity={0.8}>À venir: interventions planifiées, pièces et opérations.</Text>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack align="start" spacing={3} py={2}>
              <HStack>
                <FiAlertTriangle />
                <Heading size="sm">Situation administrative</Heading>
              </HStack>
              <Text opacity={0.8}>À venir: documents, assurances, contrôle technique, conformité.</Text>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack align="start" spacing={3} py={2}>
              <HStack>
                <FiClock />
                <Heading size="sm">Pointages</Heading>
              </HStack>
              <Text opacity={0.8}>À venir: tableau des pointages récents et en cours.</Text>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
