import { http } from "../lib/http";

export type LoginReq = { emailOrUserName: string; password: string };
export type RegisterReq = { email: string; userName: string; password: string, fullname: string };


//API-anrop relaterade till autentisering, inklusive inloggning och registrering av användare.
export const AuthApi = {
    // Anropar inloggningsendpointen och returnerar en JWT som sträng
    login(data: LoginReq): Promise<string> {
        return http.post<string>("/Auth/login", data).then(r => r.data);
    },

    // Anropar registreringsendpointen och returnerar en JWT som sträng
    register(data: RegisterReq): Promise<string> {
        return http.post<string>("/Auth/register", data).then(r => r.data);
    },
};