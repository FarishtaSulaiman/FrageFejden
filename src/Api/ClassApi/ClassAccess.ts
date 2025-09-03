import { http } from "../../lib/http";

export const ClassAccess = {

    //gå med i en klass med kod
    async JoinClassByCode(code: string): Promise<void> {
        await http.post(`/Class/join/${code}`);
    },

    /// lämna en klass
    async LeaveClass(classId: string): Promise<void> {
        await http.post(`/Class/${classId}/leave`);
    },

    //återskapa en ny kod för att gå med i en klass
    async RegenerateJoinCode(classId: string): Promise<string> {
        const res = await http.post(`/Class/${classId}/regen-joincode`);
        return res.data.joinCode;
    }
}