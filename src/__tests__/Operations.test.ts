import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { SetupOperations } from '../operations/SetupOperations';
import { SystemOperations } from '../operations/SystemOperations';
import type { InitOptions, StatsOptions, UpdateOptions, GitStateOptions } from '../types';

describe('SetupOperations', () => {
  let setupOps: SetupOperations;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    setupOps = new SetupOperations();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('initializeRepo', () => {
    test('should show initialization message', async () => {
      const gitService = (setupOps as any).gitService;
      jest.spyOn(gitService, 'addConfig').mockResolvedValue(undefined);
      const configManager = (setupOps as any).configManager;
      jest.spyOn(configManager, 'setConfigValue').mockReturnValue(undefined);

      const options: InitOptions = {};
      await setupOps.initializeRepo(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('GitGenius initialization complete');
    });

    test('should install git hooks when hooks option is set', async () => {
      const options: InitOptions = { hooks: true };
      await setupOps.initializeRepo(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('Git hooks installed');
    });

    test('should create default templates when templates option is set', async () => {
      const configManager = (setupOps as any).configManager;
      const setSpy = jest.spyOn(configManager, 'setConfigValue').mockReturnValue(undefined);

      const options: InitOptions = { templates: true };
      await setupOps.initializeRepo(options);

      expect(setSpy).toHaveBeenCalledWith('templates', expect.any(Array));
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('Default templates created');
    });

    test('should configure git when config option is set', async () => {
      const gitService = (setupOps as any).gitService;
      const addConfigSpy = jest.spyOn(gitService, 'addConfig').mockResolvedValue(undefined);

      const options: InitOptions = { config: true };
      await setupOps.initializeRepo(options);

      expect(addConfigSpy).toHaveBeenCalledWith('commit.template', '.gitmessage');
    });

    test('should do everything when all option is set', async () => {
      const gitService = (setupOps as any).gitService;
      const configManager = (setupOps as any).configManager;
      jest.spyOn(gitService, 'addConfig').mockResolvedValue(undefined);
      jest.spyOn(configManager, 'setConfigValue').mockReturnValue(undefined);

      const options: InitOptions = { all: true };
      await setupOps.initializeRepo(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('Git hooks installed');
      expect(output).toContain('Default templates created');
      expect(output).toContain('Git configuration updated');
    });

    test('should throw on git service error', async () => {
      const gitService = (setupOps as any).gitService;
      jest.spyOn(gitService, 'addConfig').mockRejectedValue(new Error('git error'));

      const options: InitOptions = { config: true };
      await expect(setupOps.initializeRepo(options)).rejects.toThrow('Failed to initialize');
    });
  });
});

describe('SystemOperations', () => {
  let sysOps: SystemOperations;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    sysOps = new SystemOperations();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('showStats', () => {
    test('should display git statistics', async () => {
      const gitService = (sysOps as any).gitService;
      jest.spyOn(gitService, 'getLog').mockResolvedValue({
        total: 10,
        all: [
          { author_name: 'Alice', message: 'feat: feature 1' },
          { author_name: 'Bob', message: 'fix: bug fix' },
          { author_name: 'Alice', message: 'docs: update' }
        ]
      } as any);
      jest.spyOn(gitService, 'calculateStats').mockReturnValue({
        totalCommits: 10,
        authors: { Alice: 2, Bob: 1 },
        commitTypes: { feat: 1, fix: 1 },
        filesChanged: 0,
        linesAdded: 0,
        linesDeleted: 0
      });
      jest.spyOn(gitService, 'displayStats').mockReturnValue(undefined);

      const options: StatsOptions = { days: '7' };
      await sysOps.showStats(options);

      expect(gitService.getLog).toHaveBeenCalled();
      expect(gitService.calculateStats).toHaveBeenCalled();
      expect(gitService.displayStats).toHaveBeenCalled();
    });

    test('should pass author filter to log', async () => {
      const gitService = (sysOps as any).gitService;
      const logSpy = jest.spyOn(gitService, 'getLog').mockResolvedValue({ total: 0, all: [] } as any);
      jest.spyOn(gitService, 'calculateStats').mockReturnValue({
        totalCommits: 0, authors: {}, commitTypes: {}, filesChanged: 0, linesAdded: 0, linesDeleted: 0
      });
      jest.spyOn(gitService, 'displayStats').mockReturnValue(undefined);

      const options: StatsOptions = { days: '30', author: 'Alice' };
      await sysOps.showStats(options);

      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ author: 'Alice' }));
    });

    test('should throw on git error', async () => {
      const gitService = (sysOps as any).gitService;
      jest.spyOn(gitService, 'getLog').mockRejectedValue(new Error('git error'));

      await expect(sysOps.showStats({ days: '7' })).rejects.toThrow('Failed to generate stats');
    });
  });

  describe('showWhoami', () => {
    test('should display provider info', async () => {
      const configManager = (sysOps as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockImplementation((key: string) => {
        if (key === 'provider') return 'openai';
        if (key === 'model') return 'gpt-3.5-turbo';
        return null;
      });
      jest.spyOn(configManager, 'hasApiKey').mockReturnValue(false);

      const gitService = (sysOps as any).gitService;
      jest.spyOn(gitService, 'getConfig').mockResolvedValue({ value: 'Test User' } as any);

      await sysOps.showWhoami();

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('openai');
    });

    test('should show masked API key when configured', async () => {
      const configManager = (sysOps as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue('openai');
      jest.spyOn(configManager, 'hasApiKey').mockReturnValue(true);
      jest.spyOn(configManager, 'getApiKey').mockReturnValue('sk-test12345678901234567890');

      const gitService = (sysOps as any).gitService;
      jest.spyOn(gitService, 'getConfig').mockResolvedValue({ value: 'Test User' } as any);

      await sysOps.showWhoami();

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('Ready to generate');
    });
  });

  describe('checkUpdates', () => {
    test('should start update check', async () => {
      const options: UpdateOptions = { check: true };
      await sysOps.checkUpdates(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('Checking for GitGenius updates');
    });
  });

  describe('showGitState', () => {
    test('should display git state', async () => {
      const gitService = (sysOps as any).gitService;
      jest.spyOn(gitService, 'displayState').mockResolvedValue(undefined);
      jest.spyOn(gitService, 'getCurrentBranch').mockResolvedValue('main');
      jest.spyOn(gitService, 'getStatus').mockResolvedValue({
        staged: ['file.ts'],
        modified: [],
        not_added: [],
        deleted: []
      } as any);
      jest.spyOn(gitService, 'ensureCleanWorkspace').mockResolvedValue(undefined);
      jest.spyOn(gitService, 'getWorktrees').mockResolvedValue([]);
      jest.spyOn(gitService, 'getSubmodules').mockResolvedValue([]);

      const options: GitStateOptions = {};
      await sysOps.showGitState(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output.length).toBeGreaterThan(0);
    });

    test('should validate environment when validate option is set', async () => {
      const gitService = (sysOps as any).gitService;
      jest.spyOn(gitService, 'displayState').mockResolvedValue(undefined);
      jest.spyOn(gitService, 'getCurrentBranch').mockResolvedValue('main');
      jest.spyOn(gitService, 'getStatus').mockResolvedValue({
        staged: [], modified: [], not_added: [], deleted: []
      } as any);
      jest.spyOn(gitService, 'ensureCleanWorkspace').mockResolvedValue(undefined);
      jest.spyOn(gitService, 'getWorktrees').mockResolvedValue([]);
      jest.spyOn(gitService, 'getSubmodules').mockResolvedValue([]);
      const stateManager = gitService.getStateManager();
      jest.spyOn(stateManager, 'validateEnvironment').mockResolvedValue({ valid: true, errors: [] });

      const options: GitStateOptions = { validate: true };
      await sysOps.showGitState(options);

      expect(stateManager.validateEnvironment).toHaveBeenCalled();
    });
  });
});
