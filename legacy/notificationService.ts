import toast from 'react-hot-toast';
import { AppError } from './errorHandler';


export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
  icon?: string;
}

class NotificationService {
  private defaultDuration = 5000;
  private defaultPosition: 'top-center' = 'top-center';
  success(message: string, options?: NotificationOptions) {
    return toast.success(message, {
      duration: options?.duration || this.defaultDuration,
      position: options?.position || this.defaultPosition,
      style: {
        background: '#10B981',
        color: '#fff',
        border: '1px solid #059669',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  }

  error(message: string, options?: NotificationOptions) {
    return toast.error(message, {
      duration: options?.duration || this.defaultDuration,
      position: options?.position || this.defaultPosition,
      style: {
        background: '#EF4444',
        color: '#fff',
        border: '1px solid #DC2626',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  }

  warning(message: string, options?: NotificationOptions) {
    return toast(message, {
      duration: options?.duration || this.defaultDuration,
      position: options?.position || this.defaultPosition,
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: '#fff',
        border: '1px solid #D97706',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  }

  info(message: string, options?: NotificationOptions) {
    return toast(message, {
      duration: options?.duration || this.defaultDuration,
      position: options?.position || this.defaultPosition,
      icon: 'ℹ️',
      style: {
        background: '#3B82F6',
        color: '#fff',
        border: '1px solid #2563EB',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  }

  // Méthode pour gérer les réponses API
  handleApiResponse(response: Response, successMessage?: string) {
    if (response.ok) {
      if (successMessage) {
        this.success(successMessage);
      }
      return true;
    } else {
      this.handleHttpError(response);
      return false;
    }
  }

  // Méthode pour gérer les erreurs HTTP
  private async handleHttpError(response: Response) {
    try {
      const errorData = await response.json();
      // Gérer les différents formats de messages d'erreur
      const message = errorData.message || errorData.error || errorData.detail || `Erreur ${response.status}: ${response.statusText}`;
      
      switch (response.status) {
        case 400:
          this.warning(message);
          break;
        case 401:
          this.error(message);
          break;
        case 403:
          this.error('Accès refusé. Permissions insuffisantes.');
          break;
        case 404:
          this.warning(message || 'Ressource non trouvée.');
          break;
        case 422:
          this.warning(message);
          break;
        case 500:
          this.error('Erreur serveur. Veuillez réessayer plus tard.');
          break;
        case 460:
          // this.warning(message)
          this.error('Centre non existant. Veuillez contacter l\'administrateur.');
          // window.location.href = '/not-centre';
          break;
        case 465:
          this.error('Licence expirée ou non valide. Veuillez contacter l\'administrateur.');
          window.location.href = '/not-licence';
          break;
        case 485:
          // Doublon bloqué - ne pas afficher d'erreur, géré par le composant
          return false;
        case 486:
          // Doublon avec avertissement - ne pas afficher d'erreur, géré par le composant
          return false;
        default:
          this.error(message);
      }
    } catch {
      this.error(`Erreur ${response.status}: ${response.statusText}`);
    }
  }

  // Méthode pour gérer les erreurs JavaScript
  handleJavaScriptError(error: Error | AppError) {
    if (error instanceof AppError) {
      switch (error.code) {
        case 'VALIDATION_ERROR':
          this.warning(error.message);
          break;
        case 'NETWORK_ERROR':
          this.error(error.message);
          break;
        case 'AUTH_ERROR':
          this.error(error.message);
          break;
        default:
          this.error(error.message);
      }
    } else {
      this.error('Une erreur inattendue s\'est produite.');
      console.error('JavaScript Error:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
