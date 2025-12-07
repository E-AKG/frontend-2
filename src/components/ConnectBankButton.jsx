import { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import Button from './Button';
import { Link2, Loader2, ExternalLink, AlertCircle } from 'lucide-react';

export default function ConnectBankButton({ onBankConnected }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [webFormUrl, setWebFormUrl] = useState(null);

  const startPollingForCompletion = () => {
    console.log('🔄 Starte Polling für WebForm-Abschluss...');
    
    // Polling: Prüfe alle 5 Sekunden ob Callback aufgerufen werden kann
    const pollInterval = setInterval(async () => {
      try {
        console.log('🔄 Prüfe WebForm-Status...');
        
        // Rufe Callback auf, um Bank-Verbindungen zu speichern
        const callbackResponse = await axiosInstance.post('/api/finapi/callback');
        console.log('✅ Callback erfolgreich:', callbackResponse.data);
        
        // Hole Transaktionen
        const syncResponse = await axiosInstance.post('/api/finapi/transactions/sync');
        console.log('✅ Transaktionen synchronisiert:', syncResponse.data);
        
        // Benachrichtige Parent
        if (onBankConnected) {
          onBankConnected({
            success: true,
            connections: callbackResponse.data.connections_saved || 0,
            transactions: syncResponse.data.transactions_saved || 0
          });
        }
        
        // Stop polling
        clearInterval(pollInterval);
        console.log('✅ WebForm abgeschlossen - Polling gestoppt');
        
      } catch (err) {
        // Callback noch nicht möglich - weiter pollen
        console.log('⏳ Callback noch nicht möglich, warte weiter...');
      }
    }, 5000); // Poll alle 5 Sekunden
    
    // Stop polling nach 5 Minuten
    setTimeout(() => {
      clearInterval(pollInterval);
      console.log('⏰ Polling-Timeout nach 5 Minuten');
    }, 300000);
  };

  const handleConnectBank = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏦 Starte Bank-Verbindung...');

      // Rufe Backend-Endpoint auf
      const response = await axiosInstance.get('/api/finapi/connect-bank');
      
      console.log('📥 Vollständige Response:', response.data);
      
      const webFormUrl = response.data.webFormUrl;

      console.log('✅ WebForm URL erhalten:', webFormUrl);

      if (!webFormUrl) {
        throw new Error('Keine WebForm URL erhalten');
      }

      // Öffne WebForm in neuem Tab
      console.log('🔗 Öffne WebForm in neuem Tab:', webFormUrl);
      
      // Versuche zuerst mit window.open
      let newWindow = window.open(webFormUrl, '_blank', 'width=800,height=600');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Popup wurde blockiert - speichere URL für Fallback
        console.warn('⚠️ Popup blockiert, speichere URL für direkten Link...');
        setWebFormUrl(webFormUrl);
        
        // Versuche trotzdem mit direkten Link
        const link = document.createElement('a');
        link.href = webFormUrl;
        link.target = '_blank';
        link.click();
        
        console.log('✅ WebForm wurde über direkten Link geöffnet!');
      } else {
        console.log('✅ WebForm wurde geöffnet!');
      }

      // Nach Öffnen der WebForm starte polling für Abschluss
      startPollingForCompletion();

    } catch (err) {
      console.error('❌ Fehler beim Verbinden mit Bank:', err);
      setError(err.response?.data?.detail || err.message || 'Fehler beim Verbinden mit Bank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleConnectBank}
        disabled={loading}
        className="w-full"
        icon={loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
      >
        {loading ? "Verbinde..." : "+ Bankkonto verbinden"}
      </Button>

      {error && (
        <div className="mt-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
        </div>
      )}

      {webFormUrl && (
        <div className="mt-3 p-4 bg-primary-50 border-2 border-primary-200 rounded-xl">
          <div className="flex items-start mb-3">
            <ExternalLink className="w-5 h-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-primary-900">
              Popup wurde blockiert. Bitte klicken Sie auf den Button, um die WebForm zu öffnen:
            </p>
          </div>
          <a 
            href={webFormUrl} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="primary" className="w-full" icon={<ExternalLink className="w-5 h-5" />}>
              WebForm öffnen
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}