import axios, { AxiosInstance } from "axios";

/**
 * Module pour les appels API Digital Insure (DI)
 * Documentation: https://catwww.accelerassur.fr
 */

const DI_BASE_URL = "https://catwww.accelerassur.fr/accelerassur-webservice/ws";
const DI_API_LOGIN = "DISTRIB.TITANASSURANCESRECETTE_EVI_API";
const DI_API_PASSWORD = "c07eb9629b514fb6bfc8ac9b64df2ece";

// Cache pour le token d'authentification
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Créer un client axios avec le token d'authentification
 */
async function getAuthenticatedClient(): Promise<AxiosInstance> {
  // Vérifier si le token est encore valide
  if (cachedToken && Date.now() < tokenExpiry) {
    return axios.create({
      baseURL: DI_BASE_URL,
      headers: {
        Authorization: `Bearer ${cachedToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  // Obtenir un nouveau token
  const tokenResponse = await axios.get(
    `${DI_BASE_URL}/security/oauth2/token`,
    {
      auth: {
        username: DI_API_LOGIN,
        password: DI_API_PASSWORD,
      },
    }
  );

  cachedToken = tokenResponse.data.access_token;
  // Le token expire généralement après 1 heure, on le cache pour 55 minutes
  tokenExpiry = Date.now() + 55 * 60 * 1000;

  return axios.create({
    baseURL: DI_BASE_URL,
    headers: {
      Authorization: `Bearer ${cachedToken}`,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Interface pour les données d'un assuré
 */
export interface DIInsured {
  externalInsuredId: string;
  numOrder: number;
  personDataModel: {
    gender: "MR" | "MME";
    firstname: string;
    lastname: string;
    dateOfBirth: string; // Format: YYYY-MM-DD
    email: string;
    mobilePhoneNumber?: string;
  };
  address: {
    adrAddressLine1: string;
    adrAddressLine2?: string;
    adrZipcode: string;
    adrCity: string;
    adrCountry: string;
  };
  countryOfResidence: string;
  cityOfBirth: string;
  professionalCategory: string; // Ex: "CADRE_SAL", "NON_CADRE_SAL"
  smoker: boolean;
  esmoker: boolean;
  esmokerNoNicotine: boolean;
  annualMilage?: string;
  workAtHeight?: string;
  manualWork: boolean;
  exactJob: string;
  socialRegime: string; // Ex: "SALARIE", "TNS"
  manualWorkRisk: boolean;
  workRisk: boolean;
  dangerousProduct: boolean;
  outStandings?: Array<{
    context: string;
    value: string;
  }>;
}

/**
 * Interface pour les données d'un prêt
 */
export interface DILoan {
  externalLoanId: string;
  numOrder: number;
  type: string; // Ex: "IMMO_AMORTISSABLE", "IMMO_IN_FINE"
  amount: number;
  duration: number; // en mois
  residualValue: number;
  rate: number;
  rateType: string; // Ex: "FIXE", "VARIABLE"
  deferredType: string; // Ex: "AUCUN"
  deferredDuration: number;
  effectiveDate: string; // Format: YYYY-MM-DD
  periodicityInsurance: string; // Ex: "MENSUELLE"
  periodicityRefund: string; // Ex: "MENSUELLE"
  purposeOfFinancing: string; // Ex: "CREDIT_CONSO", "ACHAT_RP"
  signingDate: string; // Format: YYYY-MM-DD
  bankRef?: {
    bankCode: string;
    agencyCode: string;
    sortCode: string;
  };
}

/**
 * Interface pour les garanties
 */
export interface DIRequirement {
  insuredId: string;
  loanId: string;
  premiumType: string; // Ex: "CRD" (Capital Restant Dû)
  coverages: Array<{
    code: string; // Ex: "DCPTIA", "IPT", "IPP", "ITT"
    type: "COVERAGE" | "OPTION";
    percentage?: number; // Quotité (ex: 50, 100)
    deductible?: number; // Franchise en jours (pour ITT)
  }>;
}

/**
 * Interface pour la requête de tarification
 */
export interface DITarificationRequest {
  contractGrouping: string; // Ex: "INITIAL"
  tarificationOptions: {
    calculateMode: string; // Ex: "DEFAULT"
  };
  productCodes: string[]; // Ex: ["MAESTRO", "AVENIRNAOASSUR", "IRIADE"]
  insuranceType: string; // Ex: "ADE" (Assurance de Prêt)
  scenarioRecordDataModel: {
    contextType: string; // Ex: "NEW"
    insureds: DIInsured[];
    loans: DILoan[];
    requirements: DIRequirement[];
  };
}

/**
 * Récupérer les produits disponibles pour un type d'assurance
 */
export async function getAvailableProducts(
  productType: "ADE" | "PREV"
): Promise<any> {
  try {
    const client = await getAuthenticatedClient();
    const response = await client.get(
      `/rest/v2/referentiel/getAvailableProducts/${productType}`
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error(
      "[Digital Insure] Erreur lors de la récupération des produits:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Récupérer une liste référentielle
 */
export async function getReferentielList(
  referentielCode: string,
  productCode?: string
): Promise<any> {
  try {
    const client = await getAuthenticatedClient();
    const params: any = { referentielCode };
    if (productCode) {
      params.productCode = productCode;
    }
    const response = await client.get(`/rest/v2/referentiel/getReferentielList`, {
      params,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error(
      "[Digital Insure] Erreur lors de la récupération de la liste référentielle:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Récupérer les champs obligatoires pour un produit
 */
export async function findSpecificProductDatas(
  productCode: string
): Promise<any> {
  try {
    const client = await getAuthenticatedClient();
    const response = await client.get(
      `/rest/v2/referentiel/findSpecificProductDatas/${productCode}`
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error(
      "[Digital Insure] Erreur lors de la récupération des champs obligatoires:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Obtenir des tarifs pour une assurance de prêt
 */
export async function getTarifs(
  request: DITarificationRequest
): Promise<any> {
  try {
    const client = await getAuthenticatedClient();
    const response = await client.post(
      `/rest/v2/ade/tarification/getTarifs`,
      request
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error(
      "[Digital Insure] Erreur lors de la tarification:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Créer un dossier
 */
export async function createBusinessRecord(
  externalRecordId: string,
  scenarioRecordDataModel: any
): Promise<any> {
  try {
    const client = await getAuthenticatedClient();
    const response = await client.post(
      `/rest/v2/ade/businessRecord/createBusinessRecord`,
      {
        externalRecordId,
        scenarioRecordDataModel,
      }
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error(
      "[Digital Insure] Erreur lors de la création du dossier:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Choisir un produit d'assurance
 */
export async function chooseInsurerProduct(
  compareRecordId: string,
  productCode: string,
  calculateMode: string = "DEFAULT"
): Promise<any> {
  try {
    const client = await getAuthenticatedClient();
    const response = await client.post(
      `/rest/v2/ade/tarification/chooseInsurerProduct/${compareRecordId}/${productCode}/${calculateMode}`
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error(
      "[Digital Insure] Erreur lors du choix du produit:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Compléter les données spécifiques d'un produit
 */
export async function completeSpecificProductData(
  compareRecordId: string,
  specificProductData: any
): Promise<any> {
  try {
    const client = await getAuthenticatedClient();
    const response = await client.post(
      `/rest/v2/ade/businessRecord/completeSpecificProductData/${compareRecordId}`,
      specificProductData
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error(
      "[Digital Insure] Erreur lors de la complétion du dossier:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Mettre en relation avec l'assureur
 */
export async function pushToInsurer(compareRecordId: string): Promise<any> {
  try {
    const client = await getAuthenticatedClient();
    const response = await client.post(
      `/rest/v2/ade/tarification/pushToInsurer`,
      {
        compareRecordId,
      }
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error(
      "[Digital Insure] Erreur lors de la mise en relation:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Obtenir l'URL SSO pour accéder à l'extranet de l'assureur
 */
export async function getBrokerInsurerAccess(
  compareRecordId: string
): Promise<any> {
  try {
    const client = await getAuthenticatedClient();
    const response = await client.get(
      `/rest/v2/ade/tarification/getBrokerInsurerAccess/${compareRecordId}`
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error(
      "[Digital Insure] Erreur lors de la récupération de l'accès assureur:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}
