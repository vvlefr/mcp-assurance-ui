/**
 * Script de test du chatbot MCP Assurance
 * Simule plusieurs conversations avec différents profils
 */

const API_URL = "http://localhost:3000/api/trpc";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  result: {
    data: {
      response: string;
      context: any;
      toolsUsed: string[];
    };
  };
}

async function sendMessage(sessionId: string, message: string, context: any = {}): Promise<any> {
  const response = await fetch(`${API_URL}/mcpChat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      json: {
        sessionId,
        message,
        context,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.result?.data;
}

function printSeparator(title: string) {
  console.log("\n" + "=".repeat(80));
  console.log(`📋 ${title}`);
  console.log("=".repeat(80));
}

function printMessage(role: string, content: string) {
  const prefix = role === "user" ? "👤 Utilisateur" : "🤖 Assistant";
  console.log(`\n${prefix}:`);
  // Limiter l'affichage à 500 caractères
  const displayContent = content.length > 800 ? content.substring(0, 800) + "..." : content;
  console.log(displayContent);
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// SIMULATION 1: Jeune primo-accédant
// ============================================================================
async function simulationJeunePrimoAccedant() {
  printSeparator("SIMULATION 1: Jeune primo-accédant (28 ans)");

  const sessionId = `test_primo_${Date.now()}`;
  let context = {};

  const conversation = [
    "Bonjour, je souhaite obtenir un devis pour une assurance de prêt immobilier",
    "Je m'appelle Thomas Martin, né le 15 mars 1996, j'habite au 12 rue des Lilas, 75011 Paris",
    "Mon email est thomas.martin@email.com et mon téléphone 0612345678",
    "Je suis cadre dans une entreprise de tech, non-fumeur",
    "Je veux emprunter 280000 euros sur 25 ans pour acheter ma résidence principale, le taux est de 3.4%",
    "Je veux une couverture à 100% avec toutes les garanties",
    "Pouvez-vous me donner les offres disponibles ?",
  ];

  try {
    for (const message of conversation) {
      printMessage("user", message);
      await delay(1000);

      const result = await sendMessage(sessionId, message, context);
      if (result) {
        printMessage("assistant", result.response);
        context = result.context || context;

        if (result.toolsUsed && result.toolsUsed.length > 0) {
          console.log(`\n   🔧 Outils utilisés: ${result.toolsUsed.join(", ")}`);
        }
      }
      await delay(500);
    }
    console.log("\n✅ Simulation 1 terminée avec succès");
    return { success: true, sessionId, context };
  } catch (error: any) {
    console.log(`\n❌ Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// SIMULATION 2: Couple avec co-emprunteur
// ============================================================================
async function simulationCoupleCoEmprunteur() {
  printSeparator("SIMULATION 2: Couple avec co-emprunteur");

  const sessionId = `test_couple_${Date.now()}`;
  let context = {};

  const conversation = [
    "Bonjour, mon mari et moi souhaitons une assurance pour notre prêt immobilier",
    "Je suis Sophie Durand, née le 22 juin 1985, résidant 45 avenue Victor Hugo, 69003 Lyon",
    "Email: sophie.durand@gmail.com, téléphone: 0698765432",
    "Je suis infirmière libérale et non-fumeuse",
    "Mon co-emprunteur est Pierre Durand, né le 8 janvier 1983, il est commercial et non-fumeur aussi",
    "Nous empruntons 350000€ sur 20 ans à 3.2% pour notre résidence principale",
    "Je veux 60% de couverture pour moi et 40% pour mon mari",
    "Montrez-moi les offres avec les garanties décès, invalidité et ITT",
  ];

  try {
    for (const message of conversation) {
      printMessage("user", message);
      await delay(1000);

      const result = await sendMessage(sessionId, message, context);
      if (result) {
        printMessage("assistant", result.response);
        context = result.context || context;

        if (result.toolsUsed && result.toolsUsed.length > 0) {
          console.log(`\n   🔧 Outils utilisés: ${result.toolsUsed.join(", ")}`);
        }
      }
      await delay(500);
    }
    console.log("\n✅ Simulation 2 terminée avec succès");
    return { success: true, sessionId, context };
  } catch (error: any) {
    console.log(`\n❌ Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// SIMULATION 3: Investisseur locatif senior
// ============================================================================
async function simulationInvestisseurSenior() {
  printSeparator("SIMULATION 3: Investisseur locatif senior (55 ans)");

  const sessionId = `test_invest_${Date.now()}`;
  let context = {};

  const conversation = [
    "Je cherche une assurance emprunteur pour un investissement locatif",
    "Marc Lefevre, né le 3 septembre 1969, 8 boulevard Haussmann, 75009 Paris",
    "marc.lefevre@business.fr, 0145678901",
    "Chef d'entreprise, non-fumeur",
    "200000 euros sur 15 ans à 3.8% pour un investissement locatif",
    "Quelle est la meilleure offre pour mon profil ?",
  ];

  try {
    for (const message of conversation) {
      printMessage("user", message);
      await delay(1000);

      const result = await sendMessage(sessionId, message, context);
      if (result) {
        printMessage("assistant", result.response);
        context = result.context || context;

        if (result.toolsUsed && result.toolsUsed.length > 0) {
          console.log(`\n   🔧 Outils utilisés: ${result.toolsUsed.join(", ")}`);
        }
      }
      await delay(500);
    }
    console.log("\n✅ Simulation 3 terminée avec succès");
    return { success: true, sessionId, context };
  } catch (error: any) {
    console.log(`\n❌ Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════════════════╗");
  console.log("║           TEST DU CHATBOT MCP ASSURANCE - SIMULATIONS                        ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════════╝");
  console.log("\n⏳ Démarrage des tests...\n");

  const results: any[] = [];

  // Simulation 1
  const result1 = await simulationJeunePrimoAccedant();
  results.push({ name: "Jeune primo-accédant", ...result1 });
  await delay(2000);

  // Simulation 2
  const result2 = await simulationCoupleCoEmprunteur();
  results.push({ name: "Couple co-emprunteur", ...result2 });
  await delay(2000);

  // Simulation 3
  const result3 = await simulationInvestisseurSenior();
  results.push({ name: "Investisseur senior", ...result3 });

  // Résumé
  printSeparator("RÉSUMÉ DES SIMULATIONS");
  results.forEach((r, i) => {
    const status = r.success ? "✅" : "❌";
    console.log(`${status} Simulation ${i + 1}: ${r.name}`);
    if (!r.success) {
      console.log(`   Erreur: ${r.error}`);
    }
  });

  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 Résultat: ${successCount}/${results.length} simulations réussies`);
}

main().catch(console.error);
