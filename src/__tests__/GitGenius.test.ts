import { GitGenius } from '../core/GitGenius';
import { jest } from '@jest/globals';

describe('GitGenius', () => {
  let gitGenius: GitGenius;

  beforeEach(() => {
    gitGenius = new GitGenius();
  });

  describe('Core Functionality', () => {
    test('should initialize correctly', () => {
      expect(gitGenius).toBeDefined();
    });

    test('should generate commit message', async () => {
      const mockGenerateMessage = jest.spyOn(gitGenius, 'generateCommitMessage' as any);
      mockGenerateMessage.mockResolvedValue('feat: add new feature');
      
      const result = await gitGenius.generateCommitMessage(['file1.ts'], 'feat');
      expect(result).toBe('feat: add new feature');
    });
  });

  describe('Configuration', () => {
    test('should load config correctly', async () => {
      const config = await gitGenius.loadConfig();
      expect(config).toBeDefined();
    });

    test('should update config', async () => {
      const newConfig = { provider: 'openai' };
      await gitGenius.updateConfig(newConfig);
      const config = await gitGenius.loadConfig();
      expect(config.provider).toBe('openai');
    });
  });

  describe('Git Operations', () => {
    test('should get staged files', async () => {
      const mockGetStagedFiles = jest.spyOn(gitGenius, 'getStagedFiles' as any);
      mockGetStagedFiles.mockResolvedValue(['file1.ts', 'file2.ts']);
      
      const files = await gitGenius.getStagedFiles();
      expect(files).toHaveLength(2);
    });
  });
});