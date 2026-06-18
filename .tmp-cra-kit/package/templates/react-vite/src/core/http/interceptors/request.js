import { store } from "../../store/store";
import { http } from "../axiosInstance";

// Intercepteur des requêtes
http.interceptors.request.use(
  (config) => {
    //récupération du token et injection dans l'entête de la requête
    const token = store.getState()?.auth?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
