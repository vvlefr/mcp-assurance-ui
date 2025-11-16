import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { mcpChatRouter } from "./routers/mcpChat";
import { z } from "zod";
import { getChatSessionsList, createChatSession, getChatMessages, createChatMessage } from "./db";
import { apiConfigRouter } from "./routers/apiConfig";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Chat et API Configuration routers
  chat: router({
    getSessions: protectedProcedure
      .input(z.object({ isAdmin: z.number().int() }))
      .query(async ({ ctx, input }) => {
        return getChatSessionsList(ctx.user.id, input.isAdmin);
      }),
    
    createSession: protectedProcedure
      .input(z.object({ title: z.string().optional(), isAdmin: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await createChatSession({
          userId: ctx.user.id,
          sessionId,
          title: input.title,
          isAdmin: input.isAdmin,
        });
        return { sessionId };
      }),
    
    getMessages: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        return getChatMessages(input.sessionId);
      }),
    
    addMessage: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
        toolName: z.string().optional(),
        toolParams: z.string().optional(),
        toolResult: z.string().optional(),
        isAdmin: z.number().int(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createChatMessage({
          userId: ctx.user.id,
          chatSessionId: input.sessionId,
          role: input.role,
          content: input.content,
          toolName: input.toolName,
          toolParams: input.toolParams,
          toolResult: input.toolResult,
          isAdmin: input.isAdmin,
        });
      }),
  }),

  apiConfig: apiConfigRouter,
  mcpChat: mcpChatRouter,
});

export type AppRouter = typeof appRouter;

// Import des types pour la base de données
export type { ChatSession, ChatMessage, ApiConfig } from "../drizzle/schema";
