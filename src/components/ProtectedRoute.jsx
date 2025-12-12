import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../contexts/AppContext";

export default function ProtectedRoute({ children, requireClientSelection = false }) {
  const token = localStorage.getItem("access_token");
  const location = useLocation();
  const { selectedClient, selectedFiscalYear } = useApp();

  // Prüfe ob User eingeloggt ist
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Prüfe ob Client & Jahr gewählt sind (außer auf Client-Selection-Seite)
  if (requireClientSelection && location.pathname !== "/client-selection") {
    if (!selectedClient || !selectedFiscalYear) {
      return <Navigate to="/client-selection" replace />;
    }
  }

  return children;
}

