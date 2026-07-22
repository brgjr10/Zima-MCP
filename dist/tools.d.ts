import type { SSHSessionManager } from "./ssh-manager.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
export declare function defineTools(manager: SSHSessionManager): {
    terminal_connect: (args: unknown) => Promise<CallToolResult>;
    terminal_execute: (args: unknown) => Promise<CallToolResult>;
    terminal_write: (args: unknown) => Promise<CallToolResult>;
    terminal_read: (args: unknown) => Promise<CallToolResult>;
    terminal_disconnect: (args: unknown) => Promise<CallToolResult>;
    list_sessions: () => Promise<CallToolResult>;
    terminal_status: () => Promise<CallToolResult>;
};
export declare const toolDefinitions: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            user: {
                type: string;
                description: string;
                default: string;
            };
            shell: {
                type: string;
                description: string;
                default: string;
            };
            sessionId?: undefined;
            command?: undefined;
            timeout?: undefined;
            input?: undefined;
            offset?: undefined;
            limit?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            sessionId: {
                type: string;
                description: string;
            };
            command: {
                type: string;
                description: string;
            };
            timeout: {
                type: string;
                description: string;
                default: number;
            };
            user?: undefined;
            shell?: undefined;
            input?: undefined;
            offset?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            sessionId: {
                type: string;
                description: string;
            };
            input: {
                type: string;
                description: string;
            };
            user?: undefined;
            shell?: undefined;
            command?: undefined;
            timeout?: undefined;
            offset?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            sessionId: {
                type: string;
                description: string;
            };
            offset: {
                type: string;
                description: string;
                default: number;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            user?: undefined;
            shell?: undefined;
            command?: undefined;
            timeout?: undefined;
            input?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            sessionId: {
                type: string;
                description: string;
            };
            user?: undefined;
            shell?: undefined;
            command?: undefined;
            timeout?: undefined;
            input?: undefined;
            offset?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            user?: undefined;
            shell?: undefined;
            sessionId?: undefined;
            command?: undefined;
            timeout?: undefined;
            input?: undefined;
            offset?: undefined;
            limit?: undefined;
        };
        required?: undefined;
    };
})[];
//# sourceMappingURL=tools.d.ts.map