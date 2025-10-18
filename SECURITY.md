# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | ✅                |
| < 1.0   | ❌                |

## Reporting a Vulnerability

If you discover a security vulnerability within GitGenius, please send an email to security@gitgenius.dev. All security vulnerabilities will be promptly addressed.

### Please do not:
- Report security vulnerabilities through public GitHub issues
- Disclose the vulnerability publicly until it has been addressed

### Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested remediation (if any)

## Security Measures

GitGenius implements comprehensive enterprise-grade security controls:

### 1. Transport Security
- **HTTPS Enforcement**: All API communications use HTTPS protocol exclusively
- **Certificate Validation**: SSL/TLS certificates are validated for all external connections
- **Secure Headers**: Security headers included in all API requests:
  - `Strict-Transport-Security`: HSTS with 1-year max-age
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`

### 2. Credential Security
- **Encrypted Storage**: API keys are encrypted using AES-256-GCM before storage
- **Key Derivation**: PBKDF2 with 100,000 iterations for key derivation
- **Secure Permissions**: Configuration files stored with restrictive permissions (0600)
- **Environment Variable Support**: API keys can be provided via environment variables
- **No Code Transmission**: Your code is never sent to external servers beyond AI providers
- **API Key Validation**: Format validation for all API keys before use

### 3. API Key Rotation
- **Automated Rotation Reminders**: Configurable rotation policies (default: 90 days)
- **Zero-Downtime Rotation**: Support for seamless key transitions
- **Rotation Tracking**: Automatic tracking of key age and rotation schedule
- **Audit Logging**: Security-sensitive operations are logged

### 4. Input Validation & Sanitization
- **Strict Input Validation**: All user inputs validated before processing
- **Control Character Removal**: Removal of null bytes and control characters
- **Length Limits**: Maximum input length enforcement (100KB default)
- **Injection Prevention**: Protection against:
  - Template injection
  - XSS attacks
  - JavaScript protocol injection
  - eval() injection attempts
- **Commit Message Validation**: Security validation for generated commit messages

### 5. Rate Limiting
- **Request Rate Limiting**: Configurable rate limits per minute (default: 60 requests/min)
- **Provider-Specific Limits**: Separate rate tracking for different AI providers
- **Automatic Cleanup**: Periodic cleanup of expired rate limit records

### 6. Access Control
- **Timeout Controls**: Configurable request timeouts (default: 30 seconds)
- **Retry Policies**: Maximum retry limits to prevent abuse
- **API Key Masking**: Sensitive data masked in logs and output

## Security Configuration

GitGenius provides configurable security settings:

```bash
# Security configuration is managed through the config system
gitgenius config security --help
```

### Default Security Settings

```javascript
{
  enforceHttps: true,              // Require HTTPS for all API calls
  verifyCertificates: true,        // Validate SSL/TLS certificates
  rateLimitEnabled: true,          // Enable rate limiting
  maxRequestsPerMinute: 60,        // Rate limit threshold
  apiKeyRotationEnabled: false,    // API key rotation reminders
  apiKeyRotationDays: 90,          // Rotation interval
  requestTimeout: 30000,           // Request timeout (ms)
  maxRetries: 3,                   // Maximum retry attempts
  strictInputValidation: true,     // Enable input sanitization
  maxInputLength: 100000,          // Maximum input size (bytes)
  auditLogEnabled: true,           // Enable audit logging
  logSensitiveData: false          // Mask sensitive data in logs
}
```

## Dependencies

We regularly update dependencies to address security vulnerabilities.

### Dependency Management
- Automated vulnerability scanning with `npm audit`
- Regular dependency updates
- Security patches applied promptly
- No dependencies with known critical vulnerabilities

Check for updates using:
```bash
npm audit
```

## Vulnerability Management

### Current Status
✅ All dependencies scanned and verified
✅ No high or critical vulnerabilities detected
✅ Low-severity vulnerabilities addressed

### Update Process
1. Monitor security advisories
2. Evaluate impact
3. Test updates in isolated environment
4. Deploy patches
5. Notify users if action required

## Best Practices for Users

### API Key Management
1. **Use Environment Variables**: Set API keys via environment variables when possible
   ```bash
   export GITGENIUS_API_KEY="your-api-key"
   export OPENAI_API_KEY="your-openai-key"
   export GEMINI_API_KEY="your-gemini-key"
   ```

2. **Rotate Keys Regularly**: Change API keys every 90 days
3. **Never Commit Keys**: Ensure API keys are never committed to version control
4. **Use Different Keys**: Use separate API keys for development and production
5. **Monitor Usage**: Regularly check API usage for anomalies

### Secure Configuration
1. **Restrict File Permissions**: Ensure config files have appropriate permissions
2. **Backup Configuration**: Regularly backup your encrypted configuration
3. **Validate Imports**: Always validate configuration when importing

### Network Security
1. **Use Secure Networks**: Avoid using public WiFi for API operations
2. **VPN Usage**: Consider using VPN for additional security
3. **Firewall Configuration**: Ensure appropriate firewall rules

## Compliance

GitGenius is designed to help meet security requirements for:
- **OWASP Top 10**: Protection against common web vulnerabilities
- **Data Protection**: Encrypted storage of sensitive data
- **Audit Requirements**: Comprehensive audit logging
- **Access Control**: Strict authentication and authorization

## Security Audit History

| Date       | Type                | Status | Notes                           |
|------------|---------------------|--------|---------------------------------|
| 2025-10-18 | Dependency Scan     | ✅     | All vulnerabilities resolved    |
| 2025-10-18 | Infrastructure      | ✅     | HTTPS enforcement implemented   |
| 2025-10-18 | Credential Security | ✅     | AES-256 encryption implemented  |
| 2025-10-18 | Input Validation    | ✅     | Comprehensive validation added  |
| 2025-10-18 | Rate Limiting       | ✅     | Rate limiting implemented       |

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days  
- **Resolution**: Varies based on complexity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: Next release

## Security Contact

For security-related questions or concerns:
- **Email**: security@gitgenius.dev
- **PGP Key**: Available on request
- **Response Time**: Within 48 hours

## Acknowledgments

We appreciate security researchers who responsibly disclose vulnerabilities. Contributors will be acknowledged in our security advisories (unless they prefer to remain anonymous).

Thank you for helping keep GitGenius secure!
