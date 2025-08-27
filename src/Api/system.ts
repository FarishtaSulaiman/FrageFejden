import { http } from "../lib/http";

//API-anrop relaterade till systeminformation
export type PingRes = { ok: boolean; name?: string; version?: string; time: string };

//API-klient för systemrelaterade anrop
export const SystemApi = {
    // Anropar ping-endpointen för att kontrollera API:ets status
    ping(): Promise<PingRes> {
        return http.get<PingRes>("/System/ping").then(r => r.data);
    },
};
