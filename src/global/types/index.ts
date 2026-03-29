export interface X_API_SUCCESS_RESPONSE_TYPE {
    status: number;
    message: string;
    data?: unknown;
}

export interface X_API_ERROR_RESPONSE_TYPE {
    status: number;
    message: string;
    error: string;
}

export type X_API_RESPONSE_TYPE = X_API_SUCCESS_RESPONSE_TYPE | X_API_ERROR_RESPONSE_TYPE;