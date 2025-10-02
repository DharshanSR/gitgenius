import chalk from 'chalk';
import { CommitHandler } from '../handlers/CommitHandler.js';
import { GitOperationsHandler } from '../handlers/GitOperationsHandler.js';
import { UtilityHandler } from '../handlers/UtilityHandler.js';
import { PullRequestHandler } from '../handlers/PullRequestHandler.js';
import { SetupOperations } from '../operations/SetupOperations.js';
import { SystemOperations } from '../operations/SystemOperations.js';
import { TemplateService } from '../services/TemplateService.js';
import { 
  CommitOptions,
  PreviousCommitOptions,
  PullRequestOptions,
  StatsOptions,
  TemplateOptions,
  LogOptions,
  DiffOptions,
  ReviewOptions,
  SuggestOptions,
  UndoOptions,
  HistoryOptions,
  AliasOptions,
  InitOptions,
  FeedbackOptions,
  UpdateOptions,
  GitStateOptions
} from '../types.js';

export class GitGenius {
  private commitHandler: CommitHandler;
  private gitOpsHandler: GitOperationsHandler;
  private utilityHandler: UtilityHandler;
  private pullRequestHandler: PullRequestHandler;
  private setupOps: SetupOperations;
  private systemOps: SystemOperations;
  private templateService: TemplateService;

  constructor() {
    this.commitHandler = new CommitHandler();
    this.gitOpsHandler = new GitOperationsHandler();
    this.utilityHandler = new UtilityHandler();
    this.pullRequestHandler = new PullRequestHandler();
    this.setupOps = new SetupOperations();
    this.systemOps = new SystemOperations();
    this.templateService = new TemplateService();
  }

  // Commit operations
  async generateCommit(options: CommitOptions): Promise<void> {
    return await this.commitHandler.generateCommit(options);
  }

  async handlePreviousCommit(options: PreviousCommitOptions): Promise<void> {
    return await this.commitHandler.handlePreviousCommit(options);
  }

  // Pull Request operations
  async createPullRequest(options: PullRequestOptions): Promise<void> {
    return await this.pullRequestHandler.createPullRequest(options);
  }

  // Git operations
  async showLog(options: LogOptions): Promise<void> {
    return await this.gitOpsHandler.showLog(options);
  }

  async showDiff(options: DiffOptions): Promise<void> {
    return await this.gitOpsHandler.showDiff(options);
  }

  async reviewChanges(options: ReviewOptions): Promise<void> {
    return await this.gitOpsHandler.reviewChanges(options);
  }

  async suggestCommitInfo(options: SuggestOptions): Promise<void> {
    return await this.gitOpsHandler.suggestCommitInfo(options);
  }

  // Utility operations
  async undoChanges(options: UndoOptions): Promise<void> {
    return await this.utilityHandler.undoChanges(options);
  }

  async showHistory(options: HistoryOptions): Promise<void> {
    return await this.utilityHandler.showHistory(options);
  }

  async manageAliases(options: AliasOptions, name?: string, command?: string): Promise<void> {
    return await this.utilityHandler.manageAliases(options, name, command);
  }

  // Template operations
  async handleTemplates(options: TemplateOptions): Promise<void> {
    const templates = this.templateService.getTemplates();

    if (options.list) {
      this.templateService.listTemplates(templates);
      return;
    }

    if (options.add) {
      await this.templateService.addTemplate(options.add, templates);
      return;
    }

    if (options.remove) {
      await this.templateService.removeTemplate(options.remove, templates);
      return;
    }

    if (options.use) {
      const template = this.templateService.findTemplate(options.use, templates);
      if (template) {
        this.commitHandler.setLastCommitMessage(template.pattern);
        console.log(chalk.green(`✨ [SUCCESS] Using template "${options.use}"`));
        console.log(chalk.white(`          ${template.pattern}`));
      } else {
        console.log(chalk.yellow(`[WARNING] Template "${options.use}" not found`));
      }
      return;
    }

    // Interactive template management
    await this.templateService.interactiveManagement(templates);
  }

  // Setup operations
  async initializeRepo(options: InitOptions): Promise<void> {
    return await this.setupOps.initializeRepo(options);
  }

  async sendFeedback(options: FeedbackOptions): Promise<void> {
    return await this.setupOps.sendFeedback(options);
  }

  // System operations
  async showStats(options: StatsOptions): Promise<void> {
    return await this.systemOps.showStats(options);
  }

  async checkUpdates(options: UpdateOptions): Promise<void> {
    return await this.systemOps.checkUpdates(options);
  }

  async showWhoami(): Promise<void> {
    return await this.systemOps.showWhoami();
  }

  async showGitState(options: GitStateOptions): Promise<void> {
    return await this.systemOps.showGitState(options);
  }
}
