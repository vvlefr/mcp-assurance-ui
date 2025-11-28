/**
 * Transport HTTP/SSE pour le serveur MCP
 *
 * Ce module expose le serveur MCP via HTTP en utilisant le transport SSE
 * (Server-Sent Events) compatible avec les LLM publics.
 *
 * Endpoints:
 * - GET /api/mcp/sse : Connexion SSE pour recevoir les messages du serveur
 * - POST /api/mcp/message : Envoyer un message au serveur MCP
 * - GET /api/mcp/info : Informations sur le serveur MCP
 */

import { Router, Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { mcpServer } from "./mcpServer";
import { debugLog } from "../debug-logger";

// Créer le routeur Express pour le MCP
export const mcpRouter = Router();

// Map pour stocker les transports SSE actifs par session
const activeTransports = new Map<string, SSEServerTransport>();

/**
 * GET /api/mcp/info
 * Informations sur le serveur MCP
 */
mcpRouter.get("/info", (req: Request, res: Response) => {
  res.json({
    name: "titan-assurance-mcp",
    version: "1.0.0",
    description: "Serveur MCP pour la génération de devis d'assurance de prêt immobilier",
    tools: [
      {
        name: "get_coverage_options",
        description: "Obtenir les options de garanties selon le type de bien",
      },
      {
        name: "get_insurance_quote",
        description: "Générer un devis d'assurance de prêt immobilier",
      },
      {
        name: "compare_insurance_offers",
        description: "Comparer les offres CRD vs FIXE",
      },
      {
        name: "get_available_products",
        description: "Liste des produits d'assurance disponibles",
      },
      {
        name: "create_business_record",
        description: "Créer un dossier dans l'extranet Digital Insure",
      },
      {
        name: "search_client",
        description: "Rechercher un client dans le CRM",
      },
    ],
    endpoints: {
      sse: "/api/mcp/sse",
      message: "/api/mcp/message",
      info: "/api/mcp/info",
    },
    protocol: "MCP (Model Context Protocol)",
    transport: "SSE (Server-Sent Events)",
  });
});

/**
 * GET /api/mcp/sse
 * Établir une connexion SSE avec le serveur MCP
 */
mcpRouter.get("/sse", async (req: Request, res: Response) => {
  try {
    debugLog("[MCP HTTP] Nouvelle connexion SSE");

    // Configurer les headers SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("X-Accel-Buffering", "no");

    // Générer un ID de session unique
    const sessionId = `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Créer le transport SSE
    const transport = new SSEServerTransport("/api/mcp/message", res);
    activeTransports.set(sessionId, transport);

    // Envoyer l'ID de session au client
    res.write(`data: ${JSON.stringify({ type: "session", sessionId })}\n\n`);

    // Connecter le transport au serveur MCP
    await mcpServer.connect(transport);

    debugLog(`[MCP HTTP] Connexion SSE établie, sessionId: ${sessionId}`);

    // Gérer la déconnexion
    req.on("close", () => {
      debugLog(`[MCP HTTP] Connexion SSE fermée, sessionId: ${sessionId}`);
      activeTransports.delete(sessionId);
    });
  } catch (error: any) {
    debugLog("[MCP HTTP] Erreur connexion SSE:", error);
    res.status(500).json({
      error: "Erreur lors de l'établissement de la connexion SSE",
      details: error.message,
    });
  }
});

/**
 * POST /api/mcp/message
 * Recevoir un message du client et le transmettre au serveur MCP
 */
mcpRouter.post("/message", async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({
        error: "sessionId requis dans les paramètres de requête",
      });
    }

    const transport = activeTransports.get(sessionId);

    if (!transport) {
      return res.status(404).json({
        error: "Session non trouvée. Établissez d'abord une connexion SSE.",
      });
    }

    debugLog("[MCP HTTP] Message reçu:", req.body);

    // Le transport SSE gère automatiquement la transmission
    await transport.handlePostMessage(req, res);
  } catch (error: any) {
    debugLog("[MCP HTTP] Erreur traitement message:", error);
    res.status(500).json({
      error: "Erreur lors du traitement du message",
      details: error.message,
    });
  }
});

/**
 * GET /api/mcp/health
 * Vérifier l'état du serveur MCP
 */
mcpRouter.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    activeSessions: activeTransports.size,
    timestamp: new Date().toISOString(),
  });
});

export default mcpRouter;
