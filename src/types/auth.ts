export type Role = "Student" | "Admin" | string;

//Payloaden i en JWT-token
export type JwtPayload = {
    sub: string;
    email?: string;
    role?: Role | Role[];
    exp?: number;
    [k: string]: unknown;
};

export type AuthToken = string; //Jwt token


//Användaren som är inloggad i systemet
export type Me = {
    id: string;
    email?: string;
    roles: Role[];
    exp?: number;
};