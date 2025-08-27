import React, { createContext, useContext, useMemo, useState } from "react";
import { api } from "../lib/api";
import { tokenStorage } from "../lib/http";
import { jwtDecode } from "jwt-decode";

type Role = string;
type JwtPayload = { sub?: string; email?: string; role?: Role | Role[]; exp?: number;[k: string]: unknown };
type Me = { id: string; email?: string; roles: Role[]; exp?: number };

// looks like a JWT if it has 3 parts
const isLikelyJwt = (s: unknown): s is string =>
    typeof s === "string" && s.split(".").length === 3;

function toUser(token: string): Me {
    const p = jwtDecode<JwtPayload>(token);
    const roles: Role[] = Array.isArray(p.role) ? p.role : p.role ? [p.role] : [];
    return { id: p.sub ?? "", email: p.email, roles, exp: p.exp };
}

type AuthState = {
    user: Me | null;
    login: (id: string, pw: string) => Promise<void>;
    register: (email: string, userName: string, pw: string, fullName?: string) => Promise<void>;
    logout: () => void;
    hasRole: (...roles: Role[]) => boolean;
};

const Ctx = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<Me | null>(() => {
        const t = tokenStorage.get();
        if (!isLikelyJwt(t)) {
            tokenStorage.clear();
            return null;
        }
        try {
            return toUser(t);
        } catch {
            tokenStorage.clear();
            return null;
        }
    });

    const login = async (id: string, pw: string) => {
        const token = await api.login({ emailOrUserName: id, password: pw });
        if (!isLikelyJwt(token)) throw new Error("Server returned an invalid token");
        tokenStorage.set(token);
        setUser(toUser(token));
    };

    const register = async (email: string, userName: string, password: string, fullName?: string) => {
        const token = await api.register({
            email: email.trim(),
            userName: userName.trim(),
            password,
            fullname: fullName?.trim(),
        });
        if (!isLikelyJwt(token)) throw new Error("Server returned an invalid token");
        tokenStorage.set(token);
        setUser(toUser(token));
    };

    const logout = () => { tokenStorage.clear(); setUser(null); };

    const hasRole = (...roles: Role[]) => !!user && roles.some(r => user.roles.includes(r));

    const value = useMemo<AuthState>(() => ({ user, login, register, logout, hasRole }), [user]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
    const v = useContext(Ctx);
    if (!v) throw new Error("useAuth must be used within AuthProvider");
    return v;
};
