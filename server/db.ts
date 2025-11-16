import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, apiConfigs, InsertApiConfig, chatMessages, InsertChatMessage, chatSessions, InsertChatSession } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getApiConfigsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apiConfigs).where(eq(apiConfigs.userId, userId));
}

export async function createApiConfig(config: InsertApiConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(apiConfigs).values(config);
}

export async function updateApiConfig(id: number, config: Partial<InsertApiConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(apiConfigs).set(config).where(eq(apiConfigs.id, id));
}

export async function deleteApiConfig(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(apiConfigs).where(eq(apiConfigs.id, id));
}

export async function getChatMessages(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.chatSessionId, sessionId)).orderBy(chatMessages.createdAt);
}

export async function createChatMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(chatMessages).values(message);
}

export async function getChatSessionsList(userId: number, isAdmin: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatSessions).where(
    and(eq(chatSessions.userId, userId), eq(chatSessions.isAdmin, isAdmin))
  ).orderBy(desc(chatSessions.updatedAt));
}

export async function createChatSession(session: InsertChatSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(chatSessions).values(session);
}

export async function updateChatSession(id: number, session: Partial<InsertChatSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(chatSessions).set(session).where(eq(chatSessions.id, id));
}
