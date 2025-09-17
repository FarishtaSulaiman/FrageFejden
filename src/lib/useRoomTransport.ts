import { useEffect, useMemo, useRef, useState } from "react";

export type RoomMessage = any;
type WireMessage = { type: "HELLO" | "ACK" | "EVENT"; room: string; payload?: any };

export function useRoomTransport(roomId: string, onMessage: (msg: RoomMessage) => void) {
    const bcRef = useRef<BroadcastChannel | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);

    // message queue for sends before socket is OPEN
    const sendQueueRef = useRef<RoomMessage[]>([]);
    const mountedRef = useRef(true);

    // Compute WS URL (env or fallback; supports proxy path)
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

    // BroadcastChannel per-room
    useEffect(() => {
        if (!roomId) return;
        try {
            bcRef.current = new BroadcastChannel(`duel-room-${roomId}`);
            bcRef.current.onmessage = (e: MessageEvent<any>) => onMessage?.(e.data);
        } catch { }
        return () => {
            try { bcRef.current?.close(); } catch { }
            bcRef.current = null;
        };
    }, [roomId, onMessage]);

    // WebSocket (connect/cleanup)
    useEffect(() => {
        mountedRef.current = true;
        if (!roomId) {
            setConnected(false);
            return;
        }

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            if (!mountedRef.current) return;
            setConnected(true);
            // join room
            const hello: WireMessage = { type: "HELLO", room: roomId };
            ws.send(JSON.stringify(hello));
            // flush queued messages
            const q = sendQueueRef.current;
            sendQueueRef.current = [];
            for (const payload of q) {
                ws.send(JSON.stringify({ type: "EVENT", room: roomId, payload } satisfies WireMessage));
            }
        };

        ws.onmessage = (ev: MessageEvent<string>) => {
            if (!mountedRef.current) return;
            try {
                const msg = JSON.parse(ev.data) as WireMessage;
                if (msg.type === "EVENT" && msg.room === roomId) onMessage?.(msg.payload);
            } catch { }
        };

        ws.onclose = () => setConnected(false);
        ws.onerror = () => {
            try { ws.close(); } catch { }
        };

        return () => {
            mountedRef.current = false;
            try { ws.close(1000, "component unmount"); } catch { }
            wsRef.current = null;
            setConnected(false);
            // don’t drop queued messages on unmount — leave them; JOIN/LEAVE is handled by caller
        };
    }, [roomId, WS_URL, onMessage]);

    // Sender: BC + WS (queue if not open)
    const send = (payload: RoomMessage) => {
        // cross-tab (no-op if not supported)
        try { bcRef.current?.postMessage(payload); } catch { }

        // ws
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            const msg: WireMessage = { type: "EVENT", room: roomId, payload };
            try { ws.send(JSON.stringify(msg)); } catch { }
        } else {
            // queue until onopen flush
            sendQueueRef.current.push(payload);
        }
    };

    return { send, connected } as const;
}
