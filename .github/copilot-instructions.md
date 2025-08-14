<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->
- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements

- [x] Scaffold the Project

- [x] Customize the Project

- [x] Install Required Extensions

- [x] Compile the Project

- [x] Create and Run Task

- [x] Launch the Project

- [x] Ensure Documentation is Complete

GitGenius - AI-Powered Commit Message Generator

A comprehensive TypeScript npm CLI package for generating intelligent commit messages with enhanced AI-powered features.

**Key Features Implemented:**
✅ AI commit message generation with multiple providers (OpenAI, Gemini)
✅ Interactive editing capabilities with built-in editor
✅ Advanced branch management with interactive checkout
✅ Comprehensive configuration management
✅ Multiple commit types support (conventional commits)
✅ Copy to clipboard functionality
✅ Previous message retrieval and amendment
✅ Enhanced git integration with staging checks
✅ Git statistics and analytics
✅ Custom template system
✅ Force delete branches with safety checks
✅ Environment variable configuration
✅ Command aliases (gg shorthand)
✅ Error handling and user feedback

**Technical Implementation:**
- TypeScript with ES modules
- Commander.js for CLI interface
- Multiple AI provider support (extensible architecture)
- Configuration management with Conf
- Git integration with simple-git
- Interactive prompts with Inquirer
- Clipboard integration with Clipboardy
- Rich terminal output with Chalk and Ora
- Comprehensive test setup with Jest
- ESLint configuration for code quality

**Usage Examples:**
- `gitgenius` - Generate commit message
- `gitgenius -t feat -a` - Generate feat-type commit and apply
- `gitgenius branch -c` - Interactive branch selection with clipboard
- `gitgenius stats --days 7` - Show 7-day commit statistics
- `gitgenius config provider` - Set AI provider
- `gg checkout` - Quick interactive branch switching

The project is ready for use and distribution via npm!
