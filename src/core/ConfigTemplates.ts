import { ConfigTemplate } from '../types.js';

// Predefined configuration templates
export const CONFIG_TEMPLATES: ConfigTemplate[] = [
  {
    name: 'default',
    description: 'Default configuration with OpenAI GPT-3.5',
    config: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      maxTokens: 150,
      temperature: 0.7,
      commitTypes: [
        'feat', 'fix', 'docs', 'style', 'refactor', 
        'test', 'chore', 'perf', 'ci', 'build'
      ]
    }
  },
  {
    name: 'openai-gpt4',
    description: 'OpenAI GPT-4 for more detailed commit messages',
    config: {
      provider: 'openai',
      model: 'gpt-4',
      maxTokens: 200,
      temperature: 0.6
    }
  },
  {
    name: 'gemini',
    description: 'Google Gemini Pro configuration',
    config: {
      provider: 'gemini',
      model: 'gemini-pro',
      maxTokens: 150,
      temperature: 0.7
    }
  },
  {
    name: 'concise',
    description: 'Concise commit messages with lower token limit',
    config: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      maxTokens: 80,
      temperature: 0.5
    }
  },
  {
    name: 'detailed',
    description: 'Detailed commit messages with higher token limit',
    config: {
      provider: 'openai',
      model: 'gpt-4',
      maxTokens: 300,
      temperature: 0.8
    }
  },
  {
    name: 'conventional',
    description: 'Strict conventional commits format',
    config: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      maxTokens: 100,
      temperature: 0.3,
      commitTypes: [
        'feat', 'fix', 'docs', 'style', 'refactor', 
        'test', 'chore', 'perf', 'ci', 'build', 'revert'
      ]
    }
  }
];

export function getTemplate(name: string): ConfigTemplate | undefined {
  return CONFIG_TEMPLATES.find(t => t.name === name);
}

export function listTemplates(): ConfigTemplate[] {
  return CONFIG_TEMPLATES;
}
