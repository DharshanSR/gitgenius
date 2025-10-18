import { SecurityUtils } from '../utils/SecurityUtils';

/**
 * Security configuration and policies
 */
export interface SecurityConfig {
  // HTTPS enforcement
  enforceHttps: boolean;
  verifyCertificates: boolean;
  
  // Rate limiting
  rateLimitEnabled: boolean;
  maxRequestsPerMinute: number;
  
  // API key management
  apiKeyRotationEnabled: boolean;
  apiKeyRotationDays: number;
  
  // Request timeouts (in milliseconds)
  requestTimeout: number;
  maxRetries: number;
  
  // Input validation
  strictInputValidation: boolean;
  maxInputLength: number;
  
  // Logging
  auditLogEnabled: boolean;
  logSensitiveData: boolean;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enforceHttps: true,
  verifyCertificates: true,
  
  rateLimitEnabled: true,
  maxRequestsPerMinute: 60,
  
  apiKeyRotationEnabled: false,
  apiKeyRotationDays: 90,
  
  requestTimeout: 30000, // 30 seconds
  maxRetries: 3,
  
  strictInputValidation: true,
  maxInputLength: 100000,
  
  auditLogEnabled: true,
  logSensitiveData: false
};

/**
 * API Key rotation manager
 */
export class ApiKeyRotationManager {
  private rotationSchedule = new Map<string, Date>();
  
  /**
   * Check if API key needs rotation
   */
  shouldRotate(keyId: string, rotationDays: number): boolean {
    const lastRotation = this.rotationSchedule.get(keyId);
    if (!lastRotation) {
      // No rotation recorded, should rotate
      return true;
    }
    
    const daysSinceRotation = (Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceRotation >= rotationDays;
  }
  
  /**
   * Record API key rotation
   */
  recordRotation(keyId: string): void {
    this.rotationSchedule.set(keyId, new Date());
  }
  
  /**
   * Get days until next rotation
   */
  getDaysUntilRotation(keyId: string, rotationDays: number): number {
    const lastRotation = this.rotationSchedule.get(keyId);
    if (!lastRotation) {
      return 0;
    }
    
    const daysSinceRotation = (Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(rotationDays - daysSinceRotation));
  }
  
  /**
   * Generate rotation reminder message
   */
  getRotationReminder(keyId: string, rotationDays: number): string | null {
    const daysUntil = this.getDaysUntilRotation(keyId, rotationDays);
    
    if (daysUntil === 0) {
      return '⚠️  API key rotation is due. Please rotate your API key.';
    } else if (daysUntil <= 7) {
      return `⚠️  API key rotation is due in ${daysUntil} days.`;
    }
    
    return null;
  }
}

/**
 * Security manager for GitGenius
 */
export class SecurityManager {
  private config: SecurityConfig;
  private rotationManager: ApiKeyRotationManager;
  
  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
    this.rotationManager = new ApiKeyRotationManager();
  }
  
  /**
   * Validate URL and enforce HTTPS
   */
  validateUrl(url: string): void {
    if (this.config.enforceHttps && !SecurityUtils.validateSecureUrl(url)) {
      throw new Error('HTTPS is required for all API communications');
    }
  }
  
  /**
   * Check if request should be rate limited
   */
  checkRateLimit(identifier: string): boolean {
    if (!this.config.rateLimitEnabled) {
      return true;
    }
    
    const windowMs = 60000; // 1 minute
    return SecurityUtils.checkRateLimit(
      identifier,
      this.config.maxRequestsPerMinute,
      windowMs
    );
  }
  
  /**
   * Get secure request configuration
   */
  getSecureRequestConfig(apiKey?: string): {
    timeout: number;
    headers: Record<string, string>;
    httpsAgent?: any;
  } {
    const config: any = {
      timeout: this.config.requestTimeout,
      headers: SecurityUtils.getSecureHeaders(apiKey)
    };
    
    // Add HTTPS agent with certificate verification
    if (this.config.verifyCertificates) {
      // Certificate verification is enabled by default in axios
      // We just need to ensure rejectUnauthorized is not set to false
      config.httpsAgent = { rejectUnauthorized: true };
    }
    
    return config;
  }
  
  /**
   * Validate and sanitize input
   */
  sanitizeInput(input: string): string {
    if (this.config.strictInputValidation) {
      if (input.length > this.config.maxInputLength) {
        throw new Error(`Input exceeds maximum length of ${this.config.maxInputLength}`);
      }
      return SecurityUtils.sanitizeInput(input);
    }
    return input;
  }
  
  /**
   * Check API key rotation status
   */
  checkApiKeyRotation(keyId: string): string | null {
    if (!this.config.apiKeyRotationEnabled) {
      return null;
    }
    
    return this.rotationManager.getRotationReminder(keyId, this.config.apiKeyRotationDays);
  }
  
  /**
   * Record API key rotation
   */
  recordApiKeyRotation(keyId: string): void {
    this.rotationManager.recordRotation(keyId);
  }
  
  /**
   * Get security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }
  
  /**
   * Update security configuration
   */
  updateConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates };
  }
  
  /**
   * Audit log for security-sensitive operations
   */
  auditLog(operation: string, details: Record<string, any>): void {
    if (!this.config.auditLogEnabled) {
      return;
    }
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      details: this.config.logSensitiveData 
        ? details 
        : this.maskSensitiveDetails(details)
    };
    
    // In a production environment, this would write to a secure log file or service
    console.log('[AUDIT]', JSON.stringify(logEntry));
  }
  
  /**
   * Mask sensitive details in audit logs
   */
  private maskSensitiveDetails(details: Record<string, any>): Record<string, any> {
    const masked: Record<string, any> = {};
    const sensitiveKeys = ['apiKey', 'token', 'password', 'secret', 'authorization'];
    
    for (const [key, value] of Object.entries(details)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        masked[key] = typeof value === 'string' 
          ? SecurityUtils.maskSensitiveData(value) 
          : '***';
      } else {
        masked[key] = value;
      }
    }
    
    return masked;
  }
}
