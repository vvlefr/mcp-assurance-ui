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
 * Générer un devis via Digital Insure
 */
async function generateDigitalInsureQuote(context: any, clientData: any): Promise<any> {
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
      rate: 2.5, // Taux par défaut
      rateType: "FIXE",
      deferredType: "AUCUN",
      deferredDuration: 0,
      effectiveDate: effectiveDateStr,
      periodicityInsurance: "MENSUELLE",
      periodicityRefund: "MENSUELLE",
      purposeOfFinancing: context.typeBien?.toLowerCase().includes("appartement") || context.typeBien?.toLowerCase().includes("maison") ? "ACHAT_RP" : "CREDIT_CONSO",
      signingDate: context.dateSignature || new Date().toISOString().split("T")[0],
    };

    // Préparer les garanties (DC/PTIA + IPT + IPP + ITT avec quotité 100%)
    const requirement: digitalInsureApi.DIRequirement = {
      insuredId: externalInsuredId,
      loanId: externalLoanId,
      premiumType: "CRD",
      coverages: [
        {
          code: "DCPTIA",
          type: "COVERAGE",
          percentage: 100,
        },
        {
          code: "IPT",
          type: "COVERAGE",
          percentage: 100,
        },
        {
          code: "IPP",
          type: "COVERAGE",
          percentage: 100,
        },
        {
          code: "ITT",
          type: "COVERAGE",
          percentage: 100,
          deductible: 90,
        },
      ],
    };

    // Préparer la requête de tarification
    const tarificationRequest: digitalInsureApi.DITarificationRequest = {
      contractGrouping: "INITIAL",
      tarificationOptions: {
        calculateMode: "DEFAULT",
      },
      productCodes: ["MAESTRO", "AVENIRNAOASSUR", "IRIADE", "MNCAP", "IPTIQ"],
      insuranceType: "ADE",
      scenarioRecordDataModel: {
        contextType: "NEW",
        insureds: [insured],
        loans: [loan],
        requirements: [requirement],
      },
    };

    // Appeler l'API Digital Insure
    const result = await digitalInsureApi.getTarifs(tarificationRequest);

    if (result.success && result.data) {
      // Formater les tarifs pour l'affichage
      const tarifs = result.data.tarifs || [];
      if (tarifs.length === 0) {
        return {
          success: false,
          error: "Aucun tarif disponible pour ce profil.",
        };
      }

      let message = "";
      tarifs.forEach((tarif: any, index: number) => {
        message += `\n\n**Offre ${index + 1}: ${tarif.productName || "Produit"}**\n`;
        message += `- Cotisation mensuelle: ${tarif.monthlyPremium || "N/A"}€\n`;
        message += `- Coût total: ${tarif.totalCost || "N/A"}€\n`;
        message += `- TAEA: ${tarif.taea || "N/A"}%\n`;
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
  if (statusUpper.includes("SALARIE") || statusUpper.includes("EMPLOYE")) return "NON_CADRE_SAL";
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
- date_signature: Date (ou null)
- type_bien: Type de bien (ou null)
- est_client_existant: true si mentionne être client (true/false)
- fumeur: true/false/null
- encours_credits: true/false/null
- duree_pret: Durée en mois (ou null)
- revenu_mensuel: Revenu en euros (ou null)

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
            date_naissance: "Votre date de naissance",
            code_postal: "Votre code postal",
            statut_professionnel: "Votre statut professionnel",
            montant_pret: "Le montant du prêt",
            date_effet: "La date de prise d'effet souhaitée",
            fumeur: "Êtes-vous fumeur ?",
            encours_credits: "Avez-vous un encours total de crédits supérieur à 200 000€ ?",
            duree_pret: "Quelle est la durée souhaitée du prêt (en mois ou années) ?",
            revenu_mensuel: "Quel est votre revenu mensuel net ?",
          };
          responseMessage += missingFields.map((field) => `- ${fieldLabels[field] || field}`).join("\n");
          responseMessage += `\n\nPouvez-vous me fournir ces informations ?`;
        } else {
          // Toutes les informations sont disponibles, générer le devis
          responseMessage += `\n\n✅ **Toutes les informations nécessaires sont disponibles !**\n\nGénération de votre devis en cours...`;
          
          // Appeler Digital Insure pour obtenir les tarifs
          const diResult = await generateDigitalInsureQuote(updatedContext, clientData);
          
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
