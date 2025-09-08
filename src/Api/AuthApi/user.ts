import { http } from "../../lib/http";

export type EditUserDto = {
    UserName: string;
    CurrentPassword: string;
    NewPassword: string;
    Email: string;
    AvatarUrl: string;
};

export const AuthApi = {
    async editUser(data: EditUserDto): Promise<void> {
        await http.post("user/edit", data);
    },
};
