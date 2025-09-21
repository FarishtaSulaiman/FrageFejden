/**
 * server/ws-presence.cjs
 * Run: node server/ws-presence.cjs
 *
 * Messages from client:
 * - { type:"HELLO", room:"duel-<id>", user:{id,name} }          // join a duel room (presence)
 * - { type:"READY", ready:boolean }                              // toggle "ready" in current room
 * - { type:"HELLO_USER", user:{id,name} }                        // connect as user without room (for global notifications)
 * - { type:"NOTIFY", toUserId:"...", event:"INVITED", payload }  // send direct notification to specific user
 * - { type:"LEAVE" }                                             // leave current room (if any)
 * - { type:"PING" }                                              // keep-alive (client pings, server responds)
 * - Any other message with type field                            // custom game messages to broadcast
 *
 * Messages from server:
 * - { type:"CONNECTED", ts }                        // sent immediately on connection
 * - { type:"ACK", room }                            // acknowledgment after HELLO (room)
 * - { type:"ACK_USER" }                             // acknowledgment after HELLO_USER
 * - { type:"SNAPSHOT", room, users:[{id,name,ready}] }  // current presence list for a room
 * - { type:"LEFT", room, userId }                   // info that a player left
 * - { type:"PONG" }                                 // response to PING
 * - { type: <event>, payload }                      // direct events (NOTIFY), e.g. {type:"INVITED", payload:{...}}
 * - Any custom message                              // relayed custom game messages
 */

const http = require("http");
const { WebSocketServer } = require("ws");

// Port for websocket server
const PORT = Number(process.env.PORT || 3001);

// Create simple HTTP server (needed for ws)
const server = http.createServer();

// Start WebSocketServer and let it use the HTTP server
const wss = new WebSocketServer({ server, clientTracking: true });

/**
 * Data structures:
 * - rooms: Map<roomId, Set<ws>> holds which websockets are in which room
 * - meta: WeakMap<ws, { room: string|null, user:{id,name}, ready:boolean }>
 *   associated with each connection and stores who/which room/ready status
 */
const rooms = new Map();
const meta = new WeakMap();

/**
 * Get all users in a specific room, including their "ready" flag.
 * Returns [{id,name,ready}, ...].
 */
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

/**
 * Let a socket join a room, and save user + reset ready=false.
 */
function joinRoom(ws, room, user) {
    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room).add(ws);
    meta.set(ws, { room, user, ready: false });
}

/**
 * Let a socket leave its room (if it was in any) and remove from maps.
 * Returns { room, userId } for logging/broadcasting.
 */
function leaveRoom(ws) {
    const m = meta.get(ws);
    if (!m) return;
    const set = rooms.get(m.room);
    if (set) {
        set.delete(ws);
        if (set.size === 0) rooms.delete(m.room);
    }
    const info = { room: m.room, userId: m.user?.id };
    // We remove meta completely (simpler and safe)
    meta.delete(ws);
    return info;
}

/**
 * Send a message to everyone in a room.
 * - payload: optional JS object that gets serialized to JSON
 * - except: don't send to this socket (e.g. the sender) if set
 */
function broadcast(room, payload, except = null) {
    const set = rooms.get(room);
    if (!set) return;
    const msg = JSON.stringify(payload);
    let sentCount = 0;
    for (const ws of set) {
        if (ws !== except && ws.readyState === ws.OPEN) {
            try {
                ws.send(msg);
                sentCount++;
            } catch {
                console.log(`Failed to send to client in room ${room}`);
            }
        }
    }
    console.log(`📢 Broadcast to ${room}: ${payload.type} (sent to ${sentCount} clients)`);
}

/**
 * Send a direct message to a specific user (regardless of room).
 * Goes through all open clients, reads meta and matches on user.id.
 */
function sendToUser(userId, payload) {
    const msg = JSON.stringify(payload);
    for (const client of wss.clients) {
        try {
            const m = meta.get(client);
            if (client.readyState === client.OPEN && m?.user?.id === userId) {
                client.send(msg);
                console.log(`📤 Direct message to ${userId}: ${payload.type}`);
            }
        } catch { /* ignore send errors */ }
    }
}

/**
 * When a client connects:
 * - set up ping/pong to detect dead connections
 * - send a CONNECTED message
 * - listen for incoming messages (HELLO, READY, HELLO_USER, NOTIFY, LEAVE, PING, custom)
 * - handle closure and errors
 */
wss.on("connection", (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`🔗 WS connection from ${ip}`);

    // A simple isAlive flag that gets set on "pong"
    ws.isAlive = true;
    ws.on("pong", () => (ws.isAlive = true));

    // Welcome - client knows connection exists
    try { ws.send(JSON.stringify({ type: "CONNECTED", ts: Date.now() })); } catch { }

    ws.on("message", (raw) => {
        let data;
        try { data = JSON.parse(String(raw)); } catch {
            console.log("Invalid JSON received");
            return;
        }
        if (!data || typeof data !== "object") return;

        console.log(`📥 Message from client: ${data.type}`);

        // ==== Room/presence: join a room (HELLO) ====
        if (data.type === "HELLO" && typeof data.room === "string" && data.user?.id) {
            const user = { id: String(data.user.id), name: String(data.user.name || "User") };
            joinRoom(ws, data.room, user);
            console.log(`👤 ${user.name} (${user.id}) joined ${data.room}`);

            // Acknowledgment to the one who joined
            try { ws.send(JSON.stringify({ type: "ACK", room: data.room })); } catch { }

            // Send fresh snapshot to everyone in the room
            const users = getUsersInRoom(data.room);
            broadcast(data.room, { type: "SNAPSHOT", room: data.room, users });
            return;
        }

        // ==== Change "ready" status in current room ====
        if (data.type === "READY" && typeof data.ready === "boolean") {
            const m = meta.get(ws);
            if (!m || !m.room) return;
            m.ready = !!data.ready;
            console.log(`⚡ ${m.user.name} ready status: ${m.ready} in ${m.room}`);
            // New snapshot to the room
            const users = getUsersInRoom(m.room);
            broadcast(m.room, { type: "SNAPSHOT", room: m.room, users });
            return;
        }

        // ==== Connect as "global user" without room (to receive notifications everywhere) ====
        if (data.type === "HELLO_USER" && data.user?.id) {
            const user = { id: String(data.user.id), name: String(data.user.name || "User") };
            meta.set(ws, { room: null, user, ready: false });
            console.log(`👤 ${user.name} (${user.id}) connected (HELLO_USER)`);
            try { ws.send(JSON.stringify({ type: "ACK_USER" })); } catch { }
            return;
        }

        /**
         * ==== Direct event/Notification to specific user (NOTIFY) ====
         * Example:
         * { type:"NOTIFY", toUserId:"...", event:"INVITED", payload:{ duelId, subject, fromName } }
         * Server forwards this as { type: event, payload } to that user.
         */
        if (data.type === "NOTIFY" && data.toUserId && data.event) {
            const to = String(data.toUserId);
            const event = String(data.event);
            const payload = data.payload || {};
            console.log(`📣 NOTIFY -> ${to} (${event})`);
            sendToUser(to, { type: event, payload });
            return;
        }

        // ==== Leave current room ====
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

        // ==== Ping/pong (client pings, server responds) ====
        if (data.type === "PING") {
            try { ws.send(JSON.stringify({ type: "PONG" })); } catch { }
            return;
        }

        // ==== Handle any other custom message types ====
        // These get broadcast to all other clients in the same room
        const m = meta.get(ws);
        if (m?.room && data.type) {
            console.log(`🎮 Custom message in ${m.room}: ${data.type}`);
            // Broadcast to all other clients in the room (excluding sender)
            broadcast(m.room, data, ws);
            broadcast(m.room, data);
            return;
        }

        console.log(`❓ Unhandled message type: ${data.type}`);
    });

    // Closure: remove from room and update snapshot
    ws.on("close", () => {
        const res = leaveRoom(ws);
        if (res?.room) {
            console.log(`🔌 closed -> ${res.userId} left ${res.room}`);
            broadcast(res.room, { type: "LEFT", room: res.room, userId: res.userId });
            const users = getUsersInRoom(res.room);
            broadcast(res.room, { type: "SNAPSHOT", room: res.room, users });
        }
    });

    // Error: treat as closure
    ws.on("error", (err) => {
        console.log(`💥 WebSocket error:`, err.message);
        const res = leaveRoom(ws);
        if (res?.room) {
            console.log(`💥 error -> ${res.userId} left ${res.room}`);
            broadcast(res.room, { type: "LEFT", room: res.room, userId: res.userId });
            const users = getUsersInRoom(res.room);
            broadcast(res.room, { type: "SNAPSHOT", room: res.room, users });
        }
    });
});

/**
 * A simple interval that pings all connections to detect broken
 * connections. If a client doesn't respond with "pong" it gets terminated.
 */
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
            try { ws.terminate(); } catch { }
            return;
        }
        ws.isAlive = false;
        try { ws.ping(); } catch { }
    });
}, 30000);

// Clean up when server shuts down
wss.on("close", () => clearInterval(interval));

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Presence-WS listening on ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down WebSocket server...');
    clearInterval(interval);
    wss.close(() => {
        server.close(() => {
            console.log('✅ Server shut down gracefully');
            process.exit(0);
        });
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received, shutting down WebSocket server...');
    clearInterval(interval);
    wss.close(() => {
        server.close(() => {
            console.log('✅ Server shut down gracefully');
            process.exit(0);
        });
    });
});