import React, { useState } from 'react';
import {
  VStack, HStack, Tabs, TabList, Tab, TabPanels, TabPanel,
  Heading, Box, useColorModeValue
} from '@chakra-ui/react';
import { FiCalendar, FiMapPin, FiClock } from 'react-icons/fi';
import PageLayout from '../components/Layout/PageLayout';
import EventsManagement from './EventsManagement';

/**
 * EventsHub - Page centralisée pour la gestion des événements
 * Organise les différentes vues sous forme d'onglets :
 * - Gestion des événements (création, liste, détails)
 * - Planification/Calendrier (à venir)
 * - RétroGPS (suivi GPS en direct) - feature future
 */
export default function EventsHub() {
  const [tabIndex, setTabIndex] = useState(0);
  const tabsBg = useColorModeValue('gray.50', 'gray.900');

  return (
    <PageLayout
      title="Gestion des Événements"
      subtitle="Créez, planifiez et suivez les tournées RétroBus"
      headerVariant="card"
      bgGradient="linear(to-r, green.500, teal.600)"
      titleSize="xl"
      titleWeight="700"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/home" },
        { label: "MyRBE", href: "/dashboard/myrbe" },
        { label: "Événements", href: "/dashboard/events-management" }
      ]}
    >
      <Box>
        <Tabs 
          index={tabIndex} 
          onChange={setTabIndex}
          variant="enclosed"
          colorScheme="green"
        >
          <TabList borderBottom="2px solid" borderColor="green.200">
            <Tab _selected={{ color: 'white', bg: 'green.500' }}>
              <HStack spacing={2}>
                <FiCalendar />
                <span>Gestion des événements</span>
              </HStack>
            </Tab>
            
            <Tab _selected={{ color: 'white', bg: 'teal.500' }}>
              <HStack spacing={2}>
                <FiClock />
                <span>Planification</span>
              </HStack>
            </Tab>
            
            <Tab _selected={{ color: 'white', bg: 'purple.500' }} isDisabled opacity={0.6}>
              <HStack spacing={2}>
                <FiMapPin />
                <span>RétroGPS (À venir)</span>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Onglet 1: Gestion des événements */}
            <TabPanel p={0} pt={6}>
              <EventsManagement />
            </TabPanel>

            {/* Onglet 2: Planification / Calendrier */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box p={6} bg="teal.50" borderRadius="lg" borderLeft="4px solid" borderColor="teal.500">
                  <Heading size="md" mb={2}>📅 Vue Calendrier</Heading>
                  <p>Bientôt disponible : calendrier interactif de vos tournées et événements.</p>
                </Box>
              </VStack>
            </TabPanel>

            {/* Onglet 3: RétroGPS (placeholder) */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box p={6} bg="purple.50" borderRadius="lg" borderLeft="4px solid" borderColor="purple.500">
                  <Heading size="md" mb={2}>🗺️ RétroGPS - Suivi en direct</Heading>
                  <p>Fonctionnalité en développement : suivi GPS des véhicules en temps réel, traçage des tournées et statistiques de localisation.</p>
                  <Box mt={4} fontSize="sm" color="gray.600">
                    <p>✓ Carte interactive</p>
                    <p>✓ Position des véhicules en live</p>
                    <p>✓ Historique des trajets</p>
                    <p>✓ Statistiques géographiques</p>
                  </Box>
                </Box>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </PageLayout>
  );
}
