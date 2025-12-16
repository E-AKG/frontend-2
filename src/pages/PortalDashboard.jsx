import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { portalApi } from "../api/portalApi";
import { FileText, Download, Calendar, Building2, LogOut, AlertCircle, Lock, Settings, X, CheckCircle } from "lucide-react";
import { formatDate } from "../utils/formatting";
import Modal from "../components/Modal";
import Formularfeld from "../components/Formularfeld";
import Button from "../components/Button";

/**
 * Portal-Dashboard für Mieter
 * Übersicht über Betriebskostenabrechnungen
 */
export default function PortalDashboard() {
  const navigate = useNavigate();
  const { year } = useParams(); // Hole Jahr aus URL-Parameter
  const [selectedYear, setSelectedYear] = useState(
    year ? parseInt(year) : new Date().getFullYear()
  );
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordError, setPasswordError] = useState("");

  // Update selectedYear wenn URL-Parameter sich ändert
  useEffect(() => {
    if (year) {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        setSelectedYear(yearNum);
      }
    }
  }, [year]);

  // Hole Portal-User-Informationen
  const { data: userInfo, isLoading: userLoading } = useQuery({
    queryKey: ["portal-user"],
    queryFn: () => portalApi.getMe(),
  });

  // Hole BK-Statements
  const { data: statements = [], isLoading: statementsLoading } = useQuery({
    queryKey: ["portal-bk-statements", selectedYear],
    queryFn: () => portalApi.listBKStatements(selectedYear),
  });

  // Passwort-Änderung Mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data) => portalApi.changePassword(data),
    onSuccess: () => {
      setShowPasswordModal(false);
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setPasswordError("");
      alert("Passwort erfolgreich geändert!");
    },
    onError: (error) => {
      setPasswordError(error.response?.data?.detail || "Fehler beim Ändern des Passworts");
    },
  });

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPasswordError("");

    // Validierung
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError("Bitte füllen Sie alle Felder aus");
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError("Neues Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("Die neuen Passwörter stimmen nicht überein");
      return;
    }

    if (passwordForm.current_password === passwordForm.new_password) {
      setPasswordError("Das neue Passwort muss sich vom aktuellen Passwort unterscheiden");
      return;
    }

    changePasswordMutation.mutate({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("portal_access_token");
    localStorage.removeItem("portal_user_email");
    navigate("/portal/login");
  };

  const handleDownload = async (documentId, filename) => {
    try {
      const response = await portalApi.downloadDocument(documentId);
      
      // Erstelle Blob und Download-Link
      const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", filename || "document.pdf");
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Fehler beim Herunterladen:", error);
      alert(`Fehler beim Herunterladen: ${error.response?.data?.detail || error.message}`);
    }
  };

  if (userLoading || statementsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Lade Daten...</p>
        </div>
      </div>
    );
  }

  const tenantName = userInfo?.tenant
    ? `${userInfo.tenant.first_name} ${userInfo.tenant.last_name}`
    : userInfo?.email || "Mieter";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Mieterportal</h1>
                <p className="text-sm text-slate-600">Willkommen, {tenantName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Passwort ändern"
              >
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Passwort ändern</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Abmelden</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Card */}
        {userInfo?.leases && userInfo.leases.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userInfo.leases[0]?.unit && (
                <>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Einheit</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {userInfo.leases[0].unit.unit_label || "N/A"}
                    </p>
                  </div>
                  {userInfo.leases[0].unit.area && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Wohnfläche</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {userInfo.leases[0].unit.area} m²
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Mietvertrag</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {userInfo.leases[0].status === "active" ? "Aktiv" : "Beendet"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Year Selector */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Betriebskostenabrechnungen</h2>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Statements List */}
        {statements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Keine Abrechnungen verfügbar
            </h3>
            <p className="text-slate-600">
              Für das Jahr {selectedYear} sind noch keine Betriebskostenabrechnungen verfügbar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {statements.map((statement) => (
              <div
                key={statement.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-6 h-6 text-cyan-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        {statement.title || `Betriebskostenabrechnung ${statement.billing_year}`}
                      </h3>
                    </div>
                    {statement.document_date && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Abrechnungsdatum: {formatDate(statement.document_date)}
                      </p>
                    )}
                    {statement.published_at && (
                      <p className="text-sm text-slate-500 mt-1">
                        Veröffentlicht: {formatDate(statement.published_at)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDownload(statement.id, `${statement.title || "BK"}.pdf`)}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">Herunterladen</span>
                  </button>
                </div>

                {/* Receipts */}
                {statement.linked_receipts && statement.linked_receipts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Zugehörige Belege</h4>
                    <div className="space-y-2">
                      {statement.linked_receipts.map((receipt) => (
                        <div
                          key={receipt.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {receipt.title}
                              </p>
                              {receipt.document_date && (
                                <p className="text-xs text-slate-500">
                                  {formatDate(receipt.document_date)}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownload(receipt.id, receipt.title || "beleg.pdf")}
                            className="text-cyan-600 hover:text-cyan-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Passwort-Änderung Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
          setPasswordError("");
        }}
        titel="Passwort ändern"
        groesse="md"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          <Formularfeld
            label="Aktuelles Passwort"
            type="password"
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
            required
            icon={<Lock className="w-5 h-5" />}
            placeholder="Ihr aktuelles Passwort"
          />

          <Formularfeld
            label="Neues Passwort"
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            required
            icon={<Lock className="w-5 h-5" />}
            placeholder="Mindestens 8 Zeichen"
            helpText="Das Passwort muss mindestens 8 Zeichen lang sein"
          />

          <Formularfeld
            label="Neues Passwort bestätigen"
            type="password"
            value={passwordForm.confirm_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
            required
            icon={<Lock className="w-5 h-5" />}
            placeholder="Passwort wiederholen"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
                setPasswordError("");
              }}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Wird geändert...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Passwort ändern
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

