import { Navigate } from "react-router-dom";

/**
 * Protected Route für Portal (Mieter)
 * Prüft ob Portal-Token vorhanden ist
 */
export default function PortalProtectedRoute({ children }) {
  const portalToken = localStorage.getItem("portal_access_token");
  
  if (!portalToken) {
    return <Navigate to="/portal/login" replace />;
  }
  
  return children;
}

