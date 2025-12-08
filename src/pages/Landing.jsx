import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Users, BarChart3, FileText, CheckCircle2, Sparkles, Building2, TrendingUp, Clock, Globe, Upload, Star, Award, Rocket, ExternalLink, Mail, HelpCircle } from "lucide-react";
import Button from "../components/Button";

export default function Landing() {

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header - Modern & Glassmorphic */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link to="/" className="flex items-center group touch-manipulation">
              <img 
                src="/logo.png" 
                alt="Immpire" 
                className="h-14 sm:h-16 md:h-18 lg:h-20 w-auto transition-all duration-300 group-active:scale-95 sm:group-hover:scale-110 object-contain"
                style={{ imageRendering: 'high-quality' }}
              />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <Link 
                to="/pricing" 
                className="text-slate-700 hover:text-primary-600 font-semibold transition-all duration-200 hidden sm:block text-sm sm:text-base"
              >
                Preise
              </Link>
              <Link 
                to="/login" 
                className="text-slate-700 hover:text-primary-600 font-semibold transition-all duration-200 text-xs sm:text-sm md:text-base touch-manipulation px-3 sm:px-4 rounded-lg hover:bg-slate-50 flex items-center justify-center h-[36px] sm:h-[40px]"
              >
                Anmelden
              </Link>
              <Link to="/register" className="touch-manipulation">
                <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white border-0 shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm px-3 sm:px-4 h-[36px] sm:h-[40px]">
                  Kostenlos starten
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Clean & Modern */}
      <section className="relative overflow-hidden bg-white min-h-screen flex items-center pt-20">
        <div className="container mx-auto px-4 sm:px-6 relative z-10 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              {/* Badge */}
              <div className="inline-flex items-center justify-center px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-primary-50 rounded-full mb-6 sm:mb-8 md:mb-10 border-2 border-primary-200 shadow-md animate-fade-in">
                <span className="text-xs sm:text-sm md:text-base font-bold text-primary-700 text-center">Die Zukunft der Hausverwaltung</span>
              </div>
              
              {/* IZENIC Branding Badge */}
              <div className="mb-4 sm:mb-6 animate-fade-in" style={{ animationDelay: '0.05s' }}>
                <a 
                  href="https://www.izenic.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-all group touch-manipulation"
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap">Entwickelt von</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap">IZENIC</span>
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600 group-hover:text-primary-600 transition-colors flex-shrink-0" />
                </a>
              </div>
              
              {/* Main Headline with Gradient Animation */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-extrabold text-slate-900 mb-4 sm:mb-6 md:mb-8 leading-[1.05] tracking-tight px-2 sm:px-4 animate-fade-in">
                Hausverwaltung
                <br />
                <span className="text-primary-600">
                  neu gedacht
                </span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-slate-700 mb-3 sm:mb-4 md:mb-6 max-w-5xl mx-auto leading-relaxed font-medium px-4 sm:px-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Alles, was Sie für die professionelle Verwaltung Ihrer Immobilien benötigen.
              </p>
              
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto font-semibold px-4 sm:px-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Einfach. Sicher. Effizient.
              </p>
              
              {/* CTA Buttons - Clean & Modern */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center items-center mb-8 sm:mb-12 md:mb-16 px-4 sm:px-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Link to="/register" className="w-full sm:w-auto touch-manipulation">
                  <Button 
                    size="lg" 
                    className="bg-primary-600 hover:bg-primary-700 text-white w-full sm:w-auto px-8 sm:px-12 md:px-14 py-4 sm:py-5 md:py-6 text-base sm:text-lg md:text-xl lg:text-2xl font-bold shadow-lg hover:shadow-xl transition-all transform active:scale-95 sm:hover:scale-105"
                  >
                    <span className="flex items-center justify-center gap-2 sm:gap-3">
                      <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
                      Kostenlos starten
                      <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </span>
                  </Button>
                </Link>
                <Link to="/pricing" className="w-full sm:w-auto touch-manipulation">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-2 border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-primary-400 w-full sm:w-auto px-8 sm:px-12 md:px-14 py-4 sm:py-5 md:py-6 text-base sm:text-lg md:text-xl lg:text-2xl font-bold transition-all active:scale-95 bg-white shadow-sm hover:shadow-md"
                  >
                    Preise ansehen
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators - Enhanced */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 mb-8 sm:mb-10 md:mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-emerald-500 flex-shrink-0" />
                  <span className="font-semibold whitespace-nowrap">Keine Kreditkarte</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-emerald-500 flex-shrink-0" />
                  <span className="font-semibold whitespace-nowrap">14 Tage kostenlos</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-emerald-500 flex-shrink-0" />
                  <span className="font-semibold whitespace-nowrap">Jederzeit kündbar</span>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 max-w-3xl mx-auto px-2 sm:px-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                {[
                  { number: "10+", label: "Stunden gespart", icon: Clock },
                  { number: "100%", label: "DSGVO-konform", icon: Shield },
                  { number: "24/7", label: "Verfügbar", icon: Globe }
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-slate-200/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary-600 mx-auto mb-1 sm:mb-2 flex-shrink-0" />
                      <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 mb-0.5 sm:mb-1">{stat.number}</div>
                      <div className="text-[10px] sm:text-xs md:text-sm text-slate-600 font-medium leading-tight">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Features Section - Clean & Modern */}
      <section id="features-section" className="py-20 sm:py-28 md:py-36 bg-white relative">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center mb-16 sm:mb-20 md:mb-28">
            <div className="inline-block px-4 py-1.5 bg-primary-100 rounded-full mb-4">
              <span className="text-sm font-bold text-primary-700">Features</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-4 sm:mb-6">
              Alles, was Sie brauchen
            </h2>
            <p className="text-xl sm:text-2xl md:text-3xl text-slate-600 font-medium">
              Eine vollständige Lösung für moderne Hausverwaltung
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto">
            {[
              {
                icon: Building2,
                title: "Objektverwaltung",
                description: "Verwalten Sie alle Ihre Immobilien, Einheiten und Details zentral und übersichtlich.",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: Users,
                title: "Mieterverwaltung",
                description: "Alle Mieterdaten, Verträge und Kommunikation an einem zentralen Ort.",
                gradient: "from-emerald-500 to-teal-500"
              },
              {
                icon: Zap,
                title: "Automatisierung",
                description: "Automatische Sollstellungen, Zahlungsabgleich und Mahnungen sparen wertvolle Zeit.",
                gradient: "from-amber-500 to-orange-500"
              },
              {
                icon: BarChart3,
                title: "Analysen & Berichte",
                description: "Detaillierte Einblicke in Ihre Finanzen und Performance-Metriken.",
                gradient: "from-primary-500 to-blue-400"
              },
              {
                icon: Shield,
                title: "Sicherheit & DSGVO",
                description: "Ihre Daten sind sicher, verschlüsselt und vollständig DSGVO-konform.",
                gradient: "from-indigo-500 to-blue-500"
              },
              {
                icon: Upload,
                title: "CSV-Import & Abgleich",
                description: "Laden Sie Ihre Bankdaten per CSV hoch und lassen Sie Zahlungen automatisch zuordnen.",
                gradient: "from-primary-400 to-blue-500"
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group relative p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-white border-2 border-slate-200 hover:border-transparent hover:shadow-2xl transition-all duration-500 transform active:scale-95 sm:hover:-translate-y-2 overflow-hidden"
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br ${feature.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 md:mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 group-hover:text-white mb-2 sm:mb-3 md:mb-4 transition-colors duration-500">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base md:text-lg text-slate-600 group-hover:text-white/90 leading-relaxed transition-colors duration-500">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section - Clean & Modern */}
      <section className="py-20 sm:py-28 md:py-36 bg-slate-900 text-white relative">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 sm:mb-20 md:mb-24">
              <div className="inline-block px-4 py-1.5 bg-primary-500/20 rounded-full mb-4">
                <span className="text-sm font-bold text-primary-300">Warum Immpire?</span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 sm:mb-6">
                Die moderne Alternative
              </h2>
              <p className="text-xl sm:text-2xl md:text-3xl text-slate-300 font-medium">
                Für professionelle Hausverwaltung
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 lg:gap-20 items-start md:items-center">
              <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12">
                {[
                  {
                    icon: TrendingUp,
                    title: "Zeitersparnis",
                    description: "Automatisieren Sie repetitive Aufgaben und sparen Sie bis zu 10 Stunden pro Woche.",
                    gradient: "from-emerald-400 to-teal-400"
                  },
                  {
                    icon: FileText,
                    title: "Einfacher CSV-Import",
                    description: "Laden Sie Ihre Bankdaten einfach per CSV hoch. Unser System erkennt automatisch Zahlungen und ordnet sie zu.",
                    gradient: "from-blue-400 to-cyan-400"
                  },
                  {
                    icon: Globe,
                    title: "Überall verfügbar",
                    description: "Arbeiten Sie von überall - im Büro, zu Hause oder unterwegs. Alles in der Cloud.",
                    gradient: "from-primary-400 to-blue-400"
                  }
                ].map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 group">
                      <div className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br ${benefit.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold mb-1 sm:mb-2 md:mb-3">{benefit.title}</h3>
                        <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Stats Card */}
              <div className="relative w-full">
                <div className="bg-primary-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-14 xl:p-16 text-white shadow-2xl">
                  <div className="space-y-8 sm:space-y-10 md:space-y-12">
                    {[
                      { number: "100%", label: "DSGVO-konform", icon: Shield },
                      { number: "24/7", label: "Verfügbar", icon: Clock },
                      { number: "∞", label: "Skalierbar", icon: Rocket }
                    ].map((stat, idx) => {
                      const Icon = stat.icon;
                      return (
                        <div key={idx}>
                          <div className="flex items-center gap-4 mb-2">
                            <Icon className="w-8 h-8 text-primary-200" />
                            <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold">{stat.number}</div>
                          </div>
                          <div className="text-lg sm:text-xl md:text-2xl text-primary-100 font-semibold">{stat.label}</div>
                          {idx < 2 && <div className="h-px bg-white/20 mt-6"></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Clean & Modern */}
      <section className="py-20 sm:py-28 md:py-36 bg-white relative">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block px-4 py-1.5 bg-primary-100 rounded-full mb-6">
              <span className="text-sm font-bold text-primary-700">Bereit loszulegen?</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 sm:mb-8">
              Transformieren Sie Ihre
              <br />
              <span className="text-primary-600">
                Hausverwaltung heute
              </span>
            </h2>
            <p className="text-xl sm:text-2xl md:text-3xl text-slate-600 mb-10 sm:mb-12 font-medium">
              Starten Sie noch heute und erleben Sie, wie einfach professionelle Hausverwaltung sein kann.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center items-center px-4">
              <Link to="/register" className="w-full sm:w-auto touch-manipulation">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-primary-600 hover:bg-primary-700 text-white w-full sm:w-auto px-8 sm:px-12 md:px-16 py-5 sm:py-6 md:py-7 text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold shadow-lg hover:shadow-xl transition-all transform active:scale-95 sm:hover:scale-105"
                >
                  <span className="flex items-center justify-center gap-2 sm:gap-3">
                    <Rocket className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                    Jetzt kostenlos starten
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                  </span>
                </Button>
              </Link>
              <Link to="/pricing" className="w-full sm:w-auto touch-manipulation">
                <Button 
                  size="lg"
                  className="bg-white border-2 border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-primary-400 w-full sm:w-auto px-8 sm:px-12 md:px-16 py-5 sm:py-6 md:py-7 text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold transition-all active:scale-95 shadow-md hover:shadow-lg"
                >
                  Preise ansehen
                </Button>
              </Link>
            </div>
            
            {/* Social Proof */}
            <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 border-2 border-white"></div>
                  ))}
                </div>
                <div className="ml-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="text-xs text-slate-600 font-semibold">500+ zufriedene Kunden</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-slate-50 to-white border-t border-slate-200">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 sm:p-6 md:p-8 lg:p-10 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">
                    Benötigen Sie Hilfe oder Support?
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 leading-relaxed">
                    Immpire wird von <strong className="text-slate-900">IZENIC</strong> entwickelt und betreut. 
                    Für Support, Fragen oder weitere Informationen besuchen Sie bitte die IZENIC Website.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <a 
                      href="https://www.izenic.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 touch-manipulation"
                    >
                      <span>IZENIC Website besuchen</span>
                      <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                    </a>
                    <a 
                      href="mailto:kontakt@izenic.com" 
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-300 hover:border-primary-400 text-slate-700 hover:text-primary-700 rounded-xl font-semibold transition-all touch-manipulation"
                    >
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Support kontaktieren</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Modern with IZENIC Branding */}
      <footer className="border-t border-slate-200 bg-white py-10 sm:py-12 md:py-14">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Immpire Branding */}
            <div>
              <Link to="/" className="flex items-center group touch-manipulation mb-4">
                <img 
                  src="/logo.png" 
                  alt="Immpire" 
                  className="h-10 sm:h-14 md:h-16 w-auto transition-all duration-200 group-active:scale-95 sm:group-hover:scale-110 object-contain"
                  style={{ imageRendering: 'high-quality' }}
                />
              </Link>
              <p className="text-sm text-slate-600 mb-2">
                Professionelle Hausverwaltung
              </p>
              <p className="text-xs text-slate-500">
                Ein Produkt von <strong className="text-slate-700">IZENIC</strong>
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-4">Schnellzugriff</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/pricing" className="text-sm text-slate-600 hover:text-primary-600 transition-colors">
                    Preise
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-sm text-slate-600 hover:text-primary-600 transition-colors">
                    Registrieren
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-sm text-slate-600 hover:text-primary-600 transition-colors">
                    Anmelden
                  </Link>
                </li>
              </ul>
            </div>

            {/* IZENIC Info */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-4">Unternehmen & Support</h4>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://www.izenic.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-slate-600 hover:text-primary-600 transition-colors inline-flex items-center gap-1"
                  >
                    IZENIC Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:kontakt@izenic.com" 
                    className="text-sm text-slate-600 hover:text-primary-600 transition-colors inline-flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    Support kontaktieren
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:kontakt@izenic.com" 
                    className="text-sm text-slate-600 hover:text-primary-600 transition-colors inline-flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    Allgemeine Anfragen
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-slate-200 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-slate-600 text-xs sm:text-sm text-center sm:text-left">
                <p className="mb-1">
                  &copy; 2025 <strong className="text-slate-900">IZENIC</strong>. Alle Rechte vorbehalten.
                </p>
                <p className="text-slate-500">
                  Immpire ist ein Produkt von IZENIC
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Entwickelt von</span>
                <a 
                  href="https://www.izenic.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-slate-900 hover:text-primary-600 transition-colors inline-flex items-center gap-1"
                >
                  IZENIC
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
