import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type PresenceUser = { id: string; name: string; ready?: boolean };
export type PresenceSnapshot = { room: string; users: PresenceUser[] };

type InMsg =
    | { type: "ACK"; room: string }
    | { type: "SNAPSHOT"; room: string; users: PresenceUser[] }
    | { type: "LEFT"; room: string; userId: string }
    | { type: "PONG" }
    | { type: "CONNECTED"; ts: number };

export function useWsPresence(room: string, me: PresenceUser | null) {
    const [connected, setConnected] = useState(false);
    const [users, setUsers] = useState<PresenceUser[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    const WS_URL = useMemo(() => {
        const env = (import.meta as any)?.env?.VITE_DUEL_WS_URL as string | undefined;
        if (env) {
            if (env.startsWith("/")) {
                const scheme = location.protocol === "https:" ? "wss" : "ws";
                return `${scheme}://${location.host}${env}`;
            }
            return env;
        }
        const scheme = location.protocol === "https:" ? "wss" : "ws";
        return `${scheme}://${location.hostname}:3001`;
    }, []);

    const log = useCallback((line: string) => {
        setLogs((l) => [new Date().toLocaleTimeString() + " " + line, ...l].slice(0, 200));
    }, []);

    useEffect(() => {
        if (!room || !me) return;

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            log(`OPEN -> HELLO "${room}" as ${me.name} (${me.id})`);
            ws.send(JSON.stringify({ type: "HELLO", room, user: { id: me.id, name: me.name } }));
        };

        ws.onmessage = (ev: MessageEvent<string>) => {
            try {
                const msg = JSON.parse(ev.data) as InMsg;
                if (msg.type === "ACK") {
                    log(`ACK room=${msg.room}`);
                    return;
                }
                if (msg.type === "CONNECTED") {
                    log(`CONNECTED (ts:${msg.ts})`);
                    return;
                }
                if (msg.type === "SNAPSHOT") {
                    log(`SNAPSHOT users=${msg.users.length}`);
                    setUsers(msg.users);
                    return;
                }
                if (msg.type === "LEFT") {
                    log(`LEFT ${msg.userId}`);
                    setUsers((u) => u.filter((x) => x.id !== msg.userId));
                    return;
                }
                if (msg.type === "PONG") {
                    log(`PONG`);
                    return;
                }
            } catch (e) {
                log("ERR parse: " + String(e));
            }
        };

        ws.onclose = (ev) => {
            setConnected(false);
            log(`CLOSE code=${ev.code} reason="${ev.reason}"`);
        };
        ws.onerror = (e) => {
            log("ERROR " + String(e));
            try { ws.close(); } catch { }
        };

        return () => {
            try { ws.send(JSON.stringify({ type: "LEAVE" })); } catch { }
            try { ws.close(1000, "unmount"); } catch { }
            wsRef.current = null;
            setConnected(false);
        };
    }, [room, me, WS_URL, log]);

    const sendPing = () => {
        try { wsRef.current?.send(JSON.stringify({ type: "PING" })); } catch { }
    };

    /** Toggle my READY flag on the server */
    const setReady = (ready: boolean) => {
        try { wsRef.current?.send(JSON.stringify({ type: "READY", ready })); } catch { }
    };

    return { connected, users, logs, sendPing, setReady };
}
