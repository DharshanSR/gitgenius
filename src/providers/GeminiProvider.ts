import axios from 'axios';
import { AIProvider } from '../types.js';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateCommitMessage(diff: string, type?: string, detailed?: boolean): Promise<string> {
    const prompt = this.buildPrompt(diff, type, detailed);
    
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`,
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
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error('Invalid Gemini API key');
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
