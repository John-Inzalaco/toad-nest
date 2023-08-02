import { Injectable } from '@nestjs/common';
import { Headers, HeadersInit } from 'undici';

@Injectable()
export class FastlyClient {
  constructor(
    private readonly serviceId: string,
    private readonly apiKey: string,
  ) {}

  purgeKey = async ({ key }: { key: string }): Promise<unknown> => {
    const path = `/service/${this.serviceId}/purge/${key}`;
    const headers = { 'fastly-soft-purge': 1 };
    return await this.request('POST', path, headers);
  };

  private async request<T = Record<string, unknown>>(
    method: FastlyRequest,
    path: string,
    optHeaders: Record<string, unknown> = {},
  ): Promise<T> {
    const url = 'https://api.fastly.com' + path;
    const headers: HeadersInit = new Headers({
      ...optHeaders,
      'fastly-key': this.apiKey,
      accept: 'application/json',
    });
    const response = await fetch(url, {
      method,
      headers,
    });

    const body = await response.json();

    return body as T;
  }
}

type FastlyRequest = 'GET' | 'POST' | 'PUT';
