# Payload Library

## Feature Purpose

Centralized payload management system for storing, organizing, and quickly accessing frequently-used attack payloads, test strings, code snippets, and security tools commands. Supports categorization, tagging, quick-copy functionality, and optional encryption for sensitive payloads.

## User Stories

- **As a security researcher**, I want to store my collection of XSS/SQLi payloads so I can reuse them across engagements
- **As a pentester**, I want to categorize payloads by vulnerability type for easy retrieval
- **As a bug hunter**, I want to quickly copy payloads to clipboard with one click
- **As a user**, I want to encrypt sensitive payloads so they're not stored in plain text
- **As a user**, I want to search and filter payloads by tags, category, or content
- **As a user**, I want to import/export payload collections

## Database Entities

### Payloads Table

```typescript
model Payload {
  id              String    @id @default(cuid())
  user_id         String
  category        PayloadCategory
  title           String
  content         String    @db.Text // Plain or encrypted payload
  description     String?   // What the payload does
  tags            String[]
  is_encrypted    Boolean   @default(false)
  encryption_iv   String?   // Initialization vector (if encrypted)
  is_favorite     Boolean   @default(false)
  usage_count     Int       @default(0) // Track usage for analytics
  source_url      String?   // Attribution/reference
  language        String?   // For syntax highlighting (js, python, bash, etc.)
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  
  // Relations
  user            User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id])
  @@index([category])
  @@index([is_favorite])
  @@index([created_at])
}

enum PayloadCategory {
  XSS
  SQLI
  COMMAND_INJECTION
  SSRF
  XXE
  LFI_RFI
  IDOR
  CSRF
  AUTH_BYPASS
  DESERIALIZATION
  TEMPLATE_INJECTION
  LDAP_INJECTION
  NOSQL_INJECTION
  PROTOTYPE_POLLUTION
  RACE_CONDITION
  RECON_COMMAND
  FUZZING_WORDLIST
  CUSTOM_SCRIPT
  OTHER
}
```

**Field Definitions**:
- `id`: Unique identifier
- `user_id`: Owner of this payload
- `category`: Vulnerability/attack type classification
- `title`: Short descriptive name (e.g., "Basic XSS Alert", "MySQL Error-Based SQLi")
- `content`: The actual payload string or code (encrypted if `is_encrypted=true`)
- `description`: Optional notes about usage, context, when it works
- `tags`: Flexible tagging (e.g., ["blind", "mysql", "union"])
- `is_encrypted`: Whether content is client-side encrypted
- `encryption_iv`: Initialization vector for decryption (stored, not secret)
- `is_favorite`: User can mark frequently-used payloads
- `usage_count`: Incremented each time payload is copied (analytics)
- `source_url`: Credit/reference URL if payload is from public source
- `language`: Syntax highlighting hint (for code payloads)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Indexes**:
```sql
CREATE INDEX payloads_user_category_idx ON payloads(user_id, category);
CREATE INDEX payloads_tags_idx ON payloads USING GIN(tags); -- PostgreSQL array index
```

---

## API Endpoints

### Payload CRUD

#### GET `/api/payloads`
List all payloads for authenticated user.

**Query Parameters**:
- `category`: Filter by category
- `tags`: Filter by tags (comma-separated)
- `is_favorite`: Filter favorites only (true/false)
- `search`: Search in title, description, content (decrypted client-side)
- `sort`: Sort by field (default: `created_at`)
- `order`: Sort order (`asc`, `desc`)

**Response** (200):
```json
{
  "payloads": [
    {
      "id": "clx...",
      "category": "XSS",
      "title": "Basic XSS Alert",
      "content": "<script>alert(1)</script>",
      "description": "Simple XSS proof of concept",
      "tags": ["basic", "alert"],
      "is_encrypted": false,
      "is_favorite": true,
      "usage_count": 15,
      "language": null,
      "created_at": "2025-01-15T10:00:00Z"
    },
    {
      "id": "clx2...",
      "category": "SQLI",
      "title": "MySQL Union Injection",
      "content": "...[encrypted]...",
      "is_encrypted": true,
      "encryption_iv": "base64_iv_here",
      "tags": ["mysql", "union"],
      "is_favorite": false,
      "usage_count": 8,
      "created_at": "2025-01-16T10:00:00Z"
    }
  ],
  "total": 42
}
```

---

#### GET `/api/payloads/:id`
Get single payload by ID.

**Response** (200):
```json
{
  "id": "clx...",
  "category": "XSS",
  "title": "Basic XSS Alert",
  "content": "<script>alert(1)</script>",
  "description": "Simple XSS proof of concept",
  "tags": ["basic", "alert"],
  "is_encrypted": false,
  "is_favorite": true,
  "usage_count": 15,
  "source_url": "https://owasp.org/xss",
  "language": "html",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

---

#### POST `/api/payloads`
Create a new payload.

**Request Body**:
```json
{
  "category": "XSS",
  "title": "Basic XSS Alert",
  "content": "<script>alert(1)</script>",
  "description": "Simple XSS PoC",
  "tags": ["basic", "alert"],
  "is_encrypted": false,
  "language": "html",
  "source_url": "https://owasp.org/xss"
}
```

**For encrypted payload**:
```json
{
  "category": "SQLI",
  "title": "Advanced SQLi Payload",
  "content": "encrypted_base64_content_here",
  "encryption_iv": "base64_iv_here",
  "is_encrypted": true,
  "tags": ["mysql", "advanced"]
}
```

**Response** (201):
```json
{
  "payload": {
    "id": "clx...",
    "title": "Basic XSS Alert",
    ...
  },
  "message": "Payload created successfully"
}
```

---

#### PATCH `/api/payloads/:id`
Update existing payload.

**Request Body** (partial update):
```json
{
  "title": "Updated XSS Alert",
  "tags": ["basic", "alert", "proof-of-concept"],
  "is_favorite": true
}
```

**Response** (200):
```json
{
  "payload": {
    "id": "clx...",
    ...
  },
  "message": "Payload updated successfully"
}
```

---

#### DELETE `/api/payloads/:id`
Delete a payload.

**Response** (200):
```json
{
  "message": "Payload deleted successfully"
}
```

---

### Payload Actions

#### POST `/api/payloads/:id/copy`
Increment usage counter (called when user copies payload).

**Response** (200):
```json
{
  "usage_count": 16
}
```

---

#### POST `/api/payloads/:id/favorite`
Toggle favorite status.

**Response** (200):
```json
{
  "is_favorite": true
}
```

---

### Bulk Operations

#### POST `/api/payloads/import`
Import payloads from JSON file.

**Request**: Multipart form data with JSON file

**JSON Format**:
```json
{
  "payloads": [
    {
      "category": "XSS",
      "title": "XSS Payload 1",
      "content": "<script>alert(1)</script>",
      "tags": ["xss"]
    }
  ]
}
```

**Response** (201):
```json
{
  "imported_count": 25,
  "message": "25 payloads imported successfully"
}
```

---

#### GET `/api/payloads/export`
Export all payloads as JSON file.

**Query Parameters**:
- `category`: Export specific category only
- `favorites_only`: Export favorites only (true/false)

**Response**: JSON file download

**Headers**:
```
Content-Type: application/json
Content-Disposition: attachment; filename="bugtrack-payloads-2025-01-27.json"
```

---

## UI/UX Wireframes

### Payload Library Page (`/payloads`)

**Layout**:

**Header**:
- Page title "Payload Library"
- "New Payload" button
- "Import" button
- "Export" button
- Search bar (searches title, description, tags)
- Category filter (dropdown)
- Tag filter (multi-select)
- "Favorites Only" toggle
- Sort dropdown (Created, Usage, Alphabetical)

**Main Content**:

**Sidebar** (left, collapsible):
- Category list with counts
  - XSS (15)
  - SQL Injection (23)
  - Command Injection (8)
  - etc.
- "All Categories" option
- Tag cloud (popular tags)

**Payload Grid/Cards**:
Each card shows:
- Title (bold)
- Category badge (colored)
- Content preview (first 100 chars, code font)
- Tags (pills)
- Favorite star icon (clickable)
- Copy button (primary action)
- Usage count (small text)
- Encrypted lock icon (if encrypted)
- Edit/Delete icons (on hover)

**Empty State**:
- Icon + "No payloads yet"
- "Create your first payload" button
- "Import from file" button
- Link to payload templates/examples

---

### Payload Detail/Edit Modal

**Header**:
- "New Payload" or "Edit Payload"
- Close button

**Form**:
1. **Title** (required, text input)
2. **Category** (required, dropdown)
3. **Content** (required, code editor)
   - Syntax highlighting based on language
   - Line numbers
   - Copy button
   - If encrypted: "Decrypt" button shows plain content temporarily
4. **Language** (dropdown: HTML, JavaScript, Python, Bash, SQL, etc.)
5. **Description** (optional, textarea)
6. **Tags** (multi-input with autocomplete)
7. **Source URL** (optional, for attribution)
8. **Encryption Toggle**
   - Checkbox "Encrypt this payload"
   - Warning: "Encrypted payloads can only be decrypted with your encryption key"
9. **Favorite Toggle** (checkbox or star)

**Actions**:
- "Save Payload" button
- "Cancel" button

---

### Quick Copy Interface

**Context Menu** (right-click on payload card):
- Copy Payload
- Copy Encoded (URL-encoded, Base64, etc.)
- Edit
- Duplicate
- Delete
- Toggle Favorite

**Keyboard Shortcuts**:
- `N`: New payload
- `C`: Copy selected payload
- `E`: Edit selected payload
- `F`: Toggle favorite
- `Delete`: Delete selected payload
- `/`: Focus search

---

### Import/Export Interface

**Import Modal**:
- Drag & drop zone for JSON file
- "Browse Files" button
- Preview imported payloads (table)
- Options:
  - "Skip duplicates" (match by title + content)
  - "Overwrite existing" (match by title)
  - "Import all as new"
- "Import" button

**Export Modal**:
- Export options:
  - All payloads
  - Current category only
  - Favorites only
  - Selected payloads
- Format: JSON (future: CSV)
- "Include encrypted payloads" checkbox
- "Export" button

---

## Client-Side Encryption

### Encryption Flow (Web Crypto API)

**Key Derivation**:
```typescript
// User's encryption key derived from passphrase (or stored in browser)
const keyMaterial = await window.crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(userPassphrase),
  "PBKDF2",
  false,
  ["deriveBits", "deriveKey"]
);

const encryptionKey = await window.crypto.subtle.deriveKey(
  {
    name: "PBKDF2",
    salt: userSalt, // Unique per user, stored server-side
    iterations: 100000,
    hash: "SHA-256"
  },
  keyMaterial,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt", "decrypt"]
);
```

**Encryption**:
```typescript
const iv = window.crypto.getRandomValues(new Uint8Array(12)); // GCM IV
const encrypted = await window.crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  encryptionKey,
  new TextEncoder().encode(payload.content)
);

// Store: base64(encrypted), base64(iv)
```

**Decryption**:
```typescript
const decrypted = await window.crypto.subtle.decrypt(
  { name: "AES-GCM", iv: base64ToArray(payload.encryption_iv) },
  encryptionKey,
  base64ToArray(payload.content)
);

const plaintext = new TextDecoder().decode(decrypted);
```

---

## Security Considerations

### Authorization
- Users can only access their own payloads
- Verify `payload.user_id === session.user.id` on all operations

### Encryption
- **Client-Side Only**: Encryption/decryption happens in browser
- **Key Management**: User's encryption key never sent to server
- **IV Storage**: Safe to store IVs server-side (not secret)
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Passphrase**: User must remember passphrase; lost = data lost

### Input Validation
- **Title**: Required, max 200 characters
- **Content**: Max 100KB per payload
- **Description**: Max 1000 characters
- **Tags**: Max 20 tags per payload, max 50 chars per tag
- **Source URL**: Valid URL format if provided

### Content Security
- Do NOT execute or render payload content as HTML
- Display in code blocks with syntax highlighting (safe)
- Sanitize any user input in descriptions

### Rate Limiting
- Max 1000 payloads per user
- Max 100 import operations per day
- Max 1000 copy operations per hour (to prevent abuse)

---

## Acceptance Criteria

### Payload Management
- ✅ User can create a payload with title, category, and content
- ✅ User can edit all payload fields
- ✅ User can delete a payload
- ✅ User can mark payload as favorite
- ✅ User can view all payloads in organized grid/list

### Search & Organization
- ✅ User can search payloads by title, description, tags
- ✅ User can filter by category
- ✅ User can filter by tags (multiple)
- ✅ User can view favorites only
- ✅ User can sort by created date, usage count, or alphabetically

### Quick Copy
- ✅ User can copy payload to clipboard with one click
- ✅ Copy action increments usage counter
- ✅ Keyboard shortcut works for quick copy
- ✅ Toast notification confirms copy

### Encryption
- ✅ User can enable encryption for sensitive payloads
- ✅ Encrypted payloads are stored encrypted on server
- ✅ User can decrypt payloads with correct passphrase
- ✅ Encryption key never leaves client
- ✅ User is warned about losing passphrase

### Import/Export
- ✅ User can import payloads from JSON file
- ✅ User can export all payloads to JSON file
- ✅ User can export specific category or favorites only
- ✅ Duplicate handling works during import

### Analytics
- ✅ Usage count tracks how often payload is copied
- ✅ User can see most-used payloads

---

## Testing Checklist

### Unit Tests
- [ ] Payload validation (title, content, category)
- [ ] Tag normalization
- [ ] Client-side encryption/decryption logic
- [ ] Usage counter increment

### Integration Tests
- [ ] Create payload (plain and encrypted)
- [ ] Update payload fields
- [ ] Delete payload
- [ ] Copy payload (increment usage)
- [ ] Import payloads from JSON
- [ ] Export payloads to JSON
- [ ] Search and filter payloads

### Security Tests
- [ ] Unauthorized payload access blocked
- [ ] XSS prevention in payload display
- [ ] Encryption key never sent to server
- [ ] Encrypted payloads cannot be decrypted server-side

### E2E Tests (Playwright)
- [ ] User creates a plain payload
- [ ] User creates an encrypted payload
- [ ] User searches for payload and copies it
- [ ] User favorites a payload
- [ ] User imports payload collection
- [ ] User exports payloads to file

