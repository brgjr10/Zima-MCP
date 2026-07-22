import { z } from "zod";
const terminalConnectSchema = z.object({
    user: z.string().default("root"),
    shell: z.string().default("/bin/bash"),
});
const terminalWriteSchema = z.object({
    sessionId: z.string().uuid(),
    input: z.string(),
});
const terminalReadSchema = z.object({
    sessionId: z.string().uuid(),
    offset: z.number().int().nonnegative().default(0),
    limit: z.number().int().positive().max(65536).default(4096),
});
const terminalDisconnectSchema = z.object({
    sessionId: z.string().uuid(),
});
const terminalExecuteSchema = z.object({
    sessionId: z.string().uuid(),
    command: z.string().min(1),
    timeout: z.number().int().positive().max(120).default(30),
});
export function defineTools(manager) {
    return {
        "terminal_connect": async (args) => {
            const parsed = terminalConnectSchema.parse(args);
            const id = manager.createSession(parsed.user, parsed.shell);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            sessionId: id,
                            user: parsed.user,
                            shell: parsed.shell,
                            message: `Terminal session created. Use sessionId for subsequent operations.`,
                        }, null, 2),
                    },
                ],
            };
        },
        "terminal_execute": async (args) => {
            const parsed = terminalExecuteSchema.parse(args);
            const session = manager.getSession(parsed.sessionId);
            if (!session) {
                return {
                    content: [{ type: "text", text: JSON.stringify({ error: "Session not found" }) }],
                    isError: true,
                };
            }
            if (session.exitCode !== null) {
                return {
                    content: [{ type: "text", text: JSON.stringify({ error: "Session has exited" }) }],
                    isError: true,
                };
            }
            manager.writeToSession(parsed.sessionId, parsed.command + "\n");
            const startTime = Date.now();
            const timeoutMs = parsed.timeout * 1000;
            await new Promise((resolve) => setTimeout(resolve, 500));
            let lastLen = 0;
            let stableCount = 0;
            while (Date.now() - startTime < timeoutMs) {
                await new Promise((r) => setTimeout(r, 200));
                const currentLen = manager.getBufferLength(parsed.sessionId);
                if (currentLen === lastLen) {
                    stableCount++;
                    if (stableCount >= 3)
                        break;
                }
                else {
                    stableCount = 0;
                    lastLen = currentLen;
                }
            }
            const output = manager.readFromSession(parsed.sessionId);
            const info = manager.getSessionInfo(parsed.sessionId);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            sessionId: parsed.sessionId,
                            output,
                            exitCode: info?.exitCode ?? null,
                            isActive: info?.isActive ?? true,
                        }, null, 2),
                    },
                ],
            };
        },
        "terminal_write": async (args) => {
            const parsed = terminalWriteSchema.parse(args);
            const session = manager.getSession(parsed.sessionId);
            if (!session) {
                return {
                    content: [{ type: "text", text: JSON.stringify({ error: "Session not found" }) }],
                    isError: true,
                };
            }
            if (session.exitCode !== null) {
                return {
                    content: [{ type: "text", text: JSON.stringify({ error: "Session has exited" }) }],
                    isError: true,
                };
            }
            const sent = manager.writeToSession(parsed.sessionId, parsed.input);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: sent,
                            bytesWritten: sent ? parsed.input.length : 0,
                        }, null, 2),
                    },
                ],
            };
        },
        "terminal_read": async (args) => {
            const parsed = terminalReadSchema.parse(args);
            const session = manager.getSession(parsed.sessionId);
            if (!session) {
                return {
                    content: [{ type: "text", text: JSON.stringify({ error: "Session not found" }) }],
                    isError: true,
                };
            }
            const output = manager.readFromSession(parsed.sessionId, parsed.offset, parsed.limit);
            const totalLength = manager.getBufferLength(parsed.sessionId);
            const info = manager.getSessionInfo(parsed.sessionId);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            sessionId: parsed.sessionId,
                            output,
                            offset: parsed.offset,
                            length: output.length,
                            totalLength,
                            isActive: info?.isActive ?? false,
                        }, null, 2),
                    },
                ],
            };
        },
        "terminal_disconnect": async (args) => {
            const parsed = terminalDisconnectSchema.parse(args);
            const success = manager.disconnectSession(parsed.sessionId);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: success,
                            message: success ? "Session closed" : "Session not found",
                        }, null, 2),
                    },
                ],
            };
        },
        "list_sessions": async () => {
            const sessions = manager.listSessions();
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ sessions, count: sessions.length }, null, 2),
                    },
                ],
            };
        },
        "terminal_status": async () => {
            const sessions = manager.listSessions();
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            status: "ok",
                            activeSessions: sessions.filter((s) => s.isActive).length,
                            totalSessions: sessions.length,
                        }, null, 2),
                    },
                ],
            };
        },
    };
}
export const toolDefinitions = [
    {
        name: "terminal_connect",
        description: "Open a new local terminal shell session on the ZimaOS server. Creates a bash shell running as the specified user. Use sessionId from the result for subsequent operations.",
        inputSchema: {
            type: "object",
            properties: {
                user: { type: "string", description: "User to run the shell as", default: "root" },
                shell: { type: "string", description: "Shell executable path", default: "/bin/bash" },
            },
        },
    },
    {
        name: "terminal_execute",
        description: "Execute a command in an existing terminal session. Waits for the command to complete and returns the output. Best for non-interactive commands.",
        inputSchema: {
            type: "object",
            properties: {
                sessionId: { type: "string", description: "Session ID from terminal_connect" },
                command: { type: "string", description: "Command to execute" },
                timeout: { type: "number", description: "Timeout in seconds (max 120)", default: 30 },
            },
            required: ["sessionId", "command"],
        },
    },
    {
        name: "terminal_write",
        description: "Send raw input to an active terminal session. Use this for interactive input (e.g., typing passwords, sending Ctrl+C, arrow keys). For newlines, use '\\n'. For special keys, use ANSI sequences (e.g., '\\x03' for Ctrl+C).",
        inputSchema: {
            type: "object",
            properties: {
                sessionId: { type: "string", description: "Session ID from terminal_connect" },
                input: { type: "string", description: "Raw input to send to the terminal" },
            },
            required: ["sessionId", "input"],
        },
    },
    {
        name: "terminal_read",
        description: "Read accumulated terminal output from a session. Supports pagination via offset and limit. Returns the current output buffer content.",
        inputSchema: {
            type: "object",
            properties: {
                sessionId: { type: "string", description: "Session ID from terminal_connect" },
                offset: { type: "number", description: "Byte offset to start reading from", default: 0 },
                limit: { type: "number", description: "Max bytes to return", default: 4096 },
            },
            required: ["sessionId"],
        },
    },
    {
        name: "terminal_disconnect",
        description: "Close a terminal session and free resources.",
        inputSchema: {
            type: "object",
            properties: {
                sessionId: { type: "string", description: "Session ID to close" },
            },
            required: ["sessionId"],
        },
    },
    {
        name: "list_sessions",
        description: "List all active and recent terminal sessions with their status.",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "terminal_status",
        description: "Check the terminal MCP server status and active session count.",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
];
//# sourceMappingURL=tools.js.map