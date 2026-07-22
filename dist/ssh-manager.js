import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
const MAX_BUFFER_SIZE = 1024 * 1024;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
export class SSHSessionManager {
    sessions = new Map();
    createSession(user = "root", shell = "/bin/bash") {
        const id = uuidv4();
        const child = spawn(shell, ["-il"], {
            stdio: ["pipe", "pipe", "pipe"],
            cwd: "/tmp",
            env: {
                ...process.env,
                HOME: user === "root" ? "/root" : `/home/${user}`,
                USER: user,
                LOGNAME: user,
                SHELL: shell,
                TERM: "xterm-256color",
            },
        });
        const session = {
            id,
            process: child,
            user,
            shell,
            createdAt: new Date(),
            lastActivity: new Date(),
            outputBuffer: "",
            bufferSize: MAX_BUFFER_SIZE,
            exitCode: null,
        };
        child.stdout.on("data", (data) => {
            const text = data.toString();
            session.outputBuffer += text;
            session.lastActivity = new Date();
            if (session.outputBuffer.length > session.bufferSize) {
                session.outputBuffer = session.outputBuffer.slice(-session.bufferSize);
            }
        });
        child.stderr.on("data", (data) => {
            const text = data.toString();
            session.outputBuffer += text;
            session.lastActivity = new Date();
            if (session.outputBuffer.length > session.bufferSize) {
                session.outputBuffer = session.outputBuffer.slice(-session.bufferSize);
            }
        });
        child.on("exit", (exitCode) => {
            session.exitCode = exitCode ?? 0;
            session.lastActivity = new Date();
        });
        child.on("error", (err) => {
            console.error(`Shell process error for session ${id}:`, err.message);
            session.exitCode = -1;
            session.lastActivity = new Date();
        });
        this.sessions.set(id, session);
        return id;
    }
    getSession(id) {
        return this.sessions.get(id);
    }
    writeToSession(id, input) {
        const session = this.sessions.get(id);
        if (!session || session.exitCode !== null)
            return false;
        if (!session.process.stdin)
            return false;
        session.process.stdin.write(input);
        session.lastActivity = new Date();
        return true;
    }
    readFromSession(id, offset = 0, limit = 4096) {
        const session = this.sessions.get(id);
        if (!session)
            return "";
        return session.outputBuffer.slice(offset, offset + limit);
    }
    getBufferLength(id) {
        const session = this.sessions.get(id);
        return session?.outputBuffer.length ?? 0;
    }
    disconnectSession(id) {
        const session = this.sessions.get(id);
        if (!session)
            return false;
        try {
            if (session.exitCode === null) {
                session.process.kill("SIGTERM");
            }
        }
        catch {
            // ignore
        }
        this.sessions.delete(id);
        return true;
    }
    listSessions() {
        return Array.from(this.sessions.values()).map((s) => ({
            id: s.id,
            user: s.user,
            shell: s.shell,
            createdAt: s.createdAt.toISOString(),
            lastActivity: s.lastActivity.toISOString(),
            isActive: s.exitCode === null,
            exitCode: s.exitCode,
            bufferLength: s.outputBuffer.length,
        }));
    }
    getSessionInfo(id) {
        const session = this.sessions.get(id);
        if (!session)
            return null;
        return {
            id: session.id,
            user: session.user,
            shell: session.shell,
            createdAt: session.createdAt.toISOString(),
            lastActivity: session.lastActivity.toISOString(),
            isActive: session.exitCode === null,
            exitCode: session.exitCode,
            bufferLength: session.outputBuffer.length,
        };
    }
    cleanupIdleSessions() {
        const now = Date.now();
        for (const [id, session] of this.sessions) {
            if (now - session.lastActivity.getTime() > SESSION_TIMEOUT_MS) {
                try {
                    session.process.kill("SIGTERM");
                }
                catch {
                    // ignore
                }
                this.sessions.delete(id);
            }
        }
    }
}
//# sourceMappingURL=ssh-manager.js.map