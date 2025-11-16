import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { spawn } from "child_process";
import path from "path";

/**
 * Routeur pour le workflow du chat intelligent MCP
 * Gère l'interrogation du CRM, l'extraction d'informations et l'appel aux API partenaires
 */

// Fonction pour invoquer le serveur MCP
async function invokeMCPTool(toolName: string, args: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    const mcpServerPath = "/home/ubuntu/mcp-assurance-server";
    const pythonPath = path.join(mcpServerPath, ".venv/bin/python");
    const mainPath = path.join(mcpServerPath, "main.py");

    const mcpProcess = spawn(pythonPath, [mainPath, "stdio"], {
      cwd: mcpServerPath,
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    // Préparer la requête MCP
    const mcpRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    };

    mcpProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    mcpProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    mcpProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`MCP process exited with code ${code}: ${stderr}`));
      } else {
        try {
          // Parser la réponse JSON-RPC
          const lines = stdout.split("\n").filter((line) => line.trim());
          const lastLine = lines[lines.length - 1];
          const response = JSON.parse(lastLine);
          
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
        } catch (error) {
          reject(new Error(`Failed to parse MCP response: ${error}`));
        }
      }
    });

    // Envoyer la requête au serveur MCP
    mcpProcess.stdin.write(JSON.stringify(mcpRequest) + "\n");
    mcpProcess.stdin.end();
  });
}

export const mcpChatRouter = router({
  /**
   * Procédure pour traiter un message utilisateur et orchestrer le workflow
   */
  processMessage: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        sessionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { message, sessionId } = input;

      try {
        // Étape 1: Utiliser l'IA pour extraire les informations du message
        const extractionPrompt = `Tu es un assistant d'extraction d'informations pour un courtier en assurance.
Analyse le message suivant et extrait les informations pertinentes au format JSON.

Message: "${message}"

Extrait les informations suivantes si disponibles:
- nom_complet: Nom complet du client
- type_assurance: Type d'assurance demandé (auto, habitation, pret, sante, etc.)
- montant_pret: Montant du prêt (si assurance de prêt)
- date_signature: Date de signature chez le notaire (si mentionnée)
- type_bien: Type de bien (appartement, maison, résidence principale/secondaire)
- est_client_existant: true si la personne mentionne être déjà client

Réponds UNIQUEMENT avec un objet JSON valide, sans texte supplémentaire.`;

        const extractionResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Tu es un assistant qui extrait des informations structurées. Tu réponds UNIQUEMENT en JSON valide.",
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
                  montant_pret: { type: "number" },
                  date_signature: { type: "string" },
                  type_bien: { type: "string" },
                  est_client_existant: { type: "boolean" },
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
          try {
            // Appeler l'outil MCP pour rechercher le client dans le CRM
            const crmResult = await invokeMCPTool("obtenir_clients_crm", {});
            
            // Parser le résultat et chercher le client par nom
            const crmData = JSON.parse(crmResult);
            if (crmData.success && crmData.data) {
              const clients = crmData.data;
              clientData = clients.find((client: any) =>
                client.name?.toLowerCase().includes(extractedInfo.nom_complet.toLowerCase())
              );
            }
          } catch (error) {
            console.error("Erreur lors de la recherche client CRM:", error);
          }
        }

        // Étape 3: Déterminer les informations manquantes pour Zenioo
        const requiredFields = {
          date_naissance: clientData?.date_naissance || null,
          code_postal: clientData?.code_postal || null,
          statut_professionnel: clientData?.statut_professionnel || null,
          montant_pret: extractedInfo.montant_pret || null,
          date_effet: extractedInfo.date_signature || null,
        };

        const missingFields = Object.entries(requiredFields)
          .filter(([_, value]) => !value)
          .map(([key]) => key);

        // Étape 4: Générer une réponse appropriée
        let responseMessage = "";

        if (clientData) {
          responseMessage = `Bonjour ${clientData.name || extractedInfo.nom_complet} ! 
          
Je vois que vous êtes déjà client chez nous. Je vais préparer votre devis d'assurance de prêt immobilier.

**Informations récupérées de votre dossier:**
${clientData.date_naissance ? `- Date de naissance: ${clientData.date_naissance}` : ""}
${clientData.code_postal ? `- Code postal: ${clientData.code_postal}` : ""}
${clientData.statut_professionnel ? `- Statut professionnel: ${clientData.statut_professionnel}` : ""}

**Informations de votre demande:**
- Montant du prêt: ${extractedInfo.montant_pret ? extractedInfo.montant_pret + "€" : "Non spécifié"}
- Date de signature: ${extractedInfo.date_signature || "25/11/2025"}
- Type de bien: ${extractedInfo.type_bien || "Résidence principale"}`;

          if (missingFields.length > 0) {
            responseMessage += `\n\n**Informations complémentaires nécessaires:**\n`;
            const fieldLabels: Record<string, string> = {
              date_naissance: "Votre date de naissance",
              code_postal: "Votre code postal",
              statut_professionnel: "Votre statut professionnel (salarié, cadre, libéral, etc.)",
              montant_pret: "Le montant du prêt",
              date_effet: "La date de prise d'effet souhaitée",
            };
            missingFields.forEach((field) => {
              responseMessage += `- ${fieldLabels[field] || field}\n`;
            });
          } else {
            responseMessage += `\n\n✅ Toutes les informations nécessaires sont disponibles. Je génère votre devis...`;
            
            // TODO: Appeler l'API Zenioo pour générer le devis
            // const zeniooResult = await invokeMCPTool("obtenir_devis_auto_zenioo", { ... });
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
   * Procédure pour appeler directement un outil MCP
   */
  callMCPTool: protectedProcedure
    .input(
      z.object({
        toolName: z.string(),
        args: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await invokeMCPTool(input.toolName, input.args);
        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),
});
