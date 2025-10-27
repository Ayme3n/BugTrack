# BugTrack Security & Privacy

## Overview

Security and privacy are foundational principles of BugTrack. This document outlines all security measures, best practices, threat models, and responsible use policies implemented in the platform.

---

## Security Principles

1. **Privacy by Design**: Client-side encryption for sensitive data
2. **Defense in Depth**: Multiple layers of security controls
3. **Principle of Least Privilege**: Users and processes have minimum necessary permissions
4. **Secure by Default**: Security features enabled out of the box
5. **Transparency**: Open documentation of security measures
6. **Continuous Improvement**: Regular audits and updates

---

## Authentication Security

### Password Security

**Hashing**:
- Algorithm: bcrypt
- Salt rounds: 12 minimum (adjustable based on performance)
- Never store or log plain-text passwords
- Passwords never transmitted except during registration/login (over HTTPS)

**Password Policy**:
- Minimum 8 characters
- Must include: uppercase, lowercase, number, special character
- Check against common password lists (optional integration with HaveIBeenPwned API)
- Password strength indicator on registration/change

**Password Reset**:
- Tokens: Cryptographically secure random tokens (32 bytes)
- Expiration: 1 hour
- Single-use: Token invalidated after use
- All sessions invalidated after password change

---

### Two-Factor Authentication (2FA)

**Algorithm**: Time-based One-Time Password (TOTP, RFC 6238)

**Implementation**:
- 30-second time step
- 6-digit codes
- Secret: 32-byte random secret, base32 encoded
- Storage: Encrypted at rest using application encryption key

**Backup Codes**:
- 10 single-use codes generated at 2FA setup
- bcrypt hashed before storage
- Downloadable once at creation
- Regeneration requires password verification

**Recovery**:
- If backup codes lost: User must disable 2FA with password
- Support can assist after identity verification (future)

---

### Session Management

**Session Storage**:
- HTTP-only cookies (not accessible via JavaScript)
- Secure flag (HTTPS only)
- SameSite=Strict (CSRF protection)
- Expiration: 7 days default (sliding window)

**Session Tokens**:
- JWT or database-backed sessions
- Random session IDs (UUIDs)
- Tokens include: user_id, expiration, issued_at

**Session Invalidation**:
- On logout
- On password change
- On 2FA disable
- On inactivity (30 days)
- Manual "Log out all devices" option

**Concurrent Sessions**:
- Multiple devices allowed
- User can view and revoke individual sessions (future)

---

## Authorization & Access Control

### User Isolation

**Row-Level Security**:
- Every resource (Target, Finding, Payload, etc.) has `user_id`
- All queries filter by `WHERE user_id = :current_user_id`
- Implemented at ORM level (Prisma)
- Consider PostgreSQL RLS policies if using Supabase

**API Authorization**:
```typescript
// Middleware pattern
async function requireAuth(req: Request) {
  const session = await getSession(req);
  if (!session) throw new UnauthorizedException();
  return session.user;
}

async function requireOwnership(resourceId: string, userId: string) {
  const resource = await db.resource.findUnique({ where: { id: resourceId }});
  if (resource.user_id !== userId) throw new ForbiddenException();
  return resource;
}
```

**Future: Multi-User Workspaces (Phase 4)**:
- Role-Based Access Control (RBAC)
- Roles: Owner, Admin, Member, Viewer
- Permissions: Create, Read, Update, Delete per resource type
- Audit logs for all actions

---

## Input Validation & Sanitization

### Validation Strategy

**Client-Side** (user experience):
- Zod schemas for immediate feedback
- Real-time validation on forms
- Never trust client validation alone

**Server-Side** (security):
- Zod validation on all API routes
- Reject invalid requests with 400 Bad Request
- Detailed error messages for debugging (dev), generic messages (production)

### Common Validations

**Email**:
```typescript
email: z.string().email().max(255).toLowerCase().trim()
```

**URLs**:
```typescript
url: z.string().url().max(2048)
```

**Text Fields**:
```typescript
title: z.string().min(1).max(200).trim()
description: z.string().max(100000) // Limit markdown content
```

**Arrays**:
```typescript
tags: z.array(z.string().max(50)).max(20)
```

---

### SQL Injection Prevention

**ORM Protection**:
- Prisma uses parameterized queries
- Never construct raw SQL with user input
- If raw SQL needed: Use parameterized queries explicitly

```typescript
// Safe
await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;

// UNSAFE - never do this
await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE id = '${userId}'`);
```

---

### Cross-Site Scripting (XSS) Prevention

**Output Encoding**:
- React escapes JSX by default
- Markdown: Use DOMPurify to sanitize HTML output
- Never use `dangerouslySetInnerHTML` without sanitization

**Content Security Policy (CSP)**:
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.bugtrack.io;
```

**Sanitization Example**:
```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeMarkdown(markdown: string): string {
  const html = markdownToHtml(markdown);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'title']
  });
}
```

---

### Cross-Site Request Forgery (CSRF) Prevention

**Next.js Built-In Protection**:
- SameSite=Strict cookies
- CSRF tokens for state-changing operations

**Manual CSRF Tokens** (if needed):
```typescript
// Generate token on session creation
const csrfToken = crypto.randomBytes(32).toString('hex');

// Validate on POST/PATCH/DELETE requests
if (req.body.csrfToken !== session.csrfToken) {
  throw new ForbiddenException();
}
```

---

## File Upload Security

### Validation

**Allowed Types** (whitelist):
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF
- Code: .txt, .py, .js, .html, .json, .xml
- Video: MP4, WebM (for PoC recordings)

**Type Validation**:
```typescript
// Don't trust MIME type alone - check magic bytes
import fileType from 'file-type';

const buffer = await file.arrayBuffer();
const type = await fileType.fromBuffer(Buffer.from(buffer));

if (!ALLOWED_TYPES.includes(type?.mime)) {
  throw new BadRequestException('File type not allowed');
}
```

**Size Limits**:
- Per file: 50MB
- Per finding: 500MB total attachments
- Per user: 10GB total storage (future quota)

---

### Virus Scanning

**MVP**: Basic validation only

**Production**:
- Integrate ClamAV or cloud service (AWS GuardDuty, VirusTotal API)
- Scan on upload before saving to storage
- Quarantine suspicious files
- Notify user and admin

---

### Storage Security

**Object Storage** (S3/Supabase):
- Private buckets (not public by default)
- Signed URLs for time-limited access (expires in 1 hour)
- Access control: User can only access their own files
- Encryption at rest (S3 server-side encryption)

**Filename Safety**:
```typescript
// Generate safe, unique filenames
const safeFilename = `${uuid()}-${sanitizeFilename(originalName)}`;

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}
```

---

## Client-Side Encryption

### Implementation (Notes & Payloads)

**Algorithm**: AES-256-GCM (Authenticated Encryption)

**Key Derivation**:
```typescript
// From user passphrase (PBKDF2)
const keyMaterial = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(passphrase),
  "PBKDF2",
  false,
  ["deriveKey"]
);

const key = await crypto.subtle.deriveKey(
  {
    name: "PBKDF2",
    salt: userSalt, // Unique per user, 16 bytes, stored server-side
    iterations: 310000, // OWASP 2023 recommendation
    hash: "SHA-256"
  },
  keyMaterial,
  { name: "AES-GCM", length: 256 },
  true, // extractable (for export)
  ["encrypt", "decrypt"]
);
```

**Encryption**:
```typescript
const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
const encrypted = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  key,
  new TextEncoder().encode(plaintext)
);

// Store: base64(encrypted), base64(iv)
```

**Integrity Check**:
```typescript
const hash = await crypto.subtle.digest("SHA-256", plaintext);
// Store hash alongside encrypted content
```

---

### Zero-Knowledge Architecture

**Server Never Sees**:
- Encryption keys
- Unencrypted content
- User passphrases

**Client Responsibilities**:
- Key derivation
- Encryption/decryption
- Key storage (sessionStorage or localStorage)

**Trade-Offs**:
- ✅ Maximum privacy
- ✅ Protection against server breaches
- ❌ No server-side search of encrypted content
- ❌ User loses passphrase = data lost forever

**Recovery Options**:
- Export/backup encryption key (user responsibility)
- Use separate passphrase (not account password)
- Warning messages at setup

---

## Rate Limiting & Abuse Prevention

### Rate Limits (Per User)

**Authentication**:
- Login: 5 failed attempts per 15 minutes per IP
- Registration: 3 accounts per hour per IP
- Password reset: 3 requests per hour per email

**API Endpoints**:
- General: 100 requests per minute
- Sensitive operations (delete, export): 10 per minute

**Tool Jobs** (Phase 2):
- 10 jobs per hour
- 50 jobs per day
- Premium users: Higher limits (future)

**File Uploads**:
- 20 uploads per hour
- 100 uploads per day

---

### Implementation

**Middleware** (using `express-rate-limit` pattern):
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later'
});

// Apply to API routes
app.use('/api/', apiLimiter);
```

**Storage**: Redis (fast) or database (simpler for MVP)

---

### Abuse Detection

**Behavioral Signals**:
- Rapid resource creation (targets, findings)
- Scanning targets not owned by user
- Excessive failed login attempts
- Unusual API patterns

**Actions**:
- Temporary rate limit (stricter limits)
- Account flagged for manual review
- Email warning to user
- Account suspension (manual decision)

---

## Container Security (Phase 2)

### Docker Sandboxing

**Container Configuration**:
```typescript
{
  HostConfig: {
    // Resource limits
    Memory: 512 * 1024 * 1024, // 512MB RAM
    MemorySwap: 512 * 1024 * 1024, // No swap
    CpuQuota: 50000, // 50% of 1 CPU core
    CpuPeriod: 100000,
    PidsLimit: 100, // Max processes
    
    // Network isolation
    NetworkMode: "none", // or custom isolated network
    
    // Filesystem
    ReadonlyRootfs: true,
    Tmpfs: { "/tmp": "rw,noexec,nosuid,size=100m" },
    
    // Security
    CapDrop: ["ALL"], // Drop all Linux capabilities
    SecurityOpt: ["no-new-privileges"],
    
    // Cleanup
    AutoRemove: true
  },
  User: "1000:1000" // Non-root user
}
```

---

### Image Security

**Base Images**:
- Minimal (Alpine Linux)
- Regularly updated
- Scanned for vulnerabilities (Trivy, Snyk)

**Build Process**:
```dockerfile
FROM alpine:latest
RUN adduser -D -u 1000 tooluser
COPY --from=builder /tool /usr/local/bin/
USER tooluser
ENTRYPOINT ["/usr/local/bin/tool"]
```

**Registry**:
- Private registry (Docker Hub, GitHub Packages, AWS ECR)
- Image signing (Docker Content Trust)
- Vulnerability scanning in CI/CD

---

### Input Sanitization (Command Injection Prevention)

**Never** construct commands with string concatenation:
```typescript
// UNSAFE
const cmd = `subfinder -d ${userInput}`;

// SAFE - use array of arguments
const cmd = ["subfinder", "-d", userInput];
```

**Validation**:
```typescript
function validateDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain);
}
```

---

### Monitoring & Alerts

**Container Escapes**:
- Monitor for suspicious syscalls (seccomp profiles)
- Alert on container accessing host filesystem
- Alert on privilege escalation attempts

**Resource Abuse**:
- Alert on jobs exceeding time limits repeatedly
- Alert on excessive resource usage
- Alert on container crashes

---

## HTTPS & Transport Security

### Enforcement

**Strict Transport Security** (HSTS):
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Redirect HTTP → HTTPS**:
```typescript
// Next.js middleware
if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
  return NextResponse.redirect(`https://${req.headers.host}${req.url}`, 301);
}
```

**TLS Configuration**:
- Minimum TLS 1.2 (prefer TLS 1.3)
- Strong cipher suites only
- Certificate: Let's Encrypt or commercial CA

---

## Security Headers

**Recommended Headers**:
```typescript
// Next.js next.config.js
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      {
        key: 'X-Frame-Options',
        value: 'DENY'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()'
      }
    ]
  }
]
```

---

## Logging & Monitoring

### What to Log

**Security Events**:
- ✅ Failed login attempts (IP, user agent, timestamp)
- ✅ Password changes
- ✅ 2FA enable/disable
- ✅ Account creation
- ✅ Suspicious API activity
- ✅ Rate limit violations
- ✅ Tool job executions (Phase 2)

**What NOT to Log**:
- ❌ Passwords (plain or hashed)
- ❌ Session tokens
- ❌ Encryption keys
- ❌ Decrypted note content
- ❌ Personal data (unless necessary)

---

### Log Storage

**Structured Logging** (JSON):
```json
{
  "timestamp": "2025-01-27T10:00:00Z",
  "level": "warn",
  "event": "failed_login",
  "user_email": "user@example.com",
  "ip": "192.168.1.100",
  "user_agent": "Mozilla/5.0..."
}
```

**Retention**:
- Development: 7 days
- Production: 90 days minimum
- Audit logs: 1 year

**Access Control**:
- Logs contain sensitive info (IPs, emails)
- Restrict access to developers and security team
- Encrypt logs at rest

---

## Dependency Management

### Vulnerability Scanning

**Tools**:
- `npm audit` (built-in)
- Snyk (free tier)
- Dependabot (GitHub)

**Process**:
- Automated weekly scans
- Critical vulnerabilities: Patch within 24 hours
- High vulnerabilities: Patch within 1 week
- Medium/Low: Patch in next release

**Automated Updates**:
- Dependabot PRs for security updates
- Automated tests before merging

---

## Secrets Management

### Environment Variables

**Never Commit**:
- `.env` files added to `.gitignore`
- Use `.env.example` (without values) for documentation

**Storage**:
- Development: Local `.env` files
- Production: Vercel env vars, AWS Secrets Manager, or vault

**Rotation**:
- Database passwords: Quarterly
- API keys: When compromised or annually
- JWT secrets: Annually (invalidates all sessions)

---

## Incident Response Plan

### Detection

**Monitoring Alerts**:
- Unusual spike in failed logins
- Mass data export
- Container escape attempts
- Elevated error rates

**User Reports**:
- Email: security@bugtrack.io
- Response time: 24 hours

---

### Response Steps

1. **Identify & Confirm**:
   - Verify the incident is real
   - Determine scope and impact

2. **Contain**:
   - Disable compromised accounts
   - Revoke leaked credentials
   - Block malicious IPs

3. **Eradicate**:
   - Patch vulnerability
   - Remove attacker access
   - Clean up malicious data

4. **Recover**:
   - Restore from backups if needed
   - Re-enable services
   - Monitor for reoccurrence

5. **Post-Incident**:
   - Document incident
   - Notify affected users (if required by law)
   - Improve defenses
   - Update response plan

---

## Responsible Use Policy

### Acceptable Use

**Users May**:
- Use BugTrack for legitimate security research
- Test targets they own or have permission to test
- Store security findings and research notes
- Use integrated tools on authorized targets

**Users May NOT**:
- Scan targets without authorization
- Use BugTrack for illegal activities
- Attempt to compromise the platform itself
- Share accounts or credentials
- Abuse rate limits or resources

---

### Abuse Reporting

**Report Abuse**:
- Email: abuse@bugtrack.io
- Response time: 48 hours
- Anonymous reporting accepted

**Actions**:
- Warning for first offense (minor)
- Temporary suspension (repeat or serious)
- Permanent ban (severe or illegal)

---

## Compliance & Privacy

### Data Privacy (GDPR/CCPA Ready)

**User Rights**:
- Right to access: Export all data
- Right to deletion: Delete account and all data
- Right to portability: Export in JSON format
- Right to correction: Edit profile and data

**Data Retention**:
- Active accounts: Indefinite (user controls data)
- Deleted accounts: 30-day grace period, then permanent deletion
- Backups: Deleted from backups after 90 days

**Data Minimization**:
- Only collect necessary data
- No tracking without consent
- No third-party analytics (or privacy-friendly only)

---

### Security Disclosure

**Vulnerability Reporting**:
- Email: security@bugtrack.io
- PGP key: [future]
- Response: Within 48 hours

**Responsible Disclosure**:
- Report vulnerabilities privately first
- Allow 90 days for patch before public disclosure
- Credit researchers in changelog (if desired)

**Bug Bounty** (future):
- Paid rewards for security findings
- Clear scope and rules
- Hall of fame for contributors

---

## Security Checklist (Pre-Launch)

### Authentication & Authorization
- [ ] Passwords hashed with bcrypt (12+ rounds)
- [ ] 2FA implemented and tested
- [ ] Sessions use secure cookies (HTTP-only, Secure, SameSite)
- [ ] CSRF protection enabled
- [ ] Rate limiting on auth endpoints
- [ ] Password reset flow secure (1-hour expiration, single-use)

### Input Validation
- [ ] Zod validation on all API routes
- [ ] SQL injection prevented (Prisma parameterized queries)
- [ ] XSS prevented (sanitized markdown)
- [ ] Command injection prevented (no shell execution of user input)
- [ ] File uploads validated (type, size, magic bytes)

### Encryption & Privacy
- [ ] HTTPS enforced everywhere
- [ ] Client-side encryption working (Notes, Payloads)
- [ ] Encryption keys never sent to server
- [ ] Integrity checks on encrypted data

### Container Security (Phase 2)
- [ ] Containers run as non-root
- [ ] Resource limits enforced
- [ ] Network isolation enabled
- [ ] Readonly root filesystem
- [ ] Auto-cleanup after execution

### Monitoring & Logging
- [ ] Security events logged
- [ ] No sensitive data in logs
- [ ] Error tracking configured (Sentry)
- [ ] Alerts set up for critical issues

### Infrastructure
- [ ] Security headers configured
- [ ] CSP policy implemented
- [ ] Secrets in environment variables (not code)
- [ ] Dependency scanning automated
- [ ] Backups automated and tested

### Policies & Documentation
- [ ] Responsible use policy published
- [ ] Security disclosure policy published
- [ ] Privacy policy compliant (GDPR/CCPA)
- [ ] Terms of service clear
- [ ] Incident response plan documented

---

## Conclusion

Security is an ongoing process, not a one-time task. This document will be updated as new threats emerge and as BugTrack evolves. Regular security audits, penetration testing, and community feedback are essential to maintaining a secure platform.

**Last Updated**: 2025-01-27  
**Next Review**: Quarterly

