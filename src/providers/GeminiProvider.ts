import axios from 'axios';
import { AIProvider } from '../types.js';
import { SecurityUtils } from '../utils/SecurityUtils.js';
import { SecurityManager } from '../core/SecurityConfig.js';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
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
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`;
    
    // Enforce HTTPS
    this.securityManager.validateUrl(apiUrl);
    
    // Check rate limiting
    if (!this.securityManager.checkRateLimit('gemini')) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Sanitize input
    const sanitizedDiff = this.securityManager.sanitizeInput(diff);
    const prompt = this.buildPrompt(sanitizedDiff, type, detailed);
    
    // Check API key rotation
    const rotationReminder = this.securityManager.checkApiKeyRotation('gemini');
    if (rotationReminder) {
      console.warn(rotationReminder);
    }
    
    // Audit log
    this.securityManager.auditLog('ai_request', {
      provider: 'gemini',
      model: 'gemini-1.5-flash-latest',
      type: type || 'default',
      detailed: detailed || false
    });
    
    try {
      const secureConfig = this.securityManager.getSecureRequestConfig();
      
      const response = await axios.post(
        apiUrl,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: detailed ? 300 : 150
          }
        },
        secureConfig
      );

      const message = response.data.candidates[0].content.parts[0].text.trim();
      
      // Validate the generated commit message
      if (!SecurityUtils.validateCommitMessage(message)) {
        throw new Error('Generated commit message failed security validation');
      }
      
      return message;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error('Invalid Gemini API key');
        }
        if (error.response?.status === 429) {
          throw new Error('Gemini API rate limit exceeded. Please try again later.');
        }
        throw new Error(`Gemini API error: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  private buildPrompt(diff: string, type?: string, detailed?: boolean): string {
    const typePrefix = type ? `[${type.toUpperCase()}] ` : '';
    
    if (detailed) {
      return `${typePrefix}Generate a detailed git commit message for the following changes. 
Follow conventional commits format with detailed description.

Format:
<type>(<scope>): <subject>

<body>

- <subject>: Brief summary (under 72 characters)
- <body>: Detailed explanation of what changed, why it was changed, and any important notes

Git diff:
${diff}

Return the commit message only, no additional text.`;
    }
    
    return `${typePrefix}Generate a concise git commit message for the following changes. 
Follow conventional commits format and keep it under 72 characters.
Only return the commit message, nothing else.

Git diff:
${diff}`;
  }
}
