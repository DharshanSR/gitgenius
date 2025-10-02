# 🚀 GitGenius Commands Reference

Complete overview of all available commands in GitGenius v1.0.0

---

## 📋 **Command Categories**

### **🤖 Core AI Commands**
- [`commit`](#commit) - Generate AI-powered commit messages (default)
- [`prev`](#prev) - Work with previous commit messages
- [`suggest`](#suggest) - Get AI suggestions for commit types and scopes

### **🔧 Configuration & Setup**
- [`config`](#config) - Manage GitGenius configuration
- [`init`](#init) - Initialize repository with best practices
- [`whoami`](#whoami) - Show current configuration

### **🌿 Git Operations**
- [`branch`](#branch) - Manage git branches
- [`checkout`](#checkout) - Interactive branch switching
- [`log`](#log) - Enhanced git log with AI summaries
- [`diff`](#diff) - Git diff with AI explanations
- [`undo`](#undo) - Undo commits or reset changes

### **📊 Analytics & Insights**
- [`stats`](#stats) - Commit statistics and analytics
- [`history`](#history) - Generated message history
- [`review`](#review) - AI-powered code review

### **🎨 Customization**
- [`template`](#template) - Manage commit message templates
- [`alias`](#alias) - Custom command aliases

### **🛠️ System**
- [`feedback`](#feedback) - Send feedback and bug reports
- [`update`](#update) - Check for updates

---

## 🤖 **Core AI Commands**

### `commit` (default command)
Generate AI-powered commit messages from staged changes.

```bash
# Basic usage
gitgenius
gitgenius commit

# With options
gitgenius -t feat -a -c
gitgenius --type fix --apply --copy
gitgenius -t docs -e -p gemini
```

**Options:**
- `-a, --apply` - Apply the commit message directly
- `-c, --copy` - Copy to clipboard
- `-e, --edit` - Enable interactive editing
- `-t, --type <type>` - Specify commit type (feat, fix, docs, etc.)
- `-p, --provider <provider>` - AI provider (openai, gemini, anthropic)
- `--dry-run` - Generate commit message without applying changes

**Examples:**
```bash
gitgenius -t feat -a                    # Generate feat commit and apply
gitgenius --provider gemini --copy      # Use Gemini and copy to clipboard
gitgenius -t fix -e -a                  # Generate fix, edit interactively, then apply
gitgenius --dry-run                     # Preview commit message without applying
gitgenius -t feat --dry-run             # Preview feat-type commit message
```

### `prev`
Work with previously generated commit messages.

```bash
gitgenius prev
gitgenius prev --apply
gitgenius prev --edit --amend
```

**Options:**
- `-a, --apply` - Apply previous message
- `-c, --copy` - Copy previous message to clipboard
- `-e, --edit` - Edit previous message
- `--amend` - Amend previous commit (requires --edit)

**Examples:**
```bash
gitgenius prev -a                       # Apply last generated message
gitgenius prev -e --amend              # Edit and amend last commit
gitgenius prev -c                       # Copy last message to clipboard
```

### `suggest`
Get AI suggestions for commit types, scopes, and conventions.

```bash
gitgenius suggest
gitgenius suggest --type
gitgenius suggest --scope
```

**Options:**
- `--type` - Suggest commit type only
- `--scope` - Suggest scope only  
- `--branch` - Base suggestions on branch name

**Examples:**
```bash
gitgenius suggest                       # Suggest type and scope
gitgenius suggest --type               # Just suggest commit type
gitgenius suggest --scope              # Just suggest scope
```

---

## 🔧 **Configuration & Setup**

### `config`
Manage GitGenius configuration settings with validation, migration, and templates.

```bash
gitgenius config
gitgenius config provider
gitgenius config apiKey your_key_here
gitgenius config --reset
gitgenius config --template gemini
```

**Arguments:**
- `[key]` - Configuration key to set
- `[value]` - Configuration value

**Options:**
- `--reset` - Reset all configuration
- `--list` - List all configuration
- `--backup` - Backup current configuration
- `--restore <file>` - Restore configuration from backup
- `--validate` - Validate current configuration
- `--template <name>` - Apply a configuration template
- `--export <file>` - Export configuration to file
- `--import <file>` - Import configuration from file
- `--migrate` - Manually migrate configuration to latest version

**Available Templates:**
- `default` - Default OpenAI GPT-3.5 configuration
- `openai-gpt4` - GPT-4 for detailed commit messages
- `gemini` - Google Gemini Pro configuration
- `concise` - Lower token limit for concise messages
- `detailed` - Higher token limit for detailed messages
- `conventional` - Strict conventional commits format

**Examples:**
```bash
gitgenius config                        # Interactive configuration
gitgenius config provider openai        # Set provider to OpenAI
gitgenius config model gpt-4           # Set model to GPT-4
gitgenius config --list                # Show all settings
gitgenius config --reset               # Reset to defaults
gitgenius config --validate            # Validate configuration
gitgenius config --backup              # Backup configuration
gitgenius config --template gemini     # Apply Gemini template
gitgenius config --export config.json  # Export to file
gitgenius config --import config.json  # Import from file
```

**Configuration Inheritance:**
GitGenius uses a three-level configuration system:
1. **Global** - System-wide settings (lowest priority)
2. **User** - User-specific settings (medium priority)
3. **Project** - Project-specific settings in `.gitgenius/` (highest priority)

Project settings override user settings, which override global settings.

### `init`
Initialize repository with GitGenius best practices.

```bash
gitgenius init --all
gitgenius init --hooks --templates
```

**Options:**
- `--hooks` - Install git hooks
- `--templates` - Setup commit templates
- `--config` - Setup recommended git config
- `--all` - Setup everything

**Examples:**
```bash
gitgenius init --all                    # Complete setup
gitgenius init --hooks                 # Just install hooks
gitgenius init --templates --config    # Templates and config only
```

### `whoami`
Show current API key and provider information.

```bash
gitgenius whoami
```

**Output:**
- Current AI provider and model
- API key status (masked)
- Git user configuration
- Repository information

---

## 🌿 **Git Operations**

### `branch`
Manage git branches with enhanced features.

```bash
gitgenius branch
gitgenius branch -r -c
gitgenius branch --delete
```

**Options:**
- `-r, --remote` - Include remote branches
- `-c, --copy` - Copy selected branch name to clipboard
- `-d, --delete` - Delete branches
- `-f, --force` - Force delete branches (with --delete)

**Examples:**
```bash
gitgenius branch                        # List local branches
gitgenius branch -r                     # Include remote branches
gitgenius branch -c                     # Select and copy branch name
gitgenius branch --delete               # Interactive branch deletion
gitgenius branch --delete --force       # Force delete branches
```

### `checkout`
Interactive branch switching.

```bash
gitgenius checkout
```

**Features:**
- Interactive branch selection
- Search and filter branches
- Quick switching with confirmation

### `log`
Enhanced git log with AI summaries and insights.

```bash
gitgenius log
gitgenius log -n 5 --ai
gitgenius log --author "John" --since "2024-01-01"
```

**Options:**
- `-n, --number <count>` - Number of commits (default: 10)
- `--since <date>` - Show commits since date
- `--author <author>` - Filter by author
- `--ai` - Generate AI summary of changes

**Examples:**
```bash
gitgenius log -n 5                      # Last 5 commits
gitgenius log --ai                      # With AI explanations
gitgenius log --author "team" --since "1 week ago"
```

### `diff`
Git diff with optional AI explanations.

```bash
gitgenius diff
gitgenius diff --staged --ai
gitgenius diff --file src/auth.js
```

**Options:**
- `--staged` - Show staged changes
- `--last` - Show last commit changes
- `--ai` - Get AI explanation of changes
- `--file <file>` - Show diff for specific file

**Examples:**
```bash
gitgenius diff --staged                 # Show staged changes
gitgenius diff --last --ai             # Last commit with AI explanation
gitgenius diff --file package.json     # Specific file diff
```

### `undo`
Undo commits or reset changes safely.

```bash
gitgenius undo --commit
gitgenius undo --staged
gitgenius undo --commit --hard
```

**Options:**
- `--commit` - Undo last commit (soft reset)
- `--hard` - Hard reset (loses changes)
- `--staged` - Unstage all changes

**Examples:**
```bash
gitgenius undo --commit                 # Soft reset last commit
gitgenius undo --staged                 # Unstage all changes
gitgenius undo --commit --hard          # Hard reset (destructive)
```

---

## 📊 **Analytics & Insights**

### `stats`
Show commit statistics and team analytics.

```bash
gitgenius stats
gitgenius stats --days 7 --author "team"
```

**Options:**
- `-d, --days <days>` - Number of days to analyze (default: 30)
- `--author <author>` - Filter by author

**Features:**
- Total commits count
- Commits by author
- Commits by type (conventional commits)
- Time-based analysis

**Examples:**
```bash
gitgenius stats                         # Last 30 days
gitgenius stats --days 7               # Last week
gitgenius stats --author "John Doe"    # Specific author
```

### `history`
Show history of generated commit messages.

```bash
gitgenius history
gitgenius history -n 5 --export report.json
```

**Options:**
- `-n, --number <count>` - Number of messages (default: 10)
- `--clear` - Clear message history
- `--export <file>` - Export history to file

**Examples:**
```bash
gitgenius history -n 20                 # Last 20 messages
gitgenius history --clear               # Clear all history
gitgenius history --export backup.json  # Export to file
```

### `review`
AI-powered code review for staged changes.

```bash
gitgenius review
gitgenius review --file src/auth.js --severity high
```

**Options:**
- `--file <file>` - Review specific file
- `--severity <level>` - Filter by severity (low, medium, high)
- `--format <format>` - Output format (text, json, markdown)

**Examples:**
```bash
gitgenius review                        # Review staged changes
gitgenius review --severity high        # High severity issues only
gitgenius review --format json          # JSON output
```

---

## 🎨 **Customization**

### `template`
Manage commit message templates.

```bash
gitgenius template --list
gitgenius template --add "hotfix"
gitgenius template --use "feature"
```

**Options:**
- `-l, --list` - List all templates
- `-a, --add <name>` - Add a new template
- `-r, --remove <name>` - Remove a template
- `-u, --use <name>` - Use a specific template

**Examples:**
```bash
gitgenius template --list               # Show all templates
gitgenius template --add "hotfix"       # Create hotfix template
gitgenius template --use "feature"      # Use feature template
gitgenius template --remove "old"       # Remove template
```

### `alias`
Manage custom command aliases.

```bash
gitgenius alias --list
gitgenius alias --add "quick" "commit -t feat -a"
```

**Options:**
- `-l, --list` - List all aliases
- `-a, --add <name> <command>` - Add new alias
- `-r, --remove <name>` - Remove alias

**Examples:**
```bash
gitgenius alias --list                  # Show all aliases
gitgenius alias --add "quick" "commit -t feat -a"
gitgenius alias --remove "old-alias"    # Remove alias
```

---

## 🛠️ **System Commands**

### `feedback`
Send feedback, bug reports, or feature requests.

```bash
gitgenius feedback
gitgenius feedback --bug --rating 5
```

**Options:**
- `--bug` - Report a bug
- `--feature` - Request a feature
- `--rating <stars>` - Rate GitGenius (1-5 stars)

### `update`
Check for GitGenius updates.

```bash
gitgenius update
gitgenius update --force
```

**Options:**
- `--check` - Check for updates only
- `--force` - Force update even if up to date

---

## 🎯 **Quick Reference**

### **Most Common Commands:**
```bash
gitgenius                               # Generate commit message
gitgenius -t feat -a                    # Generate feat commit and apply
gitgenius prev -a                       # Apply previous message
gitgenius config                        # Setup configuration
gitgenius stats                         # View commit statistics
gitgenius branch --delete               # Clean up branches
```

### **Power User Commands:**
```bash
gitgenius review --severity high        # AI code review
gitgenius log --ai -n 5                # AI-enhanced git log
gitgenius suggest --type                # AI commit type suggestions
gitgenius template --add "custom"       # Custom templates
gitgenius history --export report.json  # Export message history
```

### **Team Commands:**
```bash
gitgenius init --all                    # Setup team standards
gitgenius stats --days 7 --author "team" # Team productivity
gitgenius template --list               # Team templates
gitgenius config --list                 # Team configuration
```

---

## 📚 **Command Aliases**

GitGenius also supports the shorthand command `gg`:

```bash
gg                                      # Same as gitgenius
gg -t feat -a                          # Same as gitgenius -t feat -a
gg config                               # Same as gitgenius config
```

---

**Total Commands: 17 main commands + numerous options and flags**

Each command is designed to work together as part of a professional AI-powered git workflow! ✨
