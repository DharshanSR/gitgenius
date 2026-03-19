# Git Integration Robustness

GitGenius provides comprehensive Git integration with robust error handling and support for advanced Git workflows.

## Features

### 1. Detached HEAD Detection

GitGenius automatically detects when your repository is in a detached HEAD state and provides appropriate warnings and recovery options.

**What is Detached HEAD?**
A detached HEAD state occurs when you check out a specific commit rather than a branch. Any commits made in this state will be orphaned unless you create a branch.

**How GitGenius Helps:**
- Automatically detects detached HEAD state
- Warns before dangerous operations
- Prevents accidental loss of work
- Provides clear recovery instructions

**Example:**
```bash
# GitGenius will warn you if you try to switch branches in detached HEAD
gitgenius branch checkout
# ⚠ Currently in detached HEAD state
# Do you want to proceed with branch checkout? (uncommitted changes may be lost)
```

### 2. Merge Conflict Detection

GitGenius detects merge conflicts and provides actionable resolution hints.

**Features:**
- Detects ongoing merge operations
- Lists conflicted files
- Provides step-by-step resolution instructions
- Prevents operations during unresolved conflicts

**Example:**
```bash
gitgenius state
# ⚠ Warning: Merge conflicts detected
# Found 2 conflicted file(s): src/app.ts, src/config.ts
# To resolve conflicts:
#   1. Edit each conflicted file and resolve markers (<<<<<<< ======= >>>>>>>)
#   2. Stage resolved files: git add <file>
#   3. Complete the merge: git commit
# Or abort the merge: git merge --abort
```

### 3. Dirty Workspace Detection

GitGenius checks for uncommitted changes, untracked files, and staged changes before performing operations.

**Workspace States Detected:**
- **Uncommitted changes**: Modified or deleted files
- **Untracked files**: New files not yet added to Git
- **Staged changes**: Files added but not committed

**Example:**
```bash
gitgenius state
# 📊 Git State:
#   Branch: main
#   ⚠ Uncommitted changes
#   ✓ Staged changes
#   • Untracked files
```

### 4. Git Worktrees Support

GitGenius supports Git worktrees, allowing you to work on multiple branches simultaneously.

**What are Worktrees?**
Worktrees allow you to check out multiple branches of the same repository in different directories.

**GitGenius Support:**
- Detects all worktrees in a repository
- Shows worktree details (path, branch, commit)
- Handles operations correctly in multi-worktree setups

**Example:**
```bash
gitgenius state --worktrees
# 📁 Worktrees:
#   • /home/user/project (main)
#     Branch: main
#     Commit: abc1234
#   • /home/user/project-feature
#     Branch: feature/new-ui
#     Commit: def5678
```

### 5. Submodule Support

GitGenius detects and manages Git submodules.

**Features:**
- Detects all submodules in a repository
- Shows initialization status
- Supports nested submodules
- Provides initialization and update commands

**Example:**
```bash
gitgenius state --submodules
# 📦 Submodules:
#   • vendor/library [initialized]
#     URL: https://github.com/org/library.git
#     Branch: main
#     Commit: 1a2b3c4
#   • third-party/tool [not initialized]
#     URL: https://github.com/org/tool.git
#     Commit: 5d6e7f8
```

### 6. Enhanced Branch Operations

Branch operations are enhanced with safety checks and recovery options.

**Safe Branch Checkout:**
- Checks for uncommitted changes
- Offers to stash changes automatically
- Prevents accidental data loss
- Handles detached HEAD gracefully

**Example:**
```bash
gitgenius branch checkout
# ⚠ You have uncommitted changes
# How would you like to proceed?
#   › Stash changes and checkout
#     Force checkout (discard changes)
#     Cancel
```

**Safe Branch Deletion:**
- Prevents deletion of current branch
- Protects main/master branches
- Checks if branches are merged
- Provides force delete option with warnings

**Example:**
```bash
gitgenius branch --delete
# ⚠ Warning: Normal delete (-d) will fail for unmerged branches
# Use --force to delete unmerged branches (use with caution)
# Are you sure you want to delete 2 branch(es)? (no)
```

### 7. Environment Validation

GitGenius validates your Git environment before operations.

**Checks Performed:**
- Git installation and version
- Git repository validity
- User configuration (name and email)
- Repository integrity

**Example:**
```bash
gitgenius state --validate
# 🔍 Environment Validation:
#   ✓ All checks passed
```

## CLI Commands

### `gitgenius state`

Show detailed Git repository state.

**Usage:**
```bash
gitgenius state [options]
```

**Options:**
- `--validate`: Validate Git environment
- `--worktrees`: Show worktree information
- `--submodules`: Show submodule information

**Examples:**
```bash
# Show basic state
gitgenius state

# Show state with validation
gitgenius state --validate

# Show all information
gitgenius state --validate --worktrees --submodules
```

## Error Codes

GitGenius uses standardized exit codes for CI/CD integration:

| Exit Code | Description |
|-----------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Git error (not in repository, invalid state) |
| 3 | Configuration error |
| 4 | Network error (API unavailable) |
| 5 | User error (invalid input) |

## Error Messages

GitGenius provides detailed error messages with recovery suggestions.

**Example Error:**
```
[GIT] Cannot proceed: uncommitted changes detected

💡 Suggestions:
   • Commit your changes: git commit -am "message"
   • Or stash them: git stash
   • Or discard them: git checkout -- <file>

🔧 Common solutions:
   • Ensure you are in a git repository
   • Check if you have staged changes: git status
   • Verify git is properly configured
```

## CI/CD Integration

GitGenius is designed to work seamlessly in CI/CD pipelines.

**Non-Interactive Mode:**
GitGenius operations fail gracefully in non-interactive environments without prompting for user input.

**Exit Codes:**
All operations return appropriate exit codes that scripts can check.

**Error Handling:**
Errors are logged to stderr with structured messages for parsing.

**Example GitHub Actions Workflow:**
```yaml
- name: Generate commit message
  run: |
    gitgenius --apply || {
      echo "Failed to generate commit message"
      exit 1
    }
```

## Best Practices

### 1. Check State Before Operations
Always check your repository state before performing operations:
```bash
gitgenius state --validate
```

### 2. Handle Detached HEAD
If you're in detached HEAD, create a branch before making commits:
```bash
git checkout -b my-feature-branch
```

### 3. Resolve Conflicts Promptly
Don't leave merge conflicts unresolved:
```bash
gitgenius state  # Shows conflict details
# ... resolve conflicts ...
git add .
git commit
```

### 4. Keep Workspace Clean
Commit or stash changes before switching branches:
```bash
git stash push -m "WIP: feature implementation"
gitgenius branch checkout
```

### 5. Initialize Submodules
Always initialize submodules after cloning:
```bash
git submodule update --init --recursive
```

## Troubleshooting

### Detached HEAD State

**Problem:** Operations are blocked due to detached HEAD.

**Solution:**
```bash
# Create a branch from current position
git checkout -b recovery-branch

# Or return to a known branch
git checkout main
```

### Merge Conflicts

**Problem:** Cannot commit due to merge conflicts.

**Solution:**
```bash
# Check which files are conflicted
gitgenius state

# Edit conflicted files and resolve markers
# Stage resolved files
git add <resolved-file>

# Complete the merge
git commit
```

### Dirty Workspace

**Problem:** Cannot switch branches due to uncommitted changes.

**Solution:**
```bash
# Option 1: Commit changes
git commit -am "WIP: partial implementation"

# Option 2: Stash changes
git stash push -m "WIP: feature work"

# Option 3: Discard changes (careful!)
git checkout -- <file>
```

### Uninitialized Submodules

**Problem:** Submodules are not initialized.

**Solution:**
```bash
# Initialize all submodules
git submodule update --init --recursive

# Or initialize specific submodule
git submodule update --init path/to/submodule
```

## Advanced Features

### Worktree Management

Create and manage multiple worktrees:
```bash
# Create a new worktree
git worktree add ../project-feature feature-branch

# List worktrees
gitgenius state --worktrees

# Remove worktree
git worktree remove ../project-feature
```

### Submodule Updates

Keep submodules up to date:
```bash
# Update all submodules
git submodule update --remote --merge

# Update specific submodule
git submodule update --remote path/to/submodule
```

### Custom Validation

GitGenius validates the environment automatically, but you can force validation:
```bash
# Validate before important operations
gitgenius state --validate && gitgenius commit --apply
```

## API for Programmatic Use

GitGenius can be used programmatically:

```typescript
import { GitStateManager } from 'gitgenius';

const stateManager = new GitStateManager();

// Get repository state
const state = await stateManager.getState();

if (state.hasConflicts) {
  console.log('Cannot proceed: conflicts detected');
  const hints = await stateManager.getConflictResolutionHints();
  hints.forEach(hint => console.log(hint));
}

// Check for detached HEAD
if (await stateManager.isDetachedHead()) {
  console.warn('Warning: detached HEAD state');
}

// Validate environment
const validation = await stateManager.validateEnvironment();
if (!validation.valid) {
  validation.errors.forEach(err => console.error(err));
}
```

## Contributing

Found a bug or have a feature request? Please [open an issue](https://github.com/DharshanSR/gitgenius/issues).

## License

MIT License - see [LICENSE](../LICENSE) file for details.
