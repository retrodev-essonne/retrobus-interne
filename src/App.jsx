import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useUser } from "./context/UserContext";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import PermissionProtectedRoute from "./components/PermissionProtectedRoute";
import PrestataireLimitedRoute from "./components/PrestataireLimitedRoute";
import RequireCreator from "./components/RequireCreator";
import { RESOURCES } from "./lib/permissions";

// Pages principales
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import MyRBE from "./pages/MyRBE";
import MyRBEActions from "./pages/MyRBEActions";
import AdminFinance from "./pages/AdminFinance";
import Vehicules from "./pages/Vehicules";
import VehiculeShow from "./pages/VehiculeShow";
import VehiculeCreate from "./pages/VehiculeCreate";
import Evenements from "./pages/Evenements";
import EventsManagement from "./pages/EventsManagement";
import EventsCreation from "./pages/EventsCreation";
import TestEventsPage from "./pages/TestEventsPage";
import SiteManagement from "./pages/SiteManagement";
import StockManagement from "./pages/StockManagement";
import FlashManagement from "./pages/FlashManagement";
import Adhesion from "./pages/Adhesion";
import Login from "./pages/Login";
import MobileVehicle from "./pages/MobileVehicle";
import Retromail from "./pages/Retromail";
import Newsletter from "./pages/Newsletter";
import Members from "./pages/Members";
import MembersManagement from "./pages/MembersManagement";
import SupportSite from "./pages/SupportSite";
import RetroMerch from "./pages/RetroMerch";
import RetroPlanning from "./pages/RetroPlanning";
import AttendancePage from "./pages/AttendancePage";
import AttendanceManager from "./pages/AttendanceManager";

export default function App() {
  const { isAuthenticated } = useUser();
  const location = useLocation();
  
  // Debug: afficher la route actuelle
  console.log('🛣️ Current route:', location.pathname);
  
  const showHeader = isAuthenticated && location.pathname !== '/login';

  return (
    <>
      {showHeader && <Header />}
      <Routes>
        {/* Route de connexion */}
        <Route path="/login" element={<Login />} />
        
        {/* Routes du dashboard principal */}
        <Route path="/dashboard/home" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
  <Route path="/dashboard/myrbe" element={<ProtectedRoute><MyRBE /></ProtectedRoute>} />
  <Route path="/dashboard/myrbe/:parc" element={<ProtectedRoute><MyRBEActions /></ProtectedRoute>} />
        
        {/* 💰 Route gestion financière */}
        <Route path="/admin/finance" element={<ProtectedRoute><AdminFinance /></ProtectedRoute>} />
        
        {/* 🚗 Routes des véhicules */}
        <Route path="/dashboard/vehicules" element={<ProtectedRoute><Vehicules /></ProtectedRoute>} />
        <Route path="/dashboard/vehicules/ajouter" element={<ProtectedRoute><RequireCreator><VehiculeCreate /></RequireCreator></ProtectedRoute>} />
        <Route path="/dashboard/vehicules/:parc" element={<ProtectedRoute><VehiculeShow /></ProtectedRoute>} />
        
        {/* 📅 Routes des événements */}
        <Route path="/dashboard/evenements" element={<ProtectedRoute><Evenements /></ProtectedRoute>} />
        <Route path="/dashboard/events-management" element={<ProtectedRoute><EventsManagement /></ProtectedRoute>} />
        <Route path="/dashboard/events-creation" element={<ProtectedRoute><EventsCreation /></ProtectedRoute>} />
        {/* Route de test pour diagnostiquer */}
        <Route path="/dashboard/test-events" element={<ProtectedRoute><TestEventsPage /></ProtectedRoute>} />
        
        {/* 🌐 Gestion du site et contenu */}
        <Route path="/dashboard/site-management" element={<ProtectedRoute><SiteManagement /></ProtectedRoute>} />
        <Route path="/dashboard/flash-management" element={<ProtectedRoute><FlashManagement /></ProtectedRoute>} />
        {/* 🛒 RétroMerch (administration) */}
        <Route path="/dashboard/retromerch" element={<ProtectedRoute><RetroMerch /></ProtectedRoute>} />
        
        {/* 📦 Gestion des stocks */}
        <Route path="/dashboard/stock-management" element={<ProtectedRoute><StockManagement /></ProtectedRoute>} />
        
        {/* 👥 Gestion des membres */}
        <Route path="/dashboard/members-management" element={<ProtectedRoute><MembersManagement /></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
        <Route path="/adhesion" element={<ProtectedRoute><Adhesion /></ProtectedRoute>} />
        
        {/* 📧 Communication */}
        <Route path="/dashboard/newsletter" element={<ProtectedRoute><Newsletter /></ProtectedRoute>} />
        <Route path="/dashboard/retroplanning" element={<PermissionProtectedRoute resource={RESOURCES.RETROPLANNING}><RetroPlanning /></PermissionProtectedRoute>} />
        <Route path="/planning/attendance/:eventId/:memberId" element={<AttendancePage />} />
        <Route path="/planning/my-invitations" element={<PermissionProtectedRoute resource={RESOURCES.RETROPLANNING_RESPOND}><AttendanceManager /></PermissionProtectedRoute>} />
        <Route path="/dashboard/support" element={<PermissionProtectedRoute resource={RESOURCES.RETROSUPPORT}><SupportSite /></PermissionProtectedRoute>} />
        <Route path="/retromail" element={<ProtectedRoute><Retromail /></ProtectedRoute>} />
        
        {/* 📱 Version mobile */}
        <Route path="/mobile/v/:parc" element={<ProtectedRoute><MobileVehicle /></ProtectedRoute>} />
        
        {/* Route par défaut - redirige vers le dashboard home */}
        <Route path="/" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
        <Route path="*" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
      </Routes>
    </>
  );
}