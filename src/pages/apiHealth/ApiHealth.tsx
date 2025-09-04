import { useEffect, useMemo, useState } from "react";
import { http } from "../../lib/http";
import { SystemApi } from "../../Api/SystemApi/system";


type Status = "checking" | "ok" | "fail";

export default function ApiHealth() {
    const [status, setStatus] = useState<Status>("checking");
    const [msg, setMsg] = useState("");

    const { VITE_API_BASE, DEV } = import.meta.env;



    const debug = useMemo(() => {
        const base = (http.defaults.baseURL ?? "").replace(/\/+$/, "");
        const path = "/System/ping";

        // Absolute baseURL (no proxy)
        if (/^https?:\/\//i.test(base)) {
            return {
                requestUrl: `${base}${path}`,
                viaProxy: false as const,
                proxyTargetUrl: undefined as string | undefined,
            };
        }


        const requestUrl = new URL(`${base}${path}`, window.location.origin).href;
        const proxyTargetUrl = VITE_API_BASE
            ? `${VITE_API_BASE.replace(/\/+$/, "")}${path}`
            : undefined;

        return {
            requestUrl,
            viaProxy: true as const,
            proxyTargetUrl,
        };
    }, [VITE_API_BASE]);

    async function check() {
        setStatus("checking");
        setMsg("");
        try {
            const res = await SystemApi.ping();
            setStatus(res.ok ? "ok" : "fail");
            setMsg(res.time ? new Date(res.time).toLocaleString() : "");
        } catch (e: any) {
            setStatus("fail");
            // show a compact error hint
            const reason =
                e?.response?.status
                    ? `${e.response.status} ${e.response.statusText ?? ""}`.trim()
                    : e?.message ?? "Request failed";
            setMsg(reason);
        }
    }

    useEffect(() => {
        check();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="w-full max-w-xl bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">API-anslutning</h2>
                    <StatusPill status={status} />
                </div>

                <div className="mt-2 text-sm text-gray-500 space-y-1">
                    <p>
                        Kontrollerar:&nbsp;
                        <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            {debug.requestUrl}
                        </code>
                    </p>

                    {DEV && debug.viaProxy && (
                        <p>
                            Vite proxy target:&nbsp;
                            <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                {debug.proxyTargetUrl ?? "okänd – kolla vite.config.ts"}
                            </code>
                        </p>
                    )}
                </div>

                <div className="mt-6">
                    {status === "checking" && (
                        <div className="flex items-center gap-3 text-gray-700">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-300 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400" />
                            </span>
                            <span>Kollar…</span>
                        </div>
                    )}

                    {status === "ok" && (
                        <div className="flex items-center gap-3 text-green-700">
                            <span className="text-xl">✅</span>
                            <span>
                                API hittad {msg && <em className="not-italic text-green-600">({msg})</em>}
                            </span>
                        </div>
                    )}

                    {status === "fail" && (
                        <div className="flex items-center gap-3 text-red-700">
                            <span className="text-xl">❌</span>
                            <span>
                                Kan inte koppla till API{" "}
                                {msg && <em className="not-italic text-red-600">({msg})</em>}
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex items-center gap-3">
                    <button
                        onClick={check}
                        className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Försök igen
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                        Ladda om sidan
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatusPill({ status }: { status: Status }) {
    const style =
        status === "ok"
            ? "bg-green-100 text-green-800"
            : status === "fail"
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-800";
    const label = status === "ok" ? "Ansluten" : status === "fail" ? "Fel" : "Kontrollerar";
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>{label}</span>;
}
