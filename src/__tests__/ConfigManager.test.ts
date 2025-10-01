import { describe, test, expect } from '@jest/globals';
import { validateConfig, migrateConfig, needsMigration, CONFIG_VERSION } from '../core/ConfigSchema';
import { getTemplate, listTemplates } from '../core/ConfigTemplates';

describe('ConfigSchema', () => {
  describe('validateConfig', () => {
    test('should validate valid configuration', () => {
      const config = {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: null,
        maxTokens: 150,
        temperature: 0.7,
        commitTypes: ['feat', 'fix', 'docs']
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('should reject invalid provider', () => {
      const config = {
        provider: 'invalid-provider',
        model: 'gpt-3.5-turbo',
        maxTokens: 150,
        temperature: 0.7,
        commitTypes: ['feat', 'fix']
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    test('should reject invalid maxTokens', () => {
      const config = {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        maxTokens: 5000, // Too high
        temperature: 0.7,
        commitTypes: ['feat']
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject invalid temperature', () => {
      const config = {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        maxTokens: 150,
        temperature: 3.0, // Too high
        commitTypes: ['feat']
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should allow additional properties', () => {
      const config = {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        maxTokens: 150,
        temperature: 0.7,
        commitTypes: ['feat'],
        customProperty: 'custom-value',
        aliases: { 'gg': 'gitgenius' }
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('needsMigration', () => {
    test('should return true for undefined version', () => {
      expect(needsMigration(undefined)).toBe(true);
    });

    test('should return true for older version', () => {
      expect(needsMigration('1.0.0')).toBe(true);
    });

    test('should return false for current version', () => {
      expect(needsMigration(CONFIG_VERSION)).toBe(false);
    });

    test('should return false for newer version', () => {
      expect(needsMigration('2.0.0')).toBe(false);
    });
  });

  describe('migrateConfig', () => {
    test('should add configVersion to migrated config', () => {
      const config = {
        provider: 'openai',
        model: 'gpt-3.5-turbo'
      };

      const migrated = migrateConfig(config);
      expect(migrated.configVersion).toBe(CONFIG_VERSION);
    });

    test('should add default commitTypes if missing', () => {
      const config = {
        provider: 'openai',
        model: 'gpt-3.5-turbo'
      };

      const migrated = migrateConfig(config, '1.0.0');
      expect(migrated.commitTypes).toBeDefined();
      expect(Array.isArray(migrated.commitTypes)).toBe(true);
      expect(migrated.commitTypes.length).toBeGreaterThan(0);
    });

    test('should add default maxTokens if missing', () => {
      const config = {
        provider: 'openai',
        model: 'gpt-3.5-turbo'
      };

      const migrated = migrateConfig(config, '1.1.0');
      expect(migrated.maxTokens).toBe(150);
    });

    test('should add default temperature if missing', () => {
      const config = {
        provider: 'openai',
        model: 'gpt-3.5-turbo'
      };

      const migrated = migrateConfig(config, '1.1.0');
      expect(migrated.temperature).toBe(0.7);
    });

    test('should normalize invalid provider', () => {
      const config = {
        provider: 'invalid',
        model: 'gpt-3.5-turbo'
      };

      const migrated = migrateConfig(config, '1.1.0');
      expect(migrated.provider).toBe('openai');
    });

    test('should preserve existing valid values', () => {
      const config = {
        provider: 'gemini',
        model: 'gemini-pro',
        maxTokens: 200,
        temperature: 0.5,
        commitTypes: ['feat', 'fix']
      };

      const migrated = migrateConfig(config);
      expect(migrated.provider).toBe('gemini');
      expect(migrated.model).toBe('gemini-pro');
      expect(migrated.maxTokens).toBe(200);
      expect(migrated.temperature).toBe(0.5);
      expect(migrated.commitTypes).toEqual(['feat', 'fix']);
    });
  });
});

describe('ConfigTemplates', () => {
  describe('listTemplates', () => {
    test('should return array of templates', () => {
      const templates = listTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    test('should have required template properties', () => {
      const templates = listTemplates();
      templates.forEach(template => {
        expect(template.name).toBeDefined();
        expect(typeof template.name).toBe('string');
        expect(template.description).toBeDefined();
        expect(typeof template.description).toBe('string');
        expect(template.config).toBeDefined();
        expect(typeof template.config).toBe('object');
      });
    });
  });

  describe('getTemplate', () => {
    test('should return template by name', () => {
      const template = getTemplate('default');
      expect(template).toBeDefined();
      expect(template?.name).toBe('default');
    });

    test('should return undefined for non-existent template', () => {
      const template = getTemplate('non-existent-template');
      expect(template).toBeUndefined();
    });

    test('should return openai-gpt4 template', () => {
      const template = getTemplate('openai-gpt4');
      expect(template).toBeDefined();
      expect(template?.config.provider).toBe('openai');
      expect(template?.config.model).toBe('gpt-4');
    });

    test('should return gemini template', () => {
      const template = getTemplate('gemini');
      expect(template).toBeDefined();
      expect(template?.config.provider).toBe('gemini');
      expect(template?.config.model).toBe('gemini-pro');
    });

    test('should return concise template with lower token limit', () => {
      const template = getTemplate('concise');
      expect(template).toBeDefined();
      expect(template?.config.maxTokens).toBeLessThan(100);
    });

    test('should return detailed template with higher token limit', () => {
      const template = getTemplate('detailed');
      expect(template).toBeDefined();
      expect(template?.config.maxTokens).toBeGreaterThan(200);
    });
  });

  describe('template validation', () => {
    test('all templates should have valid configurations', () => {
      const templates = listTemplates();
      
      templates.forEach(template => {
        // Check that config has expected properties
        const config = template.config;
        
        if (config.provider) {
          expect(['openai', 'gemini', 'anthropic']).toContain(config.provider);
        }
        
        if (config.maxTokens) {
          expect(config.maxTokens).toBeGreaterThan(0);
          expect(config.maxTokens).toBeLessThanOrEqual(4096);
        }
        
        if (config.temperature !== undefined) {
          expect(config.temperature).toBeGreaterThanOrEqual(0);
          expect(config.temperature).toBeLessThanOrEqual(2);
        }
      });
    });
  });
});
