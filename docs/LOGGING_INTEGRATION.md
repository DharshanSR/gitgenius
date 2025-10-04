# Logging Infrastructure Integration Examples

This document shows how the logging infrastructure integrates with GitGenius components.

## Integration Points

### 1. ErrorHandler Integration

The ErrorHandler automatically logs and tracks all errors:

```typescript
// src/utils/ErrorHandler.ts
import { logger } from './Logger.js';
import { errorTracker } from './ErrorTracker.js';

export class ErrorHandler {
  static handle(error: unknown): void {
    if (error instanceof GitGeniusError) {
      // Error is automatically logged and tracked
      errorTracker.trackError(error.category, error.message, error, { 
        code: error.code,
        suggestions: error.suggestions 
      });
    }
  }
}
```

**Result**: All errors thrown in GitGenius are automatically:
- Logged with full context
- Tracked with occurrence counting
- Available for analysis via `gitgenius errors`

### 2. PerformanceMonitor Integration

Performance metrics are automatically logged when operations complete:

```typescript
// src/utils/PerformanceMonitor.ts
import { logger } from './Logger.js';

private recordMetric(metric: PerformanceMetric): void {
  // ... store metric ...
  
  // Log performance metric
  logger.debug('Performance', `${metric.operation} completed in ${metric.duration.toFixed(2)}ms`, {
    operation: metric.operation,
    duration: metric.duration,
    success: metric.success
  });

  // Log slow operations as warnings
  if (metric.duration > 5000 && metric.success) {
    logger.warn('Performance', `Slow operation detected: ${metric.operation} took ${(metric.duration / 1000).toFixed(2)}s`);
  }
}
```

**Result**: All timed operations automatically:
- Log completion with duration
- Warn if operations are slow (>5s)
- Available via `gitgenius debug --performance`

## Example Usage Scenarios

### Scenario 1: Commit Generation with Logging

```bash
# Enable debug mode to see detailed logs
$ LOG_LEVEL=debug gitgenius commit

# View what happened
$ gitgenius logs --lines 20
```

Example log output:
```
2024-01-15T10:30:00.123Z [DEBUG] [GitService] Checking repository status
2024-01-15T10:30:00.234Z [INFO] [GitService] Found 3 staged files
2024-01-15T10:30:00.345Z [DEBUG] [AIService] Generating commit message with provider: openai
2024-01-15T10:30:02.456Z [DEBUG] [Performance] commit_generation completed in 2111.23ms
  { operation: "commit_generation", duration: 2111.23, success: true }
2024-01-15T10:30:02.567Z [INFO] [CommitHandler] Commit message generated successfully
```

### Scenario 2: Error Tracking

```bash
# Try to commit without staged changes
$ gitgenius commit
[WARNING] No staged changes found

# Error is tracked automatically
$ gitgenius errors --stats
[ERRORS] Error Statistics:
  Total errors: 1
  Unresolved errors: 1
  
  By category:
    git: 1
```

### Scenario 3: Performance Analysis

```bash
# Run multiple operations
$ gitgenius commit
$ gitgenius pr
$ gitgenius stats

# View performance metrics
$ gitgenius debug --performance
[DEBUG] Performance Metrics:
────────────────────────────────────────

commit_generation:
  Average time: 2345.67ms
  Success rate: 100.00%
  Total runs: 3

api_call:
  Average time: 1567.89ms
  Success rate: 95.00%
  Total runs: 5
```

## Adding Logging to New Features

When adding new features to GitGenius, follow these patterns:

### Pattern 1: Operation Logging

```typescript
import { logger } from '../utils/Logger.js';

export class MyNewFeature {
  async performOperation(): Promise<void> {
    logger.debug('MyFeature', 'Starting operation');
    
    try {
      // Your code here
      logger.info('MyFeature', 'Operation completed successfully');
    } catch (error) {
      logger.error('MyFeature', 'Operation failed', error);
      throw error;
    }
  }
}
```

### Pattern 2: Performance Tracking

```typescript
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';

export class MyNewFeature {
  private perfMonitor = PerformanceMonitor.getInstance();
  
  async expensiveOperation(): Promise<void> {
    this.perfMonitor.startTimer('my_operation');
    
    try {
      // Your expensive operation
      this.perfMonitor.endTimer('my_operation', true);
    } catch (error) {
      this.perfMonitor.endTimer('my_operation', false);
      throw error;
    }
  }
}
```

### Pattern 3: Error Tracking

```typescript
import { errorTracker } from '../utils/ErrorTracker.js';

export class MyNewFeature {
  async riskyOperation(): Promise<void> {
    try {
      // Your code
    } catch (error) {
      errorTracker.trackError('myfeature', 'Operation failed', error, {
        context: 'additional context',
        userId: 'user123'
      });
      throw error;
    }
  }
}
```

## Logging Best Practices

### 1. Use Appropriate Log Levels

```typescript
// TRACE - Very detailed, method entry/exit
logger.trace('Service', 'Entering method: processData');

// DEBUG - Debugging information
logger.debug('Service', 'Processing item', { id: 123 });

// INFO - General informational messages
logger.info('Service', 'Operation completed successfully');

// WARN - Warning messages
logger.warn('Service', 'Deprecated API used');

// ERROR - Error messages
logger.error('Service', 'Operation failed', error);
```

### 2. Include Context

```typescript
// Good: Includes context
logger.info('AIService', 'API call completed', {
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  duration: 1234
});

// Not as useful: Lacks context
logger.info('AIService', 'API call completed');
```

### 3. Track Errors with Categories

```typescript
// Good: Uses proper category
errorTracker.trackError('git', 'Repository not found', error);
errorTracker.trackError('ai', 'API key invalid', error);
errorTracker.trackError('network', 'Connection timeout', error);

// Not as useful: Generic category
errorTracker.trackError('error', 'Something failed', error);
```

### 4. Time Long Operations

```typescript
// Good: Times operation
perfMonitor.startTimer('git_clone');
await gitService.clone(url);
perfMonitor.endTimer('git_clone', true);

// Can identify slow operations automatically
```

## Debug Mode in Development

### Enable During Development

Add to your shell profile:

```bash
# ~/.bashrc or ~/.zshrc
export LOG_LEVEL=debug
export DEBUG=gitgenius*
```

### Temporary Debug Mode

```bash
# One-time debug mode
LOG_LEVEL=debug gitgenius commit

# Or use CLI
gitgenius debug --enable
gitgenius commit
gitgenius debug --disable
```

## Production Monitoring

### Regular Health Checks

```bash
# Check for errors
gitgenius errors --stats

# Check performance
gitgenius debug --performance

# View recent activity
gitgenius logs --stats
```

### Export for Analysis

```bash
# Export logs for analysis
gitgenius logs --export "logs-$(date +%Y%m%d).json"

# Export errors for reporting
gitgenius errors --export "errors-$(date +%Y%m%d).json"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run with debug logging
  env:
    LOG_LEVEL: debug
  run: |
    gitgenius commit
    gitgenius logs --export ci-logs.json
    
- name: Upload logs
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: gitgenius-logs
    path: ci-logs.json
```

### Script Integration

```bash
#!/bin/bash
set -e

# Enable logging
export LOG_LEVEL=info

# Run commands
gitgenius commit || {
  echo "Commit failed, exporting logs..."
  gitgenius logs --export error-logs.json
  gitgenius errors --export error-report.json
  exit 1
}

# Check for errors
ERROR_COUNT=$(gitgenius errors --stats | grep "Total errors" | awk '{print $3}')
if [ "$ERROR_COUNT" -gt 0 ]; then
  echo "Warning: $ERROR_COUNT errors detected"
  gitgenius errors --list
fi
```

## Real-World Example

Here's a complete example showing logging in a real feature:

```typescript
// src/handlers/MyHandler.ts
import { logger } from '../utils/Logger.js';
import { errorTracker } from '../utils/ErrorTracker.js';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';

export class MyHandler {
  private perfMonitor = PerformanceMonitor.getInstance();

  async processRequest(data: any): Promise<void> {
    const operationId = `process_${Date.now()}`;
    logger.debug('MyHandler', 'Starting request processing', { operationId });
    
    this.perfMonitor.startTimer('request_processing');
    
    try {
      // Validate input
      logger.trace('MyHandler', 'Validating input');
      this.validateInput(data);
      
      // Process
      logger.info('MyHandler', 'Processing data', { 
        items: data.length,
        operationId 
      });
      
      const result = await this.processData(data);
      
      // Complete
      this.perfMonitor.endTimer('request_processing', true);
      logger.info('MyHandler', 'Request processed successfully', {
        operationId,
        resultCount: result.length
      });
      
    } catch (error) {
      // Log and track error
      logger.error('MyHandler', 'Request processing failed', error, {
        operationId
      });
      
      errorTracker.trackError('processing', 'Request failed', error, {
        operationId,
        dataSize: data?.length
      });
      
      this.perfMonitor.endTimer('request_processing', false);
      throw error;
    }
  }
  
  private validateInput(data: any): void {
    if (!data || data.length === 0) {
      const error = new Error('Invalid input: data is empty');
      logger.warn('MyHandler', 'Validation failed', { 
        reason: 'empty data' 
      });
      throw error;
    }
  }
  
  private async processData(data: any[]): Promise<any[]> {
    logger.debug('MyHandler', `Processing ${data.length} items`);
    // Implementation...
    return [];
  }
}
```

Usage:

```bash
# Run with debug mode
$ LOG_LEVEL=debug gitgenius my-command

# Check results
$ gitgenius logs --lines 50
$ gitgenius errors --stats
$ gitgenius debug --performance
```

## Conclusion

The logging infrastructure is deeply integrated into GitGenius and provides:

1. **Automatic logging** of all operations
2. **Error tracking** without manual intervention
3. **Performance monitoring** of all timed operations
4. **Easy debugging** with comprehensive logs
5. **Production monitoring** with statistics and exports

Follow the patterns shown here when adding new features to maintain consistency and maximize the value of the logging infrastructure.
