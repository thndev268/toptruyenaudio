import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request.headers['x-request-id'] as string) ||
      (request as any).id ||
      `req_${Math.random().toString(36).substring(2, 10)}`;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'Đã có lỗi xảy ra từ máy chủ';
    let fields: Record<string, any> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;

      if (typeof res === 'string') {
        errorMessage = res;
      } else if (typeof res === 'object' && res !== null) {
        errorMessage = res.message || exception.message;
        errorCode = res.code || res.error || this.getErrorCodeFromStatus(status);
        if (res.fields) {
          fields = res.fields;
        } else if (Array.isArray(res.message)) {
          errorMessage = 'Dữ liệu không hợp lệ';
          errorCode = 'VALIDATION_ERROR';
          fields = { errors: res.message };
        }
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
      if ((exception as any).code) {
        errorCode = (exception as any).code;
      }
    }

    // Map common HTTP statuses to Phase 1 error codes
    if (!errorCode || errorCode === 'INTERNAL_SERVER_ERROR') {
      errorCode = this.getErrorCodeFromStatus(status);
    }

    response.status(status).json({
      error: {
        code: errorCode,
        message: errorMessage,
        fields,
        requestId,
      },
    });
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHENTICATED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'RESOURCE_NOT_FOUND';
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.CONFLICT:
        return 'VERSION_CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
