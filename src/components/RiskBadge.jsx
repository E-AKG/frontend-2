import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";

/**
 * RiskBadge - Zeigt den Zahlungsrisiko-Score eines Mieters an
 * 
 * @param {number|null} score - Risk Score (0-100)
 * @param {string|null} level - Risk Level ("low", "medium", "high")
 * @param {boolean} showScore - Ob der Score angezeigt werden soll (default: true)
 * @param {string} size - Größe: "sm" | "md" | "lg" (default: "md")
 */
export default function RiskBadge({ score, level, showScore = true, size = "md" }) {
  // Wenn kein Score vorhanden, zeige neutrales Badge
  if (score === null || score === undefined || level === null || level === undefined) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
        <HelpCircle className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Nicht berechnet</span>
      </div>
    );
  }

  // Bestimme Farbe und Icon basierend auf Level
  const config = {
    low: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: CheckCircle2,
      label: "Niedrig"
    },
    medium: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: AlertTriangle,
      label: "Mittel"
    },
    high: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      icon: AlertCircle,
      label: "Hoch"
    }
  };

  const style = config[level] || config.medium;
  const Icon = style.icon;

  // Größen-Klassen
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4"
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg border ${style.bg} ${style.text} ${style.border} ${sizeClasses[size]}`}
      title={`Zahlungsrisiko-Score: ${score}/100. Dieser Wert basiert auf dem Zahlungsverhalten der letzten 6 Monate (Pünktlichkeit, Rückstände, Verspätungen).`}
    >
      <Icon className={iconSizes[size]} />
      {showScore && (
        <span className="font-semibold">{score}</span>
      )}
      <span className="font-medium">{style.label}</span>
    </div>
  );
}

