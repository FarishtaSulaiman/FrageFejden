import { http } from "../lib/http";

export type LoginReq = { emailOrUserName: string; password: string };
export type RegisterReq = { email: string; userName: string; password: string; fullName?: string };

// Auth API
export const AuthApi = {
    async login(data: LoginReq): Promise<string> {
        const res = await http.post("/Auth/login", data);
        return extractToken(res.data);
    },

    async register(data: RegisterReq): Promise<string> {
        const payload = {
            email: data.email,
            userName: data.userName,
            password: data.password,
            fullname: data.fullName?.trim() ?? "",
        };
        const res = await http.post("/Auth/register", payload);
        return extractToken(res.data);
    },

    async logout(): Promise<void> {
        await http.post("/Auth/logout");
    },
};

function extractToken(data: unknown): string {
    if (typeof data === "string") return data;
    const o = data as any;
    if (o?.token) return o.token;
    if (o?.access_token) return o.access_token;
    if (o?.accessToken) return o.accessToken;
    throw new Error("Login/register response did not include a token");
}
