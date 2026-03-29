import { HttpException } from '@nestjs/common';
import { X_API_ERROR_RESPONSE_TYPE } from 'src/global/types';

export const errorHandler = (error: unknown): X_API_ERROR_RESPONSE_TYPE => {
    if (error instanceof HttpException) {
        return {
            status: error.getStatus(),
            message: error.message,
            error: error.name,
        };
    }

    if (error instanceof Error) {
        return {
            status: 500,
            message: error.message,
            error: error.name,
        };
    }

    return {
        status: 500,
        message: 'Internal server error',
        error: 'Unknown error',
    };
};