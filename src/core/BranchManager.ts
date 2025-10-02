import simpleGit, { SimpleGit } from 'simple-git';
import inquirer from 'inquirer';
import chalk from 'chalk';
import clipboardy from 'clipboardy';
import { BranchOptions } from '../types.js';
import { GitStateManager } from '../utils/GitStateManager.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

export class BranchManager {
  private git: SimpleGit;
  private stateManager: GitStateManager;

  constructor() {
    this.git = simpleGit();
    this.stateManager = new GitStateManager();
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
      // Check for detached HEAD state
      const isDetached = await this.stateManager.isDetachedHead();
      if (isDetached) {
        console.log(chalk.yellow('⚠ Currently in detached HEAD state'));
        const { proceed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message: 'Do you want to proceed with branch checkout? (uncommitted changes may be lost)',
            default: false
          }
        ]);

        if (!proceed) {
          console.log(chalk.blue('Operation cancelled'));
          return;
        }
      }

      // Check workspace state
      const state = await this.stateManager.getState();
      if (state.hasUncommittedChanges) {
        console.log(chalk.yellow('⚠ You have uncommitted changes'));
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'How would you like to proceed?',
            choices: [
              { name: 'Stash changes and checkout', value: 'stash' },
              { name: 'Force checkout (discard changes)', value: 'force' },
              { name: 'Cancel', value: 'cancel' }
            ]
          }
        ]);

        if (action === 'cancel') {
          console.log(chalk.blue('Operation cancelled'));
          return;
        } else if (action === 'stash') {
          await this.git.stash(['push', '-m', 'Auto-stash before branch checkout']);
          console.log(chalk.green('✓ Changes stashed'));
        }
      }

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
      throw ErrorHandler.gitError(
        `Failed to checkout branch: ${error instanceof Error ? error.message : String(error)}`,
        [
          'Check for uncommitted changes: git status',
          'Stash your changes: git stash',
          'Commit your changes before switching branches'
        ]
      );
    }
  }

  private async deleteBranches(force?: boolean): Promise<void> {
    try {
      // Check for detached HEAD state
      const isDetached = await this.stateManager.isDetachedHead();
      if (isDetached) {
        throw ErrorHandler.gitError(
          'Cannot delete branches in detached HEAD state',
          ['Switch to a branch first: git checkout <branch>']
        );
      }

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

      if (!force) {
        console.log(chalk.yellow('\n⚠ Warning: Normal delete (-d) will fail for unmerged branches'));
        console.log(chalk.yellow('Use --force to delete unmerged branches (use with caution)'));
      }

      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Are you sure you want to delete ${selectedBranches.length} branch(es)?${force ? ' (FORCE DELETE)' : ''}`,
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
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (errorMsg.includes('not fully merged')) {
              console.log(chalk.red(`✗ Branch "${branch}" is not fully merged`));
              console.log(chalk.yellow('  Use --force to delete anyway'));
            } else {
              console.log(chalk.red(`✗ Failed to delete branch "${branch}": ${errorMsg}`));
            }
          }
        }
      }
    } catch (error) {
      throw ErrorHandler.gitError(
        `Failed to delete branches: ${error instanceof Error ? error.message : String(error)}`,
        [
          'Ensure branches are fully merged before deletion',
          'Use --force to delete unmerged branches',
          'Check current branch: git branch'
        ]
      );
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
    if (!branchSummary.current) {
      throw ErrorHandler.gitError(
        'Unable to determine current branch (detached HEAD?)',
        ['Check Git status: git status', 'Switch to a branch: git checkout <branch>']
      );
    }
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
