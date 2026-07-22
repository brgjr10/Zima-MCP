import express from "express";
import { SSHSessionManager } from "./ssh-manager.js";
import { toolDefinitions } from "./tools.js";
const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }
    next();
});
const sessionManager = new SSHSessionManager();
const sessions = new Map();
setInterval(() => sessionManager.cleanupIdleSessions(), 5 * 60 * 1000);
// MCP SSE endpoint
app.get("/sse", (req, res) => {
    const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    });
    res.flushHeaders?.();
    sessions.set(sessionId, res);
    console.log(`SSE connected: ${sessionId}`);
    res.write(`event: endpoint\ndata: /messages?sessionId=${sessionId}\n\n`);
    const keepAlive = setInterval(() => {
        if (res.writableEnded) {
            clearInterval(keepAlive);
            return;
        }
        res.write(": keep-alive\n\n");
    }, 5000);
    req.on("close", () => {
        console.log(`SSE closed: ${sessionId}`);
        clearInterval(keepAlive);
        sessions.delete(sessionId);
    });
});
app.post("/messages", async (req, res) => {
    const sessionId = new URL(req.url, `http://${req.headers.host}`).searchParams.get("sessionId");
    if (!sessionId || !sessions.has(sessionId)) {
        res.writeHead(400);
        res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Invalid session" } }));
        return;
    }
    try {
        const message = req.body;
        console.log(`MSG ${sessionId}: ${message.method}`);
        const response = await processMCPMessage(message);
        const sessionRes = sessions.get(sessionId);
        if (sessionRes && !sessionRes.writableEnded) {
            sessionRes.write(`data: ${JSON.stringify(response)}\n\n`);
            console.log(`RES ${sessionId}: sent response`);
        }
        else {
            console.log(`RES ${sessionId}: session not found or ended`);
        }
        res.writeHead(202, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", result: {} }));
    }
    catch (err) {
        console.error(`ERR ${sessionId}:`, err.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
    }
});
async function processMCPMessage(message) {
    const id = message.id;
    const method = message.method;
    const params = message.params;
    switch (method) {
        case "initialize": {
            return {
                jsonrpc: "2.0",
                id,
                result: {
                    protocolVersion: "2024-11-05",
                    capabilities: { tools: {} },
                    serverInfo: { name: "zima-ssh-terminal", version: "1.0.0" },
                },
            };
        }
        case "initialized":
            return { jsonrpc: "2.0", id, result: {} };
        case "tools/list": {
            return { jsonrpc: "2.0", id, result: { tools: toolDefinitions } };
        }
        case "tools/call": {
            const toolName = params?.name;
            const toolArgs = params?.arguments;
            const result = await handleToolCall(toolName, toolArgs);
            return { jsonrpc: "2.0", id, result };
        }
        case "ping":
            return { jsonrpc: "2.0", id, result: {} };
        default:
            return {
                jsonrpc: "2.0",
                id,
                error: { code: -32601, message: `Method not found: ${method}` },
            };
    }
}
async function handleToolCall(name, args) {
    const { defineTools } = await import("./tools.js");
    const tools = defineTools(sessionManager);
    if (!tools[name]) {
        return {
            content: [{ type: "text", text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
            isError: true,
        };
    }
    return tools[name](args);
}
// REST API for web UI
app.get("/api/sessions", (_req, res) => {
    res.json({ sessions: sessionManager.listSessions() });
});
app.post("/api/sessions", (req, res) => {
    const { user, shell } = req.body;
    if (!user) {
        return res.status(400).json({ error: "user is required" });
    }
    const id = sessionManager.createSession(user || "root", shell || "/bin/bash");
    res.json({ sessionId: id, user: user || "root", shell: shell || "/bin/bash" });
});
app.post("/api/sessions/:id/input", (req, res) => {
    const { id } = req.params;
    const { input } = req.body;
    if (!input) {
        return res.status(400).json({ error: "input is required" });
    }
    const sent = sessionManager.writeToSession(id, input);
    res.json({ success: sent, bytesWritten: sent ? input.length : 0 });
});
app.get("/api/sessions/:id/output", (req, res) => {
    const { id } = req.params;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 8192;
    const output = sessionManager.readFromSession(id, offset, limit);
    const totalLength = sessionManager.getBufferLength(id);
    res.json({ output, offset, length: output.length, totalLength });
});
app.delete("/api/sessions/:id", (req, res) => {
    const { id } = req.params;
    const success = sessionManager.disconnectSession(id);
    res.json({ success, message: success ? "Session closed" : "Session not found" });
});
app.get("/api/sessions/:id/info", (req, res) => {
    const { id } = req.params;
    const info = sessionManager.getSessionInfo(id);
    if (!info) {
        return res.status(404).json({ error: "Session not found" });
    }
    res.json(info);
});
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
const PORT = parseInt(process.env.PORT || "9761");
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Zima SSH Terminal MCP server listening on :${PORT}`);
});
//# sourceMappingURL=web-server.js.map