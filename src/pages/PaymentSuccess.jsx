import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader } from "lucide-react";
import Button from "../components/Button";
import { subscriptionApi } from "../api/subscriptionApi";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    
    if (!sessionId) {
      // No session ID, redirect to pricing
      setTimeout(() => navigate("/pricing"), 3000);
      return;
    }

    // Fetch subscription status
    const fetchSubscription = async () => {
      try {
        // Wait a bit for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await subscriptionApi.getMySubscription();
        setSubscription(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching subscription:", error);
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Zahlung wird verarbeitet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Zahlung erfolgreich!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Vielen Dank für Ihr Abonnement. Ihr Zugang wurde aktiviert.
          </p>

          {subscription && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600 mb-1">Plan:</p>
              <p className="font-semibold text-gray-900">{subscription.plan_name}</p>
              
              {subscription.current_period_end && (
                <>
                  <p className="text-sm text-gray-600 mb-1 mt-3">Nächste Zahlung:</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(subscription.current_period_end).toLocaleDateString("de-DE")}
                  </p>
                </>
              )}
            </div>
          )}

          <Button
            onClick={() => navigate("/dashboard")}
            size="lg"
            className="w-full"
          >
            Zum Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

