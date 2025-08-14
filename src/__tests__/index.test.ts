import { describe, test, expect } from '@jest/globals';

describe('GitGenius Core', () => {
  test('should export main classes', async () => {
    const { GitGenius, ConfigManager, BranchManager } = await import('../index.js');
    
    expect(GitGenius).toBeDefined();
    expect(ConfigManager).toBeDefined();
    expect(BranchManager).toBeDefined();
  });

  test('should have correct version', () => {
    const packageJson = require('../../package.json');
    expect(packageJson.version).toBe('1.0.0');
    expect(packageJson.name).toBe('gitgenius');
  });

  test('should have required dependencies', () => {
    const packageJson = require('../../package.json');
    const requiredDeps = ['commander', 'inquirer', 'chalk', 'simple-git', 'axios'];
    
    requiredDeps.forEach(dep => {
      expect(packageJson.dependencies).toHaveProperty(dep);
    });
  });
});
