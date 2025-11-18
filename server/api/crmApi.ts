import axios from "axios";

/**
 * Module pour les appels API CRM Supabase
 */

const CRM_API_URL = "https://vcqpurrypnpebiygjypg.supabase.co/functions/v1/crm-mcp";
const CRM_API_KEY = "crm_08179287b7c6dff378587224344d64606052cf762e5d87353a979470b3b90c69";

interface CRMClient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  postal_code?: string;
  professional_category?: string;
  created_at: string;
  updated_at: string;
}

interface CRMResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

/**
 * Récupérer tous les clients du CRM
 */
export async function getAllClients(): Promise<CRMResponse<CRMClient[]>> {
  try {
    const response = await axios.get(`${CRM_API_URL}/clients`, {
      headers: {
        "x-api-key": CRM_API_KEY,
      },
    });

    return {
      success: true,
      data: response.data.data || [],
    };
  } catch (error: any) {
    console.error("Erreur lors de la récupération des clients:", error.message);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}

/**
 * Rechercher un client par nom
 */
export async function searchClientByName(name: string): Promise<CRMResponse<CRMClient[]>> {
  try {
    const allClients = await getAllClients();
    
    if (!allClients.success) {
      return allClients;
    }

    // Normaliser le nom de recherche
    const searchName = name.toLowerCase().trim();
    
    // Filtrer les clients dont le nom complet correspond
    const matchingClients = allClients.data.filter((client) => {
      const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
      return fullName.includes(searchName) || searchName.includes(fullName);
    });

    return {
      success: true,
      data: matchingClients,
    };
  } catch (error: any) {
    console.error("Erreur lors de la recherche client:", error.message);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}

/**
 * Récupérer les détails d'un client par ID
 */
export async function getClientById(clientId: string): Promise<CRMResponse<CRMClient | null>> {
  try {
    const response = await axios.get(`${CRM_API_URL}/clients/${clientId}`, {
      headers: {
        "x-api-key": CRM_API_KEY,
      },
    });

    return {
      success: true,
      data: response.data.data || null,
    };
  } catch (error: any) {
    console.error("Erreur lors de la récupération du client:", error.message);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

/**
 * Créer un nouveau client dans le CRM
 */
export async function createClient(clientData: Partial<CRMClient>): Promise<CRMResponse<CRMClient | null>> {
  try {
    const response = await axios.post(`${CRM_API_URL}/clients`, clientData, {
      headers: {
        "x-api-key": CRM_API_KEY,
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      data: response.data.data || null,
    };
  } catch (error: any) {
    console.error("Erreur lors de la création du client:", error.message);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

/**
 * Récupérer tous les contrats du CRM
 */
export async function getAllContracts(): Promise<CRMResponse<any[]>> {
  try {
    const response = await axios.get(`${CRM_API_URL}/contracts`, {
      headers: {
        "x-api-key": CRM_API_KEY,
      },
    });

    return {
      success: true,
      data: response.data.data || [],
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

/**
 * Récupérer tous les devis du CRM
 */
export async function getAllQuotes(): Promise<CRMResponse<any[]>> {
  try {
    const response = await axios.get(`${CRM_API_URL}/quotes`, {
      headers: {
        "x-api-key": CRM_API_KEY,
      },
    });

    return {
      success: true,
      data: response.data.data || [],
    };
  } catch (error: any) {
    console.error("Erreur lors de la récupération des devis:", error.message);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}
