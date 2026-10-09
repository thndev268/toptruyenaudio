import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  meta: {
    requestId: string;
    serverTime: string;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const req = context.switchToHttp().getRequest();
    const requestId = req.headers['x-request-id'] || req.id || `req_${Math.random().toString(36).substring(2, 10)}`;

    return next.handle().pipe(
      map((data) => {
        // If response already has data/meta format, don't double wrap
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return data;
        }

        return {
          data,
          meta: {
            requestId,
            serverTime: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
