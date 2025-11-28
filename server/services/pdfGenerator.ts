/**
 * Service de génération de PDF pour les devis d'assurance
 * Utilise pdfkit pour créer des documents PDF professionnels
 */

import PDFDocument from "pdfkit";

export interface QuotePdfData {
  quoteId: string;
  generatedAt: string;
  borrower: {
    name: string;
    birthDate: string;
    email: string;
    phone?: string;
    address: string;
    professionalStatus: string;
    smoker: boolean;
  };
  coBorrower?: {
    name: string;
    birthDate: string;
    email: string;
    professionalStatus: string;
    smoker: boolean;
    coveragePercentage: number;
  };
  loan: {
    amount: number;
    duration: number; // en mois
    rate: number;
    propertyType: string;
    signingDate: string;
  };
  insurance: {
    productCode: string;
    productName: string;
    premiumType: "CRD" | "FIXE";
    monthlyPremium: number;
    totalCost: number;
    taeaPercent: number;
    coveragePercentage: number;
    coverages: string[];
  };
  broker: {
    name: string;
    orias?: string;
    address: string;
    phone: string;
    email: string;
  };
}

/**
 * Formate un nombre en euros
 */
function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/**
 * Formate une date ISO en format français
 */
function formatDate(isoDate: string): string {
  if (!isoDate || isoDate === "Non renseigné") return "Non renseigné";
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Traduit le type de bien
 */
function translatePropertyType(type: string): string {
  const translations: Record<string, string> = {
    RESI_PRINCIPALE: "Résidence principale",
    RESI_SECONDAIRE: "Résidence secondaire",
    INVEST_LOCATIF: "Investissement locatif",
    CREDIT_CONSO: "Crédit consommation",
    PRO: "Professionnel",
  };
  return translations[type] || type;
}

/**
 * Traduit le statut professionnel
 */
function translateProfessionalStatus(status: string): string {
  const translations: Record<string, string> = {
    CADRE_SAL: "Cadre salarié",
    NON_CADRE_SAL_EMPLOYE: "Employé non-cadre",
    PROFESSION_LIBERALE: "Profession libérale",
    COMMERCANT_ARTISAN: "Commerçant / Artisan",
    FONCTIONNAIRE: "Fonctionnaire",
    RETRAITE: "Retraité",
    SANS_EMPLOI: "Sans emploi",
  };
  return translations[status] || status;
}

/**
 * Génère un PDF de devis d'assurance
 * @returns Buffer contenant le PDF
 */
export async function generateQuotePdf(data: QuotePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `Devis Assurance - ${data.quoteId}`,
          Author: data.broker.name,
          Subject: "Devis d'assurance de prêt immobilier",
          Creator: "Titan Assurances - MCP Platform",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Couleurs
      const primaryColor = "#4F46E5"; // Indigo
      const textColor = "#1E293B";
      const lightGray = "#64748B";
      const borderColor = "#E2E8F0";

      // ========== EN-TÊTE ==========
      doc
        .fillColor(primaryColor)
        .fontSize(24)
        .font("Helvetica-Bold")
        .text(data.broker.name, 50, 50);

      doc
        .fillColor(lightGray)
        .fontSize(10)
        .font("Helvetica")
        .text(data.broker.address, 50, 80)
        .text(`Tél: ${data.broker.phone}`, 50, 95)
        .text(`Email: ${data.broker.email}`, 50, 110);

      if (data.broker.orias) {
        doc.text(`ORIAS: ${data.broker.orias}`, 50, 125);
      }

      // Numéro de devis (aligné à droite)
      doc
        .fillColor(textColor)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(`Devis N° ${data.quoteId}`, 400, 50, { align: "right" });

      doc
        .fillColor(lightGray)
        .fontSize(10)
        .font("Helvetica")
        .text(`Édité le ${formatDate(data.generatedAt)}`, 400, 70, { align: "right" });

      // Ligne de séparation
      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(50, 150)
        .lineTo(545, 150)
        .stroke();

      // ========== TITRE ==========
      doc
        .fillColor(primaryColor)
        .fontSize(18)
        .font("Helvetica-Bold")
        .text("DEVIS D'ASSURANCE DE PRÊT IMMOBILIER", 50, 170, { align: "center" });

      // ========== INFORMATIONS EMPRUNTEUR ==========
      let yPos = 210;

      doc
        .fillColor(primaryColor)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("EMPRUNTEUR", 50, yPos);

      yPos += 25;

      doc
        .fillColor(textColor)
        .fontSize(10)
        .font("Helvetica");

      const borrowerInfo = [
        ["Nom complet", data.borrower.name],
        ["Date de naissance", formatDate(data.borrower.birthDate)],
        ["Email", data.borrower.email],
        ["Téléphone", data.borrower.phone || "Non renseigné"],
        ["Adresse / Code postal", data.borrower.address],
        ["Situation professionnelle", translateProfessionalStatus(data.borrower.professionalStatus)],
        ["Fumeur", data.borrower.smoker ? "Oui" : "Non"],
      ];

      borrowerInfo.forEach(([label, value]) => {
        doc
          .font("Helvetica-Bold")
          .text(`${label}: `, 50, yPos, { continued: true })
          .font("Helvetica")
          .text(value);
        yPos += 18;
      });

      // ========== CO-EMPRUNTEUR (si présent) ==========
      if (data.coBorrower) {
        yPos += 15;
        doc
          .fillColor(primaryColor)
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("CO-EMPRUNTEUR", 50, yPos);

        yPos += 25;

        doc
          .fillColor(textColor)
          .fontSize(10)
          .font("Helvetica");

        const coBorrowerInfo = [
          ["Nom complet", data.coBorrower.name],
          ["Date de naissance", formatDate(data.coBorrower.birthDate)],
          ["Email", data.coBorrower.email],
          ["Situation professionnelle", translateProfessionalStatus(data.coBorrower.professionalStatus)],
          ["Fumeur", data.coBorrower.smoker ? "Oui" : "Non"],
          ["Quotité d'assurance", `${data.coBorrower.coveragePercentage}%`],
        ];

        coBorrowerInfo.forEach(([label, value]) => {
          doc
            .font("Helvetica-Bold")
            .text(`${label}: `, 50, yPos, { continued: true })
            .font("Helvetica")
            .text(value);
          yPos += 18;
        });
      }

      // ========== INFORMATIONS PRÊT ==========
      yPos += 20;

      doc
        .fillColor(primaryColor)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("CARACTÉRISTIQUES DU PRÊT", 50, yPos);

      yPos += 25;

      doc
        .fillColor(textColor)
        .fontSize(10)
        .font("Helvetica");

      const durationYears = Math.round(data.loan.duration / 12);
      const loanInfo = [
        ["Montant emprunté", formatEuro(data.loan.amount)],
        ["Durée", `${data.loan.duration} mois (${durationYears} ans)`],
        ["Taux d'intérêt", `${data.loan.rate}%`],
        ["Type de bien", translatePropertyType(data.loan.propertyType)],
        ["Date de signature prévue", formatDate(data.loan.signingDate)],
      ];

      loanInfo.forEach(([label, value]) => {
        doc
          .font("Helvetica-Bold")
          .text(`${label}: `, 50, yPos, { continued: true })
          .font("Helvetica")
          .text(value);
        yPos += 18;
      });

      // ========== OFFRE D'ASSURANCE ==========
      yPos += 20;

      // Cadre coloré pour l'offre
      const offerBoxY = yPos;
      doc
        .rect(50, offerBoxY, 495, 180)
        .fillColor("#F1F5F9")
        .fill();

      doc
        .rect(50, offerBoxY, 495, 40)
        .fillColor(primaryColor)
        .fill();

      doc
        .fillColor("white")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("OFFRE D'ASSURANCE SÉLECTIONNÉE", 60, offerBoxY + 12);

      yPos = offerBoxY + 55;

      doc
        .fillColor(textColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(data.insurance.productName, 60, yPos);

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(lightGray)
        .text(`Code produit: ${data.insurance.productCode}`, 60, yPos + 15);

      yPos += 40;

      // Type de cotisation
      const premiumTypeLabel = data.insurance.premiumType === "CRD"
        ? "Cotisation dégressive (diminue avec le capital)"
        : "Cotisation constante (identique sur toute la durée)";

      doc
        .fillColor(textColor)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Type de cotisation: ", 60, yPos, { continued: true })
        .font("Helvetica")
        .text(premiumTypeLabel);

      yPos += 20;

      // Quotité
      doc
        .font("Helvetica-Bold")
        .text("Quotité d'assurance: ", 60, yPos, { continued: true })
        .font("Helvetica")
        .text(`${data.insurance.coveragePercentage}%`);

      yPos += 25;

      // Prix en gros
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text(`${data.insurance.monthlyPremium.toFixed(2)} €/mois`, 60, yPos);

      if (data.insurance.premiumType === "CRD") {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(lightGray)
          .text("(cotisation initiale)", 200, yPos + 3);
      }

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor(textColor)
        .text(`Coût total: ${formatEuro(data.insurance.totalCost)}`, 350, yPos)
        .text(`TAEA: ${data.insurance.taeaPercent.toFixed(2)}%`, 350, yPos + 18);

      // ========== GARANTIES ==========
      yPos = offerBoxY + 200;

      doc
        .fillColor(primaryColor)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("GARANTIES INCLUSES", 50, yPos);

      yPos += 25;

      const coverageLabels: Record<string, string> = {
        DCPTIA: "Décès / Perte Totale et Irréversible d'Autonomie",
        IPT: "Invalidité Permanente Totale",
        IPP: "Invalidité Permanente Partielle",
        ITT: "Incapacité Temporaire Totale de travail",
      };

      data.insurance.coverages.forEach((coverage) => {
        doc
          .fillColor(textColor)
          .fontSize(10)
          .font("Helvetica")
          .text(`✓ ${coverageLabels[coverage] || coverage}`, 60, yPos);
        yPos += 18;
      });

      // ========== PIED DE PAGE ==========
      const footerY = 750;

      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(50, footerY)
        .lineTo(545, footerY)
        .stroke();

      doc
        .fillColor(lightGray)
        .fontSize(8)
        .font("Helvetica")
        .text(
          "Ce document est un devis non contractuel. Les garanties et tarifs sont susceptibles de modifications " +
          "après étude du dossier de souscription. Document généré automatiquement par la plateforme MCP Assurance.",
          50,
          footerY + 10,
          { width: 495, align: "justify" }
        );

      doc
        .text(
          `${data.broker.name} - ORIAS ${data.broker.orias || "En cours"} - Document non contractuel`,
          50,
          footerY + 40,
          { width: 495, align: "center" }
        );

      // Finaliser le PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
