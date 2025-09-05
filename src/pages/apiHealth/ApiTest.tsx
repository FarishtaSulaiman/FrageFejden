import React, { useMemo, useRef, useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { tokenStorage } from "../../lib/http";

const STORAGE_KEY_HISTORY = "api_playground_history_v1";
const MAX_HISTORY = 12;
const DEFAULT_URL = "/api/health";

// Helper
function tryParseJson(text: string) {
    try {
        return JSON.parse(text);
    } catch {
        return undefined;
    }
}

function formatSize(bytes: number | undefined) {
    if (!bytes && bytes !== 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}



export default function ApiPlayground() {
    const [method, setMethod] = useState<string>("GET");
    const [url, setUrl] = useState<string>(DEFAULT_URL);
    const [token, setToken] = useState<string>("");
    const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([
        { key: "Accept", value: "application/json" },
    ]);
    const [body, setBody] = useState<string>("{\n  \"example\": true\n}");
    const [sending, setSending] = useState<boolean>(false);
    const [resp, setResp] = useState<{
        status?: number;
        statusText?: string;
        timeMs?: number;
        sizeBytes?: number;
        headers?: Record<string, string>;
        bodyText?: string;
    }>({});
    const [error, setError] = useState<string>("");
    const abortRef = useRef<AbortController | null>(null);
    const { user, logout } = useAuth()

    useEffect(() => {
        const raw = tokenStorage.get(); // could be string or object
        // If raw is a JSON string, try to parse it first
        let t: any = raw;
        if (typeof raw === "string") {
            try {
                const maybeObj = JSON.parse(raw);
                if (maybeObj && typeof maybeObj === "object") t = maybeObj;
            } catch {
                // raw is just a plain string token
                t = raw;
            }
        }

        const tokenStr =
            typeof t === "string"
                ? t
                : t?.accessToken ?? t?.token ?? t?.jwt ?? t?.id_token ?? "";

        setToken(tokenStr);
    }, []);

    // Load/save history
    const history = useMemo<Array<{ id: string; method: string; url: string; ts: number; body?: string; headers?: Array<{ key: string; value: string }> }>>(() => {
        const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        } catch { }
        return [];
    }, [resp]);

    function pushHistory(entry: { method: string; url: string; body?: string; headers?: Array<{ key: string; value: string }> }) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const next = [{ id, ts: Date.now(), ...entry }, ...history]
            .slice(0, MAX_HISTORY);
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(next));
    }

    const TOKEN_KEY = "access_token";
    const accessToken = tokenStorage.get() ?? ""; // you already have this

    function setCurrentUserToken() {
        const t = tokenStorage.get() ?? "";
        setToken(t);
        if (t) localStorage.setItem(TOKEN_KEY, t);
    }

    function loadHistoryItem(h: { method: string; url: string; body?: string; headers?: Array<{ key: string; value: string }> }) {
        setMethod(h.method);
        setUrl(h.url);
        if (h.body !== undefined) setBody(h.body);
        if (h.headers) setHeaders(h.headers);
    }

    function addHeaderRow() {
        setHeaders((prev) => [...prev, { key: "", value: "" }]);
    }
    function removeHeaderRow(i: number) {
        setHeaders((prev) => prev.filter((_, idx) => idx !== i));
    }
    function updateHeader(i: number, field: "key" | "value", value: string) {
        setHeaders((prev) => prev.map((h, idx) => (idx === i ? { ...h, [field]: value } : h)));
    }

    async function send() {
        setSending(true);
        setError("");
        setResp({});
        const started = performance.now();

        // Build headers
        const hdrs = new Headers();
        for (const h of headers) {
            if (!h.key) continue;
            hdrs.set(h.key, h.value);
        }
        if (token) hdrs.set("Authorization", `Bearer ${token}`);

        // Auto set content-type for JSON body
        const hasBody = !["GET", "HEAD"].includes(method);
        let payload: BodyInit | undefined = undefined;
        if (hasBody && body.trim()) {
            const maybeJson = tryParseJson(body);
            if (maybeJson !== undefined) {
                if (!hdrs.has("Content-Type")) hdrs.set("Content-Type", "application/json");
                payload = JSON.stringify(maybeJson);
            } else {
                payload = body; // raw text
            }
        }

        const ctrl = new AbortController();
        abortRef.current = ctrl;

        try {
            const res = await fetch(url, {
                method,
                headers: hdrs,
                body: hasBody ? payload : undefined,
                credentials: "include", // keep cookies if you use cookie auth
                signal: ctrl.signal,
            });

            const timeMs = performance.now() - started;
            const resHeaders: Record<string, string> = {};
            res.headers.forEach((v, k) => (resHeaders[k] = v));

            const buf = await res.arrayBuffer();
            const sizeBytes = buf.byteLength;
            let bodyText = "";
            try {
                bodyText = new TextDecoder("utf-8").decode(buf);
            } catch {
                bodyText = "[Binary response]";
            }

            setResp({
                status: res.status,
                statusText: res.statusText,
                timeMs: Math.round(timeMs),
                sizeBytes,
                headers: resHeaders,
                bodyText,
            });

            // Save history (store minimal info)
            pushHistory({ method, url, body, headers });
        } catch (e: any) {
            setError(e?.message || "Request failed");
        } finally {
            setSending(false);
            abortRef.current = null;
        }
    }

    function cancel() {
        abortRef.current?.abort();
    }

    function prettyBody() {
        const j = tryParseJson(body);
        if (j === undefined) return;
        setBody(JSON.stringify(j, null, 2));
    }

    function clearResponse() {
        setResp({});
        setError("");
    }

    const parsed = useMemo(() => tryParseJson(resp.bodyText || ""), [resp.bodyText]);

    return (
        <div className="mx-auto max-w-6xl p-6 space-y-6">
            <h1 className="text-2xl font-bold">API Playground</h1>

            {/* Request Builder */}
            <div className="grid gap-4 rounded-2xl border p-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3">
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="w-full md:w-40 rounded-xl border px-3 py-2"
                    >
                        {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]
                            .map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                    </select>
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="/api/endpoint or https://..."
                        className="flex-1 rounded-xl border px-3 py-2"
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    {/* Headers */}
                    <div className="rounded-xl border p-3">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold">Headers</h2>
                            <button onClick={addHeaderRow} className="text-sm rounded-lg border px-2 py-1">+ Add</button>
                        </div>
                        <div className="space-y-2">
                            {headers.map((h, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        value={h.key}
                                        onChange={(e) => updateHeader(i, "key", e.target.value)}
                                        placeholder="Header name"
                                        className="w-1/2 rounded-lg border px-2 py-1"
                                    />
                                    <input
                                        value={h.value}
                                        onChange={(e) => updateHeader(i, "value", e.target.value)}
                                        placeholder="Header value"
                                        className="flex-1 rounded-lg border px-2 py-1"
                                    />
                                    <button
                                        onClick={() => removeHeaderRow(i)}
                                        className="rounded-lg border px-2 py-1 text-red-600 hover:bg-red-50"
                                        title="Remove"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3">
                            <label htmlFor="accessToken" className="text-sm text-gray-600">Bearer token</label>
                            <input
                                id="accessToken"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Paste JWT here (optional)"
                                className="mt-1 w-full rounded-lg border px-2 py-1"
                                autoComplete="off"
                                data-access-token
                            />
                            <button
                                onClick={() => setCurrentUserToken}
                                className="rounded-lg border px-2 py-1  hover:bg-red-50"
                                title="CurrentUser"
                            >
                                CurrentUser
                            </button>
                        </div>

                    </div>

                    {/* Body */}
                    <div className="rounded-xl border p-3">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold">Body</h2>
                            <div className="flex gap-2">
                                <button onClick={prettyBody} className="text-sm rounded-lg border px-2 py-1">Pretty JSON</button>
                                <button onClick={() => setBody("")} className="text-sm rounded-lg border px-2 py-1">Clear</button>

                            </div>
                        </div>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="h-48 w-full rounded-lg border p-2 font-mono text-sm"
                            placeholder="Raw or JSON body (auto sets content-type if valid JSON)"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!sending ? (
                        <button
                            onClick={send}
                            className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
                        >
                            Send
                        </button>
                    ) : (
                        <button
                            onClick={cancel}
                            className="rounded-xl bg-gray-700 px-4 py-2 text-white hover:opacity-90"
                        >
                            Cancel
                        </button>
                    )}
                    <button onClick={clearResponse} className="rounded-xl border px-4 py-2">Clear response</button>
                    <button onClick={logout}>Logout/clear cookie</button>

                    <div className="text-sm text-gray-600">Tip: For your endpoint <code>/api/Class/me</code>, set method <b>GET</b> and include a valid token.</div>
                </div>
            </div>

            {/* Response Panel */}
            <div className="grid gap-4 rounded-2xl border p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-semibold">Response</h2>
                    {resp.status !== undefined && (
                        <span className={`rounded-lg px-2 py-1 text-sm ${resp.status < 300 ? "bg-green-100 text-green-800" : resp.status < 400 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                            {resp.status} {resp.statusText}
                        </span>
                    )}
                    {resp.timeMs !== undefined && (
                        <span className="rounded-lg px-2 py-1 text-sm">{resp.timeMs} ms</span>
                    )}
                    {resp.sizeBytes !== undefined && (
                        <span className="rounded-lg px-2 py-1 text-sm">{formatSize(resp.sizeBytes)}</span>
                    )}
                    {sending && <span className="text-sm text-gray-500">Sending…</span>}
                    {error && <span className="text-sm text-red-600">{error}</span>}
                </div>

                {/* Response headers */}
                {resp.headers && (
                    <details className="rounded-xl border p-3">
                        <summary className="cursor-pointer select-none font-medium">Headers</summary>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {Object.entries(resp.headers).map(([k, v]) => (
                                <div key={k} className="flex gap-2 text-sm">
                                    <span className="w-48 shrink-0 font-semibold">{k}</span>
                                    <span className="break-all">{v}</span>
                                </div>
                            ))}
                        </div>
                    </details>
                )}

                {/* Response body */}
                <div className="rounded-xl border p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="font-semibold">Body</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => navigator.clipboard.writeText(resp.bodyText || "")}
                                className="text-sm rounded-lg border px-2 py-1 hover:bg-gray-50"
                            >
                                Copy
                            </button>
                        </div>
                    </div>

                    {resp.bodyText ? (
                        parsed ? (
                            <pre className="overflow-auto rounded-lg p-3 text-sm">
                                {JSON.stringify(parsed, null, 2)}
                            </pre>
                        ) : (
                            <pre className="overflow-auto rounded-lg p-3 text-sm whitespace-pre-wrap">{resp.bodyText}</pre>
                        )
                    ) : (
                        <div className="text-sm text-gray-500">No response yet.</div>
                    )}
                </div>
            </div>

            {/* History */}
            <div className="grid gap-2 rounded-2xl border p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">History</h2>
                    <button
                        onClick={() => localStorage.removeItem(STORAGE_KEY_HISTORY)}
                        className="text-sm rounded-lg border px-2 py-1 hover:bg-gray-50"
                    >
                        Clear history
                    </button>
                </div>
                <div className="divide-y">
                    {history.length === 0 && (
                        <div className="text-sm text-gray-500">Empty</div>
                    )}
                    {history.map((h) => (
                        <button
                            key={h.id}
                            onClick={() => loadHistoryItem(h)}
                            className="w-full text-left py-2 hover:bg-gray-50"
                            title={new Date(h.ts).toLocaleString()}
                        >
                            <div className="flex items-center gap-2">
                                <span className="inline-flex w-16 shrink-0 items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold">
                                    {h.method}
                                </span>
                                <span className="truncate">{h.url}</span>
                                <span className="ml-auto text-xs text-gray-500">{new Date(h.ts).toLocaleTimeString()}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-xs text-gray-500">
                Heads up: If you hit a different origin (e.g., http://localhost:5000 from http://localhost:5173), make sure CORS allows it.
            </p>
        </div>
    );
}

