import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { BranchManager } from '../core/BranchManager';
import type { BranchOptions } from '../types';
import inquirer from 'inquirer';

describe('BranchManager', () => {
  let branchManager: BranchManager;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    branchManager = new BranchManager();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('handleBranches', () => {
    test('should list branches when no delete option', async () => {
      const listSpy = jest.spyOn(branchManager, 'listBranches').mockResolvedValue(undefined);
      const options: BranchOptions = {};
      await branchManager.handleBranches(options);
      expect(listSpy).toHaveBeenCalledWith(options);
    });

    test('should call deleteBranches when delete option is set', async () => {
      const deleteSpy = jest.spyOn(branchManager as any, 'deleteBranches').mockResolvedValue(undefined);
      const options: BranchOptions = { delete: true };
      await branchManager.handleBranches(options);
      expect(deleteSpy).toHaveBeenCalledWith(undefined);
    });

    test('should pass force flag to deleteBranches', async () => {
      const deleteSpy = jest.spyOn(branchManager as any, 'deleteBranches').mockResolvedValue(undefined);
      const options: BranchOptions = { delete: true, force: true };
      await branchManager.handleBranches(options);
      expect(deleteSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('listBranches', () => {
    test('should show warning when no branches found', async () => {
      jest.spyOn(branchManager as any, 'getBranches').mockResolvedValue([]);

      const options: BranchOptions = {};
      await branchManager.listBranches(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No branches found');
    });

    test('should list branches', async () => {
      jest.spyOn(branchManager as any, 'getBranches').mockResolvedValue([
        { name: 'main', current: true, commit: 'abc123', label: '' },
        { name: 'feature/test', current: false, commit: 'def456', label: '' }
      ]);

      const options: BranchOptions = {};
      await branchManager.listBranches(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('branches');
    });

    test('should copy selected branch to clipboard', async () => {
      jest.spyOn(branchManager as any, 'getBranches').mockResolvedValue([
        { name: 'main', current: true, commit: 'abc123', label: '' }
      ]);
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ selectedBranch: 'main' } as any);
      const clipboardy = await import('clipboardy');
      const writeSpy = jest.spyOn(clipboardy, 'write').mockResolvedValue(undefined);

      const options: BranchOptions = { copy: true };
      await branchManager.listBranches(options);

      expect(writeSpy).toHaveBeenCalledWith('main');
    });

    test('should throw on git error', async () => {
      jest.spyOn(branchManager as any, 'getBranches').mockRejectedValue(new Error('git error'));

      await expect(branchManager.listBranches({})).rejects.toThrow('Failed to list branches');
    });
  });

  describe('interactiveCheckout', () => {
    test('should cancel when in detached HEAD state and user declines', async () => {
      const stateManager = (branchManager as any).stateManager;
      jest.spyOn(stateManager, 'isDetachedHead').mockResolvedValue(true);
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ proceed: false } as any);

      await branchManager.interactiveCheckout();

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('cancelled');
    });

    test('should warn when no branches available', async () => {
      const stateManager = (branchManager as any).stateManager;
      jest.spyOn(stateManager, 'isDetachedHead').mockResolvedValue(false);
      jest.spyOn(stateManager, 'getState').mockResolvedValue({ hasUncommittedChanges: false } as any);
      jest.spyOn(branchManager as any, 'getBranches').mockResolvedValue([]);

      await branchManager.interactiveCheckout();

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No branches available');
    });

    test('should checkout selected branch', async () => {
      const stateManager = (branchManager as any).stateManager;
      const git = (branchManager as any).git;
      jest.spyOn(stateManager, 'isDetachedHead').mockResolvedValue(false);
      jest.spyOn(stateManager, 'getState').mockResolvedValue({ hasUncommittedChanges: false } as any);
      jest.spyOn(branchManager as any, 'getBranches').mockResolvedValue([
        { name: 'main', current: false, commit: 'abc123', label: '' },
        { name: 'feature/test', current: false, commit: 'def456', label: '' }
      ]);
      jest.spyOn(branchManager as any, 'getCurrentBranch').mockResolvedValue('main');
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ selectedBranch: 'feature/test' } as any);
      const checkoutSpy = jest.spyOn(git, 'checkout').mockResolvedValue(undefined);

      await branchManager.interactiveCheckout();

      expect(checkoutSpy).toHaveBeenCalledWith('feature/test');
    });
  });
});
