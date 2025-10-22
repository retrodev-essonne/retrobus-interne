import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardBody, CardHeader, Heading, Text, Button,
  Input, Select, VStack, HStack, Badge, useToast, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  useDisclosure, FormControl, FormLabel, Textarea, Flex,
  Icon, SimpleGrid, Alert, AlertIcon, Container, Stat, StatLabel, StatNumber,
  IconButton, Menu, MenuButton, MenuList, MenuItem, MenuDivider, useColorModeValue,
  Spinner, Divider, Avatar, Tag, TagLabel
} from '@chakra-ui/react';
import { FiEdit3, FiTrash2, FiMoreHorizontal, FiCheck, FiX, FiRefreshCw, FiMessageSquare, FiPlus } from 'react-icons/fi';
import { useUser } from '../context/UserContext';

function TicketCard({ report, onUpdate, onComment, onStatusChange, onDelete }) {
  const cardBg = useColorModeValue('white', 'gray.800');

  const priorityColors = { low: 'green', medium: 'yellow', high: 'orange', critical: 'red' };
  const statusColors = { open: 'blue', in_progress: 'orange', resolved: 'green', closed: 'gray' };

  const priorityLabel = useMemo(() => {
    switch (report.priority) {
      case 'low': return '🟢 Faible';
      case 'medium': return '🟡 Moyen';
      case 'high': return '🟠 Élevé';
      default: return '🔴 Critique';
    }
  }, [report.priority]);

  const statusLabel = useMemo(() => {
    switch (report.status) {
      case 'open': return 'Ouvert';
      case 'in_progress': return 'En cours';
      case 'resolved': return 'Résolu';
      default: return 'Fermé';
    }
  }, [report.status]);

  const createdAt = report.createdAt ? new Date(report.createdAt) : null;

  return (
    <Card bg={cardBg} borderLeftWidth={4} borderLeftColor={`${priorityColors[report.priority] || 'gray'}.500`}>
      <CardHeader pb={3}>
        <Flex justify="space-between" align="start">
          <VStack align="start" spacing={2}>
            <HStack>
              <Badge colorScheme={priorityColors[report.priority] || 'gray'} variant="solid" size="sm">
                {priorityLabel}
              </Badge>
              <Badge colorScheme={statusColors[report.status] || 'gray'} variant="subtle">
                {statusLabel}
              </Badge>
            </HStack>

            {/* Afficher uniquement le titre */}
            <Heading size="sm">{report.title}</Heading>

            <Text fontSize="xs" color="gray.500">
              Créé par {report.createdBy} {createdAt ? `le ${createdAt.toLocaleDateString('fr-FR')}` : ''}
            </Text>
          </VStack>

          <Menu>
            <MenuButton as={IconButton} icon={<FiMoreHorizontal />} variant="ghost" size="sm" />
            <MenuList>
              <MenuItem icon={<FiEdit3 />} onClick={() => onUpdate(report)}>Modifier</MenuItem>
              <MenuItem icon={<FiMessageSquare />} onClick={() => onComment(report)}>Commenter</MenuItem>
              {report.status === 'open' && (
                <MenuItem icon={<FiRefreshCw />} onClick={() => onStatusChange(report.id, 'in_progress')}>Marquer en cours</MenuItem>
              )}
              {(report.status === 'open' || report.status === 'in_progress') && (
                <MenuItem icon={<FiCheck />} onClick={() => onStatusChange(report.id, 'resolved')}>Marquer comme résolu</MenuItem>
              )}
              {report.status === 'resolved' && (
                <MenuItem icon={<FiX />} onClick={() => onStatusChange(report.id, 'closed')}>Fermer définitivement</MenuItem>
              )}
              {report.status === 'closed' && (
                <MenuItem icon={<FiRefreshCw />} onClick={() => onStatusChange(report.id, 'open')}>Rouvrir</MenuItem>
              )}
              <MenuDivider />
              <MenuItem icon={<FiTrash2 />} onClick={() => onDelete(report.id)} color="red.500">Supprimer</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </CardHeader>

      <CardBody pt={0}>
        <VStack align="start" spacing={3}>
          <Text fontSize="sm">{report.description}</Text>

          {report.category && (
            <Tag size="sm" variant="subtle">
              <TagLabel>{report.category}</TagLabel>
            </Tag>
          )}

          {report.assignedTo && (
            <HStack>
              <Avatar size="xs" name={report.assignedTo} />
              <Text fontSize="xs">Assigné à {report.assignedTo}</Text>
            </HStack>
          )}

          {Array.isArray(report.comments) && report.comments.length > 0 && (
            <VStack align="start" spacing={2} w="full">
              <Divider />
              <HStack>
                <Text fontSize="xs" fontWeight="bold">{report.comments.length} commentaire(s)</Text>
              </HStack>
              <Box bg="gray.50" p={2} borderRadius="md" w="full">
                <Text fontSize="xs">{report.comments[report.comments.length - 1].message}</Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Par {report.comments[report.comments.length - 1].author} - {new Date(report.comments[report.comments.length - 1].createdAt).toLocaleDateString('fr-FR')}
                </Text>
              </Box>
            </VStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}

export default function SupportSite() {
  const { user } = useUser();
  const toast = useToast();

  const {
    isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose
  } = useDisclosure();
  const {
    isOpen: isCommentOpen, onOpen: onCommentOpen, onClose: onCommentClose
  } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const [reportFormData, setReportFormData] = useState({ title: '', description: '', category: '', priority: 'medium', type: 'bug' });
  const [editFormData, setEditFormData] = useState({ title: '', description: '', category: '', priority: 'medium', type: 'bug' });
  const [commentFormData, setCommentFormData] = useState({ message: '', status: '' });
  const [reportScreenshots, setReportScreenshots] = useState([]); // File[]

  const cardBg = useColorModeValue('white', 'gray.800');

  const fetchReports = async () => {
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/retro-reports`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setReports(data.reports || []);
    } catch (e) {
      console.error('Erreur chargement rétroreports:', e);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchReports();
      setLoading(false);
    })();
  }, []);

  const handleReportSubmit = async () => {
    if (!reportFormData.title || !reportFormData.description) {
      toast({ title: 'Erreur', description: "Veuillez remplir le titre et la description", status: 'error', duration: 3000, isClosable: true });
      return;
    }
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const fd = new FormData();
      fd.append('title', reportFormData.title);
      fd.append('description', reportFormData.description);
      fd.append('category', reportFormData.category || '');
      fd.append('priority', reportFormData.priority || 'medium');
      fd.append('type', reportFormData.type || 'bug');
      if (reportScreenshots && reportScreenshots.length > 0) {
        reportScreenshots.forEach(f => fd.append('screenshots', f, f.name));
      }

      const res = await fetch(`${base}/api/retro-reports`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: fd
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({error:'create failed'}));
        throw new Error(err.error || 'create failed');
      }
      await fetchReports();
      setReportFormData({ title: '', description: '', category: '', priority: 'medium', type: 'bug' });
      setReportScreenshots([]);
      onReportClose();
      toast({ title: 'Succès', description: 'RétroReport créé avec succès', status: 'success', duration: 3000, isClosable: true });
    } catch (e) {
      toast({ title: 'Erreur', description: e.message || "Impossible de créer le RétroReport", status: 'error', duration: 3000 });
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentFormData.message) {
      toast({ title: 'Erreur', description: 'Veuillez écrire un commentaire', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const payload = {
        message: commentFormData.message,
        author: user?.name || 'Administrateur',
        status: commentFormData.status || undefined
      };

      let res = await fetch(`${base}/api/retro-reports/${selectedReport.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        res = await fetch(`${base}/api/retro-reports/${selectedReport.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({
            appendComment: { message: payload.message, author: payload.author },
            status: payload.status
          })
        });
        if (!res.ok) throw new Error('Impossible de persister le commentaire');
      }

      await fetchReports();
      setCommentFormData({ message: '', status: '' });
      onCommentClose();
      toast({ title: 'Succès', description: 'Commentaire ajouté avec succès', status: 'success', duration: 3000, isClosable: true });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: "Impossible d'ajouter le commentaire", status: 'error', duration: 3000 });
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      let res = await fetch(`${base}/api/retro-reports/${reportId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json','Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        res = await fetch(`${base}/api/retro-reports/${reportId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json','Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) throw new Error('status failed');
      }
      await fetchReports();
      const labels = { open: 'Ouvert', in_progress: 'En cours', resolved: 'Résolu', closed: 'Fermé' };
      toast({ title: 'Statut mis à jour', description: `RétroReport marqué comme ${labels[newStatus]?.toLowerCase() || newStatus}`, status: 'success', duration: 3000 });
    } catch (e) {
      toast({ title: 'Erreur', description: 'Impossible de changer le statut', status: 'error', duration: 3000 });
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce RétroReport ?')) return;
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/retro-reports/${reportId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
      if (!res.ok) throw new Error('delete failed');
      await fetchReports();
      toast({ title: 'RétroReport supprimé', description: 'Le ticket a été supprimé avec succès', status: 'success', duration: 3000 });
    } catch (e) {
      toast({ title: 'Erreur', description: 'Suppression impossible', status: 'error', duration: 3000 });
    }
  };

  const handleEditReport = (report) => {
    setSelectedReport(report);
    setEditFormData({
      title: report.title,
      description: report.description,
      category: report.category || '',
      priority: report.priority || 'medium',
      type: report.type || 'bug'
    });
    onEditOpen();
  };

  const handleEditSubmit = async () => {
    if (!selectedReport?.id || !editFormData.title || !editFormData.description) {
      toast({ title: 'Erreur', description: 'Titre et description requis', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/retro-reports/${selectedReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json','Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description,
          category: editFormData.category || '',
          priority: editFormData.priority || 'medium',
          type: editFormData.type || 'bug'
        })
      });
      if (!res.ok) throw new Error('update failed');
      await fetchReports();
      onEditClose();
      toast({ title: 'Succès', description: 'RétroReport mis à jour', status: 'success', duration: 3000 });
    } catch (e) {
      toast({ title: 'Erreur', description: 'Mise à jour impossible', status: 'error', duration: 3000 });
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8}>
          <Spinner size="xl" color="green.500" />
          <Text>Chargement du support…</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box bgGradient="linear(to-r, red.500, orange.500)" color="white" p={8} borderRadius="xl" mb={8} textAlign="center">
        <Heading size="xl" mb={2}>🎫 Support du site</Heading>
        <Text opacity={0.9}>Tickets: incidents, bugs et améliorations</Text>
      </Box>

      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Heading size="md">Système de tickets</Heading>
            <Text fontSize="sm" color="gray.600">Signalez et suivez les incidents et demandes</Text>
          </VStack>
          <Button leftIcon={<FiPlus />} colorScheme="red" onClick={onReportOpen}>Nouveau ticket</Button>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card bg={cardBg}><CardBody><Stat><StatLabel fontSize="xs">Ouverts</StatLabel><StatNumber color="red.500" fontSize="lg">{reports.filter(r => r.status === 'open').length}</StatNumber></Stat></CardBody></Card>
          <Card bg={cardBg}><CardBody><Stat><StatLabel fontSize="xs">En cours</StatLabel><StatNumber color="orange.500" fontSize="lg">{reports.filter(r => r.status === 'in_progress').length}</StatNumber></Stat></CardBody></Card>
          <Card bg={cardBg}><CardBody><Stat><StatLabel fontSize="xs">Résolus</StatLabel><StatNumber color="green.500" fontSize="lg">{reports.filter(r => r.status === 'resolved').length}</StatNumber></Stat></CardBody></Card>
          <Card bg={cardBg}><CardBody><Stat><StatLabel fontSize="xs">Total</StatLabel><StatNumber color="blue.500" fontSize="lg">{reports.length}</StatNumber></Stat></CardBody></Card>
        </SimpleGrid>

        <VStack spacing={4} align="stretch">
          {reports.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" fontSize="sm">Aucun ticket</Text>
                <Text fontSize="xs">Créez votre premier ticket.</Text>
              </VStack>
            </Alert>
          ) : (
            reports.map((report) => (
              <TicketCard
                key={report.id}
                report={report}
                onUpdate={handleEditReport}
                onComment={(r) => { setSelectedReport(r); onCommentOpen(); }}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteReport}
              />
            ))
          )}
        </VStack>
      </VStack>

      {/* Modal création */}
      <Modal isOpen={isReportOpen} onClose={onReportClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>🎫 Nouveau ticket</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Titre</FormLabel>
                <Input value={reportFormData.title} onChange={(e) => setReportFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Ex: Problème de connexion, Page lente..." />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea value={reportFormData.description} onChange={(e) => setReportFormData(prev => ({ ...prev, description: e.target.value }))} rows={4} placeholder="Décrivez le problème..." />
              </FormControl>
              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl>
                  <FormLabel>Type</FormLabel>
                  <Select value={reportFormData.type} onChange={(e) => setReportFormData(prev => ({ ...prev, type: e.target.value }))}>
                    <option value="bug">🐛 Bug</option>
                    <option value="feature">✨ Amélioration</option>
                    <option value="performance">⚡ Performance</option>
                    <option value="security">🔒 Sécurité</option>
                    <option value="other">📋 Autre</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Priorité</FormLabel>
                  <Select value={reportFormData.priority} onChange={(e) => setReportFormData(prev => ({ ...prev, priority: e.target.value }))}>
                    <option value="low">🟢 Faible</option>
                    <option value="medium">🟡 Moyen</option>
                    <option value="high">🟠 Élevé</option>
                    <option value="critical">🔴 Critique</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Catégorie</FormLabel>
                <Input value={reportFormData.category} onChange={(e) => setReportFormData(prev => ({ ...prev, category: e.target.value }))} placeholder="Ex: Technique, Interface, Base de données..." />
              </FormControl>
              <FormControl>
                <FormLabel>Captures d’écran (optionnel)</FormLabel>
                <Input type="file" accept="image/*" multiple onChange={(e) => setReportScreenshots(Array.from(e.target.files || []))} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onReportClose}>Annuler</Button>
            <Button colorScheme="red" onClick={handleReportSubmit} leftIcon={<FiPlus />}>Créer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal commentaire */}
      <Modal isOpen={isCommentOpen} onClose={onCommentClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ajouter un commentaire</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Commentaire</FormLabel>
                <Textarea value={commentFormData.message} onChange={(e) => setCommentFormData(prev => ({ ...prev, message: e.target.value }))} rows={3} />
              </FormControl>
              <FormControl>
                <FormLabel>Changer le statut (optionnel)</FormLabel>
                <Select value={commentFormData.status} onChange={(e) => setCommentFormData(prev => ({ ...prev, status: e.target.value }))}>
                  <option value="">Ne pas changer</option>
                  <option value="open">Ouvert</option>
                  <option value="in_progress">En cours</option>
                  <option value="resolved">Résolu</option>
                  <option value="closed">Fermé</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCommentClose}>Annuler</Button>
            <Button colorScheme="blue" onClick={handleCommentSubmit}>Publier</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal édition */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modifier le ticket</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Titre</FormLabel>
                <Input value={editFormData.title} onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea rows={4} value={editFormData.description} onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))} />
              </FormControl>
              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl>
                  <FormLabel>Catégorie</FormLabel>
                  <Input value={editFormData.category} onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))} />
                </FormControl>
                <FormControl>
                  <FormLabel>Priorité</FormLabel>
                  <Select value={editFormData.priority} onChange={(e) => setEditFormData(prev => ({ ...prev, priority: e.target.value }))}>
                    <option value="low">Faible</option>
                    <option value="medium">Moyen</option>
                    <option value="high">Élevé</option>
                    <option value="critical">Critique</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Type</FormLabel>
                <Select value={editFormData.type} onChange={(e) => setEditFormData(prev => ({ ...prev, type: e.target.value }))}>
                  <option value="bug">Bug</option>
                  <option value="feature">Amélioration</option>
                  <option value="performance">Performance</option>
                  <option value="security">Sécurité</option>
                  <option value="other">Autre</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>Annuler</Button>
            <Button colorScheme="blue" onClick={handleEditSubmit}>Enregistrer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}