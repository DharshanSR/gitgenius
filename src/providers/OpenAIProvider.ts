import axios from 'axios';
import { AIProvider } from '../types.js';
import { SecurityUtils } from '../utils/SecurityUtils';
import { SecurityManager } from '../core/SecurityConfig';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;
  private securityManager: SecurityManager;

  constructor(apiKey: string) {
    // Validate API key
    if (!SecurityUtils.validateApiKey(apiKey)) {
      throw new Error('Invalid API key format');
    }
    this.apiKey = apiKey;
    this.securityManager = new SecurityManager();
  }

  async generateCommitMessage(diff: string, type?: string, detailed?: boolean): Promise<string> {
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    
    // Enforce HTTPS
    this.securityManager.validateUrl(apiUrl);
    
    // Check rate limiting
    if (!this.securityManager.checkRateLimit('openai')) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Sanitize input
    const sanitizedDiff = this.securityManager.sanitizeInput(diff);
    const prompt = this.buildPrompt(sanitizedDiff, type, detailed);
    
    // Check API key rotation
    const rotationReminder = this.securityManager.checkApiKeyRotation('openai');
    if (rotationReminder) {
      console.warn(rotationReminder);
    }
    
    // Audit log
    this.securityManager.auditLog('ai_request', {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      type: type || 'default',
      detailed: detailed || false
    });
    
    try {
      const secureConfig = this.securityManager.getSecureRequestConfig(this.apiKey);
      
      const response = await axios.post(
        apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: detailed 
                ? 'You are a helpful assistant that generates detailed and meaningful git commit messages with explanatory body text based on code diffs.'
                : 'You are a helpful assistant that generates concise and meaningful git commit messages based on code diffs.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: detailed ? 300 : 150,
          temperature: 0.7
        },
        secureConfig
      );

      const message = response.data.choices[0].message.content.trim();
      
      // Validate the generated commit message
      if (!SecurityUtils.validateCommitMessage(message)) {
        throw new Error('Generated commit message failed security validation');
      }
      
      return message;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid OpenAI API key');
        }
        if (error.response?.status === 429) {
          throw new Error('OpenAI API rate limit exceeded. Please try again later.');
        }
        throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  private buildPrompt(diff: string, type?: string, detailed?: boolean): string {
    const typePrefix = type ? `[${type.toUpperCase()}] ` : '';
    
    if (detailed) {
      return `${typePrefix}Generate a detailed git commit message for the following changes. 
Follow conventional commits format with detailed body.

Format:
<type>(<scope>): <subject>

<body explaining what and why changed>

Git diff:
${diff}

Commit message:`;
    }
    
    return `${typePrefix}Generate a concise git commit message for the following changes. 
Follow conventional commits format and keep it under 72 characters.

Git diff:
${diff}

Commit message:`;
  }
}
