import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from "@nestjs/common";
import { runWithIncomingContext, type HttpHeadersCarrier } from "@betterlog/sdk-node";
import { Observable } from "rxjs";

/**
 * Rehydrates remote workflow context from inbound W3C trace + baggage headers
 * before the route handler runs.
 */
@Injectable()
export class WorkflowContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<{ headers: HttpHeadersCarrier }>();
    return new Observable((subscriber) => {
      runWithIncomingContext(req.headers, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
