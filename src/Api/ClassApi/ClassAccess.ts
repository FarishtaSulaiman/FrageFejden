import { http } from "../../lib/http";

export const ClassAccess = {
    //hämtar alla klasser!! OBS ALLA INTE BARA ANVÄNDARENS
    async Mask(page: number = 1, pageSize: number = 50): Promise<any[]> {
        const res = await http.get(`/Class`, {
            params: { page, pageSize },
        });
        return res.data.items;
    },
}