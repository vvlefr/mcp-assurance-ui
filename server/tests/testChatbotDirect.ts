/**
 * Script de test direct du chatbot MCP Assurance
 * Teste l'extraction d'informations et la tarification
 */

import { extractInfoFromMessage } from "../routers/mcpHttp";
import * as digitalInsureApi from "../api/digitalInsureApi";
import { buildCoverages, getGarantiesParDefaut, type TypePret } from "../api/garantiesExplications";

// Interface simple pour le contexte de test
interface TestContext {
  nom_complet?: string | null;
  date_naissance?: string | null;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  code_postal?: string | null;
  ville?: string | null;
  genre?: string | null;
  fumeur?: boolean | null;
  statut_professionnel?: string | null;
  montant_pret?: number | null;
  duree_pret?: number | null;
  taux_pret?: string | null;
  type_bien?: string | null;
  nombre_emprunteurs?: number | null;
  quotite?: number | null;
}

function printSeparator(title: string) {
  console.log("\n" + "=".repeat(80));
  console.log(`📋 ${title}`);
  console.log("=".repeat(80));
}

function printContext(context: TestContext) {
  console.log("\n📊 Contexte actuel:");
  const fields = [
    ["Nom", context.nom_complet],
    ["Date naissance", context.date_naissance],
    ["Email", context.email],
    ["Téléphone", context.telephone],
    ["Adresse", context.adresse],
    ["Code postal", context.code_postal],
    ["Ville", context.ville],
    ["Genre", context.genre],
    ["Fumeur", context.fumeur !== null && context.fumeur !== undefined ? (context.fumeur ? "Oui" : "Non") : null],
    ["Statut pro", context.statut_professionnel],
    ["Montant prêt", context.montant_pret],
    ["Durée (mois)", context.duree_pret],
    ["Taux", context.taux_pret],
    ["Type bien", context.type_bien],
    ["Nb emprunteurs", context.nombre_emprunteurs],
    ["Quotité", context.quotite],
  ];

  fields.forEach(([label, value]) => {
    if (value !== null && value !== undefined) {
      console.log(`   ✓ ${label}: ${value}`);
    }
  });
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Vérifier les champs manquants
function getMissingFields(context: TestContext): string[] {
  const required = [
    { key: "nom_complet", label: "nom complet" },
    { key: "date_naissance", label: "date de naissance" },
    { key: "email", label: "email" },
    { key: "telephone", label: "téléphone" },
    { key: "fumeur", label: "fumeur (oui/non)" },
    { key: "statut_professionnel", label: "statut professionnel" },
    { key: "montant_pret", label: "montant du prêt" },
    { key: "duree_pret", label: "durée du prêt" },
    { key: "taux_pret", label: "taux du prêt" },
    { key: "type_bien", label: "type de bien" },
  ];

  return required
    .filter(f => (context as any)[f.key] === null || (context as any)[f.key] === undefined)
    .map(f => f.label);
}

// Fusionner les infos extraites dans le contexte
function mergeContext(context: TestContext, extracted: any): TestContext {
  const result = { ...context };

  // Mapper les champs extraits vers le contexte
  if (extracted.nom_complet) result.nom_complet = extracted.nom_complet;
  if (extracted.date_naissance) result.date_naissance = extracted.date_naissance;
  if (extracted.email) result.email = extracted.email;
  if (extracted.telephone) result.telephone = extracted.telephone;
  if (extracted.adresse) result.adresse = extracted.adresse;
  if (extracted.code_postal) result.code_postal = extracted.code_postal;
  if (extracted.ville) result.ville = extracted.ville;
  if (extracted.genre) result.genre = extracted.genre;
  if (extracted.fumeur !== null && extracted.fumeur !== undefined) result.fumeur = extracted.fumeur;
  if (extracted.statut_professionnel) result.statut_professionnel = extracted.statut_professionnel;
  if (extracted.montant_pret) result.montant_pret = parseInt(String(extracted.montant_pret));
  if (extracted.duree_pret) result.duree_pret = parseInt(String(extracted.duree_pret));
  if (extracted.taux_pret) result.taux_pret = String(extracted.taux_pret);
  if (extracted.type_bien) result.type_bien = extracted.type_bien;
  if (extracted.nombre_emprunteurs) result.nombre_emprunteurs = extracted.nombre_emprunteurs;
  if (extracted.quotite) result.quotite = extracted.quotite;

  return result;
}

// ============================================================================
// SIMULATION 1: Jeune primo-accédant
// ============================================================================
async function simulationJeunePrimoAccedant() {
  printSeparator("SIMULATION 1: Jeune primo-accédant (28 ans)");

  let context: TestContext = {};

  const messages = [
    "Bonjour, je souhaite obtenir un devis pour une assurance de prêt immobilier",
    "Je m'appelle Thomas Martin, né le 15 mars 1996",
    "J'habite au 12 rue des Lilas, 75011 Paris",
    "Mon email est thomas.martin@email.com et mon téléphone 0612345678",
    "Je suis cadre en CDI dans une entreprise de tech, je ne fume pas",
    "Je veux emprunter 280000 euros sur 25 ans pour acheter ma résidence principale, le taux est de 3.4%",
    "Je veux une couverture à 100%",
  ];

  console.log("\n🔄 Début de la conversation...\n");

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    console.log(`\n👤 Message ${i + 1}: "${message}"`);

    try {
      // Extraire les infos du message via LLM
      const extracted = await extractInfoFromMessage(message, context);

      // Afficher ce qui a été extrait
      const newFields = Object.entries(extracted).filter(([_, v]) => v !== null && v !== undefined);
      if (newFields.length > 0) {
        console.log(`   📝 Extrait: ${newFields.map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(", ")}`);
      } else {
        console.log(`   📝 Aucune nouvelle information extraite`);
      }

      // Fusionner avec le contexte
      context = mergeContext(context, extracted);

      // Vérifier les champs manquants
      const missing = getMissingFields(context);
      if (missing.length > 0) {
        console.log(`   ⏳ Manquant: ${missing.join(", ")}`);
      } else {
        console.log(`   ✅ Toutes les informations collectées !`);
      }
    } catch (error: any) {
      console.log(`   ❌ Erreur extraction: ${error.message}`);
    }

    await delay(1000);
  }

  // Afficher le contexte final
  printContext(context);

  // Tester la tarification si possible
  const missingFinal = getMissingFields(context);
  if (missingFinal.length <= 2) { // Tolérer quelques champs manquants
    console.log("\n📡 Test de tarification API Digital Insure...");
    await testTarification(context);
  } else {
    console.log(`\n⚠️ Trop d'informations manquantes pour la tarification: ${missingFinal.join(", ")}`);
  }

  return context;
}

// ============================================================================
// SIMULATION 2: Conversation naturelle avec couple
// ============================================================================
async function simulationConversationNaturelle() {
  printSeparator("SIMULATION 2: Couple avec investissement");

  let context: TestContext = {};

  const messages = [
    "Bonjour, je suis Sophie Durand, infirmière de 38 ans, je cherche une assurance pour mon prêt",
    "Je suis née le 22 juin 1986, j'habite à Lyon 69003, 45 avenue Victor Hugo",
    "Mon email c'est sophie.durand@gmail.com, mon numéro 0698765432, et je ne fume pas",
    "On veut acheter notre résidence principale, on emprunte 320000€ sur 22 ans à 3.3%",
  ];

  console.log("\n🔄 Début de la conversation...\n");

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    console.log(`\n👤 Message ${i + 1}: "${message}"`);

    try {
      const extracted = await extractInfoFromMessage(message, context);
      const newFields = Object.entries(extracted).filter(([_, v]) => v !== null && v !== undefined);
      if (newFields.length > 0) {
        console.log(`   📝 Extrait: ${newFields.map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(", ")}`);
      }
      context = mergeContext(context, extracted);
    } catch (error: any) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }

    await delay(1000);
  }

  printContext(context);

  const missingFinal = getMissingFields(context);
  if (missingFinal.length <= 2) {
    console.log("\n📡 Test de tarification API Digital Insure...");
    await testTarification(context);
  }

  return context;
}

// ============================================================================
// SIMULATION 3: Investisseur senior rapide
// ============================================================================
async function simulationInvestisseur() {
  printSeparator("SIMULATION 3: Investisseur locatif senior");

  let context: TestContext = {};

  const messages = [
    "Marc Lefevre, chef d'entreprise de 56 ans, né le 3 septembre 1968, non-fumeur",
    "8 boulevard Haussmann, 75009 Paris, marc.lefevre@business.fr, 0145678901",
    "180000 euros sur 12 ans à 4.1% pour un investissement locatif",
  ];

  console.log("\n🔄 Début de la conversation...\n");

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    console.log(`\n👤 Message ${i + 1}: "${message}"`);

    try {
      const extracted = await extractInfoFromMessage(message, context);
      const newFields = Object.entries(extracted).filter(([_, v]) => v !== null && v !== undefined);
      if (newFields.length > 0) {
        console.log(`   📝 Extrait: ${newFields.map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(", ")}`);
      }
      context = mergeContext(context, extracted);
    } catch (error: any) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }

    await delay(1000);
  }

  printContext(context);

  const missingFinal = getMissingFields(context);
  if (missingFinal.length <= 2) {
    console.log("\n📡 Test de tarification API Digital Insure...");
    await testTarification(context);
  }

  return context;
}

// ============================================================================
// Test de tarification avec l'API Digital Insure
// ============================================================================
async function testTarification(context: TestContext) {
  try {
    // Convertir la date de naissance au format ISO
    let birthDate = context.date_naissance || "1990-01-01";
    if (birthDate.includes("/")) {
      const parts = birthDate.split("/");
      if (parts.length === 3) {
        birthDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }

    // Mapper le statut professionnel
    const proCategory = mapProfessionalCategory(context.statut_professionnel || "salarié");

    // IDs uniques
    const externalInsuredId = `SIM_INS_${Date.now()}`;
    const externalLoanId = `SIM_LOAN_${Date.now()}`;

    // Dates
    const today = new Date();
    const signingDate = today.toISOString().split("T")[0];
    const effectiveDate = new Date(today);
    effectiveDate.setMonth(effectiveDate.getMonth() + 3);
    const effectiveDateStr = effectiveDate.toISOString().split("T")[0];

    // Nom
    const nameParts = (context.nom_complet || "Test User").split(" ");
    const firstName = nameParts[0] || "Prénom";
    const lastName = nameParts.slice(1).join(" ") || "Nom";

    const insured: digitalInsureApi.DIInsured = {
      externalInsuredId,
      numOrder: 1,
      personDataModel: {
        gender: context.genre === "F" || context.genre === "MME" ? "MME" : "MR",
        firstname: firstName,
        lastname: lastName,
        dateOfBirth: birthDate,
        email: context.email || "test@test.com",
        mobilePhoneNumber: context.telephone || "0600000000",
      },
      address: {
        adrAddressLine1: context.adresse || "1 rue Test",
        adrAddressLine2: "",
        adrZipcode: context.code_postal || "75001",
        adrCity: context.ville || "Paris",
        adrCountry: "FRANCE",
      },
      countryOfResidence: "FRANCE",
      cityOfBirth: context.ville || "Paris",
      professionalCategory: proCategory,
      smoker: context.fumeur || false,
      esmoker: false,
      esmokerNoNicotine: false,
      annualMilage: "0",
      workAtHeight: "0",
      manualWork: false,
      exactJob: proCategory,
      socialRegime: ["CADRE_SAL", "NON_CADRE_SAL_EMPLOYE", "FONCTIONNAIRE_B_C"].includes(proCategory) ? "SALARIE" : "TNS",
      manualWorkRisk: false,
      workRisk: false,
      dangerousProduct: false,
      outStandings: [],
    };

    const purposeOfFinancing = mapPropertyType(context.type_bien || "résidence principale");

    const loan: digitalInsureApi.DILoan = {
      externalLoanId,
      numOrder: 1,
      type: "IMMO_AMORTISSABLE",
      amount: context.montant_pret || 200000,
      duration: context.duree_pret || 240,
      residualValue: 0,
      rate: parseFloat(context.taux_pret || "3.5") || 3.5,
      rateType: "FIXE",
      deferredType: "AUCUN",
      deferredDuration: 0,
      effectiveDate: effectiveDateStr,
      periodicityInsurance: "MENSUELLE",
      periodicityRefund: "MENSUELLE",
      purposeOfFinancing,
      signingDate,
    };

    // Garanties
    const garantiesConfig = getGarantiesParDefaut(purposeOfFinancing, "IMMO_AMORTISSABLE" as TypePret);
    const coverages = buildCoverages(garantiesConfig.obligatoires, context.quotite || 100, 90);

    const requirement: digitalInsureApi.DIRequirement = {
      insuredId: externalInsuredId,
      loanId: externalLoanId,
      premiumType: "CRD",
      coverages,
    };

    const request: digitalInsureApi.DITarificationRequest = {
      contractGrouping: "INITIAL",
      tarificationOptions: { calculateMode: "DEFAULT" },
      productCodes: ["MAESTRO", "AVENIRNAOASSUR", "IRIADE", "MNCAP"],
      insuranceType: "ADE",
      scenarioRecordDataModel: {
        contextType: "NEW",
        insureds: [insured],
        loans: [loan],
        requirements: [requirement],
      },
    };

    const result = await digitalInsureApi.getTarifs(request);

    if (result.success && result.data) {
      const tarifs = result.data.tarificationResponseModels || [];
      const validTarifs = tarifs.filter((t: any) =>
        t.responseStateModel?.businessState === "OK" && t.quoteRateResult
      );

      if (validTarifs.length > 0) {
        console.log(`\n✅ ${validTarifs.length} offre(s) trouvée(s):\n`);
        validTarifs.forEach((tarif: any) => {
          const premium = tarif.quoteRateResult?.primePeriodiqueDevis || 0;
          const totalCost = tarif.quoteRateResult?.primeGlobaleDevis || 0;
          const taea = tarif.quoteRateResult?.taeaDevis || 0;
          console.log(`   💰 ${tarif.productCode}: ${premium.toFixed(2)}€/mois | Total: ${totalCost.toFixed(2)}€ | TAEA: ${taea.toFixed(2)}%`);
        });

        // Meilleure offre
        const best = validTarifs.reduce((a: any, b: any) =>
          (a.quoteRateResult?.primePeriodiqueDevis || 999999) < (b.quoteRateResult?.primePeriodiqueDevis || 999999) ? a : b
        );
        console.log(`\n   🏆 Meilleure offre: ${best.productCode} à ${best.quoteRateResult?.primePeriodiqueDevis?.toFixed(2)}€/mois`);
      } else {
        console.log("\n⚠️ Aucune offre valide.");
        tarifs.forEach((tarif: any) => {
          if (tarif.responseStateModel?.businessState === "KO") {
            const errors = tarif.responseStateModel?.businessResponse?.businessErrors || [];
            errors.slice(0, 2).forEach((e: any) => {
              console.log(`   ❌ ${e.controlLabel || e.errorCode}`);
            });
          }
        });
      }
    } else {
      console.log(`\n❌ Erreur API: ${JSON.stringify(result.error)}`);
    }
  } catch (error: any) {
    console.log(`\n❌ Exception tarification: ${error.message}`);
  }
}

function mapProfessionalCategory(status: string): string {
  const statusLower = (status || "").toLowerCase();
  if (statusLower.includes("cadre")) return "CADRE_SAL";
  if (statusLower.includes("infirmi") || statusLower.includes("médic")) return "MEDICAL_PROF";
  if (statusLower.includes("chef") || statusLower.includes("entrepreneur") || statusLower.includes("dirigeant")) return "CHEF_ENTREPRISE";
  if (statusLower.includes("commer")) return "COMMERCANT";
  if (statusLower.includes("artisan")) return "ARTISAN";
  if (statusLower.includes("libéral")) return "PROF_LIB";
  if (statusLower.includes("retraité")) return "RETRAITE";
  if (statusLower.includes("fonctionnaire")) return "FONCTIONNAIRE_B_C";
  return "NON_CADRE_SAL_EMPLOYE";
}

function mapPropertyType(type: string): string {
  const typeLower = (type || "").toLowerCase();
  if (typeLower.includes("principal")) return "RESI_PRINCIPALE";
  if (typeLower.includes("secondaire")) return "RESI_SECONDAIRE";
  if (typeLower.includes("locatif") || typeLower.includes("invest")) return "INVEST_LOCATIF";
  return "RESI_PRINCIPALE";
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════════════════╗");
  console.log("║       TEST DIRECT DU CHATBOT MCP ASSURANCE - SIMULATIONS                     ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════════╝");

  try {
    await simulationJeunePrimoAccedant();
    await delay(2000);

    await simulationConversationNaturelle();
    await delay(2000);

    await simulationInvestisseur();

    console.log("\n" + "=".repeat(80));
    console.log("✅ TOUTES LES SIMULATIONS TERMINÉES");
    console.log("=".repeat(80));
  } catch (error: any) {
    console.error("❌ Erreur globale:", error.message);
  }
}

main();
