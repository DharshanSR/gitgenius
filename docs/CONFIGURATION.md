# GitGenius Configuration Guide

This guide covers all aspects of GitGenius configuration management.

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration Templates](#configuration-templates)
- [Configuration Levels](#configuration-levels)
- [Validation](#validation)
- [Backup & Restore](#backup--restore)
- [Import & Export](#import--export)
- [Migration](#migration)
- [Advanced Usage](#advanced-usage)

## Quick Start

### Using Templates (Recommended)

The fastest way to get started is using a configuration template:

```bash
# View available templates
gitgenius config --template invalid-name  # Shows all templates

# Apply a template
gitgenius config --template default      # Balanced OpenAI GPT-3.5
gitgenius config --template gemini       # Google Gemini Pro
gitgenius config --template concise      # Short messages
gitgenius config --template detailed     # Long messages

# Set your API key
gitgenius config apiKey
```

### Manual Configuration

```bash
# Interactive configuration
gitgenius config

# Set specific values
gitgenius config provider openai
gitgenius config model gpt-3.5-turbo
gitgenius config apiKey your_api_key_here

# View current configuration
gitgenius config --list
```

## Configuration Templates

GitGenius provides pre-configured templates for common use cases:

### Default Template
**Use case:** General purpose, balanced settings
```bash
gitgenius config --template default
```
- Provider: OpenAI
- Model: gpt-3.5-turbo
- Max Tokens: 150
- Temperature: 0.7

### OpenAI GPT-4 Template
**Use case:** More detailed and accurate commit messages
```bash
gitgenius config --template openai-gpt4
```
- Provider: OpenAI
- Model: gpt-4
- Max Tokens: 200
- Temperature: 0.6

### Google Gemini Template
**Use case:** Using Google's AI model
```bash
gitgenius config --template gemini
```
- Provider: Google Gemini
- Model: gemini-pro
- Max Tokens: 150
- Temperature: 0.7

### Concise Template
**Use case:** Short, to-the-point commit messages
```bash
gitgenius config --template concise
```
- Provider: OpenAI
- Model: gpt-3.5-turbo
- Max Tokens: 80
- Temperature: 0.5

### Detailed Template
**Use case:** Comprehensive, detailed commit messages
```bash
gitgenius config --template detailed
```
- Provider: OpenAI
- Model: gpt-4
- Max Tokens: 300
- Temperature: 0.8

### Conventional Template
**Use case:** Strict conventional commits format
```bash
gitgenius config --template conventional
```
- Provider: OpenAI
- Model: gpt-3.5-turbo
- Max Tokens: 100
- Temperature: 0.3
- Includes all conventional commit types

## Configuration Levels

GitGenius uses a three-level configuration system with inheritance:

```
Project Config (highest priority)
    ↓
User Config (medium priority)
    ↓
Global Config (lowest priority)
```

### Global Configuration

System-wide settings that apply to all users.

**Location:**
- Linux/macOS: `~/.config/gitgenius/config.json`
- Windows: `%APPDATA%\gitgenius\config.json`

**Use case:** Default settings for the entire system

### User Configuration

User-specific settings that override global settings.

**Location:** Same as global
**Use case:** Personal preferences

### Project Configuration

Project-specific settings stored in the repository.

**Location:** `.gitgenius/config.json` in your git repository

**Setup:**
```bash
# Navigate to your project
cd /path/to/your/project

# Create project config directory
mkdir .gitgenius

# Export your current config as project config
gitgenius config --export .gitgenius/config.json

# Add to git if you want to share with team
git add .gitgenius/config.json
git commit -m "chore: add GitGenius project configuration"
```

**Use case:**
- Team-wide settings
- Project-specific AI provider/model
- Shared configuration across team members

### Configuration Priority Example

```bash
# Global: Use OpenAI GPT-3.5
# User: Use temperature 0.5
# Project: Use Gemini

# Result: Project config wins
# - Provider: gemini (from project)
# - Temperature: 0.5 (from user)
# - Other settings: from global
```

## Validation

Ensure your configuration is valid:

```bash
# Validate current configuration
gitgenius config --validate
```

**Output:**
```
✓ Configuration is valid
  Version: 1.2.0
```

**If validation fails:**
```
✗ Configuration validation failed:
  - maxTokens: Number must be less than or equal to 4096
  - temperature: Number must be less than or equal to 2
? Would you like to migrate and fix the configuration? (Y/n)
```

## Backup & Restore

### Creating Backups

```bash
# Create a backup of current configuration
gitgenius config --backup
```

**Output:**
```
✓ Configuration backed up successfully
  Location: /home/user/.config/gitgenius-nodejs/config-backup-1234567890.json
```

### Restoring from Backup

```bash
# Restore from a backup file
gitgenius config --restore /path/to/backup.json
```

**Interactive confirmation:**
```
? Restore configuration from 2024-01-15T10:30:00.000Z? (y/N)
```

### Backup Best Practices

1. **Before major changes:** Always backup before applying templates or migrations
2. **Regular backups:** Create periodic backups of stable configurations
3. **Team sharing:** Share backups with team members for consistent settings

## Import & Export

### Exporting Configuration

Share your configuration with others:

```bash
# Export to a file
gitgenius config --export my-config.json

# Export project config for team
gitgenius config --export .gitgenius/config.json
```

### Importing Configuration

Import a configuration from another source:

```bash
# Import team configuration
gitgenius config --import team-config.json

# Import from colleague
gitgenius config --import colleague-settings.json
```

**Interactive confirmation:**
```
? Import this configuration? (y/N)
```

### Use Cases

1. **Team onboarding:** Export and share team configuration
2. **Multiple machines:** Keep settings consistent across computers
3. **Configuration templates:** Create and share custom configurations

## Migration

GitGenius automatically migrates configuration when you upgrade versions. You can also manually trigger migration:

```bash
# Manually migrate configuration
gitgenius config --migrate
```

**Output:**
```
🔄 Migrating configuration...
✓ Configuration migrated to version 1.2.0
✓ Configuration is now valid
```

### What Migration Does

- Adds missing required fields with defaults
- Fixes invalid values
- Updates deprecated settings
- Ensures compatibility with new features

### When to Manually Migrate

- After restoring an old backup
- When validation fails
- After importing an older configuration

## Advanced Usage

### Environment Variables

Override configuration with environment variables:

```bash
# Set API key
export GITGENIUS_API_KEY="your_api_key"

# Set provider
export GITGENIUS_PROVIDER="openai"

# Set model
export GITGENIUS_MODEL="gpt-4"
```

**Priority:** Environment variables > Configuration files

### Configuration Schema

GitGenius validates configuration against this schema:

```typescript
{
  provider: 'openai' | 'gemini' | 'anthropic',  // Required
  model: string,                                 // Required
  apiKey: string | null,                        // Optional
  maxTokens: number (1-4096),                   // Required, default: 150
  temperature: number (0-2),                    // Required, default: 0.7
  commitTypes: string[],                        // Optional, with defaults
  // Additional custom properties allowed
}
```

### Custom Configuration Values

Add custom values for your workflow:

```bash
# Add custom values
gitgenius config customKey "custom value"

# View all config including custom values
gitgenius config --list
```

### Resetting Configuration

Reset to defaults:

```bash
# Reset all configuration
gitgenius config --reset
```

**Warning:** This cannot be undone (unless you have a backup)!

## Troubleshooting

### Configuration Not Loading

1. Check configuration file exists:
   ```bash
   gitgenius config --list
   ```

2. Validate configuration:
   ```bash
   gitgenius config --validate
   ```

3. If validation fails, migrate:
   ```bash
   gitgenius config --migrate
   ```

### Configuration Conflicts

If you're getting unexpected configuration values:

1. Check configuration inheritance:
   - Project config overrides user config
   - User config overrides global config
   - Environment variables override all

2. List current effective configuration:
   ```bash
   gitgenius config --list
   ```

### Migration Issues

If migration fails:

1. Create a backup first:
   ```bash
   gitgenius config --backup
   ```

2. Reset configuration:
   ```bash
   gitgenius config --reset
   ```

3. Reconfigure or apply a template:
   ```bash
   gitgenius config --template default
   gitgenius config apiKey
   ```

## Examples

### Example 1: Team Setup

```bash
# Team lead creates and exports configuration
gitgenius config --template conventional
gitgenius config model gpt-4
gitgenius config --export team-config.json

# Team members import
gitgenius config --import team-config.json
gitgenius config apiKey  # Set their own API key
```

### Example 2: Multi-Project Setup

```bash
# Default to OpenAI for most projects
gitgenius config provider openai
gitgenius config model gpt-3.5-turbo

# Use Gemini for specific project
cd /path/to/special-project
mkdir .gitgenius
gitgenius config --template gemini
gitgenius config --export .gitgenius/config.json
```

### Example 3: Configuration Backup Strategy

```bash
# Create initial backup
gitgenius config --backup

# Make changes
gitgenius config --template detailed

# Test changes
gitgenius

# If issues, restore backup
gitgenius config --restore backup-file.json
```

### Example 4: Sharing Custom Configuration

```bash
# Create custom configuration
gitgenius config maxTokens 250
gitgenius config temperature 0.65
gitgenius config commitTypes '["feat","fix","docs","refactor"]'

# Export for sharing
gitgenius config --export my-custom-config.json

# Others can import
gitgenius config --import my-custom-config.json
```

## Best Practices

1. **Use Templates:** Start with a template that matches your needs
2. **Backup Regularly:** Before major changes, create backups
3. **Validate Often:** Run validation after changes
4. **Project Configs:** Use project-level configs for team consistency
5. **Environment Variables:** Use for CI/CD and sensitive data
6. **Document Choices:** Comment your project configs for team clarity
7. **Test Changes:** Try new configurations before committing them
8. **Version Control:** Include project configs in git for team sharing

## See Also

- [Commands Reference](COMMANDS.md)
- [Main README](../README.md)
- [Configuration Examples](../examples/configurations/)
