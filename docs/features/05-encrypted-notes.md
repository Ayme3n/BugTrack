# Encrypted Notes

## Feature Purpose

Client-side encrypted note-taking system for storing highly sensitive information such as credentials, private findings, personal research notes, and confidential data. All encryption happens in the browser using Web Crypto API—the server never sees plain-text content.

## User Stories

- **As a security researcher**, I want to store sensitive credentials discovered during testing without exposing them to the server
- **As a bug hunter**, I want to keep private notes about targets that are never stored in plain text
- **As a pentester**, I want to document sensitive findings before deciding whether to report them
- **As a user**, I want full control over my encryption key so data is truly private
- **As a user**, I want to search my decrypted notes without exposing them to the server

## Database Entities

### Notes Table

```typescript
model Note {
  id                String    @id @default(cuid())
  user_id           String
  title             String    // Plain text (for browsing)
  encrypted_content String    @db.Text // AES-256-GCM encrypted content
  encryption_iv     String    // Initialization vector (base64)
  content_hash      String?   // SHA-256 hash for integrity check
  is_favorite       Boolean   @default(false)
  tags              String[]  // Plain text tags (for filtering)
  color             String?   // UI color coding (hex color)
  last_accessed_at  DateTime?
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt
  
  // Relations
  user              User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id])
  @@index([is_favorite])
  @@index([created_at])
}
```

**Field Definitions**:
- `id`: Unique identifier
- `user_id`: Owner of this note
- `title`: Plain-text note title (searchable, not encrypted)
- `encrypted_content`: AES-256-GCM encrypted note content (base64)
- `encryption_iv`: Initialization vector for decryption (not secret)
- `content_hash`: SHA-256 hash of plain content (for tamper detection)
- `is_favorite`: User can mark important notes
- `tags`: Plain-text tags for organization (not encrypted for filtering)
- `color`: UI color for visual organization
- `last_accessed_at`: Tracks when note was last viewed
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Design Decision**: Title and tags are plain-text for searchability and organization. Truly sensitive info should be in the encrypted content.

---

## API Endpoints

### Note CRUD

#### GET `/api/notes`
List all notes for authenticated user (encrypted content not returned).

**Query Parameters**:
- `tags`: Filter by tags (comma-separated)
- `is_favorite`: Filter favorites only
- `search`: Search in titles and tags only (content is encrypted)
- `sort`: Sort by field (default: `updated_at`)
- `order`: Sort order (`asc`, `desc`)

**Response** (200):
```json
{
  "notes": [
    {
      "id": "clx...",
      "title": "Acme Corp Admin Credentials",
      "tags": ["credentials", "admin"],
      "is_favorite": true,
      "color": "#ff6b6b",
      "last_accessed_at": "2025-01-26T10:00:00Z",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-20T14:30:00Z"
    }
  ],
  "total": 15
}
```

---

#### GET `/api/notes/:id`
Get single note with encrypted content.

**Response** (200):
```json
{
  "id": "clx...",
  "title": "Acme Corp Admin Credentials",
  "encrypted_content": "base64_encrypted_data_here",
  "encryption_iv": "base64_iv_here",
  "content_hash": "sha256_hash_here",
  "tags": ["credentials", "admin"],
  "is_favorite": true,
  "color": "#ff6b6b",
  "last_accessed_at": "2025-01-26T10:00:00Z",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-20T14:30:00Z"
}
```

**Note**: Client must decrypt `encrypted_content` using user's encryption key and `encryption_iv`.

---

#### POST `/api/notes`
Create a new encrypted note.

**Request Body**:
```json
{
  "title": "Acme Corp Admin Credentials",
  "encrypted_content": "base64_encrypted_data_here",
  "encryption_iv": "base64_iv_here",
  "content_hash": "sha256_hash_of_plaintext",
  "tags": ["credentials", "admin"],
  "color": "#ff6b6b"
}
```

**Response** (201):
```json
{
  "note": {
    "id": "clx...",
    "title": "Acme Corp Admin Credentials",
    ...
  },
  "message": "Note created successfully"
}
```

---

#### PATCH `/api/notes/:id`
Update existing note.

**Request Body** (partial update):
```json
{
  "title": "Updated Title",
  "encrypted_content": "new_base64_encrypted_data",
  "encryption_iv": "new_base64_iv",
  "content_hash": "new_sha256_hash",
  "tags": ["credentials", "admin", "important"]
}
```

**Response** (200):
```json
{
  "note": {
    "id": "clx...",
    ...
  },
  "message": "Note updated successfully"
}
```

---

#### DELETE `/api/notes/:id`
Delete a note permanently.

**Response** (200):
```json
{
  "message": "Note deleted successfully"
}
```

---

### Note Actions

#### POST `/api/notes/:id/favorite`
Toggle favorite status.

**Response** (200):
```json
{
  "is_favorite": true
}
```

---

#### POST `/api/notes/:id/access`
Update last_accessed_at timestamp (called when user views note).

**Response** (200):
```json
{
  "last_accessed_at": "2025-01-27T10:00:00Z"
}
```

---

## UI/UX Wireframes

### Notes List Page (`/notes`)

**Layout**:

**Header**:
- Page title "Encrypted Notes"
- "New Note" button
- Search bar (searches titles and tags only)
- "Favorites Only" toggle
- Tag filter (multi-select)
- Sort dropdown (Created, Updated, Accessed, Alphabetical)

**Main Content**:

**Sidebar** (left, collapsible):
- All Notes
- Favorites
- Tag list with counts
  - credentials (5)
  - research (8)
  - admin (3)
  - etc.

**Notes Grid** (masonry or card layout):
Each card shows:
- Title (bold)
- Preview: "🔒 Encrypted" (content never shown in list)
- Tags (pills)
- Favorite star (clickable)
- Color indicator (left border)
- Last accessed timestamp
- Click to open

**Empty State**:
- Icon + "No encrypted notes yet"
- "Create your first note" button
- Brief explanation of encryption

---

### Note View/Edit Page (`/notes/:id`)

**First-Time Flow** (if encryption key not set):
1. **Encryption Setup Modal**:
   - "Set Up Encryption"
   - Explanation: "Your notes are encrypted client-side. Set a passphrase or let us generate a key."
   - Option 1: "Use my account password" (derive key from login password)
   - Option 2: "Set a separate passphrase" (input field)
   - Option 3: "Generate random key" (store in browser, downloadable)
   - Warning: "If you lose your passphrase/key, your notes CANNOT be recovered."
   - "Continue" button

**Note View/Edit Interface**:

**Header**:
- Back button to notes list
- Title input (editable, plain text)
- Favorite star
- Color picker dropdown
- "Delete" button
- Lock icon indicator (always encrypted)

**Main Content**:
- **Content Editor** (markdown editor):
  - Decrypted content shown after entering passphrase
  - Toolbar: Bold, Italic, Code, Link, etc.
  - Auto-save (encrypts and saves every 2 seconds)
  - Word count
  
**Sidebar**:
- **Tags** (editable, plain text)
- **Metadata**:
  - Created: [date]
  - Last updated: [date]
  - Last accessed: [date]

**Security Indicator** (bottom bar):
- "🔒 This note is encrypted end-to-end"
- "Your encryption key never leaves this device"

---

### Unlock Flow

**If user navigates to note without encryption key in session**:

**Unlock Modal**:
- "Unlock Encrypted Notes"
- Passphrase input (or prompt to load key)
- "Remember for this session" checkbox
- "Unlock" button
- "Forgot passphrase?" link (shows warning)

**After unlock**:
- Key stored in memory for session
- All notes can be decrypted
- Auto-lock after 15 minutes of inactivity (configurable)

---

### Encryption Key Management (`/settings/encryption`)

**Key Management Page**:
1. **Current Key Status**:
   - "Encryption key set: ✓"
   - "Key type: Passphrase-derived"
   - "Last unlocked: 5 minutes ago"

2. **Change Passphrase**:
   - Current passphrase input
   - New passphrase input
   - Confirm new passphrase
   - "Change Passphrase" button
   - Warning: "This will re-encrypt all notes"

3. **Export/Backup Key**:
   - "Download Encryption Key" button
   - Warning: "Store this safely; it's your only backup"

4. **Import Key**:
   - File upload or paste text
   - "Import Key" button

5. **Reset Encryption** (danger zone):
   - Warning: "This will DELETE all encrypted notes"
   - Confirmation checkbox
   - "Reset Encryption" button

---

## Client-Side Encryption Implementation

### Key Derivation

**From Passphrase** (PBKDF2):
```typescript
const keyMaterial = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(userPassphrase),
  "PBKDF2",
  false,
  ["deriveBits", "deriveKey"]
);

const encryptionKey = await crypto.subtle.deriveKey(
  {
    name: "PBKDF2",
    salt: userSalt, // Stored server-side, unique per user
    iterations: 310000, // OWASP recommendation (2023)
    hash: "SHA-256"
  },
  keyMaterial,
  { name: "AES-GCM", length: 256 },
  true, // Extractable (for export)
  ["encrypt", "decrypt"]
);
```

**From Random Key**:
```typescript
const encryptionKey = await crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  true, // Extractable
  ["encrypt", "decrypt"]
);

// Export for user to download
const exported = await crypto.subtle.exportKey("jwk", encryptionKey);
```

---

### Encryption

```typescript
async function encryptNote(plainContent: string, key: CryptoKey): Promise<{
  encrypted: string;
  iv: string;
  hash: string;
}> {
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM
  
  // Encrypt content
  const encoded = new TextEncoder().encode(plainContent);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  
  // Hash for integrity
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hash = bufferToBase64(hashBuffer);
  
  return {
    encrypted: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
    hash
  };
}
```

---

### Decryption

```typescript
async function decryptNote(
  encryptedContent: string,
  iv: string,
  expectedHash: string,
  key: CryptoKey
): Promise<string> {
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBuffer(iv) },
    key,
    base64ToBuffer(encryptedContent)
  );
  
  const plaintext = new TextDecoder().decode(decrypted);
  
  // Verify integrity
  const actualHash = bufferToBase64(
    await crypto.subtle.digest("SHA-256", decrypted)
  );
  
  if (actualHash !== expectedHash) {
    throw new Error("Content integrity check failed");
  }
  
  return plaintext;
}
```

---

### Key Storage in Browser

**Session Storage** (clears on tab close):
```typescript
// Store key for session
sessionStorage.setItem("bugtrack_encryption_key", await exportKey(key));

// Retrieve key
const key = await importKey(sessionStorage.getItem("bugtrack_encryption_key"));
```

**Local Storage** (persists, optional):
- User can enable "Remember encryption key"
- Still secure if device is trusted
- Clear on logout

---

## Security Considerations

### Encryption
- **Algorithm**: AES-256-GCM (authenticated encryption, prevents tampering)
- **Key Derivation**: PBKDF2 with 310,000 iterations (OWASP 2023 recommendation)
- **IV**: Random 96-bit IV per encryption (never reuse)
- **Integrity**: SHA-256 hash of plaintext stored for tamper detection

### Key Management
- **Zero-Knowledge**: Server never sees encryption key or decrypted content
- **User Responsibility**: User must remember passphrase; recovery impossible
- **Session Security**: Key in memory cleared on logout/timeout
- **Export**: User can export key for backup (encrypted file recommended)

### Client-Side Security
- **No Logging**: Never log plaintext content or encryption keys
- **Memory Cleanup**: Clear keys from memory when not needed
- **Auto-Lock**: Lock notes after inactivity period
- **HTTPS Only**: Enforce HTTPS to prevent MITM

### Authorization
- Users can only access their own notes
- Verify `note.user_id === session.user.id` on all operations
- Even if attacker gets encrypted content, it's useless without key

### Input Validation
- **Title**: Max 200 characters (plain text, sanitize)
- **Content**: Max 1MB encrypted (prevent abuse)
- **Tags**: Max 20 tags, max 50 chars each
- **Color**: Valid hex color code

### Rate Limiting
- Max 500 notes per user
- Max 100 note operations per minute (prevent brute force)

---

## Acceptance Criteria

### Encryption Setup
- ✅ User can set up encryption with passphrase or random key
- ✅ User is warned about passphrase loss consequences
- ✅ User can choose to remember key for session or persist

### Note Management
- ✅ User can create an encrypted note
- ✅ User can edit note content (decrypted in editor)
- ✅ User can delete a note
- ✅ User can view all notes (titles visible, content encrypted)

### Encryption/Decryption
- ✅ Notes are encrypted client-side before sending to server
- ✅ Notes are decrypted client-side when viewing
- ✅ Encryption key never leaves client
- ✅ Integrity check detects tampered content

### Search & Organization
- ✅ User can search notes by title and tags (not content)
- ✅ User can filter by tags
- ✅ User can mark notes as favorite
- ✅ User can color-code notes

### Key Management
- ✅ User can change encryption passphrase (re-encrypts all notes)
- ✅ User can export encryption key for backup
- ✅ User can import encryption key from backup
- ✅ User can reset encryption (deletes all notes with confirmation)

### Auto-Lock
- ✅ Notes auto-lock after 15 minutes of inactivity
- ✅ User must re-enter passphrase to unlock
- ✅ "Remember for session" option works correctly

---

## Testing Checklist

### Unit Tests
- [ ] Key derivation from passphrase (PBKDF2)
- [ ] AES-GCM encryption/decryption
- [ ] Integrity hash generation and verification
- [ ] Key export/import
- [ ] Auto-lock timer

### Integration Tests
- [ ] Create encrypted note (full flow)
- [ ] Edit and re-encrypt note
- [ ] Delete note
- [ ] Change passphrase (re-encrypt all)
- [ ] Export and import key

### Security Tests
- [ ] Server never receives plaintext content
- [ ] Server never receives encryption key
- [ ] Tampered content detected via hash
- [ ] Unauthorized note access blocked
- [ ] XSS prevention in note content

### E2E Tests (Playwright)
- [ ] User sets up encryption
- [ ] User creates encrypted note
- [ ] User views and edits note (decrypts correctly)
- [ ] User locks and unlocks notes
- [ ] User changes encryption passphrase
- [ ] User exports key and re-imports it

