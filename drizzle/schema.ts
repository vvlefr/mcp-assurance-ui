import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Table pour stocker les configurations des API des assureurs
 */
export const apiConfigs = mysqlTable("api_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assureurName: varchar("assureurName", { length: 255 }).notNull(),
  apiKey: text("apiKey").notNull(), // Encrypted in production
  baseUrl: varchar("baseUrl", { length: 512 }).notNull(),
  apiType: varchar("apiType", { length: 50 }).notNull(), // 'auto', 'habitation', 'crm', etc.
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiConfig = typeof apiConfigs.$inferSelect;
export type InsertApiConfig = typeof apiConfigs.$inferInsert;

/**
 * Table pour stocker l'historique des conversations de chat
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  chatSessionId: varchar("chatSessionId", { length: 64 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  toolName: varchar("toolName", { length: 255 }), // Nom de l'outil MCP appelé
  toolParams: text("toolParams"), // JSON stringified
  toolResult: text("toolResult"), // JSON stringified
  isAdmin: int("isAdmin").default(0).notNull(), // 0 = test chat, 1 = admin chat
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Table pour stocker les sessions de chat
 */
export const chatSessions = mysqlTable("chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 255 }),
  isAdmin: int("isAdmin").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

/**
 * Table pour stocker le contexte des sessions de chat (informations collectées)
 */
export const chatContexts = mysqlTable("chat_contexts", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  // Informations client
  nomComplet: varchar("nomComplet", { length: 255 }),
  dateNaissance: varchar("dateNaissance", { length: 20 }),
  codePostal: varchar("codePostal", { length: 10 }),
  statutProfessionnel: varchar("statutProfessionnel", { length: 100 }),
  email: varchar("email", { length: 320 }),
  telephone: varchar("telephone", { length: 20 }),
  // Informations assurance
  typeAssurance: varchar("typeAssurance", { length: 50 }),
  montantPret: int("montantPret"),
  dureePret: int("dureePret"), // en mois
  tauxPret: varchar("tauxPret", { length: 10 }), // Taux du prêt (ex: "2.5" pour 2,5%)
  dateSignature: varchar("dateSignature", { length: 20 }),
  typeBien: varchar("typeBien", { length: 100 }),
  fumeur: int("fumeur"), // 0 = non, 1 = oui, null = non répondu
  encoursCredits: int("encoursCredits"), // 0 = non, 1 = oui, null = non répondu
  nombreEmprunteurs: int("nombreEmprunteurs"), // 1 = seul, 2 = à deux
  quotite: int("quotite"), // Quotité d'assurance (50 ou 100)
  revenuMensuel: int("revenuMensuel"),
  // Métadonnées
  clientDataJson: text("clientDataJson"), // Données complètes du CRM en JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatContext = typeof chatContexts.$inferSelect;
export type InsertChatContext = typeof chatContexts.$inferInsert;