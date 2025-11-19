import axios from 'axios';

/**
 * Test du comparateur intelligent Digital Insure
 * Ce script teste l'appel simultané avec CRD et FIXE et la sélection des meilleures offres
 */

const DI_BASE_URL = "https://catwww.accelerassur.fr/accelerassur-webservice/ws";
const DI_API_LOGIN = "DISTRIB.TITANASSURANCESRECETTE_EVI_API";
const DI_API_PASSWORD = "c07eb9629b514fb6bfc8ac9b64df2ece";

// Fonction pour obtenir un token d'authentification
async function authenticate() {
    const response = await axios.get(`${DI_BASE_URL}/security/oauth2/token`, {
        auth: {
            username: DI_API_LOGIN,
            password: DI_API_PASSWORD,
        },
    });
    return response.data.access_token;
}

// Fonction pour obtenir les tarifs avec un type de cotisation spécifique
async function getTarifs(token, premiumType) {
    const effectiveDate = new Date();
    effectiveDate.setMonth(effectiveDate.getMonth() + 3);
    const effectiveDateStr = effectiveDate.toISOString().split("T")[0];

    const request = {
        contractGrouping: "INITIAL",
        tarificationOptions: {
            calculateMode: "DEFAULT",
        },
        productCodes: ["MAESTRO", "AVENIRNAOASSUR", "IRIADE", "MNCAP", "NAOASSUR"],
        insuranceType: "ADE",
        scenarioRecordDataModel: {
            contextType: "NEW",
            insureds: [
                {
                    externalInsuredId: "INS_TEST_001",
                    numOrder: 1,
                    personDataModel: {
                        gender: "MR",
                        firstname: "Guillaume",
                        lastname: "Bidoux",
                        dateOfBirth: "1973-06-28",
                        email: "gbidoux@orange.fr",
                        mobilePhoneNumber: "0600000000",
                    },
                    address: {
                        adrAddressLine1: "10 RUE CAILLAUX",
                        adrAddressLine2: "",
                        adrZipcode: "75013",
                        adrCity: "PARIS",
                        adrCountry: "FRANCE",
                    },
                    countryOfResidence: "FRANCE",
                    cityOfBirth: "PARIS",
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
                    externalLoanId: "LOAN_TEST_001",
                    numOrder: 1,
                    type: "IMMO_AMORTISSABLE",
                    amount: 300000,
                    duration: 300,
                    residualValue: 0,
                    rate: 2.5,
                    rateType: "FIXE",
                    deferredType: "AUCUN",
                    deferredDuration: 0,
                    effectiveDate: effectiveDateStr,
                    periodicityInsurance: "MENSUELLE",
                    periodicityRefund: "MENSUELLE",
                    purposeOfFinancing: "RESI_PRINCIPALE",
                    signingDate: "2025-11-25",
                },
            ],
            requirements: [
                {
                    insuredId: "INS_TEST_001",
                    loanId: "LOAN_TEST_001",
                    premiumType: premiumType,
                    coverages: [
                        {
                            code: "DCPTIA",
                            type: "COVERAGE",
                            deductible: 0,
                            percentage: 100,
                        },
                        {
                            code: "IPT",
                            type: "COVERAGE",
                            deductible: 0,
                            percentage: 100,
                        },
                        {
                            code: "IPP",
                            type: "COVERAGE",
                            deductible: 0,
                            percentage: 100,
                        },
                        {
                            code: "ITT",
                            type: "COVERAGE",
                            deductible: 90,
                            percentage: 100,
                        },
                    ],
                },
            ],
        },
    };

    const response = await axios.post(
        `${DI_BASE_URL}/rest/v2/ade/tarification/getTarifs`,
        request,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
}

// Fonction principale de test
async function testComparateur() {
    console.log("🧪 Test du comparateur intelligent Digital Insure\n");

    try {
        // Étape 1: Authentification
        console.log("Étape 1: Authentification...");
        const token = await authenticate();
        console.log("✅ Authentification réussie\n");

        // Étape 2: Appel simultané avec CRD et FIXE
        console.log("Étape 2: Appel simultané avec CRD et FIXE...");
        const [crdResult, fixeResult] = await Promise.all([
            getTarifs(token, "CRD"),
            getTarifs(token, "FIXE"),
        ]);
        console.log("✅ Appels simultanés réussis\n");

        // Étape 3: Collecter toutes les offres
        console.log("Étape 3: Collecte des offres...");
        const allOffers = [];

        // Collecter les offres CRD
        if (crdResult.tarificationResponseModels) {
            crdResult.tarificationResponseModels.forEach((tarif) => {
                if (tarif.responseStateModel?.businessState === "OK" && tarif.quoteRateResult) {
                    allOffers.push({
                        productCode: tarif.productCode,
                        productLabel: tarif.productLabel,
                        premiumType: "CRD",
                        monthlyPremium: tarif.quoteRateResult.primePeriodiqueDevis,
                        totalCost: tarif.quoteRateResult.primeGlobaleDevis,
                        taea: tarif.quoteRateResult.taeaDevis,
                    });
                }
            });
        }

        // Collecter les offres FIXE
        if (fixeResult.tarificationResponseModels) {
            fixeResult.tarificationResponseModels.forEach((tarif) => {
                if (tarif.responseStateModel?.businessState === "OK" && tarif.quoteRateResult) {
                    allOffers.push({
                        productCode: tarif.productCode,
                        productLabel: tarif.productLabel,
                        premiumType: "FIXE",
                        monthlyPremium: tarif.quoteRateResult.primePeriodiqueDevis,
                        totalCost: tarif.quoteRateResult.primeGlobaleDevis,
                        taea: tarif.quoteRateResult.taeaDevis,
                    });
                }
            });
        }

        console.log(`✅ ${allOffers.length} offres collectées\n`);

        // Étape 4: Sélection des meilleures offres
        console.log("Étape 4: Sélection des meilleures offres...");
        const crdOffers = allOffers.filter((o) => o.premiumType === "CRD");
        const fixeOffers = allOffers.filter((o) => o.premiumType === "FIXE");

        const bestCRD = crdOffers.length > 0
            ? crdOffers.reduce((best, current) =>
                current.totalCost < best.totalCost ? current : best
            )
            : null;

        const bestFIXE = fixeOffers.length > 0
            ? fixeOffers.reduce((best, current) =>
                current.totalCost < best.totalCost ? current : best
            )
            : null;

        console.log("✅ Meilleures offres sélectionnées\n");

        // Étape 5: Affichage des résultats
        console.log("=" .repeat(80));
        console.log("🎯 COMPARATEUR INTELLIGENT - RÉSULTATS");
        console.log("=".repeat(80));

        if (bestCRD) {
            console.log("\n📊 OPTION 1 : COTISATION DÉGRESSIVE (CRD)");
            console.log(`   Produit: ${bestCRD.productLabel || bestCRD.productCode}`);
            console.log(`   Cotisation mensuelle initiale: ${bestCRD.monthlyPremium.toFixed(2)}€`);
            console.log(`   Coût total de l'assurance: ${bestCRD.totalCost.toFixed(2)}€`);
            console.log(`   TAEA: ${(bestCRD.taea * 100).toFixed(2)}%`);
            console.log(`   Type: La cotisation diminue au fil du temps avec le capital restant dû`);
        }

        if (bestFIXE) {
            console.log("\n📊 OPTION 2 : COTISATION CONSTANTE (FIXE)");
            console.log(`   Produit: ${bestFIXE.productLabel || bestFIXE.productCode}`);
            console.log(`   Cotisation mensuelle: ${bestFIXE.monthlyPremium.toFixed(2)}€`);
            console.log(`   Coût total de l'assurance: ${bestFIXE.totalCost.toFixed(2)}€`);
            console.log(`   TAEA: ${(bestFIXE.taea * 100).toFixed(2)}%`);
            console.log(`   Type: La cotisation reste identique pendant toute la durée du prêt`);
        }

        console.log("\n" + "=".repeat(80));

        // Étape 6: Statistiques
        console.log("\n📈 STATISTIQUES");
        console.log(`   Total des offres reçues: ${allOffers.length}`);
        console.log(`   Offres CRD: ${crdOffers.length}`);
        console.log(`   Offres FIXE: ${fixeOffers.length}`);
        
        if (bestCRD && bestFIXE) {
            const savings = bestCRD.totalCost - bestFIXE.totalCost;
            if (savings > 0) {
                console.log(`   💰 Économie avec l'option FIXE: ${savings.toFixed(2)}€`);
            } else {
                console.log(`   💰 Économie avec l'option CRD: ${Math.abs(savings).toFixed(2)}€`);
            }
        }

        console.log("\n✅ Test du comparateur intelligent réussi !");

    } catch (error) {
        console.error("❌ Erreur lors du test:", error.message);
        if (error.response) {
            console.error("Détails de l'erreur:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Exécuter le test
testComparateur();
