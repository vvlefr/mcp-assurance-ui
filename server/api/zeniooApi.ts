import axios from "axios";

/**
 * Module pour les appels API Zenioo (assureur partenaire)
 */

const ZENIOO_API_URL = "https://demosoizic.zenioo.com";
const ZENIOO_PARTNER_KEY = "TiTAndeMO2024";
const ZENIOO_PARTNER_CODE = "F92ApnKiUAqlXEAk1hp99LegD";
const ZENIOO_LOGIN_COURTIER = "henrycourtierstd@yopmail.com";
const ZENIOO_CODE_COURTIER = "AAOG";

interface ZeniooResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ZeniooDevisAutoParams {
  nom: string;
  prenom: string;
  date_naissance: string;
  code_postal: string;
  email: string;
  telephone?: string;
  immatriculation?: string;
  marque?: string;
  modele?: string;
}

interface ZeniooDevisHabitationParams {
  nom: string;
  prenom: string;
  date_naissance: string;
  code_postal: string;
  email: string;
  telephone?: string;
  type_logement: string; // "appartement" | "maison"
  surface?: number;
  nombre_pieces?: number;
}

/**
 * Obtenir un devis auto via Zenioo
 */
export async function getDevisAuto(params: ZeniooDevisAutoParams): Promise<ZeniooResponse<any>> {
  try {
    const response = await axios.post(
      `${ZENIOO_API_URL}/api/devis/auto`,
      {
        ...params,
        cle_partenaire: ZENIOO_PARTNER_KEY,
        code_partenaire: ZENIOO_PARTNER_CODE,
        login_courtier: ZENIOO_LOGIN_COURTIER,
        code_courtier: ZENIOO_CODE_COURTIER,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Erreur lors de la demande de devis auto:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Obtenir un devis habitation via Zenioo
 */
export async function getDevisHabitation(params: ZeniooDevisHabitationParams): Promise<ZeniooResponse<any>> {
  try {
    const response = await axios.post(
      `${ZENIOO_API_URL}/api/devis/habitation`,
      {
        ...params,
        cle_partenaire: ZENIOO_PARTNER_KEY,
        code_partenaire: ZENIOO_PARTNER_CODE,
        login_courtier: ZENIOO_LOGIN_COURTIER,
        code_courtier: ZENIOO_CODE_COURTIER,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Erreur lors de la demande de devis habitation:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Souscrire à une assurance via Zenioo
 */
export async function souscriptionAssurance(devisId: string, additionalData: any): Promise<ZeniooResponse<any>> {
  try {
    const response = await axios.post(
      `${ZENIOO_API_URL}/api/souscription`,
      {
        devis_id: devisId,
        ...additionalData,
        cle_partenaire: ZENIOO_PARTNER_KEY,
        code_partenaire: ZENIOO_PARTNER_CODE,
        login_courtier: ZENIOO_LOGIN_COURTIER,
        code_courtier: ZENIOO_CODE_COURTIER,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Erreur lors de la souscription:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Récupérer les contrats Zenioo
 */
export async function getContratsZenioo(): Promise<ZeniooResponse<any[]>> {
  try {
    const response = await axios.get(`${ZENIOO_API_URL}/api/contrats`, {
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        cle_partenaire: ZENIOO_PARTNER_KEY,
        code_partenaire: ZENIOO_PARTNER_CODE,
        login_courtier: ZENIOO_LOGIN_COURTIER,
        code_courtier: ZENIOO_CODE_COURTIER,
      },
    });

    return {
      success: true,
      data: response.data || [],
    };
  } catch (error: any) {
    console.error("Erreur lors de la récupération des contrats:", error.message);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}
