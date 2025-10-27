# Authentication & User Profile

## Feature Purpose

Secure user authentication system with email/password registration, optional two-factor authentication (2FA), and user profile management. This is the foundation for all personalized features in BugTrack.

## User Stories

- **As a security researcher**, I want to register an account so I can store my targets and findings securely
- **As a user**, I want to enable 2FA so my sensitive research data is protected
- **As a user**, I want to reset my password if I forget it
- **As a user**, I want to customize my profile with a name and avatar
- **As a user**, I want my session to persist so I don't have to login repeatedly

## Database Entities

### Users Table

```typescript
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  password_hash   String
  name            String?
  avatar_url      String?
  two_fa_secret   String?   // Encrypted TOTP secret
  two_fa_enabled  Boolean   @default(false)
  email_verified  Boolean   @default(false)
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  last_login_at   DateTime?
  
  // Relations
  targets         Target[]
  findings        Finding[]
  payloads        Payload[]
  notes           Note[]
  tool_jobs       ToolJob[]
}
```

**Field Definitions**:
- `id`: Unique identifier (CUID for distributed systems)
- `email`: User email address (unique, used for login)
- `password_hash`: bcrypt hashed password (never store plain text)
- `name`: Display name (optional, defaults to email prefix)
- `avatar_url`: Profile picture URL (stored in Supabase Storage/S3)
- `two_fa_secret`: Encrypted TOTP secret for 2FA (using app encryption key)
- `two_fa_enabled`: Whether user has activated 2FA
- `email_verified`: Email verification status (future feature)
- `created_at`: Account creation timestamp
- `updated_at`: Last profile update timestamp
- `last_login_at`: Last successful login timestamp

**Indexes**:
```sql
CREATE UNIQUE INDEX users_email_idx ON users(email);
CREATE INDEX users_created_at_idx ON users(created_at DESC);
```

## API Endpoints

### Authentication Routes

#### POST `/api/auth/register`
Register a new user account.

**Request Body**:
```json
{
  "email": "researcher@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response** (201):
```json
{
  "user": {
    "id": "clx...",
    "email": "researcher@example.com",
    "name": "John Doe",
    "avatar_url": null
  },
  "message": "Account created successfully"
}
```

**Validations**:
- Email: Valid format, not already registered
- Password: Minimum 8 characters, includes uppercase, lowercase, number, special char
- Name: Optional, max 100 characters

---

#### POST `/api/auth/login`
Authenticate user and create session.

**Request Body**:
```json
{
  "email": "researcher@example.com",
  "password": "SecurePass123!",
  "two_fa_code": "123456" // Optional, required if 2FA enabled
}
```

**Response** (200):
```json
{
  "user": {
    "id": "clx...",
    "email": "researcher@example.com",
    "name": "John Doe",
    "two_fa_enabled": true
  },
  "session": {
    "expires_at": "2025-11-27T12:00:00Z"
  }
}
```

**Error** (401 if 2FA required but not provided):
```json
{
  "error": "2FA_REQUIRED",
  "message": "Two-factor authentication code required"
}
```

---

#### POST `/api/auth/logout`
Destroy user session.

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

---

#### POST `/api/auth/forgot-password`
Initiate password reset flow.

**Request Body**:
```json
{
  "email": "researcher@example.com"
}
```

**Response** (200):
```json
{
  "message": "Password reset email sent (if account exists)"
}
```

---

#### POST `/api/auth/reset-password`
Complete password reset with token.

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "new_password": "NewSecurePass123!"
}
```

**Response** (200):
```json
{
  "message": "Password reset successful"
}
```

---

### User Profile Routes

#### GET `/api/user/profile`
Get current user profile.

**Response** (200):
```json
{
  "id": "clx...",
  "email": "researcher@example.com",
  "name": "John Doe",
  "avatar_url": "https://storage.../avatar.jpg",
  "two_fa_enabled": true,
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

#### PATCH `/api/user/profile`
Update user profile information.

**Request Body**:
```json
{
  "name": "John Smith",
  "avatar_url": "https://storage.../new-avatar.jpg"
}
```

**Response** (200):
```json
{
  "user": {
    "id": "clx...",
    "email": "researcher@example.com",
    "name": "John Smith",
    "avatar_url": "https://storage.../new-avatar.jpg"
  },
  "message": "Profile updated successfully"
}
```

---

### Two-Factor Authentication Routes

#### POST `/api/user/2fa/setup`
Generate 2FA secret and QR code.

**Response** (200):
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code_url": "otpauth://totp/BugTrack:user@example.com?secret=...",
  "backup_codes": ["12345678", "87654321", ...]
}
```

---

#### POST `/api/user/2fa/verify`
Verify and enable 2FA with code.

**Request Body**:
```json
{
  "code": "123456"
}
```

**Response** (200):
```json
{
  "message": "2FA enabled successfully",
  "backup_codes": ["12345678", "87654321", ...]
}
```

---

#### DELETE `/api/user/2fa/disable`
Disable 2FA for account.

**Request Body**:
```json
{
  "password": "CurrentPassword123!",
  "code": "123456"
}
```

**Response** (200):
```json
{
  "message": "2FA disabled successfully"
}
```

---

## UI/UX Wireframes

### Registration Page (`/register`)
- Email input (validated in real-time)
- Password input with strength indicator
- Confirm password input
- Optional name input
- "Create Account" button
- Link to login page
- Terms of service checkbox

### Login Page (`/login`)
- Email input
- Password input
- "Remember me" checkbox
- "Login" button
- Link to "Forgot password?"
- Link to "Create account"
- 2FA code input (shown if required after initial submission)

### Profile Settings Page (`/settings/profile`)
- Avatar upload/change (with preview)
- Name input field
- Email (read-only, display only)
- Account creation date (display only)
- "Save Changes" button

### 2FA Setup Page (`/settings/security`)
- "Enable Two-Factor Authentication" section
  - QR code display
  - Manual secret key (for manual entry)
  - Verification code input
  - "Verify and Enable" button
- "Disable 2FA" section (if enabled)
  - Current password input
  - 2FA code input
  - "Disable 2FA" button
  - Warning message
- Backup codes display (after setup)
  - List of 10 backup codes
  - "Download" and "Copy" buttons

### Password Reset Flow
1. **Forgot Password Page** (`/forgot-password`)
   - Email input
   - "Send Reset Link" button
   - Confirmation message after submission

2. **Reset Password Page** (`/reset-password?token=...`)
   - New password input with strength indicator
   - Confirm new password input
   - "Reset Password" button
   - Success message with "Go to Login" link

---

## Security Considerations

### Password Security
- **Hashing**: Use bcrypt with salt rounds >= 12
- **Validation**: Enforce strong password policy (min 8 chars, mixed case, numbers, special chars)
- **Storage**: Never log or store plain-text passwords
- **Reset Tokens**: Generate cryptographically secure tokens, expire after 1 hour, single-use only

### Session Management
- **Storage**: HTTP-only, Secure, SameSite=Strict cookies
- **Expiration**: Default 7 days, extend on activity
- **Invalidation**: Clear on logout, password change, or 2FA disable
- **CSRF Protection**: Use Next.js built-in CSRF tokens

### Two-Factor Authentication
- **Algorithm**: TOTP (RFC 6238) with 30-second time step
- **Secret Storage**: Encrypt 2FA secrets at rest using app encryption key
- **Backup Codes**: Generate 10 single-use codes, bcrypt hashed
- **Rate Limiting**: Max 5 2FA attempts per minute

### Rate Limiting
- **Login**: Max 5 failed attempts per IP per 15 minutes
- **Registration**: Max 3 accounts per IP per hour
- **Password Reset**: Max 3 requests per email per hour

### Input Validation
- **Email**: Validate format, normalize (lowercase, trim)
- **Password**: Check against common password lists (HaveIBeenPwned API optional)
- **Name**: Sanitize HTML, max 100 characters
- **Avatar URLs**: Validate file type (JPEG, PNG, WebP), max 5MB

### Audit Logging
Log security-relevant events:
- Registration attempts (success/failure)
- Login attempts (success/failure, IP, user agent)
- Password changes
- 2FA enable/disable
- Password reset requests

---

## Acceptance Criteria

### Registration
- ✅ User can register with email and password
- ✅ Duplicate email addresses are rejected
- ✅ Weak passwords are rejected with helpful error messages
- ✅ User is automatically logged in after registration
- ✅ Welcome email is sent (optional for MVP)

### Login
- ✅ User can login with correct credentials
- ✅ Invalid credentials show generic error (don't reveal if email exists)
- ✅ Session persists across browser restarts (if "remember me" checked)
- ✅ 2FA code is required if enabled
- ✅ Last login timestamp is updated

### Password Reset
- ✅ Reset email is sent to valid addresses
- ✅ Invalid/expired tokens are rejected
- ✅ Password is successfully changed with valid token
- ✅ All existing sessions are invalidated after reset
- ✅ User can login with new password

### Two-Factor Authentication
- ✅ User can enable 2FA by scanning QR code
- ✅ Backup codes are generated and displayed once
- ✅ 2FA code is required on login after enabling
- ✅ Backup codes work as alternative to 2FA code
- ✅ User can disable 2FA with password + current code

### Profile Management
- ✅ User can update display name
- ✅ User can upload/change avatar
- ✅ Profile changes are reflected immediately
- ✅ Invalid image files are rejected

### Security
- ✅ All passwords are bcrypt hashed
- ✅ Sessions are HTTP-only secure cookies
- ✅ Rate limiting prevents brute force attacks
- ✅ CSRF protection is enabled
- ✅ Sensitive operations require re-authentication

---

## Testing Checklist

### Unit Tests
- [ ] Password hashing and verification
- [ ] Email validation
- [ ] 2FA secret generation and verification
- [ ] Session token generation and validation
- [ ] Password reset token generation and expiry

### Integration Tests
- [ ] Complete registration flow
- [ ] Login with and without 2FA
- [ ] Password reset end-to-end
- [ ] Profile update operations
- [ ] Session persistence and expiration

### Security Tests
- [ ] SQL injection in login form
- [ ] XSS in name field
- [ ] CSRF token validation
- [ ] Rate limiting enforcement
- [ ] Session hijacking prevention
- [ ] 2FA bypass attempts

### E2E Tests (Playwright)
- [ ] New user registers and logs in
- [ ] User enables 2FA and logs in with code
- [ ] User resets password and logs in
- [ ] User updates profile information
- [ ] User logs out and session is destroyed

