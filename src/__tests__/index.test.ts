import { describe, test, expect } from '@jest/globals';

describe('GitGenius Core', () => {
  test('should have correct package configuration', () => {
    const packageJson = require('../../package.json');
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic version format
    expect(packageJson.name).toBe('@dharshansr/gitgenius');
  });

  test('should have required dependencies', () => {
    const packageJson = require('../../package.json');
    const requiredDeps = ['commander', 'inquirer', 'chalk', 'simple-git', 'axios'];
    
    requiredDeps.forEach(dep => {
      expect(packageJson.dependencies).toHaveProperty(dep);
    });
  });

  test('should have correct main entry point', () => {
    const packageJson = require('../../package.json');
    expect(packageJson.main).toBe('dist/index.js');
    expect(packageJson.bin).toHaveProperty('gitgenius');
    expect(packageJson.bin).toHaveProperty('gg');
  });
});
