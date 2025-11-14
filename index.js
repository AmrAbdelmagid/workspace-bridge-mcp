#!/usr/bin/env node
// ============================================
// workspace-bridge-mcp
// --------------------------------------------
// A project-aware MCP server that lets you browse
// and read files across multiple projects, plus
// explore git history.
// ============================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadProjects } from "./src/config/projectLoader.js";
import { registerFileTools } from "./src/tools/fileTools.js";
import { registerGitTools } from "./src/tools/gitTools.js";

// --------------------------------------------
// 1️⃣ Initialize Projects from Config
// --------------------------------------------
const currentProjectPath = process.cwd();
const { projects, currentProjectName } = await loadProjects(currentProjectPath);

// --------------------------------------------
// 2️⃣ Create the MCP Server
// --------------------------------------------
const mcpServer = new McpServer({
  name: "workspace-bridge-mcp",
  version: "3.0.0",
});

// Register all tools
registerFileTools(mcpServer, projects);
registerGitTools(mcpServer, projects);

// --------------------------------------------
// 3️⃣ Start the server
// --------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  
  // Log startup info (to stderr to not interfere with stdio protocol)
  console.error(`🚀 workspace-bridge-mcp v3.0.0 started!`);
  console.error(`📂 Current project: ${currentProjectName} (${currentProjectPath})`);
  
  const linkedProjects = Object.entries(projects).filter(([name]) => name !== currentProjectName);
  if (linkedProjects.length > 0) {
    console.error(`🔗 Linked projects: ${linkedProjects.length}`);
    linkedProjects.forEach(([name, path]) => {
      console.error(`  • ${name} → ${path}`);
    });
  } else {
    console.error(`📝 No linked projects. Create .workspace-bridge.json to link other projects.`);
  }
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
