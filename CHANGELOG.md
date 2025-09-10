# GitGenius Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-09-10

### Added
- **New Feature**: `--dry-run` option for commit command
  - Preview generated commit messages without applying changes
  - Helpful for testing AI-generated messages before committing
  - Usage: `gitgenius --dry-run` or `gitgenius -t feat --dry-run`

### Improved
- Enhanced user experience with commit message previewing
- Updated documentation with dry-run examples

## [1.1.0] - 2025-08-16

### Changed
- **BREAKING**: Updated Node.js engine requirement to >=20.0.0
- Updated `conf` dependency from 12.0.0 to 14.0.0 for enhanced configuration management
- Improved dependency management and security updates

### Added
- Enhanced configuration features with latest conf package
- Better TypeScript support and performance improvements

### Security
- Updated dependencies to latest secure versions

## [1.0.0] - 2025-08-14

### Added
- Initial release of GitGenius
- AI-powered commit message generation
- Support for OpenAI and Google Gemini providers
- Interactive commit message editing
- Branch management with interactive checkout
- Commit statistics and analytics
- Custom template system
- Clipboard integration
- Conventional commits support
- Previous commit message retrieval
- Comprehensive configuration management
- Force delete branches option
- Multi-provider AI support
- Environment variable configuration
- Command aliases (gg shorthand)

### Features
- Generate intelligent commit messages from git diffs
- Apply generated messages directly to commits
- Copy messages to clipboard
- Specify commit types (feat, fix, chore, etc.)
- Interactive branch switching and deletion
- View detailed git statistics
- Create and manage commit message templates
- Configure multiple AI providers and models
- Edit and amend previous commits
- List and filter branches (including remote)

### Commands
- `gitgenius` / `gg` - Generate commit messages
- `gitgenius config` - Manage configuration
- `gitgenius branch` - Branch management
- `gitgenius checkout` - Interactive branch checkout
- `gitgenius prev` - Previous commit operations
- `gitgenius stats` - Git statistics
- `gitgenius template` - Template management

### Supported AI Providers
- OpenAI (GPT-3.5 Turbo, GPT-4, GPT-4 Turbo)
- Google Gemini (Gemini Pro, Gemini Pro Vision)

### Configuration
- Local configuration storage
- Environment variable support
- Interactive configuration setup
- Provider and model selection
- API key management
