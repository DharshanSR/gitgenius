import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { GitGenius } from '../core/GitGeniusCore';
import type {
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
} from '../types';

describe('GitGenius (GitGeniusCore)', () => {
  let gitGenius: GitGenius;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    gitGenius = new GitGenius();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should create GitGenius instance', () => {
      expect(gitGenius).toBeDefined();
      expect(gitGenius instanceof GitGenius).toBe(true);
    });
  });

  describe('generateCommit', () => {
    test('should delegate to commitHandler.generateCommit', async () => {
      const commitHandler = (gitGenius as any).commitHandler;
      const spy = jest.spyOn(commitHandler, 'generateCommit').mockResolvedValue(undefined);

      const options: CommitOptions = { type: 'feat', apply: false };
      await gitGenius.generateCommit(options);

      expect(spy).toHaveBeenCalledWith(options);
    });

    test('should propagate errors from commitHandler', async () => {
      const commitHandler = (gitGenius as any).commitHandler;
      jest.spyOn(commitHandler, 'generateCommit').mockRejectedValue(new Error('Commit failed'));

      await expect(gitGenius.generateCommit({})).rejects.toThrow('Commit failed');
    });
  });

  describe('handlePreviousCommit', () => {
    test('should delegate to commitHandler.handlePreviousCommit', async () => {
      const commitHandler = (gitGenius as any).commitHandler;
      const spy = jest.spyOn(commitHandler, 'handlePreviousCommit').mockResolvedValue(undefined);

      const options: PreviousCommitOptions = { apply: false };
      await gitGenius.handlePreviousCommit(options);

      expect(spy).toHaveBeenCalledWith(options);
    });
  });

  describe('createPullRequest', () => {
    test('should delegate to pullRequestHandler.createPullRequest', async () => {
      const handler = (gitGenius as any).pullRequestHandler;
      const spy = jest.spyOn(handler, 'createPullRequest').mockResolvedValue(undefined);

      const options: PullRequestOptions = { title: 'New PR', draft: false };
      await gitGenius.createPullRequest(options);

      expect(spy).toHaveBeenCalledWith(options);
    });
  });

  describe('showLog', () => {
    test('should delegate to gitOpsHandler.showLog', async () => {
      const handler = (gitGenius as any).gitOpsHandler;
      const spy = jest.spyOn(handler, 'showLog').mockResolvedValue(undefined);

      const options: LogOptions = { number: '5' };
      await gitGenius.showLog(options);

      expect(spy).toHaveBeenCalledWith(options);
    });
  });

  describe('showDiff', () => {
    test('should delegate to gitOpsHandler.showDiff', async () => {
      const handler = (gitGenius as any).gitOpsHandler;
      const spy = jest.spyOn(handler, 'showDiff').mockResolvedValue(undefined);

      const options: DiffOptions = { staged: true };
      await gitGenius.showDiff(options);

      expect(spy).toHaveBeenCalledWith(options);
    });
  });

  describe('reviewChanges', () => {
    test('should delegate to gitOpsHandler.reviewChanges', async () => {
      const handler = (gitGenius as any).gitOpsHandler;
      const spy = jest.spyOn(handler, 'reviewChanges').mockResolvedValue(undefined);

      const options: ReviewOptions = { file: 'src/index.ts' };
      await gitGenius.reviewChanges(options);

      expect(spy).toHaveBeenCalledWith(options);
    });
  });

  describe('suggestCommitInfo', () => {
    test('should delegate to gitOpsHandler.suggestCommitInfo', async () => {
      const handler = (gitGenius as any).gitOpsHandler;
      const spy = jest.spyOn(handler, 'suggestCommitInfo').mockResolvedValue(undefined);

      const options: SuggestOptions = { type: true };
      await gitGenius.suggestCommitInfo(options);

      expect(spy).toHaveBeenCalledWith(options);
    });
  });

  describe('undoChanges', () => {
    test('should delegate to utilityHandler.undoChanges', async () => {
      const handler = (gitGenius as any).utilityHandler;
      const spy = jest.spyOn(handler, 'undoChanges').mockResolvedValue(undefined);

      const options: UndoOptions = { commit: true };
      await gitGenius.undoChanges(options);

      expect(spy).toHaveBeenCalledWith(options);
    });
  });

  describe('showHistory', () => {
    test('should delegate to utilityHandler.showHistory', async () => {
      const handler = (gitGenius as any).utilityHandler;
      const spy = jest.spyOn(handler, 'showHistory').mockResolvedValue(undefined);

      const options: HistoryOptions = { number: '5' };
      await gitGenius.showHistory(options);

      expect(spy).toHaveBeenCalledWith(options);
    });
  });

  describe('manageAliases', () => {
    test('should delegate to utilityHandler.manageAliases', async () => {
      const handler = (gitGenius as any).utilityHandler;
      const spy = jest.spyOn(handler, 'manageAliases').mockResolvedValue(undefined);

      const options: AliasOptions = { list: true };
      await gitGenius.manageAliases(options, 'name', 'command');

      expect(spy).toHaveBeenCalledWith(options, 'name', 'command');
    });
  });

  describe('handleTemplates', () => {
    test('should list templates when options.list is true', async () => {
      const templateService = (gitGenius as any).templateService;
      jest.spyOn(templateService, 'getTemplates').mockReturnValue([]);
      const listSpy = jest.spyOn(templateService, 'listTemplates').mockReturnValue(undefined);

      const options: TemplateOptions = { list: true };
      await gitGenius.handleTemplates(options);

      expect(listSpy).toHaveBeenCalled();
    });

    test('should add template when options.add is set', async () => {
      const templateService = (gitGenius as any).templateService;
      jest.spyOn(templateService, 'getTemplates').mockReturnValue([]);
      const addSpy = jest.spyOn(templateService, 'addTemplate').mockResolvedValue(undefined);

      const options: TemplateOptions = { add: 'mytemplate' };
      await gitGenius.handleTemplates(options);

      expect(addSpy).toHaveBeenCalledWith('mytemplate', []);
    });

    test('should remove template when options.remove is set', async () => {
      const templateService = (gitGenius as any).templateService;
      jest.spyOn(templateService, 'getTemplates').mockReturnValue([]);
      const removeSpy = jest.spyOn(templateService, 'removeTemplate').mockResolvedValue(undefined);

      const options: TemplateOptions = { remove: 'mytemplate' };
      await gitGenius.handleTemplates(options);

      expect(removeSpy).toHaveBeenCalledWith('mytemplate', []);
    });

    test('should use template when options.use is set and template found', async () => {
      const commitHandler = (gitGenius as any).commitHandler;
      const templateService = (gitGenius as any).templateService;
      const mockTemplate = { name: 'feature', pattern: 'feat: {desc}', description: 'Feature' };

      jest.spyOn(templateService, 'getTemplates').mockReturnValue([mockTemplate]);
      jest.spyOn(templateService, 'findTemplate').mockReturnValue(mockTemplate);
      const setMessageSpy = jest.spyOn(commitHandler, 'setLastCommitMessage').mockReturnValue(undefined);

      const options: TemplateOptions = { use: 'feature' };
      await gitGenius.handleTemplates(options);

      expect(setMessageSpy).toHaveBeenCalledWith('feat: {desc}');
    });

    test('should warn when use template not found', async () => {
      const templateService = (gitGenius as any).templateService;

      jest.spyOn(templateService, 'getTemplates').mockReturnValue([]);
      jest.spyOn(templateService, 'findTemplate').mockReturnValue(undefined);

      const options: TemplateOptions = { use: 'nonexistent' };
      await gitGenius.handleTemplates(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('not found');
    });

    test('should call interactiveManagement when no option specified', async () => {
      const templateService = (gitGenius as any).templateService;
      jest.spyOn(templateService, 'getTemplates').mockReturnValue([]);
      const interactiveSpy = jest.spyOn(templateService, 'interactiveManagement').mockResolvedValue(undefined);

      const options: TemplateOptions = {};
      await gitGenius.handleTemplates(options);

      expect(interactiveSpy).toHaveBeenCalled();
    });
  });

  describe('initializeRepo', () => {
    test('should delegate to setupOps.initializeRepo', async () => {
      const handler = (gitGenius as any).setupOps;
      const spy = jest.spyOn(handler, 'initializeRepo').mockResolvedValue(undefined);

      const options: InitOptions = { hooks: true };
      await gitGenius.initializeRepo(options);

      expect(spy).toHaveBeenCalledWith(options);
    });
  });

  describe('sendFeedback', () => {
    test('should delegate to setupOps.sendFeedback', async () => {
      const handler = (gitGenius as any).setupOps;
      const spy = jest.spyOn(handler, 'sendFeedback').mockResolvedValue(undefined);

      const options: FeedbackOptions = { bug: true };
      await gitGenius.sendFeedback(options);

      expect(spy).toHaveBeenCalledWith(options);
    });
  });

  describe('showStats', () => {
    test('should delegate to systemOps.showStats', async () => {
      const handler = (gitGenius as any).systemOps;
      const spy = jest.spyOn(handler, 'showStats').mockResolvedValue(undefined);

      const options: StatsOptions = { days: '7' };
      await gitGenius.showStats(options);

      expect(spy).toHaveBeenCalledWith(options);
    });
  });

  describe('checkUpdates', () => {
    test('should delegate to systemOps.checkUpdates', async () => {
      const handler = (gitGenius as any).systemOps;
      const spy = jest.spyOn(handler, 'checkUpdates').mockResolvedValue(undefined);

      const options: UpdateOptions = { check: true };
      await gitGenius.checkUpdates(options);

      expect(spy).toHaveBeenCalledWith(options);
    });
  });

  describe('showWhoami', () => {
    test('should delegate to systemOps.showWhoami', async () => {
      const handler = (gitGenius as any).systemOps;
      const spy = jest.spyOn(handler, 'showWhoami').mockResolvedValue(undefined);

      await gitGenius.showWhoami();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('showGitState', () => {
    test('should delegate to systemOps.showGitState', async () => {
      const handler = (gitGenius as any).systemOps;
      const spy = jest.spyOn(handler, 'showGitState').mockResolvedValue(undefined);

      const options: GitStateOptions = { validate: true };
      await gitGenius.showGitState(options);

      expect(spy).toHaveBeenCalledWith(options);
    });
  });
});
