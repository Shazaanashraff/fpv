// Common type definitions

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface SendOtpResponse {
  phone: string;
  cooldownSeconds: number;
}

export interface VerifyOtpResponse {
  phone: string;
  verified: boolean;
  expiresInSeconds: number;
}

export interface RegisterResponse {
  customerId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}
