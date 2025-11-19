import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { searchClientByName, getAllClients, getAllContracts, getAllQuotes } from "../api/crmApi";
import * as digitalInsureApi from "../api/digitalInsureApi";
import {
  getSessionContext,
  getSessionIdFromUUID,
  upsertSessionContext,
  mergeContextData,
  getMissingFields,
  formatContextForDisplay,
} from "../api/chatContext";

/**
 * Routeur pour le workflow du chat intelligent avec intégration directe des API
 */

/**
 * Comparateur intelligent : récupère les tarifs CRD et FIXE et sélectionne les 2 meilleures offres
 */
async function compareInsuranceOffers(context: any, clientData: any): Promise<any> {
  try {
    // Appeler Digital Insure avec les deux types de cotisation
    const [crdResult, fixeResult] = await Promise.all([
      generateDigitalInsureQuote(context, clientData, "CRD"),
      generateDigitalInsureQuote(context, clientData, "FIXE"),
    ]);

    const allOffers: any[] = [];

    // Collecter toutes les offres CRD
    if (crdResult.success && crdResult.data?.tarificationResponseModels) {
      crdResult.data.tarificationResponseModels.forEach((tarif: any) => {
        if (tarif.responseStateModel?.businessState === "OK" && tarif.quoteRateResult) {
          allOffers.push({
            productCode: tarif.productCode,
            productLabel: tarif.productLabel,
            premiumType: "CRD",
            monthlyPremium: tarif.quoteRateResult.primePeriodiqueDevis,
            totalCost: tarif.quoteRateResult.primeGlobaleDevis,
            taea: tarif.quoteRateResult.taeaDevis,
            rawData: tarif,
          });
        }
      });
    }

    // Collecter toutes les offres FIXE
    if (fixeResult.success && fixeResult.data?.tarificationResponseModels) {
      fixeResult.data.tarificationResponseModels.forEach((tarif: any) => {
        if (tarif.responseStateModel?.businessState === "OK" && tarif.quoteRateResult) {
          allOffers.push({
            productCode: tarif.productCode,
            productLabel: tarif.productLabel,
            premiumType: "FIXE",
            monthlyPremium: tarif.quoteRateResult.primePeriodiqueDevis,
            totalCost: tarif.quoteRateResult.primeGlobaleDevis,
            taea: tarif.quoteRateResult.taeaDevis,
            rawData: tarif,
          });
        }
      });
    }

    if (allOffers.length === 0) {
      // Logger les erreurs détaillées pour le débogage
      console.error("[Comparateur] Aucune offre disponible");
      console.error("[Comparateur] Résultat CRD:", JSON.stringify(crdResult, null, 2));
      console.error("[Comparateur] Résultat FIXE:", JSON.stringify(fixeResult, null, 2));
      
      // Extraire les erreurs des réponses API
      let errorDetails = "";
      if (crdResult.data?.tarificationResponseModels) {
        crdResult.data.tarificationResponseModels.forEach((tarif: any) => {
          if (tarif.responseStateModel?.businessState === "KO") {
            const errors = tarif.responseStateModel?.businessResponse?.businessErrors || [];
            errors.forEach((err: any) => {
              errorDetails += `\n- ${err.controlLabel || err.errorCode}`;
            });
          }
        });
      }
      
      return {
        success: false,
        error: "Aucune offre disponible pour ce profil." + (errorDetails ? "\n\nErreurs API:" + errorDetails : ""),
      };
    }

    // Séparer les offres par type
    const crdOffers = allOffers.filter((o) => o.premiumType === "CRD");
    const fixeOffers = allOffers.filter((o) => o.premiumType === "FIXE");

    // Trouver la meilleure offre CRD (coût total le plus bas)
    const bestCRD = crdOffers.length > 0
      ? crdOffers.reduce((best, current) =>
          current.totalCost < best.totalCost ? current : best
        )
      : null;

    // Trouver la meilleure offre FIXE (coût total le plus bas)
    const bestFIXE = fixeOffers.length > 0
      ? fixeOffers.reduce((best, current) =>
          current.totalCost < best.totalCost ? current : best
        )
      : null;

    // Construire le message de réponse
    let message = "\n\n🎯 **Comparateur Intelligent - Meilleures Offres**\n\n";
    message += "Nous avons comparé toutes les offres disponibles et sélectionné les 2 meilleures pour vous :\n\n";

    // Si on a à la fois CRD et FIXE
    if (bestCRD && bestFIXE) {
      message += `**Option 1 : Cotisation Dégressive (CRD)** - ${bestCRD.productLabel || bestCRD.productCode}\n`;
      message += `- Cotisation mensuelle initiale : ${bestCRD.monthlyPremium.toFixed(2)}€\n`;
      message += `- Coût total de l'assurance : ${bestCRD.totalCost.toFixed(2)}€\n`;
      message += `- TAEA : ${bestCRD.taea.toFixed(2)}%\n`;
      message += `- Type : La cotisation diminue au fil du temps avec le capital restant dû\n\n`;

      message += `**Option 2 : Cotisation Constante (FIXE)** - ${bestFIXE.productLabel || bestFIXE.productCode}\n`;
      message += `- Cotisation mensuelle : ${bestFIXE.monthlyPremium.toFixed(2)}€\n`;
      message += `- Coût total de l'assurance : ${bestFIXE.totalCost.toFixed(2)}€\n`;
      message += `- TAEA : ${bestFIXE.taea.toFixed(2)}%\n`;
      message += `- Type : La cotisation reste identique pendant toute la durée du prêt\n\n`;

      message += "\n💡 **Quelle option préférez-vous ?**\n";
      message += "- Option 1 (CRD) : Idéale si vous souhaitez réduire vos mensualités au fil du temps\n";
      message += "- Option 2 (FIXE) : Idéale pour une meilleure visibilité budgétaire\n";
    }
    // Si on a seulement des offres CRD, proposer les 2 meilleures
    else if (crdOffers.length >= 2) {
      const secondBestCRD = crdOffers
        .filter(o => o.productCode !== bestCRD.productCode)
        .reduce((best, current) =>
          current.totalCost < best.totalCost ? current : best
        );

      message += `**Option 1 : ${bestCRD.productLabel || bestCRD.productCode}**\n`;
      message += `- Cotisation mensuelle initiale : ${bestCRD.monthlyPremium.toFixed(2)}€\n`;
      message += `- Coût total de l'assurance : ${bestCRD.totalCost.toFixed(2)}€\n`;
      message += `- TAEA : ${bestCRD.taea.toFixed(2)}%\n\n`;

      message += `**Option 2 : ${secondBestCRD.productLabel || secondBestCRD.productCode}**\n`;
      message += `- Cotisation mensuelle initiale : ${secondBestCRD.monthlyPremium.toFixed(2)}€\n`;
      message += `- Coût total de l'assurance : ${secondBestCRD.totalCost.toFixed(2)}€\n`;
      message += `- TAEA : ${secondBestCRD.taea.toFixed(2)}%\n\n`;

      const savings = secondBestCRD.totalCost - bestCRD.totalCost;
      message += `\n💰 **Économie avec l'Option 1 : ${savings.toFixed(2)}€ sur toute la durée du prêt**\n`;
      message += "\n💡 **Quelle option préférez-vous ?**\n";
    }
    // Si on a seulement 1 offre CRD
    else if (bestCRD) {
      message += `**Offre disponible : ${bestCRD.productLabel || bestCRD.productCode}**\n`;
      message += `- Cotisation mensuelle initiale : ${bestCRD.monthlyPremium.toFixed(2)}€\n`;
      message += `- Coût total de l'assurance : ${bestCRD.totalCost.toFixed(2)}€\n`;
      message += `- TAEA : ${bestCRD.taea.toFixed(2)}%\n\n`;
    }

    // Sauvegarder automatiquement la meilleure offre dans Digital Insure
    let compareRecordId = null;
    const bestOffer = bestCRD; // La meilleure offre (la moins chère)
    
    if (bestOffer) {
      try {
        // Créer le dossier dans Digital Insure avec la meilleure offre
        const externalRecordId = `RECORD_${Date.now()}`;
        const scenarioRecordDataModel = await buildScenarioForBestOffer(context, clientData, bestOffer);
        
        const createResult = await digitalInsureApi.createBusinessRecord(
          externalRecordId,
          scenarioRecordDataModel
        );
        
        if (createResult.success && createResult.data?.compareRecordId) {
          compareRecordId = createResult.data.compareRecordId;
          console.log(`[Comparateur] Devis sauvegardé avec succès: ${compareRecordId}`);
          message += `\n\n✅ **Votre devis a été enregistré** (Référence: ${compareRecordId.substring(0, 8)})`;
        }
      } catch (saveError: any) {
        console.error("[Comparateur] Erreur lors de la sauvegarde du devis:", saveError);
        // Ne pas bloquer l'affichage des tarifs si la sauvegarde échoue
      }
    }

    return {
      success: true,
      message,
      bestCRD,
      bestFIXE,
      allOffers,
      compareRecordId,
    };
  } catch (error: any) {
    console.error("[Comparateur] Erreur lors de la comparaison:", error);
    return {
      success: false,
      error: error.message || "Erreur inconnue",
    };
  }
}

/**
 * Construire le scénario pour la meilleure offre (pour createBusinessRecord)
 */
async function buildScenarioForBestOffer(context: any, clientData: any, bestOffer: any): Promise<any> {
  // Mapper les données du contexte vers le format Digital Insure
  const externalInsuredId = `INS_${Date.now()}`;
  const externalLoanId = `LOAN_${Date.now()}`;

  // Préparer les données de l'assuré
  const insured: digitalInsureApi.DIInsured = {
    externalInsuredId,
    numOrder: 1,
    personDataModel: {
      gender: clientData?.civility === "MME" ? "MME" : "MR",
      firstname: clientData?.first_name || context.nomComplet?.split(" ")[0] || "Prénom",
      lastname: clientData?.last_name || context.nomComplet?.split(" ").slice(1).join(" ") || "Nom",
      dateOfBirth: context.dateNaissance || clientData?.birth_date || "1980-01-01",
      email: context.email || clientData?.email || "contact@example.com",
      mobilePhoneNumber: context.telephone || clientData?.phone || "0600000000",
    },
    address: {
      adrAddressLine1: clientData?.address || "1 rue de la Paix",
      adrAddressLine2: "",
      adrZipcode: context.codePostal || clientData?.postal_code || "75001",
      adrCity: clientData?.city || "Paris",
      adrCountry: "FRANCE",
    },
    countryOfResidence: "FRANCE",
    cityOfBirth: clientData?.city || "Paris",
    professionalCategory: mapProfessionalCategory(context.statutProfessionnel || clientData?.professional_category),
    smoker: context.fumeur === true,
    esmoker: false,
    esmokerNoNicotine: false,
    annualMilage: "0",
    workAtHeight: "0",
    manualWork: false,
    exactJob: context.statutProfessionnel || clientData?.professional_category || "Employé",
    socialRegime: "SALARIE",
    manualWorkRisk: false,
    workRisk: false,
    dangerousProduct: false,
    outStandings: context.encoursCredits ? [
      {
        context: "ASSURE_LEMOINE",
        value: "DC_IMMO_SUP_200K",
      },
    ] : [],
  };

  // Calculer la date d'effet (3 mois dans le futur par défaut)
  const effectiveDate = new Date();
  effectiveDate.setMonth(effectiveDate.getMonth() + 3);
  const effectiveDateStr = effectiveDate.toISOString().split("T")[0];

  // Préparer les données du prêt
  const loan: digitalInsureApi.DILoan = {
    externalLoanId,
    numOrder: 1,
    type: "IMMO_AMORTISSABLE",
    amount: parseInt(context.montantPret) || 100000,
    duration: parseInt(context.dureePret) || 240,
    residualValue: 0,
    rate: parseFloat(context.tauxPret) || 2.5,
    rateType: "FIXE",
    deferredType: "AUCUN",
    deferredDuration: 0,
    effectiveDate: effectiveDateStr,
    periodicityInsurance: "MENSUELLE",
    periodicityRefund: "MENSUELLE",
    purposeOfFinancing: context.typeBien?.toLowerCase().includes("appartement") || context.typeBien?.toLowerCase().includes("maison") ? "RESI_PRINCIPALE" : "CREDIT_CONSO",
    signingDate: context.dateSignature || new Date().toISOString().split("T")[0],
  };

  // Préparer les garanties adaptées au type de bien
  const quotite = parseInt(context.quotite) || 100;
  const typePret: "IMMO_IN_FINE" | "IMMO_AMORTISSABLE" = loan.type === "IMMO_IN_FINE" ? "IMMO_IN_FINE" : "IMMO_AMORTISSABLE";
  
  const { getGarantiesParDefaut, buildCoverages } = await import("../api/garantiesExplications");
  const garantiesConfig = getGarantiesParDefaut(loan.purposeOfFinancing, typePret);
  
  let garantiesActives = [...garantiesConfig.obligatoires];
  
  if (context.garantiesOptionnelles) {
    try {
      const garantiesChoisies = JSON.parse(context.garantiesOptionnelles);
      garantiesActives = [...garantiesActives, ...garantiesChoisies];
    } catch (e) {
      garantiesActives = [...garantiesConfig.obligatoires, ...garantiesConfig.optionnelles];
    }
  } else if (garantiesConfig.optionnelles.length === 0) {
    garantiesActives = garantiesConfig.obligatoires;
  } else {
    garantiesActives = [...garantiesConfig.obligatoires, ...garantiesConfig.optionnelles];
  }
  
  const requirement: digitalInsureApi.DIRequirement = {
    insuredId: externalInsuredId,
    loanId: externalLoanId,
    premiumType: bestOffer.premiumType,
    coverages: buildCoverages(garantiesActives, quotite, 90),
  };

  return {
    contextType: "NEW",
    insureds: [insured],
    loans: [loan],
    requirements: [requirement],
  };
}

/**
 * Générer un devis via Digital Insure
 */
async function generateDigitalInsureQuote(context: any, clientData: any, premiumType: "CRD" | "FIXE" = "CRD"): Promise<any> {
  try {
    // Mapper les données du contexte vers le format Digital Insure
    const externalInsuredId = `INS_${Date.now()}`;
    const externalLoanId = `LOAN_${Date.now()}`;

    // Préparer les données de l'assuré
    const insured: digitalInsureApi.DIInsured = {
      externalInsuredId,
      numOrder: 1,
      personDataModel: {
        gender: clientData?.civility === "MME" ? "MME" : "MR",
        firstname: clientData?.first_name || context.nomComplet?.split(" ")[0] || "Prénom",
        lastname: clientData?.last_name || context.nomComplet?.split(" ").slice(1).join(" ") || "Nom",
        dateOfBirth: context.dateNaissance || clientData?.birth_date || "1980-01-01",
        email: context.email || clientData?.email || "contact@example.com",
        mobilePhoneNumber: context.telephone || clientData?.phone || "0600000000",
      },
      address: {
        adrAddressLine1: clientData?.address || "1 rue de la Paix",
        adrAddressLine2: "",
        adrZipcode: context.codePostal || clientData?.postal_code || "75001",
        adrCity: clientData?.city || "Paris",
        adrCountry: "FRANCE",
      },
      countryOfResidence: "FRANCE",
      cityOfBirth: clientData?.city || "Paris",
      professionalCategory: mapProfessionalCategory(context.statutProfessionnel || clientData?.professional_category),
      smoker: context.fumeur === true,
      esmoker: false,
      esmokerNoNicotine: false,
      annualMilage: "0",
      workAtHeight: "0",
      manualWork: false,
      exactJob: context.statutProfessionnel || clientData?.professional_category || "Employé",
      socialRegime: "SALARIE",
      manualWorkRisk: false,
      workRisk: false,
      dangerousProduct: false,
      outStandings: context.encoursCredits ? [
        {
          context: "ASSURE_LEMOINE",
          value: "DC_IMMO_SUP_200K",
        },
      ] : [],
    };

    // Calculer la date d'effet (3 mois dans le futur par défaut)
    const effectiveDate = new Date();
    effectiveDate.setMonth(effectiveDate.getMonth() + 3);
    const effectiveDateStr = effectiveDate.toISOString().split("T")[0];

    // Préparer les données du prêt
    const loan: digitalInsureApi.DILoan = {
      externalLoanId,
      numOrder: 1,
      type: "IMMO_AMORTISSABLE",
      amount: parseInt(context.montantPret) || 100000,
      duration: parseInt(context.dureePret) || 240,
      residualValue: 0,
      rate: parseFloat(context.tauxPret) || 2.5, // Utiliser le taux du contexte ou 2.5% par défaut
      rateType: "FIXE",
      deferredType: "AUCUN",
      deferredDuration: 0,
      effectiveDate: effectiveDateStr,
      periodicityInsurance: "MENSUELLE",
      periodicityRefund: "MENSUELLE",
      purposeOfFinancing: context.typeBien?.toLowerCase().includes("appartement") || context.typeBien?.toLowerCase().includes("maison") ? "RESI_PRINCIPALE" : "CREDIT_CONSO",
      signingDate: context.dateSignature || new Date().toISOString().split("T")[0],
    };

    // Préparer les garanties adaptées au type de bien
    const quotite = parseInt(context.quotite) || 100; // Utiliser la quotité du contexte ou 100% par défaut
    
    // Déterminer le type de prêt (in fine ou amortissable)
    const typePret: "IMMO_IN_FINE" | "IMMO_AMORTISSABLE" = loan.type === "IMMO_IN_FINE" ? "IMMO_IN_FINE" : "IMMO_AMORTISSABLE";
    
    // Importer les fonctions de garanties
    const { getGarantiesParDefaut, buildCoverages } = await import("../api/garantiesExplications");
    
    // Déterminer les garanties par défaut selon le type de bien
    const garantiesConfig = getGarantiesParDefaut(loan.purposeOfFinancing, typePret);
    
    // Déterminer les garanties actives
    let garantiesActives = [...garantiesConfig.obligatoires];
    
    // Ajouter les garanties optionnelles si le client les a choisies
    if (context.garantiesOptionnelles) {
      try {
        const garantiesChoisies = JSON.parse(context.garantiesOptionnelles);
        garantiesActives = [...garantiesActives, ...garantiesChoisies];
      } catch (e) {
        // Si le parsing échoue, utiliser toutes les garanties par défaut
        garantiesActives = [...garantiesConfig.obligatoires, ...garantiesConfig.optionnelles];
      }
    } else if (garantiesConfig.optionnelles.length === 0) {
      // Pas de garanties optionnelles pour ce type de bien, utiliser toutes les obligatoires
      garantiesActives = garantiesConfig.obligatoires;
    } else {
      // Par défaut, inclure toutes les garanties (obligatoires + optionnelles)
      garantiesActives = [...garantiesConfig.obligatoires, ...garantiesConfig.optionnelles];
    }
    
    const requirement: digitalInsureApi.DIRequirement = {
      insuredId: externalInsuredId,
      loanId: externalLoanId,
      premiumType,  // Utiliser le paramètre passé
      coverages: buildCoverages(garantiesActives, quotite, 90),
    };

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
        insureds: [insured],
        loans: [loan],
        requirements: [requirement],
      },
    };

    // Logger la requête pour débogage
    console.log("[Digital Insure] Requête de tarification:", JSON.stringify(tarificationRequest, null, 2));
    
    // Appeler l'API Digital Insure
    const result = await digitalInsureApi.getTarifs(tarificationRequest);
    
    // Logger la réponse complète pour débogage
    console.log("[Digital Insure] Réponse complète:", JSON.stringify(result, null, 2));

    if (result.success && result.data) {
      // Formater les tarifs pour l'affichage
      const tarifs = result.data.tarificationResponseModels || [];
      if (tarifs.length === 0) {
        return {
          success: false,
          error: "Aucun tarif disponible pour ce profil.",
        };
      }

      let message = "";
      tarifs.forEach((tarif: any, index: number) => {
        if (tarif.responseStateModel?.businessState === "OK" && tarif.quoteRateResult) {
          message += `\n\n**Offre ${index + 1}: ${tarif.productLabel || tarif.productCode}**\n`;
          message += `- Cotisation mensuelle: ${tarif.quoteRateResult.primePeriodiqueDevis.toFixed(2)}€\n`;
          message += `- Coût total: ${tarif.quoteRateResult.primeGlobaleDevis.toFixed(2)}€\n`;
          message += `- TAEA: ${(tarif.quoteRateResult.taeaDevis * 100).toFixed(2)}%\n`;
        }
      });

      return {
        success: true,
        message,
        data: result.data,
      };
    } else {
      return {
        success: false,
        error: result.error || "Erreur inconnue lors de la tarification",
      };
    }
  } catch (error: any) {
    console.error("[Digital Insure] Erreur lors de la génération du devis:", error);
    return {
      success: false,
      error: error.message || "Erreur inconnue",
    };
  }
}

/**
 * Mapper le statut professionnel vers les catégories Digital Insure
 */
function mapProfessionalCategory(status: string | undefined): string {
  if (!status) return "CADRE_SAL";
  
  const statusUpper = status.toUpperCase();
  
  if (statusUpper.includes("CADRE")) return "CADRE_SAL";
  if (statusUpper.includes("SALARIE") || statusUpper.includes("EMPLOYE")) return "NON_CADRE_SAL_EMPLOYE";
  if (statusUpper.includes("LIBERAL") || statusUpper.includes("PROFESSION LIBERALE")) return "PROFESSION_LIBERALE";
  if (statusUpper.includes("COMMERCANT") || statusUpper.includes("ARTISAN")) return "COMMERCANT_ARTISAN";
  if (statusUpper.includes("FONCTIONNAIRE")) return "FONCTIONNAIRE";
  if (statusUpper.includes("RETRAITE")) return "RETRAITE";
  if (statusUpper.includes("SANS EMPLOI") || statusUpper.includes("CHOMAGE")) return "SANS_EMPLOI";
  
  return "CADRE_SAL"; // Par défaut
}

// Fonction pour extraire les informations du message avec un prompt simple
async function extractInfoFromMessage(message: string, existingContext: any = null): Promise<any> {
  const contextInfo = existingContext
    ? `\nInformations déjà collectées:\n${JSON.stringify(existingContext, null, 2)}`
    : "";

  const extractionPrompt = `Analyse ce message et extrais UNIQUEMENT les NOUVELLES informations au format JSON.${contextInfo}

Message: "${message}"

Extrais UNIQUEMENT les informations mentionnées dans ce message (ne répète pas les informations déjà collectées):
- nom_complet: Nom complet (ou null)
- type_assurance: Type d'assurance demandé (auto, habitation, pret, sante, etc.)
- montant_pret: Montant en euros (ou null)
- duree_pret: Durée en MOIS (convertir les années en mois : 25 ans = 300 mois) (ou null)
- taux_pret: Taux du prêt en pourcentage (ex: "4" pour 4%, "2.5" pour 2,5%) (ou null)
- date_signature: Date (ou null)
- type_bien: Type de bien (appartement, maison, résidence principale, secondaire, investissement locatif) (ou null)
- nombre_emprunteurs: 1 si "seul"/"tout seul", 2 si "à deux"/"avec mon conjoint" (ou null)
- est_client_existant: true si mentionne "je suis [NOM]" ou "j'ai un contrat" ou "je suis déjà client" (true/false)
- fumeur: true si fumeur, false si non-fumeur (ou null)
- encours_credits: true/false/null
- revenu_mensuel: Revenu en euros (ou null)

EXEMPLES:
- "25 ans" → duree_pret: 300
- "4%" ou "4" → taux_pret: "4"
- "tout seul" ou "seul" → nombre_emprunteurs: 1
- "à deux" → nombre_emprunteurs: 2
- "non fumeur" → fumeur: false
- "appartement" → type_bien: "appartement"
- "résidence principale" → type_bien: "résidence principale"
- "je suis Guillaume Bidoux" → nom_complet: "Guillaume Bidoux", est_client_existant: true
- "j'ai un contrat santé" → est_client_existant: true
- "je suis déjà client" → est_client_existant: true

Réponds UNIQUEMENT avec un objet JSON valide sur une seule ligne.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Tu es un extracteur d'informations. Réponds UNIQUEMENT en JSON valide sur une seule ligne, sans explications.",
        },
        {
          role: "user",
          content: extractionPrompt,
        },
      ],
    });

    // Récupérer le contenu de la réponse
    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error("Réponse LLM invalide:", response);
      return {
        nom_complet: null,
        type_assurance: "pret",
        est_client_existant: false,
      };
    }

    const content = response.choices[0].message.content;
    if (!content) {
      console.error("Contenu LLM vide");
      return {
        nom_complet: null,
        type_assurance: "pret",
        est_client_existant: false,
      };
    }

    // Convertir en string si nécessaire
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);

    // Parser le JSON
    const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Pas de JSON trouvé dans la réponse:", contentStr);
      // Essayer de parser directement
      return JSON.parse(contentStr);
    }

    const extractedInfo = JSON.parse(jsonMatch[0]);
    return extractedInfo;
  } catch (error: any) {
    console.error("Erreur lors de l'extraction:", error.message);
    return {
      nom_complet: null,
      type_assurance: "pret",
      est_client_existant: false,
    };
  }
}

export const mcpHttpRouter = router({
  /**
   * Procédure pour traiter un message utilisateur avec gestion du contexte conversationnel
   */
  processMessage: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        sessionId: z.string(), // UUID de la session
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { message, sessionId: sessionUUID } = input;

      try {
        // Étape 1: Récupérer ou créer l'ID numérique de la session
        const sessionId = await getSessionIdFromUUID(sessionUUID, ctx.user.id);
        if (!sessionId) {
          return {
            success: false,
            message: "Impossible de créer ou récupérer la session.",
          };
        }

        // Étape 2: Récupérer le contexte existant
        const existingContext = await getSessionContext(sessionId);

        // Étape 2: Extraire les nouvelles informations du message
        const extractedInfo = await extractInfoFromMessage(message, existingContext);

        // Étape 3: Si le client dit être existant et qu'on n'a pas encore ses données, interroger le CRM
        let clientData = null;
        if (extractedInfo.est_client_existant && extractedInfo.nom_complet && !existingContext?.clientDataJson) {
          const crmResult = await searchClientByName(extractedInfo.nom_complet);

          if (crmResult.success && crmResult.data && crmResult.data.length > 0) {
            clientData = crmResult.data[0];
            extractedInfo.clientDataJson = JSON.stringify(clientData);
            // Pré-remplir avec les données du CRM
            extractedInfo.date_naissance = clientData.birth_date;
            extractedInfo.code_postal = clientData.postal_code;
            extractedInfo.statut_professionnel = clientData.professional_category;
            extractedInfo.email = clientData.email;
            extractedInfo.telephone = clientData.phone;
          }
        } else if (existingContext?.clientDataJson) {
          // Récupérer les données CRM du contexte existant
          clientData = JSON.parse(existingContext.clientDataJson);
        }

        // Étape 4: Fusionner avec le contexte existant
        const mergedData = mergeContextData(existingContext, extractedInfo);

        // Étape 5: Mettre à jour le contexte en base de données
        const updatedContext = await upsertSessionContext(sessionId, ctx.user.id, mergedData);

        // Étape 6: Déterminer les informations manquantes
        const missingFields = getMissingFields(updatedContext);

        // Étape 7: Générer une réponse appropriée
        let responseMessage = "";

        if (clientData && !existingContext?.clientDataJson) {
          // Premier message avec récupération CRM
          const birthDate = clientData.birth_date
            ? new Date(clientData.birth_date).toLocaleDateString("fr-FR")
            : "Non disponible";

          responseMessage = `Bonjour ${clientData.first_name} ${clientData.last_name} ! 

Je vois que vous êtes déjà client chez nous. Je vais préparer votre devis d'assurance de prêt immobilier.

**Informations récupérées de votre dossier:**
- Date de naissance: ${birthDate}
- Code postal: ${clientData.postal_code}
- Statut professionnel: ${clientData.professional_category}
- Email: ${clientData.email}`;
        } else {
          // Message de suivi
          responseMessage = `Merci pour ces informations !

**Informations collectées:**
${formatContextForDisplay(updatedContext)}`;
        }

        if (missingFields.length > 0) {
          responseMessage += `\n\n**Informations complémentaires nécessaires:**\n`;
          const fieldLabels: Record<string, string> = {
            nom_complet: "Votre nom complet",
            date_naissance: "Votre date de naissance (format JJ/MM/AAAA)",
            email: "Votre adresse email",
            code_postal: "Votre code postal",
            statut_professionnel: "Votre statut professionnel (salarié, cadre, libéral, etc.)",
            montant_pret: "Le montant du prêt (en euros)",
            duree_pret: "La durée du prêt (en années)",
            taux_pret: "Le taux du prêt (ex: 2.5 pour 2,5%)",
            date_signature: "La date de signature prévue chez le notaire (format JJ/MM/AAAA)",
            type_bien: "Le type de bien (appartement, maison, résidence principale, secondaire, investissement locatif)",
            nombre_emprunteurs: "Empruntez-vous seul ou à deux ? (répondez '1' pour seul, '2' pour à deux)",
            fumeur: "Êtes-vous fumeur ? (oui/non)",
          };
          responseMessage += missingFields.map((field) => `- ${fieldLabels[field] || field}`).join("\n");
          responseMessage += `\n\nPouvez-vous me fournir ces informations ?`;
        } else {
          // Toutes les informations sont disponibles
          responseMessage += `\n\n✅ **Toutes les informations nécessaires sont disponibles !**`;
          
          // Afficher les garanties adaptées au type de bien
          const { getGarantiesParDefaut, formatGarantiesExplication } = await import("../api/garantiesExplications");
          const typeBien = updatedContext?.typeBien || "RESI_PRINCIPALE";
          const garantiesConfig = getGarantiesParDefaut(typeBien, "IMMO_AMORTISSABLE");
          
          // Afficher l'explication des garanties
          responseMessage += formatGarantiesExplication(garantiesConfig);
          
          // Si c'est un investissement locatif avec des garanties optionnelles, attendre la réponse du client
          if (garantiesConfig.optionnelles.length > 0 && updatedContext && !updatedContext.garantiesOptionnelles) {
            // Ne pas générer le devis tout de suite, attendre la réponse sur les garanties optionnelles
            return {
              success: true,
              message: responseMessage,
              context: updatedContext,
              missingFields: [],
            };
          }
          
          // Générer le devis
          responseMessage += `\n\n\nGénération de votre devis en cours...`;
          
          // Appeler le comparateur intelligent
          const diResult = await compareInsuranceOffers(updatedContext, clientData);
          
          if (diResult.success) {
            responseMessage += `\n\n**Tarifs disponibles:**\n${diResult.message}`;
          } else {
            responseMessage += `\n\n⚠️ Une erreur est survenue lors de la génération du devis: ${diResult.error}`;
          }
        }

        return {
          success: true,
          message: responseMessage,
          context: updatedContext,
          missingFields,
        };
      } catch (error: any) {
        console.error("Erreur dans processMessage:", error);
        return {
          success: false,
          message: `Désolé, une erreur s'est produite lors du traitement de votre demande: ${error.message}`,
          error: error.message,
        };
      }
    }),

  /**
   * Procédure pour rechercher un client dans le CRM
   */
  searchClient: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .query(async ({ input }) => {
      return searchClientByName(input.name);
    }),

  /**
   * Procédure pour récupérer tous les clients du CRM
   */
  getAllClients: protectedProcedure.query(async () => {
    return getAllClients();
  }),

  /**
   * Procédure pour récupérer les contrats du CRM
   */
  getContracts: protectedProcedure.query(async () => {
    return getAllContracts();
  }),

  /**
   * Procédure pour récupérer les devis du CRM
   */
  getQuotes: protectedProcedure.query(async () => {
    return getAllQuotes();
  }),
});
