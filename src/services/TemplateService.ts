import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConfigManager } from '../core/ConfigManager.js';
import { CommitTemplate, TemplateOptions } from '../types.js';

export class TemplateService {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
  }

  getTemplates(): CommitTemplate[] {
    return this.configManager.getConfig('templates') || [];
  }

  listTemplates(templates: CommitTemplate[]): void {
    if (templates.length === 0) {
      console.log(chalk.yellow('[WARNING] No templates found'));
      return;
    }

    console.log(chalk.blue('[INFO] Available templates:'));
    templates.forEach(template => {
      console.log(`        ${chalk.yellow(template.name)}: ${chalk.white(template.description)}`);
      console.log(`        Pattern: ${chalk.gray(template.pattern)}`);
    });
  }

  async addTemplate(name: string, templates: CommitTemplate[]): Promise<void> {
    const { pattern, description } = await inquirer.prompt([
      {
        type: 'input',
        name: 'pattern',
        message: 'Enter commit message pattern:'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Enter template description:'
      }
    ]);

    templates.push({ name, pattern, description });
    this.configManager.setConfigValue('templates', templates);
    console.log(chalk.green(`✨ [SUCCESS] Template "${name}" added successfully`));
  }

  async removeTemplate(name: string, templates: CommitTemplate[]): Promise<void> {
    const index = templates.findIndex(t => t.name === name);
    if (index === -1) {
      console.log(chalk.yellow(`[WARNING] Template "${name}" not found`));
      return;
    }

    templates.splice(index, 1);
    this.configManager.setConfigValue('templates', templates);
    console.log(chalk.green(`[SUCCESS] Template "${name}" removed successfully`));
  }

  findTemplate(name: string, templates: CommitTemplate[]): CommitTemplate | undefined {
    return templates.find(t => t.name === name);
  }

  async interactiveManagement(templates: CommitTemplate[]): Promise<void> {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Template management:',
        choices: [
          { name: 'List templates', value: 'list' },
          { name: 'Add template', value: 'add' },
          { name: 'Remove template', value: 'remove' },
          { name: 'Use template', value: 'use' }
        ]
      }
    ]);

    switch (action) {
      case 'list':
        this.listTemplates(templates);
        break;
      case 'add':
        const { name } = await inquirer.prompt([
          { type: 'input', name: 'name', message: 'Template name:' }
        ]);
        await this.addTemplate(name, templates);
        break;
      case 'remove':
        if (templates.length === 0) {
          console.log(chalk.yellow('[WARNING] No templates to remove'));
          break;
        }
        const { templateToRemove } = await inquirer.prompt([
          {
            type: 'list',
            name: 'templateToRemove',
            message: 'Select template to remove:',
            choices: templates.map(t => ({ name: t.name, value: t.name }))
          }
        ]);
        await this.removeTemplate(templateToRemove, templates);
        break;
      case 'use':
        if (templates.length === 0) {
          console.log(chalk.yellow('[WARNING] No templates available'));
          break;
        }
        const { templateToUse } = await inquirer.prompt([
          {
            type: 'list',
            name: 'templateToUse',
            message: 'Select template to use:',
            choices: templates.map(t => ({ name: `${t.name} - ${t.description}`, value: t.name }))
          }
        ]);
        const template = this.findTemplate(templateToUse, templates);
        if (template) {
          console.log(chalk.green(`✨ [SUCCESS] Using template "${templateToUse}"`));
          console.log(chalk.white(`          ${template.pattern}`));
        }
        break;
    }
  }

  createDefaultTemplates(): CommitTemplate[] {
    return [
      { name: 'feature', pattern: 'feat({scope}): {description}', description: 'New feature' },
      { name: 'bugfix', pattern: 'fix({scope}): {description}', description: 'Bug fix' },
      { name: 'docs', pattern: 'docs: {description}', description: 'Documentation' },
      { name: 'style', pattern: 'style({scope}): {description}', description: 'Code style changes' },
      { name: 'refactor', pattern: 'refactor({scope}): {description}', description: 'Code refactoring' },
      { name: 'test', pattern: 'test({scope}): {description}', description: 'Add or update tests' },
      { name: 'chore', pattern: 'chore({scope}): {description}', description: 'Maintenance tasks' }
    ];
  }
}
