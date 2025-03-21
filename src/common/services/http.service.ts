import { Service } from 'typedi';

@Service()
export class HttpService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async get<T = any>(
    url: string | URL | Request,
    config?: Omit<RequestInit, 'method' | 'body'>
  ) {
    const res = await fetch(url, {
      ...(config || {}),
      body: undefined,
      method: 'GET',
    });

    return (await res.json()) as T;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async post<T = any>(
    url: string | URL | Request,
    config?: Omit<RequestInit, 'method'>
  ) {
    const res = await fetch(url, {
      ...(config || {}),
      method: 'POST',
    });

    return (await res.json()) as T;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async delete<T = any>(
    url: string | URL | Request,
    config?: Omit<RequestInit, 'method' | 'body'>
  ) {
    const res = await fetch(url, {
      ...(config || {}),
      body: undefined,
      method: 'DELETE',
    });

    return (await res.json()) as T;
  }
}
