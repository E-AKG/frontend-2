import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Users, BarChart3, FileText, CheckCircle2, Sparkles, Building2, TrendingUp, Clock, Globe, ChevronDown, Upload } from "lucide-react";
import Button from "../components/Button";

export default function Landing() {
  const scrollToFeatures = () => {
    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Elegant & Minimal */}
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center group">
              <img 
                src="/logo.png" 
                alt="Immpire" 
                className="h-20 sm:h-24 md:h-28 w-auto transition-all duration-200 group-hover:scale-105 object-contain"
                style={{ imageRendering: 'high-quality' }}
              />
            </Link>
            <div className="flex items-center gap-6">
              <Link 
                to="/pricing" 
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors hidden sm:block"
              >
                Preise
              </Link>
              <Link 
                to="/login" 
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Anmelden
              </Link>
              <Link to="/register">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-lg hover:shadow-xl transition-all">
                  Kostenlos starten
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - MASSIVE & Premium */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-[90vh] flex items-center">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(15 23 42) 1px, transparent 0)`,
            backgroundSize: '80px 80px'
          }}></div>
        </div>
        
        {/* Gradient Orbs - Larger */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary-200/40 to-primary-400/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-slate-200/40 to-slate-400/30 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10 py-20">
          <div className="max-w-6xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-full mb-10 border border-primary-200/50 shadow-sm">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <span className="text-base font-semibold text-primary-700">Die Zukunft der Hausverwaltung</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-slate-900 mb-8 leading-[1.1] tracking-tight">
              Hausverwaltung
              <br />
              <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 bg-clip-text text-transparent">
                neu gedacht
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl lg:text-4xl text-slate-600 mb-6 max-w-4xl mx-auto leading-relaxed font-light">
              Alles, was Sie für die professionelle Verwaltung Ihrer Immobilien benötigen.
            </p>
            
            <p className="text-xl md:text-2xl text-slate-500 mb-16 max-w-3xl mx-auto font-medium">
              Einfach. Sicher. Effizient.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
              <Link to="/register">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-12 py-6 text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                >
                  Kostenlos starten
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 px-12 py-6 text-xl font-semibold transition-all"
                >
                  Preise ansehen
                </Button>
              </Link>
            </div>

            {/* Trust Indicators - Larger */}
            <div className="flex flex-wrap items-center justify-center gap-10 text-base md:text-lg text-slate-500 mb-16">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary-600" />
                <span className="font-medium">Keine Kreditkarte erforderlich</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary-600" />
                <span className="font-medium">14 Tage kostenlos testen</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary-600" />
                <span className="font-medium">Jederzeit kündbar</span>
              </div>
            </div>

            {/* Scroll Indicator - Shows next section preview */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <button
                onClick={scrollToFeatures}
                className="flex flex-col items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors group"
                aria-label="Scroll to features"
              >
                <span className="text-sm font-medium">Mehr erfahren</span>
                <ChevronDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Preview of next section - visible at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-3 gap-4 opacity-30">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Clean & Professional */}
      <section id="features-section" className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-24">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6">
              Alles, was Sie brauchen
            </h2>
            <p className="text-2xl md:text-3xl text-slate-600">
              Eine vollständige Lösung für moderne Hausverwaltung
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
            {[
              {
                icon: Building2,
                title: "Objektverwaltung",
                description: "Verwalten Sie alle Ihre Immobilien, Einheiten und Details zentral und übersichtlich.",
                color: "primary"
              },
              {
                icon: Users,
                title: "Mieterverwaltung",
                description: "Alle Mieterdaten, Verträge und Kommunikation an einem zentralen Ort.",
                color: "primary"
              },
              {
                icon: Zap,
                title: "Automatisierung",
                description: "Automatische Sollstellungen, Zahlungsabgleich und Mahnungen sparen wertvolle Zeit.",
                color: "primary"
              },
              {
                icon: BarChart3,
                title: "Analysen & Berichte",
                description: "Detaillierte Einblicke in Ihre Finanzen und Performance-Metriken.",
                color: "primary"
              },
              {
                icon: Shield,
                title: "Sicherheit & DSGVO",
                description: "Ihre Daten sind sicher, verschlüsselt und vollständig DSGVO-konform.",
                color: "primary"
              },
              {
                icon: Upload,
                title: "CSV-Import & Abgleich",
                description: "Laden Sie Ihre Bankdaten per CSV hoch und lassen Sie Zahlungen automatisch zuordnen.",
                color: "primary"
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group p-10 rounded-3xl border-2 border-slate-200 bg-white hover:border-primary-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mb-8 group-hover:from-primary-200 group-hover:to-primary-300 transition-all scale-100 group-hover:scale-110">
                    <Icon className="w-8 h-8 text-primary-700" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section - Larger */}
      <section className="py-32 bg-gradient-to-br from-slate-50 to-white">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6">
                Warum Immpire?
              </h2>
              <p className="text-2xl md:text-3xl text-slate-600">
                Die moderne Alternative für professionelle Hausverwaltung
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-12">
                {[
                  {
                    icon: TrendingUp,
                    title: "Zeitersparnis",
                    description: "Automatisieren Sie repetitive Aufgaben und sparen Sie bis zu 10 Stunden pro Woche."
                  },
                  {
                    icon: FileText,
                    title: "Einfacher CSV-Import",
                    description: "Laden Sie Ihre Bankdaten einfach per CSV hoch. Unser System erkennt automatisch Zahlungen und ordnet sie zu."
                  },
                  {
                    icon: Globe,
                    title: "Überall verfügbar",
                    description: "Arbeiten Sie von überall - im Büro, zu Hause oder unterwegs. Alles in der Cloud."
                  }
                ].map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={index} className="flex gap-6">
                      <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
                        <p className="text-lg text-slate-600 leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-16 text-white shadow-2xl">
                  <div className="space-y-10">
                    <div>
                      <div className="text-7xl font-bold mb-3">100%</div>
                      <div className="text-xl text-primary-100">DSGVO-konform</div>
                    </div>
                    <div className="h-px bg-white/20"></div>
                    <div>
                      <div className="text-7xl font-bold mb-3">24/7</div>
                      <div className="text-xl text-primary-100">Verfügbar</div>
                    </div>
                    <div className="h-px bg-white/20"></div>
                    <div>
                      <div className="text-7xl font-bold mb-3">∞</div>
                      <div className="text-xl text-primary-100">Skalierbar</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Elegant & Larger */}
      <section className="py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8">
              Bereit, Ihre Hausverwaltung zu transformieren?
            </h2>
            <p className="text-2xl md:text-3xl text-slate-300 mb-12">
              Starten Sie noch heute und erleben Sie, wie einfach professionelle Hausverwaltung sein kann.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/register">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-slate-900 hover:bg-slate-100 px-12 py-6 text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                >
                  Jetzt kostenlos starten
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button 
                  size="lg"
                  className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-12 py-6 text-xl font-semibold transition-all"
                >
                  Preise ansehen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center group">
              <img 
                src="/logo.png" 
                alt="Immpire" 
                className="h-16 sm:h-20 w-auto transition-all duration-200 group-hover:scale-105 object-contain"
                style={{ imageRendering: 'high-quality' }}
              />
            </Link>
            <div className="text-slate-600 text-sm">
              &copy; 2025 Immpire. Alle Rechte vorbehalten.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
