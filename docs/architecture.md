# BugTrack System Architecture

## Overview

BugTrack is a full-stack security research workflow management platform built with Next.js 14, PostgreSQL, and containerized tool execution. The system is designed for scalability, security, and privacy from the ground up.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│   Next.js 14 (App Router) + React + TypeScript + Tailwind  │
│   - User Interface                                          │
│   - Client-side encryption (Notes, Payloads)               │
│   - State management (React Context / Zustand)             │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Backend                          │
│   API Routes (REST or tRPC)                                 │
│   - Authentication (NextAuth.js / Supabase Auth)            │
│   - Authorization & session management                      │
│   - Business logic                                          │
│   - File upload handling                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
         ┌────────────────────┴────────────────────┐
         ↓                                         ↓
┌──────────────────────┐               ┌──────────────────────┐
│  PostgreSQL Database │               │  Object Storage      │
│  (Supabase or        │               │  (Supabase Storage   │
│   Self-hosted)       │               │   or S3)             │
│                      │               │                      │
│  - Users             │               │  - Attachments       │
│  - Targets           │               │  - Avatars           │
│  - Findings          │               │  - Exports           │
│  - Payloads          │               │                      │
│  - Notes (encrypted) │               └──────────────────────┘
│  - ToolJobs          │
└──────────────────────┘
         ↓ (Phase 2)
         ↓ Signed JWT
┌─────────────────────────────────────────────────────────────┐
│                    Runner Service (Phase 2)                  │
│   Node.js + Dockerode                                       │
│   - Job queue management                                    │
│   - Docker container orchestration                          │
│   - Tool execution & result parsing                         │
│   - Resource limits & sandboxing                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Docker Containers                       │
│   Ephemeral, isolated tool execution                        │
│   - Subfinder, Httpx, Gau, FFUF, Nuclei, etc.              │
│   - Resource-limited (CPU, memory, network)                 │
│   - Auto-cleanup after execution                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI or shadcn/ui
- **State Management**: React Context API or Zustand
- **Forms**: React Hook Form + Zod validation
- **Markdown Editor**: @uiw/react-md-editor or similar
- **Encryption**: Web Crypto API (native browser)

### Backend
- **Framework**: Next.js 14 API Routes
- **Language**: TypeScript
- **API Style**: REST (or tRPC for type safety)
- **Authentication**: NextAuth.js or Supabase Auth
- **Session Storage**: JWT or database sessions

### Database
- **Primary DB**: PostgreSQL 15+
- **ORM**: Prisma
- **Hosting Options**:
  - Supabase (managed PostgreSQL + Auth + Storage)
  - Vercel Postgres (serverless)
  - Self-hosted PostgreSQL on VPS

### Storage
- **Object Storage**: Supabase Storage or AWS S3
- **Use Cases**: File attachments, avatars, exports

### Tool Runner (Phase 2)
- **Runtime**: Node.js 18+
- **Container Orchestration**: Dockerode
- **Job Queue**: BullMQ (Redis-backed) or database-backed queue
- **Parsing**: Custom parsers for each tool

### DevOps
- **Hosting**: Vercel (frontend), VPS or K8s (runner)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry (errors), Plausible/PostHog (analytics)
- **Logging**: Pino or Winston

---

## Data Flow

### User Authentication Flow

```
1. User submits email + password on /login
2. Next.js API route validates credentials
3. If 2FA enabled, prompt for TOTP code
4. Verify 2FA code against stored secret
5. Create session (JWT or database record)
6. Set HTTP-only, Secure, SameSite=Strict cookie
7. Redirect to dashboard
8. Middleware validates session on protected routes
```

---

### Finding Creation Flow

```
1. User fills finding form on /findings/new
2. User uploads attachments (if any)
   a. Files sent to API route
   b. Validated (type, size)
   c. Uploaded to object storage (Supabase/S3)
   d. Return file URLs
3. User submits form
4. Frontend validates with Zod schema
5. POST to /api/findings
6. Backend validates authorization (user owns target)
7. Create finding record in database with attachment URLs
8. Return finding ID
9. Redirect to /findings/:id
```

---

### Client-Side Encryption Flow (Notes)

```
1. User enables encryption (first time)
2. Frontend prompts for passphrase
3. Derive AES-256-GCM key from passphrase (PBKDF2, 310k iterations)
4. Store key in sessionStorage (or localStorage if "remember me")
5. When creating note:
   a. Generate random 12-byte IV
   b. Encrypt content with key + IV (Web Crypto API)
   c. Hash plaintext with SHA-256 (integrity check)
   d. Send encrypted content + IV + hash to API
   e. API stores encrypted data (never sees plaintext)
6. When viewing note:
   a. Fetch encrypted content + IV from API
   b. Decrypt with user's key (from session)
   c. Verify SHA-256 hash
   d. Display plaintext in editor
```

---

### Tool Execution Flow (Phase 2)

```
1. User submits tool job via /tools
2. Frontend validates parameters
3. POST to /api/tools/jobs
4. API checks quota (hourly/daily limits)
5. Create job record in DB (status=QUEUED)
6. Sign job payload with JWT (secret shared with runner)
7. Send job to Runner Service queue
8. Runner Service:
   a. Validate JWT signature
   b. Pull job from queue
   c. Build Docker command from parameters
   d. Start container with resource limits
   e. Capture stdout/stderr
   f. Wait for completion or timeout
   g. Parse stdout into JSON
   h. Update job record (status=COMPLETED, result_json)
   i. Destroy container
9. Frontend polls job status (every 3 seconds)
10. When completed, display results
11. User can import results to findings
```

---

## Database Schema

### Core Tables

**users**
- `id` (PK)
- `email` (unique)
- `password_hash`
- `name`, `avatar_url`
- `two_fa_secret`, `two_fa_enabled`
- `created_at`, `updated_at`

**targets**
- `id` (PK)
- `user_id` (FK → users)
- `name`, `url`, `platform`
- `program_type` (enum)
- `scope_json` (JSONB)
- `status` (enum), `priority`
- `tags` (array)
- `created_at`, `updated_at`

**findings**
- `id` (PK)
- `user_id` (FK → users)
- `target_id` (FK → targets, nullable)
- `title`, `severity`, `workflow_state`
- `description_md`, `impact`, `reproduction_steps`, `remediation`
- `cvss_score`, `vulnerability_type`
- `tags` (array), `references` (array)
- `created_at`, `updated_at`

**attachments**
- `id` (PK)
- `finding_id` (FK → findings, cascade delete)
- `filename`, `file_url`, `file_size`, `mime_type`
- `attachment_type`
- `uploaded_at`

**payloads**
- `id` (PK)
- `user_id` (FK → users)
- `category`, `title`, `content`
- `is_encrypted`, `encryption_iv`
- `tags` (array)
- `usage_count`, `is_favorite`
- `created_at`, `updated_at`

**notes**
- `id` (PK)
- `user_id` (FK → users)
- `title`, `encrypted_content`, `encryption_iv`
- `content_hash`
- `tags` (array), `is_favorite`
- `created_at`, `updated_at`

**tool_jobs** (Phase 2)
- `id` (PK)
- `user_id` (FK → users)
- `target_id` (FK → targets, nullable)
- `tool_name`, `target_input`, `params_json`
- `status`, `result_json`, `result_count`
- `started_at`, `completed_at`, `duration_ms`
- `created_at`

### Relationships

```
User 1──N Target
User 1──N Finding
User 1──N Payload
User 1──N Note
User 1──N ToolJob

Target 1──N Finding
Target 1──N ToolJob

Finding 1──N Attachment
```

---

## Security Architecture

### Authentication & Authorization
- **Password Hashing**: bcrypt (12 rounds minimum)
- **2FA**: TOTP (RFC 6238), 30-second time step
- **Sessions**: HTTP-only, Secure, SameSite=Strict cookies
- **Token Expiry**: 7 days default, extend on activity
- **Authorization**: Row-level checks (`resource.user_id === session.user.id`)

### Input Validation
- **Client-Side**: Zod schemas for immediate feedback
- **Server-Side**: Zod validation on all API routes (never trust client)
- **SQL Injection**: Prevented by Prisma (parameterized queries)
- **XSS**: Sanitize markdown output, use CSP headers
- **CSRF**: Next.js built-in protection

### File Upload Security
- **Allowed Types**: Whitelist (images, PDFs, code files)
- **Size Limits**: 50MB per file, 500MB per finding
- **Virus Scanning**: ClamAV or cloud service (future)
- **Storage**: Private buckets with signed URLs (time-limited)
- **Filename**: Generate unique names (UUIDs) to prevent collisions

### Client-Side Encryption
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2, 310,000 iterations, SHA-256
- **IV**: Random 12-byte IV per encryption (never reuse)
- **Zero-Knowledge**: Server never sees plaintext or encryption keys
- **Integrity**: SHA-256 hash stored for tamper detection

### Container Security (Phase 2)
- **Isolation**: Ephemeral containers, no persistent storage
- **Privileges**: Non-root user, drop all capabilities
- **Network**: Isolated (no internet) or whitelist only
- **Resources**: CPU/memory limits to prevent DoS
- **Filesystem**: Read-only root filesystem

### Rate Limiting
- **Login**: 5 attempts per 15 minutes per IP
- **Registration**: 3 accounts per hour per IP
- **API**: 100 requests per minute per user
- **Tool Jobs**: 10/hour, 50/day per user (Phase 2)

### Audit Logging
- Failed login attempts (IP, timestamp)
- Password changes
- 2FA enable/disable
- Tool job executions (Phase 2)
- Admin actions (future)

---

## API Design

### RESTful Conventions

**Endpoints**:
- `GET /api/targets` - List all targets
- `GET /api/targets/:id` - Get single target
- `POST /api/targets` - Create target
- `PATCH /api/targets/:id` - Update target
- `DELETE /api/targets/:id` - Delete target

**Response Format**:
```json
{
  "data": { ... },
  "error": null,
  "meta": { ... }
}
```

**Error Responses**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You must be logged in",
    "details": { ... }
  },
  "data": null
}
```

**Status Codes**:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (not logged in)
- 403: Forbidden (no permission)
- 404: Not Found
- 429: Too Many Requests (rate limited)
- 500: Internal Server Error

---

## Deployment Architecture

### MVP Deployment (Phase 1)

**Vercel** (Frontend + API):
- Next.js frontend
- API routes
- Edge functions for auth middleware
- Automatic HTTPS
- Global CDN

**Supabase** (Backend Services):
- PostgreSQL database
- Authentication (optional)
- Object storage (attachments)
- Realtime subscriptions (future)

**Estimated Cost**: $0-$25/month (free tiers)

---

### Production Deployment (Phase 2+)

**Frontend & API**: Vercel or self-hosted K8s
**Database**: Managed PostgreSQL (Supabase, AWS RDS, DigitalOcean)
**Storage**: S3-compatible (Supabase, AWS S3, Backblaze B2)
**Runner Service**: VPS or K8s cluster with Docker
**Queue**: Redis (for BullMQ)
**Monitoring**: Sentry, Datadog, Prometheus + Grafana
**CDN**: Cloudflare (optional, for extra DDoS protection)

**Estimated Cost**: $50-$200/month (depending on usage)

---

## Scalability Considerations

### Database
- **Indexes**: On foreign keys, frequently queried fields
- **Connection Pooling**: PgBouncer or Prisma built-in
- **Read Replicas**: For high read traffic (future)
- **Partitioning**: Partition large tables by user_id (future)

### File Storage
- **CDN**: Serve attachments via CDN for global performance
- **Compression**: Compress images on upload
- **Cleanup**: Periodic job to delete orphaned files

### Tool Runner (Phase 2)
- **Horizontal Scaling**: Multiple runner nodes behind load balancer
- **Auto-Scaling**: Scale up when queue length > threshold
- **Job Prioritization**: High-priority jobs jump queue
- **Result Caching**: Cache recent tool results (optional)

### Frontend
- **Code Splitting**: Lazy load routes and components
- **ISR**: Incremental Static Regeneration for public pages (future)
- **CDN Caching**: Cache static assets aggressively

---

## Monitoring & Observability

### Error Tracking
- **Sentry**: Capture client and server errors
- **Alerts**: Slack/Email for critical errors

### Analytics
- **Plausible** or **PostHog**: Privacy-friendly analytics
- **Metrics**:
  - Daily/monthly active users
  - Findings created per user
  - Tool jobs executed
  - User retention (7-day, 30-day)

### Performance Monitoring
- **Vercel Analytics**: Core Web Vitals
- **Database Queries**: Prisma slow query log
- **API Response Times**: Custom middleware

### Logs
- **Structured Logging**: JSON logs (Pino)
- **Log Aggregation**: Papertrail, Datadog, or self-hosted Loki
- **Retention**: 30 days (free tier), 90+ days (production)

---

## Disaster Recovery & Backups

### Database Backups
- **Frequency**: Daily automated backups
- **Retention**: 30 days
- **Testing**: Quarterly restore tests
- **Storage**: S3 or Supabase built-in

### File Storage Backups
- **Versioning**: Enable S3 versioning
- **Replication**: Cross-region replication (production)

### Recovery Plan
1. Restore database from latest backup
2. Restore files from storage backup
3. Redeploy application (CI/CD)
4. Verify data integrity
5. Notify users of downtime

**RTO**: 4 hours (Recovery Time Objective)
**RPO**: 24 hours (Recovery Point Objective)

---

## Future Enhancements

### Phase 3
- Multi-user workspaces (teams)
- Role-based access control (RBAC)
- Audit logs for team actions
- Burp Suite import
- Shodan/Censys API integration
- MITRE ATT&CK mapping
- Streaks & analytics dashboard
- PWA for offline mode

### Phase 4
- AI assistant for finding summaries
- Custom tool plugins
- Webhook integrations
- Public API for automation
- Mobile app (React Native)
- Community marketplace (templates, payloads)

---

## Development Guidelines

### Code Organization
```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   └── features/    # Feature-specific components
├── lib/             # Utility functions
│   ├── db/          # Prisma client, queries
│   ├── auth/        # Authentication helpers
│   ├── crypto/      # Encryption utilities
│   └── validation/  # Zod schemas
├── types/           # TypeScript types
└── styles/          # Global styles
```

### Naming Conventions
- **Files**: `kebab-case.tsx`
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

### Testing Strategy
- **Unit Tests**: Vitest
- **Integration Tests**: Vitest + test database
- **E2E Tests**: Playwright
- **Coverage Goal**: 80%+ for core logic

---

## Security Checklist

- [ ] All passwords hashed with bcrypt (12+ rounds)
- [ ] Sessions use HTTP-only, Secure, SameSite cookies
- [ ] CSRF protection enabled
- [ ] Input validation on all API routes
- [ ] SQL injection prevented (Prisma)
- [ ] XSS prevention (sanitize markdown)
- [ ] File uploads validated (type, size)
- [ ] Client-side encryption for sensitive data
- [ ] Rate limiting on all public endpoints
- [ ] HTTPS enforced everywhere
- [ ] Security headers set (CSP, HSTS, etc.)
- [ ] Dependency scanning (npm audit, Snyk)
- [ ] Secrets stored in environment variables
- [ ] Regular security audits

---

## Conclusion

This architecture provides a solid foundation for BugTrack's MVP and future growth. It prioritizes security, privacy, and developer experience while remaining scalable and cost-effective.

