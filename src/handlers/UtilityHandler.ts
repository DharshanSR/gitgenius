import inquirer from 'inquirer';
import chalk from 'chalk';
import { GitService } from '../services/GitService.js';
import { ConfigManager } from '../core/ConfigManager.js';
import { UndoOptions, HistoryOptions, AliasOptions } from '../types.js';

export class UtilityHandler {
  private gitService: GitService;
  private configManager: ConfigManager;

  constructor() {
    this.gitService = new GitService();
    this.configManager = new ConfigManager();
  }

  async undoChanges(options: UndoOptions): Promise<void> {
    try {
      if (options.commit) {
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: 'Undo last commit (soft reset)?',
            default: false
          }
        ]);

        if (confirmed) {
          if (options.hard) {
            await this.gitService.reset(['--hard', 'HEAD~1']);
            console.log(chalk.green('[SUCCESS] Hard reset completed (changes lost)'));
          } else {
            await this.gitService.reset(['--soft', 'HEAD~1']);
            console.log(chalk.green('[SUCCESS] Soft reset completed (changes preserved)'));
          }
        }
      } else if (options.staged) {
        await this.gitService.reset();
        console.log(chalk.green('[SUCCESS] All changes unstaged'));
      } else {
        console.log(chalk.yellow('[INFO] Please specify what to undo: --commit, --staged'));
      }
    } catch (error) {
      throw new Error(`Failed to undo changes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async showHistory(options: HistoryOptions): Promise<void> {
    try {
      const history = this.configManager.getConfig('messageHistory') || [];
      
      if (options.clear) {
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: 'Clear all message history?',
            default: false
          }
        ]);

        if (confirmed) {
          this.configManager.setConfigValue('messageHistory', []);
          console.log(chalk.green('✨ [SUCCESS] Message history cleared'));
        }
        return;
      }

      if (history.length === 0) {
        console.log(chalk.yellow('[WARNING] No message history found'));
        return;
      }

      const count = parseInt(options.number || '10');
      console.log(chalk.blue(`[HISTORY] Message History (${Math.min(count, history.length)} of ${history.length}):`));
      
      history.slice(0, count).forEach((msg: any, index: number) => {
        const date = new Date(msg.timestamp).toLocaleDateString();
        console.log(`${chalk.yellow(index + 1)}. ${chalk.white(msg.message)}`);
        console.log(`   ${chalk.gray(`${msg.type || 'unknown'} • ${date}`)}`);
      });

      if (options.export) {
        const fs = await import('fs');
        fs.writeFileSync(options.export, JSON.stringify(history, null, 2));
        console.log(chalk.green(`[SUCCESS] History exported to ${options.export}`));
      }
    } catch (error) {
      throw new Error(`Failed to show history: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async manageAliases(options: AliasOptions, name?: string, command?: string): Promise<void> {
    try {
      const aliases = this.configManager.getConfig('aliases') || {};

      if (options.list) {
        if (Object.keys(aliases).length === 0) {
          console.log(chalk.yellow('[WARNING] No aliases found'));
          return;
        }

        console.log(chalk.blue('[ALIAS] Command Aliases:'));
        Object.entries(aliases).forEach(([alias, cmd]) => {
          console.log(`        ${chalk.yellow(alias)} → ${chalk.white(cmd)}`);
        });
        return;
      }

      if (options.add && name && command) {
        aliases[name] = command;
        this.configManager.setConfigValue('aliases', aliases);
        console.log(chalk.green(`✨ [SUCCESS] Alias "${name}" added`));
        return;
      }

      if (options.remove && name) {
        if (aliases[name]) {
          delete aliases[name];
          this.configManager.setConfigValue('aliases', aliases);
          console.log(chalk.green(`[SUCCESS] Alias "${name}" removed`));
        } else {
          console.log(chalk.yellow(`[WARNING] Alias "${name}" not found`));
        }
        return;
      }

      // Interactive alias management
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Alias management:',
          choices: [
            { name: 'List aliases', value: 'list' },
            { name: 'Add alias', value: 'add' },
            { name: 'Remove alias', value: 'remove' }
          ]
        }
      ]);

      if (action === 'list') {
        await this.manageAliases({ list: true });
      } else if (action === 'add') {
        const { aliasName, aliasCommand } = await inquirer.prompt([
          { type: 'input', name: 'aliasName', message: 'Alias name:' },
          { type: 'input', name: 'aliasCommand', message: 'Command:' }
        ]);
        await this.manageAliases({ add: aliasName }, aliasName, aliasCommand);
      }
    } catch (error) {
      throw new Error(`Failed to manage aliases: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
