import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import UpgradeRequired from "./pages/UpgradeRequired";
import Dashboard from "./pages/Dashboard";
import DashboardPro from "./pages/DashboardPro";
import Objekte from "./pages/Objekte";
import ObjektDetails from "./pages/ObjektDetails";
import Einheiten from "./pages/Einheiten";
import Mieter from "./pages/Mieter";
import PersonenCRM from "./pages/PersonenCRM";
import Vertraege from "./pages/Vertraege";
import Sollstellungen from "./pages/Sollstellungen";
import Bank from "./pages/Bank";
import Finanzen from "./pages/Finanzen";
import Abrechnung from "./pages/Abrechnung";
import Einstellungen from "./pages/Einstellungen";
import AppLayout from "./layout/AppLayout";
import ProLayout from "./layout/ProLayout";
import ProtectedRoute from "./components/ProtectedRoute";

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

          {/* Protected Routes with ProLayout - New Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPro />} />
            <Route path="verwaltung" element={<Objekte />} />
            <Route path="verwaltung/:id" element={<ObjektDetails />} />
            <Route path="personen" element={<Mieter />} />
            <Route path="personen/:id" element={<PersonenCRM />} />
            <Route path="vertraege" element={<Vertraege />} />
            <Route path="finanzen" element={<Finanzen />} />
            <Route path="bank" element={<Bank />} />
            <Route path="abrechnung" element={<Abrechnung />} />
            <Route path="sollstellungen" element={<Sollstellungen />} />
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
