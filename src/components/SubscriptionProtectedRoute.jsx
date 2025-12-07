import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { subscriptionApi } from "../api/subscriptionApi";
import UpgradeRequired from "../pages/UpgradeRequired";

export default function SubscriptionProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check subscription status
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => subscriptionApi.getMySubscription(),
    retry: 1,
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Lade...</p>
        </div>
      </div>
    );
  }

  // Check if user has active subscription
  const hasActiveSubscription = subscription?.data?.status === "active";

  if (!hasActiveSubscription) {
    return <UpgradeRequired />;
  }

  return children;
}

