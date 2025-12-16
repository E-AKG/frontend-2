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
  Upload
} from "lucide-react";

export default function Bank() {
  const { benachrichtigung, zeigeBenachrichtigung } = useBenachrichtigung();
  const [selectedCsvFileId, setSelectedCsvFileId] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalType, setUpgradeModalType] = useState("general");

  const handleRefreshCsvFiles = () => {
    // Trigger reload of CSV file list
    window.dispatchEvent(new Event('csv-uploaded'));
  };

  return (
    <div className="p-6 space-y-6">
      <Benachrichtigung benachrichtigung={benachrichtigung} onClose={() => {}} />

      {/* Header - Einheitlich mit anderen Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Upload className="w-8 h-8 text-primary-600" />
            CSV-Import
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Bank-Transaktionen per CSV-Datei importieren
          </p>
        </div>
      </div>

      {/* CSV Upload Section - Einheitliches Design */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Upload className="w-6 h-6 text-primary-600" />
            CSV-Dateien hochladen
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Laden Sie Ihre Bank-Transaktionen als CSV-Datei hoch
          </p>
        </div>
        <div className="p-6">
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

      {/* CSV-Dateien-Liste - Einheitliches Design */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Hochgeladene Dateien
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Übersicht aller importierten CSV-Dateien
          </p>
        </div>
        <div className="p-6">
          <CsvFileList onFileSelect={setSelectedCsvFileId} />
        </div>
      </div>

      {/* CSV-Tabelle (wenn Datei ausgewählt) */}
      {selectedCsvFileId && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <CsvTableView csvFileId={selectedCsvFileId} onClose={() => setSelectedCsvFileId(null)} />
          </div>
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
