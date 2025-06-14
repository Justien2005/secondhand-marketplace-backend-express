// response

import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export class ResponseHandler {
    static success(res: Response, data: any) {
        return res.status(StatusCodes.OK).json({
            status: 'success',
            data: data,
        });
    }

    static created(res: Response, data: any) {
        return res.status(StatusCodes.CREATED).json({
            status: 'created',
            data: data,
        });
    }

    static error(res: Response, message: string, error?: any) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            message: message,
            error: error,
        });
    }
}