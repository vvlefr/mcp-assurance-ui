import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { searchClientByName, getAllClients, getAllContracts, getAllQuotes } from "../api/crmApi";

/**
 * Routeur pour le workflow du chat intelligent avec intégration directe des API
 */

// Fonction pour extraire les informations du message avec un prompt simple
async function extractInfoFromMessage(message: string): Promise<any> {
  const extractionPrompt = `Analyse ce message et extrais les informations au format JSON.
Message: "${message}"

Extrais:
- nom_complet: Nom complet (ou null)
- type_assurance: Type d'assurance demandé (auto, habitation, pret, sante, etc.)
- montant_pret: Montant en euros (ou null)
- date_signature: Date (ou null)
- type_bien: Type de bien (ou null)
- est_client_existant: true si mentionne être client (true/false)
- fumeur: true/false/null
- encours_credits: true/false/null
- duree_pret: Durée en années (ou null)
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
        // Étape 1: Extraire les informations du message
        const extractedInfo = await extractInfoFromMessage(message);

        // Étape 2: Si le client dit être existant, interroger le CRM
        let clientData = null;
        if (extractedInfo.est_client_existant && extractedInfo.nom_complet) {
          const crmResult = await searchClientByName(extractedInfo.nom_complet);

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
          responseMessage = `Bonjour ${extractedInfo.nom_complet || "client"} !

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
