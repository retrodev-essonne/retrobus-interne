import { Box, Text, VStack, Heading } from "@chakra-ui/react";
import { useUser } from "../context/UserContext";
import { useVehiclePermissions } from "../hooks/useVehiclePermissions";

/**
 * Composant de protection pour restreindre la création de véhicules
 * Utilise le système de permissions granulaire basé sur les rôles
 * 
 * ✅ Rôles autorisés: ADMIN, PRESIDENT, VICE_PRESIDENT, VOLUNTEER
 * ❌ Rôles refusés: DRIVER, MEMBER, PRESTATAIRE, etc.
 */
export default function RequireCreator({ children }) {
  const { matricule } = useUser();
  const { canCreateVehicle, getAccessDeniedMessage, currentRole } = useVehiclePermissions();

  // Si l'utilisateur peut créer, afficher le contenu
  if (canCreateVehicle()) {
    return children;
  }

  // Sinon, afficher le message d'erreur
  return (
    <Box p={8} maxW="600px" mx="auto" mt={8}>
      <VStack spacing={4} align="stretch" textAlign="center">
        <Heading size="lg" color="red.600">🔒 Accès refusé</Heading>
        <Box bg="red.50" p={4} borderRadius="md" borderLeft="4px" borderColor="red.500">
          <Text fontWeight="bold" mb={2}>{getAccessDeniedMessage('create')}</Text>
          <Text fontSize="sm" color="gray.700">
            Vous devez avoir le rôle <strong>Administrateur</strong>, <strong>Président</strong>, 
            <strong> Vice-Président</strong> ou <strong>Bénévole</strong> pour ajouter un véhicule.
          </Text>
        </Box>
        <Text fontSize="xs" color="gray.500">
          Rôle actuel: <strong>{currentRole || 'inconnu'}</strong>
        </Text>
      </VStack>
    </Box>
  );
}
