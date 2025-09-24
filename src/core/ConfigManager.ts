import Conf from 'conf';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConfigOptions } from '../types.js';

export class ConfigManager {
  private config: Conf<any>;

  constructor() {
    this.config = new Conf({
      projectName: 'gitgenius',
      projectVersion: '1.0.0',
      defaults: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: null,
        maxTokens: 150,
        temperature: 0.7,
        commitTypes: [
          'feat', 'fix', 'docs', 'style', 'refactor', 
          'test', 'chore', 'perf', 'ci', 'build'
        ]
      }
    });
  }

  async handleConfig(key?: string, value?: string, options?: ConfigOptions): Promise<void> {
    if (options?.reset) {
      await this.resetConfig();
      return;
    }

    if (options?.list || (!key && !value)) {
      this.listConfig();
      return;
    }

    if (key && !value) {
      await this.setConfigInteractive(key);
      return;
    }

    if (key && value) {
      this.setConfig(key, value);
      return;
    }
  }

  private async resetConfig(): Promise<void> {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Are you sure you want to reset all configuration?',
        default: false
      }
    ]);

    if (confirmed) {
      this.config.clear();
      console.log(chalk.green('✓ Configuration reset successfully'));
    }
  }

  private listConfig(): void {
    const config = this.config.store;
    console.log(chalk.blue('📋 Current Configuration:'));

    // Always mask API keys, whether from config or environment
    const apiKeys = [
      'apiKey',
      'GITGENIUS_API_KEY',
      'OPENAI_API_KEY',
      'GEMINI_API_KEY',
    ];

    // Print config keys, masking any API key
    Object.entries(config).forEach(([key, value]) => {
      if (apiKeys.includes(key) && value) {
        console.log(`  ${chalk.yellow(key)}: ${chalk.gray('***hidden***')}`);
      } else {
        console.log(`  ${chalk.yellow(key)}: ${chalk.white(JSON.stringify(value))}`);
      }
    });

    // Also show if API keys are set in environment (but always masked)
    apiKeys.forEach((envKey) => {
      if (process.env[envKey]) {
        console.log(`  ${chalk.yellow(envKey)} (env): ${chalk.gray('***hidden***')}`);
      }
    });
  }

  private async setConfigInteractive(key: string): Promise<void> {
    if (key === 'apiKey') {
      await this.setApiKey();
    } else if (key === 'provider') {
      await this.setProvider();
    } else if (key === 'model') {
      await this.setModel();
    } else {
      const { value } = await inquirer.prompt([
        {
          type: 'input',
          name: 'value',
          message: `Enter value for ${key}:`
        }
      ]);
      this.setConfig(key, value);
    }
  }

  private async setApiKey(): Promise<void> {
    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your API key:',
        mask: '*'
      }
    ]);

    this.setConfig('apiKey', apiKey);
  }

  private async setProvider(): Promise<void> {
    const { provider } = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Select AI provider:',
        choices: [
          { name: 'OpenAI', value: 'openai' },
          { name: 'Google Gemini', value: 'gemini' },
          { name: 'Anthropic Claude', value: 'anthropic' }
        ]
      }
    ]);

    this.setConfig('provider', provider);
  }

  private async setModel(): Promise<void> {
    const provider = this.getConfig('provider');
    let choices: Array<{ name: string; value: string }> = [];

    switch (provider) {
      case 'openai':
        choices = [
          { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
          { name: 'GPT-4', value: 'gpt-4' },
          { name: 'GPT-4 Turbo', value: 'gpt-4-turbo-preview' }
        ];
        break;
      case 'gemini':
        choices = [
          { name: 'Gemini Pro', value: 'gemini-pro' },
          { name: 'Gemini Pro Vision', value: 'gemini-pro-vision' }
        ];
        break;
      case 'anthropic':
        choices = [
          { name: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
          { name: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
          { name: 'Claude 3 Opus', value: 'claude-3-opus-20240229' }
        ];
        break;
    }

    const { model } = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: 'Select model:',
        choices
      }
    ]);

    this.setConfig('model', model);
  }

  private setConfig(key: string, value: any): void {
    this.config.set(key, value);
    console.log(chalk.green(`✓ ${key} set successfully`));
  }

  public setConfigValue(key: string, value: any): void {
    this.config.set(key, value);
  }

  public getConfig(key: string): any {
    return this.config.get(key);
  }

  public hasApiKey(): boolean {
    return !!this.getApiKey();
  }

  public getApiKey(): string {
    // Check environment variables with different possible names
    const envKey = process.env.GITGENIUS_API_KEY || 
                   process.env.OPENAI_API_KEY || 
                   process.env.GEMINI_API_KEY ||
                   this.getConfig('apiKey');
    return envKey;
  }
}
