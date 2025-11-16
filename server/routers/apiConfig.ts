import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getApiConfigsByUserId,
  createApiConfig,
  updateApiConfig,
  deleteApiConfig,
} from "../db";
import { invokeLLM } from "../_core/llm";

export const apiConfigRouter = router({
  parseConfigFromAI: protectedProcedure
    .input(z.object({ instruction: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Tu es un assistant spécialisé dans l'extraction d'informations de configuration d'API d'assurance.
Extrais les informations suivantes de l'instruction utilisateur et retourne-les en JSON:
- assureurName: nom de l'assureur (ex: AXA, Allianz)
- apiKey: la clé API
- baseUrl: l'URL de base de l'API
- apiType: le type d'API (auto, habitation, crm, etc.)

Réponds UNIQUEMENT avec un objet JSON valide, sans texte supplémentaire.`,
            },
            {
              role: "user",
              content: input.instruction,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "api_config",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  assureurName: { type: "string", description: "Nom de l'assureur" },
                  apiKey: { type: "string", description: "Clé API" },
                  baseUrl: { type: "string", description: "URL de base de l'API" },
                  apiType: { type: "string", description: "Type d'API" },
                },
                required: ["assureurName", "apiKey", "baseUrl", "apiType"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0].message.content;
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        const parsed = JSON.parse(contentStr);

        return {
          success: true,
          data: parsed,
          message: `Configuration pour ${parsed.assureurName} extraite avec succès`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erreur lors du parsing",
        };
      }
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return getApiConfigsByUserId(ctx.user.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        assureurName: z.string(),
        apiKey: z.string(),
        baseUrl: z.string(),
        apiType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createApiConfig({
        userId: ctx.user.id,
        assureurName: input.assureurName,
        apiKey: input.apiKey,
        baseUrl: input.baseUrl,
        apiType: input.apiType,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        assureurName: z.string().optional(),
        apiKey: z.string().optional(),
        baseUrl: z.string().optional(),
        apiType: z.string().optional(),
        isActive: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return updateApiConfig(input.id, {
        assureurName: input.assureurName,
        apiKey: input.apiKey,
        baseUrl: input.baseUrl,
        apiType: input.apiType,
        isActive: input.isActive,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteApiConfig(input.id);
    }),
});
