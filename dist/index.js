import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { SSHSessionManager } from "./ssh-manager.js";
import { defineTools, toolDefinitions } from "./tools.js";
const sessionManager = new SSHSessionManager();
const tools = defineTools(sessionManager);
const server = new Server({
    name: "zima-ssh-terminal",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolDefinitions,
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const toolsMap = tools;
    if (!toolsMap[name]) {
        throw new Error(`Unknown tool: ${name}`);
    }
    return await toolsMap[name](args ?? {});
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Zima SSH Terminal MCP server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map