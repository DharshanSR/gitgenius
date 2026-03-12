import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { CacheManager } from '../utils/CacheManager';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let configManagerMock: any;

  beforeEach(() => {
    cacheManager = new CacheManager();
    // Access and mock the configManager
    configManagerMock = (cacheManager as any).configManager;
    jest.spyOn(configManagerMock, 'getConfig').mockReturnValue({});
    jest.spyOn(configManagerMock, 'setConfigValue').mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('set and get', () => {
    test('should store and retrieve a value', () => {
      jest.spyOn(configManagerMock, 'setConfigValue').mockReturnValue(undefined);
      cacheManager.set('test-key', 'test-value', 60);
      const result = cacheManager.get<string>('test-key');
      expect(result).toBe('test-value');
    });

    test('should return null for non-existent key', () => {
      const result = cacheManager.get<string>('nonexistent');
      expect(result).toBeNull();
    });

    test('should return null for expired entry', () => {
      jest.spyOn(configManagerMock, 'setConfigValue').mockReturnValue(undefined);
      // Set with 0 TTL to make it immediately expire
      cacheManager.set('expired-key', 'value', 0);

      // Mock Date.now to be far in the future
      const originalNow = Date.now;
      Date.now = jest.fn().mockReturnValue(originalNow() + 999999999);

      const result = cacheManager.get<string>('expired-key');
      expect(result).toBeNull();

      Date.now = originalNow;
    });

    test('should store different data types', () => {
      jest.spyOn(configManagerMock, 'setConfigValue').mockReturnValue(undefined);
      cacheManager.set('number-key', 42, 60);
      cacheManager.set('object-key', { foo: 'bar' }, 60);
      cacheManager.set('array-key', [1, 2, 3], 60);

      expect(cacheManager.get<number>('number-key')).toBe(42);
      expect(cacheManager.get<object>('object-key')).toEqual({ foo: 'bar' });
      expect(cacheManager.get<number[]>('array-key')).toEqual([1, 2, 3]);
    });

    test('should use default TTL of 60 minutes', () => {
      jest.spyOn(configManagerMock, 'setConfigValue').mockReturnValue(undefined);
      cacheManager.set('default-ttl', 'value');
      const entry = (cacheManager as any).cache.get('default-ttl');
      expect(entry.ttl).toBe(60 * 60 * 1000);
    });
  });

  describe('has', () => {
    test('should return true for existing key', () => {
      jest.spyOn(configManagerMock, 'setConfigValue').mockReturnValue(undefined);
      cacheManager.set('has-key', 'value', 60);
      expect(cacheManager.has('has-key')).toBe(true);
    });

    test('should return false for non-existent key', () => {
      expect(cacheManager.has('nonexistent')).toBe(false);
    });

    test('should return false for expired key', () => {
      jest.spyOn(configManagerMock, 'setConfigValue').mockReturnValue(undefined);
      cacheManager.set('expired-has', 'value', 0);

      const originalNow = Date.now;
      Date.now = jest.fn().mockReturnValue(originalNow() + 999999999);

      expect(cacheManager.has('expired-has')).toBe(false);

      Date.now = originalNow;
    });
  });

  describe('delete', () => {
    test('should delete an existing key', () => {
      jest.spyOn(configManagerMock, 'setConfigValue').mockReturnValue(undefined);
      cacheManager.set('delete-key', 'value', 60);
      const result = cacheManager.delete('delete-key');
      expect(result).toBe(true);
      expect(cacheManager.has('delete-key')).toBe(false);
    });

    test('should return false when deleting non-existent key', () => {
      const result = cacheManager.delete('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    test('should clear all cache entries', () => {
      jest.spyOn(configManagerMock, 'setConfigValue').mockReturnValue(undefined);
      cacheManager.set('key1', 'value1', 60);
      cacheManager.set('key2', 'value2', 60);

      cacheManager.clear();

      expect(cacheManager.has('key1')).toBe(false);
      expect(cacheManager.has('key2')).toBe(false);
    });
  });

  describe('cacheCommitMessage and getCachedCommitMessage', () => {
    test('should cache and retrieve commit message', () => {
      jest.spyOn(configManagerMock, 'setConfigValue').mockReturnValue(undefined);
      cacheManager.cacheCommitMessage('diff-hash-123', 'feat: add feature', 'openai');
      const cached = cacheManager.getCachedCommitMessage('diff-hash-123', 'openai');
      expect(cached).toBe('feat: add feature');
    });

    test('should return null for uncached message', () => {
      const result = cacheManager.getCachedCommitMessage('unknown-hash', 'openai');
      expect(result).toBeNull();
    });

    test('should distinguish between providers', () => {
      jest.spyOn(configManagerMock, 'setConfigValue').mockReturnValue(undefined);
      cacheManager.cacheCommitMessage('hash123', 'openai message', 'openai');
      cacheManager.cacheCommitMessage('hash123', 'gemini message', 'gemini');

      expect(cacheManager.getCachedCommitMessage('hash123', 'openai')).toBe('openai message');
      expect(cacheManager.getCachedCommitMessage('hash123', 'gemini')).toBe('gemini message');
    });
  });

  describe('cacheReview and getCachedReview', () => {
    test('should cache and retrieve code review', () => {
      jest.spyOn(configManagerMock, 'setConfigValue').mockReturnValue(undefined);
      cacheManager.cacheReview('code-hash-456', 'LGTM - looks good', 'openai');
      const cached = cacheManager.getCachedReview('code-hash-456', 'openai');
      expect(cached).toBe('LGTM - looks good');
    });

    test('should return null for uncached review', () => {
      const result = cacheManager.getCachedReview('unknown-hash', 'openai');
      expect(result).toBeNull();
    });
  });

  describe('CacheManager.createHash (static)', () => {
    test('should create a hash from a string', () => {
      const hash = CacheManager.createHash('some content');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    test('should return consistent hash for same input', () => {
      const hash1 = CacheManager.createHash('test content');
      const hash2 = CacheManager.createHash('test content');
      expect(hash1).toBe(hash2);
    });

    test('should return different hashes for different inputs', () => {
      const hash1 = CacheManager.createHash('content A');
      const hash2 = CacheManager.createHash('content B');
      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty string', () => {
      const hash = CacheManager.createHash('');
      expect(typeof hash).toBe('string');
    });
  });

  describe('getInstance (singleton)', () => {
    test('should return the same instance', () => {
      const instance1 = CacheManager.getInstance();
      const instance2 = CacheManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getStats', () => {
    test('should return cache statistics', () => {
      jest.spyOn(configManagerMock, 'setConfigValue').mockReturnValue(undefined);
      cacheManager.set('stat-key', 'value', 60);

      const stats = cacheManager.getStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('entries');
      expect(stats.size).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(stats.entries)).toBe(true);
    });

    test('should include entry details in stats', () => {
      jest.spyOn(configManagerMock, 'setConfigValue').mockReturnValue(undefined);
      cacheManager.set('detail-key', 'value', 60);

      const stats = cacheManager.getStats();
      const entry = stats.entries.find(e => e.key === 'detail-key');
      expect(entry).toBeDefined();
      expect(entry).toHaveProperty('age');
      expect(entry).toHaveProperty('ttl');
    });
  });
});
