import { http } from "../../lib/http";

export const Classes = {
    //hämtar alla klasser!! OBS ALLA INTE BARA ANVÄNDARENS
    async MyClasses(page: number = 1, pageSize: number = 50): Promise<any[]> {
        const res = await http.get(`/Class`, {
            params: { page, pageSize },
        });
        return res.data.items;
    },

    //Skapar en ny klass
    async CreateClass(name: string, gradeLabel: string, makeMeTeacher: boolean, description?: string): Promise<any> {
        const res = await http.post("/Class", {
            name,
            gradeLabel,
            description: description?.trim() ?? "",
            makeMeTeacher,
        });
        return res.data;
    },

    //Hämtar en specifik klass med ID
    async GetClassById(classId: string): Promise<any> {
        const res = await http.get(`/Class/${classId}`);
        return res.data;
    },

    //Uppdaterar en klass
    async UpdateClass(classId: string, name: string, gradeLabel: string, description?: string): Promise<any> {
        const res = await http.put(`/Class/${classId}`, {
            name,
            gradeLabel,
            description: description?.trim() ?? "",
        });
        return res.data;
    },

    //Tar bort en klass
    async DeleteClass(classId: string): Promise<void> {
        await http.delete(`/Class/${classId}`);
    },

    async GetUsersClasses(): Promise<any> {
        const data = await http.get("/Class/me");
        return data;
    },

    async GetLoggedInUserScore(Userid: string): Promise<any> {
        const data = await http.get(`/Class/user/${Userid}/points`)
        return data
    }
}