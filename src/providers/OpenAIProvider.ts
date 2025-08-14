import axios from 'axios';
import { AIProvider } from '../types.js';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateCommitMessage(diff: string, type?: string, detailed?: boolean): Promise<string> {
    const prompt = this.buildPrompt(diff, type, detailed);
    
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
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
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid OpenAI API key');
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
