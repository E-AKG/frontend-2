import { NavLink, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { 
  LayoutDashboard, 
  Building2, 
  DoorOpen, 
  Users, 
  FileText, 
  Receipt, 
  CreditCard, 
  Settings,
  ChevronDown,
  LogOut,
  User,
  Menu,
  X
} from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Vereinfachte Navigation - Gruppiert nach Funktion
  const navLinks = [
    { path: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
    { path: "/objekte", label: "Objekte", icon: Building2 },
    { path: "/einheiten", label: "Einheiten", icon: DoorOpen },
    { path: "/mieter", label: "Mieter", icon: Users },
    { path: "/vertraege", label: "Verträge", icon: FileText },
    { path: "/sollstellungen", label: "Sollstellungen", icon: Receipt },
    { path: "/bank", label: "Bank", icon: CreditCard },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-gray-200/80 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center group touch-manipulation">
            <img 
              src="/logo.png" 
              alt="Immpire" 
              className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto transition-all duration-200 group-active:scale-95 sm:group-hover:scale-105 object-contain"
              style={{ imageRendering: 'high-quality' }}
            />
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 ${
                      isActive
                        ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/20"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </NavLink>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-all touch-manipulation"
              aria-label="Menü"
            >
              {showMobileMenu ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>

          {/* User Menu */}
          <div className="hidden lg:relative lg:block" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 touch-manipulation"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-xs sm:text-sm font-bold">
                  {localStorage.getItem("user_email")?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <ChevronDown
                className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-600 transition-transform duration-200 ${
                  showUserMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200/50 py-2 animate-slide-down">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-900">Benutzer</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {localStorage.getItem("user_email") || "benutzer@immpire.de"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigate("/einstellungen");
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Einstellungen
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Abmelden
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 py-3 sm:py-4 animate-slide-down">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={({ isActive }) =>
                      `px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 sm:gap-3 touch-manipulation active:scale-95 ${
                        isActive
                          ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md"
                          : "text-gray-600 active:text-gray-900 active:bg-gray-100"
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    {link.label}
                  </NavLink>
                );
              })}
            </div>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
              <div className="px-3 sm:px-4 py-2 mb-2">
                <p className="text-xs font-bold text-gray-900">Benutzer</p>
                <p className="text-xs text-gray-500 truncate">
                  {localStorage.getItem("user_email") || "benutzer@izenic.de"}
                </p>
              </div>
              <button
                onClick={() => {
                  navigate("/einstellungen");
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-700 active:bg-gray-50 rounded-xl transition-colors flex items-center gap-2 sm:gap-3 touch-manipulation active:scale-95"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                Einstellungen
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium text-red-600 active:bg-red-50 rounded-xl transition-colors flex items-center gap-2 sm:gap-3 touch-manipulation active:scale-95"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                Abmelden
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

