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

  // === ÉTATS SIMULATION ===
  const [simulationData, setSimulationData] = useState({
    scenarios: [],
    activeScenario: null,
    projectionMonths: 12
  });
  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    monthlyIncome: '',
    monthlyExpenses: '',
    oneTimeEvents: []
  });

  // === ÉTATS FORMULAIRES ===
  const [newTransaction, setNewTransaction] = useState({
    type: 'CREDIT',
    amount: '',
    description: '',
    category: 'ADHESION',
    date: new Date().toISOString().split('T')[0]
  });
  const [newScheduled, setNewScheduled] = useState({
    type: 'SCHEDULED_PAYMENT',
    amount: '',
    description: '',
    frequency: 'MONTHLY',
    nextDate: new Date().toISOString().split('T')[0],
    isActive: true
  });

  // === MODALS ===
  const { isOpen: isTransactionOpen, onOpen: onTransactionOpen, onClose: onTransactionClose } = useDisclosure();
  const { isOpen: isScheduledOpen, onOpen: onScheduledOpen, onClose: onScheduledClose } = useDisclosure();
  const { isOpen: isSimulationOpen, onOpen: onSimulationOpen, onClose: onSimulationClose } = useDisclosure();
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

  const loadSimulationData = async () => {
    try {
      const response = await fetch('/api/finance/simulations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSimulationData(prev => ({
          ...prev,
          scenarios: data.scenarios || []
        }));
      }
    } catch (error) {
      console.error('❌ Erreur chargement simulations:', error);
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
    if (!newScenario.name || !newScenario.monthlyIncome || !newScenario.monthlyExpenses) {
      toast({
        status: "warning",
        title: "Champs requis",
        description: "Nom, revenus et dépenses mensuels sont obligatoires",
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
        body: JSON.stringify({
          ...newScenario,
          monthlyIncome: parseFloat(newScenario.monthlyIncome),
          monthlyExpenses: parseFloat(newScenario.monthlyExpenses),
          startingBalance: balance
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSimulationData(prev => ({
          ...prev,
          scenarios: [...prev.scenarios, data.scenario]
        }));
        
        setNewScenario({
          name: '',
          description: '',
          monthlyIncome: '',
          monthlyExpenses: '',
          oneTimeEvents: []
        });
        
        toast({
          status: "success",
          title: "Scénario créé",
          description: "Le scénario de simulation a été créé avec succès",
          duration: 3000,
          isClosable: true
        });
        
        onSimulationClose();
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

  const runSimulation = (scenario) => {
    const projection = [];
    let currentBalance = balance;
    
    for (let month = 0; month < simulationData.projectionMonths; month++) {
      const monthlyNet = scenario.monthlyIncome - scenario.monthlyExpenses;
      currentBalance += monthlyNet;
      
      // Appliquer les événements ponctuels
      scenario.oneTimeEvents?.forEach(event => {
        if (event.month === month) {
          currentBalance += event.amount;
        }
      });
      
      projection.push({
        month: month + 1,
        balance: currentBalance,
        income: scenario.monthlyIncome,
        expenses: scenario.monthlyExpenses,
        net: monthlyNet
      });
    }
    
    return projection;
  };

  // === GESTION DES TRANSACTIONS ===
  const handleAddTransaction = async () => {
    try {
      if (!newTransaction.amount || !newTransaction.description) {
        toast({
          status: "warning",
          title: "Champs requis",
          description: "Montant et description sont obligatoires",
          duration: 3000,
          isClosable: true
        });
        return;
      }

      setLoading(true);
      
      const response = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newTransaction,
          amount: parseFloat(newTransaction.amount)
        })
      });

      if (response.ok) {
        toast({
          status: "success",
          title: "Transaction ajoutée",
          duration: 2000,
          isClosable: true
        });
        
        setNewTransaction({
          type: 'CREDIT',
          amount: '',
          description: '',
          category: 'ADHESION',
          date: new Date().toISOString().split('T')[0]
        });
        
        await loadFinancialData();
        onTransactionClose();
      } else {
        throw new Error('Erreur lors de l\'ajout');
      }
    } catch (error) {
      console.error('❌ Erreur ajout transaction:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible d'ajouter la transaction",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  // === GESTION DES OPÉRATIONS PROGRAMMÉES ===
  const handleAddScheduledOperation = async () => {
    try {
      if (!newScheduled.amount || !newScheduled.description) {
        toast({
          status: "warning",
          title: "Champs requis",
          description: "Montant et description sont obligatoires",
          duration: 3000,
          isClosable: true
        });
        return;
      }

      setLoading(true);
      
      const response = await fetch('/api/finance/scheduled-operations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newScheduled,
          amount: parseFloat(newScheduled.amount)
        })
      });

      if (response.ok) {
        toast({
          status: "success",
          title: "Opération programmée ajoutée",
          duration: 2000,
          isClosable: true
        });
        
        setNewScheduled({
          type: 'SCHEDULED_PAYMENT',
          amount: '',
          description: '',
          frequency: 'MONTHLY',
          nextDate: new Date().toISOString().split('T')[0],
          isActive: true
        });
        
        await loadScheduledOperations();
        onScheduledClose();
      } else {
        throw new Error('Erreur lors de l\'ajout');
      }
    } catch (error) {
      console.error('❌ Erreur ajout opération programmée:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible d'ajouter l'opération programmée",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleScheduledOperation = async (id, isActive) => {
    try {
      const response = await fetch(`/api/finance/scheduled-operations/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        await loadScheduledOperations();
        toast({
          status: "success",
          title: `Opération ${!isActive ? 'activée' : 'désactivée'}`,
          duration: 2000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('❌ Erreur toggle opération:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible de modifier l'opération",
        duration: 3000,
        isClosable: true
      });
    }
  };

  // === STATISTIQUES ===
  const getFinancialStats = () => {
    const totalCredits = transactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalDebits = transactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const thisMonth = new Date();
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date || t.createdAt);
      return transactionDate.getMonth() === thisMonth.getMonth() &&
             transactionDate.getFullYear() === thisMonth.getFullYear();
    });
    
    const monthlyBalance = monthlyTransactions
      .reduce((sum, t) => sum + (t.type === 'CREDIT' ? t.amount : -t.amount), 0);

    const scheduledMonthlyImpact = scheduledOperations
      .filter(op => op.isActive && op.frequency === 'MONTHLY')
      .reduce((sum, op) => sum + (op.type === 'SCHEDULED_CREDIT' ? op.amount : -op.amount), 0);

    return {
      balance,
      totalCredits,
      totalDebits,
      monthlyBalance,
      scheduledMonthlyImpact,
      transactionCount: transactions.length,
      scheduledCount: scheduledOperations.filter(op => op.isActive).length,
      projectedNextMonth: balance + monthlyBalance + scheduledMonthlyImpact
    };
  };

  const stats = getFinancialStats();

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
                        Créez des scénarios pour simuler l'évolution de votre trésorerie
                        sur plusieurs mois avec différentes hypothèses de revenus et dépenses.
                      </Text>
                    </VStack>
                  </Alert>
                ) : (
                  <Accordion allowToggle>
                    {simulationData.scenarios.map((scenario, index) => {
                      const projection = runSimulation(scenario);
                      const finalBalance = projection[projection.length - 1]?.balance || 0;
                      const isPositive = finalBalance >= balance;
                      
                      return (
                        <AccordionItem key={scenario.id || index}>
                          <AccordionButton>
                            <Box flex="1" textAlign="left">
                              <HStack>
                                <Text fontWeight="bold">{scenario.name}</Text>
                                <Badge
                                  colorScheme={isPositive ? "green" : "red"}
                                  variant="subtle"
                                >
                                  {isPositive ? "Positif" : "Négatif"}
                                </Badge>
                                <Text fontSize="sm" color="gray.600">
                                  Projection {simulationData.projectionMonths} mois: {formatCurrency(finalBalance)}
                                </Text>
                              </HStack>
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            <VStack align="stretch" spacing={4}>
                              <Text fontSize="sm" color="gray.600">
                                {scenario.description}
                              </Text>
                              
                              <SimpleGrid columns={3} spacing={4}>
                                <Card>
                                  <CardBody>
                                    <Stat size="sm">
                                      <StatLabel>Revenus/mois</StatLabel>
                                      <StatNumber color="green.600">
                                        {formatCurrency(scenario.monthlyIncome)}
                                      </StatNumber>
                                    </Stat>
                                  </CardBody>
                                </Card>
                                <Card>
                                  <CardBody>
                                    <Stat size="sm">
                                      <StatLabel>Dépenses/mois</StatLabel>
                                      <StatNumber color="red.600">
                                        {formatCurrency(scenario.monthlyExpenses)}
                                      </StatNumber>
                                    </Stat>
                                  </CardBody>
                                </Card>
                                <Card>
                                  <CardBody>
                                    <Stat size="sm">
                                      <StatLabel>Résultat/mois</StatLabel>
                                      <StatNumber color={scenario.monthlyIncome - scenario.monthlyExpenses >= 0 ? "green.600" : "red.600"}>
                                        {formatCurrency(scenario.monthlyIncome - scenario.monthlyExpenses)}
                                      </StatNumber>
                                    </Stat>
                                  </CardBody>
                                </Card>
                              </SimpleGrid>

                              <Card>
                                <CardHeader>
                                  <Heading size="sm">Évolution projetée</Heading>
                                </CardHeader>
                                <CardBody>
                                  <VStack align="stretch" spacing={2}>
                                    {projection.slice(0, 6).map((month, idx) => (
                                      <HStack key={idx} justify="space-between">
                                        <Text fontSize="sm">Mois {month.month}</Text>
                                        <HStack>
                                          <Text fontSize="sm" color="green.600">
                                            +{formatCurrency(month.income)}
                                          </Text>
                                          <Text fontSize="sm" color="red.600">
                                            -{formatCurrency(month.expenses)}
                                          </Text>
                                          <Text fontSize="sm" fontWeight="bold" color={month.balance >= 0 ? "green.600" : "red.600"}>
                                            = {formatCurrency(month.balance)}
                                          </Text>
                                        </HStack>
                                      </HStack>
                                    ))}
                                    {projection.length > 6 && (
                                      <Text fontSize="xs" color="gray.500" textAlign="center">
                                        ... et {projection.length - 6} mois de plus
                                      </Text>
                                    )}
                                  </VStack>
                                </CardBody>
                              </Card>
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
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
                  <Text fontSize="sm">
                    Créez un scénario pour simuler l'évolution de votre trésorerie
                    sur {simulationData.projectionMonths} mois avec des hypothèses de revenus et dépenses.
                  </Text>
                </Alert>

                <FormControl isRequired>
                  <FormLabel>Nom du scénario</FormLabel>
                  <Input
                    value={newScenario.name}
                    onChange={(e) => setNewScenario(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ex: Scénario optimiste 2024"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={newScenario.description}
                    onChange={(e) => setNewScenario(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez les hypothèses de ce scénario..."
                    rows={3}
                  />
                </FormControl>

                <SimpleGrid columns={2} spacing={4} width="100%">
                  <FormControl isRequired>
                    <FormLabel>Revenus mensuels (€)</FormLabel>
                    <NumberInput
                      value={newScenario.monthlyIncome}
                      onChange={(value) => setNewScenario(prev => ({ ...prev, monthlyIncome: value }))}
                      precision={2}
                      step={100}
                    >
                      <NumberInputField placeholder="0.00" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Dépenses mensuelles (€)</FormLabel>
                    <NumberInput
                      value={newScenario.monthlyExpenses}
                      onChange={(value) => setNewScenario(prev => ({ ...prev, monthlyExpenses: value }))}
                      precision={2}
                      step={100}
                    >
                      <NumberInputField placeholder="0.00" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>

                {newScenario.monthlyIncome && newScenario.monthlyExpenses && (
                  <Alert status={parseFloat(newScenario.monthlyIncome) >= parseFloat(newScenario.monthlyExpenses) ? "success" : "warning"}>
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" fontWeight="bold">Aperçu du scénario</Text>
                      <Text fontSize="sm">
                        Résultat mensuel: {formatCurrency(parseFloat(newScenario.monthlyIncome) - parseFloat(newScenario.monthlyExpenses))}
                      </Text>
                      <Text fontSize="sm">
                        Évolution sur {simulationData.projectionMonths} mois: 
                        {formatCurrency(balance + (parseFloat(newScenario.monthlyIncome) - parseFloat(newScenario.monthlyExpenses)) * simulationData.projectionMonths)}
                      </Text>
                    </VStack>
                  </Alert>
                )}
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
      </VStack>
    </Box>
  );
};

export default AdminFinance;
