import { describe, test, expect, beforeEach } from '@jest/globals';
import { SecurityUtils } from '../utils/SecurityUtils';
import { SecurityManager, DEFAULT_SECURITY_CONFIG } from '../core/SecurityConfig';

describe('SecurityUtils', () => {
  describe('validateSecureUrl', () => {
    test('should validate HTTPS URLs', () => {
      expect(SecurityUtils.validateSecureUrl('https://api.openai.com')).toBe(true);
      expect(SecurityUtils.validateSecureUrl('https://example.com/path')).toBe(true);
    });

    test('should reject HTTP URLs', () => {
      expect(SecurityUtils.validateSecureUrl('http://api.openai.com')).toBe(false);
      expect(SecurityUtils.validateSecureUrl('http://example.com')).toBe(false);
    });

    test('should reject invalid URLs', () => {
      expect(SecurityUtils.validateSecureUrl('not-a-url')).toBe(false);
      expect(SecurityUtils.validateSecureUrl('')).toBe(false);
    });
  });

  describe('enforceHttps', () => {
    test('should allow HTTPS URLs', () => {
      const url = 'https://api.openai.com';
      expect(SecurityUtils.enforceHttps(url)).toBe(url);
    });

    test('should throw error for HTTP URLs', () => {
      expect(() => SecurityUtils.enforceHttps('http://api.openai.com'))
        .toThrow('Insecure protocol detected');
    });
  });

  describe('sanitizeInput', () => {
    test('should remove null bytes', () => {
      const input = 'test\0data';
      expect(SecurityUtils.sanitizeInput(input)).toBe('testdata');
    });

    test('should remove control characters except newlines and tabs', () => {
      const input = 'test\x01\x02data\nwith\tnewline';
      const result = SecurityUtils.sanitizeInput(input);
      expect(result).toBe('testdata\nwith\tnewline');
    });

    test('should throw error for non-string input', () => {
      expect(() => SecurityUtils.sanitizeInput(123 as any))
        .toThrow('Input must be a string');
    });

    test('should throw error for oversized input', () => {
      const largeInput = 'a'.repeat(100001);
      expect(() => SecurityUtils.sanitizeInput(largeInput))
        .toThrow('Input exceeds maximum allowed length');
    });
  });

  describe('validateApiKey', () => {
    test('should validate proper API keys', () => {
      expect(SecurityUtils.validateApiKey('sk-1234567890abcdefghij')).toBe(true);
      expect(SecurityUtils.validateApiKey('a'.repeat(50))).toBe(true);
    });

    test('should reject short API keys', () => {
      expect(SecurityUtils.validateApiKey('short')).toBe(false);
      expect(SecurityUtils.validateApiKey('12345')).toBe(false);
    });

    test('should reject non-string API keys', () => {
      expect(SecurityUtils.validateApiKey(null as any)).toBe(false);
      expect(SecurityUtils.validateApiKey(undefined as any)).toBe(false);
      expect(SecurityUtils.validateApiKey(12345 as any)).toBe(false);
    });

    test('should reject API keys with non-printable characters', () => {
      expect(SecurityUtils.validateApiKey('sk-1234567890\x00abcdefghij')).toBe(false);
    });
  });

  describe('encryption and decryption', () => {
    const password = 'test-password-12345';
    const data = 'sensitive-api-key-sk-1234567890';

    test('should encrypt and decrypt data successfully', () => {
      const encrypted = SecurityUtils.encrypt(data, password);
      expect(encrypted).not.toBe(data);
      expect(encrypted).toContain(':'); // Should have parts separated by colons

      const decrypted = SecurityUtils.decrypt(encrypted, password);
      expect(decrypted).toBe(data);
    });

    test('should produce different encrypted values for same input', () => {
      const encrypted1 = SecurityUtils.encrypt(data, password);
      const encrypted2 = SecurityUtils.encrypt(data, password);
      expect(encrypted1).not.toBe(encrypted2);
    });

    test('should throw error for invalid encrypted data format', () => {
      expect(() => SecurityUtils.decrypt('invalid-format', password))
        .toThrow('Invalid encrypted data format');
    });

    test('should throw error for wrong password', () => {
      const encrypted = SecurityUtils.encrypt(data, password);
      expect(() => SecurityUtils.decrypt(encrypted, 'wrong-password'))
        .toThrow();
    });
  });

  describe('validateCommitMessage', () => {
    test('should validate clean commit messages', () => {
      expect(SecurityUtils.validateCommitMessage('feat: add new feature')).toBe(true);
      expect(SecurityUtils.validateCommitMessage('fix: resolve bug\n\nDetails here')).toBe(true);
    });

    test('should reject messages with template injection attempts', () => {
      expect(SecurityUtils.validateCommitMessage('feat: add ${injection}')).toBe(false);
    });

    test('should reject messages with XSS attempts', () => {
      expect(SecurityUtils.validateCommitMessage('feat: add <script>alert(1)</script>')).toBe(false);
      expect(SecurityUtils.validateCommitMessage('feat: add <SCRIPT>alert(1)</SCRIPT>')).toBe(false);
    });

    test('should reject messages with JavaScript protocol', () => {
      expect(SecurityUtils.validateCommitMessage('feat: javascript:alert(1)')).toBe(false);
    });

    test('should reject messages with eval attempts', () => {
      expect(SecurityUtils.validateCommitMessage('feat: eval(code)')).toBe(false);
    });

    test('should reject empty or invalid messages', () => {
      expect(SecurityUtils.validateCommitMessage('')).toBe(false);
      expect(SecurityUtils.validateCommitMessage(null as any)).toBe(false);
      expect(SecurityUtils.validateCommitMessage('a'.repeat(10001))).toBe(false);
    });
  });

  describe('checkRateLimit', () => {
    beforeEach(() => {
      SecurityUtils.cleanupRateLimits();
    });

    test('should allow requests within limit', () => {
      expect(SecurityUtils.checkRateLimit('test', 5, 60000)).toBe(true);
      expect(SecurityUtils.checkRateLimit('test', 5, 60000)).toBe(true);
      expect(SecurityUtils.checkRateLimit('test', 5, 60000)).toBe(true);
    });

    test('should reject requests exceeding limit', () => {
      for (let i = 0; i < 5; i++) {
        expect(SecurityUtils.checkRateLimit('test2', 5, 60000)).toBe(true);
      }
      expect(SecurityUtils.checkRateLimit('test2', 5, 60000)).toBe(false);
    });

    test('should reset after window expires', (done) => {
      for (let i = 0; i < 3; i++) {
        SecurityUtils.checkRateLimit('test3', 3, 100);
      }
      
      setTimeout(() => {
        expect(SecurityUtils.checkRateLimit('test3', 3, 100)).toBe(true);
        done();
      }, 150);
    }, 300);
  });

  describe('getSecureHeaders', () => {
    test('should return basic security headers', () => {
      const headers = SecurityUtils.getSecureHeaders();
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
    });

    test('should include Authorization header when API key provided', () => {
      const headers = SecurityUtils.getSecureHeaders('test-api-key');
      expect(headers['Authorization']).toBe('Bearer test-api-key');
    });
  });

  describe('maskSensitiveData', () => {
    test('should mask sensitive data keeping start and end visible', () => {
      const masked = SecurityUtils.maskSensitiveData('sk-1234567890abcdefghij', 4);
      expect(masked).toBe('sk-1***************ghij');
      expect(masked.length).toBe('sk-1234567890abcdefghij'.length);
    });

    test('should mask short data completely', () => {
      expect(SecurityUtils.maskSensitiveData('short')).toBe('***');
      expect(SecurityUtils.maskSensitiveData('test')).toBe('***');
    });

    test('should handle empty data', () => {
      expect(SecurityUtils.maskSensitiveData('')).toBe('***');
    });
  });

  describe('hash', () => {
    test('should create consistent hashes', () => {
      const data = 'test-data';
      const hash1 = SecurityUtils.hash(data);
      const hash2 = SecurityUtils.hash(data);
      expect(hash1).toBe(hash2);
    });

    test('should create different hashes for different data', () => {
      const hash1 = SecurityUtils.hash('data1');
      const hash2 = SecurityUtils.hash('data2');
      expect(hash1).not.toBe(hash2);
    });
  });
});

describe('SecurityManager', () => {
  let securityManager: SecurityManager;

  beforeEach(() => {
    securityManager = new SecurityManager();
    SecurityUtils.cleanupRateLimits();
  });

  describe('validateUrl', () => {
    test('should validate HTTPS URLs', () => {
      expect(() => securityManager.validateUrl('https://api.openai.com'))
        .not.toThrow();
    });

    test('should reject HTTP URLs when HTTPS is enforced', () => {
      expect(() => securityManager.validateUrl('http://api.openai.com'))
        .toThrow('HTTPS is required');
    });

    test('should allow HTTP URLs when HTTPS is not enforced', () => {
      const manager = new SecurityManager({ enforceHttps: false });
      expect(() => manager.validateUrl('http://api.openai.com'))
        .not.toThrow();
    });
  });

  describe('checkRateLimit', () => {
    beforeEach(() => {
      SecurityUtils.cleanupRateLimits();
    });

    test('should enforce rate limits when enabled', () => {
      SecurityUtils.cleanupRateLimits(); // Clean immediately before test
      const manager = new SecurityManager({ 
        rateLimitEnabled: true, 
        maxRequestsPerMinute: 3 
      });

      expect(manager.checkRateLimit('unique-test-key-123')).toBe(true);
      expect(manager.checkRateLimit('unique-test-key-123')).toBe(true);
      expect(manager.checkRateLimit('unique-test-key-123')).toBe(true);
      expect(manager.checkRateLimit('unique-test-key-123')).toBe(false);
    });

    test('should not enforce rate limits when disabled', () => {
      const manager = new SecurityManager({ rateLimitEnabled: false });

      for (let i = 0; i < 100; i++) {
        expect(manager.checkRateLimit('test')).toBe(true);
      }
    });
  });

  describe('sanitizeInput', () => {
    test('should sanitize input when strict validation enabled', () => {
      const input = 'test\0data';
      const sanitized = securityManager.sanitizeInput(input);
      expect(sanitized).toBe('testdata');
    });

    test('should throw on oversized input when strict validation enabled', () => {
      const manager = new SecurityManager({ 
        strictInputValidation: true,
        maxInputLength: 100 
      });
      
      const largeInput = 'a'.repeat(101);
      expect(() => manager.sanitizeInput(largeInput))
        .toThrow('Input exceeds maximum length');
    });
  });

  describe('getSecureRequestConfig', () => {
    test('should return secure request configuration', () => {
      const config = securityManager.getSecureRequestConfig('test-api-key');
      
      expect(config.timeout).toBe(DEFAULT_SECURITY_CONFIG.requestTimeout);
      expect(config.headers['Authorization']).toBe('Bearer test-api-key');
      expect(config.headers['Strict-Transport-Security']).toBeDefined();
    });

    test('should include HTTPS agent when certificate verification enabled', () => {
      const config = securityManager.getSecureRequestConfig();
      expect(config.httpsAgent).toBeDefined();
      expect(config.httpsAgent.rejectUnauthorized).toBe(true);
    });
  });

  describe('updateConfig', () => {
    test('should update security configuration', () => {
      securityManager.updateConfig({ enforceHttps: false });
      const config = securityManager.getConfig();
      expect(config.enforceHttps).toBe(false);
    });

    test('should preserve unchanged values', () => {
      const originalTimeout = securityManager.getConfig().requestTimeout;
      securityManager.updateConfig({ enforceHttps: false });
      expect(securityManager.getConfig().requestTimeout).toBe(originalTimeout);
    });
  });
});
