# Findings Management

## Feature Purpose

Comprehensive vulnerability and finding tracking system for documenting security issues discovered during research, pentesting, or bug bounty hunting. Findings support rich markdown descriptions, file attachments (screenshots, PoCs), workflow states, and professional PDF/Markdown export.

## User Stories

- **As a security researcher**, I want to document vulnerabilities with detailed technical descriptions
- **As a bug hunter**, I want to attach screenshots and PoC files to my findings
- **As a pentester**, I want to track finding status through my workflow (Draft → Testing → Reported → Accepted)
- **As a user**, I want to export findings as professional PDF or Markdown reports
- **As a user**, I want to link findings to specific targets/programs
- **As a user**, I want to categorize findings by severity (CVSS-like)

## Database Entities

### Findings Table

```typescript
model Finding {
  id              String    @id @default(cuid())
  user_id         String
  target_id       String?   // Optional link to target
  title           String
  severity        Severity
  status          FindingStatus @default(DRAFT)
  workflow_state  WorkflowState @default(DRAFT)
  cvss_score      Float?    // Optional CVSS score (0.0-10.0)
  vulnerability_type String? // "XSS", "SQLi", "IDOR", etc.
  description_md  String    @db.Text // Markdown description
  impact          String?   @db.Text // Impact description
  reproduction_steps String? @db.Text // Step-by-step reproduction
  remediation     String?   @db.Text // Fix recommendations
  references      String[]  // URLs to references
  tags            String[]
  reported_at     DateTime? // When reported to program
  resolved_at     DateTime? // When marked resolved
  reward_amount   String?   // "$500", "€1000", etc.
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  
  // Relations
  user            User        @relation(fields: [user_id], references: [id], onDelete: Cascade)
  target          Target?     @relation(fields: [target_id], references: [id], onDelete: SetNull)
  attachments     Attachment[]
  
  @@index([user_id])
  @@index([target_id])
  @@index([severity])
  @@index([workflow_state])
  @@index([created_at])
}

enum Severity {
  CRITICAL
  HIGH
  MEDIUM
  LOW
  INFO
}

enum FindingStatus {
  DRAFT
  READY
  REPORTED
  ACCEPTED
  DUPLICATE
  NOT_APPLICABLE
  RESOLVED
}

enum WorkflowState {
  DRAFT          // Initial state
  TESTING        // Validating the vulnerability
  REPORTED       // Submitted to program
  TRIAGED        // Program confirmed receipt
  ACCEPTED       // Program validated the finding
  FIXED          // Vulnerability patched
  DUPLICATE      // Marked as duplicate
  NOT_APPLICABLE // Out of scope or not valid
  REWARDED       // Bounty paid
}
```

### Attachments Table

```typescript
model Attachment {
  id              String    @id @default(cuid())
  finding_id      String
  filename        String
  original_name   String
  file_url        String    // Storage URL (Supabase/S3)
  file_size       Int       // Bytes
  mime_type       String
  attachment_type AttachmentType @default(OTHER)
  uploaded_at     DateTime  @default(now())
  
  // Relations
  finding         Finding   @relation(fields: [finding_id], references: [id], onDelete: Cascade)
  
  @@index([finding_id])
}

enum AttachmentType {
  SCREENSHOT
  POC_CODE
  VIDEO
  DOCUMENT
  OTHER
}
```

---

## API Endpoints

### Finding CRUD

#### GET `/api/findings`
List all findings for authenticated user.

**Query Parameters**:
- `target_id`: Filter by target
- `severity`: Filter by severity
- `workflow_state`: Filter by workflow state
- `tags`: Filter by tags (comma-separated)
- `search`: Search in title, description
- `sort`: Sort by field (default: `created_at`)
- `order`: Sort order (`asc`, `desc`)
- `limit`: Page size (default: 50)
- `offset`: Pagination offset

**Response** (200):
```json
{
  "findings": [
    {
      "id": "clx...",
      "title": "SQL Injection in Login Form",
      "severity": "HIGH",
      "workflow_state": "REPORTED",
      "target_id": "clx...",
      "target_name": "Acme Corp",
      "cvss_score": 8.5,
      "vulnerability_type": "SQLi",
      "tags": ["authentication", "database"],
      "attachment_count": 3,
      "reported_at": "2025-01-18T10:00:00Z",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-18T10:00:00Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

---

#### GET `/api/findings/:id`
Get single finding with full details.

**Response** (200):
```json
{
  "id": "clx...",
  "title": "SQL Injection in Login Form",
  "severity": "HIGH",
  "workflow_state": "REPORTED",
  "cvss_score": 8.5,
  "vulnerability_type": "SQLi",
  "description_md": "## Overview\nSQL injection vulnerability...",
  "impact": "Attacker can bypass authentication...",
  "reproduction_steps": "1. Navigate to /login\n2. Enter payload...",
  "remediation": "Use parameterized queries...",
  "references": ["https://owasp.org/sqli"],
  "tags": ["authentication", "database"],
  "target_id": "clx...",
  "target_name": "Acme Corp",
  "reported_at": "2025-01-18T10:00:00Z",
  "reward_amount": "$1500",
  "attachments": [
    {
      "id": "att1...",
      "filename": "poc-screenshot.png",
      "file_url": "https://storage.../poc-screenshot.png",
      "file_size": 245678,
      "mime_type": "image/png",
      "attachment_type": "SCREENSHOT",
      "uploaded_at": "2025-01-15T11:00:00Z"
    }
  ],
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-18T10:00:00Z"
}
```

---

#### POST `/api/findings`
Create a new finding.

**Request Body**:
```json
{
  "title": "SQL Injection in Login Form",
  "severity": "HIGH",
  "target_id": "clx...",
  "vulnerability_type": "SQLi",
  "description_md": "## Overview\nSQL injection...",
  "impact": "Attacker can bypass authentication",
  "reproduction_steps": "1. Navigate to /login...",
  "remediation": "Use parameterized queries",
  "tags": ["authentication", "database"],
  "cvss_score": 8.5
}
```

**Response** (201):
```json
{
  "finding": {
    "id": "clx...",
    "title": "SQL Injection in Login Form",
    ...
  },
  "message": "Finding created successfully"
}
```

---

#### PATCH `/api/findings/:id`
Update existing finding.

**Request Body** (partial update):
```json
{
  "workflow_state": "ACCEPTED",
  "reward_amount": "$1500",
  "resolved_at": "2025-01-20T15:00:00Z"
}
```

**Response** (200):
```json
{
  "finding": {
    "id": "clx...",
    ...
  },
  "message": "Finding updated successfully"
}
```

---

#### DELETE `/api/findings/:id`
Delete a finding (cascade deletes attachments).

**Response** (200):
```json
{
  "message": "Finding deleted successfully"
}
```

---

### Attachment Management

#### POST `/api/findings/:id/attachments`
Upload attachment to finding.

**Request**: Multipart form data
- `file`: File to upload (max 50MB)
- `attachment_type`: Optional type classification

**Response** (201):
```json
{
  "attachment": {
    "id": "att1...",
    "filename": "screenshot.png",
    "file_url": "https://storage.../screenshot.png",
    "file_size": 245678,
    "mime_type": "image/png",
    "attachment_type": "SCREENSHOT"
  },
  "message": "Attachment uploaded successfully"
}
```

---

#### DELETE `/api/findings/:id/attachments/:attachmentId`
Delete an attachment.

**Response** (200):
```json
{
  "message": "Attachment deleted successfully"
}
```

---

### Export Endpoints

#### GET `/api/findings/:id/export/pdf`
Export finding as PDF report.

**Query Parameters**:
- `template`: Report template (default: `standard`)

**Response**: Binary PDF file

**Headers**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="SQL-Injection-in-Login-Form.pdf"
```

---

#### GET `/api/findings/:id/export/markdown`
Export finding as Markdown file.

**Response**: Text file

**Headers**:
```
Content-Type: text/markdown
Content-Disposition: attachment; filename="SQL-Injection-in-Login-Form.md"
```

---

#### POST `/api/findings/export/bulk`
Export multiple findings as single report.

**Request Body**:
```json
{
  "finding_ids": ["clx1...", "clx2...", "clx3..."],
  "format": "pdf",
  "template": "executive"
}
```

**Response**: Binary PDF file with all findings

---

## UI/UX Wireframes

### Findings List Page (`/findings`)

**Layout**:
- **Header**:
  - Page title "Findings"
  - "New Finding" button
  - Search bar
  - Filters: Severity, Workflow State, Target, Tags
  - Sort dropdown
  - View toggle (cards/table)

- **Finding Cards/Table**:
  - Severity badge (color-coded: Critical=red, High=orange, etc.)
  - Title (bold, clickable)
  - Workflow state badge
  - Target name (if linked)
  - CVSS score
  - Attachment count icon
  - Tags
  - Created/Updated date
  - Quick actions: Edit, Export, Delete

- **Bulk Actions Bar** (when items selected):
  - "Export Selected" button
  - "Change Status" dropdown
  - "Add Tags" button
  - "Delete Selected" button

---

### Finding Detail Page (`/findings/:id`)

**Header**:
- Back button
- Finding title (editable inline)
- Severity selector (dropdown with colors)
- Workflow state dropdown
- "Export" button (dropdown: PDF/Markdown)
- "Delete" button

**Main Content** (single-column layout):

1. **Metadata Section**:
   - Target (linked)
   - Vulnerability Type
   - CVSS Score
   - Tags (editable)
   - Created/Updated dates
   - Reported date
   - Reward amount

2. **Description** (Markdown editor):
   - Toolbar: Bold, Italic, Code, Link, Image, etc.
   - Live preview toggle
   - Full markdown support

3. **Impact** (Markdown editor):
   - What can attacker do?
   - Business impact

4. **Reproduction Steps** (Markdown editor):
   - Numbered step-by-step guide
   - Code blocks for payloads/requests

5. **Remediation** (Markdown editor):
   - Fix recommendations
   - Code examples

6. **References**:
   - Add reference URL button
   - List of URLs (editable)

7. **Attachments**:
   - Upload button (drag & drop zone)
   - File list with previews (images/videos)
   - Download/Delete buttons
   - File type icons

**Sidebar** (workflow tracking):
- Workflow progress indicator
- Status history (future)
- Related findings (future)

---

### Create/Edit Finding Form (`/findings/new`, `/findings/:id/edit`)

**Form Structure**:
- Title (required, large text input)
- Target selector (dropdown, searchable)
- Severity (required, radio buttons with colors)
- Vulnerability Type (dropdown or free text)
- CVSS Score (optional, number input 0-10)
- Tags (multi-input)

**Tabs**:
1. **Description** (markdown editor)
2. **Impact** (markdown editor)
3. **Reproduction** (markdown editor)
4. **Remediation** (markdown editor)
5. **Attachments** (upload interface)

**Actions**:
- "Save as Draft" button
- "Mark Ready" button
- "Cancel" button

---

### Export Templates

#### Standard PDF Template
- Header: Finding title, severity, CVSS
- Target information
- Vulnerability type
- Description (formatted markdown)
- Impact
- Reproduction steps
- Remediation
- References
- Embedded attachment images
- Footer: Generated by BugTrack, date

#### Markdown Export Format
```markdown
# SQL Injection in Login Form

**Severity**: HIGH  
**CVSS Score**: 8.5  
**Target**: Acme Corp  
**Vulnerability Type**: SQL Injection

## Description
[Description content]

## Impact
[Impact content]

## Reproduction Steps
[Steps content]

## Remediation
[Remediation content]

## References
- https://...

## Attachments
- screenshot.png
- poc.py
```

---

## Security Considerations

### Authorization
- Users can only access their own findings
- Attachment URLs must be signed/temporary (for S3/Supabase)
- Verify `finding.user_id === session.user.id` on all operations

### Input Validation
- **Title**: Required, max 300 characters
- **Description/Impact/etc.**: Sanitize markdown, prevent XSS
- **CVSS Score**: Must be 0.0-10.0
- **Vulnerability Type**: Max 50 characters
- **References**: Validate URL format
- **Tags**: Max 20 tags, max 50 chars each

### File Upload Security
- **Allowed Types**: Images (JPEG, PNG, GIF, WebP), videos (MP4, WebM), documents (PDF), code files (.txt, .py, .js, .html)
- **Max Size**: 50MB per file, 500MB total per finding
- **Virus Scanning**: Integrate ClamAV or cloud scanning service
- **Storage**: Private buckets with signed URLs
- **Filename**: Generate unique filenames to prevent collisions

### Content Security
- Sanitize markdown output to prevent XSS
- Strip potentially malicious HTML tags
- Use CSP headers on finding display pages
- Sandbox embedded content (if any)

### Export Security
- Rate limit export requests (10/minute per user)
- Watermark PDFs with user email (optional)
- Log all export operations for audit

---

## Acceptance Criteria

### Finding Creation & Management
- ✅ User can create a finding with title and severity
- ✅ User can link finding to a target
- ✅ User can write descriptions in markdown with live preview
- ✅ User can update workflow state
- ✅ User can add/edit all fields
- ✅ User can delete a finding with confirmation

### Attachments
- ✅ User can upload files (images, code, documents)
- ✅ Images display as thumbnails and full preview
- ✅ User can download attachments
- ✅ User can delete attachments
- ✅ File size and type restrictions are enforced

### Search & Filter
- ✅ User can search findings by title/description
- ✅ User can filter by severity, workflow state, target
- ✅ User can filter by tags
- ✅ User can sort by various fields
- ✅ Filters can be combined

### Export
- ✅ User can export single finding as PDF
- ✅ User can export single finding as Markdown
- ✅ User can export multiple findings as one report
- ✅ Exported PDFs include all content and images
- ✅ Exported files have proper formatting

### Workflow Management
- ✅ User can track finding through workflow states
- ✅ Workflow state changes update timestamp
- ✅ User can mark reported date and reward amount
- ✅ Findings show current workflow state clearly

---

## Testing Checklist

### Unit Tests
- [ ] Finding validation (title, severity, CVSS)
- [ ] Markdown sanitization
- [ ] File type and size validation
- [ ] Export template generation

### Integration Tests
- [ ] Create finding with all fields
- [ ] Upload and attach files
- [ ] Update finding workflow
- [ ] Delete finding cascades to attachments
- [ ] Export PDF and Markdown
- [ ] Bulk export multiple findings

### Security Tests
- [ ] XSS prevention in markdown
- [ ] Unauthorized file access blocked
- [ ] Malicious file upload rejected
- [ ] SQL injection in search/filter

### E2E Tests (Playwright)
- [ ] User creates a complete finding
- [ ] User uploads screenshot and PoC
- [ ] User updates workflow from draft to reported
- [ ] User exports finding as PDF
- [ ] User searches and filters findings
- [ ] User deletes finding

