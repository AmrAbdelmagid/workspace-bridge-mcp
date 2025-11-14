// ============================================
// File Access Tools
// ============================================
// Tool registrations for file operations
// ============================================

import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { addProject, removeProject, getProjectPath } from "../config/projectLoader.js";

/**
 * Register all file access tools
 * @param {McpServer} mcpServer - The MCP server instance
 * @param {Object} projects - Projects registry
 */
export function registerFileTools(mcpServer, projects) {
  
  // ----------------------------------------
  // Tool: addProject
  // ----------------------------------------
  mcpServer.registerTool(
    "addProject",
    {
      description: "Add a project to the workspace bridge for cross-project file access",
      inputSchema: {
        name: z.string().describe("Friendly name for the project (e.g., 'project_b', 'shared_lib')"),
        path: z.string().describe("Absolute path to the project directory"),
      },
    },
    async ({ name, path: projectPath }) => {
      try {
        await addProject(projects, name, projectPath);
        
        return {
          content: [
            {
              type: "text",
              text: `✅ Successfully added project '${name}' at ${projects[name]}\n\nRegistered projects:\n${Object.entries(projects).map(([n, p]) => `  - ${n}: ${p}`).join('\n')}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to add project: ${error.message}`);
      }
    }
  );

  // ----------------------------------------
  // Tool: removeProject
  // ----------------------------------------
  mcpServer.registerTool(
    "removeProject",
    {
      description: "Remove a project from the workspace bridge",
      inputSchema: {
        name: z.string().describe("Name of the project to remove"),
      },
    },
    async ({ name }) => {
      removeProject(projects, name);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Successfully removed project '${name}'\n\nRemaining projects:\n${Object.entries(projects).map(([n, p]) => `  - ${n}: ${p}`).join('\n') || '  (none)'}`,
          },
        ],
      };
    }
  );

  // ----------------------------------------
  // Tool: listProjects
  // ----------------------------------------
  mcpServer.registerTool(
    "listProjects",
    {
      description: "List all registered projects in the workspace bridge",
      inputSchema: {},
    },
    async () => {
      const projectList = Object.entries(projects);
      
      if (projectList.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No projects registered yet. Use the 'addProject' tool to add projects.",
            },
          ],
        };
      }
      
      return {
        content: [
          {
            type: "text",
            text: `📁 Registered Projects (${projectList.length}):\n\n${projectList.map(([name, path]) => `  • ${name}\n    ${path}`).join('\n\n')}`,
          },
        ],
      };
    }
  );

  // ----------------------------------------
  // Tool: listFiles
  // ----------------------------------------
  mcpServer.registerTool(
    "listFiles",
    {
      description: "List files in a given project directory",
      inputSchema: {
        project: z.string().describe("Project name"),
        dir: z.string().optional().describe("Optional subdirectory path inside the project"),
      },
    },
    async ({ project, dir = "" }) => {
      const root = getProjectPath(projects, project);
      const target = path.join(root, dir);

      const items = await fs.readdir(target, { withFileTypes: true });
      const result = items.map((item) => ({
        name: item.name,
        type: item.isDirectory() ? "directory" : "file",
      }));
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // ----------------------------------------
  // Tool: readFile
  // ----------------------------------------
  mcpServer.registerTool(
    "readFile",
    {
      description: "Read a file content from a given project",
      inputSchema: {
        project: z.string().describe("Project name"),
        file: z.string().describe("Relative file path from the project root"),
      },
    },
    async ({ project, file }) => {
      const root = getProjectPath(projects, project);
      const filePath = path.join(root, file);
      const content = await fs.readFile(filePath, "utf8");
      
      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    }
  );
}
