import { spawn } from "child_process";
interface ShellSession {
    id: string;
    process: ReturnType<typeof spawn>;
    user: string;
    shell: string;
    createdAt: Date;
    lastActivity: Date;
    outputBuffer: string;
    bufferSize: number;
    exitCode: number | null;
}
export declare class SSHSessionManager {
    private sessions;
    createSession(user?: string, shell?: string): string;
    getSession(id: string): ShellSession | undefined;
    writeToSession(id: string, input: string): boolean;
    readFromSession(id: string, offset?: number, limit?: number): string;
    getBufferLength(id: string): number;
    disconnectSession(id: string): boolean;
    listSessions(): {
        id: string;
        user: string;
        shell: string;
        createdAt: string;
        lastActivity: string;
        isActive: boolean;
        exitCode: number | null;
        bufferLength: number;
    }[];
    getSessionInfo(id: string): {
        id: string;
        user: string;
        shell: string;
        createdAt: string;
        lastActivity: string;
        isActive: boolean;
        exitCode: number | null;
        bufferLength: number;
    } | null;
    cleanupIdleSessions(): void;
}
export {};
//# sourceMappingURL=ssh-manager.d.ts.map