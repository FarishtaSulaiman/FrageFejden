// WebSocket + BroadcastChannel fallback transport for Duel rooms
// Usage: const { send, connected } = useRoomTransport(roomId, onMessage)

export type RoomMessage = any;

type WireMessage = { type: string; room: string; payload?: any };

const WS_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_DUEL_WS_URL) ||
  (location.protocol === "https:" ? "wss://localhost:3001" : "ws://localhost:3001");

export function useRoomTransport(
  roomId: string,
  onMessage: (msg: RoomMessage) => void
) {
  // Fallback: BroadcastChannel for local multi-tabs
  const bcRef: { current: BroadcastChannel | null } =
    (window as any).__duel_bc_ref || { current: null };
  (window as any).__duel_bc_ref = bcRef;

  const wsRef: { current: WebSocket | null } =
    (window as any).__duel_ws_ref || { current: null };
  (window as any).__duel_ws_ref = wsRef;

  // Init BC per room
  if (!bcRef.current) {
    try {
      bcRef.current = new BroadcastChannel(`duel-room-${roomId}`);
      bcRef.current.onmessage = (e: MessageEvent<any>) => {
        onMessage(e.data);
      };
    } catch {
      // Ignore if not supported
    }
  }

  function connectWs() {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      const hello: WireMessage = { type: "HELLO", room: roomId };
      ws.send(JSON.stringify(hello));
    };

    ws.onmessage = (ev: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(ev.data) as WireMessage;
        if (msg.room === roomId) onMessage(msg.payload ?? msg);
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => setTimeout(() => connectWs(), 750);
    ws.onerror = () => {
      try {
        ws.close();
      } catch {}
    };
  }

  if (!wsRef.current || wsRef.current.readyState > 1) {
    try {
      connectWs();
    } catch {}
  }

  const send = (payload: RoomMessage) => {
    // BroadcastChannel fan-out
    try {
      bcRef.current?.postMessage(payload);
    } catch {}

    // WebSocket fan-out
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const msg: WireMessage = { type: "EVENT", room: roomId, payload };
      ws.send(JSON.stringify(msg));
    }
  };

  const connected = !!wsRef.current && wsRef.current.readyState === WebSocket.OPEN;

  return { send, connected } as const;
}
