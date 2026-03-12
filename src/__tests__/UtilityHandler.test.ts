import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { UtilityHandler } from '../handlers/UtilityHandler';
import type { UndoOptions, HistoryOptions, AliasOptions } from '../types';
import inquirer from 'inquirer';

describe('UtilityHandler', () => {
  let handler: UtilityHandler;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    handler = new UtilityHandler();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('undoChanges', () => {
    test('should warn when neither --commit nor --staged is specified', async () => {
      const options: UndoOptions = {};
      await handler.undoChanges(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('Please specify what to undo');
    });

    test('should perform soft reset when commit is true and user confirms', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ confirmed: true } as any);
      const resetSpy = jest.spyOn(gitService, 'reset').mockResolvedValue(undefined);

      const options: UndoOptions = { commit: true };
      await handler.undoChanges(options);

      expect(resetSpy).toHaveBeenCalledWith(['--soft', 'HEAD~1']);
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('Soft reset completed');
    });

    test('should perform hard reset when commit and hard are true', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ confirmed: true } as any);
      const resetSpy = jest.spyOn(gitService, 'reset').mockResolvedValue(undefined);

      const options: UndoOptions = { commit: true, hard: true };
      await handler.undoChanges(options);

      expect(resetSpy).toHaveBeenCalledWith(['--hard', 'HEAD~1']);
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('Hard reset completed');
    });

    test('should not reset when user cancels commit undo', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ confirmed: false } as any);
      const resetSpy = jest.spyOn(gitService, 'reset').mockResolvedValue(undefined);

      const options: UndoOptions = { commit: true };
      await handler.undoChanges(options);

      expect(resetSpy).not.toHaveBeenCalled();
    });

    test('should unstage all changes when staged is true', async () => {
      const gitService = (handler as any).gitService;
      const resetSpy = jest.spyOn(gitService, 'reset').mockResolvedValue(undefined);

      const options: UndoOptions = { staged: true };
      await handler.undoChanges(options);

      expect(resetSpy).toHaveBeenCalledWith();
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('unstaged');
    });

    test('should throw on git service error', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ confirmed: true } as any);
      jest.spyOn(gitService, 'reset').mockRejectedValue(new Error('git error'));

      const options: UndoOptions = { commit: true };
      await expect(handler.undoChanges(options)).rejects.toThrow('Failed to undo changes');
    });
  });

  describe('showHistory', () => {
    test('should warn when history is empty', async () => {
      const configManager = (handler as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue([]);

      const options: HistoryOptions = {};
      await handler.showHistory(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No message history');
    });

    test('should display history entries', async () => {
      const configManager = (handler as any).configManager;
      const mockHistory = [
        { message: 'feat: add login', type: 'feat', timestamp: '2024-01-01T10:00:00.000Z' },
        { message: 'fix: fix bug', type: 'fix', timestamp: '2024-01-02T10:00:00.000Z' }
      ];
      jest.spyOn(configManager, 'getConfig').mockReturnValue(mockHistory);

      const options: HistoryOptions = {};
      await handler.showHistory(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('feat: add login');
      expect(output).toContain('fix: fix bug');
    });

    test('should limit history by number option', async () => {
      const configManager = (handler as any).configManager;
      const mockHistory = [
        { message: 'commit 1', type: 'feat', timestamp: '2024-01-01T10:00:00.000Z' },
        { message: 'commit 2', type: 'fix', timestamp: '2024-01-02T10:00:00.000Z' },
        { message: 'commit 3', type: 'chore', timestamp: '2024-01-03T10:00:00.000Z' }
      ];
      jest.spyOn(configManager, 'getConfig').mockReturnValue(mockHistory);

      const options: HistoryOptions = { number: '2' };
      await handler.showHistory(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('commit 1');
      expect(output).toContain('commit 2');
      expect(output).not.toContain('commit 3');
    });

    test('should clear history when clear option is set and confirmed', async () => {
      const configManager = (handler as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue([]);
      const setConfigSpy = jest.spyOn(configManager, 'setConfigValue').mockReturnValue(undefined);
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ confirmed: true } as any);

      const options: HistoryOptions = { clear: true };
      await handler.showHistory(options);

      expect(setConfigSpy).toHaveBeenCalledWith('messageHistory', []);
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('history cleared');
    });

    test('should not clear history when user cancels', async () => {
      const configManager = (handler as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue([]);
      const setConfigSpy = jest.spyOn(configManager, 'setConfigValue').mockReturnValue(undefined);
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ confirmed: false } as any);

      const options: HistoryOptions = { clear: true };
      await handler.showHistory(options);

      expect(setConfigSpy).not.toHaveBeenCalled();
    });
  });

  describe('manageAliases', () => {
    test('should list aliases when options.list is true', async () => {
      const configManager = (handler as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue({
        myalias: 'gitgenius -t feat'
      });

      const options: AliasOptions = { list: true };
      await handler.manageAliases(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('myalias');
      expect(output).toContain('gitgenius -t feat');
    });

    test('should warn when no aliases exist', async () => {
      const configManager = (handler as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue({});

      const options: AliasOptions = { list: true };
      await handler.manageAliases(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No aliases');
    });

    test('should add an alias', async () => {
      const configManager = (handler as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue({});
      const setConfigSpy = jest.spyOn(configManager, 'setConfigValue').mockReturnValue(undefined);

      const options: AliasOptions = { add: 'myalias' };
      await handler.manageAliases(options, 'myalias', 'gitgenius -t feat');

      expect(setConfigSpy).toHaveBeenCalledWith('aliases', { myalias: 'gitgenius -t feat' });
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('myalias');
    });

    test('should remove an existing alias', async () => {
      const configManager = (handler as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue({ myalias: 'gitgenius -t feat' });
      const setConfigSpy = jest.spyOn(configManager, 'setConfigValue').mockReturnValue(undefined);

      const options: AliasOptions = { remove: 'myalias' };
      await handler.manageAliases(options, 'myalias');

      expect(setConfigSpy).toHaveBeenCalledWith('aliases', {});
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('removed');
    });

    test('should warn when removing non-existent alias', async () => {
      const configManager = (handler as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue({});

      const options: AliasOptions = { remove: 'nonexistent' };
      await handler.manageAliases(options, 'nonexistent');

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('not found');
    });

    test('should throw on error', async () => {
      const configManager = (handler as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockImplementation(() => {
        throw new Error('config error');
      });

      await expect(handler.manageAliases({ list: true })).rejects.toThrow('Failed to manage aliases');
    });
  });
});
