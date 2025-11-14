# Workspace Bridge MCP Server

A powerful project-aware MCP server that enables cross-project file access and git history exploration. Each project defines which other projects it needs to access via a simple config file!

## Features

### File Access
- 📂 **Project-Specific Configuration**: Each project defines its own linked projects
- 🔗 **Auto-Loading**: Automatically loads linked projects when your MCP client opens a project
- 📁 **Cross-Project File Access**: Read files from any linked project
- 🚀 **No Global Hardcoding**: Configuration lives with each project
- 🔍 **Browse Project Files**: List directories and files across all linked projects

### Git History
- 🕰️ **Commit History**: View commit history with powerful filters (author, date, branch)
- 🔎 **Search Commits**: Search through commit messages and code changes
- 📝 **Commit Details**: Get full diffs and stats for any commit
- 📄 **File History**: Track changes to specific files over time
- 👥 **Git Blame**: See who last modified each line in a file
- 🌿 **Branch Comparison**: Compare commits between branches
- ℹ️ **Repository Info**: Get branches, remotes, tags, and status

## Installation

### Prerequisites
- Node.js (v16 or higher)
- Git (for git history features)

### Setup

1. **Clone this repository:**
   ```bash
   git clone <repository-url>
   cd workspace-bridge-mcp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your MCP client:**

   Add this server to your MCP client configuration file. The location varies by client:
   
   ```json
   {
     "mcpServers": {
       "workspace-bridge": {
         "command": "node",
         "args": ["/absolute/path/to/workspace-bridge-mcp/index.js"],
         "env": {}
       }
     }
   }
   ```

4. **Restart your MCP client** to load the server.

## Usage

### Step 1: Create Configuration File

In your main project, create a `.workspace-bridge.json` file:

```json
{
  "projects": [
    {
      "name": "project_b",
      "path": "/absolute/path/to/project_b"
    },
    {
      "name": "shared_lib",
      "path": "../shared_lib"
    }
  ]
}
```

**Note:** Paths can be absolute or relative to the current project directory.

### Step 2: Open Your Project

When you open a project in your MCP client, the server automatically:
- Registers the current project
- Loads and registers all projects from `.workspace-bridge.json`
- Makes all projects available for cross-project access

### Step 3: Use Cross-Project Features

You can now access files and git history across all linked projects:
- "Show me the files in project_b/src folder"
- "Read the config file from shared_lib"
- "Compare the implementations between project_a and project_b"

## Available Tools

The MCP server provides two categories of tools:

### File Access Tools

#### `listProjects`
List all registered projects (current + linked projects).

#### `listFiles`
List files and folders in a project directory.

**Parameters:**
- `project` (string): Project name
- `dir` (string, optional): Subdirectory path inside the project

**Example usage:**
- "List files in project_b/src folder"
- "Show me what's in shared_lib/lib/utils"

#### `readFile`
Read file content from a project.

**Parameters:**
- `project` (string): Project name
- `file` (string): Relative file path from the project root

**Example usage:**
- "Read the main file from project_b"
- "Show me shared_lib/lib/config.js"

### Advanced Tools (Runtime Management)

If you need to add/remove projects during a session without editing the config file:

#### `addProject`
Dynamically add a project at runtime.

**Parameters:**
- `name` (string): Friendly name for the project
- `path` (string): Absolute path to the project directory

#### `removeProject`
Remove a project from the current session.

**Parameters:**
- `name` (string): Name of the project to remove

### Git History Tools

All git tools work on any registered project (current or linked). Projects must be git repositories.

#### `getCommitHistory`
Get git commit history with powerful filtering options.

**Parameters:**
- `project` (string): Project name
- `branch` (string, optional): Branch name (defaults to current)
- `maxCount` (number, optional): Maximum commits to return (default: 50)
- `skip` (number, optional): Skip commits for pagination
- `author` (string, optional): Filter by author name or email
- `since` (string, optional): Show commits since date (e.g., "2024-01-01", "1 week ago")
- `until` (string, optional): Show commits until date

**Example usage:**
- "Show me the last 20 commits in project_a"
- "Get commits from john@example.com in the last month in project_b"
- "Show commits on the feature-branch in shared_lib"

#### `searchCommits`
Search through commit messages and optionally code changes.

**Parameters:**
- `project` (string): Project name
- `query` (string): Search term to find in commit messages
- `searchInDiff` (boolean, optional): Also search in code changes (default: false)
- `maxCount` (number, optional): Maximum results (default: 50)
- `author` (string, optional): Filter by author

**Example usage:**
- "Search for commits about 'feature X' in project_a"
- "Find commits that mention 'refactor' and also search the code changes in project_b"
- "Search for bug fixes by developer@example.com in shared_lib"

#### `getCommitDetails`
Get detailed information about a specific commit including full diff.

**Parameters:**
- `project` (string): Project name
- `commitHash` (string): Commit hash (full or short)

**Example usage:**
- "Show me details of commit abc123 in project_a"
- "Get the diff for commit 7f3e9a2 in project_b"

#### `getFileHistory`
Get commit history for a specific file.

**Parameters:**
- `project` (string): Project name
- `file` (string): File path relative to project root
- `maxCount` (number, optional): Maximum commits (default: 50)

**Example usage:**
- "Show me the history of src/main.js in project_a"
- "When was lib/config.js last modified in project_b?"
- "Get all commits that changed this file in shared_lib"

#### `gitBlame`
Show who last modified each line in a file.

**Parameters:**
- `project` (string): Project name
- `file` (string): File path relative to project root
- `startLine` (number, optional): Start line number
- `endLine` (number, optional): End line number

**Example usage:**
- "Who wrote this function in project_a/src/module.js?"
- "Show me the blame for lines 10-50 in project_b/src/main.js"

#### `getRepositoryInfo`
Get repository information including branches, remotes, tags, and status.

**Parameters:**
- `project` (string): Project name

**Example usage:**
- "What branches exist in project_a?"
- "Show me the git status of project_b"
- "What's the current branch in shared_lib?"

#### `compareBranches`
Compare commits between two branches.

**Parameters:**
- `project` (string): Project name
- `baseBranch` (string): Base branch name
- `compareBranch` (string): Branch to compare

**Example usage:**
- "Compare feature-branch with main in project_a"
- "What commits are in develop but not in main in project_b?"

## Use Cases

### 1. Framework/Dependency Migration Across Projects
When upgrading a major dependency or framework version, implement the migration in one project first, then use this MCP server to help apply the same changes to other projects.

**Workflow:**
1. Complete the migration in `project_a`
2. From `project_b`, use the MCP server to:
   - "Search for commits about 'framework upgrade' in project_a"
   - "Show me the commit details with full diff for commit abc123 in project_a"
   - "Get the file history for project_a/package.json to see all dependency changes"
   - "Read the migration notes or updated configuration files from project_a"
3. Apply similar changes to `project_b` based on the inspected patterns

**Benefits:** Avoid repeating research, catch edge cases already solved, maintain consistency across projects.

### 2. Replicating Logic Changes Across Similar Projects
When multiple projects share similar business logic, changes made in one project can be reviewed and replicated to others.

**Workflow:**
1. Implement a feature or fix in `project_a`
2. From `project_b`:
   - "Read the updated module from project_a/src/utils/handler.js"
   - "Show me git blame for project_a/src/utils/handler.js to see recent changes"
   - "Get the commit history for this file to understand the evolution"
   - "Compare my current implementation with project_a's version"
3. Adapt and apply the improvements to `project_b`

**Benefits:** Share improvements across teams, maintain feature parity, reduce duplication of effort.

### 3. Learning from Other Projects
When joining a team or exploring unfamiliar code, examine how similar problems were solved in related projects.

**Workflow:**
- "Show me how project_a implements feature X"
- "Read the implementation from shared_lib"
- "Get the commit history for project_b's module to understand the design decisions"
- "Who implemented this component in project_c? Show me git blame"

**Benefits:** Faster onboarding, understand architectural patterns, learn from existing solutions.

### 4. Monorepo-Style Development Without a Monorepo
Work with multiple independent repositories as if they were in a monorepo, accessing files and history across projects without restructuring your repository architecture.

**Workflow:**
- "List all configuration files across project_a, project_b, and shared_lib"
- "Compare the build configurations between projects"
- "Search for TODO comments across all linked projects"
- "Track when each project last updated their CI/CD pipelines"

**Benefits:** Maintain repository independence while gaining monorepo-like visibility and coordination.

### 5. Debugging Issues Across Project Boundaries
When a bug might stem from changes in a dependent project or shared library, investigate across project boundaries.

**Workflow:**
- "When was shared_lib last updated? Show me recent commits"
- "Did project_a recently change its interface? Check the git history"
- "Compare the data structures between project_a and project_b to find discrepancies"
- "Show me which developer last modified this integration point in both projects"

**Benefits:** Faster root cause analysis, understand cross-project dependencies, track breaking changes.

## Example Workflows

### Workflow 1: Multiple Related Projects
**Project Structure:**
```
/workspace/project_a/       ← You're here (current project)
/workspace/project_b/       ← Need to access
/workspace/shared_lib/      ← Shared utilities
```

**In project_a/.workspace-bridge.json:**
```json
{
  "projects": [
    {
      "name": "project_b",
      "path": "../project_b"
    },
    {
      "name": "shared_lib",
      "path": "../shared_lib"
    }
  ]
}
```

**Usage:**
- "Compare the implementation flow between project_a and project_b"
- "Check if both projects use the same patterns"
- "Read the utilities from shared_lib"

### Workflow 2: Git History Analysis
**Scenario:** Debugging an issue in project_a

**Commands:**
- "Search for commits about 'feature X' in project_a"
- "Show me the details of commit abc123 with the full diff"
- "Who last modified this file? Show me git blame for project_a/src/module.js"
- "Get the history of changes to this file in the last 2 months"

### Workflow 3: Cross-Project Code Review with History
**Scenario:** Comparing implementations and their evolution across projects

**Commands:**
- "Read the service module from both project_a and project_b"
- "Search for commits about 'refactor' in both projects"
- "Show me when each project last updated their integration"
- "Compare feature-branch with main in project_a to see what's being added"

## How It Works

1. **On Startup**: MCP server reads `.workspace-bridge.json` from the current project directory
2. **Auto-Registration**: Current project + all linked projects are registered
3. **Per-Project Config**: Each project has its own independent configuration
4. **No Global State**: No hardcoded paths in global config files

## Configuration File Format

```json
{
  "projects": [
    {
      "name": "friendly_name",      // Required: Name to use in tools
      "path": "/absolute/or/relative/path"  // Required: Path to project
    }
  ]
}
```

**Path Resolution:**
- Absolute paths: Used as-is
- Relative paths: Resolved relative to the current project directory

## Git Requirements

For git history tools to work:
- ✅ Projects must be git repositories (have a `.git` folder)
- ✅ Git must be installed on your system
- ✅ Non-git projects can still use all file access tools

If a project is not a git repository, the file access tools will continue to work normally, but git tools will return a clear error message.

## Reloading Changes

After updating the MCP server code, **restart your MCP client** to load the changes.

**Note:** You don't need to restart your MCP client when you change `.workspace-bridge.json` - just reload the window or restart the MCP connection.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
