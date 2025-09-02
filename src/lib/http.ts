import axios from "axios";

const KEY = "auth.jwt";

export const tokenStorage = {
    get(): string | null { return sessionStorage.getItem(KEY); },
    set(token: string) { sessionStorage.setItem(KEY, token); },
    clear() { sessionStorage.removeItem(KEY); },
};


export const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    withCredentials: true,
});

http.interceptors.request.use((config) => {
    const token = tokenStorage.get();
    if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});
