// ============================================
// Project Loader & Manager
// ============================================
// Handles loading projects from config files
// and managing the projects registry
// ============================================

import fs from "fs/promises";
import path from "path";

/**
 * Load projects from .workspace-bridge.json config
 * @param {string} currentProjectPath - Current project directory path
 * @returns {Promise<{projects: Object, currentProjectName: string}>}
 */
export async function loadProjects(currentProjectPath) {
  const projects = {};
  const currentProjectName = path.basename(currentProjectPath);

  // Register the current project
  projects[currentProjectName] = currentProjectPath;

  // Try to load .workspace-bridge.json from current project
  const configPath = path.join(currentProjectPath, ".workspace-bridge.json");
  try {
    const configContent = await fs.readFile(configPath, "utf8");
    const config = JSON.parse(configContent);
    
    if (config.projects && Array.isArray(config.projects)) {
      for (const project of config.projects) {
        if (project.name && project.path) {
          const resolvedPath = path.resolve(currentProjectPath, project.path);
          projects[project.name] = resolvedPath;
          console.error(`  ✓ Linked project: ${project.name} → ${resolvedPath}`);
        }
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`⚠️  Warning: Error reading .workspace-bridge.json: ${error.message}`);
    }
    // If file doesn't exist, that's fine - just use current project only
  }

  return { projects, currentProjectName };
}

/**
 * Add a project to the registry at runtime
 * @param {Object} projects - Projects registry
 * @param {string} name - Project name
 * @param {string} projectPath - Project path
 */
export async function addProject(projects, name, projectPath) {
  const stats = await fs.stat(projectPath);
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${projectPath}`);
  }
  
  projects[name] = path.resolve(projectPath);
}

/**
 * Remove a project from the registry
 * @param {Object} projects - Projects registry
 * @param {string} name - Project name
 */
export function removeProject(projects, name) {
  if (!projects[name]) {
    throw new Error(`Project '${name}' not found`);
  }
  
  delete projects[name];
}

/**
 * Get a project path by name
 * @param {Object} projects - Projects registry
 * @param {string} projectName - Project name
 * @returns {string} Project path
 * @throws {Error} If project not found
 */
export function getProjectPath(projects, projectName) {
  const root = projects[projectName];
  if (!root) {
    const availableProjects = Object.keys(projects);
    throw new Error(
      `Unknown project: ${projectName}. Available projects: ${availableProjects.length > 0 ? availableProjects.join(', ') : 'none (use addProject tool first)'}`
    );
  }
  return root;
}
