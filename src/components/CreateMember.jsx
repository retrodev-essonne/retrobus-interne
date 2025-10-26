import React, { useState } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Button, FormControl, FormLabel, Input,
  Select, VStack, SimpleGrid, Textarea, Card, CardHeader, CardBody,
  Heading, useToast, HStack
} from '@chakra-ui/react';
import { membersAPI } from '../api/members.js';

const MEMBERSHIP_TYPES = {
  STANDARD: 'Adhésion Standard',
  FAMILY: 'Adhésion Famille',
  STUDENT: 'Adhésion Étudiant',
  HONORARY: 'Membre d\'Honneur',
  BIENFAITEUR: 'Bienfaiteur'
};

const MEMBERSHIP_STATUS = {
  PENDING: 'En attente',
  ACTIVE: 'Actif',
  EXPIRED: 'Expiré',
  SUSPENDED: 'Suspendu'
};

export default function CreateMember({ isOpen, onClose, onMemberCreated }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    birthDate: '',
    membershipType: 'STANDARD',
    membershipStatus: 'ACTIVE',
    paymentAmount: '',
    paymentMethod: 'CASH',
    notes: '',
    newsletter: true
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const reset = () => setFormData({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', postalCode: '', birthDate: '',
    membershipType: 'STANDARD', membershipStatus: 'ACTIVE', paymentAmount: '', paymentMethod: 'CASH', notes: '', newsletter: true
  });

  const handleSubmit = async () => {
    // champs essentiels: prénom, nom, email; le reste optionnel
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast({ title: 'Champs requis', description: 'Prénom, nom et email sont requis', status: 'error', duration: 3000 });
      return;
    }
    try {
      setLoading(true);
      const payload = { ...formData };
      const created = await membersAPI.create(payload);
      toast({ title: 'Adhérent créé', status: 'success', duration: 3000 });
      onMemberCreated?.(created);
      reset();
      onClose();
    } catch (e) {
      toast({ title: 'Erreur', description: e.message, status: 'error', duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Créer un adhérent</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Infos perso */}
            <Card>
              <CardHeader><Heading size="sm">Informations personnelles</Heading></CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <SimpleGrid columns={2} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Prénom</FormLabel>
                      <Input value={formData.firstName} onChange={(e)=>setFormData(p=>({...p, firstName: e.target.value}))} />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Nom</FormLabel>
                      <Input value={formData.lastName} onChange={(e)=>setFormData(p=>({...p, lastName: e.target.value}))} />
                    </FormControl>
                  </SimpleGrid>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input type="email" value={formData.email} onChange={(e)=>setFormData(p=>({...p, email: e.target.value}))} />
                  </FormControl>
                  <SimpleGrid columns={2} spacing={4}>
                    <FormControl>
                      <FormLabel>Téléphone</FormLabel>
                      <Input value={formData.phone} onChange={(e)=>setFormData(p=>({...p, phone: e.target.value}))} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Date de naissance</FormLabel>
                      <Input type="date" value={formData.birthDate} onChange={(e)=>setFormData(p=>({...p, birthDate: e.target.value}))} />
                    </FormControl>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>

            {/* Adresse */}
            <Card>
              <CardHeader><Heading size="sm">Adresse</Heading></CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>Adresse</FormLabel>
                    <Input value={formData.address} onChange={(e)=>setFormData(p=>({...p, address: e.target.value}))} />
                  </FormControl>
                  <SimpleGrid columns={2} spacing={4}>
                    <FormControl>
                      <FormLabel>Code postal</FormLabel>
                      <Input value={formData.postalCode} onChange={(e)=>setFormData(p=>({...p, postalCode: e.target.value}))} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Ville</FormLabel>
                      <Input value={formData.city} onChange={(e)=>setFormData(p=>({...p, city: e.target.value}))} />
                    </FormControl>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>

            {/* Adhésion */}
            <Card>
              <CardHeader><Heading size="sm">Adhésion</Heading></CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <SimpleGrid columns={2} spacing={4}>
                    <FormControl>
                      <FormLabel>Type d'adhésion</FormLabel>
                      <Select value={formData.membershipType} onChange={(e)=>setFormData(p=>({...p, membershipType: e.target.value}))}>
                        {Object.entries(MEMBERSHIP_TYPES).map(([k,v]) => (<option key={k} value={k}>{v}</option>))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Statut</FormLabel>
                      <Select value={formData.membershipStatus} onChange={(e)=>setFormData(p=>({...p, membershipStatus: e.target.value}))}>
                        {Object.entries(MEMBERSHIP_STATUS).map(([k,v]) => (<option key={k} value={k}>{v}</option>))}
                      </Select>
                    </FormControl>
                  </SimpleGrid>
                  <SimpleGrid columns={2} spacing={4}>
                    <FormControl>
                      <FormLabel>Montant cotisation (€)</FormLabel>
                      <Input type="number" value={formData.paymentAmount} onChange={(e)=>setFormData(p=>({...p, paymentAmount: e.target.value}))} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Mode de paiement</FormLabel>
                      <Select value={formData.paymentMethod} onChange={(e)=>setFormData(p=>({...p, paymentMethod: e.target.value}))}>
                        <option value="CASH">Espèces</option>
                        <option value="CHECK">Chèque</option>
                        <option value="BANK_TRANSFER">Virement</option>
                        <option value="CARD">Carte</option>
                        <option value="PAYPAL">PayPal</option>
                        <option value="HELLOASSO">HelloAsso</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader><Heading size="sm">Notes</Heading></CardHeader>
              <CardBody>
                <FormControl>
                  <FormLabel>Notes administratives</FormLabel>
                  <Textarea value={formData.notes} onChange={(e)=>setFormData(p=>({...p, notes: e.target.value}))} placeholder="Notes internes sur l'adhérent..." />
                </FormControl>
              </CardBody>
            </Card>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose}>Annuler</Button>
            <Button colorScheme="blue" onClick={handleSubmit} isLoading={loading} loadingText="Création...">Créer l'adhérent</Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
