/**
 * Explications des garanties d'assurance emprunteur
 */

export const GARANTIES_EXPLICATIONS = {
  DCPTIA: {
    nom: "Décès et PTIA (Perte Totale et Irréversible d'Autonomie)",
    description: "Garantie obligatoire qui couvre le remboursement du capital restant dû en cas de décès ou si vous perdez totalement et définitivement votre autonomie (besoin d'assistance pour les actes de la vie quotidienne).",
    obligatoire: true,
  },
  IPT: {
    nom: "IPT (Invalidité Permanente Totale)",
    description: "Couvre le remboursement si vous êtes reconnu invalide à plus de 66% et dans l'incapacité totale d'exercer une activité professionnelle.",
    obligatoire: false,
  },
  IPP: {
    nom: "IPP (Invalidité Permanente Partielle)",
    description: "Couvre le remboursement partiel si vous êtes reconnu invalide entre 33% et 66% et que vous ne pouvez plus exercer normalement votre activité professionnelle.",
    obligatoire: false,
  },
  ITT: {
    nom: "ITT (Incapacité Temporaire de Travail)",
    description: "Couvre vos mensualités pendant votre arrêt de travail temporaire suite à une maladie ou un accident, après la franchise choisie (30, 60, 90 ou 180 jours).",
    obligatoire: false,
  },
};

export type TypeBien = "RESI_PRINCIPALE" | "RESI_SECONDAIRE" | "INVEST_LOCATIF" | "CREDIT_CONSO" | "RACHAT_CREDIT" | "PRO";
export type TypePret = "IMMO_AMORTISSABLE" | "IMMO_IN_FINE" | "CREDIT_CONSO";

export interface GarantiesConfig {
  obligatoires: string[];
  optionnelles: string[];
  message?: string;
}

/**
 * Déterminer les garanties par défaut selon le type de bien et le type de prêt
 */
export function getGarantiesParDefaut(typeBien: string, typePret: TypePret = "IMMO_AMORTISSABLE"): GarantiesConfig {
  // Prêt in fine : uniquement DC/PTIA
  if (typePret === "IMMO_IN_FINE") {
    return {
      obligatoires: ["DCPTIA"],
      optionnelles: [],
      message: "Pour un prêt in fine, seule la garantie Décès/PTIA est requise car vous ne remboursez que les intérêts pendant la durée du prêt.",
    };
  }

  // Normaliser le type de bien
  const typeBienNormalized = typeBien.toUpperCase();

  // Investissement locatif : DC/PTIA obligatoire + options
  if (typeBienNormalized.includes("INVEST") || typeBienNormalized.includes("LOCATIF")) {
    return {
      obligatoires: ["DCPTIA"],
      optionnelles: ["IPT", "IPP", "ITT"],
      message: "Pour un investissement locatif, la garantie Décès/PTIA est obligatoire. Les garanties IPT, IPP et ITT sont optionnelles mais recommandées pour vous protéger en cas d'incapacité à percevoir vos revenus locatifs.",
    };
  }

  // Tous les autres cas : garanties complètes
  // (Résidence principale, résidence secondaire, prêt pro, crédit conso)
  return {
    obligatoires: ["DCPTIA", "IPT", "IPP", "ITT"],
    optionnelles: [],
    message: "Pour ce type de financement, nous recommandons une couverture complète incluant toutes les garanties.",
  };
}

/**
 * Formater le message d'explication des garanties
 */
export function formatGarantiesExplication(config: GarantiesConfig): string {
  let message = "\n\n📋 **Garanties d'assurance**\n\n";
  
  if (config.message) {
    message += `${config.message}\n\n`;
  }

  // Garanties obligatoires
  if (config.obligatoires.length > 0) {
    message += "**Garanties incluses :**\n";
    config.obligatoires.forEach((code) => {
      const garantie = GARANTIES_EXPLICATIONS[code as keyof typeof GARANTIES_EXPLICATIONS];
      if (garantie) {
        message += `\n✅ **${garantie.nom}**\n`;
        message += `   ${garantie.description}\n`;
      }
    });
  }

  // Garanties optionnelles
  if (config.optionnelles.length > 0) {
    message += "\n**Garanties optionnelles (recommandées) :**\n";
    config.optionnelles.forEach((code) => {
      const garantie = GARANTIES_EXPLICATIONS[code as keyof typeof GARANTIES_EXPLICATIONS];
      if (garantie) {
        message += `\n⚪ **${garantie.nom}**\n`;
        message += `   ${garantie.description}\n`;
      }
    });
    message += "\n💡 Souhaitez-vous ajouter ces garanties optionnelles ? (Répondez 'oui' pour toutes les ajouter, 'non' pour les refuser, ou précisez lesquelles vous souhaitez)";
  }

  return message;
}

/**
 * Construire la liste des coverages pour l'API Digital Insure
 */
export function buildCoverages(garanties: string[], quotite: number, franchiseITT: number = 90) {
  const coverages: any[] = [];

  garanties.forEach((code) => {
    if (code === "DCPTIA") {
      coverages.push({
        code: "DCPTIA",
        type: "COVERAGE",
        percentage: quotite,
      });
    } else if (code === "IPT") {
      coverages.push({
        code: "IPT",
        type: "COVERAGE",
        percentage: quotite,
      });
    } else if (code === "IPP") {
      coverages.push({
        code: "IPP",
        type: "COVERAGE",
        percentage: quotite,
      });
    } else if (code === "ITT") {
      coverages.push({
        code: "ITT",
        type: "COVERAGE",
        percentage: quotite,
        deductible: franchiseITT,
      });
    }
  });

  return coverages;
}
