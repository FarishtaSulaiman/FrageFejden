import { http } from "../../lib/http";

export const TeacherClasses = {
  // Hämtar lärarens egna klasser (skapade av läraren)
  async GetCreatedClasses(): Promise<any[]> {
    const res = await http.get(`/teacher/created-classes`);
    return res.data;
  },

  // Hämtar elever i en av lärarens klasser
  async GetClassStudents(classId: string): Promise<any[]> {
    const res = await http.get(`/teacher/created-classes/${classId}/students`);
    return res.data;
  },
};
