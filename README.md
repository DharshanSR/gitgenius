# GitGenius 

**(/gɪt ˈdʒiːniəs/, Git + Genius)**

AI-powered commit message generator with enterprise-grade features for professional development workflows.

![GitGenius Banner](https://raw.githubusercontent.com/DharshanSR/gitgenius/main/assets/banner.png)

[![npm version](https://badge.fury.io/js/@dharshansr%2Fgitgenius.svg)](https://badge.fury.io/js/@dharshansr%2Fgitgenius)
[![Downloads](https://img.shields.io/npm/dm/@dharshansr/gitgenius.svg)](https://www.npmjs.com/package/@dharshansr/gitgenius)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/DharshanSR/gitgenius/workflows/CI/badge.svg)](https://github.com/DharshanSR/gitgenius/actions)

## Features

✨ **Intelligent Commit Messages**: Generate clear, context-aware commit messages based on your staged changes
🔧 **Multiple AI Providers**: Support for OpenAI, Google Gemini, and more
🎯 **Commit Types**: Conventional commits support with customizable types
📋 **Copy to Clipboard**: Quick copy functionality for generated messages
✏️ **Interactive Editing**: Refine your commit messages with built-in editor
🌿 **Branch Management**: Interactive branch switching and management
📊 **Git Statistics**: Detailed commit analytics and insights
📝 **Custom Templates**: Create and manage reusable commit message templates
⚙️ **Flexible Configuration**: Easy setup and customization

## Installation

Install GitGenius globally using npm:

```bash
npm install -g @dharshansr/gitgenius
```

After installation, you can run `gitgenius` or `gg` from any terminal.

### Updates

To get the latest version:
```bash
npm update -g @dharshansr/gitgenius
```

Check your current version:
```bash
gitgenius --version  # or gg --version
```

## Quick Start

1. **Configure your API key**:
   ```bash
   gitgenius config apiKey
   ```
   Or set the environment variable:
   ```bash
   export GITGENIUS_API_KEY="your_api_key_here"
   ```

2. **Stage your changes**:
   ```bash
   git add .
   ```

3. **Generate a commit message**:
   ```bash
   gitgenius
   ```

4. **Apply the generated message**:
   ```bash
   gitgenius --apply
   ```

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
gitgenius config                  # Show all config
gitgenius config provider         # Set AI provider
gitgenius config model            # Set AI model
gitgenius config --reset          # Reset configuration
```

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
