// ============================================
// Git Helper Functions
// ============================================
// Utility functions for git operations
// ============================================

import simpleGit from "simple-git";
import { getProjectPath } from "../config/projectLoader.js";

/**
 * Get a git instance for a project and verify it's a git repository
 * @param {Object} projects - Projects registry
 * @param {string} projectName - The name of the project
 * @returns {Promise<{git: SimpleGit, root: string}>}
 * @throws {Error} If project not found or not a git repository
 */
export async function getGitInstance(projects, projectName) {
  const root = getProjectPath(projects, projectName);
  const git = simpleGit(root);
  
  // Check if it's a git repository
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error(`Project '${projectName}' at ${root} is not a git repository`);
  }

  return { git, root };
}

/**
 * Format commit data for consistent output
 * @param {Object} commit - Raw commit object from simple-git
 * @returns {Object} Formatted commit object
 */
export function formatCommit(commit) {
  return {
    hash: commit.hash,
    author: commit.author_name,
    email: commit.author_email,
    date: commit.date,
    message: commit.message,
    body: commit.body || "",
  };
}
