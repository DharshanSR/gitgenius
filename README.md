# GitGenius

**AI-Powered Commit Message Generator**

GitGenius is a professional command-line tool that generates intelligent, context-aware commit messages using AI. Built for developers who value code quality and clear commit history.

[![npm version](https://badge.fury.io/js/@dharshansr%2Fgitgenius.svg)](https://badge.fury.io/js/@dharshansr/gitgenius)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![GitHub Pages](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://dharshansr.github.io/gitgenius/)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Platform-Specific Setup](#platform-specific-setup)
- [Commands](#commands)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Contributing](#contributing)

## Features

- **Intelligent Commit Messages**: AI-generated commit messages based on staged changes
- **Multiple AI Providers**: OpenAI GPT and Google Gemini support
- **Conventional Commits**: Built-in support for conventional commit standards
- **Interactive Editing**: Edit generated messages before committing
- **Branch Management**: Interactive branch switching and management
- **Git Statistics**: Detailed commit analytics and insights
- **Custom Templates**: Create and manage commit message templates
- **Cross-Platform**: Full support for Windows, macOS, and Linux
- **Clipboard Integration**: Quick copy functionality
- **Previous Message Retrieval**: Access and amend previous commits
- **🆕 Robust Git Integration**: Advanced Git state detection and error handling
  - Detached HEAD detection and warnings
  - Merge conflict detection with resolution hints
  - Dirty workspace validation before operations
  - Git worktrees and submodules support
  - CI/CD-friendly error codes and messages

## Installation

### Prerequisites

- Node.js 16.0 or higher
- npm 7.0 or higher
- Git installed and configured

### Global Installation

```bash
npm install -g @dharshansr/gitgenius
```

### Verify Installation

```bash
gitgenius --version
# or
gg --version
```

### Update to Latest Version

```bash
npm update -g @dharshansr/gitgenius
```

## Configuration

### Quick Start with Templates

Get started quickly with pre-configured templates:

```bash
# Apply a template for quick setup
gitgenius config --template default      # OpenAI GPT-3.5 (recommended)
gitgenius config --template gemini       # Google Gemini Pro
gitgenius config --template openai-gpt4  # OpenAI GPT-4 (detailed)
gitgenius config --template concise      # Short, concise messages
gitgenius config --template detailed     # Long, detailed messages

# Then set your API key
gitgenius config apiKey
```

### Initial Setup

1. **Set up your AI provider API key:**

```bash
gitgenius config apiKey
```

2. **Choose your AI provider:**

```bash
gitgenius config provider
```

3. **Select your preferred model:**

```bash
gitgenius config model
```

### Advanced Configuration Management

GitGenius provides powerful configuration management features:

#### Validation
```bash
gitgenius config --validate    # Check configuration for errors
```

#### Backup & Restore
```bash
gitgenius config --backup                    # Create backup
gitgenius config --restore backup-file.json  # Restore from backup
```

#### Import & Export
```bash
gitgenius config --export my-config.json   # Export to share
gitgenius config --import team-config.json # Import team settings
```

#### Migration
```bash
gitgenius config --migrate    # Manually migrate to latest version
```

### Configuration Inheritance

GitGenius uses a three-level configuration system:

1. **Global** - System-wide settings (lowest priority)
   - Location: `~/.config/gitgenius/` (Linux/macOS) or `%APPDATA%/gitgenius/` (Windows)
   - Use for default settings across all projects

2. **User** - User-specific settings (medium priority)
   - Same location as global, but can override specific values
   - Use for personal preferences

3. **Project** - Project-specific settings (highest priority)
   - Location: `.gitgenius/config.json` in your git repository
   - Use for team or project-specific requirements
   - Overrides both user and global settings

Example use case: Set OpenAI as your global provider, but use Gemini for a specific project by creating a project config in that repository.

### API Key Configuration

#### OpenAI Setup
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Configure GitGenius:
   ```bash
   gitgenius config apiKey
   # Enter your OpenAI API key when prompted
   ```

#### Google Gemini Setup
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Configure GitGenius:
   ```bash
   gitgenius config provider
   # Select "Google Gemini"
   gitgenius config apiKey
   # Enter your Gemini API key when prompted
   ```

### Environment Variables

You can also configure GitGenius using environment variables:

```bash
export GITGENIUS_API_KEY="your_api_key_here"
export GITGENIUS_PROVIDER="openai"  # or "gemini"
export GITGENIUS_MODEL="gpt-3.5-turbo"  # or your preferred model
```

## Platform-Specific Setup

### Windows

#### PowerShell Configuration
Add to your PowerShell profile (`$PROFILE`):
```powershell
$env:GITGENIUS_API_KEY = "your_api_key_here"
```

#### Command Prompt Configuration
Add to your system environment variables:
1. Press `Win + R`, type `sysdm.cpl`
2. Go to Advanced > Environment Variables
3. Add `GITGENIUS_API_KEY` with your API key value

#### Configuration File Location
```
%APPDATA%\gitgenius\config.json
```

### macOS

#### Shell Configuration
Add to your shell profile (`~/.zshrc` or `~/.bash_profile`):
```bash
export GITGENIUS_API_KEY="your_api_key_here"
export PATH="/usr/local/bin:$PATH"  # Ensure npm global packages are in PATH
```

#### Configuration File Location
```
~/Library/Preferences/gitgenius/config.json
```

### Linux

#### Shell Configuration
Add to your shell profile (`~/.bashrc` or `~/.zshrc`):
```bash
export GITGENIUS_API_KEY="your_api_key_here"
export PATH="$HOME/.npm-global/bin:$PATH"  # If using npm global prefix
```

#### Configuration File Location
```
~/.config/gitgenius/config.json
```

#### Ubuntu/Debian Additional Setup
```bash
# Ensure npm global packages work correctly
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

## Usage

### Basic Workflow

1. **Stage your changes:**
   ```bash
   git add .
   ```

2. **Generate commit message:**
   ```bash
   gitgenius
   ```

3. **Apply directly:**
   ```bash
   gitgenius --apply
   ```

### Quick Commands

```bash
# Generate and apply commit
gitgenius -a

# Generate with specific type
gitgenius -t feat

# Copy to clipboard
gitgenius -c

# Preview without applying (dry run)
gitgenius --dry-run

# Combine options
gitgenius -t fix -a -c
```

## Commands

### Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `gitgenius` | Generate commit message | `gitgenius` |
| `gitgenius -a, --apply` | Generate and commit | `gitgenius -a` |
| `gitgenius -c, --copy` | Copy to clipboard | `gitgenius -c` |
| `gitgenius -t, --type <type>` | Specify commit type | `gitgenius -t feat` |
| `gitgenius --dry-run` | Preview commit message | `gitgenius --dry-run` |

### Branch Management

| Command | Description | Example |
|---------|-------------|---------|
| `gitgenius branch` | List branches | `gitgenius branch` |
| `gitgenius branch -r` | Include remote branches | `gitgenius branch -r` |
| `gitgenius branch -c` | Copy branch name | `gitgenius branch -c` |
| `gitgenius checkout` | Interactive checkout | `gitgenius checkout` |

### Configuration Commands

| Command | Description | Example |
|---------|-------------|---------|
| `gitgenius config` | Show configuration | `gitgenius config` |
| `gitgenius config provider` | Set AI provider | `gitgenius config provider` |
| `gitgenius config model` | Set AI model | `gitgenius config model` |
| `gitgenius config --reset` | Reset configuration | `gitgenius config --reset` |
| `gitgenius config --validate` | Validate configuration | `gitgenius config --validate` |
| `gitgenius config --backup` | Backup configuration | `gitgenius config --backup` |
| `gitgenius config --restore <file>` | Restore from backup | `gitgenius config --restore backup.json` |
| `gitgenius config --template <name>` | Apply template | `gitgenius config --template gemini` |
| `gitgenius config --export <file>` | Export configuration | `gitgenius config --export config.json` |
| `gitgenius config --import <file>` | Import configuration | `gitgenius config --import config.json` |

**Configuration Templates:**
- `default` - Default OpenAI GPT-3.5 configuration
- `openai-gpt4` - GPT-4 for detailed messages
- `gemini` - Google Gemini Pro configuration
- `concise` - Concise messages with lower token limit
- `detailed` - Detailed messages with higher token limit
- `conventional` - Strict conventional commits format

### Statistics and Analytics

| Command | Description | Example |
|---------|-------------|---------|
| `gitgenius stats` | Show commit statistics | `gitgenius stats` |
| `gitgenius stats --days 7` | Stats for 7 days | `gitgenius stats --days 7` |
| `gitgenius stats --author "name"` | Author-specific stats | `gitgenius stats --author "John"` |

### Template Management

| Command | Description | Example |
|---------|-------------|---------|
| `gitgenius template --list` | List templates | `gitgenius template --list` |
| `gitgenius template --add <name>` | Create template | `gitgenius template --add feat` |
| `gitgenius template --use <name>` | Use template | `gitgenius template --use feat` |

### Git State & Diagnostics

| Command | Description | Example |
|---------|-------------|---------|
| `gitgenius state` | Show repository state | `gitgenius state` |
| `gitgenius state --validate` | Validate Git environment | `gitgenius state --validate` |
| `gitgenius state --worktrees` | Show worktree details | `gitgenius state --worktrees` |
| `gitgenius state --submodules` | Show submodule details | `gitgenius state --submodules` |

**State Information Shown:**
- Current branch or detached HEAD status
- Uncommitted changes detection
- Staged changes status
- Untracked files presence
- Merge/rebase in progress warnings
- Merge conflict detection
- Worktree information
- Submodule status
- Git environment validation

📖 **[Learn more about Git Integration](docs/GIT_INTEGRATION.md)**

## Supported Commit Types

GitGenius supports conventional commit standards:

- `feat` - New features
- `fix` - Bug fixes  
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `test` - Test changes
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `ci` - CI/CD changes
- `build` - Build system changes

## Troubleshooting

### Common Issues

**"Command not found: gitgenius"**
- Ensure npm global packages are in your PATH
- Try reinstalling: `npm uninstall -g @dharshansr/gitgenius && npm install -g @dharshansr/gitgenius`

**"Not in a git repository"**
- Initialize git repository: `git init`
- Ensure you're in the correct directory

**"No staged changes found"**  
- Stage your changes: `git add <files>`
- Check status: `git status`

**"Invalid API key"**
- Verify API key: `gitgenius config apiKey`
- Check environment variable: `echo $GITGENIUS_API_KEY`

**"Network/API errors"**
- Check internet connection
- Verify API key has sufficient credits
- Try different model: `gitgenius config model`

**"Detached HEAD state"**
- Create a branch: `git checkout -b my-branch`
- Return to a branch: `git checkout main`
- Check state: `gitgenius state`

**"Merge conflicts detected"**
- View conflicts: `gitgenius state`
- Resolve conflicts in files
- Stage resolved files: `git add <file>`
- Complete merge: `git commit`

**"Cannot proceed: uncommitted changes"**
- Commit changes: `git commit -am "message"`
- Stash changes: `git stash`
- Check state: `gitgenius state`

### Debug Mode

Enable detailed logging:

**Windows (PowerShell):**
```powershell
$env:DEBUG = "gitgenius*"; gitgenius
# or
$env:LOG_LEVEL = "debug"; gitgenius
```

**macOS/Linux:**
```bash
DEBUG=gitgenius* gitgenius
# or
LOG_LEVEL=debug gitgenius
```

**Using CLI:**
```bash
# Enable debug mode
gitgenius debug --enable

# Disable debug mode
gitgenius debug --disable

# Check debug status
gitgenius debug --status

# View performance metrics
gitgenius debug --performance
```

### Logging and Monitoring

GitGenius includes comprehensive logging and debugging infrastructure:

**View Logs:**
```bash
# Show recent logs (last 50 entries)
gitgenius logs

# Show specific number of lines
gitgenius logs --lines 100

# Show log statistics
gitgenius logs --stats

# Export logs to file
gitgenius logs --export logs.json

# Set log level
gitgenius logs --level debug  # trace, debug, info, warn, error

# Clear all logs
gitgenius logs --clear
```

**Error Tracking:**
```bash
# List unresolved errors
gitgenius errors

# Show error statistics
gitgenius errors --stats

# Include resolved errors
gitgenius errors --resolved

# Filter by category
gitgenius errors --category git

# Export errors to file
gitgenius errors --export errors.json

# Clear resolved errors
gitgenius errors --clear --resolved

# Clear all errors
gitgenius errors --clear
```

**Log Files Location:**
- Logs: `~/.gitgenius/logs/gitgenius.log`
- Errors: `~/.gitgenius/errors/errors.json`

**Features:**
- Structured logging with multiple levels
- Automatic log rotation (10MB per file, max 5 files)
- Performance metrics tracking
- Error tracking with occurrence counting
- Debug mode with verbose output
- Console and file logging

### Reset Configuration

If experiencing persistent issues:
```bash
gitgenius config --reset
```

## Development

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/DharshanSR/gitgenius.git
cd gitgenius

# Install dependencies
npm install

# Build project
npm run build

# Link for testing
npm link

# Run tests
npm test

# Start development
npm run dev
```

### Release Management

GitGenius includes automated version management:

```bash
# Patch release (1.0.0 → 1.0.1)
npm run release:patch

# Minor release (1.0.1 → 1.1.0)  
npm run release:minor

# Major release (1.1.0 → 2.0.0)
npm run release:major
```

Each release command automatically:
- Runs tests and builds
- Updates version numbers
- Creates git commit and tag
- Pushes to GitHub
- Publishes to npm

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Guidelines

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

### Code Standards

- TypeScript for all source code
- ESLint for code quality
- Jest for testing
- Conventional commits for commit messages

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/DharshanSR/gitgenius/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DharshanSR/gitgenius/discussions)
- **npm Package**: [npm Page](https://www.npmjs.com/package/@dharshansr/gitgenius)

---

**GitGenius** - Intelligent commit messages for professional development workflows.

## Usage

### Basic Commands

Generate a commit message:
```bash
gitgenius
```

Apply the generated commit message directly:
```bash
gitgenius --apply  # or -a
```

Copy the generated message to clipboard:
```bash
gitgenius --copy   # or -c
```

Specify commit type:
```bash
gitgenius --type feat  # or -t feat
```

Combine options:
```bash
gitgenius -t fix -a -c  # Generate fix-type commit, apply and copy
```

### Advanced Features

#### Previous Commit Management
```bash
gitgenius prev                    # Show previous message
gitgenius prev --apply            # Apply previous message
gitgenius prev --edit --amend     # Edit and amend previous commit
```

#### Branch Management
```bash
gitgenius branch                  # List branches
gitgenius branch --remote         # Include remote branches
gitgenius branch --copy           # Select and copy branch name
gitgenius branch --delete         # Delete branches
gitgenius checkout                # Interactive branch checkout
```

#### Configuration
```bash
gitgenius config                    # Show all config
gitgenius config provider           # Set AI provider
gitgenius config model              # Set AI model
gitgenius config --reset            # Reset configuration
gitgenius config --validate         # Validate configuration
gitgenius config --backup           # Backup configuration
gitgenius config --restore file.json # Restore from backup
gitgenius config --template gemini  # Apply Gemini template
gitgenius config --export file.json # Export configuration
```

**Configuration Inheritance:**
GitGenius uses a three-level configuration system:
- **Global**: System-wide settings (lowest priority)
- **User**: User-specific settings (medium priority)  
- **Project**: Project-specific settings in `.gitgenius/` (highest priority)

**Configuration Templates:**
Quick setup with pre-configured templates:
- `default` - OpenAI GPT-3.5 (balanced)
- `openai-gpt4` - GPT-4 (detailed)
- `gemini` - Google Gemini Pro
- `concise` - Short messages
- `detailed` - Long messages
- `conventional` - Strict format

#### Templates
```bash
gitgenius template --list         # List templates
gitgenius template --add "feat"   # Add new template
gitgenius template --use "feat"   # Use template
```

#### Statistics
```bash
gitgenius stats                   # Show commit stats (30 days)
gitgenius stats --days 7          # Stats for last 7 days
gitgenius stats --author "John"   # Stats for specific author
```

## Configuration

### API Providers

#### OpenAI (default)
```bash
gitgenius config provider
# Select: OpenAI
gitgenius config model
# Choose: gpt-3.5-turbo, gpt-4, or gpt-4-turbo-preview
```

#### Google Gemini
```bash
gitgenius config provider
# Select: Google Gemini
gitgenius config model
# Choose: gemini-pro or gemini-pro-vision
```

### Environment Variables

- `GITGENIUS_API_KEY`: Your AI provider API key
- Supported providers:
  - OpenAI: Get key from [OpenAI Dashboard](https://platform.openai.com/api-keys)
  - Gemini: Get key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Configuration File

GitGenius stores configuration in your system's config directory:
- **Linux**: `~/.config/gitgenius/config.json`
- **macOS**: `~/Library/Preferences/gitgenius/config.json`
- **Windows**: `%APPDATA%/gitgenius/config.json`

## Commit Types

GitGenius supports conventional commit types:

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

## Examples

### Basic Usage
```bash
# Stage changes
git add src/components/Button.tsx

# Generate and apply commit
gitgenius -t feat -a
# Output: "feat: add new Button component with hover effects"
```

### Branch Management
```bash
# Interactive branch switching
gitgenius checkout

# List and copy branch name
gitgenius branch -c

# Delete unused branches
gitgenius branch --delete
```

### Templates
```bash
# Create a template
gitgenius template --add "hotfix"
# Pattern: "hotfix: {description}"

# Use the template
gitgenius template --use "hotfix"
```

## Troubleshooting

### Common Issues

1. **"Not in a git repository"**
   - Ensure you're in a git repository: `git init`

2. **"No staged changes found"**
   - Stage your changes first: `git add <files>`

3. **"Invalid API key"**
   - Verify your API key: `gitgenius config apiKey`
   - Check environment variable: `echo $GITGENIUS_API_KEY`

4. **Module resolution errors**
   - Update Node.js to version 16 or higher
   - Clear npm cache: `npm cache clean --force`

### Debug Mode

Enable verbose logging:
```bash
DEBUG=gitgenius* gitgenius
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/DharshanSR/gitgenius.git

# Install dependencies
cd gitgenius
npm install

# Build the project
npm run build

# Link for local development
npm link

# Run tests
npm test
```

### Automated Release Management

GitGenius includes automated version management - no need to manually update version numbers!

#### Release Commands

```bash
# For bug fixes (1.0.0 → 1.0.1)
npm run release:patch

# For new features (1.0.1 → 1.1.0)
npm run release:minor

# For breaking changes (1.1.0 → 2.0.0)
npm run release:major
```

#### What Happens Automatically

Each release command automatically:
- ✅ Runs all tests and builds the project
- ✅ Updates version in `package.json` and `package-lock.json`
- ✅ Creates a git commit with the version bump
- ✅ Creates a git tag (e.g., `v1.0.1`)
- ✅ Pushes changes and tags to GitHub
- ✅ Publishes the new version to npm

#### Example Workflow

```bash
# Make your changes
git add .
git commit -m "feat: add new AI provider support"

# Release new minor version automatically
npm run release:minor
# ✨ Version bumped to 1.1.0, tagged, pushed, and published!
```

No manual version management required! 🚀

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Support

- 🐛 [Report Issues](https://github.com/DharshanSR/gitgenius/issues)
- 💬 [Discussions](https://github.com/DharshanSR/gitgenius/discussions)
- 📖 [Documentation](https://gitgenius-docs.example.com)

---

**GitGenius** - Making commit messages intelligent, one commit at a time! ⭐

If you find this tool helpful, please consider giving it a star on GitHub!
