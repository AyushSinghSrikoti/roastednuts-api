export interface HttpResponse<T = unknown> {
    status: number;
    ok: boolean;
    data: T;
}

export type HttpQueryParams = Record<
    string,
    string | number | boolean | undefined | null
>;