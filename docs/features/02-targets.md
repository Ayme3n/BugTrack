# Targets Management

## Feature Purpose

Comprehensive target and program management system for organizing bug bounty programs, pentesting engagements, and attack surfaces. Targets serve as the foundation for associating findings, tool results, and research notes.

## User Stories

- **As a bug hunter**, I want to track multiple programs so I can organize my research efforts
- **As a pentester**, I want to define scope boundaries so I know what's in/out of scope
- **As a researcher**, I want to tag and categorize targets so I can filter and search efficiently
- **As a user**, I want to track program status so I know which targets are active vs. completed
- **As a user**, I want to add notes and metadata to targets for context

## Database Entities

### Targets Table

```typescript
model Target {
  id              String    @id @default(cuid())
  user_id         String
  name            String
  program_type    ProgramType
  url             String?
  platform        String?   // "HackerOne", "Bugcrowd", "Private", etc.
  scope_json      Json      // Structured scope definition
  status          TargetStatus @default(ACTIVE)
  tags            String[]  // Array of tag strings
  notes           String?   // General notes/context
  priority        Int       @default(2) // 1=High, 2=Medium, 3=Low
  reward_range    String?   // "$500-$10,000" or "€100-€5,000"
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  
  // Relations
  user            User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  findings        Finding[]
  tool_jobs       ToolJob[]
  
  @@index([user_id])
  @@index([status])
  @@index([created_at])
}

enum ProgramType {
  BUG_BOUNTY
  VDP
  PENTEST
  PERSONAL
  CTF
}

enum TargetStatus {
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}
```

**Field Definitions**:
- `id`: Unique identifier
- `user_id`: Owner of this target
- `name`: Program/target name (e.g., "Acme Corp Bug Bounty")
- `program_type`: Type of engagement
- `url`: Main target URL or primary endpoint
- `platform`: Hosting platform (HackerOne, Bugcrowd, etc.)
- `scope_json`: Structured scope definition (see Scope Schema below)
- `status`: Current target status
- `tags`: Flexible categorization (e.g., ["web", "api", "high-payout"])
- `notes`: Markdown notes about the program
- `priority`: User-assigned priority (1=High, 2=Medium, 3=Low)
- `reward_range`: Expected reward range (free text)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

### Scope Schema (JSON)

```typescript
interface TargetScope {
  in_scope: ScopeItem[];
  out_of_scope: ScopeItem[];
  rules?: string; // Special rules or notes
}

interface ScopeItem {
  type: "domain" | "ip" | "cidr" | "url" | "wildcard" | "other";
  value: string;
  description?: string;
  eligible_vulnerabilities?: string[]; // ["xss", "sqli", etc.]
}
```

**Example Scope JSON**:
```json
{
  "in_scope": [
    {
      "type": "domain",
      "value": "*.example.com",
      "description": "All subdomains",
      "eligible_vulnerabilities": ["xss", "sqli", "csrf", "rce"]
    },
    {
      "type": "ip",
      "value": "192.168.1.100",
      "description": "Production API server"
    }
  ],
  "out_of_scope": [
    {
      "type": "domain",
      "value": "test.example.com",
      "description": "Testing environment"
    }
  ],
  "rules": "Do not test during peak hours (9am-5pm EST). Rate limit: 10 req/sec."
}
```

---

## API Endpoints

### Target CRUD

#### GET `/api/targets`
List all targets for authenticated user.

**Query Parameters**:
- `status`: Filter by status (e.g., `ACTIVE`, `PAUSED`)
- `tags`: Filter by tags (comma-separated: `web,api`)
- `search`: Search in name and notes
- `sort`: Sort by field (`created_at`, `updated_at`, `name`, `priority`)
- `order`: Sort order (`asc`, `desc`)

**Response** (200):
```json
{
  "targets": [
    {
      "id": "clx...",
      "name": "Acme Corp Bug Bounty",
      "program_type": "BUG_BOUNTY",
      "url": "https://acme.com",
      "platform": "HackerOne",
      "status": "ACTIVE",
      "tags": ["web", "api"],
      "priority": 1,
      "reward_range": "$500-$10,000",
      "finding_count": 5,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-20T14:30:00Z"
    }
  ],
  "total": 10
}
```

---

#### GET `/api/targets/:id`
Get single target by ID.

**Response** (200):
```json
{
  "id": "clx...",
  "name": "Acme Corp Bug Bounty",
  "program_type": "BUG_BOUNTY",
  "url": "https://acme.com",
  "platform": "HackerOne",
  "scope_json": {
    "in_scope": [...],
    "out_of_scope": [...]
  },
  "status": "ACTIVE",
  "tags": ["web", "api"],
  "notes": "Focus on authentication bypass and API issues",
  "priority": 1,
  "reward_range": "$500-$10,000",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-20T14:30:00Z"
}
```

---

#### POST `/api/targets`
Create a new target.

**Request Body**:
```json
{
  "name": "Acme Corp Bug Bounty",
  "program_type": "BUG_BOUNTY",
  "url": "https://acme.com",
  "platform": "HackerOne",
  "scope_json": {
    "in_scope": [
      {
        "type": "domain",
        "value": "*.acme.com",
        "description": "All subdomains"
      }
    ],
    "out_of_scope": []
  },
  "tags": ["web", "api"],
  "notes": "Focus on auth issues",
  "priority": 1,
  "reward_range": "$500-$10,000"
}
```

**Response** (201):
```json
{
  "target": {
    "id": "clx...",
    "name": "Acme Corp Bug Bounty",
    ...
  },
  "message": "Target created successfully"
}
```

---

#### PATCH `/api/targets/:id`
Update existing target.

**Request Body** (partial update):
```json
{
  "status": "PAUSED",
  "notes": "Updated notes",
  "tags": ["web", "api", "mobile"]
}
```

**Response** (200):
```json
{
  "target": {
    "id": "clx...",
    ...
  },
  "message": "Target updated successfully"
}
```

---

#### DELETE `/api/targets/:id`
Delete a target (cascade deletes findings).

**Response** (200):
```json
{
  "message": "Target deleted successfully"
}
```

---

### Bulk Operations

#### POST `/api/targets/bulk-tag`
Add tags to multiple targets.

**Request Body**:
```json
{
  "target_ids": ["clx1...", "clx2..."],
  "tags": ["important", "high-priority"]
}
```

**Response** (200):
```json
{
  "updated_count": 2,
  "message": "Tags added to 2 targets"
}
```

---

#### PATCH `/api/targets/bulk-status`
Update status for multiple targets.

**Request Body**:
```json
{
  "target_ids": ["clx1...", "clx2..."],
  "status": "ARCHIVED"
}
```

**Response** (200):
```json
{
  "updated_count": 2,
  "message": "Status updated for 2 targets"
}
```

---

## UI/UX Wireframes

### Targets List Page (`/targets`)

**Layout**:
- **Header**: 
  - Page title "Targets"
  - "New Target" button (primary action)
  - Search bar
  - Filter dropdown (status, tags, priority)
  - Sort dropdown

- **Target Cards** (grid or list view toggle):
  - Target name (bold, clickable)
  - Platform badge
  - Status indicator (colored dot or badge)
  - Tags (pills)
  - Priority indicator (color-coded)
  - Finding count
  - Last updated timestamp
  - Quick actions menu (Edit, Archive, Delete)

- **Empty State**:
  - Icon + "No targets yet"
  - "Create your first target" button
  - Quick tips or example

---

### Target Detail Page (`/targets/:id`)

**Tabs**:
1. **Overview**
   - Target name (editable inline)
   - URL (clickable link)
   - Platform, Program type, Status (editable)
   - Priority selector
   - Reward range
   - Tags (add/remove)
   - Notes (markdown editor)

2. **Scope**
   - In-Scope section
     - Add new scope item button
     - List of scope items (type, value, description)
     - Remove button for each item
   - Out-of-Scope section (same structure)
   - Special rules text area

3. **Findings** (related findings)
   - List of findings linked to this target
   - "New Finding" button
   - Filter by severity/status

4. **Activity** (future)
   - Tool jobs run against this target
   - Recent changes/updates

**Actions**:
- "Save Changes" button (sticky header)
- "Archive Target" button
- "Delete Target" button (with confirmation)

---

### Create/Edit Target Modal

**Form Fields**:
- Target Name (required, text input)
- Program Type (required, dropdown)
- Primary URL (optional, URL input)
- Platform (optional, dropdown or free text)
- Priority (required, radio buttons or dropdown: High/Medium/Low)
- Reward Range (optional, text input)
- Tags (multi-select or tag input)
- Status (dropdown: Active/Paused/Completed/Archived)
- Notes (markdown editor)
- Scope Builder (see below)

**Scope Builder**:
- "Add In-Scope Item" button
- "Add Out-of-Scope Item" button
- For each item:
  - Type dropdown (Domain, IP, CIDR, URL, Wildcard, Other)
  - Value input
  - Description (optional)
  - Eligible vulnerabilities (multi-select)
  - Remove button

**Actions**:
- "Create Target" / "Save Changes" button
- "Cancel" button

---

### Keyboard Shortcuts
- `N`: New target
- `/`: Focus search
- `E`: Edit selected target
- `D`: Delete selected target
- `A`: Archive selected target

---

## Security Considerations

### Authorization
- Users can only view/edit/delete their own targets
- All API routes must verify `target.user_id === session.user.id`
- Implement row-level security if using Supabase

### Input Validation
- **Name**: Required, max 200 characters, sanitize HTML
- **URL**: Valid URL format (if provided)
- **Scope JSON**: Validate structure against schema
- **Tags**: Max 20 tags per target, max 50 chars per tag
- **Notes**: Sanitize markdown, prevent XSS
- **Priority**: Must be 1, 2, or 3

### Data Privacy
- Targets may contain sensitive client information (pentests)
- Ensure proper isolation between users
- Consider encryption at rest for sensitive fields (notes, scope)

### Rate Limiting
- Max 100 targets per user (configurable)
- Max 1000 scope items per target
- Bulk operations limited to 50 targets at once

---

## Acceptance Criteria

### Target Creation
- ✅ User can create a target with name and program type
- ✅ Scope can be defined with multiple in-scope and out-of-scope items
- ✅ Tags can be added during creation
- ✅ Target appears in list immediately after creation

### Target Management
- ✅ User can view all their targets in a list
- ✅ User can search targets by name or notes content
- ✅ User can filter targets by status, tags, or priority
- ✅ User can sort targets by various fields
- ✅ User can edit all target fields
- ✅ User can delete a target (with confirmation)

### Scope Management
- ✅ User can add/remove scope items
- ✅ Scope items validate based on type (valid domain, IP, etc.)
- ✅ Scope is displayed clearly with in/out sections
- ✅ User can add special rules or notes to scope

### Tags & Organization
- ✅ User can add/remove tags from targets
- ✅ Tag autocomplete suggests existing tags
- ✅ Bulk tag operations work on multiple targets
- ✅ Targets can be filtered by tags

### Status Management
- ✅ User can change target status
- ✅ Status changes are reflected immediately
- ✅ Bulk status updates work on multiple targets
- ✅ Archived targets can be hidden from main view

---

## Testing Checklist

### Unit Tests
- [ ] Target validation (name, URL, scope JSON)
- [ ] Scope item validation by type
- [ ] Tag normalization and deduplication
- [ ] Search/filter logic

### Integration Tests
- [ ] Create target with all fields
- [ ] Update target fields
- [ ] Delete target cascades to findings
- [ ] Bulk operations (tag, status)
- [ ] Unauthorized access blocked

### E2E Tests (Playwright)
- [ ] User creates a new target
- [ ] User adds scope items (in/out)
- [ ] User searches and filters targets
- [ ] User edits target details
- [ ] User archives target
- [ ] User deletes target (with confirmation)

