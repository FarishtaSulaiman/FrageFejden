export type RoomMessage = any;
type WireMessage = { type: "HELLO" | "ACK" | "EVENT"; room: string; payload?: any };

/**
 * useRoomTransport
 * Lightweight cross-tab + WS transport scoped to a roomId.
 */
import { useEffect, useMemo, useRef, useState } from "react";

export function useRoomTransport(roomId: string, onMessage: (msg: RoomMessage) => void) {
  const bcRef = useRef<BroadcastChannel | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  // Compute WS URL safely (avoid wss://localhost on http)
  const WS_URL = useMemo(() => {
    const env = (import.meta as any)?.env?.VITE_DUEL_WS_URL as string | undefined;
    if (env && typeof env === "string") return env;
    const scheme = location.protocol === "https:" ? "wss" : "ws";
    return `${scheme}://${location.hostname}:3001`;
  }, []);

  // BroadcastChannel per-room
  useEffect(() => {
    try {
      bcRef.current = new BroadcastChannel(`duel-room-${roomId}`);
      bcRef.current.onmessage = (e: MessageEvent<any>) => {
        onMessage?.(e.data);
      };
    } catch {
      // ignore (Safari private mode etc.)
    }
    return () => {
      try {
        bcRef.current?.close();
      } catch {
        /* noop */
      }
      bcRef.current = null;
    };
  }, [roomId, onMessage]);

  // WebSocket per-room
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      const hello: WireMessage = { type: "HELLO", room: roomId };
      ws.send(JSON.stringify(hello));
    };

    ws.onmessage = (ev: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(ev.data) as WireMessage;
        if (msg.type === "EVENT" && msg.room === roomId) {
          onMessage?.(msg.payload);
          return;
        }
        // ACK is fine; nothing to do
      } catch {
        // ignore
      }
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => {
      try {
        ws.close();
      } catch {
        /* noop */
      }
    };

    return () => {
      try {
        ws.close();
      } catch {
        /* noop */
      }
      wsRef.current = null;
      setConnected(false);
    };
  }, [roomId, WS_URL, onMessage]);

  // Sender → BroadcastChannel + WS
  const send = (payload: RoomMessage) => {
    try {
      bcRef.current?.postMessage(payload);
    } catch {
      /* noop */
    }
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const msg: WireMessage = { type: "EVENT", room: roomId, payload };
      ws.send(JSON.stringify(msg));
    }
  };

  return { send, connected } as const;
}
