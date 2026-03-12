import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { PullRequestHandler } from '../handlers/PullRequestHandler';
import type { PullRequestOptions } from '../types';
import inquirer from 'inquirer';

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

    test('should generate PR content when title or body not provided', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(gitService, 'ensureGitRepo').mockResolvedValue(undefined);
      jest.spyOn(gitService, 'getCurrentBranch').mockResolvedValue('feature/test');
      jest.spyOn(handler as any, 'getRemoteInfo').mockResolvedValue({
        platform: 'github',
        owner: 'testowner',
        repo: 'testrepo',
        url: 'https://github.com/testowner/testrepo'
      });
      jest.spyOn(handler as any, 'generatePRContent').mockResolvedValue({
        title: 'AI Generated Title',
        body: 'AI Generated Body'
      });
      jest.spyOn(handler as any, 'confirmPRContent').mockResolvedValue({
        title: 'AI Generated Title',
        body: 'AI Generated Body'
      });
      jest.spyOn(handler as any, 'createPlatformPR').mockResolvedValue(undefined);

      const options: PullRequestOptions = {};
      await handler.createPullRequest(options);

      expect((handler as any).generatePRContent).toHaveBeenCalled();
    });

    test('should use source and target options when provided', async () => {
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
        title: 'Custom PR',
        body: 'Custom body'
      });
      const createSpy = jest.spyOn(handler as any, 'createPlatformPR').mockResolvedValue(undefined);

      const options: PullRequestOptions = { title: 'Custom PR', body: 'Custom body', source: 'feature/a', target: 'develop' };
      await handler.createPullRequest(options);

      expect(createSpy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ source: 'feature/a', target: 'develop' })
      );
    });
  });

  describe('private methods', () => {
    describe('getRemoteInfo', () => {
      test('should parse GitHub SSH URL', async () => {
        const { execSync } = require('child_process');
        jest.spyOn(require('child_process'), 'execSync').mockReturnValue(
          'git@github.com:owner/repo.git\n' as any
        );

        const result = await (handler as any).getRemoteInfo();
        expect(result).not.toBeNull();
        expect(result.platform).toBe('github');
        expect(result.owner).toBe('owner');
        expect(result.repo).toBe('repo');
      });

      test('should parse GitHub HTTPS URL', async () => {
        jest.spyOn(require('child_process'), 'execSync').mockReturnValue(
          'https://github.com/owner/repo.git\n' as any
        );

        const result = await (handler as any).getRemoteInfo();
        expect(result).not.toBeNull();
        expect(result.platform).toBe('github');
      });

      test('should parse GitLab URL', async () => {
        jest.spyOn(require('child_process'), 'execSync').mockReturnValue(
          'git@gitlab.com:owner/repo.git\n' as any
        );

        const result = await (handler as any).getRemoteInfo();
        expect(result).not.toBeNull();
        expect(result.platform).toBe('gitlab');
      });

      test('should return null for unknown URL format', async () => {
        jest.spyOn(require('child_process'), 'execSync').mockReturnValue(
          'https://bitbucket.org/owner/repo.git\n' as any
        );

        const result = await (handler as any).getRemoteInfo();
        expect(result).toBeNull();
      });

      test('should return null when execSync throws', async () => {
        jest.spyOn(require('child_process'), 'execSync').mockImplementation(() => {
          throw new Error('git command failed');
        });

        const result = await (handler as any).getRemoteInfo();
        expect(result).toBeNull();
      });
    });

    describe('generatePRContent', () => {
      test('should return fallback content when git commands fail', async () => {
        jest.spyOn(require('child_process'), 'execSync').mockImplementation(() => {
          throw new Error('git error');
        });

        const result = await (handler as any).generatePRContent('feature/test', 'main');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('body');
        expect(result.title).toContain('feature/test');
      });
    });

    describe('confirmPRContent', () => {
      test('should return content as-is when user selects use', async () => {
        jest.spyOn(inquirer, 'prompt').mockResolvedValue({ action: 'use' } as any);

        const result = await (handler as any).confirmPRContent('Test Title', 'Test Body');
        expect(result.title).toBe('Test Title');
        expect(result.body).toBe('Test Body');
      });

      test('should return edited content when user selects edit', async () => {
        jest.spyOn(inquirer, 'prompt')
          .mockResolvedValueOnce({ action: 'edit' } as any)
          .mockResolvedValueOnce({ title: 'Edited Title', body: 'Edited Body' } as any);

        const result = await (handler as any).confirmPRContent('Original Title', 'Original Body');
        expect(result.title).toBe('Edited Title');
        expect(result.body).toBe('Edited Body');
      });
    });

    describe('createPlatformPR', () => {
      test('should throw for unsupported platform', async () => {
        const remoteInfo = { platform: 'bitbucket', owner: 'test', repo: 'repo', url: 'test' };
        const options = { source: 'feature', target: 'main', title: 'Test', body: 'Body' };

        await expect((handler as any).createPlatformPR(remoteInfo, options)).rejects.toThrow(
          'Unsupported platform'
        );
      });

      test('should call createGitHubPR for github platform', async () => {
        const remoteInfo = { platform: 'github', owner: 'test', repo: 'repo', url: 'test' };
        const options = { source: 'feature', target: 'main', title: 'Test', body: 'Body' };
        const githubSpy = jest.spyOn(handler as any, 'createGitHubPR').mockResolvedValue(undefined);

        await (handler as any).createPlatformPR(remoteInfo, options);
        expect(githubSpy).toHaveBeenCalledWith(remoteInfo, options);
      });

      test('should call createGitLabPR for gitlab platform', async () => {
        const remoteInfo = { platform: 'gitlab', owner: 'test', repo: 'repo', url: 'test' };
        const options = { source: 'feature', target: 'main', title: 'Test', body: 'Body' };
        const gitlabSpy = jest.spyOn(handler as any, 'createGitLabPR').mockResolvedValue(undefined);

        await (handler as any).createPlatformPR(remoteInfo, options);
        expect(gitlabSpy).toHaveBeenCalledWith(remoteInfo, options);
      });
    });

    describe('createGitHubPR', () => {
      test('should show alternative URL when gh CLI not found', async () => {
        jest.spyOn(require('child_process'), 'execSync').mockImplementation(() => {
          throw new Error('gh not found');
        });
        const remoteInfo = { platform: 'github', owner: 'testowner', repo: 'testrepo', url: 'test' };
        const options = { source: 'feature/test', target: 'main', title: 'Test', body: 'Body' };

        await (handler as any).createGitHubPR(remoteInfo, options);
        const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
        expect(output).toContain('GitHub CLI not found');
      });
    });

    describe('createGitLabPR', () => {
      test('should show alternative URL when glab CLI not found', async () => {
        jest.spyOn(require('child_process'), 'execSync').mockImplementation(() => {
          throw new Error('glab not found');
        });
        const remoteInfo = { platform: 'gitlab', owner: 'testowner', repo: 'testrepo', url: 'test' };
        const options = { source: 'feature/test', target: 'main', title: 'Test', body: 'Body' };

        await (handler as any).createGitLabPR(remoteInfo, options);
        const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
        expect(output).toContain('GitLab CLI not found');
      });
    });
  });
});
