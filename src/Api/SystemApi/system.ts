import { http } from "../../lib/http";

export type PingRes = { ok: boolean; name?: string; version?: string; time: string };

export const SystemApi = {
    async ping(): Promise<PingRes> {
        const res = await http.get("/System/ping");
        return res.data;
    },
};
