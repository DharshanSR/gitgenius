import { ConfigManager } from '../core/ConfigManager.js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private configManager: ConfigManager;
  private cache: Map<string, CacheEntry<any>> = new Map();

  constructor() {
    this.configManager = new ConfigManager();
    this.loadCache();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  set<T>(key: string, data: T, ttlMinutes: number = 60): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000 // Convert to milliseconds
    };

    this.cache.set(key, entry);
    this.saveCache();
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.saveCache();
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.saveCache();
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.saveCache();
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.saveCache();
  }

  // Cache commit messages for similar diffs
  cacheCommitMessage(diffHash: string, message: string, provider: string): void {
    const key = `commit:${provider}:${diffHash}`;
    this.set(key, message, 120); // Cache for 2 hours
  }

  getCachedCommitMessage(diffHash: string, provider: string): string | null {
    const key = `commit:${provider}:${diffHash}`;
    return this.get<string>(key);
  }

  // Cache AI responses for code reviews
  cacheReview(codeHash: string, review: string, provider: string): void {
    const key = `review:${provider}:${codeHash}`;
    this.set(key, review, 240); // Cache for 4 hours
  }

  getCachedReview(codeHash: string, provider: string): string | null {
    const key = `review:${provider}:${codeHash}`;
    return this.get<string>(key);
  }

  private loadCache(): void {
    try {
      const cacheData = this.configManager.getConfig('cache') || {};
      this.cache = new Map(Object.entries(cacheData));
    } catch (error) {
      // If cache loading fails, start with empty cache
      this.cache = new Map();
    }
  }

  private saveCache(): void {
    try {
      const cacheData = Object.fromEntries(this.cache.entries());
      this.configManager.setConfigValue('cache', cacheData);
    } catch (error) {
      // Silently fail if cache saving fails
    }
  }

  // Utility method to create hash from content
  static createHash(content: string): string {
    // Simple hash function for caching purposes
    let hash = 0;
    if (content.length === 0) return hash.toString();
    
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  // Get cache statistics
  getStats(): {
    size: number;
    hitRate: number;
    entries: { key: string; age: number; ttl: number }[];
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Math.floor((Date.now() - entry.timestamp) / 1000),
      ttl: Math.floor(entry.ttl / 1000)
    }));

    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for this
      entries
    };
  }
}
