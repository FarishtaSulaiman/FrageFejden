import React from "react";
import { useWsPresence } from "../../lib/useWsPresence";

// persist one id per tab so you can open multiple tabs & see both
function useStableId() {
    const [id] = React.useState<string>(() => {
        const k = "ws_lab_id";
        const existing = sessionStorage.getItem(k);
        if (existing) return existing;
        const v = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        sessionStorage.setItem(k, v);
        return v;
    });
    return id;
}

export default function WsLab(): React.ReactElement {
    const url = new URL(window.location.href);
    const initialRoom = url.searchParams.get("room") || "test-room";
    const initialName = url.searchParams.get("name") || "Player";

    const myId = useStableId();
    const [room, setRoom] = React.useState(initialRoom);
    const [name, setName] = React.useState(initialName);

    const me = React.useMemo(() => ({ id: myId, name: name.trim() || "Player" }), [myId, name]);
    const { connected, users, logs, sendPing, sendLeave } = useWsPresence(room.trim(), me);

    return (
        <div className="min-h-screen bg-[#0A0F1F] text-white">
            <div className="mx-auto max-w-3xl p-6 space-y-6">
                <h1 className="text-2xl font-extrabold">WS Presence Lab</h1>

                <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block">
                        <div className="text-xs text-white/70 mb-1">Room</div>
                        <input
                            className="w-full h-10 rounded-lg bg-white/10 px-3 text-sm outline-none ring-1 ring-white/10"
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                        />
                    </label>
                    <label className="block">
                        <div className="text-xs text-white/70 mb-1">Your name</div>
                        <input
                            className="w-full h-10 rounded-lg bg-white/10 px-3 text-sm outline-none ring-1 ring-white/10"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </label>
                    <div className="flex items-end gap-2">
                        <span
                            className={`inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold ${connected ? "bg-emerald-600" : "bg-rose-600"
                                }`}
                        >
                            {connected ? "Connected" : "Disconnected"}
                        </span>
                        <button
                            type="button"
                            onClick={sendPing}
                            className="h-10 rounded-lg bg-[#6B6F8A] px-3 text-xs font-semibold hover:brightness-110"
                        >
                            PING
                        </button>
                        <button
                            type="button"
                            onClick={sendLeave}
                            className="h-10 rounded-lg bg-[#6B6F8A] px-3 text-xs font-semibold hover:brightness-110"
                            title="Send LEAVE (server will also remove you when tab closes)"
                        >
                            LEAVE
                        </button>
                    </div>
                </div>

                <section className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-[#0F1728] p-4 ring-1 ring-white/10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">People in room</h2>
                            <span className="text-xs text-white/60">{users.length}</span>
                        </div>
                        <div className="mt-3 space-y-2">
                            {users.map((u) => (
                                <div
                                    key={u.id}
                                    className={`flex items-center justify-between rounded-lg px-3 py-2 ${u.id === myId ? "bg-emerald-600/20" : "bg-white/5"
                                        }`}
                                >
                                    <span className="text-sm">
                                        {u.name} <span className="text-white/50">({u.id.slice(0, 8)})</span>
                                    </span>
                                    {u.id === myId && <span className="text-xs text-emerald-300">you</span>}
                                </div>
                            ))}
                            {users.length === 0 && (
                                <div className="text-sm text-white/60">No one here (open another tab!)</div>
                            )}
                        </div>
                        <div className="mt-3 text-xs text-white/60">
                            Tip: open a second tab with{" "}
                            <code className="bg-white/10 px-1 py-0.5 rounded">/ws-lab?room={room}</code> to see presence change.
                        </div>
                    </div>

                    <div className="rounded-xl bg-[#0F1728] p-4 ring-1 ring-white/10">
                        <h2 className="text-lg font-semibold">Socket log</h2>
                        <div className="mt-3 h-[260px] overflow-auto rounded bg-black/30 p-2 text-xs leading-relaxed">
                            {logs.map((l, i) => (
                                <div key={i} className="whitespace-pre-wrap">{l}</div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
