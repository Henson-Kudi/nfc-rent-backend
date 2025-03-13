import { Service } from "typedi";

@Service()
export class HttpService {
    async get<T = unknown>(url: string | URL | Request, config?: Omit<RequestInit, 'method'>) {
        const res = await fetch(url, {
            ...(config || {}),
            method: 'GET',
        })

        return await res.json() as T
    }
}