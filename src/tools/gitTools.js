// ============================================
// Git History Tools
// ============================================
// Tool registrations for git operations
// ============================================

import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { getGitInstance, formatCommit } from "../utils/gitHelpers.js";
import { getProjectPath } from "../config/projectLoader.js";

/**
 * Register all git history tools
 * @param {McpServer} mcpServer - The MCP server instance
 * @param {Object} projects - Projects registry
 */
export function registerGitTools(mcpServer, projects) {
  
  // ----------------------------------------
  // Tool: getCommitHistory
  // ----------------------------------------
  mcpServer.registerTool(
    "getCommitHistory",
    {
      description: "Get git commit history for a project",
      inputSchema: {
        project: z.string().describe("Project name"),
        branch: z.string().optional().describe("Branch name (defaults to current branch)"),
        maxCount: z.number().optional().describe("Maximum number of commits to return (default: 50)"),
        skip: z.number().optional().describe("Number of commits to skip for pagination"),
        author: z.string().optional().describe("Filter commits by author name or email"),
        since: z.string().optional().describe("Show commits since date (e.g., '2024-01-01', '1 week ago')"),
        until: z.string().optional().describe("Show commits until date"),
      },
    },
    async ({ project, branch, maxCount = 50, skip = 0, author, since, until }) => {
      try {
        const { git } = await getGitInstance(projects, project);
        
        // Build log options
        const options = {
          maxCount,
          ...(skip && { skip }),
          ...(author && { '--author': author }),
          ...(since && { '--since': since }),
          ...(until && { '--until': until }),
        };

        // Get commits
        const log = branch 
          ? await git.log({ ...options, [branch]: null })
          : await git.log(options);

        const commits = log.all.map(formatCommit);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                project,
                branch: branch || "(current)",
                count: commits.length,
                commits,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get commit history: ${error.message}`);
      }
    }
  );

  // ----------------------------------------
  // Tool: searchCommits
  // ----------------------------------------
  mcpServer.registerTool(
    "searchCommits",
    {
      description: "Search through git commit messages and optionally code changes",
      inputSchema: {
        project: z.string().describe("Project name"),
        query: z.string().describe("Search term to find in commit messages"),
        searchInDiff: z.boolean().optional().describe("Also search in code changes/diffs (default: false)"),
        maxCount: z.number().optional().describe("Maximum number of results (default: 50)"),
        author: z.string().optional().describe("Filter by author name or email"),
      },
    },
    async ({ project, query, searchInDiff = false, maxCount = 50, author }) => {
      try {
        const { git } = await getGitInstance(projects, project);
        
        const options = {
          '--grep': query,
          '--regexp-ignore-case': null,
          maxCount,
          ...(author && { '--author': author }),
        };

        // Search in commit messages
        const log = await git.log(options);
        let commits = log.all.map(formatCommit);

        // Optionally search in diffs
        if (searchInDiff) {
          const diffOptions = [
            'log',
            `-S${query}`,
            '--regexp-ignore-case',
            `--max-count=${maxCount}`,
            '--pretty=format:%H|%an|%ae|%ad|%s',
            '--date=iso',
          ];
          
          if (author) {
            diffOptions.push(`--author=${author}`);
          }

          const diffResults = await git.raw(diffOptions);
          const diffCommits = diffResults
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
              const [hash, author_name, author_email, date, ...messageParts] = line.split('|');
              return {
                hash,
                author: author_name,
                email: author_email,
                date,
                message: messageParts.join('|'),
                body: "(found in code changes)",
              };
            });

          // Merge and deduplicate by hash
          const allCommits = [...commits, ...diffCommits];
          const uniqueCommits = Array.from(
            new Map(allCommits.map(c => [c.hash, c])).values()
          );
          commits = uniqueCommits.slice(0, maxCount);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                project,
                query,
                searchInDiff,
                count: commits.length,
                commits,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to search commits: ${error.message}`);
      }
    }
  );

  // ----------------------------------------
  // Tool: getCommitDetails
  // ----------------------------------------
  mcpServer.registerTool(
    "getCommitDetails",
    {
      description: "Get detailed information about a specific git commit including diff",
      inputSchema: {
        project: z.string().describe("Project name"),
        commitHash: z.string().describe("Commit hash (full or short)"),
      },
    },
    async ({ project, commitHash }) => {
      try {
        const { git } = await getGitInstance(projects, project);
        
        // Get commit info
        const log = await git.log({ maxCount: 1, [commitHash]: null });
        if (!log.all.length) {
          throw new Error(`Commit '${commitHash}' not found`);
        }
        
        const commit = formatCommit(log.all[0]);
        
        // Get commit diff
        const diff = await git.show([commitHash]);
        
        // Get stats
        const stats = await git.raw(['show', '--stat', '--oneline', commitHash]);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                project,
                commit,
                stats,
                diff,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get commit details: ${error.message}`);
      }
    }
  );

  // ----------------------------------------
  // Tool: getFileHistory
  // ----------------------------------------
  mcpServer.registerTool(
    "getFileHistory",
    {
      description: "Get git commit history for a specific file",
      inputSchema: {
        project: z.string().describe("Project name"),
        file: z.string().describe("File path relative to project root"),
        maxCount: z.number().optional().describe("Maximum number of commits to return (default: 50)"),
      },
    },
    async ({ project, file, maxCount = 50 }) => {
      try {
        const { git } = await getGitInstance(projects, project);
        
        // Get file history
        const log = await git.log({
          file,
          maxCount,
        });

        const commits = log.all.map(formatCommit);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                project,
                file,
                count: commits.length,
                commits,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get file history: ${error.message}`);
      }
    }
  );

  // ----------------------------------------
  // Tool: gitBlame
  // ----------------------------------------
  mcpServer.registerTool(
    "gitBlame",
    {
      description: "Show who last modified each line in a file (git blame)",
      inputSchema: {
        project: z.string().describe("Project name"),
        file: z.string().describe("File path relative to project root"),
        startLine: z.number().optional().describe("Start line number (optional)"),
        endLine: z.number().optional().describe("End line number (optional)"),
      },
    },
    async ({ project, file, startLine, endLine }) => {
      try {
        const { git } = await getGitInstance(projects, project);
        const root = getProjectPath(projects, project);
        const filePath = path.join(root, file);
        
        // Check if file exists
        try {
          await fs.access(filePath);
        } catch {
          throw new Error(`File '${file}' not found in project '${project}'`);
        }

        // Build blame command
        const args = ['blame', '--line-porcelain'];
        if (startLine && endLine) {
          args.push(`-L${startLine},${endLine}`);
        }
        args.push(file);

        const blameOutput = await git.raw(args);
        
        // Parse blame output
        const lines = blameOutput.split('\n');
        const blameData = [];
        let currentCommit = null;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.match(/^[0-9a-f]{40}/)) {
            const [hash, , lineNum] = line.split(' ');
            currentCommit = { hash, lineNum: parseInt(lineNum) };
          } else if (line.startsWith('author ') && currentCommit) {
            currentCommit.author = line.substring(7);
          } else if (line.startsWith('author-time ') && currentCommit) {
            currentCommit.date = new Date(parseInt(line.substring(12)) * 1000).toISOString();
          } else if (line.startsWith('summary ') && currentCommit) {
            currentCommit.summary = line.substring(8);
          } else if (line.startsWith('\t') && currentCommit) {
            currentCommit.content = line.substring(1);
            blameData.push({ ...currentCommit });
            currentCommit = null;
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                project,
                file,
                lines: blameData,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get git blame: ${error.message}`);
      }
    }
  );

  // ----------------------------------------
  // Tool: getRepositoryInfo
  // ----------------------------------------
  mcpServer.registerTool(
    "getRepositoryInfo",
    {
      description: "Get git repository information including branches, remotes, and current status",
      inputSchema: {
        project: z.string().describe("Project name"),
      },
    },
    async ({ project }) => {
      try {
        const { git } = await getGitInstance(projects, project);
        
        // Get current branch
        const status = await git.status();
        
        // Get all branches
        const branches = await git.branch();
        
        // Get remotes
        const remotes = await git.getRemotes(true);
        
        // Get tags
        const tags = await git.tags();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                project,
                currentBranch: status.current,
                branches: {
                  all: branches.all,
                  current: branches.current,
                },
                remotes: remotes.map(r => ({
                  name: r.name,
                  fetchUrl: r.refs.fetch,
                  pushUrl: r.refs.push,
                })),
                tags: tags.all,
                status: {
                  modified: status.modified,
                  created: status.created,
                  deleted: status.deleted,
                  renamed: status.renamed,
                  staged: status.staged,
                  ahead: status.ahead,
                  behind: status.behind,
                },
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get repository info: ${error.message}`);
      }
    }
  );

  // ----------------------------------------
  // Tool: compareBranches
  // ----------------------------------------
  mcpServer.registerTool(
    "compareBranches",
    {
      description: "Compare commits between two git branches",
      inputSchema: {
        project: z.string().describe("Project name"),
        baseBranch: z.string().describe("Base branch name"),
        compareBranch: z.string().describe("Branch to compare against base"),
      },
    },
    async ({ project, baseBranch, compareBranch }) => {
      try {
        const { git } = await getGitInstance(projects, project);
        
        // Get commits in compareBranch that are not in baseBranch
        const log = await git.log({
          from: baseBranch,
          to: compareBranch,
        });

        const commits = log.all.map(formatCommit);

        // Get summary stats
        const stats = await git.raw(['diff', '--stat', `${baseBranch}...${compareBranch}`]);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                project,
                baseBranch,
                compareBranch,
                commitsAhead: commits.length,
                commits,
                diffStats: stats,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to compare branches: ${error.message}`);
      }
    }
  );
}
