import Conf from 'conf';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ConfigOptions, ConfigBackup, ConfigLevel } from '../types.js';
import { validateConfig, migrateConfig, needsMigration, CONFIG_VERSION } from './ConfigSchema.js';
import { getTemplate, listTemplates } from './ConfigTemplates.js';

export class ConfigManager {
  private config: Conf<any>;
  private globalConfig: Conf<any>;
  private projectConfig: Conf<any> | null = null;

  constructor() {
    // Global configuration (system-wide)
    this.globalConfig = new Conf({
      projectName: 'gitgenius',
      projectVersion: CONFIG_VERSION,
      defaults: this.getDefaultConfig()
    });

    // User configuration (default, main instance)
    this.config = new Conf({
      projectName: 'gitgenius',
      projectVersion: CONFIG_VERSION,
      configName: 'config',
      defaults: this.getDefaultConfig()
    });

    // Initialize project config if in a git repository
    this.initProjectConfig();

    // Auto-migrate if needed
    this.autoMigrate();
  }

  private getDefaultConfig() {
    return {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      apiKey: null,
      maxTokens: 150,
      temperature: 0.7,
      commitTypes: [
        'feat', 'fix', 'docs', 'style', 'refactor', 
        'test', 'chore', 'perf', 'ci', 'build'
      ],
      configVersion: CONFIG_VERSION
    };
  }

  private initProjectConfig(): void {
    try {
      // Check if we're in a git repository
      const gitDir = process.cwd();
      
      if (existsSync(join(gitDir, '.git'))) {
        // We're in a git repo, initialize project config
        this.projectConfig = new Conf({
          projectName: 'gitgenius',
          configName: 'project-config',
          cwd: join(gitDir, '.gitgenius')
        });
      }
    } catch (error) {
      // Not in a git repo or can't access, that's ok
      this.projectConfig = null;
    }
  }

  private autoMigrate(): void {
    const version = this.config.get('configVersion') as string | undefined;
    
    if (needsMigration(version)) {
      console.log(chalk.yellow('⚠ Configuration needs migration. Migrating...'));
      const currentConfig = this.config.store;
      const migratedConfig = migrateConfig(currentConfig, version);
      
      // Update configuration
      Object.entries(migratedConfig).forEach(([key, value]) => {
        this.config.set(key, value);
      });
      
      console.log(chalk.green(`✓ Configuration migrated to version ${CONFIG_VERSION}`));
    }
  }

  async handleConfig(key?: string, value?: string, options?: ConfigOptions): Promise<void> {
    if (options?.reset) {
      await this.resetConfig();
      return;
    }

    if (options?.backup) {
      await this.backupConfig();
      return;
    }

    if (options?.restore) {
      await this.restoreConfig(options.restore);
      return;
    }

    if (options?.validate) {
      await this.validateCurrentConfig();
      return;
    }

    if (options?.template) {
      await this.applyTemplate(options.template);
      return;
    }

    if (options?.export) {
      await this.exportConfig(options.export);
      return;
    }

    if (options?.import) {
      await this.importConfig(options.import);
      return;
    }

    if (options?.migrate) {
      await this.migrateConfigManual();
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

  // Configuration inheritance: project > user > global
  private getConfigWithInheritance(key: string): any {
    // Check project config first
    if (this.projectConfig && this.projectConfig.has(key)) {
      return this.projectConfig.get(key);
    }
    
    // Then user config
    if (this.config.has(key)) {
      return this.config.get(key);
    }
    
    // Finally global config
    return this.globalConfig.get(key);
  }

  // Backup configuration
  private async backupConfig(): Promise<void> {
    try {
      const backup: ConfigBackup = {
        version: CONFIG_VERSION,
        timestamp: new Date().toISOString(),
        config: this.config.store as any
      };

      const backupPath = join(this.config.path, '..', `config-backup-${Date.now()}.json`);
      writeFileSync(backupPath, JSON.stringify(backup, null, 2));

      console.log(chalk.green('✓ Configuration backed up successfully'));
      console.log(chalk.blue(`  Location: ${backupPath}`));
    } catch (error) {
      console.error(chalk.red('✗ Failed to backup configuration:'), error);
    }
  }

  // Restore configuration from backup
  private async restoreConfig(backupPath: string): Promise<void> {
    try {
      if (!existsSync(backupPath)) {
        console.error(chalk.red('✗ Backup file not found'));
        return;
      }

      const backupData = JSON.parse(readFileSync(backupPath, 'utf-8')) as ConfigBackup;
      
      // Validate backup
      const validation = validateConfig(backupData.config);
      if (!validation.valid) {
        console.error(chalk.red('✗ Invalid backup file:'));
        validation.errors?.forEach(err => console.error(chalk.red(`  - ${err}`)));
        return;
      }

      // Confirm restore
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Restore configuration from ${backupData.timestamp}?`,
          default: false
        }
      ]);

      if (!confirmed) {
        console.log(chalk.yellow('Restore cancelled'));
        return;
      }

      // Restore configuration
      this.config.clear();
      Object.entries(backupData.config).forEach(([key, value]) => {
        this.config.set(key, value);
      });

      console.log(chalk.green('✓ Configuration restored successfully'));
    } catch (error) {
      console.error(chalk.red('✗ Failed to restore configuration:'), error);
    }
  }

  // Validate current configuration
  private async validateCurrentConfig(): Promise<void> {
    const config = this.config.store;
    const validation = validateConfig(config);

    if (validation.valid) {
      console.log(chalk.green('✓ Configuration is valid'));
      console.log(chalk.blue(`  Version: ${config.configVersion || 'unknown'}`));
    } else {
      console.log(chalk.red('✗ Configuration validation failed:'));
      validation.errors?.forEach(err => {
        console.log(chalk.red(`  - ${err}`));
      });
      
      // Offer to fix
      const { fix } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'fix',
          message: 'Would you like to migrate and fix the configuration?',
          default: true
        }
      ]);

      if (fix) {
        await this.migrateConfigManual();
      }
    }
  }

  // Apply a configuration template
  private async applyTemplate(templateName: string): Promise<void> {
    const template = getTemplate(templateName);

    if (!template) {
      console.log(chalk.yellow('✗ Template not found'));
      console.log(chalk.blue('\nAvailable templates:'));
      listTemplates().forEach(t => {
        console.log(`  ${chalk.yellow(t.name)}: ${chalk.white(t.description)}`);
      });
      return;
    }

    // Show template details
    console.log(chalk.blue(`\n📋 Template: ${template.name}`));
    console.log(chalk.white(`   ${template.description}`));
    console.log(chalk.blue('\nConfiguration:'));
    Object.entries(template.config).forEach(([key, value]) => {
      console.log(`  ${chalk.yellow(key)}: ${chalk.white(JSON.stringify(value))}`);
    });

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Apply this template?',
        default: true
      }
    ]);

    if (!confirmed) {
      console.log(chalk.yellow('Template application cancelled'));
      return;
    }

    // Apply template
    Object.entries(template.config).forEach(([key, value]) => {
      this.config.set(key, value);
    });

    console.log(chalk.green('✓ Template applied successfully'));
  }

  // Export configuration
  private async exportConfig(exportPath: string): Promise<void> {
    try {
      const config = this.config.store;
      writeFileSync(exportPath, JSON.stringify(config, null, 2));
      console.log(chalk.green('✓ Configuration exported successfully'));
      console.log(chalk.blue(`  Location: ${exportPath}`));
    } catch (error) {
      console.error(chalk.red('✗ Failed to export configuration:'), error);
    }
  }

  // Import configuration
  private async importConfig(importPath: string): Promise<void> {
    try {
      if (!existsSync(importPath)) {
        console.error(chalk.red('✗ Import file not found'));
        return;
      }

      const importedConfig = JSON.parse(readFileSync(importPath, 'utf-8'));
      
      // Validate imported config
      const validation = validateConfig(importedConfig);
      if (!validation.valid) {
        console.error(chalk.red('✗ Invalid configuration file:'));
        validation.errors?.forEach(err => console.error(chalk.red(`  - ${err}`)));
        return;
      }

      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'Import this configuration?',
          default: false
        }
      ]);

      if (!confirmed) {
        console.log(chalk.yellow('Import cancelled'));
        return;
      }

      // Import configuration
      Object.entries(importedConfig).forEach(([key, value]) => {
        this.config.set(key, value);
      });

      console.log(chalk.green('✓ Configuration imported successfully'));
    } catch (error) {
      console.error(chalk.red('✗ Failed to import configuration:'), error);
    }
  }

  // Manual migration
  private async migrateConfigManual(): Promise<void> {
    console.log(chalk.blue('🔄 Migrating configuration...'));
    
    const currentConfig = this.config.store;
    const version = this.config.get('configVersion') as string | undefined;
    
    const migratedConfig = migrateConfig(currentConfig, version);
    
    // Update configuration
    this.config.clear();
    Object.entries(migratedConfig).forEach(([key, value]) => {
      this.config.set(key, value);
    });
    
    console.log(chalk.green(`✓ Configuration migrated to version ${CONFIG_VERSION}`));
    
    // Validate after migration
    const validation = validateConfig(this.config.store);
    if (validation.valid) {
      console.log(chalk.green('✓ Configuration is now valid'));
    } else {
      console.log(chalk.yellow('⚠ Some validation issues remain:'));
      validation.errors?.forEach(err => console.log(chalk.yellow(`  - ${err}`)));
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

  public getConfig(key: string, level?: ConfigLevel): any {
    if (level) {
      // Get from specific level
      switch (level) {
        case 'project':
          return this.projectConfig?.get(key);
        case 'user':
          return this.config.get(key);
        case 'global':
          return this.globalConfig.get(key);
      }
    }
    
    // Use inheritance: project > user > global
    return this.getConfigWithInheritance(key);
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
