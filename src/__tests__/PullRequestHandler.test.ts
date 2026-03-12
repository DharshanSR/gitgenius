import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { PullRequestHandler } from '../handlers/PullRequestHandler';
import type { PullRequestOptions } from '../types';

describe('PullRequestHandler', () => {
  let handler: PullRequestHandler;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    handler = new PullRequestHandler();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('createPullRequest', () => {
    test('should throw when not in a git repo', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(gitService, 'ensureGitRepo').mockRejectedValue(new Error('Not in a git repository'));

      const options: PullRequestOptions = { title: 'Test PR' };
      await expect(handler.createPullRequest(options)).rejects.toThrow('Failed to create PR');
    });

    test('should warn when no remote origin found', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(gitService, 'ensureGitRepo').mockResolvedValue(undefined);
      jest.spyOn(gitService, 'getCurrentBranch').mockResolvedValue('feature/test');
      // Mock getRemoteInfo to return null (no remote)
      jest.spyOn(handler as any, 'getRemoteInfo').mockResolvedValue(null);

      const options: PullRequestOptions = { title: 'Test PR', body: 'Test body' };
      await handler.createPullRequest(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No remote repository');
    });

    test('should create PR with provided title and body', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(gitService, 'ensureGitRepo').mockResolvedValue(undefined);
      jest.spyOn(gitService, 'getCurrentBranch').mockResolvedValue('feature/test');
      jest.spyOn(handler as any, 'getRemoteInfo').mockResolvedValue({
        platform: 'github',
        owner: 'testowner',
        repo: 'testrepo',
        url: 'https://github.com/testowner/testrepo'
      });
      jest.spyOn(handler as any, 'confirmPRContent').mockResolvedValue({
        title: 'Test PR',
        body: 'Test body'
      });
      jest.spyOn(handler as any, 'createPlatformPR').mockResolvedValue(undefined);

      const options: PullRequestOptions = { title: 'Test PR', body: 'Test body' };
      await handler.createPullRequest(options);

      expect((handler as any).createPlatformPR).toHaveBeenCalled();
    });
  });
});
