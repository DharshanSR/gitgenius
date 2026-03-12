import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { OpenAIProvider } from '../providers/OpenAIProvider';
import { GeminiProvider } from '../providers/GeminiProvider';

// Mock axios
jest.mock('axios', () => ({
  default: {
    post: jest.fn(),
    isAxiosError: jest.fn().mockReturnValue(false)
  },
  isAxiosError: jest.fn().mockReturnValue(false),
  post: jest.fn()
}));

describe('OpenAIProvider', () => {
  const validApiKey = 'sk-test-valid-api-key-1234567890abc';
  let provider: OpenAIProvider;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    provider = new OpenAIProvider(validApiKey);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should create provider with valid API key', () => {
      expect(provider).toBeDefined();
      expect(provider.name).toBe('openai');
    });

    test('should throw error for invalid API key', () => {
      expect(() => new OpenAIProvider('short')).toThrow('Invalid API key format');
    });

    test('should throw error for empty API key', () => {
      expect(() => new OpenAIProvider('')).toThrow('Invalid API key format');
    });
  });

  describe('generateCommitMessage', () => {
    test('should generate commit message with openai response', async () => {
      const axios = await import('axios');
      (axios.default.post as jest.MockedFunction<any>).mockResolvedValue({
        data: {
          choices: [{ message: { content: 'feat: add new feature' } }]
        }
      });

      const message = await provider.generateCommitMessage('+ new feature code');
      expect(message).toBe('feat: add new feature');
    });

    test('should generate detailed commit message', async () => {
      const axios = await import('axios');
      (axios.default.post as jest.MockedFunction<any>).mockResolvedValue({
        data: {
          choices: [{ message: { content: 'feat(auth): add login\n\nAdded user authentication' } }]
        }
      });

      const message = await provider.generateCommitMessage('+ auth code', 'feat', true);
      expect(message).toContain('feat(auth)');
    });

    test('should pass commit type prefix to prompt', async () => {
      const axios = await import('axios');
      const postMock = (axios.default.post as jest.MockedFunction<any>).mockResolvedValue({
        data: {
          choices: [{ message: { content: 'fix: resolve bug' } }]
        }
      });

      await provider.generateCommitMessage('- buggy code\n+ fixed code', 'fix');
      
      const callBody = postMock.mock.calls[0][1] as any;
      const userPrompt = callBody.messages.find((m: any) => m.role === 'user')?.content;
      expect(userPrompt).toContain('[FIX]');
    });

    test('should throw on 401 unauthorized error', async () => {
      const axios = await import('axios');
      const axiosError = { isAxiosError: true, response: { status: 401 }, message: 'Unauthorized' };
      (axios.isAxiosError as jest.MockedFunction<any>).mockReturnValue(true);
      (axios.default.post as jest.MockedFunction<any>).mockRejectedValue(axiosError);

      await expect(provider.generateCommitMessage('diff')).rejects.toThrow('Invalid OpenAI API key');
    });

    test('should throw on 429 rate limit error', async () => {
      const axios = await import('axios');
      const axiosError = { isAxiosError: true, response: { status: 429 }, message: 'Rate limit' };
      (axios.isAxiosError as jest.MockedFunction<any>).mockReturnValue(true);
      (axios.default.post as jest.MockedFunction<any>).mockRejectedValue(axiosError);

      await expect(provider.generateCommitMessage('diff')).rejects.toThrow('rate limit exceeded');
    });

    test('should throw generic API error for other axios errors', async () => {
      const axios = await import('axios');
      const axiosError = { 
        isAxiosError: true, 
        response: { status: 500, data: { error: { message: 'Server error' } } },
        message: 'Server error' 
      };
      (axios.isAxiosError as jest.MockedFunction<any>).mockReturnValue(true);
      (axios.default.post as jest.MockedFunction<any>).mockRejectedValue(axiosError);

      await expect(provider.generateCommitMessage('diff')).rejects.toThrow('OpenAI API error');
    });

    test('should rethrow non-axios errors', async () => {
      const axios = await import('axios');
      (axios.isAxiosError as jest.MockedFunction<any>).mockReturnValue(false);
      (axios.default.post as jest.MockedFunction<any>).mockRejectedValue(new Error('Network error'));

      await expect(provider.generateCommitMessage('diff')).rejects.toThrow('Network error');
    });
  });
});

describe('GeminiProvider', () => {
  const validApiKey = 'test-valid-gemini-api-key-1234567890';
  let provider: GeminiProvider;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    provider = new GeminiProvider(validApiKey);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should create provider with valid API key', () => {
      expect(provider).toBeDefined();
      expect(provider.name).toBe('gemini');
    });

    test('should throw error for invalid API key', () => {
      expect(() => new GeminiProvider('short')).toThrow('Invalid API key format');
    });
  });

  describe('generateCommitMessage', () => {
    test('should generate commit message with gemini response', async () => {
      const axios = await import('axios');
      (axios.default.post as jest.MockedFunction<any>).mockResolvedValue({
        data: {
          candidates: [{ content: { parts: [{ text: 'feat: add new feature' }] } }]
        }
      });

      const message = await provider.generateCommitMessage('+ new feature code');
      expect(message).toBe('feat: add new feature');
    });

    test('should generate detailed commit message', async () => {
      const axios = await import('axios');
      (axios.default.post as jest.MockedFunction<any>).mockResolvedValue({
        data: {
          candidates: [{ content: { parts: [{ text: 'feat: detailed commit\n\nDescription here' }] } }]
        }
      });

      const message = await provider.generateCommitMessage('code', 'feat', true);
      expect(message).toContain('feat');
    });

    test('should throw on 403 forbidden error', async () => {
      const axios = await import('axios');
      const axiosError = { isAxiosError: true, response: { status: 403 }, message: 'Forbidden' };
      (axios.isAxiosError as jest.MockedFunction<any>).mockReturnValue(true);
      (axios.default.post as jest.MockedFunction<any>).mockRejectedValue(axiosError);

      await expect(provider.generateCommitMessage('diff')).rejects.toThrow('Invalid Gemini API key');
    });

    test('should throw on 429 rate limit error', async () => {
      const axios = await import('axios');
      const axiosError = { isAxiosError: true, response: { status: 429 }, message: 'Rate limit' };
      (axios.isAxiosError as jest.MockedFunction<any>).mockReturnValue(true);
      (axios.default.post as jest.MockedFunction<any>).mockRejectedValue(axiosError);

      await expect(provider.generateCommitMessage('diff')).rejects.toThrow('rate limit exceeded');
    });

    test('should throw generic API error for other status codes', async () => {
      const axios = await import('axios');
      const axiosError = { 
        isAxiosError: true, 
        response: { status: 500, data: { error: { message: 'Server error' } } },
        message: 'Server error'
      };
      (axios.isAxiosError as jest.MockedFunction<any>).mockReturnValue(true);
      (axios.default.post as jest.MockedFunction<any>).mockRejectedValue(axiosError);

      await expect(provider.generateCommitMessage('diff')).rejects.toThrow('Gemini API error');
    });

    test('should rethrow non-axios errors', async () => {
      const axios = await import('axios');
      (axios.isAxiosError as jest.MockedFunction<any>).mockReturnValue(false);
      (axios.default.post as jest.MockedFunction<any>).mockRejectedValue(new Error('Connection failed'));

      await expect(provider.generateCommitMessage('diff')).rejects.toThrow('Connection failed');
    });
  });
});
