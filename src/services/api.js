/**
 * Configuração da API para Vite + React
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * Função genérica para requisições HTTP
 */
export async function apiCall(
  endpoint,
  method = "GET",
  data = null,
  headers = {},
) {
  const url = `${API_CONFIG.baseURL}${endpoint}`;

  const config = {
    method,
    headers: {
      ...API_CONFIG.headers,
      ...headers,
    },
  };

  // 🔐 Token de autenticação
  const token = localStorage.getItem("rusticerrado_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  // 📦 Enviar dados (body)
  if (data && ["POST", "PUT", "PATCH"].includes(method)) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);

    // ❌ Se der erro
    if (!response.ok) {
      let errorMessage = `Erro ${response.status}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Se não for JSON
      }

      throw new Error(errorMessage);
    }

    // ✅ Se for JSON
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return response;
  } catch (error) {
    console.error(`Erro na requisição ${method} ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Métodos prontos (atalhos)
 */
export const api = {
  get: (endpoint, headers) => apiCall(endpoint, "GET", null, headers),
  post: (endpoint, data, headers) => apiCall(endpoint, "POST", data, headers),
  put: (endpoint, data, headers) => apiCall(endpoint, "PUT", data, headers),
  patch: (endpoint, data, headers) => apiCall(endpoint, "PATCH", data, headers),
  delete: (endpoint, headers) => apiCall(endpoint, "DELETE", null, headers),
};

export default api;
