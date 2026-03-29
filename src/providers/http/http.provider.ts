import { Injectable } from '@nestjs/common';
import type { HttpQueryParams, HttpResponse } from './http.types';

function normalizeQuery(
    query?: HttpQueryParams,
): Record<string, string> | undefined {
    if (!query) return undefined;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        out[key] = String(value);
    }
    return Object.keys(out).length ? out : undefined;
}

function withQuery(
    url: string,
    query?: Record<string, string>,
): string {
    if (!query || Object.keys(query).length === 0) return url;
    const u = new URL(url);
    for (const [k, v] of Object.entries(query)) {
        u.searchParams.set(k, v);
    }
    return u.toString();
}

@Injectable()
export class HttpProvider {
    async get<T = unknown>(
        url: string,
        options?: {
            query?: HttpQueryParams;
            headers?: Record<string, string>;
        },
    ): Promise<HttpResponse<T>> {
        const finalUrl = withQuery(url, normalizeQuery(options?.query));
        const res = await fetch(finalUrl, {
            method: 'GET',
            headers: options?.headers,
        });
        return this.parseResponse<T>(res);
    }

    async post<T = unknown>(
        url: string,
        body?: unknown,
        options?: {
            query?: HttpQueryParams;
            headers?: Record<string, string>;
        },
    ): Promise<HttpResponse<T>> {
        const finalUrl = withQuery(url, normalizeQuery(options?.query));
        const res = await fetch(
            finalUrl,
            this.buildBodyInit('POST', body, options?.headers),
        );
        return this.parseResponse<T>(res);
    }

    async put<T = unknown>(
        url: string,
        body?: unknown,
        options?: {
            query?: HttpQueryParams;
            headers?: Record<string, string>;
        },
    ): Promise<HttpResponse<T>> {
        const finalUrl = withQuery(url, normalizeQuery(options?.query));
        const res = await fetch(
            finalUrl,
            this.buildBodyInit('PUT', body, options?.headers),
        );
        return this.parseResponse<T>(res);
    }

    async patch<T = unknown>(
        url: string,
        body?: unknown,
        options?: {
            query?: HttpQueryParams;
            headers?: Record<string, string>;
        },
    ): Promise<HttpResponse<T>> {
        const finalUrl = withQuery(url, normalizeQuery(options?.query));
        const res = await fetch(
            finalUrl,
            this.buildBodyInit('PATCH', body, options?.headers),
        );
        return this.parseResponse<T>(res);
    }

    async delete<T = unknown>(
        url: string,
        options?: {
            query?: HttpQueryParams;
            headers?: Record<string, string>;
        },
    ): Promise<HttpResponse<T>> {
        const finalUrl = withQuery(url, normalizeQuery(options?.query));
        const res = await fetch(finalUrl, {
            method: 'DELETE',
            headers: options?.headers,
        });
        return this.parseResponse<T>(res);
    }

    private buildBodyInit(
        method: string,
        body: unknown,
        headers?: Record<string, string>,
    ): RequestInit {
        const h: Record<string, string> = { ...headers };
        if (body === undefined || body === null) {
            return { method, headers: h };
        }
        if (typeof body === 'string' || body instanceof Uint8Array) {
            return { method, headers: h, body: body as BodyInit };
        }
        h['Content-Type'] = h['Content-Type'] ?? 'application/json';
        return { method, headers: h, body: JSON.stringify(body) };
    }

    private async parseResponse<T>(res: Response): Promise<HttpResponse<T>> {
        const contentType = res.headers.get('content-type') ?? '';
        let data: unknown;
        if (contentType.includes('application/json')) {
            const text = await res.text();
            data = text.length ? JSON.parse(text) : null;
        } else {
            data = await res.text();
        }
        return { status: res.status, ok: res.ok, data: data as T };
    }
}