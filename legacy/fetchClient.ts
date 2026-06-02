import { store } from '../store/store';
import { notificationService } from './notificationService';
import { AppError, NetworkError, AuthError } from './errorHandler';
import { setError } from '../(auth)/login/_state/authSlice';

let isFetchingAppToken = false;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL+'/api/v1';

// Get app token
const getAppToken = async () => {
  if (isFetchingAppToken) {
    console.log('App token is already being fetched. Waiting...');
    return null;
  }

//   try {
//     isFetchingAppToken = true;
//     console.log('Fetching app token...');
    
//     const response = await fetch(`${API_BASE_URL}/auth/apps-credentials`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       // body: JSON.stringify({
//       //   clientId: process.env.NEXT_PUBLIC_API_CLIENT_ID,
//       //   clientSecret: process.env.NEXT_PUBLIC_API_CLIENT_SECRET,
//       // }),
//     });

//     if (!response.ok) {
//       throw new AppError(`Erreur lors de la récupération du token: ${response.statusText}`, 'TOKEN_ERROR', response.status);
//     }

//     const data = await response.json();
    
//     console.log('App Credentials Response:', {
//       status: response.status,
//       headers: Object.fromEntries(response.headers.entries()),
//       data: data,
//       token: data.token
//     });

//     const appToken = data.token;
//     localStorage.setItem('appToken', appToken);
//     console.log('App token fetched successfully');
//     return appToken;
//   } catch (error: any) {
//     console.error('Failed to get app token:', error);
    
//     if (error instanceof AppError) {
//       throw error;
//     } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
//       throw new NetworkError('Impossible de se connecter au serveur');
//     } else {
//       throw new AppError('Erreur lors de la récupération du token d\'application', 'TOKEN_ERROR');
//     }
//   } finally {
//     isFetchingAppToken = false;
//   }
};

// Helper function to create headers with tokens
const createHeaders = async (customHeaders: Record<string, string> = {}, isLoginRequest: boolean = false) => {
  try {
    let appToken = localStorage.getItem('appToken');
    const userToken = store.getState().auth.token;
    const tokenExpiry = store.getState().auth.expires_at;

    // ✅ TOUJOURS construire les headers de base (nécessaires pour toutes les requêtes)
    const hostname = window.location.hostname.split('.')[0].toUpperCase();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-Type': 'front-office',
      'X-Establishment-Code': hostname,
      ...customHeaders
    };

    // ✅ Ajouter X-Module-Code si présent dans customHeaders (pour modules médicaux)
    // Le hook/appel API doit passer 'X-Module-Code' dans customHeaders si nécessaire
    // Format attendu: moduleId en majuscules avec underscores (ex: "MEDECINE_GENERALE")

    // ✅ Ajouter appToken si disponible
    if (appToken) {
      headers['x-app-token'] = appToken;
    }

    // ✅ Vérifier l'expiration du token UNIQUEMENT si ce n'est pas une requête de login
    // (car lors du login, on peut avoir un ancien token expiré dans le store)
    if (!isLoginRequest && tokenExpiry && new Date(tokenExpiry) < new Date()) {
      console.warn('User token expired, marking session as expired...');
      store.dispatch({ type: 'auth/sessionExpired' });
      // Ne pas ajouter le token expiré, mais garder les headers de base
      return headers;
    }

    // ✅ Ajouter le token utilisateur si disponible et valide
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    }

    return headers;
  } catch (error) {
    console.error('Error creating headers:', error);
    throw error;
  }
};

// Generic fetch wrapper with error handling
const fetchClient = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  try {
    // ✅ Détecter si c'est une requête de login (pour ignorer les tokens expirés)
    const isLoginRequest = endpoint.includes('/auth/login');
    const headers = await createHeaders(options.headers as Record<string, string>, isLoginRequest);
    
    const config: RequestInit = {
      ...options,
      headers,
    };

    console.log('Request Data:', {
      method: config.method || 'GET',
      url: `${API_BASE_URL}${endpoint}`,
      headers: config.headers,
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle token errors
    if (response.status === 401 && !isLoginRequest) {
      console.warn('Unauthorized (401). Checking for saved user...');
      
      // Vérifier si un utilisateur est sauvegardé (mode "Se souvenir de moi")
      const savedUser = localStorage.getItem('soins_suite_saved_user');
      
      if (savedUser) {
        // Utilisateur sauvegardé → Afficher modale au lieu de rediriger
        console.log('✅ Saved user found, dispatching session expired event for modal');
        store.dispatch({ type: 'auth/sessionExpired' });
        
        // Émettre événement pour que le Dashboard affiche la modale
        window.dispatchEvent(new CustomEvent('session:expired'));
        
        // Rejeter la requête (les hooks qui écoutent 'session:restored' la relanceront)
        throw new AuthError('Session expired. Please reconnect.');
      } else {
        // Pas de user sauvegardé → Rediriger vers login
        console.log('❌ No saved user, redirecting to login');
        store.dispatch({ type: 'auth/sessionExpired' });
        window.location.href = '/login';
      }
    }

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error && error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new NetworkError('Erreur de connexion réseau');
    } else {
      throw new AppError('Erreur lors de la requête', 'FETCH_ERROR');
    }
  }
};

// Convenience methods with automatic error handling
export const get = async (endpoint: string, options?: RequestInit, successMessage?: string) => {
  try {
    const response = await fetchClient(endpoint, { ...options, method: 'GET' });
    return notificationService.handleApiResponse(response, successMessage) ? response : null;
  } catch (error: unknown) {
    notificationService.handleJavaScriptError(error as Error);
    throw error;
  }
};

export const post = async (endpoint: string, data?: any, options?: RequestInit, successMessage?: string) => {
  try {
    const response = await fetchClient(endpoint, { 
      ...options, 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    });
    return notificationService.handleApiResponse(response, successMessage) ? response : null;
  } catch (error: unknown) {
    notificationService.handleJavaScriptError(error as Error);
    throw error;
  }
};

export const put = async (endpoint: string, data?: any, options?: RequestInit, successMessage?: string) => {
  try {
    const response = await fetchClient(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined 
    });
    return notificationService.handleApiResponse(response, successMessage) ? response : null;
  } catch (error: unknown) {
    store.dispatch(setError(error as string));
    notificationService.handleJavaScriptError(error as Error);
    throw error;
  }
};

export const patch = async (endpoint: string, data?: any, options?: RequestInit, successMessage?: string) => {
  try {
    const response = await fetchClient(endpoint, { ...options, method: 'PATCH', body: data ? JSON.stringify(data) : undefined });
    return notificationService.handleApiResponse(response, successMessage) ? response : null;
  } catch (error: unknown) {
    notificationService.handleJavaScriptError(error as Error);
    throw error;
  }
};
export const del = async (endpoint: string, options?: RequestInit, successMessage?: string) => {
  try {
    const response = await fetchClient(endpoint, { ...options, method: 'DELETE' });
    return notificationService.handleApiResponse(response, successMessage) ? response : null;
  } catch (error: unknown) {
    notificationService.handleJavaScriptError(error as Error);
    throw error;
  }
};


export default fetchClient;
