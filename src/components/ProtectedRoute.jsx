import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // WICHTIG: Muss mit dem Key übereinstimmen, der in Login.jsx verwendet wird!
  const token = localStorage.getItem("access_token");

  console.log("🔒 ProtectedRoute - Token vorhanden:", token ? "Ja" : "Nein");
  
  if (!token) {
    console.log("❌ ProtectedRoute - Kein Token, redirect zu /login");
    return <Navigate to="/login" replace />;
  }

  console.log("✅ ProtectedRoute - Token gefunden, erlaube Zugriff");
  return children;
}

