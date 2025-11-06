import { z } from 'zod';

// Zod schema for configuration validation
export const configSchema = z.object({
  provider: z.enum(['openai', 'gemini', 'anthropic']).default('openai'),
  model: z.string().min(1),
  apiKey: z.string().nullable().optional(),
  maxTokens: z.number().min(1).max(4096).default(150),
  temperature: z.number().min(0).max(2).default(0.7),
  commitTypes: z.array(z.string()).min(1).default([
    'feat', 'fix', 'docs', 'style', 'refactor', 
    'test', 'chore', 'perf', 'ci', 'build'
  ]),
  // Allow additional properties for extensibility
  aliases: z.record(z.string(), z.string()).optional(),
  templates: z.array(z.any()).optional(),
  feedback: z.array(z.any()).optional()
}).passthrough(); // Allow additional unknown keys

// Configuration backup schema
export const configBackupSchema = z.object({
  version: z.string(),
  timestamp: z.string(),
  config: configSchema
});

// Validation helper function
export function validateConfig(config: any): { valid: boolean; errors?: string[] } {
  const result = configSchema.safeParse(config);
  
  if (result.success) {
    return { valid: true };
  }
  
  return {
    valid: false,
    errors: result.error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
  };
}

// Migration helpers
export const CONFIG_VERSION = '1.2.0';

export function needsMigration(configVersion: string | undefined): boolean {
  if (!configVersion) return true;
  
  const [major, minor] = configVersion.split('.').map(Number);
  const [currentMajor, currentMinor] = CONFIG_VERSION.split('.').map(Number);
  
  return major < currentMajor || (major === currentMajor && minor < currentMinor);
}

export function migrateConfig(config: any, fromVersion?: string): any {
  const migratedConfig = { ...config };
  
  // Migration from versions before 1.1.0
  if (!fromVersion || fromVersion < '1.1.0') {
    // Ensure commitTypes array exists
    if (!migratedConfig.commitTypes) {
      migratedConfig.commitTypes = [
        'feat', 'fix', 'docs', 'style', 'refactor', 
        'test', 'chore', 'perf', 'ci', 'build'
      ];
    }
  }
  
  // Migration from versions before 1.2.0
  if (!fromVersion || fromVersion < '1.2.0') {
    // Add default maxTokens if missing
    if (!migratedConfig.maxTokens) {
      migratedConfig.maxTokens = 150;
    }
    
    // Add default temperature if missing
    if (!migratedConfig.temperature) {
      migratedConfig.temperature = 0.7;
    }
    
    // Ensure provider is valid
    if (!['openai', 'gemini', 'anthropic'].includes(migratedConfig.provider)) {
      migratedConfig.provider = 'openai';
    }
  }
  
  // Set the version
  migratedConfig.configVersion = CONFIG_VERSION;
  
  return migratedConfig;
}
