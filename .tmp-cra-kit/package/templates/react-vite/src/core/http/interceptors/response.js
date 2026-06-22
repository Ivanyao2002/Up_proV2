import axios from "axios";
import { store } from "../../store/store";
import { http } from "../axiosInstance";
import { clearCredentials, updateTokens } from "../../auth/authSlice";

let isRefreshing = false;
let refreshQueue = [];

// Fonction pour ajouter les requêtes à la file d'attente
const subscribeTokenRefresh = (cb) => {
  refreshQueue.push(cb);
};

// Fonction pour exécuter les requêtes en attente après le refresh
const onRefreshed = (token) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

const onRefreshFailed = (error) => {
  refreshQueue.forEach((cb) => cb(null, error));
  refreshQueue = [];
};

// Normalize Error
const normalizeError = (error) => {
  return {
    status: error.response?.status,
    message:
      error.response?.data?.message ||
      error.message ||
      "Une erreur est survenue",
    data: error.response?.data || null,
  };
};

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const originalRequest = config;

    const refresh = store.getState()?.auth?.refreshToken;

    // Vérifier si c'est une erreur 401 et qu'on n'a pas déjà essayé de refresh
    if (
      response &&
      response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("URL_REFRESH_TOKEN")
    ) {
      if (isRefreshing) {
        // Si un refresh est déjà en cours, on met la requête en attente dans une Promise
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token, err) => {
            if (err) return reject(err);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(http(originalRequest));
          });
        });
      }

      // Marquer la requête pour ne pas boucler à l'infini
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Appel à votre endpoint de refresh
        const { data } = await axios.post(`REFRESH_URL`, {
          refreshToken: refresh,
        });

        store.dispatch(updateTokens(data));

        // Relancer toutes les requêtes en attente avec le nouveau token
        onRefreshed(data?.data?.accessToken);
        isRefreshing = false;

        // Relancer la requête initiale
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${data?.data?.accessToken}`;
        return http(originalRequest);
      } catch (refreshError) {
        // Si le refresh échoue
        isRefreshing = false;
        onRefreshFailed(refreshError);
        store.dispatch(clearCredentials());
        throw normalizeError(refreshError);
      }
    }

    throw normalizeError(error);
  },
);
