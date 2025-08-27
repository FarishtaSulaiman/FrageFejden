import React from "react";
import { useAuth } from "../../auth/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function Login() {
    const { login, register } = useAuth();
    const nav = useNavigate();
    const loc = useLocation() as any;
    const from = loc.state?.from?.pathname || "/";

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await login(String(fd.get("id")), String(fd.get("pw")));
        nav(from, { replace: true });
    }

    async function onQuickRegister() {
        // demo; replace with your own UI/flow
        await register("test@test.se", "Test", "PassTest!");
        nav("/", { replace: true });
    }

    return (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 320, margin: "4rem auto" }}>
            <h2>Login</h2>
            <input name="id" placeholder="email or username" />
            <input name="pw" type="password" placeholder="password" />
            <button type="submit">Logga in</button>
            <button type="button" onClick={onQuickRegister}>Snabb Registering</button>
        </form>
    );
}
