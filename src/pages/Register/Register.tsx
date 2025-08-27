import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
    const { register } = useAuth();
    const nav = useNavigate();

    const [form, setForm] = useState({
        email: "",
        userName: "",
        password: "",
        confirm: "",
        name: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    function update<K extends keyof typeof form>(key: K, value: string) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        if (!form.email || !form.userName || !form.password || !form.name) {
            setError("Alla fält måste fyllas i.");
            return;
        }
        if (form.password !== form.confirm) {
            setError("Lösenorden matchar inte.");
            return;
        }

        try {
            setLoading(true);
            await register(form.email, form.userName, form.password, form.name); // 👈 pass the name
            nav("/", { replace: true });
        } catch (err: any) {
            const msg =
                err?.response?.data?.error ||
                err?.response?.data?.errors?.join?.(", ") ||
                err?.message ||
                "Ett fel uppstod, försök igen.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 360, margin: "4rem auto" }}>
            <h2>Skapa Konto</h2>

            <label>
                Namn
                <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="För- och efternamn"
                    required
                />
            </label>

            <label>
                Email
                <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@example.com"
                    required
                />
            </label>

            <label>
                Användarnamn
                <input
                    name="userName"
                    value={form.userName}
                    onChange={(e) => update("userName", e.target.value)}
                    placeholder="yourusername"
                    required
                />
            </label>

            <label>
                Lösenord
                <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="••••••••"
                    required
                />
            </label>

            <label>
                Lösenord igen
                <input
                    name="confirm"
                    type="password"
                    value={form.confirm}
                    onChange={(e) => update("confirm", e.target.value)}
                    placeholder="••••••••"
                    required
                />
            </label>

            {error && <div style={{ color: "crimson" }}>{error}</div>}

            <button type="submit" disabled={loading}>
                {loading ? "Skapar..." : "Skapa Konto"}
            </button>

            <div>
                Har du redan ett konto? <Link to="/login">Logga in</Link>
            </div>
        </form>
    );
}
