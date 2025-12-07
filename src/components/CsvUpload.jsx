import { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Button from './Button';
import axiosInstance from '../api/axiosInstance';

export default function CsvUpload({ onUploadComplete, onError, bankAccountId, accountName }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFiles) => {
    const csvFiles = Array.from(selectedFiles).filter(file => 
      file.name.toLowerCase().endsWith('.csv')
    );
    
    if (csvFiles.length === 0) {
      alert('Bitte wählen Sie nur CSV-Dateien aus');
      return;
    }

    // Füge neue Dateien hinzu (verhindere Duplikate)
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const newFiles = csvFiles.filter(f => !existingNames.has(f.name));
      return [...prev, ...newFiles];
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Bitte wählen Sie mindestens eine CSV-Datei aus');
      return;
    }

    setUploading(true);
    setUploadResults(null);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const params = new URLSearchParams();
      if (bankAccountId) {
        params.append('bank_account_id', bankAccountId);
      }
      if (accountName) {
        params.append('account_name', accountName);
      }

      const response = await axiosInstance.post(
        `/api/bank/upload-csv?${params.toString()}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setUploadResults(response.data);
      
      console.log('CSV Upload erfolgreich:', response.data);
      
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }

      // Lösche Dateien nach erfolgreichem Upload
      setFiles([]);
      
      // Triggere Event für CSV-Liste Update (mit kurzer Verzögerung, damit Backend fertig ist)
      setTimeout(() => {
        console.log('Dispatching csv-uploaded event');
        window.dispatchEvent(new Event('csv-uploaded'));
      }, 1000);
    } catch (error) {
      console.error('Upload-Fehler:', error);
      const errorDetail = error.response?.data?.detail;
      setUploadResults({
        status: 'error',
        message: typeof errorDetail === 'string' ? errorDetail : errorDetail?.message || 'Fehler beim Hochladen der Dateien',
      });
      
      // Call error callback if limit reached
      if (errorDetail && typeof errorDetail === 'object' && errorDetail.error === 'csv_limit_reached' && onError) {
        onError('csv');
      }
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload-Bereich */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 bg-white hover:border-primary-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center shadow-lg">
            <Upload className="w-10 h-10 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            CSV-Dateien hochladen
          </h3>
          <p className="text-gray-600 mb-4">
            Ziehen Sie Ihre CSV-Dateien hierher oder klicken Sie zum Auswählen
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="primary"
            icon={<FileText className="w-5 h-5" />}
          >
            Dateien auswählen
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Unterstützt mehrere CSV-Dateien gleichzeitig
          </p>
        </div>
      </div>

      {/* Datei-Liste */}
      {files.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Ausgewählte Dateien ({files.length})
          </h4>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  title="Datei entfernen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={uploading}
              variant="success"
              className="flex-1"
              icon={uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            >
              {uploading ? 'Wird hochgeladen...' : 'Dateien hochladen'}
            </Button>
            <Button
              onClick={() => setFiles([])}
              disabled={uploading}
              variant="secondary"
            >
              Alle entfernen
            </Button>
          </div>
        </div>
      )}

      {/* Upload-Ergebnisse */}
      {uploadResults && (
        <div
          className={`rounded-2xl border-2 p-6 ${
            uploadResults.status === 'success'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {uploadResults.status === 'success' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4
                className={`font-bold text-lg mb-2 ${
                  uploadResults.status === 'success' ? 'text-emerald-900' : 'text-red-900'
                }`}
              >
                {uploadResults.status === 'success' ? 'Upload erfolgreich!' : 'Upload fehlgeschlagen'}
              </h4>
              <p
                className={`text-sm mb-3 ${
                  uploadResults.status === 'success' ? 'text-emerald-800' : 'text-red-800'
                }`}
              >
                {uploadResults.message}
              </p>
              {uploadResults.status === 'success' && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-emerald-900">
                    {uploadResults.total_imported} Transaktionen importiert
                  </p>
                  {uploadResults.files && uploadResults.files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-semibold text-emerald-900">Datei-Details:</p>
                      {uploadResults.files.map((file, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white rounded-lg border border-emerald-200"
                        >
                          <p className="text-sm font-medium text-gray-900">{file.filename}</p>
                          {file.imported !== undefined && (
                            <p className="text-xs text-gray-600 mt-1">
                              {file.imported} Transaktionen importiert
                              {file.errors > 0 && `, ${file.errors} Fehler`}
                            </p>
                          )}
                          {file.message && (
                            <p className="text-xs text-gray-600 mt-1">{file.message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setUploadResults(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

