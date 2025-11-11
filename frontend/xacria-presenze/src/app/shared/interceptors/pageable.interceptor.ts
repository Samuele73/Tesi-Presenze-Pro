import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpParams,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class PageableInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!req.params.has('pageable')) {
      return next.handle(req);
    }

    const raw = req.params.get('pageable');
    if (!raw) {
      return next.handle(req);
    }

    try {
      const parsed = JSON.parse(raw);
      let params = req.params.delete('pageable');
      if (parsed.page !== undefined) {
        params = params.set('page', `${parsed.page}`);
      }
      if (parsed.size !== undefined) {
        params = params.set('size', `${parsed.size}`);
      }
      if (Array.isArray(parsed.sort)) {
        parsed.sort.forEach((sortValue: string) => {
          params = params.append('sort', sortValue);
        });
      }
      const cloned = req.clone({ params });
      return next.handle(cloned);
    } catch {
      return next.handle(req);
    }
  }
}
