import { Alert } from 'react-native';

export type ErrorType = 
  | 'network'
  | 'auth'
  | 'validation'
  | 'permission'
  | 'storage'
  | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
}

export class ErrorHandler {
  static createError(type: ErrorType, message: string, code?: string, details?: any): AppError {
    return { type, message, code, details };
  }

  static handleError(error: any, context?: string): AppError {
    console.error(`Error in ${context || 'unknown context'}:`, error);

    // Network errors
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return this.createError('network', 'Network connection failed. Please check your internet connection.');
    }

    // Authentication errors
    if (error.message?.includes('auth') || error.message?.includes('unauthorized')) {
      return this.createError('auth', 'Authentication failed. Please sign in again.');
    }

    // Validation errors
    if (error.message?.includes('validation') || error.message?.includes('invalid')) {
      return this.createError('validation', error.message || 'Invalid input provided.');
    }

    // Permission errors
    if (error.message?.includes('permission') || error.message?.includes('denied')) {
      return this.createError('permission', 'Permission denied. Please check your settings.');
    }

    // Storage errors
    if (error.message?.includes('storage') || error.message?.includes('upload')) {
      return this.createError('storage', 'File upload failed. Please try again.');
    }

    // Supabase specific errors
    if (error.code) {
      switch (error.code) {
        case 'PGRST116':
          return this.createError('network', 'Server temporarily unavailable. Please try again.');
        case '23505':
          return this.createError('validation', 'This item already exists.');
        case '23503':
          return this.createError('validation', 'Referenced item not found.');
        default:
          return this.createError('unknown', error.message || 'An unexpected error occurred.');
      }
    }

    // Default error
    return this.createError('unknown', error.message || 'An unexpected error occurred.');
  }

  static showError(error: AppError, title?: string) {
    Alert.alert(
      title || 'Error',
      error.message,
      [{ text: 'OK' }]
    );
  }

  static showSuccess(message: string, title: string = 'Success') {
    Alert.alert(title, message, [{ text: 'OK' }]);
  }

  static getErrorMessage(error: AppError): string {
    return error.message;
  }

  static isRetryableError(error: AppError): boolean {
    return error.type === 'network' || error.type === 'unknown';
  }
}

// Utility functions for common error scenarios
export const ErrorUtils = {
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const appError = ErrorHandler.handleError(error);
        
        if (!ErrorHandler.isRetryableError(appError) || attempt === maxRetries) {
          throw appError;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw ErrorHandler.handleError(lastError);
  },

  async withLoading<T>(
    operation: () => Promise<T>,
    setLoading: (loading: boolean) => void
  ): Promise<T> {
    try {
      setLoading(true);
      return await operation();
    } finally {
      setLoading(false);
    }
  },

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long' };
    }
    return { isValid: true };
  },

  validateRequired(value: string, fieldName: string): { isValid: boolean; message?: string } {
    if (!value || value.trim().length === 0) {
      return { isValid: false, message: `${fieldName} is required` };
    }
    return { isValid: true };
  },

  sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
};



