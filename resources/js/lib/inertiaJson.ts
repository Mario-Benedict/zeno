import type { HttpRequestConfig, Method } from '@inertiajs/core';
import { http } from '@inertiajs/react';

type InertiaJsonConfig = Omit<HttpRequestConfig, 'method' | 'url'>;

export const inertiaJson = async <T>(
  method: Method,
  url: string,
  config: InertiaJsonConfig = {},
): Promise<T> => {
  const { headers, ...rest } = config;
  const response = await http.getClient().request({
    method,
    url,
    headers: {
      Accept: 'application/json',
      ...(headers ?? {}),
    },
    ...rest,
  });

  return response.data ? (JSON.parse(response.data) as T) : (null as T);
};
