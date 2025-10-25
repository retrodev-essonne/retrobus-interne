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
  // === ÉTATS PRINCIPAUX ===
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // États financiers
  const [balance, setBalance] = useState(0);
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState(null);
  const [isBalanceLocked, setIsBalanceLocked] = useState(true);
  
  // Ajouter l'état stats manquant
  const [stats, setStats] = useState({
    balance: 0,
    totalCredits: 0,
    totalDebits: 0,
    monthlyBalance: 0,
    scheduledMonthlyImpact: 0,
    scheduledCount: 0,
    projectedNextMonth: 0
  });
  
  // États des transactions
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    type: 'CREDIT',
    amount: '',
    description: '',
    category: 'ADHESION',
    date: new Date().toISOString().split('T')[0]
  });
  
  // États des opérations programmées
  const [scheduledOperations, setScheduledOperations] = useState([]);
  const [newScheduled, setNewScheduled] = useState({
    type: 'SCHEDULED_PAYMENT',
    amount: '',
    description: '',
    frequency: 'MONTHLY',
    nextDate: new Date().toISOString().split('T')[0]
  });
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [paymentPeriod, setPaymentPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentsList, setPaymentsList] = useState([]);
  
  // États de configuration
  const [showBalanceConfig, setShowBalanceConfig] = useState(false);
  const [configCode, setConfigCode] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [balanceHistory, setBalanceHistory] = useState([]);
  
  // États simulation
  const [simulationData, setSimulationData] = useState({
    scenarios: [],
    activeScenario: null,
    projectionMonths: 12
  });
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);
  const [editingScenario, setEditingScenario] = useState(null);

  // Formulaires simulation
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

  // Notes de frais (Expense Reports)
  const [expenseReports, setExpenseReports] = useState([]);
  const [newExpenseReport, setNewExpenseReport] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Toast
  const toast = useToast();

  // Modals
  const { isOpen: isConfigOpen, onOpen: onConfigOpen, onClose: onConfigClose } = useDisclosure();
  const { isOpen: isTransactionOpen, onOpen: onTransactionOpen, onClose: onTransactionClose } = useDisclosure();
  const { isOpen: isScheduledOpen, onOpen: onScheduledOpen, onClose: onScheduledClose } = useDisclosure();
  const { isOpen: isSimulationOpen, onOpen: onSimulationOpen, onClose: onSimulationClose } = useDisclosure();
  const { isOpen: isEditScenarioOpen, onOpen: onEditScenarioOpen, onClose: onEditScenarioClose } = useDisclosure();
  const { isOpen: isSimulationResultsOpen, onOpen: onSimulationResultsOpen, onClose: onSimulationResultsClose } = useDisclosure();
  const { isOpen: isDeclarePaymentOpen, onOpen: onDeclarePaymentOpen, onClose: onDeclarePaymentClose } = useDisclosure();
  const { isOpen: isPaymentsListOpen, onOpen: onPaymentsListOpen, onClose: onPaymentsListClose } = useDisclosure();

  // === API HELPERS ===
  // Base API: prefer same-origin relative in prod to avoid CORS; in local dev use VITE_API_* or localhost:3000
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '5173');
  const API_BASE = (
    isLocal ? (import.meta?.env?.VITE_API_BASE_URL || import.meta?.env?.VITE_API_URL || 'http://localhost:3000') : ''
  ).replace(/\/$/, '');
  const apiUrl = (path) => `${API_BASE}${path}`;

  // === FONCTIONS DE CHARGEMENT ===
  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Charger toutes les données en parallèle
      await Promise.all([
        loadBalance(),
        loadTransactions(),
        loadScheduledOperations(),
        loadSimulationData(),
        loadBalanceHistory(),
        loadExpenseReports()
      ]);
      
    } catch (error) {
      console.error('❌ Erreur chargement données financières:', error);
      toast({
        status: "error",
        title: "Erreur de chargement",
        description: "Impossible de charger les données financières",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const response = await fetch(apiUrl('/api/finance/balance'), {
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

  const loadTransactions = async () => {
    try {
      const response = await fetch(apiUrl('/api/finance/transactions'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
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
      const response = await fetch(apiUrl('/api/finance/scheduled-operations'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setScheduledOperations(data.operations || []);
      } else {
        console.warn('⚠️ Opérations programmées non disponibles');
        setScheduledOperations([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement opérations programmées:', error);
      setScheduledOperations([]);
    }
  };

  const loadPaymentsForOperation = async (operationId) => {
    try {
      const response = await fetch(apiUrl(`/api/finance/scheduled-operations/${operationId}/payments`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPaymentsList(data.payments || []);
      } else {
        setPaymentsList([]);
      }
    } catch (e) {
      console.error('❌ Erreur chargement paiements échéance:', e);
      setPaymentsList([]);
    }
  };

  const loadSimulationData = async () => {
    try {
      const response = await fetch(apiUrl('/api/finance/simulations'), {
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
      } else {
        console.warn('⚠️ Simulations non disponibles');
        setSimulationData(prev => ({ ...prev, scenarios: [] }));
      }
    } catch (error) {
      console.error('❌ Erreur chargement simulations:', error);
      setSimulationData(prev => ({ ...prev, scenarios: [] }));
    }
  };

  const loadBalanceHistory = async () => {
    try {
      const response = await fetch(apiUrl('/api/finance/balance/history'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBalanceHistory(data.history || []);
      } else {
        console.warn('⚠️ Historique non disponible');
        setBalanceHistory([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement historique:', error);
      setBalanceHistory([]);
    }
  };

  const loadExpenseReports = async () => {
    try {
      const response = await fetch(apiUrl('/api/finance/expense-reports'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setExpenseReports(data.reports || []);
      } else {
        setExpenseReports([]);
      }
    } catch (e) {
      console.error('❌ Erreur chargement notes de frais:', e);
      setExpenseReports([]);
    }
  };

  // Ajouter l'état manquant pour les droits utilisateur
  const [canModifyBalance, setCanModifyBalance] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const loadUserInfo = async () => {
    try {
      const response = await fetch(apiUrl('/api/me'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);

        // Autoriser la modification du solde via code sécurisé uniquement (sans dépendre du matricule)
        setCanModifyBalance(true);
        console.log('👤 Utilisateur connecté:', userData.matricule, '- Modification du solde contrôlée par code');
      }
    } catch (error) {
      console.error('❌ Erreur chargement utilisateur:', error);
    }
  };

  // Calculer les stats après chargement des données
  const calculateStats = () => {
    const totalCredits = transactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalDebits = transactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Transactions du mois en cours
    const thisMonth = new Date();
    const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const monthEnd = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0);
    
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date || t.createdAt);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });
    
    const monthlyCredits = monthlyTransactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const monthlyDebits = monthlyTransactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const monthlyBalance = monthlyCredits - monthlyDebits;
    
    // Impact mensuel des opérations programmées
    const scheduledMonthlyImpact = scheduledOperations
      .filter(op => op.isActive)
      .reduce((sum, op) => {
        const multiplier = getFrequencyMultiplier(op.frequency);
        const impact = op.type === 'SCHEDULED_CREDIT' ? (op.amount || 0) : -(op.amount || 0);
        return sum + (impact * multiplier);
      }, 0);
    
    const projectedNextMonth = balance + monthlyBalance + scheduledMonthlyImpact;
    
    setStats({
      balance,
      totalCredits,
      totalDebits,
      monthlyBalance,
      scheduledMonthlyImpact,
      scheduledCount: scheduledOperations.filter(op => op.isActive).length,
      projectedNextMonth
    });
  };

  // === FONCTIONS UTILITAIRES ===
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

  const getCategoryLabel = (category) => {
    const categories = {
      'ADHESION': 'Adhésion',
      'MAINTENANCE': 'Maintenance',
      'CARBURANT': 'Carburant',
      'ASSURANCE': 'Assurance',
      'AUTRE': 'Autre'
    };
    return categories[category] || category;
  };

  // Helpers manquants pour fréquences
  const getFrequencyMultiplier = (frequency) => {
    switch (frequency) {
      case 'WEEKLY': return 4.33;
      case 'QUARTERLY': return 1 / 3;
      case 'YEARLY': return 1 / 12;
      case 'MONTHLY':
      default: return 1;
    }
  };

  const getFrequencyLabel = (frequency) => {
    switch (frequency) {
      case 'WEEKLY': return 'Hebdomadaire';
      case 'QUARTERLY': return 'Trimestriel';
      case 'YEARLY': return 'Annuel';
      case 'MONTHLY':
      default: return 'Mensuel';
    }
  };

  // === FONCTIONS D'ACTIONS ===
  const handleBalanceConfig = async () => {
    // La modification est autorisée pour tout utilisateur authentifié, si le code est correct

    if (!configCode || configCode.length !== 4) {
      toast({
        status: "warning",
        title: "Code requis",
        description: "Veuillez saisir le code à 4 chiffres (0920)",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    if (configCode !== '0920') {
      toast({
        status: "error",
        title: "Code incorrect",
        description: "Le code de sécurité n'est pas valide",
        duration: 4000,
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
      
      const response = await fetch(apiUrl('/api/finance/balance/configure'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: configCode,
          newBalance: parseFloat(newBalance),
          reason: balanceReason?.trim() || `Mise à jour manuelle du solde par ${currentUser?.matricule || currentUser?.username || 'inconnu'} - ${new Date().toLocaleDateString('fr-FR')}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data.newBalance);
        setConfigCode('');
        setNewBalance('');
  setBalanceReason('');
        setShowBalanceConfig(false);
        onConfigClose();
        
        toast({
          status: "success",
          title: "Solde mis à jour",
          description: `Nouveau solde: ${formatCurrency(data.newBalance)} (différence: ${data.difference >= 0 ? '+' : ''}${formatCurrency(data.difference)})`,
          duration: 5000,
          isClosable: true
        });
        
        // Recharger les données
        await loadBalanceHistory();
        await loadBalance();
      } else {
        // Safely parse error body (JSON or text/HTML)
        const raw = await response.text().catch(() => '');
        let errorData = {};
        try { errorData = raw ? JSON.parse(raw) : {}; } catch { errorData = { message: raw?.slice(0, 200) || 'Erreur inconnue' }; }
        
        if (response.status === 403) {
          toast({
            status: "error",
            title: "Accès refusé",
            description: "Vous n'avez pas l'autorisation de modifier le solde",
            duration: 5000,
            isClosable: true
          });
        } else if (response.status === 401) {
          toast({
            status: "error",
            title: "Code incorrect",
            description: "Le code de sécurité 0920 est incorrect",
            duration: 4000,
            isClosable: true
          });
        } else {
          toast({
            status: "error",
            title: "Erreur de configuration",
            description: errorData.message || "Erreur serveur",
            duration: 4000,
            isClosable: true
          });
        }
      }
    } catch (error) {
      console.error('❌ Erreur configuration solde:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible de configurer le solde. Vérifiez votre connexion.",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  // CRUD Notes de frais
  const createExpenseReport = async () => {
    if (!newExpenseReport.description || !newExpenseReport.amount) {
      toast({ status: 'warning', title: 'Champs requis', description: 'Description et montant sont obligatoires' });
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/finance/expense-reports'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: newExpenseReport.description,
          amount: parseFloat(newExpenseReport.amount),
          date: newExpenseReport.date
        })
      });
      if (response.ok) {
        toast({ status: 'success', title: 'Note de frais ajoutée' });
        setNewExpenseReport({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
        await loadExpenseReports();
      } else {
        const err = await response.json().catch(() => ({}));
        toast({ status: 'error', title: 'Erreur', description: err.message || "Impossible d'ajouter la note de frais" });
      }
    } catch (e) {
      console.error('❌ Erreur création note de frais:', e);
      toast({ status: 'error', title: 'Erreur', description: "Impossible d'ajouter la note de frais" });
    } finally {
      setLoading(false);
    }
  };

  const updateExpenseReportStatus = async (id, status) => {
    try {
      const response = await fetch(apiUrl(`/api/finance/expense-reports/${id}`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        await loadExpenseReports();
      } else {
        toast({ status: 'error', title: 'Erreur', description: "Mise à jour du statut impossible" });
      }
    } catch (e) {
      console.error('❌ Erreur MAJ statut note de frais:', e);
      toast({ status: 'error', title: 'Erreur', description: "Mise à jour du statut impossible" });
    }
  };

  const deleteExpenseReport = async (id) => {
    try {
      const response = await fetch(apiUrl(`/api/finance/expense-reports/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        toast({ status: 'success', title: 'Note de frais supprimée' });
        await loadExpenseReports();
      } else {
        toast({ status: 'error', title: 'Erreur', description: "Suppression impossible" });
      }
    } catch (e) {
      console.error('❌ Erreur suppression note de frais:', e);
      toast({ status: 'error', title: 'Erreur', description: "Suppression impossible" });
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.type || !newTransaction.amount || !newTransaction.description) {
      toast({
        status: "warning",
        title: "Champs requis",
        description: "Type, montant et description sont obligatoires",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(apiUrl('/api/finance/transactions'), {
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
          description: "La transaction a été enregistrée avec succès",
          duration: 3000,
          isClosable: true
        });
        
        setNewTransaction({
          type: 'CREDIT',
          amount: '',
          description: '',
          category: 'ADHESION',
          date: new Date().toISOString().split('T')[0]
        });
        
        onTransactionClose();
        
        // Recharger les données
        await loadTransactions();
        await loadBalance();
      } else {
        const errorData = await response.json();
        toast({
          status: "error",
          title: "Erreur",
          description: errorData.message || "Impossible d'ajouter la transaction",
          duration: 4000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('❌ Erreur ajout transaction:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible d'ajouter la transaction. Vérifiez votre connexion.",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddScheduledOperation = async () => {
    if (!newScheduled.type || !newScheduled.amount || !newScheduled.description || !newScheduled.frequency || !newScheduled.nextDate) {
      toast({
        status: "warning",
        title: "Champs requis",
        description: "Tous les champs sont obligatoires",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(apiUrl('/api/finance/scheduled-operations'), {
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
          title: "Opération programmée",
          description: "L'opération a été programmée avec succès",
          duration: 3000,
          isClosable: true
        });
        
        setNewScheduled({
          type: 'SCHEDULED_PAYMENT',
          amount: '',
          description: '',
          frequency: 'MONTHLY',
          nextDate: new Date().toISOString().split('T')[0]
        });
        
        onScheduledClose();
        
        // Recharger les données
        await loadScheduledOperations();
      } else {
        const errorData = await response.json();
        toast({
          status: "error",
          title: "Erreur",
          description: errorData.message || "Impossible de programmer l'opération",
          duration: 4000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('❌ Erreur programmation opération:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible de programmer l'opération. Vérifiez votre connexion.",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleScheduledOperation = async (id, currentStatus) => {
    try {
      const response = await fetch(apiUrl(`/api/finance/scheduled-operations/${id}`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      });

      if (response.ok) {
        toast({
          status: "success",
          title: `Opération ${!currentStatus ? 'activée' : 'désactivée'}`,
          duration: 2000,
          isClosable: true
        });
        
        // Recharger les données
        await loadScheduledOperations();
      }
    } catch (error) {
      console.error('❌ Erreur toggle opération:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible de modifier le statut de l'opération",
        duration: 4000,
        isClosable: true
      });
    }
  };

  const openDeclarePayment = (operation) => {
    setSelectedOperation(operation);
    setPaymentAmount(operation.amount || '');
    const baseDate = operation.nextDate ? new Date(operation.nextDate) : new Date();
    const period = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`;
    setPaymentPeriod(period);
    setPaymentFile(null);
    onDeclarePaymentOpen();
  };

  const submitPaymentDeclaration = async () => {
    if (!selectedOperation) return;
    if (!paymentPeriod || !/^\d{4}-\d{2}$/.test(paymentPeriod)) {
      toast({ status: 'warning', title: 'Période invalide', description: 'Format attendu: YYYY-MM' });
      return;
    }
    if (!paymentAmount || isNaN(parseFloat(paymentAmount))) {
      toast({ status: 'warning', title: 'Montant invalide', description: 'Veuillez saisir un montant valide' });
      return;
    }
    if (!paymentFile) {
      toast({ status: 'warning', title: 'Pièce justificative requise', description: "Ajoutez l'attestation ou la photo" });
      return;
    }
    try {
      setLoading(true);
      const form = new FormData();
      form.append('period', paymentPeriod);
      form.append('amount', String(parseFloat(paymentAmount)));
      form.append('attachment', paymentFile);
      const response = await fetch(apiUrl(`/api/finance/scheduled-operations/${selectedOperation.id}/payments`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: form
      });
      if (response.ok) {
        toast({ status: 'success', title: 'Mensualité déclarée payée' });
        onDeclarePaymentClose();
        await loadScheduledOperations();
      } else {
        const err = await response.json().catch(() => ({}));
        toast({ status: 'error', title: 'Erreur', description: err.message || 'Déclaration impossible' });
      }
    } catch (e) {
      console.error('❌ Erreur déclaration paiement:', e);
      toast({ status: 'error', title: 'Erreur', description: 'Déclaration impossible' });
    } finally {
      setLoading(false);
    }
  };

  const openPaymentsList = async (operation) => {
    setSelectedOperation(operation);
    await loadPaymentsForOperation(operation.id);
    onPaymentsListOpen();
  };

  // Charger les données au montage du composant
  useEffect(() => {
    const initializeData = async () => {
      await loadUserInfo();
      await loadFinancialData();
    };
    
    initializeData();
  }, []);

  // Re-calculer les stats quand les données changent
  useEffect(() => {
    if (transactions.length >= 0 && scheduledOperations.length >= 0) {
      calculateStats();
    }
  }, [transactions, scheduledOperations, balance]);

  // === FONCTIONS SIMULATION ===
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
      
      const response = await fetch(apiUrl('/api/finance/simulations'), {
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
      } else {
        const errorData = await response.json();
        toast({
          status: "error",
          title: "Erreur",
          description: errorData.message || "Impossible de créer le scénario",
          duration: 4000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('❌ Erreur création scénario:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible de créer le scénario. Vérifiez votre connexion.",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const loadScenarioDetails = async (scenarioId) => {
    try {
      const response = await fetch(apiUrl(`/api/finance/simulations/${scenarioId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEditingScenario(data.scenario);
      } else {
        toast({
          status: "error",
          title: "Erreur",
          description: "Impossible de charger les détails du scénario",
          duration: 4000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('❌ Erreur chargement détails scénario:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible de charger les détails du scénario",
        duration: 4000,
        isClosable: true
      });
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
      const response = await fetch(apiUrl(`/api/finance/simulations/${editingScenario.id}/income`), {
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
      } else {
        const errorData = await response.json();
        toast({
          status: "error",
          title: "Erreur",
          description: errorData.message || "Impossible d'ajouter la recette",
          duration: 4000,
          isClosable: true
        });
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
      const response = await fetch(apiUrl(`/api/finance/simulations/${editingScenario.id}/expense`), {
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
      } else {
        const errorData = await response.json();
        toast({
          status: "error",
          title: "Erreur",
          description: errorData.message || "Impossible d'ajouter la dépense",
          duration: 4000,
          isClosable: true
        });
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
      const response = await fetch(apiUrl(`/api/finance/simulations/income/${itemId}`), {
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
      } else {
        toast({
          status: "error",
          title: "Erreur",
          description: "Impossible de supprimer la recette",
          duration: 4000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('❌ Erreur suppression recette:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible de supprimer la recette",
        duration: 4000,
        isClosable: true
      });
    }
  };

  const removeExpenseItem = async (itemId) => {
    try {
      const response = await fetch(apiUrl(`/api/finance/simulations/expense/${itemId}`), {
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
      } else {
        toast({
          status: "error",
          title: "Erreur",
          description: "Impossible de supprimer la dépense",
          duration: 4000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('❌ Erreur suppression dépense:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible de supprimer la dépense",
        duration: 4000,
        isClosable: true
      });
    }
  };

  const runSimulation = async (scenarioId) => {
    try {
      setLoading(true);
      
      const response = await fetch(apiUrl(`/api/finance/simulations/${scenarioId}/run`), {
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
      } else {
        const errorData = await response.json();
        toast({
          status: "error",
          title: "Erreur",
          description: errorData.message || "Impossible d'exécuter la simulation",
          duration: 4000,
          isClosable: true
        });
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

  const deleteScenario = async (scenarioId) => {
    try {
      const response = await fetch(apiUrl(`/api/finance/simulations/${scenarioId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          status: "success",
          title: "Scénario supprimé",
          duration: 2000,
          isClosable: true
        });
        
        await loadSimulationData();
      } else {
        toast({
          status: "error",
          title: "Erreur",
          description: "Impossible de supprimer le scénario",
          duration: 4000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('❌ Erreur suppression scénario:', error);
      toast({
        status: "error",
        title: "Erreur",
        description: "Impossible de supprimer le scénario",
        duration: 4000,
        isClosable: true
      });
    }
  };

  const downloadScenarioPdf = async (scenarioId, name = 'simulation') => {
    try {
      const response = await fetch(apiUrl(`/api/finance/simulations/${scenarioId}/report.pdf`), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) {
        toast({ status: 'error', title: 'Export PDF', description: 'Échec de la génération du PDF' });
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safe = (name || 'simulation').replace(/[^a-z0-9-_]+/gi, '_');
      a.download = `simulation-${safe}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ status: 'success', title: 'Export PDF', description: 'Téléchargement démarré' });
    } catch (e) {
      console.error('❌ Erreur export PDF:', e);
      toast({ status: 'error', title: 'Export PDF', description: 'Erreur lors du téléchargement' });
    }
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
                <Input
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  placeholder="Motif de régularisation"
                  width="280px"
                  size="sm"
                />
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
            {/* Nouvel onglet Notes de frais */}
            <Tab>🧾 Notes de frais</Tab>
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
                            <Th isNumeric>Payées</Th>
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
                              <Td isNumeric>
                                <Badge variant="subtle" colorScheme="blue">{operation.payments?.length || 0}</Badge>
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
                                    <MenuItem onClick={() => openDeclarePayment(operation)}>Déclarer mensualité payée</MenuItem>
                                    <MenuItem onClick={() => openPaymentsList(operation)}>Voir paiements</MenuItem>
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

            {/* Onglet Notes de frais */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">Notes de frais</Heading>
                </HStack>

                {/* Formulaire de création */}
                <Card>
                  <CardBody>
                    <HStack spacing={3} align="end">
                      <FormControl isRequired>
                        <FormLabel>Description</FormLabel>
                        <Input
                          value={newExpenseReport.description}
                          onChange={(e) => setNewExpenseReport(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Ex: Achat fournitures"
                        />
                      </FormControl>
                      <FormControl isRequired width="220px">
                        <FormLabel>Montant (€)</FormLabel>
                        <NumberInput
                          value={newExpenseReport.amount}
                          onChange={(v) => setNewExpenseReport(prev => ({ ...prev, amount: v }))}
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
                      <FormControl width="220px">
                        <FormLabel>Date</FormLabel>
                        <Input
                          type="date"
                          value={newExpenseReport.date}
                          onChange={(e) => setNewExpenseReport(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </FormControl>
                      <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={createExpenseReport}>
                        Ajouter
                      </Button>
                    </HStack>
                  </CardBody>
                </Card>

                {/* Liste des notes de frais */}
                {expenseReports.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    Aucune note de frais pour le moment
                  </Alert>
                ) : (
                  <Card>
                    <CardBody p={0}>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Date</Th>
                            <Th>Description</Th>
                            <Th isNumeric>Montant</Th>
                            <Th>Statut</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {expenseReports.map((r) => (
                            <Tr key={r.id}>
                              <Td>{formatDate(r.date || r.createdAt)}</Td>
                              <Td>{r.description}</Td>
                              <Td isNumeric>{formatCurrency(r.amount)}</Td>
                              <Td>
                                <Badge colorScheme={
                                  r.status === 'PAID' ? 'green' : r.status === 'APPROVED' ? 'blue' : r.status === 'REJECTED' ? 'red' : 'orange'
                                }>
                                  {r.status}
                                </Badge>
                              </Td>
                              <Td>
                                <HStack>
                                  <Button size="xs" onClick={() => updateExpenseReportStatus(r.id, 'APPROVED')} leftIcon={<FiCheck />} colorScheme="blue" variant="outline">Approuver</Button>
                                  <Button size="xs" onClick={() => updateExpenseReportStatus(r.id, 'PAID')} leftIcon={<FiDollarSign />} colorScheme="green" variant="outline">Payé</Button>
                                  <Button size="xs" onClick={() => updateExpenseReportStatus(r.id, 'REJECTED')} leftIcon={<FiX />} colorScheme="red" variant="outline">Rejeter</Button>
                                  <IconButton aria-label="Supprimer" icon={<FiTrash2 />} size="xs" colorScheme="red" variant="ghost" onClick={() => deleteExpenseReport(r.id)} />
                                </HStack>
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
                                  <MenuItem 
                                    icon={<FiDownload />}
                                    onClick={() => downloadScenarioPdf(scenario.id, scenario.name)}
                                    isDisabled={!isComplete}
                                  >
                                    Exporter PDF
                                  </MenuItem>
                                  <Divider />
                                  <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => {
                                    if (confirm('Supprimer ce scénario ?')) deleteScenario(scenario.id);
                                  }}>
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
                              )}
                              
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

        {/* Modal Déclarer mensualité payée */}
        <Modal isOpen={isDeclarePaymentOpen} onClose={onDeclarePaymentClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Déclarer une mensualité payée</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Période</FormLabel>
                  <Input type="month" value={paymentPeriod} onChange={(e) => setPaymentPeriod(e.target.value)} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Montant (€)</FormLabel>
                  <NumberInput value={paymentAmount} onChange={(v)=>setPaymentAmount(v)} precision={2} step={0.01}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Attestation / Photo</FormLabel>
                  <Input type="file" accept="image/*,application/pdf" onChange={(e)=>setPaymentFile(e.target.files?.[0] || null)} />
                  <Text fontSize="xs" color="gray.500" mt={1}>Pièce justificative obligatoire</Text>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onDeclarePaymentClose}>Annuler</Button>
              <Button colorScheme="green" onClick={submitPaymentDeclaration} isLoading={loading}>Déclarer</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal Liste des paiements d'une opération */}
        <Modal isOpen={isPaymentsListOpen} onClose={onPaymentsListClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Paiements — {selectedOperation?.description}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {paymentsList.length === 0 ? (
                <Alert status="info"><AlertIcon />Aucun paiement enregistré</Alert>
              ) : (
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Période</Th>
                      <Th>Payé le</Th>
                      <Th isNumeric>Montant</Th>
                      <Th>Justificatif</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {paymentsList.map((p)=> (
                      <Tr key={p.id}>
                        <Td>{p.period}</Td>
                        <Td>{formatDate(p.paidAt)}</Td>
                        <Td isNumeric>{formatCurrency(p.amount)}</Td>
                        <Td>
                          {p.attachment?.dataUrl ? (
                            <Link href={p.attachment.dataUrl} target="_blank" color="blue.600">Ouvrir</Link>
                          ) : (
                            <Text fontSize="xs" color="gray.500">N/A</Text>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onPaymentsListClose}>Fermer</Button>
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

                <FormControl>
                  <FormLabel>Motif de régularisation</FormLabel>
                  <Input
                    value={balanceReason}
                    onChange={(e) => setBalanceReason(e.target.value)}
                    placeholder="Ex: Correction comptable, ajustement bancaire, etc."
                  />
                </FormControl>
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
