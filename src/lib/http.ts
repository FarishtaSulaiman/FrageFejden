import axios from "axios";

const KEY = "auth.jwt";

// Hantering av JWT i sessionStorage
export const tokenStorage = {
    // Hämtar token från sessionStorage
    get(): string | null {
        return sessionStorage.getItem(KEY);
    },
    // Sparar token i sessionStorage
    set(token: string) {
        sessionStorage.setItem(KEY, token);
    },
    // Tar bort token från sessionStorage
    clear() {
        sessionStorage.removeItem(KEY);
    },
};
// Bas-URL för API:et (ersätt med din faktiska API-bas-URL)
export const http = axios.create({
    baseURL: "/api",
});

// Lägg till en interceptor för att inkludera JWT i alla förfrågningar
http.interceptors.request.use((config) => {
    const token = tokenStorage.get();
    if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});
