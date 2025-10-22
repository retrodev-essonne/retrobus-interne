import React, { useState, useEffect, useCallback } from "react";
import {
  Grid, VStack, HStack, Badge, useToast, useColorModeValue, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  useDisclosure, FormControl, FormLabel, Textarea, 
  Alert, AlertIcon, InputGroup, InputLeftElement, 
  ButtonGroup, IconButton, Menu, MenuButton, MenuList, MenuItem,
  Spinner, Tabs, TabList, TabPanels, Tab, TabPanel,
  Switch, Table, Thead, Tbody, Tr, Th, Td, Text, Button, Input, Select,
  Card, CardHeader, CardBody, Icon, Heading,
  SimpleGrid, Divider, Box, Progress, Tooltip, PinInput, PinInputField,
  NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper,
  NumberDecrementStepper, Stat, StatLabel, StatNumber, StatHelpText,
  StatArrow, Accordion, AccordionItem, AccordionButton, AccordionPanel,
  AccordionIcon, Tag, TagLabel, TagCloseButton, Flex, Image, Link
} from "@chakra-ui/react";
import {
  FiDollarSign, FiTrendingUp, FiTrendingDown, FiPlus, FiMinus,
  FiPieChart, FiBarChart, FiCalendar, FiCreditCard, FiDownload,
  FiUpload, FiEdit3, FiTrash2, FiMoreHorizontal, FiCheck, FiX, 
  FiRefreshCw, FiClock, FiRepeat, FiTarget, FiSettings, FiLock,
  FiUnlock, FiEye, FiEyeOff, FiActivity, FiTrendingDown as FiSimulation,
  FiDatabase, FiShield, FiAlertTriangle, FiInfo, FiSave, FiRotateCcw
} from "react-icons/fi";

const AdminFinance = () => {
  const toast = useToast();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // === ÉTATS PRINCIPAUX ===
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [scheduledOperations, setScheduledOperations] = useState([]);

  // === ÉTATS CONFIGURATION ===
  const [showBalanceConfig, setShowBalanceConfig] = useState(false);
  const [configCode, setConfigCode] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [isBalanceLocked, setIsBalanceLocked] = useState(true);
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState(null);

  // === ÉTATS SIMULATION AMÉLIORÉS ===
  const [simulationData, setSimulationData] = useState({
    scenarios: [],
    activeScenario: null,
    projectionMonths: 12
  });
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);
  const [editingScenario, setEditingScenario] = useState(null);

  // Formulaires
  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    projectionMonths: 12
  });
  const [newIncomeItem, setNewIncomeItem] = useState({
    description: '',
    amount: '',
    category: 'ADHESION',
    frequency: 'MONTHLY'
  });
  const [newExpenseItem, setNewExpenseItem] = useState({
    description: '',
    amount: '',
    category: 'MAINTENANCE',
    frequency: 'MONTHLY'
  });

  // Modals supplémentaires
  const { isOpen: isEditScenarioOpen, onOpen: onEditScenarioOpen, onClose: onEditScenarioClose } = useDisclosure();
  const { isOpen: isSimulationResultsOpen, onOpen: onSimulationResultsOpen, onClose: onSimulationResultsClose } = useDisclosure();
  const { isOpen: isConfigOpen, onOpen: onConfigOpen, onClose: onConfigClose } = useDisclosure();

  // === CHARGEMENT INITIAL ===
  useEffect(() => {
    loadFinancialData();
    loadBalanceHistory();
    loadSimulationData();
  }, []);

  const loadFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTransactions(),
        loadScheduledOperations(),
        loadBalance()
      ]);
    } catch (error) {
      console.error('❌ Erreur chargement données financières:', error);
      if (error.message.includes('401') || error.message.includes('403')) {
        toast({
          status: "error",
          title: "Session expirée",
          description: "Veuillez vous reconnecter",
          duration: 5000,
          isClosable: true
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/finance/transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(Array.isArray(data) ? data : data.transactions || []);
      } else {
        console.warn('⚠️ Transactions non disponibles');
        setTransactions([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement transactions:', error);
      setTransactions([]);
    }
  };

  const loadScheduledOperations = async () => {
    try {
      const response = await fetch('/api/finance/scheduled-operations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setScheduledOperations(Array.isArray(data) ? data : data.operations || []);
      } else {
        console.warn('⚠️ Opérations programmées non disponibles');
        setScheduledOperations([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement opérations programmées:', error);
      setScheduledOperations([]);
    }
  };

  const loadBalance = async () => {
    try {
      const response = await fetch('/api/finance/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance || 0);
        setLastBalanceUpdate(data.lastUpdate);
        setIsBalanceLocked(data.isLocked !== false);
      } else {
        console.warn('⚠️ Solde non disponible, utilisation de 0');
        setBalance(0);
      }
    } catch (error) {
      console.error('❌ Erreur chargement solde:', error);
      setBalance(0);
    }
  };

  const loadBalanceHistory = async () => {
    try {
      const response = await fetch('/api/finance/balance/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBalanceHistory(data.history || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement historique solde:', error);
      setBalanceHistory([]);
    }
  };

  // === GESTION CONFIGURATION SOLDE ===
  const handleBalanceConfig = async () => {
    if (!configCode || configCode.length !== 4) {
      toast({
        status: "warning",
        title: "Code requis",
        description: "Veuillez saisir le code à 4 chiffres",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    if (!newBalance || isNaN(parseFloat(newBalance))) {
      toast({
        status: "warning",
        title: "Montant invalide",
        description: "Veuillez saisir un montant valide",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/finance/balance/configure', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: configCode,
          newBalance: parseFloat(newBalance),
          reason: `Mise à jour manuelle du solde - ${new Date().toLocaleDateString('fr-FR')}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data.newBalance);
        setConfigCode('');
        setNewBalance('');
        setShowBalanceConfig(false);
        
        toast({
          status: "success",
          title: "Solde mis à jour",
          description: `Nouveau solde: ${formatCurrency(data.newBalance)}`,
          duration: 3000,
          isClosable: true
        });
        
        await loadBalanceHistory();
      } else {
        const errorData = await response.json();
        toast({
          status: "error",
          title: "Erreur de configuration",
          description: errorData.message || "Code incorrect ou erreur serveur",
          duration: 4000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('❌ Erreur configuration solde:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible de configurer le solde",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  // === GESTION SIMULATIONS ===
  const createSimulationScenario = async () => {
    if (!newScenario.name || !newScenario.description) {
      toast({
        status: "warning",
        title: "Champs requis",
        description: "Nom et description sont obligatoires",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/finance/simulations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newScenario)
      });

      if (response.ok) {
        const data = await response.json();
        
        toast({
          status: "success",
          title: "Scénario créé",
          description: "Vous pouvez maintenant ajouter les recettes et dépenses",
          duration: 4000,
          isClosable: true
        });
        
        setNewScenario({
          name: '',
          description: '',
          projectionMonths: 12
        });
        
        await loadSimulationData();
        onSimulationClose();
        
        // Ouvrir automatiquement l'édition du nouveau scénario
        setEditingScenario(data.scenario);
        onEditScenarioOpen();
      }
    } catch (error) {
      console.error('❌ Erreur création scénario:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible de créer le scénario",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const loadScenarioDetails = async (scenarioId) => {
    try {
      const response = await fetch(`/api/finance/simulations/${scenarioId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEditingScenario(data.scenario);
      }
    } catch (error) {
      console.error('❌ Erreur chargement détails scénario:', error);
    }
  };

  const addIncomeItem = async () => {
    if (!newIncomeItem.description || !newIncomeItem.amount) {
      toast({
        status: "warning",
        title: "Champs requis",
        description: "Description et montant sont obligatoires",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      const response = await fetch(`/api/finance/simulations/${editingScenario.id}/income`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newIncomeItem,
          amount: parseFloat(newIncomeItem.amount)
        })
      });

      if (response.ok) {
        toast({
          status: "success",
          title: "Recette ajoutée",
          duration: 2000,
          isClosable: true
        });
        
        setNewIncomeItem({
          description: '',
          amount: '',
          category: 'ADHESION',
          frequency: 'MONTHLY'
        });
        
        await loadScenarioDetails(editingScenario.id);
      }
    } catch (error) {
      console.error('❌ Erreur ajout recette:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible d'ajouter la recette",
        duration: 4000,
        isClosable: true
      });
    }
  };

  const addExpenseItem = async () => {
    if (!newExpenseItem.description || !newExpenseItem.amount) {
      toast({
        status: "warning",
        title: "Champs requis",
        description: "Description et montant sont obligatoires",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      const response = await fetch(`/api/finance/simulations/${editingScenario.id}/expense`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newExpenseItem,
          amount: parseFloat(newExpenseItem.amount)
        })
      });

      if (response.ok) {
        toast({
          status: "success",
          title: "Dépense ajoutée",
          duration: 2000,
          isClosable: true
        });
        
        setNewExpenseItem({
          description: '',
          amount: '',
          category: 'MAINTENANCE',
          frequency: 'MONTHLY'
        });
        
        await loadScenarioDetails(editingScenario.id);
      }
    } catch (error) {
      console.error('❌ Erreur ajout dépense:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible d'ajouter la dépense",
        duration: 4000,
        isClosable: true
      });
    }
  };

  const removeIncomeItem = async (itemId) => {
    try {
      const response = await fetch(`/api/finance/simulations/income/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          status: "success",
          title: "Recette supprimée",
          duration: 2000,
          isClosable: true
        });
        
        await loadScenarioDetails(editingScenario.id);
      }
    } catch (error) {
      console.error('❌ Erreur suppression recette:', error);
    }
  };

  const removeExpenseItem = async (itemId) => {
    try {
      const response = await fetch(`/api/finance/simulations/expense/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          status: "success",
          title: "Dépense supprimée",
          duration: 2000,
          isClosable: true
        });
        
        await loadScenarioDetails(editingScenario.id);
      }
    } catch (error) {
      console.error('❌ Erreur suppression dépense:', error);
    }
  };

  const runSimulation = async (scenarioId) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/finance/simulations/${scenarioId}/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSimulationResults(data.simulation);
        onSimulationResultsOpen();
      }
    } catch (error) {
      console.error('❌ Erreur exécution simulation:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible d'exécuter la simulation",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  // === FORMATAGE ===
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      DAILY: 'Quotidien',
      WEEKLY: 'Hebdomadaire',
      MONTHLY: 'Mensuel',
      QUARTERLY: 'Trimestriel',
      YEARLY: 'Annuel'
    };
    return labels[frequency] || frequency;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      ADHESION: 'Adhésion',
      MAINTENANCE: 'Maintenance',
      CARBURANT: 'Carburant',
      ASSURANCE: 'Assurance',
      AUTRE: 'Autre'
    };
    return labels[category] || category;
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* En-tête avec configuration */}
        <HStack justify="space-between" align="center">
          <Heading size="lg" color="blue.600">
            💰 Gestion Financière
          </Heading>
          <HStack>
            <IconButton
              icon={<FiRefreshCw />}
              onClick={loadFinancialData}
              isLoading={loading}
              variant="outline"
              size="sm"
            />
            <IconButton
              icon={<FiSettings />}
              onClick={onConfigOpen}
              variant="outline"
              size="sm"
              colorScheme="purple"
            />
            <Badge
              colorScheme={stats.balance >= 0 ? "green" : "red"}
              fontSize="lg"
              p={2}
              borderRadius="md"
              cursor="pointer"
              onClick={() => setShowBalanceConfig(!showBalanceConfig)}
            >
              {isBalanceLocked ? <Icon as={FiLock} mr={1} /> : <Icon as={FiUnlock} mr={1} />}
              Solde: {formatCurrency(stats.balance)}
            </Badge>
          </HStack>
        </HStack>

        {/* Configuration rapide du solde */}
        {showBalanceConfig && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <VStack align="stretch" spacing={3} flex={1}>
              <Text fontWeight="bold">Configuration du solde (Code requis)</Text>
              <HStack>
                <HStack>
                  <Text fontSize="sm">Code:</Text>
                  <HStack>
                    <PinInput value={configCode} onChange={setConfigCode} type="number">
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                    </PinInput>
                  </HStack>
                </HStack>
                <NumberInput
                  value={newBalance}
                  onChange={setNewBalance}
                  precision={2}
                  step={0.01}
                  width="150px"
                >
                  <NumberInputField placeholder="Nouveau solde" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Button
                  size="sm"
                  colorScheme="orange"
                  onClick={handleBalanceConfig}
                  isLoading={loading}
                  leftIcon={<FiCheck />}
                >
                  Appliquer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowBalanceConfig(false)}
                  leftIcon={<FiX />}
                >
                  Annuler
                </Button>
              </HStack>
            </VStack>
          </Alert>
        )}

        {/* Statistiques étendues */}
        <SimpleGrid columns={{ base: 2, md: 6 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Solde Actuel</StatLabel>
                <StatNumber color={stats.balance >= 0 ? "green.600" : "red.600"}>
                  {formatCurrency(stats.balance)}
                </StatNumber>
                {lastBalanceUpdate && (
                  <StatHelpText fontSize="xs">
                    MAJ: {formatDate(lastBalanceUpdate)}
                  </StatHelpText>
                )}
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Crédits Total</StatLabel>
                <StatNumber color="green.600">
                  {formatCurrency(stats.totalCredits)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Entrées
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Débits Total</StatLabel>
                <StatNumber color="red.600">
                  {formatCurrency(stats.totalDebits)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" />
                  Sorties
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Ce Mois</StatLabel>
                <StatNumber color={stats.monthlyBalance >= 0 ? "green.600" : "red.600"}>
                  {formatCurrency(stats.monthlyBalance)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={stats.monthlyBalance >= 0 ? "increase" : "decrease"} />
                  Résultat mensuel
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Programmé/Mois</StatLabel>
                <StatNumber color={stats.scheduledMonthlyImpact >= 0 ? "green.600" : "red.600"}>
                  {formatCurrency(stats.scheduledMonthlyImpact)}
                </StatNumber>
                <StatHelpText>
                  {stats.scheduledCount} opérations
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Projection M+1</StatLabel>
                <StatNumber color={stats.projectedNextMonth >= 0 ? "green.600" : "red.600"}>
                  {formatCurrency(stats.projectedNextMonth)}
                </StatNumber>
                <StatHelpText>
                  Estimation
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Onglets étendus */}
        <Tabs index={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>💳 Transactions</Tab>
            <Tab>⏰ Échéanciers</Tab>
            <Tab>🧮 Simulations</Tab>
            <Tab>📊 Rapports</Tab>
            <Tab>⚙️ Configuration</Tab>
          </TabList>

          <TabPanels>
            {/* Onglet Transactions */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">Transactions</Heading>
                  <Button
                    leftIcon={<FiPlus />}
                    colorScheme="blue"
                    onClick={onTransactionOpen}
                    size="sm"
                  >
                    Nouvelle transaction
                  </Button>
                </HStack>

                {loading ? (
                  <Box textAlign="center" p={8}>
                    <Spinner size="lg" />
                    <Text mt={2}>Chargement...</Text>
                  </Box>
                ) : transactions.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    Aucune transaction enregistrée
                  </Alert>
                ) : (
                  <Card>
                    <CardBody p={0}>
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Date</Th>
                            <Th>Description</Th>
                            <Th>Catégorie</Th>
                            <Th>Type</Th>
                            <Th isNumeric>Montant</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {transactions.map((transaction, index) => (
                            <Tr key={transaction.id || index}>
                              <Td>{formatDate(transaction.date || transaction.createdAt)}</Td>
                              <Td>{transaction.description}</Td>
                              <Td>
                                <Badge size="sm" variant="outline">
                                  {getCategoryLabel(transaction.category)}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge
                                  colorScheme={transaction.type === 'CREDIT' ? 'green' : 'red'}
                                  size="sm"
                                >
                                  {transaction.type === 'CREDIT' ? 'Crédit' : 'Débit'}
                                </Badge>
                              </Td>
                              <Td isNumeric>
                                <Text
                                  color={transaction.type === 'CREDIT' ? 'green.600' : 'red.600'}
                                  fontWeight="bold"
                                >
                                  {transaction.type === 'CREDIT' ? '+' : '-'}
                                  {formatCurrency(Math.abs(transaction.amount))}
                                </Text>
                              </Td>
                              <Td>
                                <Menu>
                                  <MenuButton
                                    as={IconButton}
                                    icon={<FiMoreHorizontal />}
                                    variant="ghost"
                                    size="sm"
                                  />
                                  <MenuList>
                                    <MenuItem icon={<FiEdit3 />}>Modifier</MenuItem>
                                    <MenuItem icon={<FiTrash2 />} color="red.500">
                                      Supprimer
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>

            {/* Onglet Échéanciers */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">Opérations Programmées</Heading>
                  <Button
                    leftIcon={<FiPlus />}
                    colorScheme="purple"
                    onClick={onScheduledOpen}
                    size="sm"
                  >
                    Nouvelle opération
                  </Button>
                </HStack>

                {loading ? (
                  <Box textAlign="center" p={8}>
                    <Spinner size="lg" />
                    <Text mt={2}>Chargement...</Text>
                  </Box>
                ) : scheduledOperations.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    Aucune opération programmée
                  </Alert>
                ) : (
                  <Card>
                    <CardBody p={0}>
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Description</Th>
                            <Th>Fréquence</Th>
                            <Th>Prochaine date</Th>
                            <Th isNumeric>Montant</Th>
                            <Th>Statut</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {scheduledOperations.map((operation, index) => (
                            <Tr key={operation.id || index}>
                              <Td>{operation.description}</Td>
                              <Td>
                                <Badge variant="outline">
                                  {getFrequencyLabel(operation.frequency)}
                                </Badge>
                              </Td>
                              <Td>{formatDate(operation.nextDate)}</Td>
                              <Td isNumeric>
                                <Text
                                  color={operation.type === 'SCHEDULED_CREDIT' ? 'green.600' : 'red.600'}
                                  fontWeight="bold"
                                >
                                  {operation.type === 'SCHEDULED_CREDIT' ? '+' : '-'}
                                  {formatCurrency(Math.abs(operation.amount))}
                                </Text>
                              </Td>
                              <Td>
                                <Switch
                                  isChecked={operation.isActive}
                                  onChange={() => toggleScheduledOperation(operation.id, operation.isActive)}
                                  colorScheme="green"
                                  size="sm"
                                />
                              </Td>
                              <Td>
                                <Menu>
                                  <MenuButton
                                    as={IconButton}
                                    icon={<FiMoreHorizontal />}
                                    variant="ghost"
                                    size="sm"
                                  />
                                  <MenuList>
                                    <MenuItem icon={<FiEdit3 />}>Modifier</MenuItem>
                                    <MenuItem icon={<FiTrash2 />} color="red.500">
                                      Supprimer
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>

            {/* Onglet Simulations */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">Simulations Financières</Heading>
                  <Button
                    leftIcon={<FiActivity />}
                    colorScheme="teal"
                    onClick={onSimulationOpen}
                    size="sm"
                  >
                    Nouveau scénario
                  </Button>
                </HStack>

                {simulationData.scenarios.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="bold">Aucun scénario de simulation</Text>
                      <Text fontSize="sm">
                        Créez des scénarios pour simuler l'évolution de votre trésorerie.
                        Étape 1: Créer le contexte, Étape 2: Ajouter recettes/dépenses.
                      </Text>
                    </VStack>
                  </Alert>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {simulationData.scenarios.map((scenario) => {
                      const isComplete = scenario.itemsCount > 0;
                      const monthlyNet = scenario.totalMonthlyIncome - scenario.totalMonthlyExpenses;
                      
                      return (
                        <Card key={scenario.id} borderWidth={2} borderColor={isComplete ? "green.200" : "orange.200"}>
                          <CardHeader>
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <Heading size="sm">{scenario.name}</Heading>
                                <HStack>
                                  <Badge
                                    colorScheme={isComplete ? "green" : "orange"}
                                    size="sm"
                                  >
                                    {isComplete ? "Complet" : "Brouillon"}
                                  </Badge>
                                  <Badge variant="outline" size="sm">
                                    {scenario.itemsCount} élément(s)
                                  </Badge>
                                </HStack>
                              </VStack>
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  icon={<FiMoreHorizontal />}
                                  variant="ghost"
                                  size="sm"
                                />
                                <MenuList>
                                  <MenuItem 
                                    icon={<FiEdit3 />}
                                    onClick={async () => {
                                      await loadScenarioDetails(scenario.id);
                                      onEditScenarioOpen();
                                    }}
                                  >
                                    Éditer
                                  </MenuItem>
                                  <MenuItem 
                                    icon={<FiActivity />}
                                    onClick={() => runSimulation(scenario.id)}
                                    isDisabled={!isComplete}
                                  >
                                    Exécuter
                                  </MenuItem>
                                  <Divider />
                                  <MenuItem icon={<FiTrash2 />} color="red.500">
                                    Supprimer
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </HStack>
                          </CardHeader>
                          <CardBody>
                            <VStack align="stretch" spacing={3}>
                              <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                {scenario.description}
                              </Text>
                              
                              {isComplete ? (
                                <SimpleGrid columns={3} spacing={2}>
                                  <Stat size="sm">
                                    <StatLabel fontSize="xs">Revenus</StatLabel>
                                    <StatNumber fontSize="sm" color="green.600">
                                      {formatCurrency(scenario.totalMonthlyIncome)}
                                    </StatNumber>
                                  </Stat>
                                  <Stat size="sm">
                                    <StatLabel fontSize="xs">Dépenses</StatLabel>
                                    <StatNumber fontSize="sm" color="red.600">
                                      {formatCurrency(scenario.totalMonthlyExpenses)}
                                    </StatNumber>
                                  </Stat>
                                  <Stat size="sm">
                                    <StatLabel fontSize="xs">Résultat</StatLabel>
                                    <StatNumber fontSize="sm" color={monthlyNet >= 0 ? "green.600" : "red.600"}>
                                      {formatCurrency(monthlyNet)}
                                    </StatNumber>
                                  </Stat>
                                </SimpleGrid>
                              ) : (
                                <Alert status="warning" size="sm">
                                  <AlertIcon />
                                  <Text fontSize="xs">
                                    Ajoutez des recettes et dépenses pour compléter le scénario
                                  </Text>
                                </Alert>
                              }
                              
                              <HStack>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  leftIcon={<FiEdit3 />}
                                  onClick={async () => {
                                    await loadScenarioDetails(scenario.id);
                                    onEditScenarioOpen();
                                  }}
                                >
                                  Éditer
                                </Button>
                                <Button
                                  size="xs"
                                  colorScheme="teal"
                                  leftIcon={<FiActivity />}
                                  onClick={() => runSimulation(scenario.id)}
                                  isDisabled={!isComplete}
                                  isLoading={loading}
                                >
                                  Simuler
                                </Button>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                )}
              </VStack>
            </TabPanel>

            {/* Onglet Rapports */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Rapports Financiers</Heading>
                <Alert status="info">
                  <AlertIcon />
                  <VStack align="start" spacing={2}>
                    <Text fontWeight="bold">Rapports détaillés en développement</Text>
                    <Text fontSize="sm">
                      Prochainement : graphiques d'évolution, analyse des tendances,
                      export PDF des rapports mensuels et annuels.
                    </Text>
                  </VStack>
                </Alert>
              </VStack>
            </TabPanel>

            {/* Onglet Configuration */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading size="md">Configuration Avancée</Heading>
                
                {/* Historique des modifications de solde */}
                <Card>
                  <CardHeader>
                    <Heading size="sm">Historique des Modifications de Solde</Heading>
                  </CardHeader>
                  <CardBody>
                    {balanceHistory.length === 0 ? (
                      <Text color="gray.500" fontSize="sm">Aucune modification enregistrée</Text>
                    ) : (
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Date</Th>
                            <Th>Ancien solde</Th>
                            <Th>Nouveau solde</Th>
                            <Th>Différence</Th>
                            <Th>Raison</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {balanceHistory.slice(0, 10).map((entry, index) => (
                            <Tr key={index}>
                              <Td>{formatDate(entry.date)}</Td>
                              <Td>{formatCurrency(entry.oldBalance)}</Td>
                              <Td>{formatCurrency(entry.newBalance)}</Td>
                              <Td>
                                <Text color={entry.newBalance - entry.oldBalance >= 0 ? "green.600" : "red.600"}>
                                  {entry.newBalance - entry.oldBalance >= 0 ? "+" : ""}
                                  {formatCurrency(entry.newBalance - entry.oldBalance)}
                                </Text>
                              </Td>
                              <Td fontSize="sm">{entry.reason}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    )}
                  </CardBody>
                </Card>

                {/* Paramètres de simulation */}
                <Card>
                  <CardHeader>
                    <Heading size="sm">Paramètres de Simulation</Heading>
                  </CardHeader>
                  <CardBody>
                    <FormControl>
                      <FormLabel>Nombre de mois à projeter</FormLabel>
                      <NumberInput
                        value={simulationData.projectionMonths}
                        onChange={(value) => setSimulationData(prev => ({ ...prev, projectionMonths: parseInt(value) || 12 }))
                        }
                        min={1}
                        max={60}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Entre 1 et 60 mois (actuellement: {simulationData.projectionMonths} mois)
                      </Text>
                    </FormControl>
                  </CardBody>
                </Card>

                {/* Sécurité */}
                <Card>
                  <CardHeader>
                    <Heading size="sm">Sécurité</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack align="stretch" spacing={3}>
                      <HStack>
                        <Icon as={isBalanceLocked ? FiLock : FiUnlock} color={isBalanceLocked ? "red.500" : "green.500"} />
                        <Text fontSize="sm">
                          Solde {isBalanceLocked ? "verrouillé" : "déverrouillé"} - 
                          {isBalanceLocked ? " Code requis pour modification" : " Modification libre"}
                        </Text>
                      </HStack>
                      <Alert status="warning" size="sm">
                        <AlertIcon />
                        <Text fontSize="xs">
                          Le code de sécurité à 4 chiffres est requis pour toute modification directe du solde.
                          Contactez l'administrateur système si vous avez oublié le code.
                        </Text>
                      </Alert>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Modal Configuration */}
        <Modal isOpen={isConfigOpen} onClose={onConfigClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Configuration Rapide</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Alert status="info">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Configuration sécurisée du solde de base. Un code à 4 chiffres est requis.
                  </Text>
                </Alert>
                
                <FormControl isRequired>
                  <FormLabel>Code de sécurité (4 chiffres)</FormLabel>
                  <HStack>
                    <PinInput value={configCode} onChange={setConfigCode} type="number">
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                    </PinInput>
                  </HStack>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Nouveau solde (€)</FormLabel>
                  <NumberInput
                    value={newBalance}
                    onChange={setNewBalance}
                    precision={2}
                    step={0.01}
                  >
                    <NumberInputField placeholder="Entrez le nouveau solde" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                {newBalance && !isNaN(parseFloat(newBalance)) && (
                  <Alert status={parseFloat(newBalance) >= balance ? "success" : "warning"}>
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" fontWeight="bold">
                        Aperçu de la modification
                      </Text>
                      <Text fontSize="sm">
                        Solde actuel: {formatCurrency(balance)}
                      </Text>
                      <Text fontSize="sm">
                        Nouveau solde: {formatCurrency(parseFloat(newBalance))}
                      </Text>
                      <Text fontSize="sm" color={parseFloat(newBalance) - balance >= 0 ? "green.600" : "red.600"}>
                        Différence: {parseFloat(newBalance) - balance >= 0 ? "+" : ""}
                        {formatCurrency(parseFloat(newBalance) - balance)}
                      </Text>
                    </VStack>
                  </Alert>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onConfigClose}>
                Annuler
              </Button>
              <Button
                colorScheme="orange"
                onClick={handleBalanceConfig}
                isLoading={loading}
                leftIcon={<FiSave />}
              >
                Configurer le solde
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal Nouvelle Transaction */}
        <Modal isOpen={isTransactionOpen} onClose={onTransactionClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Nouvelle Transaction</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="CREDIT">Crédit</option>
                    <option value="DEBIT">Débit</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Montant (€)</FormLabel>
                  <NumberInput
                    value={newTransaction.amount}
                    onChange={(value) => setNewTransaction(prev => ({ ...prev, amount: value }))}
                    precision={2}
                    step={0.01}
                  >
                    <NumberInputField placeholder="0.00" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Input
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description de la transaction"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Catégorie</FormLabel>
                  <Select
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="ADHESION">Adhésion</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="CARBURANT">Carburant</option>
                    <option value="ASSURANCE">Assurance</option>
                    <option value="AUTRE">Autre</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onTransactionClose}>
                Annuler
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleAddTransaction}
                isLoading={loading}
              >
                Ajouter
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal Nouvelle Opération Programmée */}
        <Modal isOpen={isScheduledOpen} onClose={onScheduledClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Nouvelle Opération Programmée</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={newScheduled.type}
                    onChange={(e) => setNewScheduled(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="SCHEDULED_PAYMENT">Paiement programmé</option>
                    <option value="SCHEDULED_CREDIT">Crédit programmé</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Montant (€)</FormLabel>
                  <NumberInput
                    value={newScheduled.amount}
                    onChange={(value) => setNewScheduled(prev => ({ ...prev, amount: value }))}
                    precision={2}
                    step={0.01}
                  >
                    <NumberInputField placeholder="0.00" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Input
                    value={newScheduled.description}
                    onChange={(e) => setNewScheduled(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description de l'opération"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Fréquence</FormLabel>
                  <Select
                    value={newScheduled.frequency}
                    onChange={(e) => setNewScheduled(prev => ({ ...prev, frequency: e.target.value }))}
                  >
                    <option value="MONTHLY">Mensuel</option>
                    <option value="WEEKLY">Hebdomadaire</option>
                    <option value="QUARTERLY">Trimestriel</option>
                    <option value="YEARLY">Annuel</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Prochaine exécution</FormLabel>
                  <Input
                    type="date"
                    value={newScheduled.nextDate}
                    onChange={(e) => setNewScheduled(prev => ({ ...prev, nextDate: e.target.value }))}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onScheduledClose}>
                Annuler
              </Button>
              <Button
                colorScheme="purple"
                onClick={handleAddScheduledOperation}
                isLoading={loading}
              >
                Programmer
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal Nouveau Scénario de Simulation */}
        <Modal isOpen={isSimulationOpen} onClose={onSimulationClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Nouveau Scénario de Simulation</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Alert status="info">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="bold">Étape 1: Contexte du scénario</Text>
                    <Text fontSize="xs">
                      Définissez le nom et la description. Vous pourrez ajouter les recettes 
                      et dépenses dans l'étape suivante.
                    </Text>
                  </VStack>
                </Alert>

                <FormControl isRequired>
                  <FormLabel>Nom du scénario</FormLabel>
                  <Input
                    value={newScenario.name}
                    onChange={(e) => setNewScenario(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ex: Scénario optimiste 2024"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={newScenario.description}
                    onChange={(e) => setNewScenario(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez les hypothèses et le contexte de ce scénario..."
                    rows={4}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Période de projection (mois)</FormLabel>
                  <NumberInput
                    value={newScenario.projectionMonths}
                    onChange={(value) => setNewScenario(prev => ({ ...prev, projectionMonths: parseInt(value) || 12 }))
                    }
                    min={1}
                    max={60}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Entre 1 et 60 mois
                  </Text>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onSimulationClose}>
                Annuler
              </Button>
              <Button
                colorScheme="teal"
                onClick={createSimulationScenario}
                isLoading={loading}
                leftIcon={<FiActivity />}
              >
                Créer le scénario
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal Édition Scénario (recettes/dépenses) */}
        <Modal isOpen={isEditScenarioOpen} onClose={onEditScenarioClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <Text>Édition: {editingScenario?.name}</Text>
                <Badge colorScheme="blue" variant="outline">
                  Étape 2: Recettes & Dépenses
                </Badge>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {editingScenario && (
                <Grid templateColumns="1fr 1fr" gap={6}>
                  {/* Colonne Recettes */}
                  <VStack align="stretch" spacing={4}>
                    <Card>
                      <CardHeader>
                        <Heading size="sm" color="green.600">
                          💰 Recettes ({editingScenario.incomeItems?.length || 0})
                        </Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={3}>
                          {/* Formulaire ajout recette */}
                          <HStack width="100%">
                            <Input
                              placeholder="Description"
                              size="sm"
                              value={newIncomeItem.description}
                              onChange={(e) => setNewIncomeItem(prev => ({ ...prev, description: e.target.value }))}
                            />
                            <NumberInput
                              size="sm"
                              width="120px"
                              value={newIncomeItem.amount}
                              onChange={(value) => setNewIncomeItem(prev => ({ ...prev, amount: value }))}
                            >
                              <NumberInputField placeholder="Montant" />
                            </NumberInput>
                            <Select
                              size="sm"
                              width="120px"
                              value={newIncomeItem.frequency}
                              onChange={(e) => setNewIncomeItem(prev => ({ ...prev, frequency: e.target.value }))}
                            >
                              <option value="MONTHLY">Mensuel</option>
                              <option value="QUARTERLY">Trimestriel</option>
                              <option value="YEARLY">Annuel</option>
                            </Select>
                            <IconButton
                              icon={<FiPlus />}
                              size="sm"
                              colorScheme="green"
                              onClick={addIncomeItem}
                            />
                          </HStack>
                          
                          {/* Liste des recettes */}
                          <VStack width="100%" spacing={2}>
                            {editingScenario.incomeItems?.map((item, index) => (
                              <HStack key={item.id} width="100%" justify="space-between" p={2} bg="green.50" borderRadius="md">
                                <VStack align="start" spacing={0} flex={1}>
                                  <Text fontSize="sm" fontWeight="bold">{item.description}</Text>
                                  <Text fontSize="xs" color="gray.600">
                                    {formatCurrency(item.amount)} - {getFrequencyLabel(item.frequency)}
                                  </Text>
                                </VStack>
                                <IconButton
                                  icon={<FiTrash2 />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => removeIncomeItem(item.id)}
                                />
                              </HStack>
                            ))}
                          </VStack>
                          
                          {/* Total recettes */}
                          <Box width="100%" p={2} bg="green.100" borderRadius="md">
                            <Text fontSize="sm" fontWeight="bold" color="green.700">
                              Total mensuel: {formatCurrency(editingScenario.totalMonthlyIncome || 0)}
                            </Text>
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>

                  {/* Colonne Dépenses */}
                  <VStack align="stretch" spacing={4}>
                    <Card>
                      <CardHeader>
                        <Heading size="sm" color="red.600">
                          💸 Dépenses ({editingScenario.expenseItems?.length || 0})
                        </Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={3}>
                          {/* Formulaire ajout dépense */}
                          <HStack width="100%">
                            <Input
                              placeholder="Description"
                              size="sm"
                              value={newExpenseItem.description}
                              onChange={(e) => setNewExpenseItem(prev => ({ ...prev, description: e.target.value }))}
                            />
                            <NumberInput
                              size="sm"
                              width="120px"
                              value={newExpenseItem.amount}
                              onChange={(value) => setNewExpenseItem(prev => ({ ...prev, amount: value }))}
                            >
                              <NumberInputField placeholder="Montant" />
                            </NumberInput>
                            <Select
                              size="sm"
                              width="120px"
                              value={newExpenseItem.frequency}
                              onChange={(e) => setNewExpenseItem(prev => ({ ...prev, frequency: e.target.value }))}
                            >
                              <option value="MONTHLY">Mensuel</option>
                              <option value="QUARTERLY">Trimestriel</option>
                              <option value="YEARLY">Annuel</option>
                            </Select>
                            <IconButton
                              icon={<FiPlus />}
                              size="sm"
                              colorScheme="red"
                              onClick={addExpenseItem}
                            />
                          </HStack>
                          
                          {/* Liste des dépenses */}
                          <VStack width="100%" spacing={2}>
                            {editingScenario.expenseItems?.map((item, index) => (
                              <HStack key={item.id} width="100%" justify="space-between" p={2} bg="red.50" borderRadius="md">
                                <VStack align="start" spacing={0} flex={1}>
                                  <Text fontSize="sm" fontWeight="bold">{item.description}</Text>
                                  <Text fontSize="xs" color="gray.600">
                                    {formatCurrency(item.amount)} - {getFrequencyLabel(item.frequency)}
                                  </Text>
                                </VStack>
                                <IconButton
                                  icon={<FiTrash2 />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => removeExpenseItem(item.id)}
                                />
                              </HStack>
                            ))}
                          </VStack>
                          
                          {/* Total dépenses */}
                          <Box width="100%" p={2} bg="red.100" borderRadius="md">
                            <Text fontSize="sm" fontWeight="bold" color="red.700">
                              Total mensuel: {formatCurrency(editingScenario.totalMonthlyExpenses || 0)}
                            </Text>
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </Grid>
              )}
              
              {/* Résumé du scénario */}
              {editingScenario && (
                <Card mt={4}>
                  <CardBody>
                    <SimpleGrid columns={4} spacing={4}>
                      <Stat>
                        <StatLabel>Recettes/mois</StatLabel>
                        <StatNumber color="green.600">
                          {formatCurrency(editingScenario.totalMonthlyIncome || 0)}
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Dépenses/mois</StatLabel>
                        <StatNumber color="red.600">
                          {formatCurrency(editingScenario.totalMonthlyExpenses || 0)}
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Résultat/mois</StatLabel>
                        <StatNumber color={editingScenario.monthlyNet >= 0 ? "green.600" : "red.600"}>
                          {formatCurrency(editingScenario.monthlyNet || 0)}
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Éléments</StatLabel>
                        <StatNumber>
                          {(editingScenario.incomeItems?.length || 0) + (editingScenario.expenseItems?.length || 0)}
                        </StatNumber>
                      </Stat>
                    </SimpleGrid>
                  </CardBody>
                </Card>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onEditScenarioClose}>
                Fermer
              </Button>
              <Button
                colorScheme="teal"
                onClick={() => runSimulation(editingScenario?.id)}
                isLoading={loading}
                leftIcon={<FiActivity />}
                isDisabled={!editingScenario || editingScenario.itemsCount === 0}
              >
                Exécuter la simulation
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal Résultats de Simulation */}
        <Modal isOpen={isSimulationResultsOpen} onClose={onSimulationResultsClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <Text>Résultats: {simulationResults?.scenarioName}</Text>
                <Badge colorScheme={simulationResults?.summary?.isPositive ? "green" : "red"}>
                  {simulationResults?.summary?.isPositive ? "Positif" : "Déficitaire"}
                </Badge>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {simulationResults && (
                <VStack spacing={6}>
                  {/* Résumé général */}
                  <SimpleGrid columns={4} spacing={4} width="100%">
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Solde initial</StatLabel>
                          <StatNumber>{formatCurrency(simulationResults.startingBalance)}</StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Solde final</StatLabel>
                          <StatNumber color={simulationResults.finalBalance >= 0 ? "green.600" : "red.600"}>
                            {formatCurrency(simulationResults.finalBalance)}
                          </StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Évolution totale</StatLabel>
                          <StatNumber color={simulationResults.totalChange >= 0 ? "green.600" : "red.600"}>
                            <StatArrow type={simulationResults.totalChange >= 0 ? "increase" : "decrease"} />
                            {formatCurrency(Math.abs(simulationResults.totalChange))}
                          </StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Résultat/mois</StatLabel>
                          <StatNumber color={simulationResults.monthlyNet >= 0 ? "green.600" : "red.600"}>
                            {formatCurrency(simulationResults.monthlyNet)}
                          </StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>
                  </SimpleGrid>

                  {/* Projection mensuelle */}
                  <Card width="100%">
                    <CardHeader>
                      <Heading size="sm">Évolution mensuelle</Heading>
                    </CardHeader>
                    <CardBody>
                      <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Mois</Th>
                              <Th>Solde début</Th>
                              <Th isNumeric>Recettes</Th>
                              <Th isNumeric>Dépenses</Th>
                              <Th isNumeric>Résultat</Th>
                              <Th isNumeric>Solde fin</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {simulationResults.projection.slice(0, 12).map((month) => (
                              <Tr key={month.month}>
                                <Td>Mois {month.month}</Td>
                                <Td>{formatCurrency(month.startBalance)}</Td>
                                <Td isNumeric color="green.600">+{formatCurrency(month.income)}</Td>
                                <Td isNumeric color="red.600">-{formatCurrency(month.expenses)}</Td>
                                <Td isNumeric color={month.net >= 0 ? "green.600" : "red.600"}>
                                  {month.net >= 0 ? "+" : ""}{formatCurrency(month.net)}
                                </Td>
                                <Td isNumeric fontWeight="bold" color={month.endBalance >= 0 ? "green.600" : "red.600"}>
                                  {formatCurrency(month.endBalance)}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                      {simulationResults.projection.length > 12 && (
                        <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
                          ... et {simulationResults.projection.length - 12} mois supplémentaires
                        </Text>
                      )}
                    </CardBody>
                  </Card>

                  {/* Alertes */}
                  {simulationResults.summary.breakEvenMonth && (
                    <Alert status="warning" width="100%">
                      <AlertIcon />
                      <Text>
                        Attention: Le solde devient négatif au mois {simulationResults.summary.breakEvenMonth}
                      </Text>
                    </Alert>
                  )}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onSimulationResultsClose}>
                Fermer
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default AdminFinance;
