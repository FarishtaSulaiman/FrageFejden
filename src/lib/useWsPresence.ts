import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type PresenceUser = { id: string; name: string; ready?: boolean };
export type PresenceSnapshot = { room: string; users: PresenceUser[] };

type InMsg =
    | { type: "ACK"; room: string }
    | { type: "SNAPSHOT"; room: string; users: PresenceUser[] }
    | { type: "LEFT"; room: string; userId: string }
    | { type: "PONG" }
    | { type: "CONNECTED"; ts: number }
    | { type: string;[key: string]: any }; // Allow any custom messages

export function useWsPresence(room: string, me: PresenceUser | null) {
    const [connected, setConnected] = useState(false);
    const [users, setUsers] = useState<PresenceUser[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const messageHandlersRef = useRef<((data: any) => void)[]>([]);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

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
        console.log("[WS]", line);
        setLogs((l) => [new Date().toLocaleTimeString() + " " + line, ...l].slice(0, 200));
    }, []);

    const connect = useCallback(() => {
        if (!room || !me) return;

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            setReconnectAttempts(0);
            log(`OPEN -> HELLO "${room}" as ${me.name} (${me.id})`);
            ws.send(JSON.stringify({ type: "HELLO", room, user: { id: me.id, name: me.name } }));

            // Start ping interval
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
            }
            pingIntervalRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "PING" }));
                }
            }, 30000);
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

                // Handle any other custom message types
                log(`Custom message: ${msg.type}`);
                setLastMessage(msg);
                // Notify all registered handlers
                messageHandlersRef.current.forEach(handler => {
                    try {
                        handler(msg);
                    } catch (e) {
                        console.error('Error in message handler:', e);
                    }
                });
            } catch (e) {
                log("ERR parse: " + String(e));
            }
        };

        ws.onclose = (ev) => {
            setConnected(false);
            log(`CLOSE code=${ev.code} reason="${ev.reason}"`);

            // Clear ping interval
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = null;
            }

            // Attempt reconnection with exponential backoff
            if (ev.code !== 1000 && reconnectAttempts < 5) { // Don't reconnect if it was intentional
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                log(`Will reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/5)`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    setReconnectAttempts(prev => prev + 1);
                    connect();
                }, delay);
            }
        };

        ws.onerror = (e) => {
            log("ERROR " + String(e));
            setConnected(false);
        };
    }, [room, me, WS_URL, log, reconnectAttempts]);

    useEffect(() => {
        connect();

        return () => {
            // Clear timeouts
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = null;
            }

            // Close websocket
            if (wsRef.current) {
                try {
                    wsRef.current.send(JSON.stringify({ type: "LEAVE" }));
                } catch { }
                try {
                    wsRef.current.close(1000, "unmount");
                } catch { }
                wsRef.current = null;
            }

            setConnected(false);
            setUsers([]);
        };
    }, [connect]);

    const sendPing = useCallback(() => {
        try {
            wsRef.current?.send(JSON.stringify({ type: "PING" }));
        } catch { }
    }, []);

    /** Toggle my READY flag on the server */
    const setReady = useCallback((ready: boolean) => {
        try {
            wsRef.current?.send(JSON.stringify({ type: "READY", ready }));
        } catch { }
    }, []);

    /** Send custom message to other users in the room */
    const sendMessage = useCallback((data: any) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            log("Cannot send message: WebSocket not ready");
            return false;
        }

        try {
            // Send as a broadcast message to the room
            wsRef.current.send(JSON.stringify(data));
            log(`SENT MESSAGE: ${JSON.stringify(data).substring(0, 100)}`);
            return true;
        } catch (e) {
            log(`ERROR sending message: ${e}`);
            return false;
        }
    }, [log]);

    /** Register a handler for incoming custom messages */
    const onMessage = useCallback((handler: (data: any) => void) => {
        messageHandlersRef.current.push(handler);

        return () => {
            messageHandlersRef.current = messageHandlersRef.current.filter(h => h !== handler);
        };
    }, []);

    return {
        connected,
        users,
        logs,
        sendPing,
        setReady,
        sendMessage,
        onMessage,
        lastMessage
    };
}