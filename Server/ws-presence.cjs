/**
 * server/ws-presence.cjs
 * Kör: node server/ws-presence.cjs
 *
 * Meddelanden från klient:
 * - { type:"HELLO", room:"duel-<id>", user:{id,name} }          // gå med i ett duell-rum (närvaro)
 * - { type:"READY", ready:boolean }                              // slå på/av "redo" i aktuellt rum
 * - { type:"HELLO_USER", user:{id,name} }                        // anslut som användare utan rum (för globala notiser)
 * - { type:"NOTIFY", toUserId:"...", event:"INVITED", payload }  // skicka direkt-notis till en viss användare
 * - { type:"LEAVE" }                                             // lämna nuvarande rum (om något)
 * - { type:"PING" }                                              // håll-vid-liv (klienten pingar, servern svarar)
 *
 * Meddelanden från server:
 * - { type:"CONNECTED", ts }                        // skickas direkt vid anslutning
 * - { type:"ACK", room }                            // kvittens efter HELLO (rum)
 * - { type:"ACK_USER" }                             // kvittens efter HELLO_USER
 * - { type:"SNAPSHOT", room, users:[{id,name,ready}] }  // aktuell närvarolista för ett rum
 * - { type:"LEFT", room, userId }                   // info om att en spelare lämnat
 * - { type:"PONG" }                                 // svar på PING
 * - { type: <event>, payload }                      // direkthändelser (NOTIFY), t.ex. {type:"INVITED", payload:{...}}
 */

const http = require("http");
const { WebSocketServer } = require("ws");

// Port för websocket-servern
const PORT = Number(process.env.PORT || 3001);

// Skapa enkel HTTP-server (behövs för ws)
const server = http.createServer();

// Starta WebSocketServer och låt den använda HTTP-servern
const wss = new WebSocketServer({ server, clientTracking: true });

/**
 * Datastrukturer:
 * - rooms: Map<roomId, Set<ws>> håller vilka websockets som är i vilket rum
 * - meta: WeakMap<ws, { room: string|null, user:{id,name}, ready:boolean }>
 *   hör ihop med varje anslutning och lagrar vem/vilket rum/redo-status
 */
const rooms = new Map();
const meta = new WeakMap();

/**
 * Hämtar alla användare i ett visst rum, inklusive deras "ready"-flagga.
 * Returnerar [{id,name,ready}, ...].
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
 * Låt en socket gå med i ett rum, och spara user + resetta ready=false.
 */
function joinRoom(ws, room, user) {
    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room).add(ws);
    meta.set(ws, { room, user, ready: false });
}

/**
 * Låt en socket lämna sitt rum (om den var med i något) och ta bort från mappar.
 * Returnerar { room, userId } för loggning/utsändning.
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
    // Vi tar bort meta helt (enklare och säkert)
    meta.delete(ws);
    return info;
}

/**
 * Skicka ett meddelande till alla i ett rum.
 * - payload: valfritt JS-objekt som serialiseras till JSON
 * - except: skicka inte till denna socket (ex. avsändaren) om satt
 */
function broadcast(room, payload, except = null) {
    const set = rooms.get(room);
    if (!set) return;
    const msg = JSON.stringify(payload);
    for (const ws of set) {
        if (ws !== except && ws.readyState === ws.OPEN) {
            try { ws.send(msg); } catch { /* ignorera sändfel */ }
        }
    }
}

/**
 * Skicka ett direktmeddelande till en viss användare (oavsett rum).
 * Går igenom alla öppna klienter, läser meta och matchar på user.id.
 */
function sendToUser(userId, payload) {
    const msg = JSON.stringify(payload);
    for (const client of wss.clients) {
        try {
            const m = meta.get(client);
            if (client.readyState === client.OPEN && m?.user?.id === userId) {
                client.send(msg);
            }
        } catch { /* ignorera sändfel */ }
    }
}

/**
 * När en klient ansluter:
 * - sätt upp ping/pong för att känna av döda anslutningar
 * - skicka ett CONNECTED-meddelande
 * - lyssna på inkommande meddelanden (HELLO, READY, HELLO_USER, NOTIFY, LEAVE, PING)
 * - hantera stängning och fel
 */
wss.on("connection", (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`🔗 WS-anslutning från ${ip}`);

    // En enkel isAlive-flagga som sätts på "pong"
    ws.isAlive = true;
    ws.on("pong", () => (ws.isAlive = true));

    // Hälsa välkommen – klienten vet då att koppling finns
    try { ws.send(JSON.stringify({ type: "CONNECTED", ts: Date.now() })); } catch { }

    ws.on("message", (raw) => {
        let data;
        try { data = JSON.parse(String(raw)); } catch { return; }
        if (!data || typeof data !== "object") return;

        // ==== Rum/presence: gå med i ett rum (HELLO) ====
        if (data.type === "HELLO" && typeof data.room === "string" && data.user?.id) {
            const user = { id: String(data.user.id), name: String(data.user.name || "User") };
            joinRoom(ws, data.room, user);
            console.log(`👤 ${user.name} (${user.id}) gick med i ${data.room}`);

            // Kvittens till den som gick med
            try { ws.send(JSON.stringify({ type: "ACK", room: data.room })); } catch { }

            // Skicka ut färsk snapshot till alla i rummet
            const users = getUsersInRoom(data.room);
            broadcast(data.room, { type: "SNAPSHOT", room: data.room, users });
            return;
        }

        // ==== Byt "redo"-status i aktuellt rum ====
        if (data.type === "READY" && typeof data.ready === "boolean") {
            const m = meta.get(ws);
            if (!m || !m.room) return;
            m.ready = !!data.ready;
            // Ny snapshot till rummet
            const users = getUsersInRoom(m.room);
            broadcast(m.room, { type: "SNAPSHOT", room: m.room, users });
            return;
        }

        // ==== Anslut som "global användare" utan rum (för att ta emot notiser överallt) ====
        if (data.type === "HELLO_USER" && data.user?.id) {
            const user = { id: String(data.user.id), name: String(data.user.name || "User") };
            meta.set(ws, { room: null, user, ready: false });
            console.log(`👤 ${user.name} (${user.id}) anslöt (HELLO_USER)`);
            try { ws.send(JSON.stringify({ type: "ACK_USER" })); } catch { }
            return;
        }

        /**
         * ==== Direkthändelse/Notis till viss användare (NOTIFY) ====
         * Exempel:
         * { type:"NOTIFY", toUserId:"...", event:"INVITED", payload:{ duelId, subject, fromName } }
         * Servern skickar vidare detta som { type: event, payload } till den användaren.
         */
        if (data.type === "NOTIFY" && data.toUserId && data.event) {
            const to = String(data.toUserId);
            const event = String(data.event);
            const payload = data.payload || {};
            console.log(`📣 NOTIFY -> ${to} (${event})`);
            sendToUser(to, { type: event, payload });
            return;
        }

        // ==== Lämna nuvarande rum ====
        if (data.type === "LEAVE") {
            const res = leaveRoom(ws);
            if (res?.room) {
                console.log(`👋 ${res.userId} lämnade ${res.room}`);
                broadcast(res.room, { type: "LEFT", room: res.room, userId: res.userId });
                const users = getUsersInRoom(res.room);
                broadcast(res.room, { type: "SNAPSHOT", room: res.room, users });
            }
            return;
        }

        // ==== Ping/pong (klienten pingar, servern svarar) ====
        if (data.type === "PING") {
            try { ws.send(JSON.stringify({ type: "PONG" })); } catch { }
            return;
        }
    });

    // Stängning: ta bort från rum och uppdatera snapshot
    ws.on("close", () => {
        const res = leaveRoom(ws);
        if (res?.room) {
            console.log(`🔌 stängd -> ${res.userId} lämnade ${res.room}`);
            broadcast(res.room, { type: "LEFT", room: res.room, userId: res.userId });
            const users = getUsersInRoom(res.room);
            broadcast(res.room, { type: "SNAPSHOT", room: res.room, users });
        }
    });

    // Fel: behandla som stängning
    ws.on("error", () => {
        const res = leaveRoom(ws);
        if (res?.room) {
            console.log(`💥 fel -> ${res.userId} lämnade ${res.room}`);
            broadcast(res.room, { type: "LEFT", room: res.room, userId: res.userId });
            const users = getUsersInRoom(res.room);
            broadcast(res.room, { type: "SNAPSHOT", room: res.room, users });
        }
    });
});

/**
 * En enkel intervall som pingar alla anslutningar för att upptäcka trasiga
 * kopplingar. Om en klient inte svarar med "pong" så termineras den.
 */
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

// Städa när servern stängs
wss.on("close", () => clearInterval(interval));

// Starta servern
server.listen(PORT, () => {
    console.log(`🚀 Presence-WS lyssnar på ws://localhost:${PORT}`);
});
