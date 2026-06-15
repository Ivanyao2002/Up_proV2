export interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
  status?: number;
}

const API_ERROR_MESSAGES_FR: Record<string, string> = {
  AUTH_LOGIN_FAILED: "Email ou mot de passe incorrect.",
  PHONE_NOT_REGISTERED:
    "Ce numéro n'est pas enregistré. Utilisez la vérification chauffeur (OTP SMS).",
};

const API_MESSAGE_ALIASES_FR: Record<string, string> = {
  "Invalid login credentials": "Email ou mot de passe incorrect.",
};

/** Message affiché à l'utilisateur (français) à partir du code ou message API brut. */
export function resolveUserFacingMessage(
  code: string | undefined,
  message: string
): string {
  if (code && API_ERROR_MESSAGES_FR[code]) {
    return API_ERROR_MESSAGES_FR[code];
  }
  if (API_MESSAGE_ALIASES_FR[message]) {
    return API_MESSAGE_ALIASES_FR[message];
  }
  return message;
}

export class AppError extends Error {
  public code: string;
  public status: number;
  public details: unknown;

  constructor(
    message: string,
    code: string = "UNKNOWN_ERROR",
    status: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = "Erreur de connexion réseau") {
    super(message, "NETWORK_ERROR", 0);
  }
}

export class AuthError extends AppError {
  constructor(message: string = "Erreur d'authentification") {
    super(message, "AUTH_ERROR", 401);
  }
}

export class ApiError extends AppError {
  constructor(status: number, body: ErrorResponse) {
    super(body.message || `Erreur ${status}`, body.code ?? "API_ERROR", status, body.details);
    this.name = "ApiError";
  }
}
