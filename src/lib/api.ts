import axios from "axios";

const BASE = import.meta.env.VITE_API_URL ?? "/api";
export const http = axios.create({ baseURL: BASE });

function extractToken(data: unknown): string {
    if (typeof data === "string") return data;
    const o = data as any;
    if (o?.token) return o.token;
    if (o?.access_token) return o.access_token;
    if (o?.accessToken) return o.accessToken;
    throw new Error("Login/register response did not include a token");
}

export const api = {
    async login(data: { emailOrUserName: string; password: string }): Promise<string> {
        const res = await http.post("/Auth/login", data);
        return extractToken(res.data);
    },
    async register(data: { email: string; userName: string; password: string; fullname?: string }): Promise<string> {
        const res = await http.post("/Auth/register", data);
        return extractToken(res.data);
    },
};
