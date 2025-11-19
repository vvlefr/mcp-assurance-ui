// Utiliser fetch natif de Node.js 18+

// Configuration API Digital Insure
const DI_BASE_URL = "https://catwww.accelerassur.fr/accelerassur-webservice/ws";
const DI_API_LOGIN = "DISTRIB.TITANASSURANCESRECETTE_EVI_API";
const DI_API_PASSWORD = "c07eb9629b514fb6bfc8ac9b64df2ece";

// Fonction pour obtenir un token
async function getToken() {
  const response = await fetch(`${DI_BASE_URL}/security/oauth2/token`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${DI_API_LOGIN}:${DI_API_PASSWORD}`).toString('base64')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Erreur d'authentification: ${response.status}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

// Données de Guillaume Bidoux
const externalInsuredId = `INS_TEST_${Date.now()}`;
const externalLoanId = `LOAN_TEST_${Date.now()}`;

// Date d'effet (3 mois dans le futur)
const effectiveDate = new Date();
effectiveDate.setMonth(effectiveDate.getMonth() + 3);
const effectiveDateStr = effectiveDate.toISOString().split("T")[0];

// Préparer la requête
const tarificationRequest = {
  contractGrouping: "INITIAL",
  tarificationOptions: {
    calculateMode: "DEFAULT",
  },
  productCodes: ["MAESTRO", "AVENIRNAOASSUR", "IRIADE", "MNCAP", "IPTIQ"],
  insuranceType: "ADE",
  scenarioRecordDataModel: {
    contextType: "NEW",
    insureds: [
      {
        externalInsuredId,
        numOrder: 1,
        personDataModel: {
          gender: "MR",
          firstname: "Guillaume",
          lastname: "BIDOUX",
          dateOfBirth: "1973-06-27",
          email: "gbidoux@orange.fr",
          mobilePhoneNumber: "0600000000",
        },
        address: {
          adrAddressLine1: "1 rue de la Paix",
          adrAddressLine2: "",
          adrZipcode: "75013",
          adrCity: "Paris",
          adrCountry: "FRANCE",
        },
        countryOfResidence: "FRANCE",
        cityOfBirth: "Paris",
        professionalCategory: "NON_CADRE_SAL_EMPLOYE",
        smoker: false,
        esmoker: false,
        esmokerNoNicotine: false,
        annualMilage: "0",
        workAtHeight: "0",
        manualWork: false,
        exactJob: "SALARIE",
        socialRegime: "SALARIE",
        manualWorkRisk: false,
        workRisk: false,
        dangerousProduct: false,
        outStandings: [],
      },
    ],
    loans: [
      {
        externalLoanId,
        numOrder: 1,
        type: "IMMO_AMORTISSABLE",
        amount: 300000,
        duration: 300, // 25 ans
        residualValue: 0,
        rate: 4.0,
        rateType: "FIXE",
        deferredType: "AUCUN",
        deferredDuration: 0,
        effectiveDate: effectiveDateStr,
        periodicityInsurance: "MENSUELLE",
        periodicityRefund: "MENSUELLE",
        purposeOfFinancing: "RESI_PRINCIPALE",
        signingDate: "2024-11-25",
      },
    ],
    requirements: [
      {
        insuredId: externalInsuredId,
        loanId: externalLoanId,
        premiumType: "CRD",
        coverages: [
          {
            code: "DCPTIA",
            type: "COVERAGE",
            percentage: 100,
          },
          {
            code: "IPT",
            type: "COVERAGE",
            percentage: 100,
          },
          {
            code: "IPP",
            type: "COVERAGE",
            percentage: 100,
          },
          {
            code: "ITT",
            type: "COVERAGE",
            percentage: 100,
            deductible: 90,
          },
        ],
      },
    ],
  },
};
console.log("\n🔐 Authentification...\n");

try {
  const token = await getToken();
  console.log("✅ Token obtenu:", token.substring(0, 20) + "...");
  
  console.log("\n📤 Envoi de la requête à Digital Insure...\n");
  console.log("Requête:", JSON.stringify(tarificationRequest, null, 2));
  
  const response = await fetch(`${DI_BASE_URL}/rest/v2/ade/tarification/getTarifs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(tarificationRequest),
  });
  console.log("\n📥 Réponse de Digital Insure:\n");
  console.log("Status:", response.status);
  
  const responseText = await response.text();
  console.log("Réponse brute:", responseText.substring(0, 500));
  
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error("❌ Erreur: La réponse n'est pas du JSON valide");
    console.error("Réponse complète:", responseText);
    process.exit(1);
  }
  console.log("Réponse complète:", JSON.stringify(data, null, 2));

  if (data.tarificationResponseModels) {
    console.log("\n📊 Analyse des tarifs:\n");
    data.tarificationResponseModels.forEach((tarif, index) => {
      console.log(`\n--- Tarif ${index + 1}: ${tarif.productLabel || tarif.productCode} ---`);
      console.log("État:", tarif.responseStateModel?.businessState);
      
      if (tarif.responseStateModel?.businessState === "KO") {
        console.log("❌ ERREURS:");
        const errors = tarif.responseStateModel?.businessResponse?.businessErrors || [];
        errors.forEach((err) => {
          console.log(`  - ${err.controlLabel || err.errorCode}: ${err.errorMessage || "Pas de message"}`);
        });
      } else if (tarif.quoteRateResult) {
        console.log("✅ Tarif disponible:");
        console.log(`  - Cotisation mensuelle: ${tarif.quoteRateResult.primePeriodiqueDevis}€`);
        console.log(`  - Coût total: ${tarif.quoteRateResult.primeGlobaleDevis}€`);
        console.log(`  - TAEA: ${(tarif.quoteRateResult.taeaDevis * 100).toFixed(2)}%`);
      }
    });
  }
} catch (error) {
  console.error("\n❌ Erreur lors de l'appel API:", error.message);
  console.error(error);
}
