import { Injectable } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

@Injectable()
export class HttpService {
  private readonly client: AxiosInstance = axios.create();

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);

    return response.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);

    return response.data;
  }
}
