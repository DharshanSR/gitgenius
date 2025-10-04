# Logging and Debugging Infrastructure

GitGenius includes a comprehensive logging and debugging infrastructure for monitoring, troubleshooting, and performance analysis.

## Overview

The logging infrastructure consists of three main components:

1. **Logger** - Structured logging with multiple levels
2. **ErrorTracker** - Error tracking and monitoring
3. **PerformanceMonitor** - Performance metrics tracking (integrated)

## Features

- 📊 **Structured Logging**: Multiple log levels (trace, debug, info, warn, error)
- 🔄 **Log Rotation**: Automatic rotation at 10MB per file, keeps last 5 files
- 📈 **Performance Tracking**: Monitor operation durations and success rates
- 🐛 **Error Tracking**: Track and categorize errors with occurrence counting
- 💾 **Persistent Storage**: Logs and errors saved to disk
- 🎨 **Pretty Output**: Colored, formatted console output
- 📤 **Export**: Export logs and errors to JSON files
- 🔍 **Debug Mode**: Verbose logging for troubleshooting

## Log Levels

GitGenius supports five log levels in order of verbosity:

1. **trace** - Most verbose, includes all operations
2. **debug** - Detailed information for debugging
3. **info** - General informational messages (default)
4. **warn** - Warning messages
5. **error** - Error messages only

## CLI Commands

### View Logs

```bash
# Show recent logs (default: 50 lines)
gitgenius logs

# Show specific number of lines
gitgenius logs --lines 100

# Show log statistics
gitgenius logs --stats

# Export logs to file
gitgenius logs --export logs.json

# Set log level
gitgenius logs --level debug

# Clear all logs
gitgenius logs --clear
```

### Error Tracking

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

### Debug Mode

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

## Environment Variables

### LOG_LEVEL

Set the logging level:

```bash
# Linux/macOS
export LOG_LEVEL=debug
gitgenius

# Windows PowerShell
$env:LOG_LEVEL = "debug"
gitgenius
```

Valid values: `trace`, `debug`, `info`, `warn`, `error`

### DEBUG

Enable debug mode (compatible with other tools):

```bash
# Linux/macOS
export DEBUG=gitgenius*
gitgenius

# Windows PowerShell
$env:DEBUG = "gitgenius*"
gitgenius
```

### LOG_PRETTY

Control pretty printing (default: true):

```bash
# Disable pretty printing (JSON only)
export LOG_PRETTY=false
gitgenius
```

## File Locations

All logs and tracking data are stored in the user's home directory:

- **Logs**: `~/.gitgenius/logs/gitgenius.log`
- **Error Tracking**: `~/.gitgenius/errors/errors.json`
- **Performance Metrics**: Stored in config

### Rotated Logs

When logs reach 10MB, they are automatically rotated:

```
~/.gitgenius/logs/
├── gitgenius.log               # Current log file
├── gitgenius.log.2024-01-15T10-30-00-000Z
├── gitgenius.log.2024-01-14T08-20-00-000Z
└── ...
```

Only the last 5 log files are kept.

## Usage Examples

### Basic Logging

```bash
# Run command with debug logging
LOG_LEVEL=debug gitgenius commit

# View the logs
gitgenius logs --lines 50
```

### Troubleshooting

```bash
# Enable debug mode
gitgenius debug --enable

# Run problematic command
gitgenius commit

# Check for errors
gitgenius errors --stats

# View detailed logs
gitgenius logs --lines 100

# Export for sharing
gitgenius logs --export debug-logs.json
gitgenius errors --export error-report.json
```

### Performance Analysis

```bash
# Enable debug mode for detailed metrics
gitgenius debug --enable

# Run operations
gitgenius commit
gitgenius pr

# View performance metrics
gitgenius debug --performance
```

### Monitoring

```bash
# Check current status
gitgenius debug --status

# View recent activity
gitgenius logs --stats

# Check for errors
gitgenius errors --stats
```

## Log Format

### Console Output

Pretty formatted with colors:

```
2024-01-15T10:30:00.000Z [INFO] [GitService] Repository initialized
2024-01-15T10:30:01.523Z [DEBUG] [AIService] Generating commit message
  { provider: "openai", model: "gpt-3.5-turbo" }
2024-01-15T10:30:03.821Z [WARN] [Performance] Slow operation detected: api_call took 2.30s
```

### File Format

JSON structured logs:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "category": "GitService",
  "message": "Repository initialized",
  "metadata": {}
}
```

## Error Categories

Errors are categorized for better tracking:

- **git** - Git operations and repository issues
- **ai** - AI service and API issues
- **config** - Configuration problems
- **network** - Network and connectivity issues
- **user** - User input and validation errors

## Performance Metrics

The PerformanceMonitor tracks operation durations:

```bash
# View all tracked operations
gitgenius debug --performance
```

Output includes:
- Average execution time
- Success rate
- Total number of runs
- Recent operation results

## Best Practices

### Development

1. Enable debug mode during development:
   ```bash
   export LOG_LEVEL=debug
   ```

2. Monitor performance of operations:
   ```bash
   gitgenius debug --performance
   ```

3. Check for recurring errors:
   ```bash
   gitgenius errors --stats
   ```

### Production

1. Use info or warn level in production:
   ```bash
   export LOG_LEVEL=info
   ```

2. Regularly check error statistics:
   ```bash
   gitgenius errors --stats
   ```

3. Export logs for analysis:
   ```bash
   gitgenius logs --export production-logs.json
   ```

### Troubleshooting

1. Enable debug mode:
   ```bash
   gitgenius debug --enable
   ```

2. Reproduce the issue

3. Export diagnostics:
   ```bash
   gitgenius logs --export issue-logs.json
   gitgenius errors --export issue-errors.json
   ```

4. Clean up after troubleshooting:
   ```bash
   gitgenius debug --disable
   gitgenius logs --clear
   ```

## Integration with Existing Features

### ErrorHandler

All errors handled by ErrorHandler are automatically tracked:

```typescript
// Errors are logged and tracked automatically
throw ErrorHandler.gitError('Repository not found', [
  'Run: git init',
  'Ensure you\'re in the correct directory'
]);
```

### PerformanceMonitor

Performance metrics are automatically logged:

```typescript
// Start timing
monitor.startTimer('commit_generation');

// ... operation ...

// End timing (automatically logs if slow)
monitor.endTimer('commit_generation', true);
```

## API Usage (Programmatic)

If you're extending GitGenius, you can use the logging APIs:

```typescript
import { logger } from './utils/Logger';
import { errorTracker } from './utils/ErrorTracker';

// Logging
logger.debug('MyFeature', 'Operation started');
logger.info('MyFeature', 'Processing', { items: 10 });
logger.warn('MyFeature', 'Deprecated function used');
logger.error('MyFeature', 'Operation failed', error);

// Error Tracking
errorTracker.trackError('git', 'Command failed', error, {
  command: 'git commit',
  cwd: process.cwd()
});

// Get statistics
const stats = logger.getLogStats();
const errorStats = errorTracker.getErrorStats();
```

## FAQ

**Q: Where are logs stored?**  
A: Logs are stored in `~/.gitgenius/logs/gitgenius.log`

**Q: How do I increase verbosity?**  
A: Set `LOG_LEVEL=debug` or run `gitgenius debug --enable`

**Q: How much disk space do logs use?**  
A: Maximum 50MB (5 files × 10MB each)

**Q: How do I clear old logs?**  
A: Run `gitgenius logs --clear`

**Q: Can I disable file logging?**  
A: File logging is always enabled for troubleshooting purposes

**Q: How do I share logs for support?**  
A: Export with `gitgenius logs --export logs.json` and `gitgenius errors --export errors.json`

## Troubleshooting

### No logs appearing

1. Check log level: `gitgenius debug --status`
2. Ensure directory exists: `ls -la ~/.gitgenius/logs/`
3. Check permissions on log directory

### Logs not rotating

1. Check current file size: `gitgenius logs --stats`
2. Verify file permissions
3. Try clearing logs: `gitgenius logs --clear`

### Performance issues

1. Check log file size: `gitgenius logs --stats`
2. Clear old logs: `gitgenius logs --clear`
3. Reduce log level: `gitgenius logs --level warn`

## Contributing

When adding new features to GitGenius:

1. Use appropriate log levels
2. Add categories for your feature
3. Track errors with ErrorTracker
4. Use PerformanceMonitor for long operations
5. Add documentation for new log categories

---

For more information, see the [GitGenius documentation](https://github.com/DharshanSR/gitgenius).
