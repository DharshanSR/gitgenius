import simpleGit, { SimpleGit } from 'simple-git';
import inquirer from 'inquirer';
import chalk from 'chalk';
import clipboardy from 'clipboardy';
import { BranchOptions } from '../types.js';

export class BranchManager {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit();
  }

  async handleBranches(options: BranchOptions): Promise<void> {
    if (options.delete) {
      await this.deleteBranches(options.force);
    } else {
      await this.listBranches(options);
    }
  }

  async listBranches(options: BranchOptions): Promise<void> {
    try {
      const branches = await this.getBranches(options.remote);
      
      if (branches.length === 0) {
        console.log(chalk.yellow('No branches found'));
        return;
      }

      if (options.copy) {
        const { selectedBranch } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedBranch',
            message: 'Select a branch to copy:',
            choices: branches.map(branch => ({
              name: this.formatBranchName(branch),
              value: branch.name
            }))
          }
        ]);

        await clipboardy.write(selectedBranch);
        console.log(chalk.green(`✓ Branch "${selectedBranch}" copied to clipboard`));
      } else {
        console.log(chalk.blue('📋 Available branches:'));
        branches.forEach(branch => {
          console.log(`  ${this.formatBranchName(branch)}`);
        });
      }
    } catch (error) {
      throw new Error(`Failed to list branches: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async interactiveCheckout(): Promise<void> {
    try {
      const branches = await this.getBranches(false);
      
      if (branches.length === 0) {
        console.log(chalk.yellow('No branches available for checkout'));
        return;
      }

      const currentBranch = await this.getCurrentBranch();
      const availableBranches = branches.filter(b => b.name !== currentBranch);

      if (availableBranches.length === 0) {
        console.log(chalk.yellow('No other branches available for checkout'));
        return;
      }

      const { selectedBranch } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedBranch',
          message: 'Select a branch to checkout:',
          choices: availableBranches.map(branch => ({
            name: this.formatBranchName(branch),
            value: branch.name
          }))
        }
      ]);

      await this.git.checkout(selectedBranch);
      console.log(chalk.green(`✓ Switched to branch "${selectedBranch}"`));
    } catch (error) {
      throw new Error(`Failed to checkout branch: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async deleteBranches(force?: boolean): Promise<void> {
    try {
      const branches = await this.getBranches(false);
      const currentBranch = await this.getCurrentBranch();
      const deletableBranches = branches.filter(b => 
        b.name !== currentBranch && 
        b.name !== 'main' && 
        b.name !== 'master'
      );

      if (deletableBranches.length === 0) {
        console.log(chalk.yellow('No branches available for deletion'));
        return;
      }

      const { selectedBranches } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selectedBranches',
          message: 'Select branches to delete:',
          choices: deletableBranches.map(branch => ({
            name: this.formatBranchName(branch),
            value: branch.name
          }))
        }
      ]);

      if (selectedBranches.length === 0) {
        console.log(chalk.yellow('No branches selected'));
        return;
      }

      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Are you sure you want to delete ${selectedBranches.length} branch(es)?`,
          default: false
        }
      ]);

      if (confirmed) {
        const deleteOption = force ? ['-D'] : ['-d'];
        
        for (const branch of selectedBranches) {
          try {
            await this.git.branch(deleteOption.concat(branch));
            console.log(chalk.green(`✓ Deleted branch "${branch}"`));
          } catch (error) {
            console.log(chalk.red(`✗ Failed to delete branch "${branch}": ${error instanceof Error ? error.message : String(error)}`));
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to delete branches: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getBranches(includeRemote?: boolean): Promise<Array<{ name: string; current: boolean; remote?: boolean }>> {
    const branchSummary = await this.git.branch(includeRemote ? ['-a'] : []);
    const branches: Array<{ name: string; current: boolean; remote?: boolean }> = [];

    branchSummary.all.forEach(branchName => {
      const isRemote = branchName.startsWith('remotes/');
      const cleanName = isRemote ? branchName.replace('remotes/', '') : branchName;
      
      if (!isRemote || includeRemote) {
        branches.push({
          name: cleanName,
          current: branchName === branchSummary.current,
          remote: isRemote
        });
      }
    });

    return branches;
  }

  private async getCurrentBranch(): Promise<string> {
    const branchSummary = await this.git.branch();
    return branchSummary.current;
  }

  private formatBranchName(branch: { name: string; current: boolean; remote?: boolean }): string {
    let formatted = branch.name;
    
    if (branch.current) {
      formatted = chalk.green(`* ${formatted}`);
    } else {
      formatted = `  ${formatted}`;
    }
    
    if (branch.remote) {
      formatted = chalk.blue(`${formatted} (remote)`);
    }
    
    return formatted;
  }
}
