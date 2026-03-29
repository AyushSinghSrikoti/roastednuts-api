import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpProvider } from '../http/http.provider';
import type { HttpQueryParams } from '../http/http.types';

@Injectable()
export class KickboxProvider {
    constructor(
        private readonly http: HttpProvider,
        private readonly config: ConfigService,
    ) { }

    private get baseUrl(): string {
        const raw = this.config.get<string>('KICKBOX_API_BASE_URL')?.trim();
        return (raw ?? 'https://api.kickbox.com/v2').replace(/\/$/, '');
    }

    private mergeQuery(query?: HttpQueryParams): HttpQueryParams | undefined {
        const apiKey = this.config.get<string>('KICKBOX_API_KEY') ?? '';
        return { ...query, ...(apiKey ? { apikey: apiKey } : {}) };
    }

    private url(endpoint: string): string {
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${this.baseUrl}${path}`;
    }

    async post<T = unknown>(
        endpoint: string,
        body?: unknown,
        query?: HttpQueryParams,
    ) {
        return this.http.post<T>(this.url(endpoint), body, {
            query: this.mergeQuery(query),
        });
    }

    async get<T = unknown>(endpoint: string, query?: HttpQueryParams) {
        return this.http.get<T>(this.url(endpoint), {
            query: this.mergeQuery(query),
        });
    }
}