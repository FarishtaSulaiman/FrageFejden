// src/pages/apiHealth/CurrentUser.tsx
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { tokenStorage } from "../../lib/http";
import { jwtDecode } from "jwt-decode";

type AnyJwt = Record<string, any>;

export default function CurrentUser() {
    const { user, logout } = useAuth();
    const [showToken, setShowToken] = useState(false);
    if (!user) return <p className="text-white">Inte inloggad</p>;

    const accessToken = tokenStorage.get() ?? "";
    const claims = accessToken ? (jwtDecode<AnyJwt>(accessToken) as AnyJwt) : {};

    // Try common claim names for username (yours uses WS-Fed URIs)
    const userName =
        claims["name"] ??
        claims["unique_name"] ??
        claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ??
        claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
        user.email ??
        "—";

    const expiresAtUtc = user.expiresAtMs ? new Date(user.expiresAtMs * 1000).toISOString() : "—";

    return (
        <div className="text-white space-y-3">
            <h1 className="text-2xl font-bold">Aktuell användare</h1>

            <div className="rounded border border-white/10 p-4 bg-white/5">
                <p><b>User ID:</b> {user.id}</p>
                <p><b>User Name:</b> {userName}</p>
                <p><b>E-post:</b> {user.email ?? "—"}</p>
                <p><b>Roller:</b> {user.roles.join(", ") || "—"}</p>
                <p><b>Expires (UTC):</b> {expiresAtUtc}</p>

                <div className="mt-2">
                    <b>Access Token:</b>
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all bg-black/30 p-2 rounded">
                        {accessToken ? (showToken ? accessToken : accessToken.slice(0, 24) + "…") : "—"}
                    </pre>
                    <button
                        className="mt-2 rounded border border-white/20 px-3 py-1 text-sm hover:bg-white/10"
                        onClick={() => setShowToken(s => !s)}
                    >
                        {showToken ? "Dölj token" : "Visa token"}
                    </button>
                </div>

                <button onClick={logout} className="mt-4 rounded border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10">
                    Logga ut
                </button>
            </div>
        </div>
    );
}
