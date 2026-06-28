import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";

import { Response } from "express";

interface RpcError {
  statusCode?: number;
  status?: number;
  message?: string | string[];
  error?: string;
  response?: {
    statusCode?: number;
    message?: string | string[];
    error?: string;
  };
}

@Catch()
export class RpcToHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcToHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= 500) Sentry.captureException(exception);
      response.status(status).json(exception.getResponse());
      return;
    }

    const rpcError = exception as RpcError;

    // RPC 예외는 중첩된 response 객체를 가질 수 있음
    const nested = rpcError?.response;
    const statusCode =
      nested?.statusCode ??
      rpcError?.statusCode ??
      rpcError?.status ??
      HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      nested?.message ?? rpcError?.message ?? "Internal server error";
    const error = nested?.error ?? rpcError?.error ?? "Internal Server Error";

    if (statusCode >= 500) {
      this.logger.error(`RPC Error: ${JSON.stringify(exception)}`);
      Sentry.captureException(exception);
    }

    response.status(statusCode).json({ statusCode, message, error });
  }
}
