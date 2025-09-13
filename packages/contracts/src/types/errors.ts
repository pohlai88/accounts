/**
 * @aibos/contracts - Error Types (SSOT)
 * 
 * Single source of truth for error handling following the integration strategy
 */

export enum ErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    TIMEOUT = 'TIMEOUT',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export const httpStatusFor = (code: ErrorCode): number => {
    switch (code) {
        case ErrorCode.VALIDATION_ERROR:
            return 400;
        case ErrorCode.AUTHENTICATION_ERROR:
            return 401;
        case ErrorCode.AUTHORIZATION_ERROR:
            return 403;
        case ErrorCode.NOT_FOUND:
            return 404;
        case ErrorCode.CONFLICT:
            return 409;
        case ErrorCode.RATE_LIMIT_EXCEEDED:
            return 429;
        case ErrorCode.TIMEOUT:
            return 504;
        default:
            return 500;
    }
};
