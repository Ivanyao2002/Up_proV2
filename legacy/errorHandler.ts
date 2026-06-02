export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
  status?: number;
}

export interface SuccessResponse {
  message: string;
  data?: any;
  type?: 'success' | 'info' | 'warning';
}

export class AppError extends Error {
  public code: string;
  public status: number;
  public details: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Erreur de connexion réseau') {
    super(message, 'NETWORK_ERROR', 0);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Erreur d\'authentification') {
    super(message, 'AUTH_ERROR', 401);
  }
}
