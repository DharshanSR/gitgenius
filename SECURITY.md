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

GitGenius implements several security measures:

- **Local API Key Storage**: API keys are encrypted and stored locally
- **No Code Transmission**: Your code is never sent to external servers beyond AI providers
- **Secure Configuration**: Configuration files are stored with appropriate permissions
- **Input Validation**: All user inputs are validated and sanitized

## Dependencies

We regularly update dependencies to address security vulnerabilities. You can check for updates using:

```bash
npm audit
```

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days  
- **Resolution**: Varies based on complexity

Thank you for helping keep GitGenius secure!
