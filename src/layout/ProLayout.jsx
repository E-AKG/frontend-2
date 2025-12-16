import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { searchApi } from "../api/searchApi";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Receipt,
  CreditCard,
  Wrench,
  FolderOpen,
  BarChart3,
  Menu,
  X,
  ChevronDown,
  Search,
  Bell,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";

export default function ProLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedClient, selectedFiscalYear, clients, fiscalYears, updateClient, updateFiscalYear } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Dark Mode Toggle
  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Search functionality
  useEffect(() => {
    if (searchQuery.length > 0) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      setSearchLoading(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await searchApi.spotlight(searchQuery, {
            client_id: selectedClient?.id,
            fiscal_year_id: selectedFiscalYear?.id,
          });
          setSearchResults(response.data || []);
        } catch (error) {
          console.error("Suche fehlgeschlagen:", error);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      }, 300); // Debounce 300ms
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedClient, selectedFiscalYear]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // CMD+K or CTRL+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
        setSearchQuery("");
        setSelectedResultIndex(0);
      }
      // ESC to close search
      if (e.key === "Escape" && showSearch) {
        setShowSearch(false);
        setSearchQuery("");
        setSearchResults([]);
      }
      // Arrow keys in search
      if (showSearch && searchResults.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedResultIndex((prev) => 
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedResultIndex((prev) => (prev > 0 ? prev - 1 : 0));
        }
        if (e.key === "Enter" && searchResults[selectedResultIndex]) {
          e.preventDefault();
          navigate(searchResults[selectedResultIndex].url);
          setShowSearch(false);
          setSearchQuery("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch, searchResults, selectedResultIndex, navigate]);

  // Focus input when search opens
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const getTypeIcon = (type) => {
    switch (type) {
      case "property":
        return Building2;
      case "unit":
        return DoorOpen;
      case "tenant":
        return Users;
      case "lease":
        return FileText;
      case "charge":
        return Receipt;
      default:
        return FileText;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      property: "Objekt",
      unit: "Einheit",
      tenant: "Mieter",
      lease: "Vertrag",
      charge: "Offene Posten",
    };
    return labels[type] || type;
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const navigation = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/verwaltung", label: "Verwaltung", icon: Building2 },
    { path: "/personen", label: "Personen", icon: Users },
    { path: "/vertraege", label: "Verträge", icon: FileText },
    { path: "/finanzen", label: "Finanzen", icon: CreditCard },
    { path: "/abrechnung", label: "Abrechnung", icon: Receipt },
    { path: "/bk-verwaltung", label: "BK-Verwaltung", icon: FileText },
    { path: "/vorgaenge", label: "Vorgänge", icon: Wrench },
    { path: "/dokumente", label: "Dokumente", icon: FolderOpen },
    { path: "/berichte", label: "Berichte", icon: BarChart3 },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-gray-900" : "bg-gray-50"}`} data-layout="ProLayout" data-version="2.0">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 z-40 ${
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
            <NavLink to="/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="Immpire Pro" className="h-8 w-auto" />
              <span className="font-bold text-lg text-gray-900 dark:text-white">Immpire Pro</span>
            </NavLink>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary-600 text-white shadow-md"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "lg:pl-64" : "lg:pl-0"}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Left: Menu + Context Selectors */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Client Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowClientDropdown(!showClientDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedClient?.name || "Mandant wählen"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {showClientDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowClientDropdown(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                      <div className="p-2">
                        {clients.map((client) => (
                          <button
                            key={client.id}
                            onClick={() => {
                              updateClient(client);
                              setShowClientDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                              selectedClient?.id === client.id
                                ? "bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                                : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            {client.name}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            navigate("/clients/new");
                            setShowClientDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 rounded-lg text-sm text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 mt-2"
                        >
                          + Neuer Mandant
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Fiscal Year Dropdown */}
              {selectedClient && (
                <div className="relative">
                  <button
                    onClick={() => setShowYearDropdown(!showYearDropdown)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedFiscalYear?.year || "Jahr wählen"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  {showYearDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowYearDropdown(false)}
                      />
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                        <div className="p-2">
                          {fiscalYears.map((fy) => (
                            <button
                              key={fy.id}
                              onClick={() => {
                                updateFiscalYear(fy);
                                setShowYearDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                                selectedFiscalYear?.id === fy.id
                                  ? "bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                              }`}
                            >
                              {fy.year}
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              navigate(`/clients/${selectedClient.id}/fiscal-years/new`);
                              setShowYearDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 rounded-lg text-sm text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 mt-2"
                          >
                            + Neues Jahr
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right: Search + Notifications + User Menu */}
            <div className="flex items-center gap-2">
              {/* Search Button */}
              <button
                onClick={() => setShowSearch(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400"
              >
                <Search className="w-4 h-4" />
                <span className="hidden lg:inline">Suchen...</span>
                <kbd className="hidden lg:inline px-1.5 py-0.5 text-xs bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
                  ⌘K
                </kbd>
              </button>

              {/* Notifications */}
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold hover:ring-2 hover:ring-primary-300 transition-all"
                >
                  {localStorage.getItem("user_email")?.charAt(0).toUpperCase() || "U"}
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                      <div className="p-2">
                        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 mb-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {localStorage.getItem("user_email") || "Benutzer"}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            navigate("/einstellungen");
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          Einstellungen
                        </button>
                        <button
                          onClick={() => {
                            handleLogout();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 mt-1"
                        >
                          <LogOut className="w-4 h-4" />
                          Abmelden
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
              setSearchResults([]);
            }} 
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Suchen nach Objekten, Mietern, Einheiten..."
                className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedResultIndex(0);
                }}
              />
              <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                ESC
              </kbd>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {searchLoading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Suche läuft...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result, index) => {
                    const Icon = getTypeIcon(result.type);
                    return (
                      <button
                        key={result.id}
                        onClick={() => {
                          navigate(result.url);
                          setShowSearch(false);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          index === selectedResultIndex
                            ? "bg-primary-50 dark:bg-primary-900/30"
                            : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded">
                                {getTypeLabel(result.type)}
                              </span>
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : searchQuery.length > 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Keine Ergebnisse gefunden
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Tippen Sie, um zu suchen...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

