import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import axios from "axios";

/**
 * Routeur pour le workflow du chat intelligent via le serveur HTTP MCP
 */

const MCP_HTTP_URL = "http://localhost:8000";

// Fonction pour interroger le CRM via le serveur HTTP MCP
async function searchClientInCRM(name: string): Promise<any> {
  try {
    const response = await axios.post(`${MCP_HTTP_URL}/crm/clients/search`, {
      name,
    });
    return response.data;
  } catch (error: any) {
    console.error("Erreur lors de la recherche client CRM:", error.message);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}

export const mcpHttpRouter = router({
  /**
   * Procédure pour traiter un message utilisateur avec le serveur HTTP MCP
   */
  processMessage: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        sessionId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { message } = input;

      try {
        // Étape 1: Utiliser l'IA pour extraire les informations du message
        const extractionPrompt = `Tu es un assistant d'extraction d'informations pour un courtier en assurance.
Analyse le message suivant et extrait les informations pertinentes au format JSON.

Message: "${message}"

Extrait les informations suivantes si disponibles:
- nom_complet: Nom complet du client (ex: "GUILLAUME BIDOUX")
- type_assurance: Type d'assurance demandé (auto, habitation, pret, sante, etc.)
- montant_pret: Montant du prêt en euros (ex: 300000)
- date_signature: Date de signature (ex: "2025-11-25")
- type_bien: Type de bien (appartement, maison, résidence principale/secondaire)
- est_client_existant: true si la personne mentionne être déjà client
- fumeur: true/false si mentionné
- encours_credits: true/false si mentionné
- duree_pret: Durée du prêt en années si mentionnée
- revenu_mensuel: Revenu mensuel en euros si mentionné

Réponds UNIQUEMENT avec un objet JSON valide, sans texte supplémentaire.`;

        const extractionResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "Tu es un assistant qui extrait des informations structurées. Tu réponds UNIQUEMENT en JSON valide.",
            },
            {
              role: "user",
              content: extractionPrompt,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "extraction_info",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  nom_complet: { type: "string" },
                  type_assurance: { type: "string" },
                  montant_pret: { type: ["number", "null"] },
                  date_signature: { type: ["string", "null"] },
                  type_bien: { type: ["string", "null"] },
                  est_client_existant: { type: "boolean" },
                  fumeur: { type: ["boolean", "null"] },
                  encours_credits: { type: ["boolean", "null"] },
                  duree_pret: { type: ["number", "null"] },
                  revenu_mensuel: { type: ["number", "null"] },
                },
                required: ["nom_complet", "type_assurance"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = extractionResponse.choices[0].message.content;
        const extractedInfo = JSON.parse(
          typeof content === "string" ? content : "{}"
        );

        // Étape 2: Si le client dit être existant, interroger le CRM
        let clientData = null;
        if (extractedInfo.est_client_existant && extractedInfo.nom_complet) {
          const crmResult = await searchClientInCRM(extractedInfo.nom_complet);

          if (crmResult.success && crmResult.data && crmResult.data.length > 0) {
            clientData = crmResult.data[0]; // Prendre le premier résultat
          }
        }

        // Étape 3: Déterminer les informations manquantes pour Zenioo
        const requiredFields: Record<string, any> = {
          date_naissance: clientData?.birth_date || null,
          code_postal: clientData?.postal_code || null,
          statut_professionnel: clientData?.professional_category || null,
          montant_pret: extractedInfo.montant_pret || null,
          date_effet: extractedInfo.date_signature || null,
          fumeur: extractedInfo.fumeur !== null ? extractedInfo.fumeur : null,
          encours_credits:
            extractedInfo.encours_credits !== null
              ? extractedInfo.encours_credits
              : null,
          duree_pret: extractedInfo.duree_pret || null,
          revenu_mensuel: extractedInfo.revenu_mensuel || null,
        };

        const missingFields = Object.entries(requiredFields)
          .filter(([_, value]) => value === null || value === undefined)
          .map(([key]) => key);

        // Étape 4: Générer une réponse appropriée
        let responseMessage = "";

        if (clientData) {
          // Formater la date de naissance
          const birthDate = clientData.birth_date
            ? new Date(clientData.birth_date).toLocaleDateString("fr-FR")
            : "Non disponible";

          responseMessage = `Bonjour ${clientData.first_name} ${clientData.last_name} ! 

Je vois que vous êtes déjà client chez nous. Je vais préparer votre devis d'assurance de prêt immobilier.

**Informations récupérées de votre dossier:**
- Date de naissance: ${birthDate}
- Code postal: ${clientData.postal_code}
- Statut professionnel: ${clientData.professional_category}
- Email: ${clientData.email}

**Informations de votre demande:**
- Montant du prêt: ${extractedInfo.montant_pret ? extractedInfo.montant_pret + "€" : "Non spécifié"}
- Date de signature: ${extractedInfo.date_signature || "25/11/2025"}
- Type de bien: ${extractedInfo.type_bien || "Résidence principale"}`;

          if (missingFields.length > 0) {
            responseMessage += `\n\n**Informations complémentaires nécessaires pour générer votre devis:**\n`;
            const fieldLabels: Record<string, string> = {
              date_naissance: "Votre date de naissance",
              code_postal: "Votre code postal",
              statut_professionnel: "Votre statut professionnel",
              montant_pret: "Le montant du prêt",
              date_effet: "La date de prise d'effet souhaitée",
              fumeur: "Êtes-vous fumeur ?",
              encours_credits:
                "Avez-vous un encours total de crédits supérieur à 200 000€ ?",
              duree_pret: "Quelle est la durée souhaitée du prêt (en années) ?",
              revenu_mensuel: "Quel est votre revenu mensuel net ?",
            };
            responseMessage += missingFields
              .map((field) => `- ${fieldLabels[field] || field}`)
              .join("\n");
            responseMessage += `\n\nPouvez-vous me fournir ces informations ?`;
          } else {
            responseMessage += `\n\n✅ Toutes les informations nécessaires sont disponibles. Génération de votre devis en cours...`;
          }
        } else {
          responseMessage = `Bonjour ${extractedInfo.nom_complet} !

Je comprends que vous souhaitez un devis pour une assurance de prêt immobilier.

**Informations reçues:**
- Montant du prêt: ${extractedInfo.montant_pret ? extractedInfo.montant_pret + "€" : "Non spécifié"}
- Date de signature: ${extractedInfo.date_signature || "25/11/2025"}
- Type de bien: ${extractedInfo.type_bien || "Résidence principale"}

**Informations nécessaires pour établir votre devis:**
- Votre date de naissance
- Votre code postal
- Votre statut professionnel (salarié, cadre, libéral, etc.)
- Êtes-vous fumeur ?
- Avez-vous un encours total de crédits supérieur à 200 000€ ?
- Quelle est la durée souhaitée du prêt (en années) ?
- Quel est votre revenu mensuel net ?

Pouvez-vous me fournir ces informations ?`;
        }

        return {
          success: true,
          message: responseMessage,
          extractedInfo,
          clientData,
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
      return searchClientInCRM(input.name);
    }),

  /**
   * Procédure pour récupérer tous les clients du CRM
   */
  getAllClients: protectedProcedure.query(async () => {
    try {
      const response = await axios.get(`${MCP_HTTP_URL}/crm/clients`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }),

  /**
   * Procédure pour récupérer les contrats du CRM
   */
  getContracts: protectedProcedure.query(async () => {
    try {
      const response = await axios.get(`${MCP_HTTP_URL}/crm/contracts`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }),

  /**
   * Procédure pour récupérer les devis du CRM
   */
  getQuotes: protectedProcedure.query(async () => {
    try {
      const response = await axios.get(`${MCP_HTTP_URL}/crm/quotes`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }),
});
