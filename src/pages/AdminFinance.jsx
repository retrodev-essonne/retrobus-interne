import React, { useState, useEffect } from "react";
import {
  Grid, VStack, HStack, Badge, useToast, useColorModeValue, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  useDisclosure, FormControl, FormLabel, Textarea, 
  Alert, AlertIcon, InputGroup, InputLeftElement, 
  ButtonGroup, IconButton, Menu, MenuButton, MenuList, MenuItem,
  Spinner, Tabs, TabList, TabPanels, Tab, TabPanel,
  Switch, Table, Thead, Tbody, Tr, Th, Td, Text, Button, Input, Select,
  Card, CardHeader, CardBody, Icon, Heading,
  SimpleGrid, Divider, Box
} from "@chakra-ui/react";
import {
  FiDollarSign, FiTrendingUp, FiTrendingDown, FiPlus, FiMinus,
  FiPieChart, FiBarChart, FiCalendar, FiCreditCard, FiDownload,
  FiUpload, FiEdit3, FiTrash2, FiMoreHorizontal, FiCheck, FiX, FiRefreshCw, 
  FiEye, FiUsers, FiSave, FiClock, FiSettings, FiRepeat, FiShield, FiAlertTriangle
} from "react-icons/fi";
import { useUser } from '../context/UserContext';
import { financeAPI } from '../api/finance';
import { eventsAPI } from '../api/events.js';
import PageLayout from '../components/Layout/PageLayout';
import StatsGrid from '../components/Layout/StatsGrid';
import ModernCard from '../components/Layout/ModernCard';

// Composant pour la saisie d'argent innovante
const MoneyInput = ({ value, onChange, placeholder = "0,00 €", size = "md", ...props }) => {
  const [displayValue, setDisplayValue] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused && value !== undefined) {
      setDisplayValue(formatCurrency(value));
    }
  }, [value, focused]);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "";
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const parseCurrency = (str) => {
    const numStr = str.replace(/[^\d,-]/g, '').replace(',', '.');
    return parseFloat(numStr) || 0;
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    
    if (onChange) {
      const numericValue = parseCurrency(newValue);
      onChange(numericValue);
    }
  };

  const bgColor = useColorModeValue("white", "gray.800");
  const focusColor = useColorModeValue("blue.500", "blue.300");

  return (
    <InputGroup size={size}>
      <InputLeftElement pointerEvents="none">
        <Icon as={FiDollarSign} color="gray.400" />
      </InputLeftElement>
      <Input
        {...props}
        value={displayValue}
        onChange={handleChange}
        onFocus={() => {
          setFocused(true);
          setDisplayValue(value?.toString() || "");
        }}
        onBlur={() => {
          setFocused(false);
          setDisplayValue(formatCurrency(value));
        }}
        placeholder={placeholder}
        textAlign="right"
        bg={bgColor}
        borderColor="gray.300"
        _focus={{
          borderColor: focusColor,
          boxShadow: `0 0 0 1px ${focusColor}`
        }}
        _hover={{
          borderColor: "gray.400"
        }}
      />
    </InputGroup>
  );
};

// Composant pour afficher les statistiques financières modernes
const FinanceStats = ({ data, loading }) => {
  const stats = [
    {
      label: "Recettes du mois",
      value: data?.monthlyRevenue || "0,00 €",
      icon: FiTrendingUp,
      color: "success",
      change: data?.revenueGrowth > 0 ? {
        type: "increase",
        value: `+${data?.revenueGrowth}% vs mois dernier`
      } : undefined
    },
    {
      label: "Dépenses du mois", 
      value: data?.monthlyExpenses || "0,00 €",
      icon: FiTrendingDown,
      color: "warning",
      change: { type: "decrease", value: "Optimisé ce mois" }
    },
    {
      label: "Solde bancaire",
      value: data?.currentBalance || "0,00 €", 
      icon: FiBarChart,
      color: "brand"
    },
    {
      label: "Adhésions encaissées",
      value: `${data?.activeMembers || 0} membres`,
      icon: FiUsers,
      color: "purple",
      change: { type: "increase", value: data?.membershipRevenue || "0,00 €" }
    }
  ];

  return <StatsGrid stats={stats} loading={loading} />;
};

// Composant principal mis à jour
export default function AdminFinance() {
  const { user, isAdmin, roles = [] } = useUser();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isBankBalanceOpen, 
    onOpen: onBankBalanceOpen, 
    onClose: onBankBalanceClose 
  } = useDisclosure();
  const { 
    isOpen: isScheduledOperationOpen, 
    onOpen: onScheduledOperationOpen, 
    onClose: onScheduledOperationClose 
  } = useDisclosure();
  const {
    isOpen: isExpenseOpen, onOpen: onExpenseOpen, onClose: onExpenseClose
  } = useDisclosure();

  const [transactions, setTransactions] = useState([]);
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [bankBalance, setBankBalance] = useState(0);
  const [scheduledOperations, setScheduledOperations] = useState([]);
  const [events, setEvents] = useState([]);
  const [expenseReports, setExpenseReports] = useState([]);
  const [expenseLoading, setExpenseLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'recette',
    amount: 0,
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    eventId: ''
  });
  
  // État pour la modification du solde bancaire avec justification et sécurité
  const [bankBalanceData, setBankBalanceData] = useState({
    balance: 0,
    justification: '',
    password: '',
    linkedReportId: '' // ID du retro-report lié si applicable
  });
  
  const [operationFormData, setOperationFormData] = useState({
    type: 'depense',
    description: '',
    amount: 0,
    dueDate: '',
    category: '',
    recurring: 'none',
    isScheduled: true,
    notes: '',
    eventId: ''
  });
  
  const [expenseFormData, setExpenseFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    isForecast: false,
  });
  const [expensePdfFile, setExpensePdfFile] = useState(null);
  
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    eventId: ''
  });

  const [editingOperationId, setEditingOperationId] = useState(null);

  // État du simulateur
  const [simLines, setSimLines] = useState([]);

  const cardBg = useColorModeValue("white", "gray.800");
  const canManageExpenses = isAdmin || roles.includes('TREASURER') || roles.includes('PRESIDENT');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await eventsAPI.getAll();
        setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        setEvents([]);
      }
    })();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadFinanceData(),
      loadTransactions(),
      loadCategories(),
      loadBankBalance(),
      loadScheduledOperations(),
      loadExpenseReports(),
    ]);
  };

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      console.log('🏦 Chargement des données financières...');
      
      const data = await financeAPI.getStats();
      console.log('📊 Données financières reçues:', data);
      
      setFinanceData(data);
      
      toast({
        title: "Données synchronisées",
        description: "Statistiques financières mises à jour avec les données réelles",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('❌ Erreur chargement données financières:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les données financières: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      setFinanceData({
        monthlyRevenue: "0,00 €",
        monthlyExpenses: "0,00 €",
        currentBalance: "0,00 €",
        membershipRevenue: "0,00 €",
        activeMembers: 0,
        revenueGrowth: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBankBalance = async () => {
    try {
      const data = await financeAPI.getBankBalance();
      setBankBalance(data.balance);
      setBankBalanceData(prev => ({ ...prev, balance: data.balance }));
    } catch (error) {
      console.error('❌ Erreur chargement solde bancaire:', error);
      setBankBalance(0);
      setBankBalanceData(prev => ({ ...prev, balance: 0 }));
    }
  };

  const loadScheduledOperations = async () => {
    try {
      const data = await financeAPI.getScheduledExpenses();
      const ops = Array.isArray(data) ? data : (data?.operations || data?.items || data?.expenses || []);
      setScheduledOperations(Array.isArray(ops) ? ops : []);
    } catch (error) {
      console.error('❌ Erreur chargement opérations programmées:', error);
      setScheduledOperations([]);
    }
  };

  const loadTransactions = async () => {
    try {
      setTransactionsLoading(true);
      console.log('💳 Chargement des transactions...');
      
      const data = await financeAPI.getTransactions(filters);
      console.log('📋 Transactions reçues:', data);
      
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('❌ Erreur chargement transactions:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les transactions: ${error.message}`,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const loadExpenseReports = async () => {
    try {
      setExpenseLoading(true);
      const data = await financeAPI.getExpenseReports();
      setExpenseReports(data.reports || []);
    } catch (e) {
      setExpenseReports([]);
    } finally {
      setExpenseLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await financeAPI.getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('❌ Erreur chargement catégories:', error);
      setCategories([
        { id: 'adhesions', name: 'Adhésions' },
        { id: 'evenements', name: 'Événements' },
        { id: 'carburant', name: 'Carburant' },
        { id: 'maintenance', name: 'Maintenance' },
        { id: 'assurance', name: 'Assurance' },
        { id: 'materiel', name: 'Matériel' },
        { id: 'frais_admin', name: 'Frais administratifs' },
        { id: 'autres', name: 'Autres' }
      ]);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.amount || !formData.description) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      console.log('💾 Création d\'une nouvelle transaction:', formData);

      const newTransaction = await financeAPI.createTransaction({
        ...formData,
        created_by: user?.email || user?.username || 'admin'
      });

      console.log('✅ Transaction créée:', newTransaction);

      setTransactions(prev => [newTransaction, ...prev]);
      
      setFormData({
        type: 'recette',
        amount: 0,
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        eventId: ''
      });

      onClose();
      
      toast({
        title: "Succès",
        description: "Transaction enregistrée avec succès",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      loadFinanceData();
    } catch (error) {
      console.error('❌ Erreur création transaction:', error);
      toast({
        title: "Erreur",
        description: `Impossible d'enregistrer la transaction: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Modification du solde bancaire avec sécurité et justification
  const handleBankBalanceSubmit = async () => {
    try {
      // Validation des champs requis
      if (!bankBalanceData.justification.trim()) {
        toast({
          title: "Justification requise",
          description: "Vous devez justifier cette modification de solde",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (!bankBalanceData.password.trim()) {
        toast({
          title: "Mot de passe requis",
          description: "Le mot de passe administrateur est obligatoire",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Validation du mot de passe côté client (sera aussi validé côté serveur)
      const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_BALANCE_PASSWORD || 'RBE2024SECURE';
      if (bankBalanceData.password !== ADMIN_PASSWORD) {
        toast({
          title: "Accès refusé",
          description: "Mot de passe incorrect",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setBankBalanceData(prev => ({ ...prev, password: '' }));
        return;
      }

      const result = await financeAPI.setBankBalance({
        balance: bankBalanceData.balance,
        justification: bankBalanceData.justification,
        password: bankBalanceData.password,
        linkedReportId: bankBalanceData.linkedReportId || null,
        modifiedBy: user?.email || user?.username || 'admin'
      });

      setBankBalance(result.balance);
      onBankBalanceClose();
      
      // Réinitialiser le formulaire
      setBankBalanceData({
        balance: result.balance,
        justification: '',
        password: '',
        linkedReportId: ''
      });
      
      toast({
        title: "Solde mis à jour",
        description: `Nouveau solde: ${result.formatted}. Modification enregistrée avec justification.`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      
      loadFinanceData();
    } catch (error) {
      console.error('❌ Erreur mise à jour solde:', error);
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour le solde: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      // Effacer le mot de passe en cas d'erreur
      setBankBalanceData(prev => ({ ...prev, password: '' }));
    }
  };

  const handleExecuteScheduledOperation = async (op) => {
    try {
      const res = await financeAPI.executeScheduledExpense(op.id);
      if (res?.transaction) {
        setTransactions(prev => [res.transaction, ...prev]);
      }
      await loadScheduledOperations();
      toast({
        title: "Opération exécutée",
        description: "La transaction a été créée.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      loadFinanceData();
      loadBankBalance();
    } catch (e) {
      console.error(e);
      toast({ title: "Erreur", description: "Exécution impossible", status: "error" });
    }
  };

  const handleDeleteScheduledOperation = async (op) => {
    try {
      await financeAPI.deleteScheduledExpense(op.id);
      setScheduledOperations(prev => prev.filter(o => o.id !== op.id));
      toast({ title: "Supprimée", status: "success" });
    } catch (e) {
      console.error(e);
      toast({ title: "Erreur", description: "Suppression impossible", status: "error" });
    }
  };

  const handleEditScheduledOperation = (op) => {
    setEditingOperationId(op.id);
    setOperationFormData({
      type: op.type || 'depense',
      description: op.description || '',
      amount: op.amount || 0,
      dueDate: op.dueDate || '',
      category: op.category || '',
      recurring: op.recurring || 'none',
      isScheduled: true,
      notes: op.notes || ''
    });
    onScheduledOperationOpen();
  };

  const handleScheduledOperationSubmit = async () => {
    try {
      if (!operationFormData.description || !operationFormData.amount) {
        toast({ title: "Erreur", description: "Veuillez remplir la description et le montant", status: "error" });
        return;
      }

      if (editingOperationId) {
        const updated = await financeAPI.updateScheduledExpense(editingOperationId, operationFormData);
        setScheduledOperations(prev => prev.map(o => o.id === editingOperationId ? (updated?.operation || updated) : o));
        toast({ title: "Modifiée", description: "Opération programmée mise à jour.", status: "success" });
      } else {
        const created = await financeAPI.createScheduledExpense(operationFormData);
        setScheduledOperations(prev => [...prev, created?.operation || created]);
        toast({ title: "Créée", description: "Opération programmée créée.", status: "success" });
      }

      setOperationFormData({
        type: 'depense', description: '', amount: 0, dueDate: '', category: '',
        recurring: 'none', isScheduled: true, notes: ''
      });
      setEditingOperationId(null);
      onScheduledOperationClose();
    } catch (error) {
      console.error('❌ Erreur opération programmée:', error);
      toast({ title: "Erreur", description: `Impossible d'enregistrer: ${error.message}`, status: "error" });
    }
  };

  const handleSyncMemberships = async () => {
    try {
      console.log('🔄 Synchronisation des adhésions...');
      
      const result = await financeAPI.syncMemberships();
      console.log('✅ Synchronisation terminée:', result);
      
      toast({
        title: "Synchronisation réussie",
        description: `${result.synchronized} adhésions synchronisées`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      await loadInitialData();
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
      toast({
        title: "Erreur synchronisation",
        description: `Impossible de synchroniser les adhésions: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleExport = async () => {
    try {
      const blob = await financeAPI.exportData('csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export réussi",
        description: "Les données ont été exportées avec succès",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('❌ Erreur export:', error);
      toast({
        title: "Erreur export",
        description: "Impossible d'exporter les données",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (!window.confirm('Supprimer cette transaction ?')) return;
    try {
      await financeAPI.deleteTransaction(transaction.id);
      setTransactions(prev => prev.filter(t => t.id !== transaction.id));
      toast({ title: "Supprimée", status: "success" });
      loadFinanceData();
    } catch (e) {
      toast({ title: "Erreur", description: "Suppression impossible", status: "error" });
    }
  };

  const handleExpenseSubmit = async () => {
    if (!expenseFormData.description || !expenseFormData.amount) {
      toast({ title: "Erreur", description: "Description et montant requis", status: "error" });
      return;
    }

    if (!expenseFormData.isForecast) {
      if (!expensePdfFile) {
        toast({ title: "PDF requis", description: "Veuillez joindre le justificatif PDF", status: "error" });
        return;
      }
      if (expensePdfFile.type !== 'application/pdf') {
        toast({ title: "Format invalide", description: "Le fichier doit être un PDF", status: "error" });
        return;
      }
    }

    try {
      await financeAPI.createExpenseReport({
        date: expenseFormData.date,
        description: expenseFormData.description,
        amount: expenseFormData.amount,
        pdfFile: expensePdfFile || null,
        planned: !!expenseFormData.isForecast,
        status: 'open',
      });
      await loadExpenseReports();
      setExpenseFormData({ date: new Date().toISOString().split('T')[0], description: '', amount: 0, isForecast: false });
      setExpensePdfFile(null);
      onExpenseClose();
      toast({ title: "Note créée", status: "success" });
    } catch (e) {
      toast({ title: "Erreur", description: e.message || "Création impossible", status: "error" });
    }
  };

  const handleExpenseStatusChange = async (report, newStatus) => {
    try {
      await financeAPI.updateExpenseReportStatus(report.id, newStatus);
      await loadExpenseReports();
      const label = newStatus === 'closed' ? 'fermée' : newStatus === 'reimbursed' ? 'remboursée' : newStatus;
      toast({ title: `Note ${label}`, status: "success" });
    } catch (e) {
      toast({ title: "Erreur", description: "Mise à jour du statut impossible", status: "error" });
    }
  };

  const handleDeleteExpense = async (report) => {
    if (!window.confirm('Supprimer cette note de frais ?')) return;
    try {
      await financeAPI.deleteExpenseReport(report.id);
      await loadExpenseReports();
      toast({ title: "Note supprimée", status: "success" });
    } catch (e) {
      toast({ title: "Erreur", description: "Suppression impossible", status: "error" });
    }
  };

  // Helpers simulateur
  const addSimLine = () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    setSimLines(prev => [...prev, { id, type: 'depense', amount: 0, description: '', category: '', eventId: '' }]);
  };

  const updateSimLine = (id, patch) => {
    setSimLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  };

  const removeSimLine = (id) => {
    setSimLines(prev => prev.filter(l => l.id !== id));
  };

  const resetSim = () => setSimLines([]);

  const simRevenue = simLines.filter(l => l.type === 'recette').reduce((s, l) => s + Number(l.amount || 0), 0);
  const simExpenses = simLines.filter(l => l.type === 'depense').reduce((s, l) => s + Number(l.amount || 0), 0);
  const simImpact = simRevenue - simExpenses;
  const projectedBalance = Number(bankBalance || 0) + simImpact;

  const applySimulation = async () => {
    if (!simLines.length) return;
    if (!canManageExpenses) {
      toast({ title: "Accès requis", description: "Seul le trésorier, le président ou un admin peut créer des transactions", status: "warning" });
      return;
    }
    try {
      const effective = simLines.filter(l => Number(l.amount) > 0 && (l.type === 'recette' || l.type === 'depense'));
      if (!effective.length) {
        toast({ title: "Simulation vide", description: "Ajoutez des lignes valides (montant > 0)", status: "info" });
        return;
      }
      await Promise.all(effective.map(l =>
        financeAPI.createTransaction({
          type: l.type,
          amount: Number(l.amount),
          description: l.description || '(Simulateur)',
          category: l.category || '',
          date: new Date().toISOString().split('T')[0],
          eventId: l.eventId || ''
        })
      ));
      resetSim();
      await Promise.all([loadTransactions(), loadFinanceData(), loadBankBalance()]);
      toast({ title: "Transactions créées", description: "Votre simulation a été appliquée", status: "success" });
    } catch (e) {
      console.error(e);
      toast({ title: "Erreur", description: "Impossible d'appliquer la simulation", status: "error" });
    }
  };

  if (loading) {
    return (
      <PageLayout
        title="🏦 Gestion Financière"
        subtitle="Chargement des données financières..."
        bgGradient="linear(to-r, rbe.600, blue.600)"
      >
        <VStack spacing={8} py={16}>
          <Spinner size="xl" color="rbe.500" thickness="4px" />
          <Text color="gray.600">Synchronisation avec la base de données...</Text>
        </VStack>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="💰 Gestion Financière"
      subtitle="Suivi des recettes, dépenses et trésorerie de l'association"
      bgGradient="linear(to-r, rbe.600, green.600)"
      breadcrumbs={[
        { label: "MyRBE", href: "/dashboard/myrbe" },
        { label: "Gestion Financière", href: "/admin/finance" }
      ]}
      headerActions={
        <HStack spacing={3}>
          <Button
            leftIcon={<FiPlus />}
            variant="secondary"
            bg="whiteAlpha.200"
            color="white"
            borderColor="whiteAlpha.300"
            _hover={{ bg: "whiteAlpha.300" }}
            onClick={onOpen}
          >
            Nouvelle transaction
          </Button>
          <Button
            leftIcon={<FiClock />}
            variant="secondary"
            bg="whiteAlpha.200"
            color="white"
            borderColor="whiteAlpha.300"
            _hover={{ bg: "whiteAlpha.300" }}
            onClick={onScheduledOperationOpen}
          >
            Programmer opération
          </Button>
        </HStack>
      }
    >
      <VStack spacing={8} align="stretch">
        {/* Statistiques financières */}
        <FinanceStats data={financeData} loading={false} />

        {/* Onglets de gestion */}
        <Tabs variant="enclosed" colorScheme="rbe">
          <TabList>
            <Tab _selected={{ color: "rbe.600", borderColor: "rbe.600" }}>
              💳 Transactions
            </Tab>
            <Tab _selected={{ color: "rbe.600", borderColor: "rbe.600" }}>
              📅 Opérations programmées
            </Tab>
            <Tab _selected={{ color: "rbe.600", borderColor: "rbe.600" }}>
              🧾 Notes de frais
            </Tab>
            <Tab _selected={{ color: "rbe.600", borderColor: "rbe.600" }}>
              🧮 Simulateur
            </Tab>
            <Tab _selected={{ color: "rbe.600", borderColor: "rbe.600" }}>
              ⚙️ Configuration
            </Tab>
          </TabList>

          <TabPanels>
            {/* Onglet Transactions */}
            <TabPanel px={0}>
              <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
                <ModernCard
                  title="Transactions récentes"
                  badge={{ label: `${transactions.length}`, color: "blue" }}
                >
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <ButtonGroup size="sm">
                        <Button
                          leftIcon={<FiPlus />}
                          variant="primary"
                          onClick={onOpen}
                        >
                          Nouvelle transaction
                        </Button>
                        <Button
                          leftIcon={<FiRefreshCw />}
                          variant="modern"
                          onClick={loadTransactions}
                          isLoading={transactionsLoading}
                        >
                          Actualiser
                        </Button>
                      </ButtonGroup>
                      <HStack>
                        <Select
                          size="sm"
                          maxW="280px"
                          placeholder="Tous les événements"
                          value={filters.eventId}
                          onChange={(e) => setFilters(prev => ({ ...prev, eventId: e.target.value }))}
                        >
                          {events.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.title}</option>
                          ))}
                        </Select>
                        <Button size="sm" variant="outline" onClick={loadTransactions}>Filtrer</Button>
                      </HStack>
                    </HStack>

                    {transactionsLoading ? (
                      <VStack py={8}>
                        <Spinner color="rbe.500" />
                        <Text color="gray.500">Chargement des transactions...</Text>
                      </VStack>
                    ) : transactions.length === 0 ? (
                      <VStack py={8} spacing={4}>
                        <Text color="gray.500" fontSize="lg">Aucune transaction trouvée</Text>
                        <Button 
                          size="sm" 
                          onClick={handleSyncMemberships} 
                          leftIcon={<FiUsers />}
                          variant="secondary"
                        >
                          Synchroniser les adhésions
                        </Button>
                      </VStack>
                    ) : (
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Date</Th>
                            <Th>Type</Th>
                            <Th>Description</Th>
                            <Th isNumeric>Montant</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {transactions.map((transaction) => (
                            <Tr key={transaction.id} _hover={{ bg: "gray.50" }}>
                              <Td fontSize="sm">
                                {new Date(transaction.date).toLocaleDateString('fr-FR')}
                              </Td>
                              <Td>
                                <Badge
                                  colorScheme={transaction.type === 'recette' ? 'success' : 'warning'}
                                  variant="subtle"
                                  borderRadius="md"
                                >
                                  {transaction.type === 'recette' ? 'Recette' : 'Dépense'}
                                </Badge>
                              </Td>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="500">
                                    {transaction.description}
                                  </Text>
                                  {transaction.eventId && (
                                    <Badge colorScheme="purple" mt={1}>
                                      {events.find(e => e.id === transaction.eventId)?.title || `Événement #${transaction.eventId}`}
                                    </Badge>
                                  )}
                                  {transaction.member && (
                                    <Text fontSize="xs" color="gray.500">
                                      {transaction.member.firstName} {transaction.member.lastName} ({transaction.member.memberNumber})
                                    </Text>
                                  )}
                                </VStack>
                              </Td>
                              <Td isNumeric>
                                <Text
                                  color={transaction.type === 'recette' ? 'success.600' : 'warning.600'}
                                  fontWeight="600"
                                  fontSize="sm"
                                >
                                  {transaction.type === 'recette' ? '+' : '-'}
                                  {new Intl.NumberFormat('fr-FR', {
                                    style: 'currency',
                                    currency: 'EUR'
                                  }).format(transaction.amount)}
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
                                    <MenuItem icon={<FiEye />}>Voir détails</MenuItem>
                                    <MenuItem icon={<FiEdit3 />}>Modifier</MenuItem>
                                    <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => handleDeleteTransaction(transaction)}>
                                      Supprimer
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    )}
                  </VStack>
                </ModernCard>

                <VStack spacing={4}>
                  <ModernCard title="Actions rapides" color="gray">
                    <VStack spacing={3}>
                      <Button
                        leftIcon={<FiUsers />}
                        variant="modern"
                        size="sm"
                        w="full"
                        onClick={handleSyncMemberships}
                      >
                        Synchroniser adhésions
                      </Button>
                      <Button
                        leftIcon={<FiDownload />}
                        variant="modern"
                        size="sm"
                        w="full"
                        onClick={handleExport}
                      >
                        Exporter comptabilité
                      </Button>
                      <Button
                        leftIcon={<FiSettings />}
                        variant="modern"
                        size="sm"
                        w="full"
                        onClick={onBankBalanceOpen}
                      >
                        Configurer solde
                      </Button>
                    </VStack>
                  </ModernCard>

                  <Alert status="success" borderRadius="lg" border="1px solid" borderColor="success.200">
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="600" fontSize="sm" color="success.800">
                        Données en temps réel
                      </Text>
                      <Text fontSize="xs" color="success.700">
                        Synchronisé avec {financeData?.activeMembers || 0} membres actifs
                      </Text>
                    </VStack>
                  </Alert>
                </VStack>
              </Grid>
            </TabPanel>

            {/* Onglet Opérations programmées */}
            <TabPanel px={0}>
              <Card bg={cardBg}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">📅 Opérations programmées</Heading>
                    <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onScheduledOperationOpen}>
                      Programmer une opération
                    </Button>
                  </HStack>
                </CardHeader>
                <CardBody>
                  {scheduledOperations.length === 0 ? (
                    <VStack py={8}>
                      <Icon as={FiClock} size="48px" color="gray.300" />
                      <Text color="gray.500">Aucune opération programmée</Text>
                      <Button size="sm" onClick={onScheduledOperationOpen} leftIcon={<FiPlus />}>
                        Programmer une opération
                      </Button>
                    </VStack>
                  ) : (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Type</Th>
                          <Th>Description</Th>
                          <Th>Catégorie</Th>
                          <Th isNumeric>Montant</Th>
                          <Th>Date prévue</Th>
                          <Th>Récurrence</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {scheduledOperations.map((operation) => (
                          <Tr key={operation.id}>
                            <Td>
                              <Badge
                                colorScheme={operation.type === 'recette' ? 'green' : 'red'}
                                variant="subtle"
                              >
                                {operation.type === 'recette' ? 'Recette' : 'Dépense'}
                              </Badge>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="bold">{operation.description}</Text>
                                {operation.notes && (
                                  <Text fontSize="xs" color="gray.500">{operation.notes}</Text>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <Badge variant="subtle">
                                {categories.find(c => c.id === operation.category)?.name || operation.category}
                              </Badge>
                            </Td>
                            <Td isNumeric>
                              <Text fontWeight="bold" 
                                color={operation.type === 'recette' ? 'green.500' : 'red.500'}>
                                {operation.type === 'recette' ? '+' : '-'}
                                {operation.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                              </Text>
                            </Td>
                            <Td>
                              {operation.dueDate ? (
                                new Date(operation.dueDate).toLocaleDateString('fr-FR')
                              ) : (
                                <Badge variant="outline">Pas de date</Badge>
                              )}
                            </Td>
                            <Td>
                              <HStack>
                                {operation.recurring !== 'none' && (
                                  <Icon as={FiRepeat} color="blue.500" size="sm" />
                                )}
                                <Text fontSize="sm">
                                  {operation.recurring === 'none' ? 'Unique' : 
                                   operation.recurring === 'monthly' ? 'Mensuelle' :
                                   operation.recurring === 'quarterly' ? 'Trimestrielle' :
                                   operation.recurring === 'yearly' ? 'Annuelle' : operation.recurring}
                                </Text>
                              </HStack>
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
                                  <MenuItem icon={<FiCheck />} onClick={() => handleExecuteScheduledOperation(operation)}>
                                    Exécuter maintenant
                                  </MenuItem>
                                  <MenuItem icon={<FiEdit3 />} onClick={() => handleEditScheduledOperation(operation)}>
                                    Modifier
                                  </MenuItem>
                                  <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => handleDeleteScheduledOperation(operation)}>
                                    Supprimer
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* Onglet Notes de frais */}
            <TabPanel px={0}>
              <Card bg={cardBg}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">🧾 Notes de frais</Heading>
                    {canManageExpenses && (
                      <Button leftIcon={<FiUpload />} colorScheme="blue" onClick={onExpenseOpen}>
                        Nouvelle note de frais
                      </Button>
                    )}
                  </HStack>
                </CardHeader>
                <CardBody>
                  {expenseLoading ? (
                    <VStack py={8}><Spinner /><Text>Chargement des notes...</Text></VStack>
                  ) : expenseReports.length === 0 ? (
                    <VStack py={8}>
                      <Text color="gray.500">Aucune note de frais</Text>
                      {canManageExpenses && (
                        <Button size="sm" onClick={onExpenseOpen} leftIcon={<FiUpload />}>
                          Ajouter une note de frais
                        </Button>
                      )}
                    </VStack>
                  ) : (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Date</Th>
                          <Th>Description</Th>
                          <Th isNumeric>Montant</Th>
                          <Th>Justificatif</Th>
                          <Th>Statut</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {expenseReports.map((r) => (
                          <Tr key={r.id}>
                            <Td>{new Date(r.date).toLocaleDateString('fr-FR')}</Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="500">{r.description}</Text>
                                {r.createdBy && <Text fontSize="xs" color="gray.500">Par {r.createdBy}</Text>}
                              </VStack>
                            </Td>
                            <Td isNumeric>
                              <Text fontWeight="bold">
                                {Number(r.amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                              </Text>
                            </Td>
                            <Td>
                              {r.fileUrl ? (
                                <Button as="a" href={r.fileUrl} target="_blank" rel="noreferrer" size="xs" variant="outline">
                                  Voir PDF
                                </Button>
                              ) : (
                                <Text fontSize="xs" color="gray.500">{r.fileName || '—'}</Text>
                              )}
                            </Td>
                            <Td>
                              <HStack>
                                <Badge colorScheme={
                                  r.status === 'reimbursed' ? 'green' :
                                  r.status === 'closed' ? 'orange' : 'blue'
                                }>
                                  {r.status === 'reimbursed' ? 'Remboursée' :
                                   r.status === 'closed' ? 'Fermée' : 'Ouverte'}
                                </Badge>
                                {!r.fileUrl && (
                                  <Badge variant="outline" colorScheme="purple">Prévisionnelle</Badge>
                                )}
                              </HStack>
                            </Td>
                            <Td>
                              <Menu>
                                <MenuButton as={IconButton} icon={<FiMoreHorizontal />} variant="ghost" size="sm" />
                                <MenuList>
                                  <MenuItem icon={<FiEye />}>Voir détails</MenuItem>
                                  {canManageExpenses && r.status !== 'closed' && r.status !== 'reimbursed' && (
                                    <MenuItem icon={<FiCheck />} onClick={() => handleExpenseStatusChange(r, 'closed')}>
                                      Marquer "Fermée"
                                    </MenuItem>
                                  )}
                                  {canManageExpenses && r.status !== 'reimbursed' && (
                                    <MenuItem icon={<FiCheck />} onClick={() => handleExpenseStatusChange(r, 'reimbursed')} isDisabled={!r.fileUrl} >
                                      Marquer "Remboursée"
                                    </MenuItem>
                                  )}
                                  {canManageExpenses && (
                                    <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => handleDeleteExpense(r)}>
                                      Supprimer
                                    </MenuItem>
                                  )}
                                </MenuList>
                              </Menu>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* Onglet Simulateur */}
            <TabPanel px={0}>
              <Card bg={cardBg}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">🧮 Simulateur de trésorerie</Heading>
                    <HStack>
                      <Button variant="outline" onClick={addSimLine} leftIcon={<FiPlus />}>Ajouter une ligne</Button>
                      <Button variant="outline" onClick={resetSim}>Réinitialiser</Button>
                      <Button colorScheme="blue" onClick={applySimulation} isDisabled={!canManageExpenses || simLines.length === 0}>
                        Créer ces transactions
                      </Button>
                    </HStack>
                  </HStack>
                </CardHeader>
                <CardBody>
                  {simLines.length === 0 ? (
                    <VStack py={8}>
                      <Text color="gray.500">Ajoutez des lignes pour simuler l'impact sur la trésorerie.</Text>
                      <Button size="sm" onClick={addSimLine} leftIcon={<FiPlus />}>Ajouter une ligne</Button>
                    </VStack>
                  ) : (
                    <VStack align="stretch" spacing={4}>
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Type</Th>
                            <Th>Description</Th>
                            <Th>Catégorie</Th>
                            <Th>Événement</Th>
                            <Th isNumeric>Montant</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {simLines.map((l) => (
                            <Tr key={l.id}>
                              <Td>
                                <Select
                                  value={l.type}
                                  onChange={(e) => updateSimLine(l.id, { type: e.target.value })}
                                  size="sm"
                                >
                                  <option value="recette">Recette</option>
                                  <option value="depense">Dépense</option>
                                </Select>
                              </Td>
                              <Td>
                                <Input
                                  value={l.description}
                                  onChange={(e) => updateSimLine(l.id, { description: e.target.value })}
                                  size="sm"
                                  placeholder="Description"
                                />
                              </Td>
                              <Td>
                                <Select
                                  value={l.category}
                                  onChange={(e) => updateSimLine(l.id, { category: e.target.value })}
                                  size="sm"
                                  placeholder="Catégorie (optionnel)"
                                  maxW="220px"
                                >
                                  {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                                </Select>
                              </Td>
                              <Td>
                                <Select
                                  size="sm"
                                  value={l.eventId}
                                  onChange={(e) => updateSimLine(l.id, { eventId: e.target.value })}
                                  placeholder="Aucun"
                                  maxW="240px"
                                >
                                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                                </Select>
                              </Td>
                              <Td isNumeric>
                                <MoneyInput
                                  value={l.amount}
                                  onChange={(v) => updateSimLine(l.id, { amount: v })}
                                  placeholder="0,00 €"
                                  size="sm"
                                />
                              </Td>
                              <Td>
                                <IconButton
                                  aria-label="Supprimer"
                                  icon={<FiTrash2 />}
                                  size="sm"
                                  variant="ghost"
                                  color="red.500"
                                  onClick={() => removeSimLine(l.id)}
                                />
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>

                      <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4}>
                        <Card>
                          <CardBody>
                            <VStack spacing={1} align="start">
                              <Text fontSize="xs" color="gray.500">Recettes simulées</Text>
                              <Text fontSize="lg" fontWeight="bold" color="green.600">
                                {simRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                              </Text>
                            </VStack>
                          </CardBody>
                        </Card>

                        <Card>
                          <CardBody>
                            <VStack spacing={1} align="start">
                              <Text fontSize="xs" color="gray.500">Dépenses simulées</Text>
                              <Text fontSize="lg" fontWeight="bold" color="red.600">
                                {simExpenses.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                              </Text>
                            </VStack>
                          </CardBody>
                        </Card>

                        <Card>
                          <CardBody>
                            <VStack spacing={1} align="start">
                              <Text fontSize="xs" color="gray.500">Impact net</Text>
                              <Text fontSize="lg" fontWeight="bold" color={simImpact >= 0 ? 'green.600' : 'red.600'}>
                                {simImpact.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                              </Text>
                            </VStack>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody>
                            <VStack spacing={1} align="start">
                              <Text fontSize="xs" color="gray.500">Solde projeté</Text>
                              <Text fontSize="lg" fontWeight="bold">
                                {projectedBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                              </Text>
                            </VStack>
                          </CardBody>
                        </Card>
                      </Grid>
                    </VStack>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* Onglet Configuration */}
            <TabPanel px={0}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="md">Solde bancaire</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4}>
                      <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                        {bankBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </Text>
                      <Button size="sm" onClick={onBankBalanceOpen} leftIcon={<FiEdit3 />}>
                        Modifier le solde
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="md">Prochaines dépenses</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3}>
                      {scheduledOperations.slice(0, 3).map(operation => (
                        <HStack key={operation.id} justify="space-between" w="full">
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="bold">{operation.description}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {operation.dueDate ? new Date(operation.dueDate).toLocaleDateString('fr-FR') : 'Pas de date'}
                            </Text>
                          </VStack>
                          <Text fontWeight="bold" color="red.500">
                            {operation.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </Text>
                        </HStack>
                      ))}
                      <Button size="sm" onClick={onScheduledOperationOpen} leftIcon={<FiPlus />}>
                        Ajouter une dépense
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Modal pour nouvelle transaction */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={4}>
              <Icon as={FiDollarSign} boxSize={8} color="blue.500" />
              <Text fontSize="lg" fontWeight="semibold">
                Nouvelle transaction
              </Text>
            </HStack>
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Type de transaction</FormLabel>
                <HStack spacing={4}>
                  <Button
                    flex={1}
                    leftIcon={<FiTrendingUp />}
                    colorScheme={formData.type === 'recette' ? 'green' : 'gray'}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'recette' }))}
                  >
                    Recette
                  </Button>
                  <Button
                    flex={1}
                    leftIcon={<FiTrendingDown />}
                    colorScheme={formData.type === 'depense' ? 'red' : 'gray'}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'depense' }))}
                  >
                    Dépense
                  </Button>
                </HStack>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Montant</FormLabel>
                <MoneyInput
                  placeholder="0,00 €"
                  value={formData.amount}
                  onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                  size="lg"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Description de la transaction"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  size="lg"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Catégorie</FormLabel>
                <Select
                  placeholder="Sélectionner une catégorie"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  size="lg"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  size="lg"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Événement associé</FormLabel>
                <Select
                  placeholder="Sélectionner un événement"
                  value={formData.eventId}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventId: e.target.value }))}
                  size="lg"
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </Select>
              </FormControl>

              <Button
                colorScheme="blue"
                size="lg"
                onClick={handleSubmit}
                isLoading={loading}
                loadingText="Enregistrement..."
              >
                Enregistrer la transaction
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal pour configuration du solde bancaire */}
      <Modal isOpen={isBankBalanceOpen} onClose={onBankBalanceClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={4}>
              <Icon as={FiCreditCard} boxSize={8} color="blue.500" />
              <Text fontSize="lg" fontWeight="semibold">
                Solde bancaire
              </Text>
            </HStack>
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="2xl" fontWeight="bold" color="blue.500" textAlign="center">
                {bankBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </Text>

              <FormControl>
                <FormLabel>Nouveau solde</FormLabel>
                <MoneyInput
                  placeholder="0,00 €"
                  value={bankBalanceData.balance}
                  onChange={(value) => setBankBalanceData({ balance: value })}
                  size="lg"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Justification</FormLabel>
                <Textarea
                  placeholder="Justifiez la modification du solde"
                  value={bankBalanceData.justification}
                  onChange={(e) => setBankBalanceData(prev => ({ ...prev, justification: e.target.value }))}
                  size="lg"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Mot de passe administrateur</FormLabel>
                <Input
                  type="password"
                  value={bankBalanceData.password}
                  onChange={(e) => setBankBalanceData(prev => ({ ...prev, password: e.target.value }))}
                  size="lg"
                />
              </FormControl>

              <Button
                colorScheme="blue"
                size="lg"
                onClick={handleBankBalanceSubmit}
                isLoading={loading}
                loadingText="Mise à jour..."
              >
                Mettre à jour le solde
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal pour programmer une opération */}
      <Modal isOpen={isScheduledOperationOpen} onClose={() => { setEditingOperationId(null); onScheduledOperationClose(); }} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={4}>
              <Icon as={FiClock} boxSize={8} color="blue.500" />
              <Text fontSize="lg" fontWeight="semibold">
                Programmer une opération
              </Text>
            </HStack>
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Type d'opération</FormLabel>
                <HStack spacing={4}>
                  <Button
                    flex={1}
                    leftIcon={<FiTrendingUp />}
                    colorScheme={operationFormData.type === 'recette' ? 'green' : 'gray'}
                    onClick={() => setOperationFormData(prev => ({ ...prev, type: 'recette' }))}
                  >
                    Recette
                  </Button>
                  <Button
                    flex={1}
                    leftIcon={<FiTrendingDown />}
                    colorScheme={operationFormData.type === 'depense' ? 'red' : 'gray'}
                    onClick={() => setOperationFormData(prev => ({ ...prev, type: 'depense' }))}
                  >
                    Dépense
                  </Button>
                </HStack>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Montant</FormLabel>
                <MoneyInput
                  placeholder="0,00 €"
                  value={operationFormData.amount}
                  onChange={(value) => setOperationFormData(prev => ({ ...prev, amount: value }))}
                  size="lg"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Description de l'opération"
                  value={operationFormData.description}
                  onChange={(e) => setOperationFormData(prev => ({ ...prev, description: e.target.value }))}
                  size="lg"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Catégorie</FormLabel>
                <Select
                  placeholder="Sélectionner une catégorie"
                  value={operationFormData.category}
                  onChange={(e) => setOperationFormData(prev => ({ ...prev, category: e.target.value }))}
                  size="lg"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Date prévue</FormLabel>
                <Input
                  type="date"
                  value={operationFormData.dueDate}
                  onChange={(e) => setOperationFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  size="lg"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Récurrence</FormLabel>
                <Select
                  placeholder="Sélectionner une récurrence"
                  value={operationFormData.recurring}
                  onChange={(e) => setOperationFormData(prev => ({ ...prev, recurring: e.target.value }))}
                  size="lg"
                >
                  <option value="none">Unique</option>
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuelle</option>
                  <option value="quarterly">Trimestrielle</option>
                  <option value="yearly">Annuelle</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  placeholder="Notes supplémentaires"
                  value={operationFormData.notes}
                  onChange={(e) => setOperationFormData(prev => ({ ...prev, notes: e.target.value }))}
                  size="lg"
                />
              </FormControl>

              <Button
                colorScheme="blue"
                size="lg"
                onClick={handleScheduledOperationSubmit}
                isLoading={loading}
                loadingText="Enregistrement..."
              >
                Enregistrer l'opération programmée
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal: Nouvelle note de frais */}
      <Modal isOpen={isExpenseOpen} onClose={() => { setExpensePdfFile(null); onExpenseClose(); }} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>🧾 Nouvelle note de frais</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Text fontSize="sm">
                  Vous pouvez créer une note prévisionnelle sans justificatif, puis ajouter le PDF plus tard.
                </Text>
              </Alert>

              <FormControl display="flex" alignItems="center">
                <HStack justify="space-between" w="full">
                  <FormLabel m={0}>Note prévisionnelle</FormLabel>
                  <Switch
                    isChecked={expenseFormData.isForecast}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, isForecast: e.target.checked }))}
                  />
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Si activé, le justificatif PDF n'est pas requis à la création.
                </Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={expenseFormData.date}
                  onChange={(e) => setExpenseFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Repas mission, péage, parking…"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Montant</FormLabel>
                <MoneyInput
                  value={expenseFormData.amount}
                  onChange={(v) => setExpenseFormData(prev => ({ ...prev, amount: v }))}
                  placeholder="0,00 €"
                />
              </FormControl>

              {!expenseFormData.isForecast && (
                <FormControl isRequired>
                  <FormLabel>Justificatif (PDF)</FormLabel>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setExpensePdfFile((e.target.files && e.target.files[0]) || null)}
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onExpenseClose}>Annuler</Button>
            <Button colorScheme="blue" leftIcon={<FiUpload />} onClick={handleExpenseSubmit} isDisabled={!canManageExpenses}>
              Enregistrer la note
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageLayout>
  );
}
