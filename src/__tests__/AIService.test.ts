import { AIService } from '../services/AIService';
import { OpenAIProvider } from '../providers/OpenAIProvider';
import { GeminiProvider } from '../providers/GeminiProvider';
import { jest } from '@jest/globals';

describe('AIService', () => {
  let aiService: AIService;
  const mockOpenAI = new OpenAIProvider();
  const mockGemini = new GeminiProvider();

  beforeEach(() => {
    aiService = new AIService();
    jest.spyOn(mockOpenAI, 'generateCommitMessage').mockResolvedValue('feat: test commit');
    jest.spyOn(mockGemini, 'generateCommitMessage').mockResolvedValue('fix: test fix');
  });

  describe('Provider Management', () => {
    test('should set provider correctly', () => {
      aiService.setProvider('openai');
      expect(aiService.getCurrentProvider()).toBe('openai');
    });

    test('should switch providers', () => {
      aiService.setProvider('gemini');
      expect(aiService.getCurrentProvider()).toBe('gemini');
    });
  });

  describe('Message Generation', () => {
    test('should generate commit message with OpenAI', async () => {
      aiService.setProvider('openai');
      const message = await aiService.generateCommitMessage(['test.ts'], 'test commit');
      expect(message).toBeDefined();
    });

    test('should generate commit message with Gemini', async () => {
      aiService.setProvider('gemini');
      const message = await aiService.generateCommitMessage(['test.ts'], 'test fix');
      expect(message).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle provider errors', async () => {
      jest.spyOn(mockOpenAI, 'generateCommitMessage').mockRejectedValue(new Error('API Error'));
      
      await expect(aiService.generateCommitMessage(['test.ts'], 'failed commit'))
        .rejects.toThrow('API Error');
    });
  });
});