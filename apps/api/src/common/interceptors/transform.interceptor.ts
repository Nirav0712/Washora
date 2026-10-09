import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  success: boolean;
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((res) => {
        // If already formatted (e.g. { success: true, data: ..., meta: ... }), return as is
        if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
          return res;
        }

        // If returned an object with items and meta
        if (res && typeof res === 'object' && 'items' in res && 'meta' in res) {
          return {
            success: true,
            data: res.items,
            meta: res.meta,
          };
        }

        return {
          success: true,
          data: res,
        };
      }),
    );
  }
}
