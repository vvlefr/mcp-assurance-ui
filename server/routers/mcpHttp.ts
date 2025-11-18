import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { searchClientByName, getAllClients, getAllContracts, getAllQuotes } from "../api/crmApi";
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
        // Étape 1: Récupérer l'ID numérique de la session
        const sessionId = await getSessionIdFromUUID(sessionUUID);
        if (!sessionId) {
          return {
            success: false,
            message: "Session introuvable. Veuillez créer une nouvelle session.",
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
          responseMessage += `\n\n✅ **Toutes les informations nécessaires sont disponibles !**\n\nGénération de votre devis en cours...`;
          // TODO: Appeler l'API Zenioo pour générer le devis
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
