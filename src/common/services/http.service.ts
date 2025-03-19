import { Service } from "typedi";

@Service()
export class HttpService {
    async get<T = unknown>(url: string | URL | Request, config?: Omit<RequestInit, 'method' | 'body'>) {
        const res = await fetch(url, {
            ...(config || {}),
            body: undefined,
            method: 'GET',
        })

        return await res.json() as T
    }

    async post<T = unknown>(url: string | URL | Request, config?: Omit<RequestInit, 'method'>) {
        const res = await fetch(url, {
            ...(config || {}),
            method: 'POST',
        })

        return await res.json() as T
    }

    async delete<T = unknown>(url: string | URL | Request, config?: Omit<RequestInit, 'method' | 'body'>) {

        const res = await fetch(url, {
            ...(config || {}),
            body: undefined,
            method: 'DELETE',
        })

        return await res.json() as T
    }
}