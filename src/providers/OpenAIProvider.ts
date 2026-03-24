import axios from 'axios';
import { AIProvider } from '../types.js';
import { SecurityUtils } from '../utils/SecurityUtils.js';
import { SecurityManager } from '../core/SecurityConfig.js';
import { ConfigManager } from '../core/ConfigManager.js';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;
  private securityManager: SecurityManager;
  private configManager: ConfigManager;

  constructor(apiKey: string) {
    // Validate API key
    if (!SecurityUtils.validateApiKey(apiKey)) {
      throw new Error('Invalid API key format');
    }
    this.apiKey = apiKey;
    this.securityManager = new SecurityManager();
    this.configManager = new ConfigManager();
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
      // Apply user-configured timeout (falls back to security config default)
      const userTimeout = this.configManager.getConfig('timeout');
      if (userTimeout) {
        secureConfig.timeout = userTimeout;
      }
      
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
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          const timeoutMs = this.configManager.getConfig('timeout') ?? 30000;
          throw new Error(`OpenAI API request timed out after ${timeoutMs / 1000}s. Consider increasing the timeout with: gitgenius config timeout`);
        }
        throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Streaming variant: emits each token chunk via `onChunk` as the response
   * arrives, providing real-time feedback in the terminal.
   */
  async generateCommitMessageStream(
    diff: string,
    type?: string,
    detailed?: boolean,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    this.securityManager.validateUrl(apiUrl);

    if (!this.securityManager.checkRateLimit('openai')) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const sanitizedDiff = this.securityManager.sanitizeInput(diff);
    const prompt = this.buildPrompt(sanitizedDiff, type, detailed);

    const rotationReminder = this.securityManager.checkApiKeyRotation('openai');
    if (rotationReminder) {
      console.warn(rotationReminder);
    }

    this.securityManager.auditLog('ai_request_stream', {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      type: type || 'default',
      detailed: detailed || false
    });

    try {
      const secureConfig = this.securityManager.getSecureRequestConfig(this.apiKey);
      const userTimeout = this.configManager.getConfig('timeout');
      if (userTimeout) {
        secureConfig.timeout = userTimeout;
      }

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
            { role: 'user', content: prompt }
          ],
          max_tokens: detailed ? 300 : 150,
          temperature: 0.7,
          stream: true
        },
        { ...secureConfig, responseType: 'stream' }
      );

      return await new Promise<string>((resolve, reject) => {
        let fullMessage = '';
        let lineBuffer = '';
        const stream = response.data as NodeJS.ReadableStream;

        stream.on('data', (raw: Buffer) => {
          // Accumulate data to handle JSON objects split across buffer boundaries
          lineBuffer += raw.toString();
          const lines = lineBuffer.split('\n');
          // Keep the last (potentially incomplete) fragment in the buffer
          lineBuffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const dataLine = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed;
            if (dataLine === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataLine);
              const delta = parsed?.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                fullMessage += delta;
                onChunk?.(delta);
              }
            } catch {
              // non-JSON lines (e.g. keep-alive comments) are ignored
            }
          }
        });

        stream.on('end', () => {
          // Flush any remaining buffered content
          if (lineBuffer.trim()) {
            const dataLine = lineBuffer.trim().startsWith('data: ')
              ? lineBuffer.trim().slice(6)
              : lineBuffer.trim();
            if (dataLine && dataLine !== '[DONE]') {
              try {
                const parsed = JSON.parse(dataLine);
                const delta = parsed?.choices?.[0]?.delta?.content ?? '';
                if (delta) {
                  fullMessage += delta;
                  onChunk?.(delta);
                }
              } catch { /* ignored */ }
            }
          }

          const trimmed = fullMessage.trim();
          if (!SecurityUtils.validateCommitMessage(trimmed)) {
            reject(new Error('Generated commit message failed security validation'));
            return;
          }
          resolve(trimmed);
        });

        stream.on('error', reject);
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) throw new Error('Invalid OpenAI API key');
        if (error.response?.status === 429) throw new Error('OpenAI API rate limit exceeded. Please try again later.');
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          const timeoutMs = this.configManager.getConfig('timeout') ?? 30000;
          throw new Error(`OpenAI API request timed out after ${timeoutMs / 1000}s. Consider increasing the timeout with: gitgenius config timeout`);
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

