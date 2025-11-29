/**
 * Script de test pour l'API Digital Insure avec des profils types
 */

import * as digitalInsureApi from "../api/digitalInsureApi";

// Profils types pour les tests
const PROFILS_TYPES = {
  // Profil 1: Jeune cadre célibataire
  jeuneCadre: {
    nom: "Dupont",
    prenom: "Jean",
    dateNaissance: "1990-05-15",
    email: "jean.dupont@email.com",
    telephone: "0612345678",
    codePostal: "75001",
    ville: "Paris",
    genre: "MR" as const,
    fumeur: false,
    categoriePro: "CADRE_SAL" as const,
    montantPret: 250000,
    dureePretMois: 240, // 20 ans
    tauxPret: 3.5,
    typeBien: "RESI_PRINCIPALE" as const,
    quotite: 100,
  },

  // Profil 2: Couple avec co-emprunteur
  coupleAvecCoEmprunteur: {
    // Emprunteur principal
    nom: "Martin",
    prenom: "Sophie",
    dateNaissance: "1985-03-20",
    email: "sophie.martin@email.com",
    telephone: "0698765432",
    codePostal: "69001",
    ville: "Lyon",
    genre: "MME" as const,
    fumeur: false,
    categoriePro: "PROF_LIB" as const,
    montantPret: 400000,
    dureePretMois: 300, // 25 ans
    tauxPret: 3.2,
    typeBien: "RESI_PRINCIPALE" as const,
    quotite: 50,
    // Co-emprunteur
    coEmprunteur: {
      nom: "Martin",
      prenom: "Pierre",
      dateNaissance: "1983-08-10",
      email: "pierre.martin@email.com",
      genre: "MR" as const,
      fumeur: true,
      categoriePro: "CADRE_SAL" as const,
      quotite: 50,
    },
  },

  // Profil 3: Senior proche retraite
  seniorPreRetraite: {
    nom: "Bernard",
    prenom: "Michel",
    dateNaissance: "1965-11-25",
    email: "michel.bernard@email.com",
    telephone: "0654321098",
    codePostal: "33000",
    ville: "Bordeaux",
    genre: "MR" as const,
    fumeur: true,
    categoriePro: "NON_CADRE_SAL_EMPLOYE" as const,
    montantPret: 150000,
    dureePretMois: 180, // 15 ans
    tauxPret: 4.0,
    typeBien: "RESI_SECONDAIRE" as const,
    quotite: 100,
  },

  // Profil 4: Investisseur locatif
  investisseurLocatif: {
    nom: "Lefebvre",
    prenom: "Claire",
    dateNaissance: "1978-07-08",
    email: "claire.lefebvre@email.com",
    telephone: "0687654321",
    codePostal: "44000",
    ville: "Nantes",
    genre: "MME" as const,
    fumeur: false,
    categoriePro: "COMMERCANT" as const,
    montantPret: 200000,
    dureePretMois: 240, // 20 ans
    tauxPret: 3.8,
    typeBien: "INVEST_LOCATIF" as const,
    quotite: 100,
  },
};

// Fonction pour construire une requête de tarification
function buildTarificationRequest(profil: typeof PROFILS_TYPES.jeuneCadre, premiumType: "CRD" | "CI" = "CRD") {
  const externalInsuredId = `TEST_INS_${Date.now()}`;
  const externalLoanId = `TEST_LOAN_${Date.now()}`;

  const effectiveDate = new Date();
  effectiveDate.setMonth(effectiveDate.getMonth() + 3);
  const effectiveDateStr = effectiveDate.toISOString().split("T")[0];
  const signingDate = new Date().toISOString().split("T")[0];

  const insured: digitalInsureApi.DIInsured = {
    externalInsuredId,
    numOrder: 1,
    personDataModel: {
      gender: profil.genre,
      firstname: profil.prenom,
      lastname: profil.nom,
      dateOfBirth: profil.dateNaissance,
      email: profil.email,
      mobilePhoneNumber: profil.telephone,
    },
    address: {
      adrAddressLine1: "1 rue de Test",
      adrAddressLine2: "",
      adrZipcode: profil.codePostal,
      adrCity: profil.ville,
      adrCountry: "FRANCE",
    },
    countryOfResidence: "FRANCE",
    cityOfBirth: profil.ville,
    professionalCategory: profil.categoriePro,
    smoker: profil.fumeur,
    esmoker: false,
    esmokerNoNicotine: false,
    annualMilage: "0",
    workAtHeight: "0",
    manualWork: false,
    exactJob: profil.categoriePro,
    socialRegime: "SALARIE",
    manualWorkRisk: false,
    workRisk: false,
    dangerousProduct: false,
    outStandings: [],
  };

  const loan: digitalInsureApi.DILoan = {
    externalLoanId,
    numOrder: 1,
    type: "IMMO_AMORTISSABLE",
    amount: profil.montantPret,
    duration: profil.dureePretMois,
    residualValue: 0,
    rate: profil.tauxPret,
    rateType: "FIXE",
    deferredType: "AUCUN",
    deferredDuration: 0,
    effectiveDate: effectiveDateStr,
    periodicityInsurance: "MENSUELLE",
    periodicityRefund: "MENSUELLE",
    purposeOfFinancing: profil.typeBien,
    signingDate,
  };

  const requirement: digitalInsureApi.DIRequirement = {
    insuredId: externalInsuredId,
    loanId: externalLoanId,
    premiumType,
    coverages: [
      { code: "DCPTIA", type: "COVERAGE" as const, percentage: profil.quotite },
      { code: "IPT", type: "COVERAGE" as const, percentage: profil.quotite },
      { code: "IPP", type: "COVERAGE" as const, percentage: profil.quotite },
      { code: "ITT", type: "COVERAGE" as const, percentage: profil.quotite, deductible: 90 },
    ],
  };

  return {
    contractGrouping: "INITIAL" as const,
    tarificationOptions: {
      calculateMode: "DEFAULT" as const,
    },
    productCodes: ["MAESTRO", "AVENIRNAOASSUR", "IRIADE", "MNCAP"],
    insuranceType: "ADE" as const,
    scenarioRecordDataModel: {
      contextType: "NEW" as const,
      insureds: [insured],
      loans: [loan],
      requirements: [requirement],
    },
  };
}

// Fonction principale de test
async function runTests() {
  console.log("=".repeat(80));
  console.log("TEST API DIGITAL INSURE - PROFILS TYPES");
  console.log("=".repeat(80));
  console.log("");

  const results: any[] = [];

  // Test 1: Jeune cadre
  console.log("📋 Test 1: Jeune cadre célibataire (30 ans, non-fumeur, 250k€ sur 20 ans)");
  console.log("-".repeat(60));
  try {
    const request = buildTarificationRequest(PROFILS_TYPES.jeuneCadre, "CRD");
    const result = await digitalInsureApi.getTarifs(request);

    if (result.success && result.data) {
      const tarifs = result.data.tarificationResponseModels || [];
      console.log(`✅ Succès: ${tarifs.length} produit(s) retourné(s)`);

      // Afficher les erreurs business si présentes
      tarifs.forEach((tarif: any) => {
        if (tarif.responseStateModel?.businessState === "KO") {
          const errors = tarif.responseStateModel?.businessResponse?.businessErrors || [];
          console.log(`   ⚠️ ${tarif.productCode}: ${errors.map((e: any) => e.controlLabel || e.errorCode).join(", ")}`);
        } else if (tarif.responseStateModel?.businessState === "OK" && tarif.quoteRateResult) {
          const premium = tarif.quoteRateResult?.primePeriodiqueDevis || 0;
          const totalCost = tarif.quoteRateResult?.primeGlobaleDevis || 0;
          const taea = tarif.quoteRateResult?.taeaDevis || 0;
          console.log(`   ✓ ${tarif.productCode}: ${premium.toFixed(2)}€/mois, Total: ${totalCost.toFixed(2)}€, TAEA: ${taea.toFixed(2)}%`);
        } else {
          console.log(`   ? ${tarif.productCode}: état inconnu - ${JSON.stringify(tarif.responseStateModel || {}).substring(0, 200)}`);
        }
      });

      const validTarifs = tarifs.filter((t: any) => t.responseStateModel?.businessState === "OK" && t.quoteRateResult);
      results.push({ profil: "Jeune cadre", success: true, count: validTarifs.length, tarifs: validTarifs });
    } else {
      console.log(`❌ Erreur: ${JSON.stringify(result.error)}`);
      results.push({ profil: "Jeune cadre", success: false, error: result.error });
    }
  } catch (error: any) {
    console.log(`❌ Exception: ${error.message}`);
    results.push({ profil: "Jeune cadre", success: false, error: error.message });
  }
  console.log("");

  // Test 2: Senior fumeur
  console.log("📋 Test 2: Senior pré-retraite (59 ans, fumeur, 150k€ sur 15 ans)");
  console.log("-".repeat(60));
  try {
    const request = buildTarificationRequest(PROFILS_TYPES.seniorPreRetraite, "CI");
    const result = await digitalInsureApi.getTarifs(request);

    if (result.success && result.data) {
      const tarifs = result.data.tarificationResponseModels || [];
      console.log(`✅ Succès: ${tarifs.length} produit(s) retourné(s)`);

      tarifs.forEach((tarif: any) => {
        if (tarif.responseStateModel?.businessState === "OK" && tarif.quoteRateResult) {
          const premium = tarif.quoteRateResult?.primePeriodiqueDevis || 0;
          const totalCost = tarif.quoteRateResult?.primeGlobaleDevis || 0;
          const taea = tarif.quoteRateResult?.taeaDevis || 0;
          console.log(`   ✓ ${tarif.productCode}: ${premium.toFixed(2)}€/mois, Total: ${totalCost.toFixed(2)}€, TAEA: ${taea.toFixed(2)}%`);
        } else if (tarif.responseStateModel?.businessState === "KO") {
          const errors = tarif.responseStateModel?.businessResponse?.businessErrors || [];
          console.log(`   ⚠️ ${tarif.productCode}: ${errors.map((e: any) => e.controlLabel || e.errorCode).join(", ")}`);
        }
      });

      const validTarifs = tarifs.filter((t: any) => t.responseStateModel?.businessState === "OK" && t.quoteRateResult);
      results.push({ profil: "Senior fumeur", success: true, count: validTarifs.length, tarifs: validTarifs });
    } else {
      console.log(`❌ Erreur: ${JSON.stringify(result.error)}`);
      results.push({ profil: "Senior fumeur", success: false, error: result.error });
    }
  } catch (error: any) {
    console.log(`❌ Exception: ${error.message}`);
    results.push({ profil: "Senior fumeur", success: false, error: error.message });
  }
  console.log("");

  // Test 3: Investisseur locatif
  console.log("📋 Test 3: Investisseur locatif (46 ans, commerçant, 200k€ sur 20 ans)");
  console.log("-".repeat(60));
  try {
    const request = buildTarificationRequest(PROFILS_TYPES.investisseurLocatif, "CRD");
    const result = await digitalInsureApi.getTarifs(request);

    if (result.success && result.data) {
      const tarifs = result.data.tarificationResponseModels || [];
      console.log(`✅ Succès: ${tarifs.length} produit(s) retourné(s)`);

      tarifs.forEach((tarif: any) => {
        if (tarif.responseStateModel?.businessState === "OK" && tarif.quoteRateResult) {
          const premium = tarif.quoteRateResult?.primePeriodiqueDevis || 0;
          const totalCost = tarif.quoteRateResult?.primeGlobaleDevis || 0;
          const taea = tarif.quoteRateResult?.taeaDevis || 0;
          console.log(`   ✓ ${tarif.productCode}: ${premium.toFixed(2)}€/mois, Total: ${totalCost.toFixed(2)}€, TAEA: ${taea.toFixed(2)}%`);
        } else if (tarif.responseStateModel?.businessState === "KO") {
          const errors = tarif.responseStateModel?.businessResponse?.businessErrors || [];
          console.log(`   ⚠️ ${tarif.productCode}: ${errors.map((e: any) => e.controlLabel || e.errorCode).join(", ")}`);
        }
      });

      const validTarifs = tarifs.filter((t: any) => t.responseStateModel?.businessState === "OK" && t.quoteRateResult);
      results.push({ profil: "Investisseur locatif", success: true, count: validTarifs.length, tarifs: validTarifs });
    } else {
      console.log(`❌ Erreur: ${JSON.stringify(result.error)}`);
      results.push({ profil: "Investisseur locatif", success: false, error: result.error });
    }
  } catch (error: any) {
    console.log(`❌ Exception: ${error.message}`);
    results.push({ profil: "Investisseur locatif", success: false, error: error.message });
  }
  console.log("");

  // Résumé
  console.log("=".repeat(80));
  console.log("RÉSUMÉ DES TESTS");
  console.log("=".repeat(80));

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`✅ Réussis: ${successCount}`);
  console.log(`❌ Échoués: ${failCount}`);
  console.log("");

  results.forEach(r => {
    if (r.success) {
      console.log(`✅ ${r.profil}: ${r.count} offre(s)`);
    } else {
      console.log(`❌ ${r.profil}: ${r.error}`);
    }
  });

  return results;
}

// Exporter pour utilisation
export { runTests, PROFILS_TYPES, buildTarificationRequest };

// Exécution directe
runTests()
  .then(() => {
    console.log("\n✅ Tests terminés");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur fatale:", error);
    process.exit(1);
  });
