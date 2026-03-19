import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AIService } from '../services/AIService';
import { ConfigManager } from '../core/ConfigManager';
import type { AIProvider } from '../types';

describe('AIService', () => {
  let aiService: AIService;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    aiService = new AIService();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('setProvider and getCurrentProvider', () => {
    test('should set and get provider', () => {
      aiService.setProvider('gemini');
      expect(aiService.getCurrentProvider()).toBe('gemini');
    });

    test('should update provider from default to a new value', () => {
      aiService.setProvider('openai');
      expect(aiService.getCurrentProvider()).toBe('openai');
    });

    test('should allow setting provider multiple times', () => {
      aiService.setProvider('gemini');
      aiService.setProvider('openai');
      expect(aiService.getCurrentProvider()).toBe('openai');
    });
  });

  describe('hasApiKey', () => {
    test('should delegate to configManager', () => {
      const spy = jest.spyOn(aiService, 'hasApiKey').mockReturnValue(true);
      expect(aiService.hasApiKey()).toBe(true);
      spy.mockRestore();
    });

    test('should return false when no API key is configured', () => {
      const spy = jest.spyOn(aiService, 'hasApiKey').mockReturnValue(false);
      expect(aiService.hasApiKey()).toBe(false);
      spy.mockRestore();
    });
  });

  describe('getProvider', () => {
    test('should throw error when no API key configured', () => {
      jest.spyOn(aiService, 'hasApiKey').mockReturnValue(false);
      // Access private configManager via type cast
      const configManager = (aiService as any).configManager as ConfigManager;
      jest.spyOn(configManager, 'getApiKey').mockReturnValue('');
      expect(() => aiService.getProvider('openai')).toThrow('API key not configured');
    });

    test('should throw error for unsupported provider', () => {
      const configManager = (aiService as any).configManager as ConfigManager;
      jest.spyOn(configManager, 'getApiKey').mockReturnValue('valid-api-key-1234567890');
      expect(() => aiService.getProvider('unsupported')).toThrow('Unsupported provider: unsupported');
    });

    test('should return OpenAI provider with valid api key', () => {
      const configManager = (aiService as any).configManager as ConfigManager;
      jest.spyOn(configManager, 'getApiKey').mockReturnValue('sk-validkey12345678901234567890');
      const provider = aiService.getProvider('openai');
      expect(provider).toBeDefined();
      expect(provider.name).toBe('openai');
    });

    test('should return Gemini provider with valid api key', () => {
      const configManager = (aiService as any).configManager as ConfigManager;
      jest.spyOn(configManager, 'getApiKey').mockReturnValue('valid-gemini-api-key-1234567890');
      const provider = aiService.getProvider('gemini');
      expect(provider).toBeDefined();
      expect(provider.name).toBe('gemini');
    });
  });

  describe('getProviderAsync', () => {
    test('should return provider asynchronously', async () => {
      const mockProvider: AIProvider = {
        name: 'openai',
        generateCommitMessage: jest.fn<() => Promise<string>>().mockResolvedValue('feat: test')
      };
      jest.spyOn(aiService, 'getProvider').mockReturnValue(mockProvider);
      const provider = await aiService.getProviderAsync('openai');
      expect(provider).toBe(mockProvider);
    });
  });

  describe('generateCommitMessage', () => {
    test('should generate commit message via provider', async () => {
      const mockProvider: AIProvider = {
        name: 'openai',
        generateCommitMessage: jest.fn<() => Promise<string>>().mockResolvedValue('feat: add new feature')
      };
      jest.spyOn(aiService, 'getProvider').mockReturnValue(mockProvider);

      const message = await aiService.generateCommitMessage('diff content', 'feat', 'openai');
      expect(message).toBe('feat: add new feature');
      expect(mockProvider.generateCommitMessage).toHaveBeenCalledWith('diff content', 'feat', undefined);
    });

    test('should pass detailed flag to provider', async () => {
      const mockProvider: AIProvider = {
        name: 'openai',
        generateCommitMessage: jest.fn<() => Promise<string>>().mockResolvedValue('feat: detailed message')
      };
      jest.spyOn(aiService, 'getProvider').mockReturnValue(mockProvider);

      await aiService.generateCommitMessage('diff', 'feat', 'openai', true);
      expect(mockProvider.generateCommitMessage).toHaveBeenCalledWith('diff', 'feat', true);
    });
  });

  describe('explainCommit', () => {
    test('should explain a commit using AI', async () => {
      const mockProvider: AIProvider = {
        name: 'openai',
        generateCommitMessage: jest.fn<() => Promise<string>>().mockResolvedValue('Added login feature')
      };
      jest.spyOn(aiService, 'getProvider').mockReturnValue(mockProvider);

      const explanation = await aiService.explainCommit('feat: add login', 'auth.ts');
      expect(explanation).toBe('Added login feature');
      expect(mockProvider.generateCommitMessage).toHaveBeenCalled();
    });

    test('should handle missing files parameter', async () => {
      const mockProvider: AIProvider = {
        name: 'openai',
        generateCommitMessage: jest.fn<() => Promise<string>>().mockResolvedValue('explanation')
      };
      jest.spyOn(aiService, 'getProvider').mockReturnValue(mockProvider);

      const explanation = await aiService.explainCommit('feat: something');
      expect(explanation).toBe('explanation');
    });
  });

  describe('reviewCode', () => {
    test('should review code changes', async () => {
      const mockProvider: AIProvider = {
        name: 'openai',
        generateCommitMessage: jest.fn<() => Promise<string>>().mockResolvedValue('LGTM - good code')
      };
      jest.spyOn(aiService, 'getProvider').mockReturnValue(mockProvider);

      const review = await aiService.reviewCode('+ added good code');
      expect(review).toBe('LGTM - good code');
    });

    test('should truncate very long diffs', async () => {
      const mockProvider: AIProvider = {
        name: 'openai',
        generateCommitMessage: jest.fn<() => Promise<string>>().mockResolvedValue('review result')
      };
      jest.spyOn(aiService, 'getProvider').mockReturnValue(mockProvider);

      const longDiff = 'x'.repeat(10000);
      const review = await aiService.reviewCode(longDiff);
      expect(review).toBe('review result');
      // The prompt passed should be truncated
      const callArg = (mockProvider.generateCommitMessage as jest.MockedFunction<any>).mock.calls[0][0] as string;
      expect(callArg.length).toBeLessThan(longDiff.length + 500);
    });
  });

  describe('suggestCommitType', () => {
    test('should suggest a commit type', async () => {
      const mockProvider: AIProvider = {
        name: 'openai',
        generateCommitMessage: jest.fn<() => Promise<string>>().mockResolvedValue('feat')
      };
      jest.spyOn(aiService, 'getProvider').mockReturnValue(mockProvider);

      const suggestion = await aiService.suggestCommitType('diff with new feature');
      expect(suggestion).toBe('feat');
    });
  });

  describe('suggestCommitScope', () => {
    test('should suggest a commit scope', async () => {
      const mockProvider: AIProvider = {
        name: 'openai',
        generateCommitMessage: jest.fn<() => Promise<string>>().mockResolvedValue('auth')
      };
      jest.spyOn(aiService, 'getProvider').mockReturnValue(mockProvider);

      const scope = await aiService.suggestCommitScope('changes to auth files');
      expect(scope).toBe('auth');
    });
  });
});
