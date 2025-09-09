/**
 * Minimal room-based WebSocket relay
 * Run: node server/ws-duel-server.cjs
 * Default: ws://localhost:3001
 */
const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = Number(process.env.PORT || 3001);

const server = http.createServer();
const wss = new WebSocketServer({ server });

// room -> Set<WebSocket>
const rooms = new Map();

function joinRoom(ws, room) {
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room).add(ws);
  ws._room = room;
}

function leaveRoom(ws) {
  const room = ws._room;
  if (!room) return;
  const set = rooms.get(room);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) rooms.delete(room);
}

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let data;
    try {
      data = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (!data || typeof data !== "object") return;

    if (data.type === "HELLO" && typeof data.room === "string") {
      joinRoom(ws, data.room);
      ws.send(JSON.stringify({ type: "ACK", room: data.room }));
      return;
    }

    if (data.type === "EVENT" && typeof data.room === "string") {
      const room = data.room;
      const set = rooms.get(room);
      if (!set) return;
      for (const peer of set) {
        if (peer !== ws && peer.readyState === peer.OPEN) {
          peer.send(JSON.stringify({ type: "EVENT", room, payload: data.payload }));
        }
      }
    }
  });

  ws.on("close", () => leaveRoom(ws));
  ws.on("error", () => leaveRoom(ws));
});

server.listen(PORT, () => {
  console.log(`WS relay listening on ws://localhost:${PORT}`);
});
