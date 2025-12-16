import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import UpgradeRequired from "./pages/UpgradeRequired";
import ClientSelection from "./pages/ClientSelection";
import DashboardPro from "./pages/DashboardPro";
import Objekte from "./pages/Objekte";
import ObjektDetails from "./pages/ObjektDetails";
import Einheiten from "./pages/Einheiten";
import Mieter from "./pages/Mieter";
import PersonenCRM from "./pages/PersonenCRM";
import Eigentuemer from "./pages/Eigentuemer";
import Dienstleister from "./pages/Dienstleister";
import Vertraege from "./pages/Vertraege";
import Sollstellungen from "./pages/Sollstellungen";
import Bank from "./pages/Bank";
import Finanzen from "./pages/Finanzen";
import Abrechnung from "./pages/Abrechnung";
import Kassenbuch from "./pages/Kassenbuch";
import Tickets from "./pages/Tickets";
import Dokumente from "./pages/Dokumente";
import OffenePosten from "./pages/OffenePosten";
import ManuelleBuchungen from "./pages/ManuelleBuchungen";
import Berichte from "./pages/Berichte";
import Einstellungen from "./pages/Einstellungen";
import ProLayout from "./layout/ProLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PortalProtectedRoute from "./components/PortalProtectedRoute";
import PortalLogin from "./pages/PortalLogin";
import PortalDashboard from "./pages/PortalDashboard";
import AdminBKVerwaltung from "./pages/AdminBKVerwaltung";

// Component to redirect authenticated users away from landing page
function LandingRoute() {
  const token = localStorage.getItem("access_token");
  
  // If user is authenticated, redirect to dashboard
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Otherwise show landing page
  return <Landing />;
}

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // Data is fresh for 30 seconds
      cacheTime: 300000, // Cache data for 5 minutes
      refetchOnWindowFocus: true, // Refetch when window gains focus
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/upgrade" element={<UpgradeRequired />} />

          {/* Portal Routes (Mieter) */}
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route
            path="/portal/dashboard"
            element={
              <PortalProtectedRoute>
                <PortalDashboard />
              </PortalProtectedRoute>
            }
          />
          <Route
            path="/portal/bk/:year"
            element={
              <PortalProtectedRoute>
                <PortalDashboard />
              </PortalProtectedRoute>
            }
          />

          {/* Client Selection - Protected but without Layout */}
          <Route
            path="/client-selection"
            element={
              <ProtectedRoute>
                <ClientSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/new"
            element={
              <ProtectedRoute>
                <ClientSelection />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes with ProLayout - New Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute requireClientSelection={true}>
                <ProLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPro />} />
            <Route path="verwaltung" element={<Objekte />} />
            <Route path="verwaltung/:id" element={<ObjektDetails />} />
            <Route path="personen" element={<Mieter />} />
            <Route path="personen/:id" element={<PersonenCRM />} />
            <Route path="eigentuemer" element={<Eigentuemer />} />
            <Route path="dienstleister" element={<Dienstleister />} />
            <Route path="vertraege" element={<Vertraege />} />
            <Route path="finanzen" element={<Finanzen />} />
            <Route path="bank" element={<Bank />} />
            <Route path="kassenbuch" element={<Kassenbuch />} />
            <Route path="abrechnung" element={<Abrechnung />} />
            <Route path="sollstellungen" element={<Sollstellungen />} />
            <Route path="vorgaenge" element={<Tickets />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="dokumente" element={<Dokumente />} />
            <Route path="offene-posten" element={<OffenePosten />} />
            <Route path="manuelle-buchungen" element={<ManuelleBuchungen />} />
            <Route path="berichte" element={<Berichte />} />
            <Route path="bk-verwaltung" element={<AdminBKVerwaltung />} />
            {/* Legacy routes for backward compatibility */}
            <Route path="objekte" element={<Objekte />} />
            <Route path="objekte/:id" element={<ObjektDetails />} />
            <Route path="einheiten" element={<Einheiten />} />
            <Route path="mieter" element={<Mieter />} />
            <Route path="sollstellungen" element={<Sollstellungen />} />
            <Route path="bank" element={<Bank />} />
            <Route path="einstellungen" element={<Einstellungen />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
