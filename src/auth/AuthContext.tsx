import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { tokenStorage } from "../lib/http";
import { AuthApi } from "../Api/index";

type Role = string;

export type Me = {
  id: string;
  email?: string;
  userName?: string;
  fullName?: string;
  roles: Role[];
  exp?: number;
  expiresAtMs?: number;
};

type AuthState = {
  user: Me | null;
  login: (id: string, pw: string) => Promise<Me>;
  registerTeacher: (
    email: string,
    userName: string,
    pw: string,
    fullName?: string
  ) => Promise<Me>;
  registerStudent: (
    email: string,
    userName: string,
    pw: string,
    fullName?: string
  ) => Promise<Me>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
  refresh: () => Promise<void>;
  loadingUser: boolean;
};

const Ctx = createContext<AuthState | null>(null);

type AnyPayload = Record<string, unknown>;

const isLikelyJwt = (s: unknown): s is string =>
  typeof s === "string" && s.split(".").length === 3;

function firstString(obj: AnyPayload, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return undefined;
}

function readRoles(p: AnyPayload): string[] {
  const candidates = [
    p["role"],
    p["roles"],
    p["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
  ];
  for (const c of candidates) {
    if (!c) continue;
    if (Array.isArray(c)) return c.filter((x): x is string => typeof x === "string");
    if (typeof c === "string" && c.trim()) return [c];
  }
  return [];
}

function decodeTokenToMe(token: string): Me {
  const p = jwtDecode<AnyPayload>(token) as AnyPayload;

  const id =
    firstString(
      p,
      "sub",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ) ?? "";

  const email = firstString(
    p,
    "email",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
  );

  const userName = firstString(
    p,
    "unique_name",
    "name",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
  );

  const fullName = firstString(p, "fullName", "name", "unique_name");

  const roles = readRoles(p);

  const jwtExp = p["exp"];
  const expiresAtMs = typeof jwtExp === "number" ? jwtExp * 1000 : undefined;

  return { id, email, userName, fullName, roles, expiresAtMs };
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<Me | null>(() => {
    const t = tokenStorage.get();
    if (!isLikelyJwt(t)) {
      tokenStorage.clear();
      return null;
    }
    try {
      const me = decodeTokenToMe(t);
      if (me.expiresAtMs && me.expiresAtMs <= Date.now()) {
        tokenStorage.clear();
        return null;
      }
      return me;
    } catch {
      tokenStorage.clear();
      return null;
    }
  });

  const [loadingUser, setLoadingUser] = useState(false);

  //  Auto-refresh användare
  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoadingUser(true);
      try {
        const me = await AuthApi.getMe();
        setUser((u): Me | null => {
          if (!u) return u;
          const next: Me = { ...u };
          if (me.id) next.id = me.id;
          if (me.userName) next.userName = me.userName;
          if (me.fullName) next.fullName = me.fullName;
          if (Array.isArray(me.roles)) next.roles = me.roles;
          if (typeof me.exp === "number") next.exp = me.exp;
          return next;
        });
      } catch {}
      setLoadingUser(false);
    })();
  }, []);

  useEffect(() => {
    if (!user?.expiresAtMs) return;
    const ms = user.expiresAtMs - Date.now();
    if (ms <= 0) {
      void logout();
      return;
    }
    const id = setTimeout(() => void logout(), ms);
    return () => clearTimeout(id);
  }, [user?.expiresAtMs]);

  //  Login
  const login = async (id: string, pw: string): Promise<Me> => {
    setLoadingUser(true);
    const token = await AuthApi.login({ emailOrUserName: id, password: pw });
    if (!isLikelyJwt(token)) throw new Error("Server returned an invalid token");
    tokenStorage.set(token);

    let me: Me;
    try {
      me = await AuthApi.getMe();
      setUser(me);
    } catch {
      me = decodeTokenToMe(token);
      setUser(me);
    }

    setLoadingUser(false);
    return me;
  };

  //  Registrera som lärare
  const registerTeacher = async (
    email: string,
    userName: string,
    password: string,
    fullName?: string
  ): Promise<Me> => {
    setLoadingUser(true);

    const token = await AuthApi.registerTeacher({
      email: email.trim(),
      userName: userName.trim(),
      password,
      fullName,
    });

    if (!isLikelyJwt(token)) throw new Error("Server returned an invalid token");
    tokenStorage.set(token);

    let me: Me;
    try {
      me = await AuthApi.getMe();
    } catch {
      me = decodeTokenToMe(token);
    }

    setUser(me);
    localStorage.setItem("user", JSON.stringify(me));

    setLoadingUser(false);
    return me;
  };

  //  Registrera som student
  const registerStudent = async (
    email: string,
    userName: string,
    password: string,
    fullName?: string
  ): Promise<Me> => {
    setLoadingUser(true);

    const token = await AuthApi.register({
      email: email.trim(),
      userName: userName.trim(),
      password,
      fullName,
    });

    if (!isLikelyJwt(token)) throw new Error("Server returned an invalid token");
    tokenStorage.set(token);

    let me: Me;
    try {
      me = await AuthApi.getMe();
    } catch {
      me = decodeTokenToMe(token);
    }

    setUser(me);
    localStorage.setItem("user", JSON.stringify(me));

    setLoadingUser(false);
    return me;
  };

  //  Logout
  const logout = async () => {
    setLoadingUser(true);
    try {
      await AuthApi.logout();
    } catch {}
    tokenStorage.clear();
    setUser(null);
    setLoadingUser(false);
  };

  //  Rollkontroll
  const hasRole = (...roles: Role[]) =>
    !!user && roles.some((r) => user.roles.includes(r));

  const refresh = async () => {
    setLoadingUser(true);
    try {
      const me = await AuthApi.getMe();
      setUser((u): Me | null => {
        if (!u) return u;
        const next: Me = { ...u };
        if (me.id) next.id = me.id;
        if (me.userName) next.userName = me.userName;
        if (me.fullName) next.fullName = me.fullName;
        if (Array.isArray(me.roles)) next.roles = me.roles;
        if (typeof me.exp === "number") next.exp = me.exp;
        return next;
      });
    } catch {}
    setLoadingUser(false);
  };

  const value = useMemo<AuthState>(
    () => ({ user, login, registerTeacher, registerStudent, logout, hasRole, refresh, loadingUser }),
    [user, loadingUser]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
};
