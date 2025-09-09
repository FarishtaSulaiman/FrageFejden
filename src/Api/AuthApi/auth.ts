import { http } from "../../lib/http";
import { tokenStorage } from "../../lib/http";

export type LoginReq = { emailOrUserName: string; password: string };
export type RegisterReq = { email: string; userName: string; password: string; fullName?: string };


export type MeResp = {
    id: string;
    email?: string;
    userName?: string;
    FullName?: string;
    roles: string[];
    exp?: number;
    expiresAtUtc?: string;
};

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

        try {
            await http.post("/Auth/logout");
        } catch {

        }
    },


    async logoutAll(): Promise<void> {
        await http.post("/Auth/logoutAll");

    },


    async getMe(): Promise<MeResp> {
        const res = await http.get("/Auth/me");
        return res.data as MeResp;
    }
};

function extractToken(data: unknown): string {
    if (typeof data === "string") return data;
    const o = data as any;
    if (o?.token) return o.token;
    if (o?.access_token) return o.access_token;
    if (o?.accessToken) return o.accessToken;
    throw new Error("Login/register response did not include a token");
}