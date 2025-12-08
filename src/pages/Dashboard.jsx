import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { propertyApi } from "../api/propertyApi";
import { unitApi } from "../api/unitApi";
import { tenantApi } from "../api/tenantApi";
import { leaseApi } from "../api/leaseApi";
import { statsApi } from "../api/statsApi";
import { subscriptionApi } from "../api/subscriptionApi";
import { 
  Building2, 
  Users, 
  FileText, 
  DoorOpen, 
  Plus, 
  TrendingUp, 
  Euro,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  X
} from "lucide-react";
import Button from "../components/Button";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    objekte: 0,
    mieter: 0,
    vertraege: 0,
    einheiten: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [progressAnimation, setProgressAnimation] = useState(0);
  const [mietdaten, setMietdaten] = useState({
    erwartet: 0,
    bezahlt: 0,
    offen: 0,
    prozent: 0,
  });
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true);

  // Check subscription status
  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => subscriptionApi.getMySubscription(),
    retry: 1,
  });

  const hasActiveSubscription = subscription?.data?.status === "active";

  useEffect(() => {
    ladeStatistiken();
    ladeDashboardDaten();
  }, []);

  useEffect(() => {
    ladeDashboardDaten();
  }, [selectedMonth]);

  const ladeStatistiken = async () => {
    try {
      const [objekteRes, mieterRes, vertraegeRes, einheitenRes] = await Promise.all([
        propertyApi.list({ page_size: 1 }),
        tenantApi.list({ page_size: 1 }),
        leaseApi.list({ page_size: 1 }),
        unitApi.list({ page_size: 1 }),
      ]);

      setStats({
        objekte: objekteRes.data.total || 0,
        mieter: mieterRes.data.total || 0,
        vertraege: vertraegeRes.data.total || 0,
        einheiten: einheitenRes.data.total || 0,
      });
    } catch (error) {
      console.error("Fehler beim Laden der Statistiken", error);
    } finally {
      setLoading(false);
    }
  };

  const ladeDashboardDaten = async () => {
    try {
      const response = await statsApi.getDashboard({
        month: selectedMonth.getMonth() + 1,
        year: selectedMonth.getFullYear(),
      });

      const rentData = response.data.rent_overview;
      setMietdaten(rentData);
      
      setTimeout(() => setProgressAnimation(rentData.prozent), 100);
    } catch (error) {
      console.error("Fehler beim Laden der Dashboard-Daten", error);
      setMietdaten({
        erwartet: 0,
        bezahlt: 0,
        offen: 0,
        prozent: 0,
      });
    }
  };

  const formatMonthYear = (date) => {
    const months = [
      "Januar", "Februar", "März", "April", "Mai", "Juni",
      "Juli", "August", "September", "Oktober", "November", "Dezember"
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const changeMonth = (delta) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedMonth(newDate);
    setProgressAnimation(0);
  };

  return (
    <div className="animate-fade-in">
      {/* Header - Simpler */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Übersicht</h1>
        <p className="text-sm sm:text-base text-gray-600">Ihre wichtigsten Informationen auf einen Blick</p>
      </div>

      {/* Upgrade Banner - Only if needed */}
      {!hasActiveSubscription && showUpgradeBanner && (
        <div className="mb-4 sm:mb-6 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-3 sm:p-4 text-white relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <div>
                <p className="text-sm sm:text-base font-semibold">Vollständigen Zugriff freischalten</p>
                <p className="text-xs sm:text-sm text-primary-100">10€/Monat - Alle Features</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={() => navigate("/pricing")}
                variant="secondary"
                size="sm"
                className="bg-white text-primary-700 hover:bg-primary-50 flex-1 sm:flex-none"
              >
                Upgrade
              </Button>
              <button
                onClick={() => setShowUpgradeBanner(false)}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats - Simpler Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[
          { titel: "Objekte", wert: stats.objekte, icon: Building2, link: "/objekte", farbe: "blue" },
          { titel: "Mieter", wert: stats.mieter, icon: Users, link: "/mieter", farbe: "emerald" },
          { titel: "Verträge", wert: stats.vertraege, icon: FileText, link: "/vertraege", farbe: "purple" },
          { titel: "Einheiten", wert: stats.einheiten, icon: DoorOpen, link: "/einheiten", farbe: "orange" },
        ].map((item, idx) => {
          const Icon = item.icon;
          const colorClasses = {
            blue: "from-blue-500 to-blue-600 bg-blue-50",
            emerald: "from-emerald-500 to-emerald-600 bg-emerald-50",
            purple: "from-purple-500 to-purple-600 bg-purple-50",
            orange: "from-orange-500 to-orange-600 bg-orange-50",
          };
          return (
            <div
              key={idx}
              onClick={() => navigate(item.link)}
              className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-5 cursor-pointer active:scale-95 hover:shadow-md transition-all touch-manipulation"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${colorClasses[item.farbe].split(' ')[0]} ${colorClasses[item.farbe].split(' ')[1]} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                {loading ? "—" : item.wert}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">{item.titel}</div>
            </div>
          );
        })}
      </div>

      {/* Mieteinnahmen - Größer und übersichtlicher */}
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
              <Euro className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              Mieteinnahmen
            </h2>
            <p className="text-sm sm:text-base text-gray-600">{formatMonthYear(selectedMonth)}</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200 w-full sm:w-auto">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-white rounded-lg transition-colors touch-manipulation"
              title="Vorheriger Monat"
            >
              ←
            </button>
            <span className="px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-700 flex-1 sm:min-w-[120px] text-center">
              {formatMonthYear(selectedMonth)}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-white rounded-lg transition-colors touch-manipulation"
              title="Nächster Monat"
            >
              →
            </button>
          </div>
        </div>

        {/* Hauptzahlen - Größer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 sm:p-6 border-2 border-gray-200">
            <div className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2 sm:mb-3">
              Erwartete Einnahmen
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              {mietdaten.erwartet.toLocaleString('de-DE')} €
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 sm:p-6 border-2 border-emerald-200">
            <div className="text-xs sm:text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-2 sm:mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Bezahlt
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-700">
              {mietdaten.bezahlt.toLocaleString('de-DE')} €
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 sm:p-6 border-2 border-amber-200">
            <div className="text-xs sm:text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2 sm:mb-3 flex items-center gap-2">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              Offen
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-700">
              {mietdaten.offen.toLocaleString('de-DE')} €
            </div>
          </div>
        </div>

        {/* Progress Bar - Größer und prominenter */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-sm sm:text-base font-semibold text-gray-700">Zahlungsfortschritt</span>
            <span className="text-2xl sm:text-3xl font-bold text-gray-900">{mietdaten.prozent}%</span>
          </div>
          <div className="h-5 sm:h-6 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-1000 ease-out rounded-full flex items-center justify-end pr-1.5 sm:pr-2 shadow-md"
              style={{ width: `${progressAnimation}%` }}
            >
              {progressAnimation > 10 && (
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-gray-600">
            <span className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500"></div>
              {mietdaten.prozent}% bezahlt
            </span>
            <span className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500"></div>
              {100 - mietdaten.prozent}% offen
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions - Simplified */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Schnellzugriff</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          {[
            { label: "Objekt anlegen", link: "/objekte?create=true", icon: Building2 },
            { label: "Einheit anlegen", link: "/einheiten?create=true", icon: DoorOpen },
            { label: "Mieter anlegen", link: "/mieter?create=true", icon: Users },
            { label: "Vertrag erstellen", link: "/vertraege?create=true", icon: FileText },
            { label: "Bank & Abgleich", link: "/bank", icon: TrendingUp },
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(action.link)}
                className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 active:bg-gray-100 hover:bg-gray-100 rounded-lg transition-all text-left touch-manipulation"
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-900">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
