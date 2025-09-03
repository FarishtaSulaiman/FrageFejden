import { http } from "../../lib/http";

export const ClassMemberShips = {

    async GetClassMembers(classId: string, page: number = 1, pageSize: number = 50): Promise<any[]> {
        const res = await http.get(`/Class/${classId}/members`, {
            params: { page, pageSize },
        });
        return res.data.items;
    },

    //lägger till en medlem i en klass
    async AddMember(classId: string, userId: string,): Promise<void> {
        await http.post(`/Class/${userId}/members`);
    },

    //tar bort en medlem från en klass
    async RemoveMember(classId: string, userId: string): Promise<void> {
        await http.delete(`/Class/${classId}/members/${userId}`);
    }
}