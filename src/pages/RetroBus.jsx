import React from "react";
import {
  SimpleGrid,
  VStack,
  HStack,
  Button,
  Icon,
  Text,
  Card,
  CardBody,
  Heading,
  useColorModeValue
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FiTool, FiTruck, FiPackage, FiLifeBuoy } from "react-icons/fi";
import PageLayout from "../components/Layout/PageLayout";
import ModernCard from "../components/Layout/ModernCard";

export default function RetroBus() {
  const accent = useColorModeValue("teal.600", "teal.300");

  const quickLinks = [
    {
      title: "Parc véhicules",
      description: "Consulter et gérer les véhicules",
      to: "/dashboard/vehicules",
      icon: FiTruck,
      color: "teal"
    },
    {
      title: "Stocks atelier",
      description: "Pièces, consommables et équipements",
      to: "/dashboard/stock-management",
      icon: FiPackage,
      color: "yellow"
    },
    {
      title: "Support technique",
      description: "Incidents et demandes d'amélioration",
      to: "/dashboard/support",
      icon: FiLifeBuoy,
      color: "cyan"
    }
  ];

  return (
    <PageLayout
      title="RétroBus"
      subtitle="Mécanique, véhicules et maintenance"
      headerVariant="card"
      bgGradient="linear(to-r, teal.500, blue.600)"
      titleSize="xl"
      titleWeight="700"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/home" },
        { label: "MyRBE", href: "/dashboard/myrbe" },
        { label: "RétroBus", href: "/dashboard/retrobus" }
      ]}
      headerActions={
        <HStack>
          <Button as={RouterLink} to="/dashboard/vehicules" size="sm" leftIcon={<FiTruck />}>Véhicules</Button>
          <Button as={RouterLink} to="/dashboard/stock-management" size="sm" leftIcon={<FiPackage />}>Stocks</Button>
        </HStack>
      }
    >
      <VStack spacing={8} align="stretch">
        {/* Liens rapides sous forme de cartes modernes */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {quickLinks.map((c) => (
            <ModernCard
              key={c.title}
              title={c.title}
              description={c.description}
              icon={c.icon}
              color={c.color}
              as={RouterLink}
              to={c.to}
            />
          ))}
        </SimpleGrid>

        {/* Placeholder d'aperçu rapide, sans logique pour l'instant */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card>
            <CardBody>
              <Heading size="sm" color={accent}>Véhicules actifs</Heading>
              <Text mt={2} color="gray.600">À venir</Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Heading size="sm" color={accent}>Opérations récentes</Heading>
              <Text mt={2} color="gray.600">À venir</Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Heading size="sm" color={accent}>Alertes maintenance</Heading>
              <Text mt={2} color="gray.600">À venir</Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Bloc d'intro simple */}
        <Card>
          <CardBody>
            <HStack spacing={3}>
              <Icon as={FiTool} color={accent} />
              <Heading size="sm">Espace atelier</Heading>
            </HStack>
            <Text mt={3} color="gray.600">
              Cet espace regroupera prochainement les fonctions de suivi de maintenance, planification,
              gestion des interventions et liens utiles pour l'équipe mécanique.
            </Text>
          </CardBody>
        </Card>
      </VStack>
    </PageLayout>
  );
}
