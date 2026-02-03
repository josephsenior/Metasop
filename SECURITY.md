# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.1.x   | :white_check_mark: Yes |

## Reporting a Vulnerability

If you discover a security vulnerability in MetaSOP, please report it to us responsibly.

### How to Report

**Do not** open a public issue for security vulnerabilities.

Instead, please send an email to: [security@metasop.dev](mailto:security@metasop.dev)

Please include:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any suggested fixes or mitigations

### What to Expect

- We will acknowledge receipt of your report within 48 hours
- We will provide a detailed response within 7 days
- We will work with you to understand and resolve the issue
- We will notify you when the fix is released
- We will credit you in the release notes (unless you prefer to remain anonymous)

### Security Best Practices

When reporting vulnerabilities:

- Provide as much detail as possible
- Include proof-of-concept code if applicable
- Keep the vulnerability confidential until fixed
- Follow responsible disclosure practices

## Security Features

MetaSOP includes several security features to protect your data and applications:

### Input Validation

- All user inputs are validated using Zod schemas
- Strict type checking prevents injection attacks
- Sanitization of user-generated content

### Session (Guest-Only)

- Guest session identified by `x-guest-session-id` header and `guest_session_id` cookie
- No login or user accounts; diagrams are scoped to the browser session

### API Security

- Rate limiting on all API endpoints
- CORS configuration
- Request validation and sanitization
- Secure HTTP headers

### Data Protection

- Environment variables for sensitive data
- No hardcoded credentials in source code
- Secure database connections
- Encryption at rest and in transit

### Dependency Management

- Regular dependency updates
- Security scanning of dependencies
- Vulnerability monitoring
- Automated security patches

## Security Audits

MetaSOP undergoes regular security audits:

- Code reviews by security experts
- Automated security scanning
- Penetration testing
- Dependency vulnerability scanning

## Security Updates

When security vulnerabilities are discovered:

1. We assess the severity and impact
2. We develop and test a fix
3. We release a security update
4. We notify users of the update
5. We publish security advisories

## Keeping MetaSOP Secure

To keep your MetaSOP installation secure:

### Regular Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Run security audit
npm audit
npm audit fix
```

### Environment Variables

Never commit sensitive data to version control:

```env
# ✅ Good - Use environment variables
GOOGLE_AI_API_KEY=your_api_key_here
DATABASE_URL=your_database_url_here

# ❌ Bad - Never commit secrets
# API_KEY=sk-1234567890abcdef
```

### Secure Configuration

- Keep database file (SQLite) or credentials secure
- Enable HTTPS in production
- Configure proper CORS settings
- Set appropriate timeout values
- Enable rate limiting

### Monitoring

- Monitor application logs for suspicious activity
- Set up alerts for security events
- Review access logs regularly
- Monitor API usage patterns

## Common Security Issues

### 1. Exposed API Keys

**Problem**: API keys committed to repository

**Solution**: Use environment variables

```bash
# .env.local (never commit this file)
GOOGLE_AI_API_KEY=your_api_key_here

# .gitignore
.env.local
.env.*.local
```

### 2. Insecure Dependencies

**Problem**: Outdated or vulnerable dependencies

**Solution**: Regular updates and audits

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

### 3. Insufficient Input Validation

**Problem**: User input not properly validated

**Solution**: Use Zod schemas for validation

```typescript
import { z } from 'zod';

const userInputSchema = z.object({
  email: z.string().email(),
  message: z.string().min(1).max(1000),
});

// Validate input
const result = userInputSchema.safeParse(userInput);
if (!result.success) {
  throw new Error('Invalid input');
}
```

### 4. Session / Guest Identity

**Problem**: Diagram requests not associated with the same guest session (e.g. missing header).

**Solution**: Ensure `x-guest-session-id` (or cookie) is sent with all diagram API requests. Use `fetchDiagramApi` or `apiClient` from the frontend so the header is set automatically. The API sets a `guest_session_id` cookie so same-origin requests carry the session.

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Node.js Security Best Practices](https://github.com/lirantal/nodejs-security-best-practices)
- [Zod Validation](https://zod.dev/)

## Contact

For security-related questions or concerns:

- Email: [security@metasop.dev](mailto:security@metasop.dev)
- GitHub Security: [Report a vulnerability](https://github.com/josephsenior/Metasop/security/advisories/new)

## Acknowledgments

We thank all security researchers who responsibly disclose vulnerabilities to help us keep MetaSOP secure.

---

**Last Updated**: January 2025
