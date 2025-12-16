import { createContext, useContext, useState, useEffect } from "react";
import { clientApi } from "../api/clientApi";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(null);
  const [clients, setClients] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lade Clients beim Start
  useEffect(() => {
    loadClients();
  }, []);

  // Lade Fiscal Years wenn Client gewählt
  useEffect(() => {
    if (selectedClient) {
      loadFiscalYears(selectedClient.id);
    } else {
      setFiscalYears([]);
      setSelectedFiscalYear(null);
    }
  }, [selectedClient]);

  // Setze Standard-Client und Jahr wenn verfügbar
  useEffect(() => {
    if (clients.length > 0 && !selectedClient) {
      const activeClient = clients.find((c) => c.is_active) || clients[0];
      setSelectedClient(activeClient);
    }
  }, [clients]);

  // Setze Standard-Fiscal Year wenn verfügbar
  useEffect(() => {
    if (fiscalYears.length > 0 && !selectedFiscalYear) {
      const activeYear = fiscalYears.find((fy) => fy.is_active) || fiscalYears[0];
      setSelectedFiscalYear(activeYear);
    }
  }, [fiscalYears]);

  const loadClients = async () => {
    try {
      const response = await clientApi.list();
      setClients(response.data || []);
    } catch (error) {
      console.error("Fehler beim Laden der Mandanten:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFiscalYears = async (clientId) => {
    try {
      const response = await clientApi.listFiscalYears(clientId);
      const fiscalYearsData = response.data || [];
      
      // Entferne Duplikate nach Jahr: Pro Jahr nur ein Geschäftsjahr behalten
      // Bevorzuge: 1. Aktive, 2. Neueste (nach created_at)
      const yearMap = new Map();
      
      fiscalYearsData.forEach((fy) => {
        const existing = yearMap.get(fy.year);
        if (!existing) {
          yearMap.set(fy.year, fy);
        } else {
          // Entscheide welches behalten werden soll
          // Priorität: 1. Aktiv, 2. Neueres created_at
          const keepExisting = 
            (existing.is_active && !fy.is_active) ||
            (existing.is_active === fy.is_active && 
             new Date(existing.created_at || 0) > new Date(fy.created_at || 0));
          
          if (!keepExisting) {
            yearMap.set(fy.year, fy);
          }
        }
      });
      
      const uniqueFiscalYears = Array.from(yearMap.values());
      
      setFiscalYears(uniqueFiscalYears);
    } catch (error) {
      console.error("Fehler beim Laden der Geschäftsjahre:", error);
      setFiscalYears([]);
    }
  };

  const updateClient = (client) => {
    setSelectedClient(client);
    // Speichere in localStorage für Persistenz
    localStorage.setItem("selectedClientId", client.id);
  };

  const updateFiscalYear = (fiscalYear) => {
    setSelectedFiscalYear(fiscalYear);
    // Speichere in localStorage für Persistenz
    localStorage.setItem("selectedFiscalYearId", fiscalYear.id);
  };

  // Lade gespeicherte Auswahl beim Start
  useEffect(() => {
    const savedClientId = localStorage.getItem("selectedClientId");
    const savedFiscalYearId = localStorage.getItem("selectedFiscalYearId");

    if (savedClientId && clients.length > 0) {
      const client = clients.find((c) => c.id === savedClientId);
      if (client) {
        setSelectedClient(client);
      }
    }

    if (savedFiscalYearId && fiscalYears.length > 0) {
      const fiscalYear = fiscalYears.find((fy) => fy.id === savedFiscalYearId);
      if (fiscalYear) {
        setSelectedFiscalYear(fiscalYear);
      }
    }
  }, [clients, fiscalYears]);

  return (
    <AppContext.Provider
      value={{
        selectedClient,
        selectedFiscalYear,
        clients,
        fiscalYears,
        loading,
        updateClient,
        updateFiscalYear,
        loadClients,
        loadFiscalYears,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}

