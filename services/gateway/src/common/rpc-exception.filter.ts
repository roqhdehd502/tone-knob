import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

import { Response } from 'express';

interface RpcError {
  statusCode?: number;
  message?: string;
  error?: string;
}

@Catch()
export class RpcToHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    const rpcError = exception as RpcError;
    const statusCode = rpcError?.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const message = rpcError?.message ?? 'Internal server error';

    response.status(statusCode).json({ statusCode, message });
  }
}
