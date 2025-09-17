/**
 * server/ws-presence.cjs
 * Run: node server/ws-presence.cjs
 *
 * Supported messages from clients:
 * - { type:"HELLO", room:"duel-<id>", user:{id,name} }          // join a duel room (presence)
 * - { type:"READY", ready:boolean }                              // toggle ready in current room
 * - { type:"HELLO_USER", user:{id,name} }                        // connect as a user (no room)
 * - { type:"NOTIFY", toUserId:"...", event:"INVITED", payload }  // direct notify to userId
 * - { type:"LEAVE" }                                             // leave current room (if any)
 * - { type:"PING" }                                              // keep-alive
 *
 * Server emits:
 * - { type:"CONNECTED", ts }          // once on open
 * - { type:"ACK", room }              // after HELLO (room)
 * - { type:"ACK_USER" }               // after HELLO_USER
 * - { type:"SNAPSHOT", room, users:[{id,name,ready}] }  // room presence
 * - { type:"LEFT", room, userId }     // optional informational
 * - { type:"PONG" }                   // reply to PING
 * - { type: <event>, payload }        // for NOTIFY, e.g. {type:"INVITED", payload:{...}}
 */

const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = Number(process.env.PORT || 3001);
const server = http.createServer();
const wss = new WebSocketServer({ server, clientTracking: true });

/** roomId -> Set<ws> */
const rooms = new Map();
/** ws -> {room: string|null, user:{id,name}, ready:boolean} */
const meta = new WeakMap();

function getUsersInRoom(room) {
    const set = rooms.get(room);
    if (!set) return [];
    const users = [];
    for (const ws of set) {
        const m = meta.get(ws);
        if (m?.user) users.push({ ...m.user, ready: !!m.ready });
    }
    return users;
}

function joinRoom(ws, room, user) {
    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room).add(ws);
    meta.set(ws, { room, user, ready: false });
}

function leaveRoom(ws) {
    const m = meta.get(ws);
    if (!m) return;
    const set = rooms.get(m.room);
    if (set) {
        set.delete(ws);
        if (set.size === 0) rooms.delete(m.room);
    }
    const info = { room: m.room, userId: m.user?.id };
    // keep their user so we can still match NOTIFY sockets even if not in a room
    // If you want to fully forget the socket (recommended), do:
    meta.delete(ws);
    return info;
}

function broadcast(room, payload, except = null) {
    const set = rooms.get(room);
    if (!set) return;
    const msg = JSON.stringify(payload);
    for (const ws of set) {
        if (ws !== except && ws.readyState === ws.OPEN) {
            try { ws.send(msg); } catch { }
        }
    }
}

function sendToUser(userId, payload) {
    const msg = JSON.stringify(payload);
    for (const client of wss.clients) {
        try {
            const m = meta.get(client);
            if (client.readyState === client.OPEN && m?.user?.id === userId) {
                client.send(msg);
            }
        } catch { }
    }
}

wss.on("connection", (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`🔗 WS connection from ${ip}`);

    // keep-alive
    ws.isAlive = true;
    ws.on("pong", () => (ws.isAlive = true));

    // greet
    try { ws.send(JSON.stringify({ type: "CONNECTED", ts: Date.now() })); } catch { }

    ws.on("message", (raw) => {
        let data;
        try { data = JSON.parse(String(raw)); } catch { return; }
        if (!data || typeof data !== "object") return;

        // ---- Room presence ----
        if (data.type === "HELLO" && typeof data.room === "string" && data.user?.id) {
            const user = { id: String(data.user.id), name: String(data.user.name || "User") };
            joinRoom(ws, data.room, user);
            console.log(`👤 ${user.name} (${user.id}) joined ${data.room}`);
            try { ws.send(JSON.stringify({ type: "ACK", room: data.room })); } catch { }

            const users = getUsersInRoom(data.room);
            broadcast(data.room, { type: "SNAPSHOT", room: data.room, users });
            return;
        }

        if (data.type === "READY" && typeof data.ready === "boolean") {
            const m = meta.get(ws);
            if (!m || !m.room) return;
            m.ready = !!data.ready;
            const users = getUsersInRoom(m.room);
            broadcast(m.room, { type: "SNAPSHOT", room: m.room, users });
            return;
        }

        // ---- User-only (no room) connection for global notifications ----
        if (data.type === "HELLO_USER" && data.user?.id) {
            const user = { id: String(data.user.id), name: String(data.user.name || "User") };
            meta.set(ws, { room: null, user, ready: false });
            console.log(`👤 ${user.name} (${user.id}) connected (HELLO_USER)`);
            try { ws.send(JSON.stringify({ type: "ACK_USER" })); } catch { }
            return;
        }

        // ---- Direct NOTIFY to userId (works regardless of rooms) ----
        // Example:
        // { type:"NOTIFY", toUserId:"...", event:"INVITED", payload:{ duelId, subject, fromName } }
        if (data.type === "NOTIFY" && data.toUserId && data.event) {
            const to = String(data.toUserId);
            const event = String(data.event);
            const payload = data.payload || {};
            console.log(`📣 NOTIFY -> ${to} (${event})`);
            sendToUser(to, { type: event, payload });
            return;
        }

        // ---- Leave current room (if any) ----
        if (data.type === "LEAVE") {
            const res = leaveRoom(ws);
            if (res?.room) {
                console.log(`👋 ${res.userId} left ${res.room}`);
                broadcast(res.room, { type: "LEFT", room: res.room, userId: res.userId });
                const users = getUsersInRoom(res.room);
                broadcast(res.room, { type: "SNAPSHOT", room: res.room, users });
            }
            return;
        }

        // ---- Ping/pong ----
        if (data.type === "PING") {
            try { ws.send(JSON.stringify({ type: "PONG" })); } catch { }
            return;
        }
    });

    ws.on("close", () => {
        const res = leaveRoom(ws);
        if (res?.room) {
            console.log(`🔌 close -> ${res.userId} left ${res.room}`);
            broadcast(res.room, { type: "LEFT", room: res.room, userId: res.userId });
            const users = getUsersInRoom(res.room);
            broadcast(res.room, { type: "SNAPSHOT", room: res.room, users });
        }
    });

    ws.on("error", () => {
        const res = leaveRoom(ws);
        if (res?.room) {
            console.log(`💥 error -> ${res.userId} left ${res.room}`);
            broadcast(res.room, { type: "LEFT", room: res.room, userId: res.userId });
            const users = getUsersInRoom(res.room);
            broadcast(res.room, { type: "SNAPSHOT", room: res.room, users });
        }
    });
});

// optional ping to drop dead connections
const interval = setInterval(() => {
    for (const ws of wss.clients) {
        if (!ws.isAlive) {
            try { ws.terminate(); } catch { }
            continue;
        }
        ws.isAlive = false;
        try { ws.ping(); } catch { }
    }
}, 30000);

wss.on("close", () => clearInterval(interval));

server.listen(PORT, () => {
    console.log(`🚀 Presence WS listening on ws://localhost:${PORT}`);
});
