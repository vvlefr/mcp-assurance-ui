import axios from 'axios';

const DI_BASE_URL = 'https://catwww.accelerassur.fr/accelerassur-webservice/ws';
const DI_USERNAME = 'DISTRIB.TITANASSURANCESRECETTE_EVI_API';
const DI_PASSWORD = 'c07eb9629b514fb6bfc8ac9b64df2ece';

async function testAuthentication() {
  console.log('🔐 Test d\'authentification Digital Insure...\n');
  
  try {
    // Étape 1: Authentification OAuth2
    console.log('Étape 1: Authentification OAuth2');
    const authResponse = await axios.get(
      `${DI_BASE_URL}/security/oauth2/token`,
      {
        auth: {
          username: DI_USERNAME,
          password: DI_PASSWORD,
        },
      }
    );

    const accessToken = authResponse.data.access_token;
    console.log('✅ Authentification réussie !');
    console.log(`Token: ${accessToken.substring(0, 20)}...`);
    console.log(`Expire dans: ${authResponse.data.expires_in} secondes\n`);

    // Étape 2: Récupérer les produits disponibles
    console.log('Étape 2: Récupération des produits disponibles');
    const productsResponse = await axios.get(
      `${DI_BASE_URL}/rest/v2/referentiel/getAvailableProducts/ADE`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log('✅ Produits disponibles:');
    console.log(JSON.stringify(productsResponse.data, null, 2));
    console.log('\n');

    // Étape 3: Test de tarification avec données minimales
    console.log('Étape 3: Test de tarification');
    const tarificationRequest = {
      contractGrouping: 'INITIAL',
      tarificationOptions: {
        calculateMode: 'DEFAULT',
      },
      productCodes: ['MAESTRO', 'AVENIRNAOASSUR', 'IRIADE', 'MNCAP', 'IPTIQ'],
      insuranceType: 'ADE',
      scenarioRecordDataModel: {
        contextType: 'NEW',
        insureds: [
          {
            externalInsuredId: 'INS_TEST_001',
            numOrder: 1,
            personDataModel: {
              gender: 'MR',
              firstname: 'Guillaume',
              lastname: 'Bidoux',
              dateOfBirth: '1973-06-28',
              email: 'gbidoux@orange.fr',
              mobilePhoneNumber: '0600000000',
            },
            address: {
              adrAddressLine1: '10 RUE CAILLAUX',
              adrAddressLine2: '',
              adrZipcode: '75013',
              adrCity: 'PARIS',
              adrCountry: 'FRANCE',
            },
            countryOfResidence: 'FRANCE',
            cityOfBirth: 'PARIS',
            professionalCategory: 'NON_CADRE_SAL_EMPLOYE',
            smoker: false,
            esmoker: false,
            esmokerNoNicotine: false,
            annualMilage: '0',
            workAtHeight: '0',
            manualWork: false,
            exactJob: 'SALARIE',
            socialRegime: 'SALARIE',
            manualWorkRisk: false,
            workRisk: false,
            dangerousProduct: false,
            outStandings: [],
          },
        ],
        loans: [
          {
            externalLoanId: 'LOAN_TEST_001',
            numOrder: 1,
            type: 'IMMO_AMORTISSABLE',
            amount: 300000,
            duration: 300,
            residualValue: 0,
            rate: 2.5,
            rateType: 'FIXE',
            deferredType: 'AUCUN',
            deferredDuration: 0,
            effectiveDate: '2026-02-01',
            periodicityInsurance: 'MENSUELLE',
            periodicityRefund: 'MENSUELLE',
            purposeOfFinancing: 'RESI_PRINCIPALE',
            signingDate: '2025-11-25',
          },
        ],
        requirements: [
          {
            insuredId: 'INS_TEST_001',
            loanId: 'LOAN_TEST_001',
            premiumType: 'CRD',
            coverages: [
              {
                code: 'DCPTIA',
                type: 'COVERAGE',
                percentage: 100,
              },
              {
                code: 'IPT',
                type: 'COVERAGE',
                percentage: 100,
              },
              {
                code: 'IPP',
                type: 'COVERAGE',
                percentage: 100,
              },
              {
                code: 'ITT',
                type: 'COVERAGE',
                percentage: 100,
                deductible: 90,
              },
            ],
          },
        ],
      },
    };

    const tarificationResponse = await axios.post(
      `${DI_BASE_URL}/rest/v2/ade/tarification/getTarifs`,
      tarificationRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Tarification réussie !');
    console.log(JSON.stringify(tarificationResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testAuthentication();
