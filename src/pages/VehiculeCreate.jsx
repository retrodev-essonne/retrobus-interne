/* Page de création d'un nouveau véhicule */
import React, { useState } from 'react';
import {
  Box, Heading, VStack, Input, Textarea, Button, SimpleGrid, Text, useToast,
  FormControl, FormLabel, Switch, HStack, Divider, Card, CardBody
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import GalleryManager from '../components/vehicle/GalleryManager.jsx';
import CaracteristiquesEditor from '../components/vehicle/CaracteristiquesEditor.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function VehiculeCreate() {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState({
    parc: '',
    modele: '',
    marque: '',
    subtitle: '',
    etat: 'disponible',
    immat: '',
    energie: '',
    miseEnCirculation: '',
    description: '',
    history: '',
    caracteristiques: [],
    gallery: [],
    isPublic: false
  });
  const [saving, setSaving] = useState(false);

  const updateField = (f, v) => setData(d => ({ ...d, [f]: v }));

  const save = async () => {
    if (!data.parc.trim()) {
      toast({ status: 'error', title: 'Parc requis' });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          parc: data.parc.trim(),
          modele: data.modele,
          marque: data.marque,
          subtitle: data.subtitle,
          etat: data.etat,
          immat: data.immat,
          energie: data.energie,
          miseEnCirculation: data.miseEnCirculation,
          description: data.description,
          history: data.history,
          caracteristiques: data.caracteristiques,
          gallery: data.gallery,
          isPublic: data.isPublic
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur création');
      }

      const created = await response.json();
      toast({ 
        status: 'success', 
        title: 'Véhicule créé !',
        description: `Le véhicule ${data.parc} a été créé avec succès`
      });
      
      // Rediriger vers la page du nouveau véhicule
      navigate(`/dashboard/vehicules/${created.parc}`);
    } catch (e) {
      console.error('❌ Erreur création:', e);
      toast({ 
        status: 'error', 
        title: 'Erreur sauvegarde',
        description: e.message 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box p={8}>
      <HStack mb={6}>
        <Button
          as="a"
          href="/dashboard/vehicules"
          leftIcon={<FiArrowLeft />}
          variant="outline"
        >
          Retour
        </Button>
        <Heading>➕ Créer un véhicule</Heading>
      </HStack>

      <VStack align="stretch" spacing={6}>
        {/* Bloc identité */}
        <Card>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Heading size="md">📋 Identité du véhicule</Heading>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Numéro de parc</FormLabel>
                  <Input 
                    placeholder="ex: 920"
                    value={data.parc}
                    onChange={e => updateField('parc', e.target.value)}
                    fontWeight="bold"
                  />
                  <Text fontSize="xs" color="gray.500">Identifiant unique du véhicule</Text>
                </FormControl>

                <FormControl>
                  <FormLabel>Marque</FormLabel>
                  <Input 
                    placeholder="ex: Mercedes-Benz"
                    value={data.marque}
                    onChange={e => updateField('marque', e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Modèle</FormLabel>
                  <Input 
                    placeholder="ex: Citaro"
                    value={data.modele}
                    onChange={e => updateField('modele', e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Sous-titre</FormLabel>
                  <Input 
                    placeholder="ex: Un grand classique"
                    value={data.subtitle}
                    onChange={e => updateField('subtitle', e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Immatriculation</FormLabel>
                  <Input 
                    placeholder="ex: FG-920-RE"
                    value={data.immat}
                    onChange={e => updateField('immat', e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>État</FormLabel>
                  <Input 
                    placeholder="ex: Disponible, Préservé, En restauration..."
                    value={data.etat}
                    onChange={e => updateField('etat', e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Énergie</FormLabel>
                  <Input 
                    placeholder="ex: Diesel"
                    value={data.energie}
                    onChange={e => updateField('energie', e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Mise en circulation</FormLabel>
                  <Input 
                    type="date"
                    value={data.miseEnCirculation}
                    onChange={e => updateField('miseEnCirculation', e.target.value)}
                  />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Bloc textes */}
        <Card>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Heading size="md">📝 Descriptions</Heading>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea 
                  rows={4}
                  placeholder="Description générale du véhicule..."
                  value={data.description}
                  onChange={e => updateField('description', e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Historique</FormLabel>
                <Textarea 
                  rows={5}
                  placeholder="Historique, anecdotes, restaurations..."
                  value={data.history}
                  onChange={e => updateField('history', e.target.value)}
                />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Bloc caractéristiques */}
        <Card>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Heading size="md">⚙️ Caractéristiques techniques</Heading>
              <CaracteristiquesEditor 
                value={data.caracteristiques}
                onChange={v => updateField('caracteristiques', v)}
              />
            </VStack>
          </CardBody>
        </Card>

        {/* Bloc galerie */}
        <Card>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Heading size="md">🖼️ Galerie photos</Heading>
              <GalleryManager 
                value={data.gallery}
                onChange={v => updateField('gallery', v)}
                parc={data.parc || 'nouveau'}
              />
            </VStack>
          </CardBody>
        </Card>

        {/* Bloc publication */}
        <Card bg="blue.50">
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Heading size="md">🌐 Publication</Heading>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0} flex={1}>
                  Afficher sur le site public
                </FormLabel>
                <Switch 
                  isChecked={data.isPublic}
                  onChange={e => updateField('isPublic', e.target.checked)}
                  size="lg"
                  colorScheme="green"
                />
              </FormControl>

              <Text fontSize="sm" color="gray.600">
                {data.isPublic 
                  ? '✅ Ce véhicule sera visible sur le site public' 
                  : '🔒 Ce véhicule n\'est visible que par les administrateurs'}
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Divider />

        {/* Boutons d'action */}
        <HStack spacing={4} justify="flex-end">
          <Button 
            variant="outline"
            onClick={() => navigate('/dashboard/vehicules')}
          >
            Annuler
          </Button>
          <Button
            colorScheme="green"
            leftIcon={<FiSave />}
            isLoading={saving}
            loadingText="Création..."
            onClick={save}
            size="lg"
          >
            Créer le véhicule
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
