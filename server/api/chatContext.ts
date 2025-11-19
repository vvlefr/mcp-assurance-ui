import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { chatContexts, chatSessions, ChatContext, InsertChatContext } from "../../drizzle/schema";

/**
 * Module pour gérer le contexte conversationnel des sessions de chat
 */

/**
 * Récupérer ou créer l'ID numérique d'une session à partir de son UUID
 */
export async function getSessionIdFromUUID(sessionUUID: string, userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  // Vérifier si la session existe
  const results = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.sessionId, sessionUUID))
    .limit(1);

  if (results.length > 0) {
    return results[0].id;
  }

  // Créer une nouvelle session si elle n'existe pas
  const insertResult = await db.insert(chatSessions).values({
    userId,
    sessionId: sessionUUID,
  });

  // Récupérer l'ID de la session nouvellement créée
  const newSession = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.sessionId, sessionUUID))
    .limit(1);

  return newSession.length > 0 ? newSession[0].id : null;
}

/**
 * Récupérer le contexte d'une session
 */
export async function getSessionContext(sessionId: number): Promise<ChatContext | null> {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(chatContexts)
    .where(eq(chatContexts.sessionId, sessionId))
    .limit(1);

  return results.length > 0 ? results[0] : null;
}

/**
 * Créer ou mettre à jour le contexte d'une session
 */
export async function upsertSessionContext(
  sessionId: number,
  userId: number,
  updates: Partial<InsertChatContext>
): Promise<ChatContext | null> {
  const db = await getDb();
  if (!db) return null;

  // Vérifier si un contexte existe déjà
  const existing = await getSessionContext(sessionId);

  if (existing) {
    // Mettre à jour le contexte existant
    await db
      .update(chatContexts)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(chatContexts.sessionId, sessionId));

    return getSessionContext(sessionId);
  } else {
    // Créer un nouveau contexte
    await db.insert(chatContexts).values({
      sessionId,
      userId,
      ...updates,
    });

    return getSessionContext(sessionId);
  }
}

/**
 * Fusionner les nouvelles informations avec le contexte existant
 */
export function mergeContextData(
  existing: ChatContext | null,
  newData: any
): Partial<InsertChatContext> {
  const merged: Partial<InsertChatContext> = {};

  // Informations client
  if (newData.nom_complet) merged.nomComplet = newData.nom_complet;
  if (newData.date_naissance) merged.dateNaissance = newData.date_naissance;
  if (newData.code_postal) merged.codePostal = newData.code_postal;
  if (newData.statut_professionnel) merged.statutProfessionnel = newData.statut_professionnel;
  if (newData.email) merged.email = newData.email;
  if (newData.telephone) merged.telephone = newData.telephone;

  // Informations assurance
  if (newData.type_assurance) merged.typeAssurance = newData.type_assurance;
  if (newData.montant_pret !== undefined && newData.montant_pret !== null) {
    merged.montantPret = newData.montant_pret;
  }
  if (newData.duree_pret !== undefined && newData.duree_pret !== null) {
    merged.dureePret = newData.duree_pret;
  }
  if (newData.taux_pret) merged.tauxPret = newData.taux_pret;
  if (newData.date_signature) merged.dateSignature = newData.date_signature;
  if (newData.type_bien) merged.typeBien = newData.type_bien;
  if (newData.fumeur !== undefined && newData.fumeur !== null) {
    merged.fumeur = newData.fumeur ? 1 : 0;
  }
  if (newData.encours_credits !== undefined && newData.encours_credits !== null) {
    merged.encoursCredits = newData.encours_credits ? 1 : 0;
  }
  if (newData.nombre_emprunteurs !== undefined && newData.nombre_emprunteurs !== null) {
    merged.nombreEmprunteurs = newData.nombre_emprunteurs;
    // Calculer automatiquement la quotité
    if (newData.nombre_emprunteurs === 1) {
      merged.quotite = 100;
    } else if (newData.nombre_emprunteurs === 2) {
      merged.quotite = 50; // Par défaut, peut être ajusté
    }
  }
  if (newData.quotite !== undefined && newData.quotite !== null) {
    merged.quotite = newData.quotite;
  }
  if (newData.revenu_mensuel !== undefined && newData.revenu_mensuel !== null) {
    merged.revenuMensuel = newData.revenu_mensuel;
  }

  // Données CRM
  if (newData.clientDataJson) merged.clientDataJson = newData.clientDataJson;

  return merged;
}

/**
 * Vérifier quelles informations sont manquantes pour générer un devis
 * Inclut tous les champs CRITIQUES pour l'API Digital Insure
 */
export function getMissingFields(context: ChatContext | null): string[] {
  if (!context) {
    return [
      "nom_complet",
      "date_naissance",
      "code_postal",
      "statut_professionnel",
      "montant_pret",
      "duree_pret",
      "date_signature",
      "type_bien",
      "fumeur",
    ];
  }

  const missing: string[] = [];

  // Informations d'identité (CRITIQUES)
  if (!context.nomComplet) missing.push("nom_complet");
  if (!context.dateNaissance) missing.push("date_naissance");
  if (!context.email) missing.push("email");
  if (!context.codePostal) missing.push("code_postal");
  
  // Situation professionnelle (CRITIQUE)
  if (!context.statutProfessionnel) missing.push("statut_professionnel");
  
  // Détails du prêt (CRITIQUES)
  if (!context.montantPret) missing.push("montant_pret");
  if (!context.dureePret) missing.push("duree_pret");
  if (!context.tauxPret) missing.push("taux_pret");
  if (!context.dateSignature) missing.push("date_signature");
  if (!context.typeBien) missing.push("type_bien");
  if (!context.nombreEmprunteurs) missing.push("nombre_emprunteurs");
  
  // Santé et risques (CRITIQUES)
  if (context.fumeur === null) missing.push("fumeur");
  
  // Note: Les champs suivants ont des valeurs par défaut dans generateDigitalInsureQuote:
  // - taux_pret: 2.5% par défaut
  // - quotite: 100% par défaut
  // - garanties: DC/PTIA + IPT + IPP + ITT par défaut
  // - franchise_itt: 90 jours par défaut
  // - encours_credits: false par défaut
  // - sports_risque: false par défaut

  return missing;
}

/**
 * Formater le contexte pour l'affichage
 */
export function formatContextForDisplay(context: ChatContext | null): string {
  if (!context) return "Aucune information collectée.";

  const lines: string[] = [];

  if (context.nomComplet) lines.push(`- Nom: ${context.nomComplet}`);
  if (context.dateNaissance) {
    const date = new Date(context.dateNaissance);
    lines.push(`- Date de naissance: ${date.toLocaleDateString("fr-FR")}`);
  }
  if (context.codePostal) lines.push(`- Code postal: ${context.codePostal}`);
  if (context.statutProfessionnel) lines.push(`- Statut professionnel: ${context.statutProfessionnel}`);
  if (context.email) lines.push(`- Email: ${context.email}`);
  if (context.montantPret) lines.push(`- Montant du prêt: ${context.montantPret}€`);
  if (context.dureePret) lines.push(`- Durée du prêt: ${context.dureePret} mois (${Math.round(context.dureePret / 12)} ans)`);
  if (context.tauxPret) lines.push(`- Taux du prêt: ${context.tauxPret}%`);
  if (context.dateSignature) lines.push(`- Date de signature: ${context.dateSignature}`);
  if (context.typeBien) lines.push(`- Type de bien: ${context.typeBien}`);
  if (context.nombreEmprunteurs) {
    const emprunteurs = context.nombreEmprunteurs === 1 ? "Seul" : "À deux";
    lines.push(`- Nombre d'emprunteurs: ${emprunteurs}`);
  }
  if (context.quotite) lines.push(`- Quotité d'assurance: ${context.quotite}%`);
  if (context.fumeur !== null) lines.push(`- Fumeur: ${context.fumeur ? "Oui" : "Non"}`);
  if (context.revenuMensuel) lines.push(`- Revenu mensuel: ${context.revenuMensuel}€`);

  return lines.join("\n");
}
