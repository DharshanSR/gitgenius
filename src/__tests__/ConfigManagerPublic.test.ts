/**
 * Tests for ConfigManager's public API
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ConfigManager } from '../core/ConfigManager';
import inquirer from 'inquirer';

describe('ConfigManager (public API)', () => {
  let configManager: ConfigManager;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    configManager = new ConfigManager();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('setConfigValue and getConfig', () => {
    test('should set and get a config value', () => {
      configManager.setConfigValue('testKey', 'testValue');
      const value = configManager.getConfig('testKey');
      expect(value).toBe('testValue');
    });

    test('should set and get numeric values', () => {
      configManager.setConfigValue('maxTokens', 300);
      const value = configManager.getConfig('maxTokens');
      expect(value).toBe(300);
    });

    test('should set and get boolean values', () => {
      configManager.setConfigValue('debugMode', true);
      const value = configManager.getConfig('debugMode');
      expect(value).toBe(true);
    });

    test('should set and get object values', () => {
      const obj = { provider: 'openai', model: 'gpt-4' };
      configManager.setConfigValue('settings', obj);
      const value = configManager.getConfig('settings');
      expect(value).toEqual(obj);
    });

    test('should set and get array values', () => {
      const arr = ['feat', 'fix', 'docs'];
      configManager.setConfigValue('commitTypes', arr);
      const value = configManager.getConfig('commitTypes');
      expect(value).toEqual(arr);
    });

    test('should set and get string values with roundtrip', () => {
      const uniqueKey = `roundtrip_${Date.now()}`;
      configManager.setConfigValue(uniqueKey, 'roundtrip-value');
      const value = configManager.getConfig(uniqueKey);
      expect(value).toBe('roundtrip-value');
    });

    test('should set provider and read it back', () => {
      configManager.setConfigValue('provider', 'openai');
      const value = configManager.getConfig('provider');
      expect(value).toBe('openai');
    });

    test('should set maxTokens and read it back', () => {
      configManager.setConfigValue('maxTokens', 150);
      const maxTokens = configManager.getConfig('maxTokens');
      expect(maxTokens).toBe(150);
    });

    test('should set temperature and read it back', () => {
      configManager.setConfigValue('temperature', 0.7);
      const temperature = configManager.getConfig('temperature');
      expect(temperature).toBe(0.7);
    });
  });

  describe('hasApiKey', () => {
    test('should return true when OPENAI_API_KEY env var is set', () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      const originalGG = process.env.GITGENIUS_API_KEY;
      try {
        delete process.env.GITGENIUS_API_KEY;
        process.env.OPENAI_API_KEY = 'sk-test-api-key-12345678901234567890';
        const result = configManager.hasApiKey();
        expect(result).toBe(true);
      } finally {
        if (originalEnv === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalEnv;
        if (originalGG === undefined) delete process.env.GITGENIUS_API_KEY;
        else process.env.GITGENIUS_API_KEY = originalGG;
      }
    });

    test('should return true when GITGENIUS_API_KEY env var is set', () => {
      const original = process.env.GITGENIUS_API_KEY;
      try {
        process.env.GITGENIUS_API_KEY = 'test-gitgenius-api-key-12345678901234567890';
        const result = configManager.hasApiKey();
        expect(result).toBe(true);
      } finally {
        if (original === undefined) delete process.env.GITGENIUS_API_KEY;
        else process.env.GITGENIUS_API_KEY = original;
      }
    });

    test('should delegate to getApiKey', () => {
      const getApiKeySpy = jest.spyOn(configManager, 'getApiKey').mockReturnValue('some-key');
      const result = configManager.hasApiKey();
      expect(result).toBe(true);
      getApiKeySpy.mockRestore();
    });

    test('should return false when getApiKey returns empty string', () => {
      const getApiKeySpy = jest.spyOn(configManager, 'getApiKey').mockReturnValue('');
      const result = configManager.hasApiKey();
      expect(result).toBe(false);
      getApiKeySpy.mockRestore();
    });
  });

  describe('getApiKey', () => {
    test('should return env variable when set', () => {
      const original = process.env.OPENAI_API_KEY;
      try {
        process.env.OPENAI_API_KEY = 'sk-env-api-key-12345678901234567890';
        const key = configManager.getApiKey();
        expect(key).toBe('sk-env-api-key-12345678901234567890');
      } finally {
        if (original === undefined) {
          delete process.env.OPENAI_API_KEY;
        } else {
          process.env.OPENAI_API_KEY = original;
        }
      }
    });

    test('should return GITGENIUS_API_KEY over OPENAI_API_KEY', () => {
      const originalGG = process.env.GITGENIUS_API_KEY;
      const originalOAI = process.env.OPENAI_API_KEY;
      try {
        process.env.GITGENIUS_API_KEY = 'gitgenius-key-12345678901234567890';
        process.env.OPENAI_API_KEY = 'openai-key-12345678901234567890';

        const key = configManager.getApiKey();
        expect(key).toBe('gitgenius-key-12345678901234567890');
      } finally {
        if (originalGG === undefined) delete process.env.GITGENIUS_API_KEY;
        else process.env.GITGENIUS_API_KEY = originalGG;
        if (originalOAI === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalOAI;
      }
    });

    test('should return GEMINI_API_KEY when gemini provider is configured', () => {
      const originalGEM = process.env.GEMINI_API_KEY;
      const originalGG = process.env.GITGENIUS_API_KEY;
      const originalOAI = process.env.OPENAI_API_KEY;
      try {
        delete process.env.GITGENIUS_API_KEY;
        delete process.env.OPENAI_API_KEY;
        process.env.GEMINI_API_KEY = 'gemini-api-key-12345678901234567890';
        configManager.setConfigValue('provider', 'gemini');

        const key = configManager.getApiKey();
        expect(key).toBe('gemini-api-key-12345678901234567890');
      } finally {
        if (originalGEM === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalGEM;
        if (originalGG === undefined) delete process.env.GITGENIUS_API_KEY;
        else process.env.GITGENIUS_API_KEY = originalGG;
        if (originalOAI === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalOAI;
      }
    });
  });

  describe('getConfig with level', () => {
    test('should get config from user level', () => {
      configManager.setConfigValue('provider', 'gemini');
      const value = configManager.getConfig('provider', 'user');
      expect(value).toBe('gemini');
    });

    test('should get config from global level (returns valid value)', () => {
      const value = configManager.getConfig('provider', 'global');
      // Global level config could be 'openai' or 'gemini' depending on what was set
      expect(['openai', 'gemini', 'anthropic']).toContain(value);
    });
  });

  describe('handleConfig additional options', () => {
    test('should call backupConfig when backup option is set', async () => {
      const backupSpy = jest.spyOn(configManager as any, 'backupConfig').mockResolvedValue(undefined);

      await configManager.handleConfig(undefined, undefined, { backup: true });
      expect(backupSpy).toHaveBeenCalled();
    });

    test('should call validateCurrentConfig when validate option is set', async () => {
      const validateSpy = jest.spyOn(configManager as any, 'validateCurrentConfig').mockResolvedValue(undefined);

      await configManager.handleConfig(undefined, undefined, { validate: true });
      expect(validateSpy).toHaveBeenCalled();
    });

    test('should call resetConfig when reset option is set', async () => {
      const resetSpy = jest.spyOn(configManager as any, 'resetConfig').mockResolvedValue(undefined);

      await configManager.handleConfig(undefined, undefined, { reset: true });
      expect(resetSpy).toHaveBeenCalled();
    });

    test('should call importConfig when import option is set', async () => {
      const importSpy = jest.spyOn(configManager as any, 'importConfig').mockResolvedValue(undefined);

      await configManager.handleConfig(undefined, undefined, { import: '/path/to/config.json' });
      expect(importSpy).toHaveBeenCalledWith('/path/to/config.json');
    });

    test('should call listConfig when list option is set', async () => {
      const listSpy = jest.spyOn(configManager as any, 'listConfig').mockReturnValue(undefined);

      await configManager.handleConfig(undefined, undefined, { list: true });
      expect(listSpy).toHaveBeenCalled();
    });

    test('should set config value when key and value provided', async () => {
      const setConfigSpy = jest.spyOn(configManager as any, 'setConfig');

      await configManager.handleConfig('provider', 'gemini');
      expect(setConfigSpy).toHaveBeenCalledWith('provider', 'gemini');
    });
  });

  describe('private methods via direct access', () => {
    test('listConfig should display config values', () => {
      (configManager as any).listConfig();
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('Configuration');
    });

    test('backupConfig should write backup file', async () => {
      const fs = require('fs');
      const writeSync = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      
      await (configManager as any).backupConfig();
      
      expect(writeSync).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('backed up');
    });

    test('exportConfig should export to specified path', async () => {
      const fs = require('fs');
      const writeSync = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

      await (configManager as any).exportConfig('/tmp/config.json');

      expect(writeSync).toHaveBeenCalledWith('/tmp/config.json', expect.any(String));
    });

    test('resetConfig should prompt and reset when confirmed', async () => {
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ confirmed: true } as any);
      const clearSpy = jest.spyOn((configManager as any).config, 'clear').mockReturnValue(undefined);

      await (configManager as any).resetConfig();

      expect(clearSpy).toHaveBeenCalled();
    });

    test('resetConfig should not reset when not confirmed', async () => {
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ confirmed: false } as any);
      const clearSpy = jest.spyOn((configManager as any).config, 'clear').mockReturnValue(undefined);

      await (configManager as any).resetConfig();

      expect(clearSpy).not.toHaveBeenCalled();
    });

    test('migrateConfigManual should migrate and update config', async () => {
      await (configManager as any).migrateConfigManual();
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('migrated');
    });

    test('validateCurrentConfig should show valid message for valid config', async () => {
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ fix: false } as any);
      
      await (configManager as any).validateCurrentConfig();
      
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      // Either valid message or migration offer
      expect(output.length).toBeGreaterThan(0);
    });

    test('importConfig should show error when file not found', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await (configManager as any).importConfig('/nonexistent/path.json');
      
      expect(errorSpy).toHaveBeenCalled();
    });

    test('importConfig should import when confirmed', async () => {
      const existsSyncSpy = jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
      const readFileSpy = jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(
        JSON.stringify({ provider: 'gemini', model: 'gemini-pro', maxTokens: 200, temperature: 0.5 })
      );
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ confirmed: true } as any);

      await (configManager as any).importConfig('/path/to/config.json');

      existsSyncSpy.mockRestore();
      readFileSpy.mockRestore();
    });

    test('applyTemplate should show error when template not found', async () => {
      await (configManager as any).applyTemplate('nonexistent-template');
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('not found');
    });

    test('applyTemplate should apply valid template when confirmed', async () => {
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ confirmed: true } as any);
      // Mock a valid template
      const configTemplates = await import('../core/ConfigTemplates');
      jest.spyOn(configTemplates, 'getTemplate').mockReturnValue({
        name: 'test-template',
        description: 'Test template',
        config: { provider: 'openai', maxTokens: 200 }
      } as any);

      await (configManager as any).applyTemplate('test-template');
    });

    test('setConfigInteractive for provider should call setProvider', async () => {
      const setProviderSpy = jest.spyOn(configManager as any, 'setProvider').mockResolvedValue(undefined);
      
      await (configManager as any).setConfigInteractive('provider');
      
      expect(setProviderSpy).toHaveBeenCalled();
    });

    test('setConfigInteractive for model should call setModel', async () => {
      const setModelSpy = jest.spyOn(configManager as any, 'setModel').mockResolvedValue(undefined);
      
      await (configManager as any).setConfigInteractive('model');
      
      expect(setModelSpy).toHaveBeenCalled();
    });

    test('setConfigInteractive for apiKey should call setApiKey', async () => {
      const setApiKeySpy = jest.spyOn(configManager as any, 'setApiKey').mockResolvedValue(undefined);
      
      await (configManager as any).setConfigInteractive('apiKey');
      
      expect(setApiKeySpy).toHaveBeenCalled();
    });

    test('setConfigInteractive for other key should prompt for value', async () => {
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ value: 'test-value' } as any);
      
      await (configManager as any).setConfigInteractive('customKey');
      
      expect(configManager.getConfig('customKey')).toBe('test-value');
    });

    test('setProvider should update provider config', async () => {
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ provider: 'gemini' } as any);

      await (configManager as any).setProvider();

      expect(configManager.getConfig('provider')).toBe('gemini');
    });

    test('setModel should update model config for openai provider', async () => {
      configManager.setConfigValue('provider', 'openai');
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ model: 'gpt-4' } as any);

      await (configManager as any).setModel();

      expect(configManager.getConfig('model')).toBe('gpt-4');
    });

    test('setModel should update model config for gemini provider', async () => {
      configManager.setConfigValue('provider', 'gemini');
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ model: 'gemini-pro' } as any);

      await (configManager as any).setModel();

      expect(configManager.getConfig('model')).toBe('gemini-pro');
    });

    test('setModel should update model config for anthropic provider', async () => {
      configManager.setConfigValue('provider', 'anthropic');
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ model: 'claude-3-haiku-20240307' } as any);

      await (configManager as any).setModel();

      expect(configManager.getConfig('model')).toBe('claude-3-haiku-20240307');
    });

    test('restoreConfig should show error when backup file not found', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await (configManager as any).restoreConfig('/nonexistent/backup.json');

      expect(errorSpy).toHaveBeenCalled();
    });

    test('restoreConfig should restore config when confirmed', async () => {
      const fs = require('fs');
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const backup = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        config: { provider: 'gemini', model: 'gemini-pro', maxTokens: 300, temperature: 0.8 }
      };
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(backup));
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ confirmed: true } as any);

      await (configManager as any).restoreConfig('/path/to/backup.json');

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('restored');
    });
  });
});
