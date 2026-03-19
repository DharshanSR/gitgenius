import crypto from 'crypto';
import { URL } from 'url';

/**
 * Security utilities for input validation, sanitization, and encryption
 */
export class SecurityUtils {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly SALT_LENGTH = 16;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;
  private static readonly KEY_LENGTH = 32;
  
  /**
   * Validate and enforce HTTPS URLs
   */
  static validateSecureUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      return url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Enforce HTTPS for API endpoints
   */
  static enforceHttps(urlString: string): string {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') {
      throw new Error(`Insecure protocol detected. HTTPS is required for all API communications. URL: ${url.protocol}//${url.host}`);
    }
    return urlString;
  }

  /**
   * Sanitize input to prevent injection attacks
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }
    
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');
    
    // Remove control characters except newlines and tabs
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    
    // Limit length to prevent DoS
    const MAX_LENGTH = 100000; // 100KB
    if (sanitized.length > MAX_LENGTH) {
      throw new Error(`Input exceeds maximum allowed length of ${MAX_LENGTH} characters`);
    }
    
    return sanitized;
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // Check minimum length
    if (apiKey.length < 20) {
      return false;
    }
    
    // Check for printable ASCII characters only
    const printableAscii = /^[\x20-\x7E]+$/;
    return printableAscii.test(apiKey);
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(text: string, masterPassword: string): string {
    // Generate a key from the master password
    const salt = crypto.randomBytes(SecurityUtils.SALT_LENGTH);
    const key = crypto.pbkdf2Sync(
      masterPassword,
      salt,
      100000,
      SecurityUtils.KEY_LENGTH,
      'sha256'
    );
    
    // Generate IV
    const iv = crypto.randomBytes(SecurityUtils.IV_LENGTH);
    
    // Encrypt
    const cipher = crypto.createCipheriv(SecurityUtils.ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag
    const tag = cipher.getAuthTag();
    
    // Combine salt + iv + tag + encrypted
    return salt.toString('hex') + 
           ':' + iv.toString('hex') + 
           ':' + tag.toString('hex') + 
           ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string, masterPassword: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];
    
    // Derive key from password
    const key = crypto.pbkdf2Sync(
      masterPassword,
      salt,
      100000,
      SecurityUtils.KEY_LENGTH,
      'sha256'
    );
    
    // Decrypt
    const decipher = crypto.createDecipheriv(SecurityUtils.ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate a secure random token for API key rotation
   */
  static generateRotationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash sensitive data for comparison (one-way)
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Validate commit message to prevent injection
   */
  static validateCommitMessage(message: string): boolean {
    if (!message || typeof message !== 'string') {
      return false;
    }
    
    // Check length
    if (message.length === 0 || message.length > 10000) {
      return false;
    }
    
    // Check for suspicious patterns that might indicate injection attempts
    const suspiciousPatterns = [
      /\$\{.*\}/,           // Template injection
      /<script/i,           // XSS attempts
      /javascript:/i,       // JavaScript protocol
      /on\w+\s*=/i,        // Event handlers
      /eval\s*\(/i,        // eval() calls
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Rate limiting helper - track requests
   */
  private static requestCounts = new Map<string, { count: number; resetTime: number }>();

  /**
   * Check rate limit for a given key
   */
  static checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const record = SecurityUtils.requestCounts.get(key);
    
    if (!record || now > record.resetTime) {
      // New window
      SecurityUtils.requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    if (record.count >= maxRequests) {
      return false;
    }
    
    record.count++;
    return true;
  }

  /**
   * Clean up old rate limit records
   */
  static cleanupRateLimits(): void {
    const now = Date.now();
    for (const [key, record] of SecurityUtils.requestCounts.entries()) {
      if (now > record.resetTime) {
        SecurityUtils.requestCounts.delete(key);
      }
    }
  }

  /**
   * Generate secure headers for API requests
   */
  static getSecureHeaders(apiKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'User-Agent': 'GitGenius/1.2.0'
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    return headers;
  }

  /**
   * Validate environment variable name to prevent injection
   */
  static validateEnvVarName(name: string): boolean {
    // Only allow alphanumeric and underscore
    return /^[A-Z_][A-Z0-9_]*$/.test(name);
  }

  /**
   * Sanitize file path to prevent directory traversal
   */
  static sanitizePath(path: string): string {
    // Remove any attempts at directory traversal
    // eslint-disable-next-line no-useless-escape
    const sanitized = path.replace(/\.\./g, '').replace(/[\/\\]+/g, '/');
    
    // Check for suspicious patterns
    if (sanitized.includes('~') || sanitized.startsWith('/')) {
      throw new Error('Invalid path: absolute paths and home directory references are not allowed');
    }
    
    return sanitized;
  }

  /**
   * Mask sensitive data for logging
   */
  static maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (!data || data.length <= visibleChars * 2) {
      return '***';
    }
    
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    return `${start}${'*'.repeat(data.length - visibleChars * 2)}${end}`;
  }
}
