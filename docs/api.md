# BugTrack API Documentation

## Overview

The BugTrack API provides programmatic access to all platform features. This document will be expanded as the API is implemented.

---

## Base URL

```
Development: http://localhost:3000/api
Production:  https://app.bugtrack.io/api
```

---

## Authentication

All API requests (except public endpoints) require authentication.

### Session-Based Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "two_fa_code": "123456"
}
```

**Response**:
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "expires_at": "2025-02-03T10:00:00Z"
  }
}
```

Session cookie is set automatically and included in subsequent requests.

---

### API Tokens (Future)

For automation and integrations:

```http
GET /api/targets
Authorization: Bearer <api_token>
```

---

## Response Format

### Success Response

```json
{
  "data": {
    // Response data
  },
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 50
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "email": "Invalid email format"
    }
  }
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful deletion) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### User Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get current user profile |
| PATCH | `/api/user/profile` | Update profile |
| POST | `/api/user/2fa/setup` | Generate 2FA secret |
| POST | `/api/user/2fa/verify` | Enable 2FA |
| DELETE | `/api/user/2fa/disable` | Disable 2FA |

### Targets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/targets` | List all targets |
| GET | `/api/targets/:id` | Get single target |
| POST | `/api/targets` | Create target |
| PATCH | `/api/targets/:id` | Update target |
| DELETE | `/api/targets/:id` | Delete target |
| POST | `/api/targets/bulk-tag` | Add tags to multiple targets |
| PATCH | `/api/targets/bulk-status` | Update status for multiple targets |

### Findings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/findings` | List all findings |
| GET | `/api/findings/:id` | Get single finding |
| POST | `/api/findings` | Create finding |
| PATCH | `/api/findings/:id` | Update finding |
| DELETE | `/api/findings/:id` | Delete finding |
| POST | `/api/findings/:id/attachments` | Upload attachment |
| DELETE | `/api/findings/:id/attachments/:attachmentId` | Delete attachment |
| GET | `/api/findings/:id/export/pdf` | Export as PDF |
| GET | `/api/findings/:id/export/markdown` | Export as Markdown |
| POST | `/api/findings/export/bulk` | Export multiple findings |

### Payloads

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payloads` | List all payloads |
| GET | `/api/payloads/:id` | Get single payload |
| POST | `/api/payloads` | Create payload |
| PATCH | `/api/payloads/:id` | Update payload |
| DELETE | `/api/payloads/:id` | Delete payload |
| POST | `/api/payloads/:id/copy` | Increment usage counter |
| POST | `/api/payloads/:id/favorite` | Toggle favorite |
| POST | `/api/payloads/import` | Import payloads from JSON |
| GET | `/api/payloads/export` | Export payloads to JSON |

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | List all notes (encrypted) |
| GET | `/api/notes/:id` | Get single note (encrypted) |
| POST | `/api/notes` | Create note |
| PATCH | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Delete note |
| POST | `/api/notes/:id/favorite` | Toggle favorite |
| POST | `/api/notes/:id/access` | Update last accessed timestamp |

### Tools (Phase 2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tools/jobs` | Create tool job |
| GET | `/api/tools/jobs` | List user's jobs |
| GET | `/api/tools/jobs/:id` | Get job details and results |
| DELETE | `/api/tools/jobs/:id` | Cancel/delete job |
| POST | `/api/tools/jobs/:id/import-findings` | Import results to findings |
| GET | `/api/tools/quota` | Check quota usage |

---

## Pagination

List endpoints support pagination:

```http
GET /api/findings?limit=50&offset=100
```

**Parameters**:
- `limit`: Number of items per page (default: 50, max: 100)
- `offset`: Number of items to skip

**Response**:
```json
{
  "data": [...],
  "meta": {
    "total": 250,
    "limit": 50,
    "offset": 100,
    "has_more": true
  }
}
```

---

## Filtering & Sorting

Most list endpoints support filtering and sorting:

```http
GET /api/findings?severity=HIGH&status=REPORTED&sort=created_at&order=desc
```

**Common Parameters**:
- `search`: Search in text fields
- `sort`: Field to sort by
- `order`: `asc` or `desc`
- Resource-specific filters (see feature docs)

---

## Rate Limiting

Rate limits are enforced per user (or IP for unauthenticated requests):

**Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643284800
```

**Limits**:
- General API: 100 requests/minute
- Authentication: 5 failed attempts/15 minutes
- File uploads: 20 uploads/hour
- Tool jobs: 10 jobs/hour, 50 jobs/day (Phase 2)

**429 Response**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds.",
    "retry_after": 60
  }
}
```

---

## Webhooks (Future)

Receive real-time notifications for events:

**Supported Events**:
- `finding.created`
- `finding.updated`
- `tool_job.completed`
- `tool_job.failed`

**Webhook Payload**:
```json
{
  "event": "finding.created",
  "timestamp": "2025-01-27T10:00:00Z",
  "data": {
    "id": "clx...",
    "title": "SQL Injection in Login Form",
    ...
  }
}
```

---

## API Versioning (Future)

API versioning via URL path:

```
/api/v1/targets
/api/v2/targets
```

Current version is implicit v1 (no version prefix).

---

## SDKs (Future)

Official client libraries:

- **JavaScript/TypeScript**: `npm install @bugtrack/sdk`
- **Python**: `pip install bugtrack`
- **Go**: `go get github.com/bugtrack/go-sdk`

---

## OpenAPI Specification (Future)

Auto-generated OpenAPI 3.0 spec available at:

```
https://app.bugtrack.io/api/openapi.json
```

Interactive docs:
```
https://app.bugtrack.io/api/docs
```

---

## Support

- **Documentation**: https://docs.bugtrack.io
- **Issues**: https://github.com/bugtrack/bugtrack/issues
- **Email**: support@bugtrack.io

---

**Last Updated**: 2025-01-27  
**API Version**: 1.0 (MVP)

