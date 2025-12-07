import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import Button from "../components/Button";
import Benachrichtigung, { useBenachrichtigung } from "../components/Benachrichtigung";
import UpgradeModal from "../components/UpgradeModal";
import CsvUpload from "../components/CsvUpload";
import CsvFileList from "../components/CsvFileList";
import CsvTableView from "../components/CsvTableView";
import { 
  CreditCard, 
  FileText,
  Upload,
  RefreshCw,
  TrendingUp,
  PlayCircle
} from "lucide-react";

export default function Bank() {
  const { benachrichtigung, zeigeBenachrichtigung } = useBenachrichtigung();
  const [selectedCsvFileId, setSelectedCsvFileId] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [csvFilesCount, setCsvFilesCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalType, setUpgradeModalType] = useState("general");

  const handleRefreshCsvFiles = () => {
    // Trigger reload of CSV file list
    window.dispatchEvent(new Event('csv-uploaded'));
  };

  const handleStartMatching = async () => {
    try {
      setIsMatching(true);
      zeigeBenachrichtigung('Starte Zahlungsabgleich...', 'info');
      
      const response = await axiosInstance.post('/api/bank/csv-reconcile');
      
      const { matched, processed, errors } = response.data;
      const message = `Abgleich abgeschlossen: ${matched} von ${processed} Transaktionen zugeordnet${errors > 0 ? `, ${errors} Fehler` : ''}`;
      zeigeBenachrichtigung(message, matched > 0 ? 'erfolg' : 'info');
      
      // Reload CSV files if needed
      handleRefreshCsvFiles();
    } catch (err) {
      console.error('Fehler beim Abgleich:', err);
      const errorDetail = err.response?.data?.detail;
      if (errorDetail && typeof errorDetail === 'object' && errorDetail.error === 'match_limit_reached') {
        setUpgradeModalType('match');
        setShowUpgradeModal(true);
      } else {
        zeigeBenachrichtigung(
          typeof errorDetail === 'string' ? errorDetail : errorDetail?.message || 'Fehler beim Zahlungsabgleich',
          'fehler'
        );
      }
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <Benachrichtigung benachrichtigung={benachrichtigung} onClose={() => {}} />

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
          <span>Bank & Zahlungsabgleich</span>
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Laden Sie CSV-Dateien hoch und führen Sie einen automatischen Zahlungsabgleich durch
        </p>
      </div>

      {/* Zentraler Abgleich-Button */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl border-2 border-primary-400 shadow-lg p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  Zahlungsabgleich starten
                </h2>
                <p className="text-primary-100 text-sm">
                  Ordnet CSV-Transaktionen automatisch Mietern und Sollstellungen zu
                </p>
              </div>
            </div>
            <Button
              onClick={handleStartMatching}
              disabled={isMatching}
              variant="white"
              size="lg"
              icon={isMatching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
              className="whitespace-nowrap"
            >
              {isMatching ? 'Abgleich läuft...' : 'Abgleich starten'}
            </Button>
          </div>
        </div>
      </div>

      {/* CSV Upload Section */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Upload className="w-6 h-6 text-primary-600" />
              CSV-Dateien hochladen
            </h2>
          </div>
          <CsvUpload
            onUploadComplete={(data) => {
              zeigeBenachrichtigung(data.message, 'erfolg');
              handleRefreshCsvFiles();
            }}
            onError={(errorType) => {
              setUpgradeModalType(errorType);
              setShowUpgradeModal(true);
            }}
          />
        </div>
      </div>

      {/* CSV-Dateien-Liste */}
      <div className="mb-6 sm:mb-8">
        <CsvFileList onFileSelect={setSelectedCsvFileId} />
      </div>

      {/* CSV-Tabelle (wenn Datei ausgewählt) */}
      {selectedCsvFileId && (
        <div className="mb-6 sm:mb-8">
          <CsvTableView csvFileId={selectedCsvFileId} onClose={() => setSelectedCsvFileId(null)} />
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        limitType={upgradeModalType}
      />
    </div>
  );
}
