import { useState, useEffect } from 'react';
import { FileText, Trash2, Eye, Calendar, Database } from 'lucide-react';
import { bankApi } from '../api/bankApi';
import Button from './Button';
import Benachrichtigung, { useBenachrichtigung } from './Benachrichtigung';

export default function CsvFileList({ onFileSelect }) {
  const { benachrichtigung, zeigeBenachrichtigung } = useBenachrichtigung();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadFiles();
    
    // Höre auf CSV-Upload-Events
    const handleCsvUploaded = () => {
      console.log('CSV-Upload Event empfangen, lade Dateien neu...');
      // Warte kurz, damit Backend fertig ist
      setTimeout(() => {
        loadFiles();
      }, 500);
    };
    window.addEventListener('csv-uploaded', handleCsvUploaded);
    
    return () => {
      window.removeEventListener('csv-uploaded', handleCsvUploaded);
    };
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await bankApi.listCsvFiles();
      console.log('CSV-Dateien geladen:', response.data);
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Fehler beim Laden der CSV-Dateien:', error);
      zeigeBenachrichtigung('Fehler beim Laden der CSV-Dateien', 'fehler');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId, filename) => {
    if (!window.confirm(`Möchten Sie die Datei "${filename}" wirklich löschen?`)) {
      return;
    }

    try {
      setDeleting(fileId);
      await bankApi.deleteCsvFile(fileId);
      zeigeBenachrichtigung('CSV-Datei erfolgreich gelöscht', 'erfolg');
      loadFiles();
      if (onFileSelect) {
        onFileSelect(null); // Schließe CSV-Ansicht wenn Datei gelöscht wird
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      zeigeBenachrichtigung('Fehler beim Löschen der CSV-Datei', 'fehler');
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary-600"></div>
          <span className="ml-4 text-gray-600">Lade CSV-Dateien...</span>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">Noch keine CSV-Dateien hochgeladen</p>
        <p className="text-sm text-gray-500 mt-2">Laden Sie CSV-Dateien hoch, um sie hier zu sehen</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
      <Benachrichtigung benachrichtigung={benachrichtigung} onClose={() => {}} />
      
      <div className="px-6 py-5 border-b-2 border-gray-200 bg-gray-50/50">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-primary-600" />
          Hochgeladene CSV-Dateien ({files.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-200">
        {files.map((file) => (
          <div
            key={file.id}
            className="p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 mb-1 truncate">{file.filename}</h4>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Database className="w-4 h-4" />
                      {file.row_count.toLocaleString('de-DE')} Zeilen
                    </span>
                    <span>{formatFileSize(file.file_size)}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(file.created_at).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  onClick={() => onFileSelect && onFileSelect(file.id)}
                  variant="primary"
                  size="sm"
                  icon={<Eye className="w-4 h-4" />}
                >
                  Anzeigen
                </Button>
                <button
                  onClick={() => handleDelete(file.id, file.filename)}
                  disabled={deleting === file.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Löschen"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

