/**
 * Serveur MCP pour l'assurance de prêt immobilier
 *
 * Ce serveur expose des tools permettant aux LLM publics (Anthropic, OpenAI)
 * de générer des devis d'assurance de prêt immobilier via Titan Assurances.
 *
 * Tools disponibles:
 * - get_insurance_quote: Obtenir un devis d'assurance de prêt
 * - compare_insurance_offers: Comparer les offres CRD vs FIXE
 * - get_available_products: Liste des produits d'assurance disponibles
 * - create_business_record: Créer un dossier dans l'extranet
 * - search_client: Rechercher un client dans le CRM
 * - get_coverage_options: Obtenir les options de garanties selon le type de bien
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as digitalInsureApi from "../api/digitalInsureApi";
import { searchClientByName, getAllClients } from "../api/crmApi";
import { getGarantiesParDefaut, buildCoverages, GARANTIES_EXPLICATIONS, type TypeBien, type TypePret } from "../api/garantiesExplications";
import { debugLog } from "../debug-logger";

// Créer l'instance du serveur MCP
export const mcpServer = new McpServer({
  name: "titan-assurance-mcp",
  version: "1.0.0",
});

/**
 * Tool: get_coverage_options
 * Obtenir les options de garanties selon le type de bien et le type de prêt
 */
mcpServer.tool(
  "get_coverage_options",
  "Obtenir les options de garanties d'assurance selon le type de bien financé (résidence principale, investissement locatif, etc.) et le type de prêt",
  {
    property_type: z.enum([
      "RESI_PRINCIPALE",
      "RESI_SECONDAIRE",
      "INVEST_LOCATIF",
      "CREDIT_CONSO",
      "PRO"
    ]).describe("Type de bien financé: RESI_PRINCIPALE (résidence principale), RESI_SECONDAIRE (résidence secondaire), INVEST_LOCATIF (investissement locatif), CREDIT_CONSO (crédit consommation), PRO (professionnel)"),
    loan_type: z.enum(["IMMO_AMORTISSABLE", "IMMO_IN_FINE"]).default("IMMO_AMORTISSABLE").describe("Type de prêt: IMMO_AMORTISSABLE (prêt classique) ou IMMO_IN_FINE (remboursement du capital à échéance)"),
  },
  async ({ property_type, loan_type }) => {
    try {
      const config = getGarantiesParDefaut(property_type, loan_type as TypePret);

      const mandatoryCoverages = config.obligatoires.map(code => ({
        code,
        name: GARANTIES_EXPLICATIONS[code as keyof typeof GARANTIES_EXPLICATIONS]?.nom || code,
        description: GARANTIES_EXPLICATIONS[code as keyof typeof GARANTIES_EXPLICATIONS]?.description || "",
        mandatory: true,
      }));

      const optionalCoverages = config.optionnelles.map(code => ({
        code,
        name: GARANTIES_EXPLICATIONS[code as keyof typeof GARANTIES_EXPLICATIONS]?.nom || code,
        description: GARANTIES_EXPLICATIONS[code as keyof typeof GARANTIES_EXPLICATIONS]?.description || "",
        mandatory: false,
      }));

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            property_type,
            loan_type,
            message: config.message,
            mandatory_coverages: mandatoryCoverages,
            optional_coverages: optionalCoverages,
            recommendation: config.optionnelles.length > 0
              ? "Les garanties optionnelles sont recommandées pour une protection optimale."
              : "Toutes les garanties recommandées sont incluses.",
          }, null, 2),
        }],
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: error.message || "Erreur lors de la récupération des options de garanties",
          }),
        }],
        isError: true,
      };
    }
  }
);

/**
 * Tool: get_insurance_quote
 * Obtenir un devis d'assurance de prêt immobilier
 */
mcpServer.tool(
  "get_insurance_quote",
  "Générer un devis d'assurance de prêt immobilier. Retourne les tarifs des différents assureurs partenaires.",
  {
    // Informations sur l'emprunteur
    borrower_first_name: z.string().describe("Prénom de l'emprunteur"),
    borrower_last_name: z.string().describe("Nom de famille de l'emprunteur"),
    borrower_birth_date: z.string().describe("Date de naissance de l'emprunteur au format YYYY-MM-DD"),
    borrower_email: z.string().email().describe("Adresse email de l'emprunteur"),
    borrower_phone: z.string().optional().describe("Numéro de téléphone de l'emprunteur"),
    borrower_zip_code: z.string().describe("Code postal de l'emprunteur"),
    borrower_city: z.string().optional().default("Paris").describe("Ville de résidence de l'emprunteur"),
    borrower_gender: z.enum(["MR", "MME"]).default("MR").describe("Civilité: MR (Monsieur) ou MME (Madame)"),
    borrower_is_smoker: z.boolean().default(false).describe("L'emprunteur est-il fumeur ?"),
    borrower_professional_category: z.enum([
      "CADRE_SAL",
      "NON_CADRE_SAL_EMPLOYE",
      "PROFESSION_LIBERALE",
      "COMMERCANT_ARTISAN",
      "FONCTIONNAIRE",
      "RETRAITE",
      "SANS_EMPLOI"
    ]).default("CADRE_SAL").describe("Catégorie professionnelle de l'emprunteur"),

    // Informations sur le prêt
    loan_amount: z.number().positive().describe("Montant du prêt en euros"),
    loan_duration_months: z.number().positive().describe("Durée du prêt en mois (ex: 240 pour 20 ans)"),
    loan_rate: z.number().positive().default(3.5).describe("Taux d'intérêt du prêt en pourcentage (ex: 3.5 pour 3.5%)"),
    loan_type: z.enum(["IMMO_AMORTISSABLE", "IMMO_IN_FINE"]).default("IMMO_AMORTISSABLE").describe("Type de prêt"),
    property_type: z.enum([
      "RESI_PRINCIPALE",
      "RESI_SECONDAIRE",
      "INVEST_LOCATIF",
      "CREDIT_CONSO",
      "PRO"
    ]).default("RESI_PRINCIPALE").describe("Type de bien financé"),
    signing_date: z.string().optional().describe("Date de signature prévue chez le notaire au format YYYY-MM-DD"),

    // Garanties
    coverage_percentage: z.number().min(1).max(100).default(100).describe("Quotité d'assurance en pourcentage (ex: 100 pour 100%, 50 pour 50%)"),
    premium_type: z.enum(["CRD", "FIXE"]).default("CRD").describe("Type de cotisation: CRD (dégressive) ou FIXE (constante)"),
    include_optional_coverages: z.boolean().default(true).describe("Inclure les garanties optionnelles (IPT, IPP, ITT) si applicables"),

    // Co-emprunteur (optionnel)
    has_co_borrower: z.boolean().default(false).describe("Y a-t-il un co-emprunteur ?"),
    co_borrower_first_name: z.string().optional().describe("Prénom du co-emprunteur"),
    co_borrower_last_name: z.string().optional().describe("Nom du co-emprunteur"),
    co_borrower_birth_date: z.string().optional().describe("Date de naissance du co-emprunteur (YYYY-MM-DD)"),
    co_borrower_email: z.string().optional().describe("Email du co-emprunteur"),
    co_borrower_gender: z.enum(["MR", "MME"]).optional().describe("Civilité du co-emprunteur"),
    co_borrower_is_smoker: z.boolean().optional().describe("Le co-emprunteur est-il fumeur ?"),
    co_borrower_professional_category: z.enum([
      "CADRE_SAL",
      "NON_CADRE_SAL_EMPLOYE",
      "PROFESSION_LIBERALE",
      "COMMERCANT_ARTISAN",
      "FONCTIONNAIRE",
      "RETRAITE",
      "SANS_EMPLOI"
    ]).optional().describe("Catégorie professionnelle du co-emprunteur"),
    co_borrower_coverage_percentage: z.number().min(1).max(100).optional().describe("Quotité d'assurance du co-emprunteur (ex: 50%)"),
  },
  async (params) => {
    try {
      debugLog("[MCP] get_insurance_quote appelé avec:", params);

      const externalInsuredId = `INS_${Date.now()}`;
      const externalLoanId = `LOAN_${Date.now()}`;

      // Calculer la date d'effet (3 mois dans le futur par défaut)
      const effectiveDate = new Date();
      effectiveDate.setMonth(effectiveDate.getMonth() + 3);
      const effectiveDateStr = effectiveDate.toISOString().split("T")[0];

      // Date de signature
      const signingDate = params.signing_date || new Date().toISOString().split("T")[0];

      // Préparer les données de l'assuré principal
      const insured: digitalInsureApi.DIInsured = {
        externalInsuredId,
        numOrder: 1,
        personDataModel: {
          gender: params.borrower_gender,
          firstname: params.borrower_first_name,
          lastname: params.borrower_last_name,
          dateOfBirth: params.borrower_birth_date,
          email: params.borrower_email,
          mobilePhoneNumber: params.borrower_phone || "0600000000",
        },
        address: {
          adrAddressLine1: "1 rue de la Paix",
          adrAddressLine2: "",
          adrZipcode: params.borrower_zip_code,
          adrCity: params.borrower_city || "Paris",
          adrCountry: "FRANCE",
        },
        countryOfResidence: "FRANCE",
        cityOfBirth: params.borrower_city || "Paris",
        professionalCategory: params.borrower_professional_category,
        smoker: params.borrower_is_smoker,
        esmoker: false,
        esmokerNoNicotine: false,
        annualMilage: "0",
        workAtHeight: "0",
        manualWork: false,
        exactJob: params.borrower_professional_category,
        socialRegime: "SALARIE",
        manualWorkRisk: false,
        workRisk: false,
        dangerousProduct: false,
        outStandings: [],
      };

      // Liste des assurés (avec co-emprunteur si présent)
      const insureds: digitalInsureApi.DIInsured[] = [insured];

      // Co-emprunteur (si présent)
      const externalCoInsuredId = `CO_INS_${Date.now()}`;
      if (params.has_co_borrower && params.co_borrower_first_name && params.co_borrower_last_name && params.co_borrower_birth_date) {
        const coInsured: digitalInsureApi.DIInsured = {
          externalInsuredId: externalCoInsuredId,
          numOrder: 2,
          personDataModel: {
            gender: params.co_borrower_gender || "MR",
            firstname: params.co_borrower_first_name,
            lastname: params.co_borrower_last_name,
            dateOfBirth: params.co_borrower_birth_date,
            email: params.co_borrower_email || params.borrower_email,
            mobilePhoneNumber: params.borrower_phone || "0600000000",
          },
          address: {
            adrAddressLine1: "1 rue de la Paix",
            adrAddressLine2: "",
            adrZipcode: params.borrower_zip_code,
            adrCity: params.borrower_city || "Paris",
            adrCountry: "FRANCE",
          },
          countryOfResidence: "FRANCE",
          cityOfBirth: params.borrower_city || "Paris",
          professionalCategory: params.co_borrower_professional_category || "CADRE_SAL",
          smoker: params.co_borrower_is_smoker || false,
          esmoker: false,
          esmokerNoNicotine: false,
          annualMilage: "0",
          workAtHeight: "0",
          manualWork: false,
          exactJob: params.co_borrower_professional_category || "CADRE_SAL",
          socialRegime: "SALARIE",
          manualWorkRisk: false,
          workRisk: false,
          dangerousProduct: false,
          outStandings: [],
        };
        insureds.push(coInsured);
      }

      // Préparer les données du prêt
      const loan: digitalInsureApi.DILoan = {
        externalLoanId,
        numOrder: 1,
        type: params.loan_type,
        amount: params.loan_amount,
        duration: params.loan_duration_months,
        residualValue: 0,
        rate: params.loan_rate,
        rateType: "FIXE",
        deferredType: "AUCUN",
        deferredDuration: 0,
        effectiveDate: effectiveDateStr,
        periodicityInsurance: "MENSUELLE",
        periodicityRefund: "MENSUELLE",
        purposeOfFinancing: params.property_type,
        signingDate,
      };

      // Déterminer les garanties
      const garantiesConfig = getGarantiesParDefaut(params.property_type, params.loan_type as TypePret);
      let garantiesActives = [...garantiesConfig.obligatoires];

      if (params.include_optional_coverages && garantiesConfig.optionnelles.length > 0) {
        garantiesActives = [...garantiesActives, ...garantiesConfig.optionnelles];
      }

      // Préparer les requirements (un par assuré)
      const requirements: digitalInsureApi.DIRequirement[] = [{
        insuredId: externalInsuredId,
        loanId: externalLoanId,
        premiumType: params.premium_type,
        coverages: buildCoverages(garantiesActives, params.coverage_percentage, 90),
      }];

      // Ajouter les requirements du co-emprunteur si présent
      if (params.has_co_borrower && params.co_borrower_first_name && params.co_borrower_last_name) {
        const coQuotite = params.co_borrower_coverage_percentage || params.coverage_percentage;
        requirements.push({
          insuredId: externalCoInsuredId,
          loanId: externalLoanId,
          premiumType: params.premium_type,
          coverages: buildCoverages(garantiesActives, coQuotite, 90),
        });
      }

      // Préparer la requête de tarification
      const tarificationRequest: digitalInsureApi.DITarificationRequest = {
        contractGrouping: "INITIAL",
        tarificationOptions: {
          calculateMode: "DEFAULT",
        },
        productCodes: ["MAESTRO", "AVENIRNAOASSUR", "IRIADE", "MNCAP"],
        insuranceType: "ADE",
        scenarioRecordDataModel: {
          contextType: "NEW",
          insureds,
          loans: [loan],
          requirements,
        },
      };

      // Appeler l'API Digital Insure
      const result = await digitalInsureApi.getTarifs(tarificationRequest);

      if (result.success && result.data) {
        const tarifs = result.data.tarificationResponseModels || [];

        const offers = tarifs
          .filter((tarif: any) =>
            tarif.responseStateModel?.businessState === "OK" && tarif.quoteRateResult
          )
          .map((tarif: any) => ({
            product_code: tarif.productCode,
            product_name: tarif.productLabel || tarif.productCode,
            monthly_premium: Math.round(tarif.quoteRateResult.primePeriodiqueDevis * 100) / 100,
            total_cost: Math.round(tarif.quoteRateResult.primeGlobaleDevis * 100) / 100,
            taea_percent: Math.round(tarif.quoteRateResult.taeaDevis * 100) / 100,
            premium_type: params.premium_type,
            coverages_included: garantiesActives,
          }));

        if (offers.length === 0) {
          // Extraire les erreurs détaillées
          const errors: string[] = [];
          tarifs.forEach((tarif: any) => {
            if (tarif.responseStateModel?.businessState === "KO") {
              const businessErrors = tarif.responseStateModel?.businessResponse?.businessErrors || [];
              businessErrors.forEach((err: any) => {
                errors.push(err.controlLabel || err.errorCode);
              });
            }
          });

          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: "Aucune offre disponible pour ce profil",
                details: errors.length > 0 ? errors : undefined,
              }),
            }],
            isError: true,
          };
        }

        // Trier par coût total croissant
        offers.sort((a: any, b: any) => a.total_cost - b.total_cost);

        // Préparer les informations des emprunteurs
        const borrowerInfo: any = {
          name: `${params.borrower_first_name} ${params.borrower_last_name}`,
          birth_date: params.borrower_birth_date,
          email: params.borrower_email,
          coverage_percentage: params.coverage_percentage,
        };

        const responseData: any = {
          success: true,
          quote_id: `QUOTE_${Date.now()}`,
          borrower: borrowerInfo,
          loan: {
            amount: params.loan_amount,
            duration_months: params.loan_duration_months,
            duration_years: Math.round(params.loan_duration_months / 12),
            rate_percent: params.loan_rate,
            property_type: params.property_type,
          },
          offers,
          best_offer: offers[0],
          offers_count: offers.length,
        };

        // Ajouter le co-emprunteur si présent
        if (params.has_co_borrower && params.co_borrower_first_name && params.co_borrower_last_name) {
          responseData.co_borrower = {
            name: `${params.co_borrower_first_name} ${params.co_borrower_last_name}`,
            birth_date: params.co_borrower_birth_date,
            email: params.co_borrower_email,
            coverage_percentage: params.co_borrower_coverage_percentage || params.coverage_percentage,
          };
          responseData.borrowers_count = 2;
        } else {
          responseData.borrowers_count = 1;
        }

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(responseData, null, 2),
          }],
        };
      } else {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: result.error || "Erreur lors de la tarification",
            }),
          }],
          isError: true,
        };
      }
    } catch (error: any) {
      debugLog("[MCP] Erreur get_insurance_quote:", error);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: error.message || "Erreur inconnue",
          }),
        }],
        isError: true,
      };
    }
  }
);

/**
 * Tool: compare_insurance_offers
 * Comparer les offres CRD (dégressive) vs FIXE (constante)
 */
mcpServer.tool(
  "compare_insurance_offers",
  "Comparer les offres d'assurance avec cotisation dégressive (CRD) et cotisation constante (FIXE). Retourne les meilleures offres de chaque type.",
  {
    borrower_first_name: z.string().describe("Prénom de l'emprunteur"),
    borrower_last_name: z.string().describe("Nom de famille de l'emprunteur"),
    borrower_birth_date: z.string().describe("Date de naissance au format YYYY-MM-DD"),
    borrower_email: z.string().email().describe("Adresse email"),
    borrower_zip_code: z.string().describe("Code postal"),
    borrower_gender: z.enum(["MR", "MME"]).default("MR").describe("Civilité"),
    borrower_is_smoker: z.boolean().default(false).describe("Fumeur ?"),
    borrower_professional_category: z.enum([
      "CADRE_SAL",
      "NON_CADRE_SAL_EMPLOYE",
      "PROFESSION_LIBERALE",
      "COMMERCANT_ARTISAN",
      "FONCTIONNAIRE",
      "RETRAITE",
      "SANS_EMPLOI"
    ]).default("CADRE_SAL").describe("Catégorie professionnelle"),

    loan_amount: z.number().positive().describe("Montant du prêt en euros"),
    loan_duration_months: z.number().positive().describe("Durée en mois"),
    loan_rate: z.number().positive().default(3.5).describe("Taux d'intérêt en %"),
    property_type: z.enum([
      "RESI_PRINCIPALE",
      "RESI_SECONDAIRE",
      "INVEST_LOCATIF",
      "CREDIT_CONSO",
      "PRO"
    ]).default("RESI_PRINCIPALE").describe("Type de bien"),

    coverage_percentage: z.number().min(1).max(100).default(100).describe("Quotité en %"),
  },
  async (params) => {
    try {
      debugLog("[MCP] compare_insurance_offers appelé avec:", params);

      // Fonction helper pour générer un devis
      const generateQuote = async (premiumType: "CRD" | "FIXE") => {
        const externalInsuredId = `INS_${Date.now()}_${premiumType}`;
        const externalLoanId = `LOAN_${Date.now()}_${premiumType}`;

        const effectiveDate = new Date();
        effectiveDate.setMonth(effectiveDate.getMonth() + 3);

        const insured: digitalInsureApi.DIInsured = {
          externalInsuredId,
          numOrder: 1,
          personDataModel: {
            gender: params.borrower_gender,
            firstname: params.borrower_first_name,
            lastname: params.borrower_last_name,
            dateOfBirth: params.borrower_birth_date,
            email: params.borrower_email,
          },
          address: {
            adrAddressLine1: "1 rue de la Paix",
            adrZipcode: params.borrower_zip_code,
            adrCity: "Paris",
            adrCountry: "FRANCE",
          },
          countryOfResidence: "FRANCE",
          cityOfBirth: "Paris",
          professionalCategory: params.borrower_professional_category,
          smoker: params.borrower_is_smoker,
          esmoker: false,
          esmokerNoNicotine: false,
          manualWork: false,
          exactJob: params.borrower_professional_category,
          socialRegime: "SALARIE",
          manualWorkRisk: false,
          workRisk: false,
          dangerousProduct: false,
        };

        const loan: digitalInsureApi.DILoan = {
          externalLoanId,
          numOrder: 1,
          type: "IMMO_AMORTISSABLE",
          amount: params.loan_amount,
          duration: params.loan_duration_months,
          residualValue: 0,
          rate: params.loan_rate,
          rateType: "FIXE",
          deferredType: "AUCUN",
          deferredDuration: 0,
          effectiveDate: effectiveDate.toISOString().split("T")[0],
          periodicityInsurance: "MENSUELLE",
          periodicityRefund: "MENSUELLE",
          purposeOfFinancing: params.property_type,
          signingDate: new Date().toISOString().split("T")[0],
        };

        const garantiesConfig = getGarantiesParDefaut(params.property_type, "IMMO_AMORTISSABLE");
        const garantiesActives = [...garantiesConfig.obligatoires, ...garantiesConfig.optionnelles];

        const requirement: digitalInsureApi.DIRequirement = {
          insuredId: externalInsuredId,
          loanId: externalLoanId,
          premiumType,
          coverages: buildCoverages(garantiesActives, params.coverage_percentage, 90),
        };

        const request: digitalInsureApi.DITarificationRequest = {
          contractGrouping: "INITIAL",
          tarificationOptions: { calculateMode: "DEFAULT" },
          productCodes: ["MAESTRO", "AVENIRNAOASSUR", "IRIADE", "MNCAP"],
          insuranceType: "ADE",
          scenarioRecordDataModel: {
            contextType: "NEW",
            insureds: [insured],
            loans: [loan],
            requirements: [requirement],
          },
        };

        return digitalInsureApi.getTarifs(request);
      };

      // Appeler les deux types en parallèle
      const [crdResult, fixeResult] = await Promise.all([
        generateQuote("CRD"),
        generateQuote("FIXE"),
      ]);

      const allOffers: any[] = [];

      // Collecter les offres CRD
      if (crdResult.success && crdResult.data?.tarificationResponseModels) {
        crdResult.data.tarificationResponseModels.forEach((tarif: any) => {
          if (tarif.responseStateModel?.businessState === "OK" && tarif.quoteRateResult) {
            allOffers.push({
              product_code: tarif.productCode,
              product_name: tarif.productLabel || tarif.productCode,
              premium_type: "CRD",
              premium_type_label: "Cotisation dégressive",
              monthly_premium: Math.round(tarif.quoteRateResult.primePeriodiqueDevis * 100) / 100,
              total_cost: Math.round(tarif.quoteRateResult.primeGlobaleDevis * 100) / 100,
              taea_percent: Math.round(tarif.quoteRateResult.taeaDevis * 100) / 100,
            });
          }
        });
      }

      // Collecter les offres FIXE
      if (fixeResult.success && fixeResult.data?.tarificationResponseModels) {
        fixeResult.data.tarificationResponseModels.forEach((tarif: any) => {
          if (tarif.responseStateModel?.businessState === "OK" && tarif.quoteRateResult) {
            allOffers.push({
              product_code: tarif.productCode,
              product_name: tarif.productLabel || tarif.productCode,
              premium_type: "FIXE",
              premium_type_label: "Cotisation constante",
              monthly_premium: Math.round(tarif.quoteRateResult.primePeriodiqueDevis * 100) / 100,
              total_cost: Math.round(tarif.quoteRateResult.primeGlobaleDevis * 100) / 100,
              taea_percent: Math.round(tarif.quoteRateResult.taeaDevis * 100) / 100,
            });
          }
        });
      }

      if (allOffers.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: "Aucune offre disponible pour ce profil",
            }),
          }],
          isError: true,
        };
      }

      // Trouver les meilleures offres
      const crdOffers = allOffers.filter(o => o.premium_type === "CRD").sort((a, b) => a.total_cost - b.total_cost);
      const fixeOffers = allOffers.filter(o => o.premium_type === "FIXE").sort((a, b) => a.total_cost - b.total_cost);

      const bestCRD = crdOffers[0] || null;
      const bestFIXE = fixeOffers[0] || null;

      // Calculer les économies
      let savings = null;
      if (bestCRD && bestFIXE) {
        savings = {
          crd_vs_fixe: Math.round((bestFIXE.total_cost - bestCRD.total_cost) * 100) / 100,
          recommended: bestCRD.total_cost < bestFIXE.total_cost ? "CRD" : "FIXE",
          recommendation_reason: bestCRD.total_cost < bestFIXE.total_cost
            ? "La cotisation dégressive est plus économique sur la durée totale du prêt"
            : "La cotisation constante offre une meilleure visibilité budgétaire avec un coût total similaire",
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            comparison_id: `COMP_${Date.now()}`,
            borrower: {
              name: `${params.borrower_first_name} ${params.borrower_last_name}`,
            },
            loan: {
              amount: params.loan_amount,
              duration_months: params.loan_duration_months,
              duration_years: Math.round(params.loan_duration_months / 12),
            },
            best_crd_offer: bestCRD,
            best_fixe_offer: bestFIXE,
            savings_analysis: savings,
            all_offers: allOffers,
            total_offers_count: allOffers.length,
          }, null, 2),
        }],
      };
    } catch (error: any) {
      debugLog("[MCP] Erreur compare_insurance_offers:", error);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: error.message || "Erreur inconnue",
          }),
        }],
        isError: true,
      };
    }
  }
);

/**
 * Tool: get_available_products
 * Liste des produits d'assurance disponibles
 */
mcpServer.tool(
  "get_available_products",
  "Obtenir la liste des produits d'assurance de prêt immobilier disponibles chez nos partenaires assureurs.",
  {},
  async () => {
    try {
      const result = await digitalInsureApi.getAvailableProducts("ADE");

      if (result.success && result.data) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              products: result.data,
              partner: "Digital Insure",
              available_insurers: ["MAESTRO", "AVENIRNAOASSUR", "IRIADE", "MNCAP", "IPTIQ"],
            }, null, 2),
          }],
        };
      } else {
        // Retourner une liste par défaut si l'API n'est pas disponible
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              products: [
                {
                  code: "MAESTRO",
                  name: "Maestro",
                  description: "Assurance emprunteur avec garanties complètes",
                },
                {
                  code: "AVENIRNAOASSUR",
                  name: "Avenir Nao Assur",
                  description: "Solution d'assurance emprunteur compétitive",
                },
                {
                  code: "IRIADE",
                  name: "Iriade",
                  description: "Assurance emprunteur mutualiste",
                },
                {
                  code: "MNCAP",
                  name: "MNCAP",
                  description: "Assurance emprunteur adaptée aux profils variés",
                },
              ],
              partner: "Digital Insure",
              note: "Liste des produits principaux disponibles",
            }, null, 2),
          }],
        };
      }
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: error.message || "Erreur lors de la récupération des produits",
          }),
        }],
        isError: true,
      };
    }
  }
);

/**
 * Tool: create_business_record
 * Créer un dossier dans l'extranet Digital Insure
 */
mcpServer.tool(
  "create_business_record",
  "Créer un dossier de souscription dans l'extranet Digital Insure pour finaliser le processus d'assurance. À utiliser après avoir obtenu un devis accepté par le client.",
  {
    borrower_first_name: z.string().describe("Prénom de l'emprunteur"),
    borrower_last_name: z.string().describe("Nom de famille de l'emprunteur"),
    borrower_birth_date: z.string().describe("Date de naissance au format YYYY-MM-DD"),
    borrower_email: z.string().email().describe("Adresse email"),
    borrower_phone: z.string().describe("Numéro de téléphone"),
    borrower_zip_code: z.string().describe("Code postal"),
    borrower_city: z.string().describe("Ville"),
    borrower_address: z.string().describe("Adresse complète"),
    borrower_gender: z.enum(["MR", "MME"]).describe("Civilité"),
    borrower_is_smoker: z.boolean().describe("Fumeur ?"),
    borrower_professional_category: z.string().describe("Catégorie professionnelle"),

    loan_amount: z.number().positive().describe("Montant du prêt"),
    loan_duration_months: z.number().positive().describe("Durée en mois"),
    loan_rate: z.number().positive().describe("Taux d'intérêt"),
    property_type: z.string().describe("Type de bien"),

    selected_product_code: z.string().describe("Code du produit sélectionné (ex: MAESTRO)"),
    premium_type: z.enum(["CRD", "FIXE"]).describe("Type de cotisation choisi"),
    coverage_percentage: z.number().describe("Quotité en %"),
  },
  async (params) => {
    try {
      debugLog("[MCP] create_business_record appelé avec:", params);

      const externalRecordId = `BIZ_${Date.now()}`;
      const externalInsuredId = `INS_${Date.now()}`;
      const externalLoanId = `LOAN_${Date.now()}`;

      const effectiveDate = new Date();
      effectiveDate.setMonth(effectiveDate.getMonth() + 3);

      const scenarioRecordDataModel = {
        contextType: "NEW",
        insureds: [{
          externalInsuredId,
          numOrder: 1,
          personDataModel: {
            gender: params.borrower_gender,
            firstname: params.borrower_first_name,
            lastname: params.borrower_last_name,
            dateOfBirth: params.borrower_birth_date,
            email: params.borrower_email,
            mobilePhoneNumber: params.borrower_phone,
          },
          address: {
            adrAddressLine1: params.borrower_address,
            adrZipcode: params.borrower_zip_code,
            adrCity: params.borrower_city,
            adrCountry: "FRANCE",
          },
          countryOfResidence: "FRANCE",
          cityOfBirth: params.borrower_city,
          professionalCategory: params.borrower_professional_category,
          smoker: params.borrower_is_smoker,
          esmoker: false,
          esmokerNoNicotine: false,
          manualWork: false,
          exactJob: params.borrower_professional_category,
          socialRegime: "SALARIE",
          manualWorkRisk: false,
          workRisk: false,
          dangerousProduct: false,
        }],
        loans: [{
          externalLoanId,
          numOrder: 1,
          type: "IMMO_AMORTISSABLE",
          amount: params.loan_amount,
          duration: params.loan_duration_months,
          residualValue: 0,
          rate: params.loan_rate,
          rateType: "FIXE",
          deferredType: "AUCUN",
          deferredDuration: 0,
          effectiveDate: effectiveDate.toISOString().split("T")[0],
          periodicityInsurance: "MENSUELLE",
          periodicityRefund: "MENSUELLE",
          purposeOfFinancing: params.property_type,
          signingDate: new Date().toISOString().split("T")[0],
        }],
        requirements: [{
          insuredId: externalInsuredId,
          loanId: externalLoanId,
          premiumType: params.premium_type,
          coverages: buildCoverages(["DCPTIA", "IPT", "IPP", "ITT"], params.coverage_percentage, 90),
        }],
      };

      const result = await digitalInsureApi.createBusinessRecord(
        externalRecordId,
        scenarioRecordDataModel
      );

      if (result.success) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              business_record_id: externalRecordId,
              compare_record_id: result.data?.compareRecordId,
              message: "Dossier créé avec succès dans l'extranet Digital Insure",
              next_steps: [
                "Le client recevra un email pour compléter son dossier",
                "Les questionnaires de santé seront à remplir en ligne",
                "La signature électronique du contrat sera disponible",
              ],
            }, null, 2),
          }],
        };
      } else {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: result.error || "Erreur lors de la création du dossier",
            }),
          }],
          isError: true,
        };
      }
    } catch (error: any) {
      debugLog("[MCP] Erreur create_business_record:", error);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: error.message || "Erreur inconnue",
          }),
        }],
        isError: true,
      };
    }
  }
);

/**
 * Tool: search_client
 * Rechercher un client dans le CRM
 */
mcpServer.tool(
  "search_client",
  "Rechercher un client existant dans notre CRM par son nom. Permet de récupérer les informations déjà enregistrées pour pré-remplir un devis.",
  {
    name: z.string().describe("Nom du client à rechercher (nom et/ou prénom)"),
  },
  async ({ name }) => {
    try {
      debugLog("[MCP] search_client appelé avec:", name);

      const result = await searchClientByName(name);

      if (result.success && result.data && result.data.length > 0) {
        const clients = result.data.map((client: any) => ({
          id: client.id,
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email,
          phone: client.phone,
          birth_date: client.birth_date,
          postal_code: client.postal_code,
          city: client.city,
          professional_category: client.professional_category,
        }));

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              clients_found: clients.length,
              clients,
              message: clients.length === 1
                ? "Client trouvé ! Ses informations peuvent être utilisées pour pré-remplir le devis."
                : `${clients.length} clients trouvés correspondant à cette recherche.`,
            }, null, 2),
          }],
        };
      } else {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              clients_found: 0,
              clients: [],
              message: "Aucun client trouvé avec ce nom. Un nouveau profil sera créé lors de la souscription.",
            }, null, 2),
          }],
        };
      }
    } catch (error: any) {
      debugLog("[MCP] Erreur search_client:", error);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: error.message || "Erreur lors de la recherche",
          }),
        }],
        isError: true,
      };
    }
  }
);

// Exporter le serveur MCP
export default mcpServer;
