# Contributing to BugTrack

Thank you for your interest in contributing to BugTrack! This document provides guidelines and instructions for contributing to the project.

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

### Our Standards

- Be respectful and considerate
- Welcome newcomers and help them learn
- Focus on constructive criticism
- Accept responsibility for mistakes
- Prioritize the community's best interests

---

## How to Contribute

### Reporting Bugs

Before creating a bug report, please:
1. Check existing issues to avoid duplicates
2. Use the latest version of BugTrack
3. Provide clear reproduction steps

**Bug Report Template**:
```markdown
**Description**: Brief description of the bug

**Steps to Reproduce**:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**: What should happen

**Actual Behavior**: What actually happens

**Environment**:
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Node Version: [e.g., 18.17.0]
- BugTrack Version: [e.g., 1.0.0]

**Screenshots**: If applicable
```

---

### Suggesting Features

Feature requests are welcome! Please:
1. Check if the feature has already been requested
2. Explain the use case and benefits
3. Consider how it fits with BugTrack's goals

**Feature Request Template**:
```markdown
**Feature Description**: Clear description of the feature

**Use Case**: Why is this feature needed?

**Proposed Solution**: How should it work?

**Alternatives Considered**: Other approaches you've thought about

**Additional Context**: Screenshots, mockups, etc.
```

---

### Security Vulnerabilities

**Do NOT** create public issues for security vulnerabilities.

Instead, email: **security@bugtrack.io**

We'll respond within 48 hours and work with you on a fix.

---

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Git
- Docker (for Phase 2 tools)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/bugtrack.git
   cd bugtrack
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/bugtrack/bugtrack.git
   ```

### Install Dependencies

```bash
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update environment variables (at minimum, set `DATABASE_URL`)

3. Set up the database:
   ```bash
   npm run db:push
   npm run db:generate
   ```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/my-feature
```

**Branch Naming Convention**:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

### 2. Make Your Changes

Follow the coding standards (see below).

### 3. Write Tests

- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for user flows (if applicable)

Run tests:
```bash
npm test
```

### 4. Commit Your Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add target export feature"
git commit -m "fix: resolve CSRF token validation issue"
git commit -m "docs: update API documentation"
```

**Commit Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Test additions/updates
- `chore`: Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/my-feature
```

Then create a Pull Request on GitHub.

---

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Define types explicitly (avoid `any`)
- Use interfaces for object shapes

### File Organization

```
feature/
├── components/       # React components
├── hooks/           # Custom hooks
├── utils/           # Helper functions
├── types.ts         # TypeScript types
└── index.ts         # Public API
```

### Naming Conventions

- **Files**: `kebab-case.tsx`
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

### React Components

```tsx
// Use functional components with TypeScript
interface MyComponentProps {
  title: string;
  onClick: () => void;
}

export function MyComponent({ title, onClick }: MyComponentProps) {
  return (
    <button onClick={onClick}>
      {title}
    </button>
  );
}
```

### API Routes

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);

    // Your logic here

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
```

### Database Queries

```typescript
// Use Prisma for all database operations
import { prisma } from '@/lib/db/prisma';

const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { targets: true },
});
```

---

## Testing Guidelines

### Unit Tests

- Test individual functions and utilities
- Mock external dependencies
- Aim for 80%+ coverage

### Integration Tests

- Test API routes with test database
- Test database queries
- Test authentication flows

### E2E Tests

- Test complete user flows
- Use Playwright for browser testing
- Test critical paths (register → create target → create finding)

---

## Pull Request Guidelines

### PR Checklist

Before submitting your PR:

- [ ] Code follows the style guidelines
- [ ] All tests pass (`npm test`)
- [ ] New tests added for new features
- [ ] Documentation updated (if needed)
- [ ] No console.log or debugger statements
- [ ] Commit messages follow Conventional Commits
- [ ] Branch is up to date with `main`

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Closes #123

## Changes Made
- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)

## Screenshots (if applicable)
```

### Review Process

1. Automated checks run (tests, linting)
2. Maintainers review code
3. Address feedback if requested
4. Once approved, PR is merged

---

## Project Structure Guidelines

### When to Create New Files

- **New feature**: Create a new directory under `components/features/`
- **Reusable UI**: Add to `components/ui/`
- **API endpoint**: Create route under `app/api/`
- **Utility function**: Add to `lib/utils/` or create new module

### Documentation

- Update relevant docs in `docs/` for new features
- Add JSDoc comments for complex functions
- Update README.md if user-facing changes

---

## Database Migrations

### Creating Migrations

```bash
# After changing prisma/schema.prisma
npm run db:migrate -- --name descriptive-name
```

### Migration Guidelines

- Name migrations descriptively (`add-user-quota`, `create-tool-jobs`)
- Test migrations on dev database before committing
- Never edit existing migrations
- Include rollback instructions in PR description

---

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release branch: `release/vX.Y.Z`
4. Run full test suite
5. Merge to `main`
6. Tag release: `git tag vX.Y.Z`
7. Push tag: `git push --tags`
8. Publish release notes on GitHub

---

## Getting Help

- **Discord**: [Join our community](https://discord.gg/bugtrack) (coming soon)
- **Discussions**: Use GitHub Discussions for questions
- **Email**: dev@bugtrack.io

---

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Given contributor badge (future)

Thank you for contributing to BugTrack! 🎉

