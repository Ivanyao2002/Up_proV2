import type { CSSProperties } from "react";
import toast from "react-hot-toast";
import { AppError } from "./errorHandler";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationOptions {
  duration?: number;
  position?:
    | "top-right"
    | "top-center"
    | "top-left"
    | "bottom-right"
    | "bottom-center"
    | "bottom-left";
}

const baseToastStyle: CSSProperties = {
  borderRadius: "8px",
  padding: "12px 16px",
  fontSize: "14px",
  fontWeight: "500",
  boxShadow: "var(--shadow-card)",
};

class NotificationService {
  private defaultDuration = 5000;
  private defaultPosition = "top-center" as const;

  success(message: string, options?: NotificationOptions) {
    return toast.success(message, {
      duration: options?.duration ?? this.defaultDuration,
      position: options?.position ?? this.defaultPosition,
      style: {
        ...baseToastStyle,
        background: "#0ab39c",
        color: "#fff",
      },
      iconTheme: {
        primary: "#fff",
        secondary: "#0ab39c",
      },
    });
  }

  error(message: string, options?: NotificationOptions) {
    return toast.error(message, {
      duration: options?.duration ?? this.defaultDuration,
      position: options?.position ?? this.defaultPosition,
      style: {
        ...baseToastStyle,
        background: "var(--color-elevated)",
        color: "var(--color-text)",
        border: "1px solid rgba(239, 68, 68, 0.45)",
      },
      iconTheme: {
        primary: "#f87171",
        secondary: "var(--color-surface)",
      },
    });
  }

  warning(message: string, options?: NotificationOptions) {
    return toast(message, {
      duration: options?.duration ?? this.defaultDuration,
      position: options?.position ?? this.defaultPosition,
      style: {
        ...baseToastStyle,
        background: "var(--color-elevated)",
        color: "var(--color-text)",
        border: "1px solid rgba(245, 158, 11, 0.4)",
      },
      icon: null,
    });
  }

  info(message: string, options?: NotificationOptions) {
    return toast(message, {
      duration: options?.duration ?? this.defaultDuration,
      position: options?.position ?? this.defaultPosition,
      style: {
        ...baseToastStyle,
        background: "var(--color-elevated)",
        color: "var(--color-text)",
        border: "1px solid var(--color-border)",
      },
      icon: null,
    });
  }

  handleApiResponse(response: Response, successMessage?: string): boolean {
    if (response.ok) {
      if (successMessage) this.success(successMessage);
      return true;
    }
    void this.handleHttpError(response);
    return false;
  }

  private async handleHttpError(response: Response) {
    try {
      const errorData = await response.json();
      const message =
        errorData.message ||
        errorData.error ||
        errorData.detail ||
        `Erreur ${response.status}: ${response.statusText}`;

      switch (response.status) {
        case 400:
        case 422:
          this.warning(message);
          break;
        case 401:
        case 403:
          this.error(
            response.status === 403
              ? "Accès refusé. Permissions insuffisantes."
              : message
          );
          break;
        case 404:
          this.warning(message || "Ressource non trouvée.");
          break;
        case 500:
          this.error("Erreur serveur. Veuillez réessayer plus tard.");
          break;
        default:
          this.error(message);
      }
    } catch {
      this.error(`Erreur ${response.status}: ${response.statusText}`);
    }
  }

  handleJavaScriptError(error: Error | AppError) {
    if (error instanceof AppError) {
      switch (error.code) {
        case "VALIDATION_ERROR":
          this.warning(error.message);
          break;
        case "NETWORK_ERROR":
        case "AUTH_ERROR":
          this.error(error.message);
          break;
        default:
          this.error(error.message);
      }
    } else {
      this.error("Une erreur inattendue s'est produite.");
      console.error("JavaScript Error:", error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
