import { HttpParams } from '@angular/common/http';

export function toHttpParams<T extends object>(values: T): HttpParams {
    let params = new HttpParams();

    Object.entries(values as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params = params.set(key, String(value));
        }
    });

    return params;
}
