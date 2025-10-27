# BugTrack

**Your secure command center for bug bounty and pentesting.**

BugTrack is a full-stack web application that lets security researchers manage targets, track findings, store payloads, and run common Linux security tools from the browser—eliminating the need for VMs, especially for Windows users.

---

## Features

### MVP (Phase 1)
- **🔐 User Authentication**: Email/password login with optional 2FA (TOTP)
- **🎯 Target Management**: Organize bug bounty programs and pentests with scope tracking
- **🔍 Findings Tracker**: Document vulnerabilities with markdown, attachments, and professional PDF/Markdown export
- **💉 Payload Library**: Store XSS, SQLi, and other payloads with quick-copy and optional encryption
- **🔒 Encrypted Notes**: Client-side AES-256-GCM encryption for sensitive data (zero-knowledge)

### Phase 2 (Integrated Tools)
- **🛠️ Security Tools**: Run Subfinder, Httpx, Gau, FFUF, Nuclei in isolated Docker containers
- **📊 Job Queue**: Track tool execution status and import results to findings
- **🔒 Sandboxed Execution**: Resource-limited, network-isolated containers

### Phase 3+ (Advanced Features)
- Burp Suite import, Shodan/Censys APIs, MITRE ATT&CK mapping
- Streaks & analytics dashboard, achievements
- PWA for offline mode

### Phase 4 (Team Features)
- Multi-user workspaces, RBAC, audit logs
- AI assistant for finding summaries
- Public API for automation

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Encryption**: Web Crypto API

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: Custom (NextAuth.js or Supabase Auth planned)
- **Storage**: Supabase Storage or S3

### Tool Runner (Phase 2)
- **Runtime**: Node.js + Dockerode
- **Queue**: BullMQ or database-backed
- **Containers**: Docker with strict resource limits

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+
- Docker (for Phase 2 tools)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bugtrack/bugtrack.git
   cd bugtrack
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - Storage credentials (Supabase or AWS S3)

4. **Set up the database**:
   ```bash
   npm run db:push
   ```

5. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

6. **Run the development server**:
   ```bash
   npm run dev
   ```

7. **Open** [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
BugTrack/
├── app/                  # Next.js 14 App Router
│   ├── api/             # API routes
│   ├── (dashboard)/     # Dashboard pages (protected)
│   └── (auth)/          # Auth pages (login, register)
├── components/
│   ├── ui/              # Reusable UI components
│   └── features/        # Feature-specific components
├── lib/
│   ├── db/              # Prisma client
│   ├── auth/            # Authentication logic
│   ├── crypto/          # Encryption utilities
│   ├── validation/      # Zod schemas
│   └── utils/           # Helper functions
├── types/               # TypeScript types
├── styles/              # Global styles
├── prisma/
│   └── schema.prisma    # Database schema
├── docs/                # Feature documentation
│   ├── features/        # Feature specs
│   ├── architecture.md  # System design
│   ├── security.md      # Security measures
│   └── api.md           # API documentation
└── tests/               # Unit, integration, E2E tests
```

---

## Database Schema

See [`prisma/schema.prisma`](./prisma/schema.prisma) for the complete schema.

**Core Entities**:
- `users` - User accounts with 2FA support
- `targets` - Bug bounty programs and pentest targets
- `findings` - Vulnerability findings with attachments
- `payloads` - Reusable attack payloads (optionally encrypted)
- `notes` - Client-side encrypted notes
- `tool_jobs` - Security tool execution jobs (Phase 2)

---

## Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database (dev)
npm run db:migrate   # Create migration (production)
npm run db:studio    # Open Prisma Studio
```

### Testing

```bash
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests (Playwright)
npm run test:coverage # Generate coverage report
```

---

## Security

BugTrack takes security seriously:

- **Authentication**: bcrypt password hashing, 2FA with TOTP
- **Sessions**: HTTP-only, Secure, SameSite cookies
- **Input Validation**: Zod schemas on all API routes
- **Client-Side Encryption**: AES-256-GCM for notes and sensitive payloads
- **Container Security**: Sandboxed Docker execution with resource limits (Phase 2)
- **Rate Limiting**: Prevent brute force and abuse
- **HTTPS Enforced**: Strict Transport Security headers

See [`docs/security.md`](./docs/security.md) for complete security documentation.

**Vulnerability Reporting**: security@bugtrack.io

---

## Documentation

- **[Architecture](./docs/architecture.md)**: System design and data flow
- **[Security](./docs/security.md)**: Security measures and best practices
- **[API Documentation](./docs/api.md)**: API endpoints and usage
- **Feature Docs**: [`docs/features/`](./docs/features/)
  - [Authentication](./docs/features/01-authentication.md)
  - [Targets](./docs/features/02-targets.md)
  - [Findings](./docs/features/03-findings.md)
  - [Payload Library](./docs/features/04-payload-library.md)
  - [Encrypted Notes](./docs/features/05-encrypted-notes.md)
  - [Tools Integration](./docs/features/06-tools-integration.md)

---

## Roadmap

**Current Phase**: Phase 0 (Project Foundation) ✅

### Phase 1 - MVP (Sprints 1-6)
- [ ] Authentication & User Profile
- [ ] Target Management
- [ ] Findings Management with Attachments & Export
- [ ] Payload Library
- [ ] Encrypted Notes
- [ ] UI/UX Polish (dark mode, command palette)

### Phase 2 - Integrated Tools (Sprints 7-10)
- [ ] Runner Service architecture
- [ ] Docker tool execution (Subfinder, Httpx, etc.)
- [ ] Job queue and status tracking
- [ ] Result parsing and import to findings

### Phase 3 - Advanced Features (Sprints 11-15)
- [ ] Burp Suite import
- [ ] Shodan/Censys integration
- [ ] MITRE ATT&CK mapping
- [ ] Streaks & analytics dashboard

### Phase 4 - Team Features (Sprints 16-20)
- [ ] Multi-user workspaces
- [ ] RBAC and audit logs
- [ ] AI assistant
- [ ] Public API

---

## Contributing

Contributions are welcome! Please read the [Contributing Guide](./CONTRIBUTING.md) before submitting PRs.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m "Add my feature"`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

---

## Responsible Use Policy

BugTrack is intended for **legitimate security research** only. Users must:
- ✅ Only test targets they own or have permission to test
- ✅ Follow responsible disclosure practices
- ❌ Not use BugTrack for illegal activities
- ❌ Not scan targets without authorization

Abuse will result in account suspension. Report abuse: abuse@bugtrack.io

---

## License

[MIT License](./LICENSE)

---

## Support

- **Documentation**: https://docs.bugtrack.io
- **Issues**: https://github.com/bugtrack/bugtrack/issues
- **Email**: support@bugtrack.io
- **Community**: [Discord](https://discord.gg/bugtrack) (coming soon)

---

## Acknowledgments

BugTrack is built with open-source tools and inspired by the security research community.

Special thanks to:
- [ProjectDiscovery](https://projectdiscovery.io/) for amazing security tools
- The bug bounty and pentesting community

---

**Built with ❤️ for security researchers**

