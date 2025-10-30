# Notification System

## Overview

The Notification System provides real-time alerts to users about important events, achievements, and updates in BugTrack. It features a bell icon with badge counter, dropdown UI, and automatic milestone tracking.

---

## Features

### ✅ Implemented

1. **Notification Bell Icon**
   - Always visible in dashboard header
   - Red badge showing unread count (1-9, or "9+" for more)
   - Click to open dropdown

2. **Notification Dropdown**
   - Beautiful modal with scrollable list
   - Color-coded by type (findings, targets, payloads, etc.)
   - Relative timestamps ("2 minutes ago")
   - Unread/read status indicators
   - Click notification to navigate to related resource

3. **Notification Types**
   - `FINDING_CREATED` 🔍 - New vulnerability documented
   - `FINDING_UPDATED` 📝 - Finding status changed
   - `TARGET_ADDED` 🎯 - New target added
   - `PAYLOAD_USED` 💉 - Payload copied to clipboard
   - `ACHIEVEMENT` 🏆 - Milestone reached
   - `SYSTEM` 🔔 - System announcements
   - `REMINDER` ⏰ - User reminders

4. **Real-time Updates**
   - Auto-refresh every 30 seconds
   - Instant updates when dropdown opens
   - Badge updates automatically

5. **Mark as Read**
   - Click notification to mark as read
   - "Mark all read" button in header
   - Visual distinction between read/unread

6. **Achievement System**
   - First target added (1st)
   - Target master (10th)
   - First finding (1st)
   - Bug hunter (10th)
   - Master bug hunter (50th)
   - First payload (1st)
   - First encrypted note (1st)

---

## Technical Implementation

### Database Schema

**Table**: `notifications`

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type "NotificationType" NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  icon TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_notifications_user_id` - User lookup
- `idx_notifications_is_read` - Filter by read status
- `idx_notifications_created_at` - Sort by date
- `idx_notifications_user_unread` - Composite index for unread queries

### API Endpoints

**1. GET /api/notifications**
- Get all notifications for authenticated user
- Query params:
  - `unread_only`: boolean - Only unread notifications
  - `limit`: number - Max results (default: 20)
- Returns: `{ notifications: [], unreadCount: number }`

**2. POST /api/notifications**
- Create a new notification
- Body: `{ type, title, message, link_url?, icon?, metadata? }`
- Returns: `{ notification: {...} }`

**3. PATCH /api/notifications/[id]**
- Mark notification as read/unread
- Body: `{ is_read: boolean }`
- Returns: `{ notification: {...} }`

**4. DELETE /api/notifications/[id]**
- Delete a notification
- Returns: `{ success: true }`

**5. POST /api/notifications/mark-all-read**
- Mark all user's notifications as read
- Returns: `{ success: true }`

### Components

**NotificationDropdown** (`components/ui/NotificationDropdown.tsx`)
- Client component with state management
- Auto-refresh every 30 seconds
- Click-outside-to-close functionality
- Keyboard-accessible

**DashboardHeader** (updated)
- Integrated NotificationDropdown
- Replaces placeholder bell icon

### Helper Functions

**Location**: `lib/notifications/helpers.ts`

```typescript
// Create notifications
createNotification(params)
notifyFindingCreated(userId, title, id, severity)
notifyFindingUpdated(userId, title, id, status)
notifyTargetAdded(userId, name, id)
notifyPayloadUsed(userId, title, id)
notifyAchievement(userId, title, message)
notifySystem(userId, title, message, linkUrl?)
notifyReminder(userId, title, message, linkUrl?)

// Check milestones
checkAndNotifyMilestones(userId, counts)
```

---

## Setup Instructions

### 1. Run SQL Setup Script

Execute the SQL script in Supabase SQL Editor:

```bash
# File: supabase-notifications-setup.sql
```

This creates:
- `NotificationType` enum
- `notifications` table
- Indexes for performance
- RLS policies for security
- Helper functions (`create_notification`, `mark_all_notifications_read`, `cleanup_old_notifications`)

### 2. Verify Setup

```sql
-- Check table
SELECT * FROM notifications LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

### 3. Test Notification Creation

```sql
SELECT create_notification(
  auth.uid(),
  'SYSTEM',
  'Welcome to BugTrack!',
  'Start by adding your first target.',
  '/dashboard/targets/new',
  '🎯'
);
```

---

## Usage Examples

### Creating Notifications in Code

**Example 1: Notify when finding is created**

```typescript
import { notifyFindingCreated } from '@/lib/notifications/helpers';

// In your finding creation handler
const { data: finding } = await supabase.from('findings').insert({...});

// Create notification
await notifyFindingCreated(
  user.id,
  finding.title,
  finding.id,
  finding.severity
);
```

**Example 2: Notify achievement**

```typescript
import { checkAndNotifyMilestones } from '@/lib/notifications/helpers';

// After creating a finding
const { count } = await supabase
  .from('findings')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id);

await checkAndNotifyMilestones(user.id, { findings: count });
```

**Example 3: System notification**

```typescript
import { notifySystem } from '@/lib/notifications/helpers';

await notifySystem(
  user.id,
  'Maintenance Scheduled',
  'The system will be under maintenance on Sunday at 2 AM UTC.',
  '/dashboard'
);
```

---

## Notification Flow

```
1. Event occurs (e.g., user creates a finding)
   ↓
2. Server/client calls notification helper
   ↓
3. POST /api/notifications
   ↓
4. Notification inserted into database (bypasses RLS for creation)
   ↓
5. User's notification dropdown auto-refreshes (30s interval)
   ↓
6. Badge updates with new unread count
   ↓
7. User clicks notification
   ↓
8. PATCH /api/notifications/[id] (mark as read)
   ↓
9. User navigates to linked resource
```

---

## Security

### Row-Level Security (RLS)

**Enabled**: ✅

**Policies**:
1. **SELECT**: Users can only view their own notifications
   ```sql
   USING (auth.uid()::text = user_id::text)
   ```

2. **UPDATE**: Users can only update their own notifications
   ```sql
   USING (auth.uid()::text = user_id::text)
   ```

3. **DELETE**: Users can only delete their own notifications
   ```sql
   USING (auth.uid()::text = user_id::text)
   ```

4. **INSERT**: System can create notifications (service role)
   ```sql
   WITH CHECK (true)
   ```

### Authorization
- All API endpoints require authentication
- User ID extracted from session token
- All queries scoped to `user_id = auth.uid()`

---

## Performance

### Optimizations

1. **Database Indexes**
   - Composite index on `(user_id, is_read)` for unread queries
   - Index on `created_at DESC` for sorting

2. **Query Limits**
   - Default limit of 20 notifications in dropdown
   - Configurable via query param

3. **Polling Interval**
   - 30-second refresh (not real-time WebSocket)
   - Reduces server load
   - Good UX balance

4. **Badge Caching**
   - Unread count cached in component state
   - Only re-fetches on open or interval

### Database Cleanup

**Automatic Cleanup Function**:
```sql
SELECT cleanup_old_notifications(30); -- Delete read notifications older than 30 days
```

**Recommended**: Run via cron job or scheduled function (weekly)

---

## Customization

### Adding New Notification Types

1. **Update Prisma Schema** (`prisma/schema.prisma`):
   ```prisma
   enum NotificationType {
     // ... existing types
     YOUR_NEW_TYPE
   }
   ```

2. **Update SQL Enum** (in Supabase):
   ```sql
   ALTER TYPE "NotificationType" ADD VALUE 'YOUR_NEW_TYPE';
   ```

3. **Add Helper Function** (`lib/notifications/helpers.ts`):
   ```typescript
   export function notifyYourEvent(userId: string, ...) {
     return createNotification({
       userId,
       type: 'YOUR_NEW_TYPE',
       title: '...',
       message: '...',
       icon: '...',
     });
   }
   ```

4. **Update UI Colors** (`components/ui/NotificationDropdown.tsx`):
   ```typescript
   const getTypeColor = (type: string) => {
     switch (type) {
       // ... existing cases
       case 'YOUR_NEW_TYPE':
         return 'bg-color-100 text-color-600 ...';
     }
   };
   ```

### Changing Polling Interval

In `components/ui/NotificationDropdown.tsx`:
```typescript
// Change from 30000 (30s) to your desired interval
const interval = setInterval(fetchNotifications, 60000); // 60 seconds
```

### Changing Notification Limit

In `components/ui/NotificationDropdown.tsx`:
```typescript
const response = await fetch('/api/notifications?limit=50'); // Change from 20 to 50
```

---

## Future Enhancements

### Planned Features

1. **Real-time Updates (WebSocket)**
   - Use Supabase Realtime subscriptions
   - Instant notifications without polling
   - Better UX and reduced server load

2. **Notification Preferences**
   - User settings to enable/disable notification types
   - Email notifications for important events
   - Digest mode (daily/weekly summary)

3. **Notification Actions**
   - Quick actions in dropdown (approve, dismiss, snooze)
   - Batch operations

4. **Push Notifications**
   - Browser push API
   - PWA support
   - Mobile notifications

5. **Notification History Page**
   - Full-page view at `/dashboard/notifications`
   - Advanced filtering (by type, date, read/unread)
   - Bulk actions

6. **Notification Grouping**
   - Group similar notifications
   - "5 new findings created" instead of 5 separate

7. **Scheduled Notifications**
   - Reminders for follow-ups
   - "Review findings from last week"

8. **Analytics**
   - Track notification open rates
   - Optimize notification types and timing

---

## Troubleshooting

### Issue: Notifications not appearing

**Possible Causes**:
1. SQL script not executed (table doesn't exist)
2. RLS policies blocking queries
3. User not authenticated

**Solution**:
- Verify table exists: `SELECT * FROM notifications;`
- Check RLS: `SELECT * FROM pg_policies WHERE tablename = 'notifications';`
- Verify auth: Check browser console for 401 errors

### Issue: Badge count incorrect

**Possible Causes**:
1. Stale cache
2. Unread notifications not properly marked

**Solution**:
- Refresh the page
- Check database: `SELECT COUNT(*) FROM notifications WHERE user_id = 'xxx' AND is_read = false;`

### Issue: Dropdown not closing

**Possible Causes**:
1. Click-outside handler not working
2. Event propagation issue

**Solution**:
- Click outside the dropdown
- Press ESC (TODO: add ESC handler)
- Refresh the page

---

## Testing

### Manual Testing

1. **Create a notification**:
   ```bash
   # Via Supabase SQL Editor
   SELECT create_notification(
     'your-user-id'::UUID,
     'SYSTEM',
     'Test Notification',
     'This is a test message',
     '/dashboard',
     '🔔'
   );
   ```

2. **Check dropdown**:
   - Should show notification immediately (or within 30s)
   - Badge should show "1"

3. **Mark as read**:
   - Click notification
   - Badge should update to "0"
   - Notification should lose blue highlight

4. **Create multiple**:
   - Create 5+ notifications
   - Verify scrolling works
   - Verify "Mark all read" works

### Automated Tests (Future)

```typescript
describe('Notification System', () => {
  it('should fetch notifications on mount', async () => {
    // Test component fetches notifications
  });

  it('should display unread badge', () => {
    // Test badge shows correct count
  });

  it('should mark notification as read on click', async () => {
    // Test mark-as-read functionality
  });

  it('should navigate to link_url on click', () => {
    // Test navigation
  });
});
```

---

## Success Metrics

### KPIs

- **Engagement Rate**: % of users who open notifications
- **Action Rate**: % of notifications clicked (navigated to resource)
- **Response Time**: Time from creation to first view
- **Unread Accumulation**: Average unread notifications per user

### Goals

- 70%+ of users engage with notifications weekly
- 50%+ of notifications result in navigation
- <1 minute average response time for critical notifications
- <10 average unread notifications per user

---

## Conclusion

The Notification System enhances user engagement by keeping users informed of important events, achievements, and updates. It's fully implemented with a clean UI, robust backend, and extensible architecture.

**Status**: ✅ MVP Complete

**Next Steps**:
1. Run the SQL setup script in Supabase
2. Integrate notification helpers into existing features (optional)
3. Monitor usage and engagement
4. Add real-time WebSocket updates (Phase 2)

---

## Quick Reference

### Create a Notification

```typescript
import { createNotification } from '@/lib/notifications/helpers';

await createNotification({
  userId: user.id,
  type: 'SYSTEM',
  title: 'Hello!',
  message: 'This is a notification',
  linkUrl: '/dashboard',
  icon: '👋',
});
```

### Check for Milestones

```typescript
import { checkAndNotifyMilestones } from '@/lib/notifications/helpers';

await checkAndNotifyMilestones(user.id, {
  targets: 10,
  findings: 50,
});
```

### Mark All as Read

```typescript
await fetch('/api/notifications/mark-all-read', { method: 'POST' });
```

---

**Built with ❤️ for security researchers**

