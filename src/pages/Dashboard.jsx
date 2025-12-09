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
      {/* Header - Größer */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3">Übersicht</h1>
        <p className="text-base sm:text-lg lg:text-xl text-gray-600">Ihre wichtigsten Informationen auf einen Blick</p>
      </div>

      {/* Upgrade Banner - Only if needed */}
      {!hasActiveSubscription && showUpgradeBanner && (
        <div className="mb-6 sm:mb-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 sm:p-5 lg:p-6 text-white relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 flex-shrink-0" />
              <div>
                <p className="text-base sm:text-lg lg:text-xl font-bold">Vollständigen Zugriff freischalten</p>
                <p className="text-sm sm:text-base lg:text-lg text-primary-100">10€/Monat - Alle Features</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={() => navigate("/pricing")}
                variant="secondary"
                size="lg"
                className="bg-white text-primary-700 hover:bg-primary-50 flex-1 sm:flex-none text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
              >
                Upgrade
              </Button>
              <button
                onClick={() => setShowUpgradeBanner(false)}
                className="p-2 sm:p-3 hover:bg-white/20 rounded-lg flex-shrink-0 touch-manipulation"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats - Größer */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
              className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-6 lg:p-8 cursor-pointer active:scale-95 hover:shadow-lg transition-all touch-manipulation"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br ${colorClasses[item.farbe].split(' ')[0]} ${colorClasses[item.farbe].split(' ')[1]} flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 sm:mb-2">
                {loading ? "—" : item.wert}
              </div>
              <div className="text-sm sm:text-base lg:text-lg font-semibold text-gray-600">{item.titel}</div>
            </div>
          );
        })}
      </div>

      {/* Mieteinnahmen - Größer und übersichtlicher */}
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-5 sm:p-6 lg:p-8 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
              <Euro className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary-600" />
              Mieteinnahmen
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">{formatMonthYear(selectedMonth)}</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 sm:p-1.5 border-2 border-gray-200 w-full sm:w-auto">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 sm:p-3 hover:bg-white rounded-lg transition-colors touch-manipulation text-lg sm:text-xl font-bold"
              title="Vorheriger Monat"
            >
              ←
            </button>
            <span className="px-3 sm:px-4 text-sm sm:text-base lg:text-lg font-semibold text-gray-700 flex-1 sm:min-w-[140px] text-center">
              {formatMonthYear(selectedMonth)}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 sm:p-3 hover:bg-white rounded-lg transition-colors touch-manipulation text-lg sm:text-xl font-bold"
              title="Nächster Monat"
            >
              →
            </button>
          </div>
        </div>

        {/* Hauptzahlen - Größer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 sm:p-6 lg:p-8 border-2 border-gray-200">
            <div className="text-sm sm:text-base font-semibold text-gray-600 uppercase tracking-wide mb-3 sm:mb-4">
              Erwartete Einnahmen
            </div>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              {mietdaten.erwartet.toLocaleString('de-DE')} €
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5 sm:p-6 lg:p-8 border-2 border-emerald-200">
            <div className="text-sm sm:text-base font-semibold text-emerald-700 uppercase tracking-wide mb-3 sm:mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              Bezahlt
            </div>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-700">
              {mietdaten.bezahlt.toLocaleString('de-DE')} €
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 sm:p-6 lg:p-8 border-2 border-amber-200">
            <div className="text-sm sm:text-base font-semibold text-amber-700 uppercase tracking-wide mb-3 sm:mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Offen
            </div>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-700">
              {mietdaten.offen.toLocaleString('de-DE')} €
            </div>
          </div>
        </div>

        {/* Progress Bar - Größer und prominenter */}
        <div className="bg-gray-50 rounded-xl p-5 sm:p-6 lg:p-8 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <span className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700">Zahlungsfortschritt</span>
            <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">{mietdaten.prozent}%</span>
          </div>
          <div className="h-6 sm:h-8 lg:h-10 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-1000 ease-out rounded-full flex items-center justify-end pr-2 sm:pr-3 shadow-md"
              style={{ width: `${progressAnimation}%` }}
            >
              {progressAnimation > 10 && (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg font-medium text-gray-600">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500"></div>
              {mietdaten.prozent}% bezahlt
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500"></div>
              {100 - mietdaten.prozent}% offen
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions - Größer */}
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-5 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Schnellzugriff</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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
                className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-gray-50 active:bg-gray-100 hover:bg-gray-100 rounded-xl transition-all text-left touch-manipulation border border-gray-200 hover:border-primary-300"
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary-600 flex-shrink-0" />
                <span className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
